"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { MainLayout } from "@/components/layout/main-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAuth } from "@/lib/auth-context"
import { handleAuthError } from "@/hooks/use-dashboard-auth"
import api from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { Save, User, Mail, Phone, Calendar, MapPin, FileText } from "lucide-react"

interface UserProfile {
  id: number
  email: string
  nombre?: string
  apellido?: string
  telefono?: string
  fecha_nacimiento?: string
  genero?: string
  tipo_documento?: string
  numero_documento?: string
  departamento?: string
  municipio?: string
  localidad?: string
  rol?: number  // ID del rol
  rol_detalle?: {
    id: number
    nombre: string
  }
  is_active: boolean
  date_joined: string
  last_login?: string
}

export default function PerfilPage() {
  const { user: authUser, refreshUser } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [formData, setFormData] = useState({
    nombre: "",
    apellido: "",
    telefono: "",
    fecha_nacimiento: "",
    genero: "",
    tipo_documento: "",
    numero_documento: "",
  })

  useEffect(() => {
    if (!authUser) {
      router.push("/login")
      return
    }
    loadProfile()
  }, [authUser, router])

  const loadProfile = async () => {
    try {
      setLoading(true)
      const data = await api.getCurrentUser()
      setUserProfile(data)
      setFormData({
        nombre: data.nombre || "",
        apellido: data.apellido || "",
        telefono: data.telefono || "",
        fecha_nacimiento: data.fecha_nacimiento ? data.fecha_nacimiento.split('T')[0] : "",
        genero: data.genero || "",
        tipo_documento: data.tipo_documento || "",
        numero_documento: data.numero_documento || "",
      })
    } catch (error: any) {
      if (!handleAuthError(error)) {
        console.error("Error cargando perfil:", error)
        toast({
          title: "Error",
          description: "No se pudo cargar el perfil del usuario",
          variant: "destructive",
        })
      }
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!userProfile) return

    try {
      setSaving(true)
      const updateData: any = {
        nombre: formData.nombre,
        apellido: formData.apellido,
        telefono: formData.telefono || undefined,
        fecha_nacimiento: formData.fecha_nacimiento || undefined,
        genero: formData.genero || undefined,
        tipo_documento: formData.tipo_documento || undefined,
        numero_documento: formData.numero_documento || undefined,
      }

      // Remover campos vacíos
      Object.keys(updateData).forEach(key => {
        if (updateData[key] === undefined || updateData[key] === "") {
          delete updateData[key]
        }
      })

      await api.updateUsuario(userProfile.id, updateData)
      
      // Recargar perfil
      await loadProfile()
      // Refrescar usuario en el contexto de autenticación
      await refreshUser()
      
      setIsEditing(false)
      toast({
        title: "Éxito",
        description: "Perfil actualizado correctamente",
      })
    } catch (error: any) {
      if (!handleAuthError(error)) {
        console.error("Error actualizando perfil:", error)
        toast({
          title: "Error",
          description: error.message || "No se pudo actualizar el perfil",
          variant: "destructive",
        })
      }
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <p className="text-muted-foreground">Cargando perfil...</p>
        </div>
      </MainLayout>
    )
  }

  if (!userProfile) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <p className="text-muted-foreground">No se pudo cargar el perfil</p>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="space-y-4 md:space-y-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-[#222A59]">Mi Perfil</h1>
          <p className="text-sm md:text-base text-muted-foreground mt-1 md:mt-2">
            Gestiona tu información personal y datos de contacto
          </p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-[#222A59] flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Información Personal
                </CardTitle>
                <CardDescription>Datos básicos de tu cuenta</CardDescription>
              </div>
              {!isEditing && (
                <Button onClick={() => setIsEditing(true)} variant="outline">
                  Editar
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4 md:space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Correo Electrónico</Label>
                <Input
                  id="email"
                  value={userProfile.email}
                  disabled
                  className="bg-muted"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="rol">Rol Asignado</Label>
                <Input
                  id="rol"
                  value={userProfile.rol_detalle?.nombre || "Sin rol asignado"}
                  disabled
                  className="bg-muted"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="nombre">Nombre</Label>
                <Input
                  id="nombre"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  disabled={!isEditing}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="apellido">Apellido</Label>
                <Input
                  id="apellido"
                  value={formData.apellido}
                  onChange={(e) => setFormData({ ...formData, apellido: e.target.value })}
                  disabled={!isEditing}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="telefono">Teléfono</Label>
                <Input
                  id="telefono"
                  value={formData.telefono}
                  onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                  disabled={!isEditing}
                  placeholder="+54 383 1234567"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="fecha_nacimiento">Fecha de Nacimiento</Label>
                <Input
                  id="fecha_nacimiento"
                  type="date"
                  value={formData.fecha_nacimiento}
                  onChange={(e) => setFormData({ ...formData, fecha_nacimiento: e.target.value })}
                  disabled={!isEditing}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="genero">Género</Label>
                <Select
                  value={formData.genero}
                  onValueChange={(value) => setFormData({ ...formData, genero: value })}
                  disabled={!isEditing}
                >
                  <SelectTrigger id="genero">
                    <SelectValue placeholder="Seleccionar género" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="M">Masculino</SelectItem>
                    <SelectItem value="F">Femenino</SelectItem>
                    <SelectItem value="O">Otro</SelectItem>
                    <SelectItem value="P">Prefiero no decir</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tipo_documento">Tipo de Documento</Label>
                <Select
                  value={formData.tipo_documento}
                  onValueChange={(value) => setFormData({ ...formData, tipo_documento: value })}
                  disabled={!isEditing}
                >
                  <SelectTrigger id="tipo_documento">
                    <SelectValue placeholder="Seleccionar tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DNI">DNI</SelectItem>
                    <SelectItem value="LC">LC</SelectItem>
                    <SelectItem value="LE">LE</SelectItem>
                    <SelectItem value="PAS">Pasaporte</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="numero_documento">Número de Documento</Label>
                <Input
                  id="numero_documento"
                  value={formData.numero_documento}
                  onChange={(e) => setFormData({ ...formData, numero_documento: e.target.value })}
                  disabled={!isEditing}
                  placeholder="12345678"
                />
              </div>
            </div>

            {isEditing && (
              <div className="flex flex-col sm:flex-row gap-2 md:gap-3 pt-4">
                <Button
                  onClick={handleSave}
                  disabled={saving}
                  className="bg-[#3259B5] hover:bg-[#222A59]"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? "Guardando..." : "Guardar Cambios"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsEditing(false)
                    loadProfile() // Recargar datos originales
                  }}
                  disabled={saving}
                >
                  Cancelar
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-[#222A59] flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Información de la Cuenta
            </CardTitle>
            <CardDescription>Detalles sobre tu cuenta</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label className="text-muted-foreground">Estado de la cuenta</Label>
                <p className="text-sm font-medium">
                  {userProfile.is_active ? (
                    <span className="text-green-600">Activa</span>
                  ) : (
                    <span className="text-red-600">Inactiva</span>
                  )}
                </p>
              </div>
              <div>
                <Label className="text-muted-foreground">Fecha de registro</Label>
                <p className="text-sm font-medium">
                  {userProfile.date_joined
                    ? new Date(userProfile.date_joined).toLocaleDateString('es-AR')
                    : "N/A"}
                </p>
              </div>
              {userProfile.last_login && (
                <div>
                  <Label className="text-muted-foreground">Último acceso</Label>
                  <p className="text-sm font-medium">
                    {new Date(userProfile.last_login).toLocaleDateString('es-AR', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  )
}

