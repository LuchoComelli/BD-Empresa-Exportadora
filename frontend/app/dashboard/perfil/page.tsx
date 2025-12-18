"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { MainLayout } from "@/components/layout/main-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAuth } from "@/lib/auth-context"
import { handleAuthError } from "@/hooks/use-dashboard-auth"
import api from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { ArrowLeft, Edit, Save, X, Loader2, Mail, Phone, Shield, User, Calendar, MapPin } from "lucide-react"
import Link from "next/link"
import { Skeleton } from "@/components/ui/skeleton"

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
  rol?: number
  rol_detalle?: {
    id: number
    nombre: string
    descripcion?: string
    puede_crear_empresas?: boolean
    puede_editar_empresas?: boolean
    puede_eliminar_empresas?: boolean
    puede_ver_auditoria?: boolean
    puede_exportar_datos?: boolean
    puede_gestionar_usuarios?: boolean
  }
  is_active: boolean
  is_staff?: boolean
  is_superuser?: boolean
  date_joined: string
  last_login?: string
}

interface Departamento {
  id: string
  nombre: string
  nombre_completo?: string
}

interface Municipio {
  id: string
  nombre: string
  nombre_completo?: string
  departamento?: string
  departamento_nombre?: string
}

interface Localidad {
  id: string
  nombre: string
  departamento: string
  departamento_nombre?: string
  municipio?: string
  municipio_nombre?: string
}

export default function PerfilPage() {
  const { user: authUser, refreshUser } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [editedData, setEditedData] = useState<UserProfile | null>(null)
  
  // Estados para datos geográficos
  const [departamentos, setDepartamentos] = useState<Departamento[]>([])
  const [municipios, setMunicipios] = useState<Municipio[]>([])
  const [localidades, setLocalidades] = useState<Localidad[]>([])
  const [selectedDepartamento, setSelectedDepartamento] = useState<string>('')
  const [selectedMunicipio, setSelectedMunicipio] = useState<string>('')
  const [selectedLocalidad, setSelectedLocalidad] = useState<string>('')
  const [loadingGeo, setLoadingGeo] = useState(false)

  useEffect(() => {
    if (!authUser) {
      router.push("/login")
      return
    }
    loadProfile()
    loadDepartamentos()
  }, [authUser, router])

  // Cargar departamentos cuando se carga el usuario
  useEffect(() => {
    const loadDepartamentosForUsuario = async () => {
      if (!userProfile?.departamento) return
      
      try {
        setLoadingGeo(true)
        const data = await api.getDepartamentos()
        const departamentosArray = Array.isArray(data) ? data : (data.results || data)
        
        // Intentar encontrar el departamento del usuario
        if (departamentosArray.length > 0) {
          const depto = departamentosArray.find((d: any) => 
            d.nombre === userProfile.departamento || 
            d.nombre_completo === userProfile.departamento
          )
          if (depto) {
            setSelectedDepartamento(depto.id.toString())
          }
        }
      } catch (error) {
        console.error('Error cargando departamentos:', error)
      } finally {
        setLoadingGeo(false)
      }
    }
    if (userProfile) {
      loadDepartamentosForUsuario()
    }
  }, [userProfile])

  // Cargar municipios cuando se selecciona un departamento
  useEffect(() => {
    const loadMunicipios = async () => {
      if (!selectedDepartamento) {
        setMunicipios([])
        setLocalidades([])
        return
      }
      try {
        setLoadingGeo(true)
        const data = await api.getMunicipiosPorDepartamento(selectedDepartamento)
        const municipiosArray = Array.isArray(data) ? data : (data.results || data)
        setMunicipios(municipiosArray || [])
        
        // Si el usuario tiene municipio, intentar encontrarlo
        if (userProfile?.municipio && municipiosArray.length > 0) {
          const mun = municipiosArray.find((m: any) => 
            m.nombre === userProfile.municipio || 
            m.nombre_completo === userProfile.municipio
          )
          if (mun) {
            setSelectedMunicipio(mun.id.toString())
          }
        }
      } catch (error) {
        console.error('Error cargando municipios:', error)
        setMunicipios([])
      } finally {
        setLoadingGeo(false)
      }
    }
    loadMunicipios()
  }, [selectedDepartamento, userProfile])

  // Cargar localidades cuando se selecciona un municipio o departamento
  useEffect(() => {
    const loadLocalidades = async () => {
      if (!selectedMunicipio && !selectedDepartamento) {
        setLocalidades([])
        return
      }
      try {
        setLoadingGeo(true)
        let data
        if (selectedMunicipio) {
          data = await api.getLocalidadesPorMunicipio(selectedMunicipio)
        } else if (selectedDepartamento) {
          data = await api.getLocalidadesPorDepartamento(selectedDepartamento)
        } else {
          setLocalidades([])
          return
        }
        const localidadesArray = Array.isArray(data) ? data : (data.results || data)
        setLocalidades(localidadesArray || [])
        
        // Si el usuario tiene localidad, intentar encontrarla
        if (userProfile?.localidad && localidadesArray.length > 0) {
          const loc = localidadesArray.find((l: any) => 
            l.nombre === userProfile.localidad || 
            l.nombre_completo === userProfile.localidad
          )
          if (loc) {
            setSelectedLocalidad(loc.id.toString())
          }
        }
      } catch (error) {
        console.error('Error cargando localidades:', error)
        setLocalidades([])
      } finally {
        setLoadingGeo(false)
      }
    }
    loadLocalidades()
  }, [selectedMunicipio, selectedDepartamento, userProfile])

  const loadDepartamentos = async () => {
    try {
      setLoadingGeo(true)
      const data = await api.getDepartamentos()
      const departamentosArray = Array.isArray(data) ? data : (data.results || data)
      setDepartamentos(departamentosArray || [])
    } catch (error) {
      console.error('Error cargando departamentos:', error)
      setDepartamentos([])
    } finally {
      setLoadingGeo(false)
    }
  }

  const loadProfile = async () => {
    try {
      setLoading(true)
      const data = await api.getCurrentUser()
      setUserProfile(data)
      setEditedData(data)
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

  const handleEdit = () => {
    setIsEditing(true)
    setEditedData(userProfile ? { ...userProfile } : null)
  }

  const handleCancel = () => {
    setIsEditing(false)
    setEditedData(userProfile ? { ...userProfile } : null)
    // Restaurar selecciones geográficas
    if (userProfile?.departamento) {
      const depto = departamentos.find((d: any) => 
        d.nombre === userProfile.departamento || 
        d.nombre_completo === userProfile.departamento
      )
      if (depto) {
        setSelectedDepartamento(depto.id.toString())
      }
    }
  }

  const handleSave = async () => {
    if (!userProfile || !editedData) return

    try {
      setSaving(true)
      const updateData: any = {
        nombre: editedData.nombre,
        apellido: editedData.apellido,
        telefono: editedData.telefono || undefined,
        fecha_nacimiento: editedData.fecha_nacimiento || undefined,
        genero: editedData.genero || undefined,
        tipo_documento: editedData.tipo_documento || undefined,
        numero_documento: editedData.numero_documento || undefined,
      }

      // Agregar datos geográficos si están seleccionados
      if (selectedDepartamento) {
        const depto = departamentos.find(d => d.id.toString() === selectedDepartamento)
        if (depto) {
          updateData.departamento = depto.nombre
        }
      }
      if (selectedMunicipio) {
        const mun = municipios.find(m => m.id.toString() === selectedMunicipio)
        if (mun) {
          updateData.municipio = mun.nombre
        }
      }
      if (selectedLocalidad) {
        const loc = localidades.find(l => l.id.toString() === selectedLocalidad)
        if (loc) {
          updateData.localidad = loc.nombre
        }
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

  const getRolColor = (rol?: string) => {
    if (!rol) return "bg-gray-500 text-white"
    
    switch (rol.toLowerCase()) {
      case "administrador":
        return "bg-[#C0217E] text-white"
      case "analista":
        return "bg-[#3259B5] text-white"
      case "consultor":
        return "bg-[#66A29C] text-white"
      case "superusuario":
        return "bg-[#C0217E] text-white"
      default:
        return "bg-gray-500 text-white"
    }
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A"
    try {
      let date: Date
      if (dateString.includes('T')) {
        const dateOnly = dateString.split('T')[0]
        const [year, month, day] = dateOnly.split('-').map(Number)
        date = new Date(year, month - 1, day)
      } else if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
        const [year, month, day] = dateString.split('-').map(Number)
        date = new Date(year, month - 1, day)
      } else {
        date = new Date(dateString)
      }
      
      return date.toLocaleDateString("es-AR", {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    } catch {
      return "N/A"
    }
  }

  if (loading) {
    return (
      <MainLayout>
        <div className="space-y-6">
          <Skeleton className="h-12 w-full" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <Skeleton className="h-64 w-full" />
              <Skeleton className="h-64 w-full" />
            </div>
            <div className="space-y-6">
              <Skeleton className="h-48 w-full" />
            </div>
          </div>
        </div>
      </MainLayout>
    )
  }

  if (!userProfile) {
    return (
      <MainLayout>
        <div className="text-center py-12">
          <p className="text-[#6B7280]">No se pudo cargar el perfil</p>
          <Button onClick={() => router.push("/dashboard")} className="mt-4">
            Volver al Dashboard
          </Button>
        </div>
      </MainLayout>
    )
  }

  const displayData = isEditing ? editedData : userProfile

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4 flex-wrap">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl md:text-3xl font-bold text-[#222A59]">Mi Perfil</h1>
            <p className="text-sm md:text-base text-muted-foreground mt-1">
              {userProfile.nombre} {userProfile.apellido}
            </p>
          </div>
          <div className="flex gap-2">
            {!isEditing ? (
              <Button onClick={handleEdit} variant="outline" className="gap-2">
                <Edit className="h-4 w-4" />
                Editar
              </Button>
            ) : (
              <>
                <Button onClick={handleCancel} variant="outline" className="gap-2">
                  <X className="h-4 w-4" />
                  Cancelar
                </Button>
                <Button onClick={handleSave} className="bg-[#3259B5] hover:bg-[#3259B5]/90 text-white gap-2" disabled={saving}>
                  {saving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  Guardar
                </Button>
              </>
            )}
          </div>
        </div>

        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
              <div className="flex gap-4">
                <div className="w-16 h-16 rounded-full bg-[#3259B5] flex items-center justify-center text-white font-semibold text-xl">
                  {`${displayData?.nombre?.[0] || ''}${displayData?.apellido?.[0] || ''}`.toUpperCase()}
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-[#222A59]">
                    {displayData?.nombre} {displayData?.apellido}
                  </h2>
                  <div className="flex flex-wrap items-center gap-3 mt-2">
                    <Badge className={getRolColor(displayData?.rol_detalle?.nombre)}>
                      <Shield className="h-3 w-3 mr-1" />
                      {displayData?.rol_detalle?.nombre || 'Sin rol'}
                    </Badge>
                    <Badge className={displayData?.is_active ? "bg-[#C3C840] text-[#222A59]" : "bg-gray-400 text-white"}>
                      {displayData?.is_active ? 'Activo' : 'Inactivo'}
                    </Badge>
                    {displayData?.is_staff && (
                      <Badge className="bg-blue-500 text-white">Staff</Badge>
                    )}
                    {displayData?.is_superuser && (
                      <Badge className="bg-purple-500 text-white">Superusuario</Badge>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-4 mt-4 text-sm text-muted-foreground">
                    {displayData?.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        <span>{displayData.email}</span>
                      </div>
                    )}
                    {displayData?.telefono && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        <span>{displayData.telefono}</span>
                      </div>
                    )}
                    {displayData?.date_joined && (
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        <span>Registrado: {formatDate(displayData.date_joined)}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="general" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:inline-grid">
            <TabsTrigger value="general">Información General</TabsTrigger>
            <TabsTrigger value="permisos">Permisos y Roles</TabsTrigger>
            <TabsTrigger value="historial">Historial</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-[#222A59]">Datos Personales</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label>Email</Label>
                  <p className="mt-1 font-semibold">{displayData?.email || 'N/A'}</p>
                </div>
                <div>
                  <Label>Nombre</Label>
                  {isEditing ? (
                    <Input
                      value={displayData?.nombre || ''}
                      onChange={(e) => setEditedData(displayData ? { ...displayData, nombre: e.target.value } : null)}
                    />
                  ) : (
                    <p className="mt-1 font-semibold">{displayData?.nombre || 'N/A'}</p>
                  )}
                </div>
                <div>
                  <Label>Apellido</Label>
                  {isEditing ? (
                    <Input
                      value={displayData?.apellido || ''}
                      onChange={(e) => setEditedData(displayData ? { ...displayData, apellido: e.target.value } : null)}
                    />
                  ) : (
                    <p className="mt-1 font-semibold">{displayData?.apellido || 'N/A'}</p>
                  )}
                </div>
                <div>
                  <Label>Teléfono</Label>
                  {isEditing ? (
                    <Input
                      value={displayData?.telefono || ''}
                      onChange={(e) => setEditedData(displayData ? { ...displayData, telefono: e.target.value } : null)}
                    />
                  ) : (
                    <p className="mt-1 font-semibold">{displayData?.telefono || 'N/A'}</p>
                  )}
                </div>
                <div>
                  <Label>Género</Label>
                  {isEditing ? (
                    <Select
                      value={displayData?.genero || ''}
                      onValueChange={(value) => setEditedData(displayData ? { ...displayData, genero: value } : null)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="M">Masculino</SelectItem>
                        <SelectItem value="F">Femenino</SelectItem>
                        <SelectItem value="O">Otro</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <p className="mt-1 font-semibold">
                      {displayData?.genero === 'M' ? 'Masculino' : displayData?.genero === 'F' ? 'Femenino' : displayData?.genero === 'O' ? 'Otro' : 'N/A'}
                    </p>
                  )}
                </div>
                <div>
                  <Label>Fecha de Nacimiento</Label>
                  {isEditing ? (
                    <Input
                      type="date"
                      value={displayData?.fecha_nacimiento ? (displayData.fecha_nacimiento.includes('T') ? displayData.fecha_nacimiento.split('T')[0] : displayData.fecha_nacimiento) : ''}
                      onChange={(e) => setEditedData(displayData ? { ...displayData, fecha_nacimiento: e.target.value } : null)}
                    />
                  ) : (
                    <p className="mt-1 font-semibold">{formatDate(displayData?.fecha_nacimiento) || 'N/A'}</p>
                  )}
                </div>
                <div>
                  <Label>Tipo de Documento</Label>
                  {isEditing ? (
                    <Select
                      value={displayData?.tipo_documento || ''}
                      onValueChange={(value) => setEditedData(displayData ? { ...displayData, tipo_documento: value } : null)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="DNI">DNI</SelectItem>
                        <SelectItem value="PAS">Pasaporte</SelectItem>
                        <SelectItem value="LE">Libreta de Enrolamiento</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <p className="mt-1 font-semibold">{displayData?.tipo_documento || 'N/A'}</p>
                  )}
                </div>
                <div>
                  <Label>Número de Documento</Label>
                  {isEditing ? (
                    <Input
                      value={displayData?.numero_documento || ''}
                      onChange={(e) => setEditedData(displayData ? { ...displayData, numero_documento: e.target.value } : null)}
                    />
                  ) : (
                    <p className="mt-1 font-semibold">{displayData?.numero_documento || 'N/A'}</p>
                  )}
                </div>
                <div>
                  <Label>Departamento</Label>
                  {isEditing ? (
                    <Select
                      value={selectedDepartamento}
                      onValueChange={(value) => {
                        setSelectedDepartamento(value)
                        setSelectedMunicipio('')
                        setSelectedLocalidad('')
                      }}
                      disabled={loadingGeo}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar departamento" />
                      </SelectTrigger>
                      <SelectContent>
                        {departamentos.map((depto) => (
                          <SelectItem key={depto.id} value={depto.id.toString()}>
                            {depto.nombre}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <p className="mt-1 font-semibold">{displayData?.departamento || 'N/A'}</p>
                  )}
                </div>
                <div>
                  <Label>Municipio</Label>
                  {isEditing ? (
                    <Select
                      value={selectedMunicipio}
                      onValueChange={(value) => {
                        setSelectedMunicipio(value)
                        setSelectedLocalidad('')
                      }}
                      disabled={loadingGeo || !selectedDepartamento}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar municipio" />
                      </SelectTrigger>
                      <SelectContent>
                        {municipios.map((mun) => (
                          <SelectItem key={mun.id} value={mun.id.toString()}>
                            {mun.nombre}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <p className="mt-1 font-semibold">{displayData?.municipio || 'N/A'}</p>
                  )}
                </div>
                <div>
                  <Label>Localidad</Label>
                  {isEditing ? (
                    <Select
                      value={selectedLocalidad}
                      onValueChange={(value) => setSelectedLocalidad(value)}
                      disabled={loadingGeo || (!selectedMunicipio && !selectedDepartamento)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar localidad" />
                      </SelectTrigger>
                      <SelectContent>
                        {localidades.map((loc) => (
                          <SelectItem key={loc.id} value={loc.id.toString()}>
                            {loc.nombre}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <p className="mt-1 font-semibold">{displayData?.localidad || 'N/A'}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="permisos" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-[#222A59]">Rol y Permisos</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label>Rol Asignado</Label>
                  <div className="mt-2">
                    <Badge className={getRolColor(displayData?.rol_detalle?.nombre)}>
                      <Shield className="h-3 w-3 mr-1" />
                      {displayData?.rol_detalle?.nombre || 'Sin rol'}
                    </Badge>
                    {displayData?.rol_detalle?.descripcion && (
                      <p className="text-sm text-muted-foreground mt-2">
                        {displayData.rol_detalle.descripcion}
                      </p>
                    )}
                  </div>
                </div>
                {displayData?.rol_detalle && (
                  <div>
                    <Label>Permisos del Rol</Label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                      <div className="p-3 border rounded-lg">
                        <p className="text-sm font-medium">Gestión de Empresas</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Crear: {displayData.rol_detalle.puede_crear_empresas ? 'Sí' : 'No'} | 
                          Editar: {displayData.rol_detalle.puede_editar_empresas ? 'Sí' : 'No'} | 
                          Eliminar: {displayData.rol_detalle.puede_eliminar_empresas ? 'Sí' : 'No'}
                        </p>
                      </div>
                      <div className="p-3 border rounded-lg">
                        <p className="text-sm font-medium">Otros Permisos</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Ver Auditoría: {displayData.rol_detalle.puede_ver_auditoria ? 'Sí' : 'No'} | 
                          Exportar: {displayData.rol_detalle.puede_exportar_datos ? 'Sí' : 'No'} | 
                          Gestionar Usuarios: {displayData.rol_detalle.puede_gestionar_usuarios ? 'Sí' : 'No'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="historial" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-[#222A59]">Historial de Actividad</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Fecha de Registro</Label>
                  <p className="mt-1 font-semibold">{formatDate(displayData?.date_joined) || 'N/A'}</p>
                </div>
                <div>
                  <Label>Último Acceso</Label>
                  <p className="mt-1 font-semibold">
                    {displayData?.last_login ? formatDate(displayData.last_login) : 'Nunca'}
                  </p>
                </div>
                <div>
                  <Label>Estado de la Cuenta</Label>
                  <div className="mt-2">
                    <Badge className={displayData?.is_active ? "bg-[#C3C840] text-[#222A59]" : "bg-gray-400 text-white"}>
                      {displayData?.is_active ? 'Activa' : 'Inactiva'}
                    </Badge>
                    {displayData?.is_staff && (
                      <Badge className="bg-blue-500 text-white ml-2">Staff</Badge>
                    )}
                    {displayData?.is_superuser && (
                      <Badge className="bg-purple-500 text-white ml-2">Superusuario</Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  )
}
