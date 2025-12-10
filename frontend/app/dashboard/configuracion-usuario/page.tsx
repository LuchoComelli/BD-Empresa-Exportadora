"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { MainLayout } from "@/components/layout/main-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/lib/auth-context"
import { handleAuthError } from "@/hooks/use-dashboard-auth"
import api from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { Save, Lock, Eye, EyeOff, Shield, Mail } from "lucide-react"

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

export default function ConfiguracionUsuarioPage() {
  const { user: authUser, refreshUser } = useAuth()
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

  useEffect(() => {
    if (!authUser) {
      router.push("/login")
      return
    }
    loadUserProfile()
  }, [authUser, router])

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

      // Actualizar el email usando el endpoint de actualización de usuario
      await api.updateUsuario(userProfile.id, {
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

      // Actualizar la contraseña usando el endpoint de actualización de usuario
      // El backend maneja automáticamente el hash de la contraseña
      await api.updateUsuario(userProfile.id, {
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

  if (loading || !authUser || !userProfile) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <p className="text-muted-foreground">Cargando...</p>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="space-y-4 md:space-y-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-[#222A59]">Configuración</h1>
          <p className="text-sm md:text-base text-muted-foreground mt-1 md:mt-2">
            Gestiona la configuración de tu cuenta y preferencias
          </p>
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
            <div className="space-y-2">
              <Label className="text-muted-foreground">Rol</Label>
              <p className="text-sm font-medium">
                {userProfile.rol_detalle?.nombre || "Sin rol asignado"}
              </p>
            </div>
            {userProfile.is_superuser && (
              <div className="space-y-2">
                <Label className="text-muted-foreground">Permisos</Label>
                <p className="text-sm font-medium text-blue-600">
                  Administrador del sistema
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  )
}

