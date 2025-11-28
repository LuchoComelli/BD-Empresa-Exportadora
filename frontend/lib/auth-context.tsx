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
  const router = useRouter()
  const pathname = usePathname()

  // Verificar si hay un token y cargar usuario
  useEffect(() => {
    const loadUser = async () => {
      try {
        const accessToken = localStorage.getItem("access_token")
        if (accessToken) {
          const userData = await api.getCurrentUser()
          
          // Debug: log para ver qué datos se reciben
          console.log('[Auth] Loading user data:', {
            email: userData.email,
            is_superuser: userData.is_superuser,
            is_staff: userData.is_staff,
            rol: userData.rol,
            fullData: userData
          })
          
          // Determinar tipo de usuario basado en el rol y permisos
          let userType: "admin" | "empresa" | "staff" = "empresa"
          
          // Superusuarios siempre son admin
          // Verificar is_superuser de diferentes formas (boolean, número, string)
          const isSuperuser = userData.is_superuser === true || 
                             userData.is_superuser === 1 || 
                             userData.is_superuser === "true" ||
                             String(userData.is_superuser).toLowerCase() === "true"
          
          if (isSuperuser) {
            console.log('[Auth] User is superuser, setting type to admin')
            userType = "admin"
          }
          // Si tiene rol de Administrador, Analista o Consulta, puede acceder al dashboard
          else if (userData.rol?.nombre) {
            const rolNombre = userData.rol.nombre.toLowerCase()
            if (rolNombre.includes("admin") || rolNombre.includes("administrador")) {
              console.log('[Auth] User has admin role, setting type to admin')
              userType = "admin"
            } else if (rolNombre.includes("analista") || rolNombre.includes("consulta") || rolNombre.includes("consultor")) {
              console.log('[Auth] User has staff role, setting type to staff')
              userType = "staff"
            }
          }
          
          console.log('[Auth] Final user type (load):', userType)
          
          const user: User = {
            id: userData.id,
            email: userData.email,
            username: userData.username,
            first_name: userData.first_name,
            last_name: userData.last_name,
            type: userType,
            is_superuser: userData.is_superuser,
            is_staff: userData.is_staff,
            rol: userData.rol,
            empresaData: userData.empresa,
          }
          setUser(user)
        }
      } catch (error) {
        console.error("Error loading user:", error)
        // Si hay error, limpiar tokens
        api.logout()
      } finally {
        setIsLoading(false)
      }
    }

    loadUser()
  }, [])

  useEffect(() => {
    if (!isLoading && !user) {
      const publicRoutes = ["/", "/login", "/registro", "/recuperar-contrasena"]
      if (!publicRoutes.includes(pathname)) {
        router.push("/login")
      }
    }
  }, [user, isLoading, pathname, router])

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      // Intentar login con la API
      await api.login(email, password)
      
      // Obtener información del usuario
      const userData = await api.getCurrentUser()
      
      // Debug: log para ver qué datos se reciben
      console.log('[Auth] User data received:', {
        email: userData.email,
        is_superuser: userData.is_superuser,
        is_staff: userData.is_staff,
        rol: userData.rol,
        fullData: userData
      })
      
      // Determinar tipo de usuario basado en el rol y permisos
      let userType: "admin" | "empresa" | "staff" = "empresa"
      
      // Superusuarios siempre son admin
      // Verificar is_superuser de diferentes formas (boolean, número, string)
      const isSuperuser = userData.is_superuser === true || 
                         userData.is_superuser === 1 || 
                         userData.is_superuser === "true" ||
                         String(userData.is_superuser).toLowerCase() === "true"
      
      if (isSuperuser) {
        console.log('[Auth] User is superuser, setting type to admin')
        userType = "admin"
      }
      // Si tiene rol de Administrador, Analista o Consulta, puede acceder al dashboard
      else if (userData.rol?.nombre) {
        const rolNombre = userData.rol.nombre.toLowerCase()
        if (rolNombre.includes("admin") || rolNombre.includes("administrador")) {
          console.log('[Auth] User has admin role, setting type to admin')
          userType = "admin"
        } else if (rolNombre.includes("analista") || rolNombre.includes("consulta") || rolNombre.includes("consultor")) {
          console.log('[Auth] User has staff role, setting type to staff')
          userType = "staff"
        }
      }
      
      console.log('[Auth] Final user type:', userType)
      
      const loggedUser: User = {
        id: userData.id,
        email: userData.email,
        username: userData.username,
        first_name: userData.first_name,
        last_name: userData.last_name,
        type: userType,
        is_superuser: userData.is_superuser,
        is_staff: userData.is_staff,
        rol: userData.rol,
        empresaData: userData.empresa,
      }
      
      setUser(loggedUser)
      
      // Debug: log para ver la redirección
      console.log('[Auth] Redirecting user:', {
        userType,
        is_superuser: loggedUser.is_superuser,
        rol: loggedUser.rol?.nombre,
        willRedirectToDashboard: userType === "admin" || userType === "staff"
      })
      
      // Redirigir según el tipo de usuario
      if (userType === "admin" || userType === "staff") {
        console.log('[Auth] Redirecting to /dashboard')
        router.push("/dashboard")
      } else {
        console.log('[Auth] Redirecting to /perfil-empresa')
        router.push("/perfil-empresa")
      }
      
      return true
    } catch (error: any) {
      console.error("Login error:", error)
      alert(error.message || "Error al iniciar sesión. Verifica tus credenciales.")
      return false
    }
  }

  const logout = () => {
    api.logout()
    setUser(null)
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
      } else if (userData.rol?.nombre) {
        const rolNombre = userData.rol.nombre.toLowerCase()
        if (rolNombre.includes("admin") || rolNombre.includes("administrador")) {
          userType = "admin"
        } else if (rolNombre.includes("analista") || rolNombre.includes("consulta") || rolNombre.includes("consultor")) {
          userType = "staff"
        }
      }
      
      const updatedUser: User = {
        id: userData.id,
        email: userData.email,
        username: userData.username,
        first_name: userData.first_name,
        last_name: userData.last_name,
        type: userType,
        is_superuser: userData.is_superuser,
        is_staff: userData.is_staff,
        rol: userData.rol,
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
