"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/lib/auth-context"
import { handleAuthError } from "@/hooks/use-dashboard-auth"
import api from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { Save, Lock, Eye, EyeOff, Shield, Mail, ArrowLeft, Instagram, Linkedin } from "lucide-react"

interface UserProfile {
  id: number
  email: string
  is_active: boolean
  rol?: number  // ID del rol
  rol_detalle?: {
    id: number
    nombre: string
  }
  is_superuser?: boolean
}

export default function ConfiguracionEmpresaPage() {
  const { user: authUser, refreshUser, isLoading: authLoading } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  
  // Estados para cambio de email
  const [emailData, setEmailData] = useState({
    newEmail: "",
    confirmEmail: "",
  })
  
  // Estados para cambio de contraseña
  const [passwordData, setPasswordData] = useState({
    newPassword: "",
    confirmPassword: "",
  })
  const [showPasswords, setShowPasswords] = useState({
    new: false,
    confirm: false,
  })

  // Estado para configuración del footer
  const [configuracion, setConfiguracion] = useState({
    institucion: "Dirección de Intercambio Comercial Internacional y Regional",
    email_contacto: "info@desarrolloproductivo.catamarca.gob.ar",
    telefono: "(0383) 4437390",
    direccion: "San Martín 320, San Fernando del Valle de Catamarca",
  })

  useEffect(() => {
    // Esperar a que termine la carga de autenticación antes de verificar
    if (authLoading) {
      return
    }
    
    // Solo redirigir si definitivamente no hay usuario después de cargar
    if (!authUser) {
      router.push("/login")
      return
    }
    
    loadUserProfile()
  }, [authUser, authLoading, router])

  // Cargar configuración para el footer
  useEffect(() => {
    const loadConfig = async () => {
      try {
        const data = await api.getConfiguracion()
        setConfiguracion({
          institucion: data.institucion || "Dirección de Intercambio Comercial Internacional y Regional",
          email_contacto: data.email_contacto || "info@desarrolloproductivo.catamarca.gob.ar",
          telefono: data.telefono || "(0383) 4437390",
          direccion: data.direccion || "San Martín 320, San Fernando del Valle de Catamarca",
        })
      } catch (error) {
        console.error("Error cargando configuración:", error)
        // Mantener valores por defecto en caso de error
      }
    }
    loadConfig()
  }, [])

  const loadUserProfile = async () => {
    try {
      setLoading(true)
      const data = await api.getCurrentUser()
      setUserProfile(data)
      // Inicializar el email en el formulario
      setEmailData({
        newEmail: data.email || "",
        confirmEmail: data.email || "",
      })
    } catch (error: any) {
      if (!handleAuthError(error)) {
        console.error("Error cargando perfil:", error)
        toast({
          title: "Error",
          description: "No se pudo cargar la información del usuario",
          variant: "destructive",
        })
      }
    } finally {
      setLoading(false)
    }
  }

  const handleChangeEmail = async () => {
    if (!emailData.newEmail || !emailData.confirmEmail) {
      toast({
        title: "Campos requeridos",
        description: "Por favor completa todos los campos",
        variant: "destructive",
      })
      return
    }

    if (emailData.newEmail !== emailData.confirmEmail) {
      toast({
        title: "Error",
        description: "Los emails no coinciden",
        variant: "destructive",
      })
      return
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(emailData.newEmail)) {
      toast({
        title: "Email inválido",
        description: "Por favor ingresa un email válido",
        variant: "destructive",
      })
      return
    }

    // Verificar que el email sea diferente al actual
    if (emailData.newEmail === userProfile?.email) {
      toast({
        title: "Sin cambios",
        description: "El nuevo email es igual al actual",
        variant: "destructive",
      })
      return
    }

    try {
      setSaving(true)
      
      if (!userProfile?.id) {
        throw new Error("No se pudo identificar al usuario")
      }

      // Actualizar el email usando el endpoint de actualización del usuario actual
      await api.updateMe({
        email: emailData.newEmail,
      })

      // Recargar el perfil para obtener los datos actualizados
      const updatedData = await api.getCurrentUser()
      setUserProfile(updatedData)
      
      // Refrescar el usuario en el contexto de autenticación
      await refreshUser()

      // Actualizar el formulario con el nuevo email
      setEmailData({
        newEmail: updatedData.email || "",
        confirmEmail: updatedData.email || "",
      })

      toast({
        title: "Éxito",
        description: "Email actualizado correctamente. Por favor, inicia sesión nuevamente con tu nuevo email.",
      })
    } catch (error: any) {
      if (!handleAuthError(error)) {
        console.error("Error cambiando email:", error)
        toast({
          title: "Error",
          description: error.message || "No se pudo cambiar el email. Por favor, intenta nuevamente.",
          variant: "destructive",
        })
      }
    } finally {
      setSaving(false)
    }
  }

  const handleChangePassword = async () => {
    if (!passwordData.newPassword || !passwordData.confirmPassword) {
      toast({
        title: "Campos requeridos",
        description: "Por favor completa todos los campos",
        variant: "destructive",
      })
      return
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({
        title: "Error",
        description: "Las contraseñas no coinciden",
        variant: "destructive",
      })
      return
    }

    if (passwordData.newPassword.length < 8) {
      toast({
        title: "Contraseña débil",
        description: "La contraseña debe tener al menos 8 caracteres",
        variant: "destructive",
      })
      return
    }

    try {
      setSaving(true)
      
      if (!userProfile?.id) {
        throw new Error("No se pudo identificar al usuario")
      }

      // Actualizar la contraseña usando el endpoint de actualización del usuario actual
      // El backend maneja automáticamente el hash de la contraseña
      await api.updateMe({
        password: passwordData.newPassword,
      })

      setPasswordData({
        newPassword: "",
        confirmPassword: "",
      })

      toast({
        title: "Éxito",
        description: "Contraseña actualizada correctamente",
      })
    } catch (error: any) {
      if (!handleAuthError(error)) {
        console.error("Error cambiando contraseña:", error)
        toast({
          title: "Error",
          description: error.message || "No se pudo cambiar la contraseña. Por favor, intenta nuevamente.",
          variant: "destructive",
        })
      }
    } finally {
      setSaving(false)
    }
  }

  if (authLoading || loading || !authUser || !userProfile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#F3F4F6] to-[#E5E7EB] w-full max-w-full overflow-x-hidden">
        <header className="border-b bg-[#222A59] sticky top-0 z-50 shadow-md">
          <div className="w-full px-2 sm:px-4 py-2 md:py-3 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 md:gap-3 min-w-0">
              <Link href="/" className="flex-shrink-0 hover:opacity-90 transition-opacity">
                <div className="relative w-32 h-10 md:w-40 md:h-12 max-h-[40px] md:max-h-[48px]">
                  <Image
                    src="/logo.png"
                    alt="Logo Catamarca"
                    fill
                    className="object-contain"
                    priority
                  />
                </div>
              </Link>
            </div>
          </div>
        </header>
        <main className="w-full px-2 sm:px-4 md:px-6 py-4 sm:py-6 md:py-8">
          <Card className="p-4 sm:p-6 md:p-8 text-center w-full max-w-full overflow-hidden">
            <p className="text-sm sm:text-base md:text-lg text-[#6B7280]">Cargando...</p>
          </Card>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F3F4F6] to-[#E5E7EB] w-full max-w-full overflow-x-hidden">
      {/* Header */}
      <header className="border-b bg-[#222A59] sticky top-0 z-50 shadow-md">
        <div className="w-full px-2 sm:px-4 py-2 md:py-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 md:gap-3 min-w-0 flex-1 overflow-hidden">
            <Link href="/" className="flex-shrink-0 hover:opacity-90 transition-opacity">
              <div className="relative w-28 h-8 sm:w-32 sm:h-10 md:w-40 md:h-12 max-h-[32px] sm:max-h-[40px] md:max-h-[48px]">
                <Image
                  src="/logo.png"
                  alt="Logo Catamarca"
                  fill
                  className="object-contain"
                  priority
                />
              </div>
            </Link>
          </div>
        </div>
      </header>

      <main className="w-full px-2 sm:px-4 md:px-6 py-4 sm:py-6 md:py-8">
        <div className="container mx-auto max-w-4xl">
        <div className="space-y-4 md:space-y-6">
          <div className="flex items-center gap-4 mb-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push('/')}
              className="flex-shrink-0"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-[#222A59]">Configuración</h1>
              <p className="text-sm md:text-base text-muted-foreground mt-1 md:mt-2">
                Gestiona la configuración de tu cuenta y preferencias
              </p>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-[#222A59] flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Cambiar Email
              </CardTitle>
              <CardDescription>
                Actualiza tu dirección de correo electrónico
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 md:space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="currentEmail">Email Actual</Label>
                  <Input
                    id="currentEmail"
                    type="email"
                    value={userProfile.email}
                    disabled
                    className="bg-muted"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="newEmail">Nuevo Email</Label>
                  <Input
                    id="newEmail"
                    type="email"
                    value={emailData.newEmail}
                    onChange={(e) =>
                      setEmailData({ ...emailData, newEmail: e.target.value })
                    }
                    placeholder="nuevo@email.com"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmEmail">Confirmar Nuevo Email</Label>
                  <Input
                    id="confirmEmail"
                    type="email"
                    value={emailData.confirmEmail}
                    onChange={(e) =>
                      setEmailData({ ...emailData, confirmEmail: e.target.value })
                    }
                    placeholder="Confirma tu nuevo email"
                  />
                </div>
              </div>

              <Button
                onClick={handleChangeEmail}
                disabled={saving || !emailData.newEmail || !emailData.confirmEmail || emailData.newEmail !== emailData.confirmEmail || emailData.newEmail === userProfile.email}
                className="bg-[#3259B5] hover:bg-[#222A59]"
              >
                <Save className="h-4 w-4 mr-2" />
                {saving ? "Guardando..." : "Cambiar Email"}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-[#222A59] flex items-center gap-2">
                <Lock className="h-5 w-5" />
                Cambiar Contraseña
              </CardTitle>
              <CardDescription>
                Actualiza tu contraseña para mantener tu cuenta segura
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 md:space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="newPassword">Nueva Contraseña</Label>
                  <div className="relative">
                    <Input
                      id="newPassword"
                      type={showPasswords.new ? "text" : "password"}
                      value={passwordData.newPassword}
                      onChange={(e) =>
                        setPasswordData({ ...passwordData, newPassword: e.target.value })
                      }
                      placeholder="Mínimo 8 caracteres"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() =>
                        setShowPasswords({ ...showPasswords, new: !showPasswords.new })
                      }
                    >
                      {showPasswords.new ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    La contraseña debe tener al menos 8 caracteres
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirmar Nueva Contraseña</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showPasswords.confirm ? "text" : "password"}
                      value={passwordData.confirmPassword}
                      onChange={(e) =>
                        setPasswordData({ ...passwordData, confirmPassword: e.target.value })
                      }
                      placeholder="Confirma tu nueva contraseña"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() =>
                        setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })
                      }
                    >
                      {showPasswords.confirm ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>

              <Button
                onClick={handleChangePassword}
                disabled={saving || !passwordData.newPassword || !passwordData.confirmPassword || passwordData.newPassword !== passwordData.confirmPassword}
                className="bg-[#3259B5] hover:bg-[#222A59]"
              >
                <Save className="h-4 w-4 mr-2" />
                {saving ? "Guardando..." : "Cambiar Contraseña"}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-[#222A59] flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Seguridad
              </CardTitle>
              <CardDescription>
                Información sobre la seguridad de tu cuenta
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-muted-foreground">Estado de la cuenta</Label>
                <p className="text-sm font-medium">
                  {userProfile.is_active ? (
                    <span className="text-green-600 font-semibold">✓ Cuenta activa</span>
                  ) : (
                    <span className="text-red-600 font-semibold">✗ Cuenta inactiva</span>
                  )}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-[#222A59] text-white py-8 md:py-12">
        <div className="w-full px-4">
          {/* Grid de contenido */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 mb-8 md:mb-12">
            <div>
              <h4 className="font-semibold text-base md:text-lg mb-3 md:mb-4">Contacto</h4>
              <p className="text-white/80 text-sm mb-2">{configuracion.direccion}</p>
              <p className="text-white/80 text-sm mb-2">{configuracion.telefono}</p>
              <p className="text-white/80 text-sm">{configuracion.email_contacto}</p>
            </div>
            <div>
              <h4 className="font-semibold text-base md:text-lg mb-3 md:mb-4">Enlaces Útiles</h4>
              <ul className="space-y-2 text-sm text-white/80">
                <li>
                  <Link href="/login" className="hover:text-white transition-colors">
                    Iniciar Sesión
                  </Link>
                </li>
                <li>
                  <Link href="/registro" className="hover:text-white transition-colors">
                    Registrar Empresa
                  </Link>
                </li>
                <li>
                  <Link href="/#beneficios" className="hover:text-white transition-colors">
                    Beneficios
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-base md:text-lg mb-3 md:mb-4">Redes Sociales</h4>
              <div className="flex gap-4">
                <a 
                  href="https://www.instagram.com/min.integracionregional.cat?igsh=MTIzdTZkczVpZ2o4bQ=="
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors"
                  aria-label="Instagram"
                >
                  <Instagram className="w-5 h-5" />
                </a>
                <a 
                  href="https://www.linkedin.com/company/sec-relaciones-internacionales-catamarca/posts/?feedView=all"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors"
                  aria-label="LinkedIn"
                >
                  <Linkedin className="w-5 h-5" />
                </a>
              </div>
            </div>
          </div>

          {/* Imagen del footer al final */}
          <div className="flex flex-col items-center">
            <div className="relative w-full max-w-2xl h-auto">
              <img
                src="/footer.png"
                alt="Footer Catamarca"
                className="w-full h-auto object-contain"
              />
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

