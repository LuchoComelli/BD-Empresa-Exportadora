"use client"

import { useState, useEffect, use } from "react"
import { useRouter } from "next/navigation"
import { MainLayout } from "@/components/layout/main-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Edit, Save, X, Loader2, Mail, Phone, Shield, User, Calendar } from "lucide-react"
import Link from "next/link"
import api from "@/lib/api"
import { Skeleton } from "@/components/ui/skeleton"

interface Usuario {
  id: number
  email: string
  nombre: string
  apellido: string
  rol?: number
  rol_detalle?: {
    id: number
    nombre: string
    descripcion?: string
  }
  is_active: boolean
  is_staff?: boolean
  is_superuser?: boolean
  date_joined?: string
  last_login?: string
  telefono?: string
  fecha_nacimiento?: string
  genero?: string
  tipo_documento?: string
  numero_documento?: string
  departamento?: string
  municipio?: string
  localidad?: string
}

interface Provincia {
  id: string
  nombre: string
  nombre_completo?: string
}

interface Departamento {
  id: string
  nombre: string
  nombre_completo?: string
  provincia: string
  provincia_nombre?: string
}

interface Municipio {
  id: string
  nombre: string
  nombre_completo?: string
  provincia: string
  provincia_nombre?: string
  departamento?: string
  departamento_nombre?: string
}

interface Localidad {
  id: string
  nombre: string
  provincia: string
  provincia_nombre?: string
  departamento: string
  departamento_nombre?: string
  municipio?: string
  municipio_nombre?: string
}

interface Rol {
  id: number
  nombre: string
  descripcion?: string
}

export default function UsuarioProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const resolvedParams = use(params)
  const [usuario, setUsuario] = useState<Usuario | null>(null)
  const [roles, setRoles] = useState<Rol[]>([])
  const [loading, setLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [editedData, setEditedData] = useState<Usuario | null>(null)
  const [saving, setSaving] = useState(false)
  
  // Estados para datos geográficos
  const [provincias, setProvincias] = useState<Provincia[]>([])
  const [departamentos, setDepartamentos] = useState<Departamento[]>([])
  const [municipios, setMunicipios] = useState<Municipio[]>([])
  const [localidades, setLocalidades] = useState<Localidad[]>([])
  const [selectedProvincia, setSelectedProvincia] = useState<string>('')
  const [selectedDepartamento, setSelectedDepartamento] = useState<string>('')
  const [selectedMunicipio, setSelectedMunicipio] = useState<string>('')
  const [selectedLocalidad, setSelectedLocalidad] = useState<string>('')
  const [loadingGeo, setLoadingGeo] = useState(false)
  const [provinciaSearched, setProvinciaSearched] = useState(false)

  // Cargar provincias al montar el componente
  useEffect(() => {
    const loadProvincias = async () => {
      try {
        setLoadingGeo(true)
        const data = await api.getProvincias()
        const provinciasArray = Array.isArray(data) ? data : (data.results || data)
        setProvincias(provinciasArray || [])
        // Si solo hay una provincia, seleccionarla automáticamente
        if (provinciasArray && provinciasArray.length === 1) {
          setSelectedProvincia(provinciasArray[0].id)
        }
      } catch (error) {
        console.error('Error cargando provincias:', error)
        setProvincias([])
      } finally {
        setLoadingGeo(false)
      }
    }
    loadProvincias()
    loadUsuario()
    loadRoles()
  }, [resolvedParams.id])
  
  // Cargar departamentos cuando se selecciona una provincia
  useEffect(() => {
    const loadDepartamentos = async () => {
      if (!selectedProvincia) {
        setDepartamentos([])
        setMunicipios([])
        setLocalidades([])
        return
      }
      try {
        setLoadingGeo(true)
        const data = await api.getDepartamentosPorProvincia(selectedProvincia)
        const departamentosArray = Array.isArray(data) ? data : (data.results || data)
        setDepartamentos(departamentosArray || [])
        
        // Si el usuario tiene datos geográficos, intentar encontrar el departamento
        if (usuario?.departamento && departamentosArray.length > 0) {
          const depto = departamentosArray.find((d: any) => 
            d.nombre === usuario.departamento || 
            d.nombre_completo === usuario.departamento
          )
          if (depto) {
            setSelectedDepartamento(depto.id.toString())
          } else {
            // Limpiar selecciones dependientes solo si no encontramos el departamento
            setSelectedDepartamento('')
            setSelectedMunicipio('')
            setSelectedLocalidad('')
            setMunicipios([])
            setLocalidades([])
          }
        } else {
          // Limpiar selecciones dependientes
          setSelectedDepartamento('')
          setSelectedMunicipio('')
          setSelectedLocalidad('')
          setMunicipios([])
          setLocalidades([])
        }
      } catch (error) {
        console.error('Error cargando departamentos:', error)
        setDepartamentos([])
      } finally {
        setLoadingGeo(false)
      }
    }
    loadDepartamentos()
  }, [selectedProvincia, usuario])
  
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
        // Limpiar selección de localidad
        setSelectedMunicipio('')
        setSelectedLocalidad('')
        
        // Si no hay municipios, cargar localidades directamente por departamento
        if (!municipiosArray || municipiosArray.length === 0) {
          try {
            const localidadesData = await api.getLocalidadesPorDepartamento(selectedDepartamento)
            const localidadesArray = Array.isArray(localidadesData) ? localidadesData : (localidadesData.results || localidadesData)
            setLocalidades(localidadesArray || [])
          } catch (error) {
            console.error('Error cargando localidades por departamento:', error)
            setLocalidades([])
          }
        } else {
          setLocalidades([])
          
          // Si el usuario tiene datos geográficos, intentar encontrar el municipio
          if (usuario?.municipio && municipiosArray.length > 0) {
            const mun = municipiosArray.find((m: any) => 
              m.nombre === usuario.municipio || 
              m.nombre_completo === usuario.municipio
            )
            if (mun) {
              setSelectedMunicipio(mun.id.toString())
            }
          }
        }
      } catch (error) {
        console.error('Error cargando municipios:', error)
        setMunicipios([])
        setLocalidades([])
      } finally {
        setLoadingGeo(false)
      }
    }
    loadMunicipios()
  }, [selectedDepartamento])
  
  // Cargar localidades cuando se selecciona un municipio
  useEffect(() => {
    const loadLocalidades = async () => {
      if (!selectedMunicipio) {
        setLocalidades([])
        return
      }
      try {
        setLoadingGeo(true)
        const data = await api.getLocalidadesPorMunicipio(selectedMunicipio)
        const localidadesArray = Array.isArray(data) ? data : (data.results || data)
        setLocalidades(localidadesArray || [])
        // Limpiar selección de localidad
        setSelectedLocalidad('')
        
        // Si el usuario tiene datos geográficos, intentar encontrar la localidad
        if (usuario?.localidad && localidadesArray.length > 0) {
          const loc = localidadesArray.find((l: any) => l.nombre === usuario.localidad)
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
  }, [selectedMunicipio])

  const loadUsuario = async () => {
    try {
      setLoading(true)
      const data = await api.getUsuarioById(parseInt(resolvedParams.id))
      setUsuario(data)
      setEditedData(data)
      
      // Si el usuario tiene datos geográficos, intentar encontrar y seleccionar la provincia
      // Esto se hará después de que las provincias se carguen
      if (data.departamento && provincias.length > 0) {
        // Buscar la provincia basándose en el departamento del usuario
        // Primero necesitamos cargar los departamentos para encontrar la provincia
        // Esto se manejará en el useEffect de departamentos
      }
    } catch (error: any) {
      console.error("Error loading usuario:", error)
      alert("Error al cargar el usuario. Por favor, intenta nuevamente.")
      router.push("/dashboard/usuarios")
    } finally {
      setLoading(false)
    }
  }
  
  // Efecto para inicializar la selección geográfica cuando se carga el usuario
  useEffect(() => {
    const findProvinciaForUsuario = async () => {
      // Solo ejecutar si tenemos usuario, provincias cargadas, no hay provincia seleccionada y no hemos buscado ya
      if (!usuario || provincias.length === 0 || selectedProvincia || provinciaSearched) {
        return
      }
      
      setProvinciaSearched(true)
      
      // Si el usuario tiene departamento, buscar en qué provincia está
      if (usuario.departamento) {
        // Buscar en todas las provincias hasta encontrar el departamento
        for (const provincia of provincias) {
          try {
            const deptos = await api.getDepartamentosPorProvincia(provincia.id)
            const deptosArray = Array.isArray(deptos) ? deptos : (deptos.results || deptos)
            const found = deptosArray.find((d: any) => 
              d.nombre === usuario.departamento || 
              d.nombre_completo === usuario.departamento
            )
            if (found) {
              setSelectedProvincia(provincia.id)
              return // Salir del efecto
            }
          } catch (error) {
            console.error(`Error buscando departamento en provincia ${provincia.id}:`, error)
          }
        }
      }
      
      // Si no encontramos el departamento en ninguna provincia pero solo hay una, seleccionarla
      if (provincias.length === 1) {
        setSelectedProvincia(provincias[0].id)
      }
    }
    
    findProvinciaForUsuario()
  }, [usuario, provincias, selectedProvincia, provinciaSearched])

  const loadRoles = async () => {
    try {
      const response = await api.getRoles()
      let allRoles = []
      if (Array.isArray(response)) {
        allRoles = response
      } else if (response.results) {
        allRoles = response.results
      }
      // Filtrar solo roles Admin, Consultor y Analista (excluir Empresa)
      const dashboardRoles = allRoles.filter((rol: Rol) => 
        rol.nombre === 'Administrador' || 
        rol.nombre === 'Consultor' || 
        rol.nombre === 'Analista'
      )
      setRoles(dashboardRoles)
    } catch (error) {
      console.error("Error loading roles:", error)
    }
  }
  

  const handleEdit = () => {
    setIsEditing(true)
    setEditedData(usuario ? { ...usuario } : null)
  }

  const handleCancel = () => {
    setIsEditing(false)
    setEditedData(usuario ? { ...usuario } : null)
  }

  const handleSave = async () => {
    if (!editedData || !usuario) return

    try {
      setSaving(true)
      
      // Obtener nombres de los elementos seleccionados
      const deptoNombre = selectedDepartamento 
        ? departamentos.find(d => d.id.toString() === selectedDepartamento)?.nombre || null
        : null
      const munNombre = selectedMunicipio
        ? municipios.find(m => m.id.toString() === selectedMunicipio)?.nombre || null
        : null
      const locNombre = selectedLocalidad
        ? localidades.find(l => l.id.toString() === selectedLocalidad)?.nombre || null
        : null
      
      const updateData: any = {
        email: editedData.email,
        nombre: editedData.nombre,
        apellido: editedData.apellido,
        rol: editedData.rol || null,
        telefono: editedData.telefono || null,
        genero: editedData.genero || null,
        tipo_documento: editedData.tipo_documento || null,
        numero_documento: editedData.numero_documento || null,
        departamento: deptoNombre,
        municipio: munNombre,
        localidad: locNombre,
      }

      if (editedData.fecha_nacimiento) {
        updateData.fecha_nacimiento = editedData.fecha_nacimiento
      }

      const updated = await api.updateUsuario(usuario.id, updateData)
      setUsuario(updated)
      setEditedData(updated)
      setIsEditing(false)
      alert("Usuario actualizado exitosamente")
    } catch (error: any) {
      console.error("Error saving usuario:", error)
      alert(error.message || "Error al guardar los cambios. Por favor, intenta nuevamente.")
    } finally {
      setSaving(false)
    }
  }

  const handleToggleActive = async () => {
    if (!usuario) return

    if (!confirm(`¿Estás seguro de que deseas ${usuario.is_active ? 'desactivar' : 'activar'} a ${usuario.nombre} ${usuario.apellido}?`)) {
      return
    }

    try {
      setSaving(true)
      await api.toggleActiveUsuario(usuario.id)
      await loadUsuario()
      alert(`Usuario ${usuario.is_active ? 'desactivado' : 'activado'} exitosamente`)
    } catch (error: any) {
      console.error("Error toggling active:", error)
      alert(error.message || "Error al cambiar el estado del usuario. Por favor, intenta nuevamente.")
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
      return new Date(dateString).toLocaleDateString("es-AR", {
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

  if (!usuario) {
    return (
      <MainLayout>
        <div className="text-center py-12">
          <p className="text-[#6B7280]">No se encontró el usuario</p>
          <Link href="/dashboard/usuarios">
            <Button className="mt-4">Volver</Button>
          </Link>
        </div>
      </MainLayout>
    )
  }

  const displayData = isEditing ? editedData : usuario

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4 flex-wrap">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard/usuarios">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl md:text-3xl font-bold text-[#222A59]">Perfil de Usuario</h1>
            <p className="text-sm md:text-base text-muted-foreground mt-1">
              {usuario.nombre} {usuario.apellido}
            </p>
          </div>
          <div className="flex gap-2">
            {!isEditing ? (
              <>
                <Button onClick={handleEdit} variant="outline" className="gap-2">
                  <Edit className="h-4 w-4" />
                  Editar
                </Button>
                <Button 
                  onClick={handleToggleActive} 
                  variant="outline"
                  className={usuario.is_active ? "text-destructive" : "text-green-600"}
                  disabled={saving}
                >
                  {saving ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : null}
                  {usuario.is_active ? 'Desactivar' : 'Activar'}
                </Button>
              </>
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
                  {isEditing ? (
                    <Input
                      type="email"
                      value={displayData?.email || ''}
                      onChange={(e) => setEditedData(displayData ? { ...displayData, email: e.target.value } : null)}
                    />
                  ) : (
                    <p className="mt-1 font-semibold">{displayData?.email || 'N/A'}</p>
                  )}
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
                      value={displayData?.fecha_nacimiento || ''}
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
                  <Label>Provincia</Label>
                  {isEditing ? (
                    <Select
                      value={selectedProvincia}
                      onValueChange={(value) => {
                        setSelectedProvincia(value)
                        setSelectedDepartamento('')
                        setSelectedMunicipio('')
                        setSelectedLocalidad('')
                      }}
                      disabled={loadingGeo}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar provincia" />
                      </SelectTrigger>
                      <SelectContent>
                        {provincias.map((prov) => (
                          <SelectItem key={prov.id} value={prov.id}>
                            {prov.nombre}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <p className="mt-1 font-semibold">
                      {provincias.find(p => p.id === selectedProvincia)?.nombre || 'N/A'}
                    </p>
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
                      disabled={loadingGeo || !selectedProvincia}
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
                  {isEditing ? (
                    <Select
                      value={displayData?.rol?.toString() || ''}
                      onValueChange={(value) => setEditedData(displayData ? { ...displayData, rol: parseInt(value) } : null)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar rol" />
                      </SelectTrigger>
                      <SelectContent>
                        {roles.map((rol) => (
                          <SelectItem key={rol.id} value={rol.id.toString()}>
                            {rol.nombre}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
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
                  )}
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

