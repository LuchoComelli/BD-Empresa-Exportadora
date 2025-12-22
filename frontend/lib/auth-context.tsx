"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { useRouter, usePathname } from "next/navigation"
import api from "./api"

interface User {
  id: number
  email: string
  username?: string
  first_name?: string
  last_name?: string
  type: "admin" | "empresa" | "staff"
  status?: "activa" | "pendiente" | "rechazada"
  is_superuser?: boolean
  is_staff?: boolean
  debe_cambiar_password?: boolean
  rol?: {
    id: number
    nombre: string
    nivel_acceso?: number
  }
  empresaData?: any
}

interface AuthContextType {
  user: User | null
  login: (email: string, password: string) => Promise<boolean>
  logout: () => void
  refreshUser: () => Promise<void>
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [lastActivity, setLastActivity] = useState<number>(Date.now())
  const router = useRouter()
  const pathname = usePathname()

  // Tiempos de inactividad (en milisegundos)
  const INACTIVITY_TIMEOUT = 3 * 60 * 60 * 1000 // 3 horas (entre 2-4 horas como solicitado)

  // Renovar access token automáticamente al volver al sitio
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible' && user) {
        // Usuario volvió al sitio, intentar renovar access token
        try {
          await api.refreshToken()
          setLastActivity(Date.now())
        } catch (error) {
          // Si falla, el refresh token expiró, hacer logout
          console.log('[Auth] Refresh token expirado al volver al sitio')
          logout()
        }
      }
    }

    const handleFocus = async () => {
      if (user) {
        // Usuario volvió a la pestaña, renovar access token
        try {
          await api.refreshToken()
          setLastActivity(Date.now())
        } catch (error) {
          console.log('[Auth] Refresh token expirado al volver a la pestaña')
          logout()
        }
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('focus', handleFocus)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('focus', handleFocus)
    }
  }, [user])

  // Detectar inactividad y cerrar sesión automáticamente
  useEffect(() => {
    if (!user) return

    const updateActivity = () => {
      setLastActivity(Date.now())
    }

    // Eventos que indican actividad del usuario
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click']
    events.forEach(event => {
      window.addEventListener(event, updateActivity, { passive: true })
    })

    // Verificar inactividad cada minuto
    const inactivityCheck = setInterval(() => {
      const timeSinceLastActivity = Date.now() - lastActivity
      if (timeSinceLastActivity >= INACTIVITY_TIMEOUT) {
        console.log('[Auth] Sesión cerrada por inactividad')
        logout()
      }
    }, 60 * 1000) // Verificar cada minuto

    return () => {
      events.forEach(event => {
        window.removeEventListener(event, updateActivity)
      })
      clearInterval(inactivityCheck)
    }
  }, [user, lastActivity])

  // Verificar si hay un token y cargar usuario (renovar si es necesario)
  useEffect(() => {
    const loadUser = async () => {
      try {
        // Intentar renovar access token primero si hay refresh token válido
        try {
          await api.refreshToken()
        } catch (error) {
          // Si no hay refresh token válido, continuar sin renovar
        }

        // Intentar obtener usuario (el token puede estar en memoria o cookie)
        const userData = await api.getCurrentUser()
        
        
        // Determinar tipo de usuario basado en el rol y permisos
        let userType: "admin" | "empresa" | "staff" = "empresa"
        
        // Superusuarios siempre son admin
        // Verificar is_superuser de diferentes formas (boolean, número, string)
        const isSuperuser = userData.is_superuser === true || 
                           userData.is_superuser === 1 || 
                           userData.is_superuser === "true" ||
                           String(userData.is_superuser).toLowerCase() === "true"
        
        if (isSuperuser) {
          userType = "admin"
        } else {
          // Verificar tanto rol_detalle como rol (por si viene en diferentes formatos)
          const rolNombre = userData.rol_detalle?.nombre || userData.rol?.nombre || ""
          if (rolNombre) {
            const rolNombreLower = rolNombre.toLowerCase()
            if (rolNombreLower.includes("admin") || rolNombreLower.includes("administrador")) {
              userType = "admin"
            } else if (rolNombreLower.includes("analista") || rolNombreLower.includes("consulta") || rolNombreLower.includes("consultor")) {
              userType = "staff"
            }
          }
        }
        
        // Normalizar el rol: el backend puede devolver 'rol' o 'rol_detalle'
        let rolNormalizado = userData.rol_detalle || userData.rol
        // Si el rol viene como objeto plano, asegurarnos de que tenga la estructura correcta
        if (rolNormalizado && typeof rolNormalizado === 'object' && rolNormalizado.nombre) {
          // Ya tiene la estructura correcta
        } else if (userData.rol && typeof userData.rol === 'object' && userData.rol.nombre) {
          rolNormalizado = userData.rol
        }
        
        const user: User = {
          id: userData.id,
          email: userData.email,
          username: userData.username || userData.email,
          first_name: userData.first_name || userData.nombre,
          last_name: userData.last_name || userData.apellido,
          type: userType,
          is_superuser: userData.is_superuser,
          is_staff: userData.is_staff,
          debe_cambiar_password: userData.debe_cambiar_password || false,
          rol: rolNormalizado,
          empresaData: userData.empresa,
        }
        setUser(user)
        setLastActivity(Date.now()) // Actualizar actividad al cargar usuario
      } catch (error: any) {
        // Si no hay token o la sesión expiró, simplemente no cargar usuario
        // Esto es normal cuando el usuario no está autenticado
        const errorMessage = error?.message || String(error)
        const isNoAuthError = error?.noAuth || 
                              error?.silent ||
                              error?.status === 401 ||
                              errorMessage.includes('No hay sesión activa') ||
                              errorMessage.includes('credenciales') || 
                              errorMessage.includes('autenticación') || 
                              errorMessage.includes('401') ||
                              errorMessage.includes('Sesión expirada')
        
        if (isNoAuthError) {
          // No hacer nada, simplemente no cargar usuario
          // No mostrar logs ni errores, es el comportamiento esperado
          // No llamar a api.logout() porque puede causar problemas si no hay cookies
        } else {
          console.error("Error loading user:", error)
        }
      } finally {
        setIsLoading(false)
      }
    }

    loadUser()
  }, [])

  useEffect(() => {
    if (!isLoading) {
      // Si no hay usuario, redirigir al login (excepto rutas públicas)
      if (!user) {
        const publicRoutes = ["/", "/login", "/registro", "/recuperar-contrasena"]
        if (!publicRoutes.includes(pathname)) {
          router.push("/login")
        }
      }
      // Si el usuario es empresa y debe cambiar la contraseña, asegurarse de que esté en /perfil-empresa
      else if (user.type === "empresa" && user.debe_cambiar_password) {
        // Si no está en /perfil-empresa, redirigir allí (el modal aparecerá automáticamente)
        if (pathname !== "/perfil-empresa" && !pathname.startsWith("/login")) {
          router.push("/perfil-empresa")
        }
      }
    }
  }, [user, isLoading, pathname, router])

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      // Intentar login con la API (ahora retorna datos del usuario también)
      const loginResponse = await api.login(email, password)
      
      // Obtener información del usuario (puede venir en la respuesta del login o hacer petición separada)
      let userData
      if (loginResponse.user) {
        userData = loginResponse.user
      } else {
        userData = await api.getCurrentUser()
      }
      
      
      // Determinar tipo de usuario basado en el rol y permisos
      let userType: "admin" | "empresa" | "staff" = "empresa"
      
      // Superusuarios siempre son admin
      // Verificar is_superuser de diferentes formas (boolean, número, string)
      const isSuperuser = userData.is_superuser === true || 
                         userData.is_superuser === 1 || 
                         userData.is_superuser === "true" ||
                         String(userData.is_superuser).toLowerCase() === "true"
      
      if (isSuperuser) {
        userType = "admin"
      }
      // Si tiene rol de Administrador, Analista o Consultor, puede acceder al dashboard
      // Verificar tanto rol_detalle como rol (por si viene en diferentes formatos)
      const rolNombre = userData.rol_detalle?.nombre || userData.rol?.nombre || ""
      if (rolNombre) {
        const rolNombreLower = rolNombre.toLowerCase()
        if (rolNombreLower.includes("admin") || rolNombreLower.includes("administrador")) {
          userType = "admin"
        } else if (rolNombreLower.includes("analista") || rolNombreLower.includes("consulta") || rolNombreLower.includes("consultor")) {
          userType = "staff"
        }
      }
      
      // Normalizar el rol: el backend puede devolver 'rol' o 'rol_detalle'
      // Asegurarnos de que siempre tengamos un objeto con 'nombre'
      let rolNormalizado = userData.rol_detalle || userData.rol
      // Si el rol viene como objeto plano del login, asegurarnos de que tenga la estructura correcta
      if (rolNormalizado && typeof rolNormalizado === 'object' && rolNormalizado.nombre) {
        // Ya tiene la estructura correcta
      } else if (userData.rol && typeof userData.rol === 'object' && userData.rol.nombre) {
        rolNormalizado = userData.rol
      }
      
      const loggedUser: User = {
        id: userData.id,
        email: userData.email,
        username: userData.username || userData.email,
        first_name: userData.first_name || userData.nombre,
        last_name: userData.last_name || userData.apellido,
        type: userType,
        is_superuser: userData.is_superuser,
        is_staff: userData.is_staff,
        debe_cambiar_password: userData.debe_cambiar_password || false,
        rol: rolNormalizado,
        empresaData: userData.empresa,
      }
      
      setUser(loggedUser)
      setLastActivity(Date.now()) // Actualizar actividad al hacer login
      
      // Verificar si es empresa y debe cambiar la contraseña
      // Solo empresas deben cambiar la contraseña, no admin/analista/consultor
      if (userType === "empresa" && userData.debe_cambiar_password) {
        // Redirigir a perfil-empresa donde aparecerá el modal
        // Usar setTimeout para asegurar que el estado se actualice antes de redirigir
        setTimeout(() => {
          router.push("/perfil-empresa")
        }, 0)
        return true
      }
      
      // Redirigir según el tipo de usuario
      // Usar setTimeout para asegurar que el estado se actualice antes de redirigir
      setTimeout(() => {
        if (userType === "admin" || userType === "staff") {
          router.push("/dashboard")
        } else {
          router.push("/perfil-empresa")
        }
      }, 0)
      
      return true
    } catch (error: any) {
      console.error("Login error:", error)
      // No mostrar alert aquí, dejar que el componente maneje el error
      throw error
    }
  }

  const logout = () => {
    api.logout()
    setUser(null)
    setLastActivity(Date.now())
    router.push("/login")
  }

  const refreshUser = async () => {
    try {
      const userData = await api.getCurrentUser()
      
      // Determinar tipo de usuario basado en el rol y permisos
      let userType: "admin" | "empresa" | "staff" = "empresa"
      
      const isSuperuser = userData.is_superuser === true || 
                         userData.is_superuser === 1 || 
                         userData.is_superuser === "true" ||
                         String(userData.is_superuser).toLowerCase() === "true"
      
      if (isSuperuser) {
        userType = "admin"
      } else {
        // Verificar tanto rol_detalle como rol (por si viene en diferentes formatos)
        const rolNombre = userData.rol_detalle?.nombre || userData.rol?.nombre || ""
        if (rolNombre) {
          const rolNombreLower = rolNombre.toLowerCase()
          if (rolNombreLower.includes("admin") || rolNombreLower.includes("administrador")) {
            userType = "admin"
          } else if (rolNombreLower.includes("analista") || rolNombreLower.includes("consulta") || rolNombreLower.includes("consultor")) {
            userType = "staff"
          }
        }
      }
      
      // Normalizar el rol: el backend puede devolver 'rol' o 'rol_detalle'
      let rolNormalizado = userData.rol_detalle || userData.rol
      // Si el rol viene como objeto plano, asegurarnos de que tenga la estructura correcta
      if (rolNormalizado && typeof rolNormalizado === 'object' && rolNormalizado.nombre) {
        // Ya tiene la estructura correcta
      } else if (userData.rol && typeof userData.rol === 'object' && userData.rol.nombre) {
        rolNormalizado = userData.rol
      }
      
      const updatedUser: User = {
        id: userData.id,
        email: userData.email,
        username: userData.username || userData.email,
        first_name: userData.first_name || userData.nombre,
        last_name: userData.last_name || userData.apellido,
        type: userType,
        is_superuser: userData.is_superuser,
        is_staff: userData.is_staff,
        debe_cambiar_password: userData.debe_cambiar_password || false,
        rol: rolNormalizado,
        empresaData: userData.empresa,
      }
      setUser(updatedUser)
    } catch (error) {
      console.error("Error refreshing user:", error)
    }
  }

  return <AuthContext.Provider value={{ user, login, logout, refreshUser, isLoading }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
