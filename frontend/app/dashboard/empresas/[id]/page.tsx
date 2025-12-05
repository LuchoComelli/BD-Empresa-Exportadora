
"use client"

import { useState, useEffect, use, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { MainLayout } from "@/components/layout/main-layout"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Edit, Save, X, Download, Loader2, Building2, Mail, Phone, MapPin, Globe } from "lucide-react"
import Link from "next/link"
import api from "@/lib/api"
import { Skeleton } from "@/components/ui/skeleton"
import { CompanyMap } from "@/components/map/company-map"
import { LocationPicker } from "@/components/map/location-picker"
import { useToast } from "@/hooks/use-toast"
import { ExportEmpresaDialog } from "@/components/empresas/export-empresa-dialog"

interface Empresa {
  id: number
  razon_social: string
  nombre_fantasia?: string
  cuit_cuil: string
  tipo_sociedad?: string
  tipo_empresa?: string
  tipo_empresa_valor?: string
  tipo_empresa_detalle?: any
  estado?: string
  direccion?: string
  codigo_postal?: string
  direccion_comercial?: string
  codigo_postal_comercial?: string
  departamento: string
  municipio?: string
  localidad?: string
  departamento_nombre?: string
  municipio_nombre?: string
  localidad_nombre?: string
  telefono?: string
  correo?: string
  sitioweb?: string
  exporta?: string
  categoria_matriz?: string
  destinoexporta?: string
  importa?: boolean
  interes_exportar?: boolean
  certificadopyme?: boolean
  certificaciones?: string
  promo2idiomas?: boolean
  idiomas_trabaja?: string
  observaciones?: string
  geolocalizacion?: string
  id_rubro?: any
  id_subrubro?: any
  rubro_nombre?: string
  sub_rubro_nombre?: string 
  rubro_detalle?: any
  productos?: any[]
  servicios?: any[]
  instagram?: string
  facebook?: string
  linkedin?: string
  contacto_principal_nombre?: string
  contacto_principal_cargo?: string
  contacto_principal_telefono?: string
  contacto_principal_email?: string
  fecha_creacion?: string
  fecha_actualizacion?: string
  rubro_producto_nombre?: string 
  rubro_servicio_nombre?: string
  actividades_promocion_internacional?: any[]
}

function EmpresaProfileContent({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const resolvedParams = use(params)
  const [empresa, setEmpresa] = useState<Empresa | null>(null)
  const [loading, setLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [editedData, setEditedData] = useState<Empresa | null>(null)
  const [saving, setSaving] = useState(false)
  const [showExportDialog, setShowExportDialog] = useState(false)

  // Estados para selectores dinámicos
  const [departamentos, setDepartamentos] = useState<any[]>([])
  const [municipios, setMunicipios] = useState<any[]>([])
  const [localidades, setLocalidades] = useState<any[]>([])
  const [rubros, setRubros] = useState<any[]>([])
  const [subRubros, setSubRubros] = useState<any[]>([])
  const [loadingGeo, setLoadingGeo] = useState(false)
  const [loadingRubros, setLoadingRubros] = useState(false)

  // Estado para centrar el mapa
  const [mapCenter, setMapCenter] = useState<{ lat: number | null; lng: number | null; zoom: number }>({
    lat: -28.2,
    lng: -66.0,
    zoom: 8
  })

  useEffect(() => {
    loadEmpresa()
  }, [resolvedParams.id])

  useEffect(() => {
    const editParam = searchParams?.get('edit')
    if (editParam === 'true') {
      setIsEditing(true)
    }
  }, [searchParams])

  // Cargar datos iniciales
  useEffect(() => {
    loadDepartamentosData()
    loadRubrosData()
  }, [])

  // Cargar municipios cuando cambia departamento en edición
  useEffect(() => {
    if (isEditing && editedData?.departamento) {
      const deptId = typeof editedData.departamento === 'object' 
        ? editedData.departamento.id 
        : editedData.departamento
      if (deptId) {
        loadMunicipiosData(deptId)
      }
    }
  }, [isEditing, editedData?.departamento])

  // Cargar localidades cuando cambia municipio en edición
  useEffect(() => {
    if (isEditing && editedData?.municipio) {
      const munId = typeof editedData.municipio === 'object'
        ? editedData.municipio.id
        : editedData.municipio
      if (munId) {
        loadLocalidadesData(munId)
      }
    }
  }, [isEditing, editedData?.municipio])

  // Cargar subrubros cuando cambia rubro en edición
  useEffect(() => {
  if (isEditing && editedData?.id_rubro) {
    const rubroId = typeof editedData.id_rubro === 'object'
      ? editedData.id_rubro.id
      : editedData.id_rubro
    if (rubroId) {
      console.log('🔵 [useEffect] Cargando subrubros para rubro:', rubroId)
      loadSubRubrosData(rubroId)
    }
  }
}, [isEditing, editedData?.id_rubro])

// 6. DEBUGGING TEMPORAL - Agregar esto al componente para ver el estado
useEffect(() => {
  if (isEditing) {
    console.log('=== DEBUG ESTADO EDICIÓN ===')
    console.log('editedData:', editedData)
    console.log('editedData.id_rubro:', editedData?.id_rubro)
    console.log('editedData.sub_rubro:', editedData?.sub_rubro)
    console.log('subRubros disponibles:', subRubros)
    console.log('subRubros.length:', subRubros.length)
    console.log('================================')
  }
}, [isEditing, editedData, subRubros])


  const loadEmpresa = async () => {
    try {
      setLoading(true)
      const empresaId = parseInt(resolvedParams.id)
      const data = await api.getEmpresaById(empresaId)

          // ✅ AGREGAR ESTE DEBUG
    console.log('=== DEBUG EMPRESA ===')
    console.log('Empresa completa:', data)
    console.log('Productos:', data.productos)
    data.productos?.forEach((prod: any, index: number) => {
      console.log(`Producto ${index + 1}:`, prod.nombre_producto)
      console.log(`  - Posición arancelaria:`, prod.posicion_arancelaria)
    })
    console.log('=====================')
      
      if (!data || !data.id) {
        toast({
          title: "Empresa no encontrada",
          description: "No se encontró la empresa con el ID especificado",
          variant: "destructive",
        })
        router.push('/dashboard/empresas')
        return
      }
      
      setEmpresa(data)
      setEditedData(data)
      
      const editParam = searchParams?.get('edit')
      if (editParam === 'true') {
        setIsEditing(true)
      }
    } catch (error: any) {
      console.error("[Empresa Detail] Error loading empresa:", error)
      toast({
        title: "Error al cargar la empresa",
        description: error.message || 'Error desconocido',
        variant: "destructive",
      })
      router.push('/dashboard/empresas')
    } finally {
      setLoading(false)
    }
  }

  const loadDepartamentosData = async () => {
  try {
    const data = await api.getDepartamentos()
    // Manejar respuesta paginada o array directo
    const departamentosArray = Array.isArray(data) ? data : (data?.results || [])
    setDepartamentos(departamentosArray)
  } catch (error) {
    console.error('Error loading departamentos:', error)
  }
}

  const loadMunicipiosData = async (departamentoId: any) => {
  try {
    setLoadingGeo(true)
    const data = await api.getMunicipiosPorDepartamento(departamentoId)
    
    // Manejar respuesta paginada o array directo
    const municipiosArray = Array.isArray(data) ? data : (data?.results || [])
    setMunicipios(municipiosArray)
    
    // Actualizar centro del mapa
    const dept = departamentos.find(d => d.id === departamentoId)
    if (dept?.centroide_lat && dept?.centroide_lon) {
      setMapCenter({
        lat: parseFloat(dept.centroide_lat),
        lng: parseFloat(dept.centroide_lon),
        zoom: 11
      })
    }
  } catch (error) {
    console.error('Error loading municipios:', error)
  } finally {
    setLoadingGeo(false)
  }
}

  const loadLocalidadesData = async (municipioId: any) => {
  try {
    setLoadingGeo(true)
    const data = await api.getLocalidadesPorMunicipio(municipioId)
    
    // Manejar respuesta paginada o array directo
    const localidadesArray = Array.isArray(data) ? data : (data?.results || [])
    setLocalidades(localidadesArray)
    
    // Actualizar centro del mapa
    const mun = municipios.find(m => m.id === municipioId)
    if (mun?.centroide_lat && mun?.centroide_lon) {
      setMapCenter({
        lat: parseFloat(mun.centroide_lat),
        lng: parseFloat(mun.centroide_lon),
        zoom: 13
      })
    }
  } catch (error) {
    console.error('Error loading localidades:', error)
  } finally {
    setLoadingGeo(false)
  }
}

  const loadRubrosData = async () => {
  try {
    setLoadingRubros(true)
    const data = await api.getRubros()
    console.log('✅ [loadRubrosData] Rubros cargados (raw):', data)
    
    // El API puede devolver un array directamente O un objeto con { results: [...] }
    const rubrosArray = Array.isArray(data) ? data : (data?.results || [])
    console.log('✅ [loadRubrosData] Rubros array:', rubrosArray.length, rubrosArray)
    
    setRubros(rubrosArray)
  } catch (error) {
    console.error('❌ [loadRubrosData] Error loading rubros:', error)
  } finally {
    setLoadingRubros(false)
  }
}

  const loadSubRubrosData = async (rubroId: any) => {
  try {
    setLoadingRubros(true)
    console.log('🔍 [loadSubRubrosData] Cargando subrubros para rubro:', rubroId)
    const data = await api.getSubRubrosPorRubro(rubroId)
    console.log('✅ [loadSubRubrosData] SubRubros cargados (raw):', data)
    
    const subRubrosArray = Array.isArray(data) ? data : (data?.results || [])
    console.log('✅ [loadSubRubrosData] SubRubros array:', subRubrosArray.length, subRubrosArray)
    
    setSubRubros(subRubrosArray)
  } catch (error) {
    console.error('❌ [loadSubRubrosData] Error loading subrubros:', error)
    setSubRubros([])
  } finally {
    setLoadingRubros(false)
  }
}

  const handleEdit = () => {
  console.log('🔵 [handleEdit] INICIANDO EDICIÓN')
  console.log('🔵 [handleEdit] empresa:', empresa)
  
  setIsEditing(true)
  
  if (empresa) {
    console.log('🔵 [handleEdit] Copiando datos de empresa a editedData')
    setEditedData({ ...empresa })
    
    // Cargar municipios si hay departamento
    if (empresa.departamento) {
      const deptoId = typeof empresa.departamento === 'object' 
        ? empresa.departamento.id 
        : empresa.departamento
      if (deptoId) {
        console.log('🔵 [handleEdit] Cargando municipios para depto:', deptoId)
        loadMunicipiosData(deptoId)
      }
    }
    
    // Cargar localidades si hay municipio
    if (empresa.municipio) {
      const munId = typeof empresa.municipio === 'object'
        ? empresa.municipio.id
        : empresa.municipio
      if (munId) {
        console.log('🔵 [handleEdit] Cargando localidades para municipio:', munId)
        loadLocalidadesData(munId)
      }
    }
    
    // ⭐ CRÍTICO: Cargar subrubros si hay rubro
    if (empresa.id_rubro) {
      const rubroId = typeof empresa.id_rubro === 'object'
        ? empresa.id_rubro.id
        : empresa.id_rubro
      if (rubroId) {
        console.log('🔵 [handleEdit] Cargando subrubros para rubro:', rubroId)
        loadSubRubrosData(rubroId)
      }
    }
  }
  
  console.log('🔵 [handleEdit] EDICIÓN INICIADA')
}

  const handleCancel = () => {
    setIsEditing(false)
    setEditedData(empresa ? { ...empresa } : null)
  }

  const handleSave = async () => {
  if (!editedData || !empresa) return

  try {
    setSaving(true)
    
    console.log('📤 [handleSave] editedData COMPLETO:', editedData)
    console.log('📤 [handleSave] editedData.sub_rubro:', editedData.sub_rubro)
    console.log('📤 [handleSave] typeof sub_rubro:', typeof editedData.sub_rubro)
    
    // Normalizar datos antes de enviar
    const dataToSend = {
      ...editedData,
      // Normalizar relaciones a IDs
      departamento: typeof editedData.departamento === 'object' 
        ? editedData.departamento.id 
        : editedData.departamento,
      municipio: editedData.municipio 
        ? (typeof editedData.municipio === 'object' 
            ? editedData.municipio.id 
            : editedData.municipio)
        : null,
      localidad: editedData.localidad 
        ? (typeof editedData.localidad === 'object' 
            ? editedData.localidad.id 
            : editedData.localidad)
        : null,
id_rubro: typeof editedData.id_rubro === 'object' 
  ? editedData.id_rubro.id 
  : editedData.id_rubro,

// ⭐ CRÍTICO: Normalizar id_subrubro (NO sub_rubro)
id_subrubro: editedData.id_subrubro 
  ? (typeof editedData.id_subrubro === 'object' 
      ? editedData.id_subrubro.id 
      : editedData.id_subrubro)
  : null,
      
      // Limpiar productos/servicios temporales
      productos: editedData.productos?.map(p => {
        if (String(p.id).startsWith('temp-')) {
          const { id, ...productoSinId } = p
          return productoSinId
        }
        return p
      }),
      servicios: editedData.servicios?.map(s => {
        if (String(s.id).startsWith('temp-')) {
          const { id, ...servicioSinId } = s
          return servicioSinId
        }
        return s
      }),
      servicios_ofrecidos: editedData.servicios_ofrecidos?.map((s: any) => {
        if (String(s.id).startsWith('temp-')) {
          const { id, ...servicioSinId } = s
          return servicioSinId
        }
        return s
      }),
    }
    
    console.log('📤 [handleSave] dataToSend COMPLETO:', dataToSend)
    console.log('📤 [handleSave] dataToSend.id_subrubro:', dataToSend.id_subrubro)
    console.log('📤 [handleSave] dataToSend.id_rubro:', dataToSend.id_rubro)
    
    const updated = await api.updateEmpresa(empresa.id, dataToSend)
    
    console.log('✅ [handleSave] Respuesta del servidor:', updated)
    
    setEmpresa(updated)
    setEditedData(updated)
    setIsEditing(false)
    toast({
      title: "Cambios guardados",
      description: "Los cambios se han guardado exitosamente",
      variant: "default",
    })
  } catch (error: any) {
    console.error("❌ [handleSave] Error saving empresa:", error)
    console.error("❌ [handleSave] Error message:", error.message)
    toast({
      title: "Error al guardar",
      description: error.message || "Error al guardar los cambios. Por favor, intenta nuevamente.",
      variant: "destructive",
    })
  } finally {
    setSaving(false)
  }
}

  const getCategoryFromEmpresa = (empresa: Empresa): "Exportadora" | "Potencial Exportadora" | "Etapa Inicial" => {
    // Priorizar categoria_matriz si está disponible
    if (empresa.categoria_matriz) {
      return empresa.categoria_matriz as "Exportadora" | "Potencial Exportadora" | "Etapa Inicial"
    }
    // Fallback al campo exporta (legacy)
    if (empresa.exporta === 'Sí' || empresa.exporta === 'si') return "Exportadora"
    if (empresa.exporta === 'En proceso' || empresa.exporta === 'en-proceso') return "Potencial Exportadora"
    return "Etapa Inicial"
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "Exportadora":
        return "bg-[#C3C840] text-[#222A59]"
      case "Potencial Exportadora":
        return "bg-[#C0217E] text-white"
      case "Etapa Inicial":
        return "bg-[#629BD2] text-white"
      default:
        return "bg-muted text-foreground"
    }
  }

  const formatFormaContratacion = (val: any) => {
    if (!val && val !== 0) return null
    const v = typeof val === 'string' ? val.toLowerCase() : String(val).toLowerCase()
    switch (v) {
      case 'hora':
      case 'por hora':
        return 'Por Hora'
      case 'proyecto':
      case 'por proyecto':
        return 'Por Proyecto'
      case 'mensual':
        return 'Mensual'
      case 'otro':
        return 'Otro'
      default:
        return String(val)
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
              <Skeleton className="h-48 w-full" />
            </div>
          </div>
        </div>
      </MainLayout>
    )
  }

  if (!empresa) {
    return (
      <MainLayout>
        <div className="text-center py-12">
          <p className="text-[#6B7280]">No se encontró la empresa</p>
          <Link href="/dashboard/empresas">
            <Button className="mt-4">Volver</Button>
          </Link>
        </div>
      </MainLayout>
    )
  }

  const category = getCategoryFromEmpresa(empresa)
  const displayData = isEditing ? editedData : empresa



  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 md:gap-4 flex-wrap">
          <Button variant="ghost" size="icon" asChild className="flex-shrink-0">
            <Link href="/dashboard/empresas">
              <ArrowLeft className="h-4 w-4 md:h-5 md:w-5" />
            </Link>
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-[#222A59] break-words">Perfil de Empresa</h1>
            <p className="text-xs md:text-sm lg:text-base text-muted-foreground mt-1 break-words">
              {empresa?.razon_social || 'Cargando...'}
            </p>
            {empresa?.id && (
              <p className="text-xs text-muted-foreground mt-1">ID: {empresa.id}</p>
            )}
          </div>
          <div className="flex flex-wrap gap-2 w-full sm:w-auto">
            {!isEditing ? (
              <>
                <Button onClick={handleEdit} variant="outline" className="gap-2 text-xs md:text-sm">
                  <Edit className="h-3 w-3 md:h-4 md:w-4" />
                  <span className="hidden sm:inline">Editar</span>
                </Button>
                <Button 
                  variant="outline" 
                  className="gap-2"
                  onClick={() => setShowExportDialog(true)}
                >
                  <Download className="h-4 w-4" />
                  Exportar
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
                <div className="w-16 h-16 bg-[#3259B5]/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Building2 className="h-8 w-8 text-[#3259B5]" />
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-[#222A59]">{displayData?.razon_social}</h2>
                  <div className="flex flex-wrap items-center gap-3 mt-2">
                    <Badge className={getCategoryColor(category)}>{category}</Badge>
                    {(displayData?.rubro_nombre || displayData?.id_rubro) && (
                      <span className="text-sm text-muted-foreground">
                        {displayData.rubro_nombre || (typeof displayData.id_rubro === 'object' ? displayData.id_rubro.nombre : displayData.id_rubro) || 'N/A'}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-4 mt-4 text-sm text-muted-foreground">
                    {displayData?.direccion && (
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        <span>{displayData.direccion}</span>
                        {(displayData.departamento_nombre || displayData.departamento) && (
                          <span>, {displayData.departamento_nombre || (typeof displayData.departamento === 'object' ? displayData.departamento.nombre : displayData.departamento)}</span>
                        )}
                      </div>
                    )}
                    {displayData?.correo && (
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        <span>{displayData.correo}</span>
                      </div>
                    )}
                    {displayData?.telefono && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        <span>{displayData.telefono}</span>
                      </div>
                    )}
                    {displayData?.sitioweb && (
                      <div className="flex items-center gap-2">
                        <Globe className="h-4 w-4" />
                        <a href={displayData.sitioweb} target="_blank" rel="noopener noreferrer" className="text-[#3259B5] hover:underline">
                          {displayData.sitioweb}
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="general" className="space-y-6">
          <TabsList className="inline-flex w-full sm:w-auto overflow-x-auto gap-2 flex-nowrap">
  <TabsTrigger value="general" className="flex-shrink-0">Información General</TabsTrigger>
  <TabsTrigger value="ubicacion" className="flex-shrink-0">Ubicación</TabsTrigger>
  <TabsTrigger value="comercial" className="flex-shrink-0">Actividad Comercial</TabsTrigger>
  <TabsTrigger value="productos-servicios" className="flex-shrink-0">Productos/Servicios</TabsTrigger>
  <TabsTrigger value="certificaciones" className="flex-shrink-0">Certificaciones</TabsTrigger>
</TabsList>

          <TabsContent value="general" className="space-y-6">
  <Card>
    <CardHeader>
      <CardTitle className="text-[#222A59]">Datos de la Empresa</CardTitle>
    </CardHeader>
    <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Razón Social */}
      <div>
        <Label>Razón Social</Label>
        {isEditing ? (
          <Input
            value={editedData?.razon_social || ''}
            onChange={(e) => setEditedData(editedData ? { ...editedData, razon_social: e.target.value } : null)}
          />
        ) : (
          <p className="mt-1 font-semibold">{displayData?.razon_social}</p>
        )}
      </div>

      {/* Nombre de Fantasía */}
      <div>
        <Label>Nombre de Fantasía</Label>
        {isEditing ? (
          <Input
            value={editedData?.nombre_fantasia || ''}
            onChange={(e) => setEditedData(editedData ? { ...editedData, nombre_fantasia: e.target.value } : null)}
          />
        ) : (
          <p className="mt-1 font-semibold">{displayData?.nombre_fantasia || 'N/A'}</p>
        )}
      </div>

      {/* CUIT */}
      <div>
        <Label>CUIT</Label>
        {isEditing ? (
          <Input
            value={editedData?.cuit_cuil || ''}
            onChange={(e) => setEditedData(editedData ? { ...editedData, cuit_cuil: e.target.value } : null)}
          />
        ) : (
          <p className="mt-1 font-semibold">{displayData?.cuit_cuil}</p>
        )}
      </div>

      {/* Tipo de Sociedad */}
      <div>
        <Label>Tipo de Sociedad</Label>
        {isEditing ? (
          <Select
            value={editedData?.tipo_sociedad || ''}
            onValueChange={(value) => setEditedData(editedData ? { ...editedData, tipo_sociedad: value } : null)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecciona" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="S.A.">Sociedad Anónima (S.A.)</SelectItem>
              <SelectItem value="S.R.L.">Sociedad de Responsabilidad Limitada (S.R.L.)</SelectItem>
              <SelectItem value="S.C.S.">Sociedad en Comandita Simple (S.C.S.)</SelectItem>
              <SelectItem value="S.C.A.">Sociedad en Comandita por Acciones (S.C.A.)</SelectItem>
              <SelectItem value="S.C.">Sociedad Colectiva (S.C.)</SelectItem>
              <SelectItem value="A.E.">Asociación Empresaria (A.E.)</SelectItem>
              <SelectItem value="Monotributo">Monotributo</SelectItem>
              <SelectItem value="Otro">Otro</SelectItem>
            </SelectContent>
          </Select>
        ) : (
          <p className="mt-1 font-semibold">{displayData?.tipo_sociedad || 'N/A'}</p>
        )}
      </div>

      {/* Tipo de Empresa */}
      <div>
        <Label>Tipo de Empresa</Label>
        <p className="mt-1 font-semibold">
          {displayData?.tipo_empresa_detalle?.nombre || 
           displayData?.tipo_empresa_valor || 
           displayData?.tipo_empresa || 
           'N/A'}
        </p>
      </div>

      {/* Rubro */}
      <div>
        <Label>Rubro</Label>
        {isEditing ? (
          <Select
            value={editedData?.id_rubro ? String(typeof editedData.id_rubro === 'object' ? editedData.id_rubro.id : editedData.id_rubro) : ''}
            onValueChange={(value) => {
  console.log('🔵 [Rubro] Cambiando rubro a:', value)
  setEditedData(editedData ? { 
    ...editedData, 
    id_rubro: parseInt(value),
    id_subrubro: null  // ← LIMPIAR subrubro cuando cambia rubro
  } : null)
  loadSubRubrosData(parseInt(value))
}}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecciona un rubro" />
            </SelectTrigger>
            <SelectContent>
              {rubros.map((rubro) => (
                <SelectItem key={rubro.id} value={String(rubro.id)}>
                  {rubro.nombre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <p className="mt-1 font-semibold">
            {displayData?.rubro_nombre || 
             (typeof displayData?.id_rubro === 'object' ? displayData.id_rubro.nombre : displayData?.id_rubro) || 
             'N/A'}
          </p>
        )}
      </div>


        {/* SubRubro - NUEVO CAMPO */}
<div>
  <Label>SubRubro</Label>
  {isEditing ? (
    <Select
      value={editedData?.id_subrubro 
        ? String(typeof editedData.id_subrubro === 'object' ? editedData.id_subrubro.id : editedData.id_subrubro)
        : ''
      }
      onValueChange={(value) => {
        console.log('🔵 [SubRubro] Cambiando subrubro a:', value)
        setEditedData(editedData ? { 
          ...editedData, 
          id_subrubro: parseInt(value)
        } : null)
      }}
      disabled={loadingRubros || !editedData?.id_rubro || subRubros.length === 0}
    >
      <SelectTrigger>
        <SelectValue placeholder={
          loadingRubros 
            ? "Cargando..." 
            : !editedData?.id_rubro 
            ? "Selecciona primero un rubro" 
            : subRubros.length === 0 
            ? "No hay subrubros disponibles" 
            : "Selecciona un subrubro"
        } />
      </SelectTrigger>
      <SelectContent>
        {subRubros.length > 0 ? (
          subRubros.map((subRubro) => (
            <SelectItem key={subRubro.id} value={String(subRubro.id)}>
              {subRubro.nombre}
            </SelectItem>
          ))
        ) : (
          <SelectItem value="none" disabled>
            No hay subrubros disponibles
          </SelectItem>
        )}
      </SelectContent>
    </Select>
  ) : (
    <p className="mt-1 font-semibold">
      {displayData?.sub_rubro_nombre || 
       (typeof displayData?.id_subrubro === 'object' 
         ? displayData.id_subrubro.nombre 
         : displayData?.id_subrubro) || 
       'N/A'}
    </p>
  )}
</div>

      {/* Teléfono */}
      <div>
        <Label>Teléfono</Label>
        {isEditing ? (
          <Input
            value={editedData?.telefono || ''}
            onChange={(e) => setEditedData(editedData ? { ...editedData, telefono: e.target.value } : null)}
          />
        ) : (
          <p className="mt-1 font-semibold">{displayData?.telefono || 'N/A'}</p>
        )}
      </div>

      {/* Email */}
      <div>
        <Label>Email</Label>
        {isEditing ? (
          <Input
            type="email"
            value={editedData?.correo || ''}
            onChange={(e) => setEditedData(editedData ? { ...editedData, correo: e.target.value } : null)}
          />
        ) : (
          <p className="mt-1 font-semibold">{displayData?.correo || 'N/A'}</p>
        )}
      </div>

      {/* Sitio Web */}
      <div>
        <Label>Sitio Web</Label>
        {isEditing ? (
          <Input
            type="url"
            value={editedData?.sitioweb || ''}
            onChange={(e) => setEditedData(editedData ? { ...editedData, sitioweb: e.target.value } : null)}
          />
        ) : (
          <p className="mt-1 font-semibold">
            {displayData?.sitioweb ? (
              <a href={displayData.sitioweb} target="_blank" rel="noopener noreferrer" className="text-[#3259B5] hover:underline">
                {displayData.sitioweb}
              </a>
            ) : (
              'N/A'
            )}
          </p>
        )}
      </div>

      {/* Redes Sociales */}
      {(displayData?.instagram || displayData?.facebook || displayData?.linkedin || isEditing) && (
        <div className="md:col-span-2">
          <Label>Redes Sociales</Label>
          <div className="mt-2 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <span className="text-sm text-muted-foreground">Instagram</span>
              {isEditing ? (
                <Input
                  value={editedData?.instagram || ''}
                  onChange={(e) => setEditedData(editedData ? { ...editedData, instagram: e.target.value } : null)}
                  placeholder="usuario o URL"
                />
              ) : (
                displayData?.instagram ? (
                  <a href={displayData.instagram.startsWith('http') ? displayData.instagram : `https://instagram.com/${displayData.instagram}`} 
                     target="_blank" rel="noopener noreferrer" 
                     className="text-[#3259B5] hover:underline block mt-1">
                    {displayData.instagram}
                  </a>
                ) : (
                  <p className="mt-1 font-semibold">N/A</p>
                )
              )}
            </div>
            <div>
              <span className="text-sm text-muted-foreground">Facebook</span>
              {isEditing ? (
                <Input
                  value={editedData?.facebook || ''}
                  onChange={(e) => setEditedData(editedData ? { ...editedData, facebook: e.target.value } : null)}
                  placeholder="usuario o URL"
                />
              ) : (
                displayData?.facebook ? (
                  <a href={displayData.facebook.startsWith('http') ? displayData.facebook : `https://facebook.com/${displayData.facebook}`} 
                     target="_blank" rel="noopener noreferrer" 
                     className="text-[#3259B5] hover:underline block mt-1">
                    {displayData.facebook}
                  </a>
                ) : (
                  <p className="mt-1 font-semibold">N/A</p>
                )
              )}
            </div>
            <div>
              <span className="text-sm text-muted-foreground">LinkedIn</span>
              {isEditing ? (
                <Input
                  value={editedData?.linkedin || ''}
                  onChange={(e) => setEditedData(editedData ? { ...editedData, linkedin: e.target.value } : null)}
                  placeholder="usuario o URL"
                />
              ) : (
                displayData?.linkedin ? (
                  <a href={displayData.linkedin.startsWith('http') ? displayData.linkedin : `https://linkedin.com/company/${displayData.linkedin}`} 
                     target="_blank" rel="noopener noreferrer" 
                     className="text-[#3259B5] hover:underline block mt-1">
                    {displayData.linkedin}
                  </a>
                ) : (
                  <p className="mt-1 font-semibold">N/A</p>
                )
              )}
            </div>
          </div>
        </div>
      )}

      {/* Contacto Principal */}
      {(displayData?.contacto_principal_nombre || displayData?.contacto_principal_cargo || displayData?.contacto_principal_telefono || displayData?.contacto_principal_email || isEditing) && (
        <div className="md:col-span-2">
          <Label>Contacto Principal</Label>
          <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-muted/30 rounded-lg">
            <div>
              <span className="text-sm text-muted-foreground">Nombre</span>
              {isEditing ? (
                <Input
                  value={editedData?.contacto_principal_nombre || ''}
                  onChange={(e) => setEditedData(editedData ? { ...editedData, contacto_principal_nombre: e.target.value } : null)}
                />
              ) : (
                <p className="mt-1 font-semibold">{displayData?.contacto_principal_nombre || 'N/A'}</p>
              )}
            </div>
            <div>
              <span className="text-sm text-muted-foreground">Cargo</span>
              {isEditing ? (
                <Input
                  value={editedData?.contacto_principal_cargo || ''}
                  onChange={(e) => setEditedData(editedData ? { ...editedData, contacto_principal_cargo: e.target.value } : null)}
                />
              ) : (
                <p className="mt-1 font-semibold">{displayData?.contacto_principal_cargo || 'N/A'}</p>
              )}
            </div>
            <div>
              <span className="text-sm text-muted-foreground">Teléfono</span>
              {isEditing ? (
                <Input
                  value={editedData?.contacto_principal_telefono || ''}
                  onChange={(e) => setEditedData(editedData ? { ...editedData, contacto_principal_telefono: e.target.value } : null)}
                />
              ) : (
                <p className="mt-1 font-semibold">{displayData?.contacto_principal_telefono || 'N/A'}</p>
              )}
            </div>
            <div>
              <span className="text-sm text-muted-foreground">Email</span>
              {isEditing ? (
                <Input
                  type="email"
                  value={editedData?.contacto_principal_email || ''}
                  onChange={(e) => setEditedData(editedData ? { ...editedData, contacto_principal_email: e.target.value } : null)}
                />
              ) : (
                <p className="mt-1 font-semibold">{displayData?.contacto_principal_email || 'N/A'}</p>
              )}
            </div>
          </div>
        </div>
      )}
    </CardContent>
  </Card>
</TabsContent>

          <TabsContent value="ubicacion" className="space-y-6">
  <Card>
    <CardHeader>
      <CardTitle className="text-[#222A59]">Ubicación</CardTitle>
      <CardDescription>Dirección, código postal, departamento, municipio, localidad y geolocalización</CardDescription>
    </CardHeader>
    <CardContent className="space-y-6">
      {/* Domicilio del Establecimiento Productivo */}
      <div>
        <h3 className="text-lg font-semibold mb-3">Domicilio del Establecimiento Productivo</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Dirección */}
          <div>
            <Label>Dirección</Label>
            {isEditing ? (
              <Input
                value={editedData?.direccion || ''}
                onChange={(e) => setEditedData(editedData ? { ...editedData, direccion: e.target.value } : null)}
                placeholder="Calle y número"
              />
            ) : (
              <p className="mt-1 font-semibold">{displayData?.direccion || 'N/A'}</p>
            )}
          </div>

          {/* Código Postal */}
          <div>
            <Label>Código Postal</Label>
            {isEditing ? (
              <Input
                value={editedData?.codigo_postal || ''}
                onChange={(e) => setEditedData(editedData ? { ...editedData, codigo_postal: e.target.value } : null)}
                placeholder="Ej: 4700"
              />
            ) : (
              <p className="mt-1 font-semibold">{displayData?.codigo_postal || 'N/A'}</p>
            )}
          </div>

          {/* Departamento */}
          <div>
            <Label>Departamento</Label>
            {isEditing ? (
              <Select
                value={editedData?.departamento ? String(typeof editedData.departamento === 'object' ? editedData.departamento.id : editedData.departamento) : ''}
                onValueChange={(value) => {
                  setEditedData(editedData ? { 
                    ...editedData, 
                    departamento: parseInt(value),
                    municipio: null, // Reset municipio when departamento changes
                    localidad: null  // Reset localidad when departamento changes
                  } : null)
                  loadMunicipiosData(parseInt(value))
                  setMunicipios([]) // Clear municipios immediately
                  setLocalidades([]) // Clear localidades immediately
                }}
                disabled={loadingGeo}
              >
                <SelectTrigger>
                  <SelectValue placeholder={loadingGeo ? "Cargando..." : "Selecciona un departamento"} />
                </SelectTrigger>
                <SelectContent>
                  {departamentos.length > 0 ? (
                    departamentos.map((depto) => (
                      <SelectItem key={depto.id} value={String(depto.id)}>
                        {depto.nomdpto || depto.nombre}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="none" disabled>No hay departamentos disponibles</SelectItem>
                  )}
                </SelectContent>
              </Select>
            ) : (
              <p className="mt-1 font-semibold">
                {displayData?.departamento_nombre || 
                 (typeof displayData?.departamento === 'object' ? (displayData.departamento.nomdpto || displayData.departamento.nombre) : displayData?.departamento) || 
                 'N/A'}
              </p>
            )}
          </div>

          {/* Municipio */}
          <div>
            <Label>Municipio</Label>
            {isEditing ? (
              <Select
                value={editedData?.municipio ? String(typeof editedData.municipio === 'object' ? editedData.municipio.id : editedData.municipio) : ''}
                onValueChange={(value) => {
                  setEditedData(editedData ? { 
                    ...editedData, 
                    municipio: parseInt(value),
                    localidad: null // Reset localidad when municipio changes
                  } : null)
                  loadLocalidadesData(parseInt(value))
                  setLocalidades([]) // Clear localidades immediately
                }}
                disabled={loadingGeo || !editedData?.departamento || municipios.length === 0}
              >
                <SelectTrigger>
                  <SelectValue placeholder={
                    loadingGeo ? "Cargando..." : 
                    !editedData?.departamento ? "Selecciona primero un departamento" :
                    municipios.length === 0 ? "No hay municipios disponibles" :
                    "Selecciona un municipio"
                  } />
                </SelectTrigger>
                <SelectContent>
                  {municipios.length > 0 ? (
                    municipios.map((mun) => (
                      <SelectItem key={mun.id} value={String(mun.id)}>
                        {mun.nommun || mun.nombre}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="none" disabled>No hay municipios disponibles</SelectItem>
                  )}
                </SelectContent>
              </Select>
            ) : (
              <p className="mt-1 font-semibold">
                {displayData?.municipio_nombre || 
                 (typeof displayData?.municipio === 'object' ? (displayData.municipio.nommun || displayData.municipio.nombre) : displayData?.municipio) || 
                 'N/A'}
              </p>
            )}
          </div>

          {/* Localidad */}
          <div>
            <Label>Localidad</Label>
            {isEditing ? (
              <Select
                value={editedData?.localidad ? String(typeof editedData.localidad === 'object' ? editedData.localidad.id : editedData.localidad) : ''}
                onValueChange={(value) => {
                  setEditedData(editedData ? { ...editedData, localidad: parseInt(value) } : null)
                }}
                disabled={loadingGeo || !editedData?.municipio || localidades.length === 0}
              >
                <SelectTrigger>
                  <SelectValue placeholder={
                    loadingGeo ? "Cargando..." : 
                    !editedData?.municipio ? "Selecciona primero un municipio" :
                    localidades.length === 0 ? "No hay localidades disponibles" :
                    "Selecciona una localidad"
                  } />
                </SelectTrigger>
                <SelectContent>
                  {localidades.length > 0 ? (
                    localidades.map((loc) => (
                      <SelectItem key={loc.id} value={String(loc.id)}>
                        {loc.nomloc || loc.nombre}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="none" disabled>No hay localidades disponibles</SelectItem>
                  )}
                </SelectContent>
              </Select>
            ) : (
              <p className="mt-1 font-semibold">
                {displayData?.localidad_nombre || 
                 (typeof displayData?.localidad === 'object' ? (displayData.localidad.nomloc || displayData.localidad.nombre) : displayData?.localidad) || 
                 'N/A'}
              </p>
            )}
          </div>

          {/* Geolocalización / Mapa */}
          {displayData?.geolocalizacion && (() => {
            const geoString = displayData.geolocalizacion
            let coordinates: { lat: number; lng: number } | null = null
            if (typeof geoString === 'string' && geoString.trim()) {
              try {
                const parts = geoString.split(',').map(v => parseFloat(v.trim()))
                if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
                  coordinates = { lat: parts[0], lng: parts[1] }
                }
              } catch (error) {
                console.error('Error parsing geolocalizacion:', error)
              }
            }
            return coordinates ? (
              <div className="md:col-span-2">
  <Label>Ubicación en el Mapa</Label>
  <div className="mt-2 relative z-0">  {/* ← Agregar relative z-0 */}
    <CompanyMap
      coordinates={coordinates}
      address={displayData?.direccion || displayData?.razon_social}
    />
  </div>
</div>
            ) : null
          })()}
        </div>
      </div>

      {/* Domicilio Comercial */}
      <div className="pt-6 border-t">
        <h3 className="text-lg font-semibold mb-3">Domicilio Comercial</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Dirección Comercial */}
          <div>
            <Label>Dirección</Label>
            {isEditing ? (
              <Input
                value={editedData?.direccion_comercial || ''}
                onChange={(e) => setEditedData(editedData ? { ...editedData, direccion_comercial: e.target.value } : null)}
                placeholder="Calle y número (opcional)"
              />
            ) : (
              <p className="mt-1 font-semibold">{displayData?.direccion_comercial || 'N/A'}</p>
            )}
          </div>

          {/* Código Postal Comercial */}
          <div>
            <Label>Código Postal</Label>
            {isEditing ? (
              <Input
                value={editedData?.codigo_postal_comercial || ''}
                onChange={(e) => setEditedData(editedData ? { ...editedData, codigo_postal_comercial: e.target.value } : null)}
                placeholder="Ej: 4700 (opcional)"
              />
            ) : (
              <p className="mt-1 font-semibold">{displayData?.codigo_postal_comercial || 'N/A'}</p>
            )}
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
</TabsContent>

          
<TabsContent value="comercial" className="space-y-6">
  <Card>
    <CardHeader>
      <CardTitle className="text-[#222A59]">Actividad Comercial</CardTitle>
    </CardHeader>
    <CardContent className="space-y-6">
      {/* Datos de exportación/importación */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
  <Label>¿Exporta?</Label>
  {isEditing ? (
    <Select
      value={displayData?.exporta || ''}
      onValueChange={(value) => setEditedData(displayData ? { ...displayData, exporta: value } : null)}
    >
      <SelectTrigger>
        <SelectValue placeholder="Selecciona" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="Sí">Sí</SelectItem>
        <SelectItem value="No, solo ventas nacionales">No</SelectItem>
        <SelectItem value="En proceso">En proceso</SelectItem>
      </SelectContent>
    </Select>
  ) : (
    <p className="mt-1 font-semibold">{displayData?.exporta || 'N/A'}</p>
  )}
</div>

{/* Mostrar "Interés en Exportar" solo si NO exporta */}
{(displayData?.exporta === "No, solo ventas nacionales" || displayData?.exporta === "No") && (
  <div>
    <Label>¿Interés en Exportar?</Label>
    {isEditing ? (
      <Select
        value={displayData?.interes_exportar ? 'si' : 'no'}
        onValueChange={(value) => setEditedData(displayData ? { 
          ...displayData, 
          interes_exportar: value === 'si' 
        } : null)}
      >
        <SelectTrigger>
          <SelectValue placeholder="Selecciona" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="si">Sí</SelectItem>
          <SelectItem value="no">No</SelectItem>
        </SelectContent>
      </Select>
    ) : (
      <p className="mt-1 font-semibold">
        {displayData?.interes_exportar === true || displayData?.interes_exportar === 'true' 
          ? 'Sí' 
          : displayData?.interes_exportar === false || displayData?.interes_exportar === 'false'
          ? 'No'
          : 'N/A'}
      </p>
    )}
  </div>
)}
        <div>
          <Label>Destino de Exportación</Label>
          {isEditing ? (
            <Textarea
              value={displayData?.destinoexporta || ''}
              onChange={(e) => setEditedData(displayData ? { ...displayData, destinoexporta: e.target.value } : null)}
              rows={3}
            />
          ) : (
            <p className="mt-1 font-semibold">{displayData?.destinoexporta || 'N/A'}</p>
          )}
        </div>
        <div>
          <Label>¿Importa?</Label>
          <p className="mt-1 font-semibold">{displayData?.importa ? 'Sí' : 'No'}</p>
        </div>
        <div>
          <Label>Idiomas de Trabajo</Label>
          {isEditing ? (
            <Input
              value={displayData?.idiomas_trabaja || ''}
              onChange={(e) => setEditedData(displayData ? { ...displayData, idiomas_trabaja: e.target.value } : null)}
            />
          ) : (
            <p className="mt-1 font-semibold">{displayData?.idiomas_trabaja || 'N/A'}</p>
          )}
        </div>
      </div>

      {/* Sección de Actividades de Promoción Internacional */}
      <div className="pt-6 border-t">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-[#222A59]">
            Actividades de Promoción Internacional
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            Ferias, misiones comerciales y rondas de negocios en las que ha participado
          </p>
        </div>

        {displayData?.actividades_promocion_internacional && 
         Array.isArray(displayData.actividades_promocion_internacional) && 
         displayData.actividades_promocion_internacional.length > 0 ? (
          <div className="space-y-3">
            {displayData.actividades_promocion_internacional.map((actividad: any, index: number) => (
              <div
                key={index}
                className="p-4 border border-[#3259B5]/30 rounded-lg bg-gradient-to-br from-[#3259B5]/5 to-transparent hover:border-[#3259B5]/50 transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {actividad.tipo === 'feria' && (
                      <div className="flex items-center gap-2 text-[#3259B5]">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                        <span className="font-semibold text-sm">Feria Internacional</span>
                      </div>
                    )}
                    {actividad.tipo === 'mision' && (
                      <div className="flex items-center gap-2 text-[#66A29C]">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="font-semibold text-sm">Misión Comercial</span>
                      </div>
                    )}
                    {actividad.tipo === 'ronda' && (
                      <div className="flex items-center gap-2 text-[#807DA1]">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        <span className="font-semibold text-sm">Ronda de Negocios</span>
                      </div>
                    )}
                  </div>
                  <span className="px-3 py-1 bg-[#222A59] text-white text-xs font-semibold rounded-full">
                    {actividad.anio || 'N/A'}
                  </span>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-start gap-2">
                    <svg className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <div className="flex-1">
                      <p className="text-xs text-gray-500">Lugar</p>
                      <p className="font-medium text-[#222A59]">{actividad.lugar || 'No especificado'}</p>
                    </div>
                  </div>
                  
                  {actividad.observaciones && (
                    <div className="flex items-start gap-2 mt-3 pt-3 border-t border-gray-200">
                      <svg className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                      </svg>
                      <div className="flex-1">
                        <p className="text-xs text-gray-500">Observaciones</p>
                        <p className="text-sm text-gray-700">{actividad.observaciones}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 bg-gray-50 rounded-lg border border-dashed border-gray-300">
            <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="font-medium text-gray-600">No hay actividades de promoción registradas</p>
            <p className="text-sm text-gray-500 mt-1">Esta empresa no ha registrado participación en ferias, misiones o rondas</p>
          </div>
        )}
      </div>
    </CardContent>
  </Card>
</TabsContent>

          <TabsContent value="productos-servicios" className="space-y-6">
  <Card>
    <CardHeader>
      <CardTitle className="text-[#222A59]">
        {empresa.tipo_empresa === 'producto' || empresa.tipo_empresa_valor === 'producto' ? 'Productos' : 
         empresa.tipo_empresa === 'servicio' || empresa.tipo_empresa_valor === 'servicio' ? 'Servicios' : 
         'Productos y Servicios'}
      </CardTitle>
    </CardHeader>
    <CardContent>
      {/* PRODUCTOS */}
      {(empresa.tipo_empresa === 'producto' || empresa.tipo_empresa === 'mixta' || empresa.tipo_empresa_valor === 'producto' || empresa.tipo_empresa_valor === 'mixta') && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-lg">Productos</h3>
            {isEditing && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  // Agregar nuevo producto vacío
                  const newProducto = {
                    id: `temp-${Date.now()}`, // ID temporal
                    nombre_producto: '',
                    descripcion: '',
                    capacidad_productiva: '',
                    unidad_medida: 'kg',
                    periodo_capacidad: 'mensual',
                    es_principal: false,
                  }
                  setEditedData(editedData ? {
                    ...editedData,
                    productos: [...(editedData.productos || []), newProducto]
                  } : null)
                }}
                className="gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Agregar Producto
              </Button>
            )}
          </div>

          {displayData?.productos && displayData.productos.length > 0 ? (
            <div className="space-y-4">
              {displayData.productos.map((producto: any, index: number) => (
                <div key={producto.id || index} className="p-4 border rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                  {isEditing ? (
                    // MODO EDICIÓN
                    <div className="space-y-4">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 space-y-4">
                          {/* Nombre del Producto */}
                          <div>
                            <Label>Nombre del Producto</Label>
                            <Input
                              value={producto.nombre_producto || producto.nombre || ''}
                              onChange={(e) => {
                                const updatedProductos = [...(editedData?.productos || [])]
                                updatedProductos[index] = {
                                  ...updatedProductos[index],
                                  nombre_producto: e.target.value,
                                  nombre: e.target.value
                                }
                                setEditedData(editedData ? { ...editedData, productos: updatedProductos } : null)
                              }}
                              placeholder="Nombre del producto"
                            />
                          </div>

                          {/* Descripción */}
                          <div>
                            <Label>Descripción</Label>
                            <Textarea
                              value={producto.descripcion || ''}
                              onChange={(e) => {
                                const updatedProductos = [...(editedData?.productos || [])]
                                updatedProductos[index] = {
                                  ...updatedProductos[index],
                                  descripcion: e.target.value
                                }
                                setEditedData(editedData ? { ...editedData, productos: updatedProductos } : null)
                              }}
                              placeholder="Descripción del producto"
                              rows={3}
                            />
                          </div>

                          {/* Capacidad Productiva */}
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <div>
                              <Label>Capacidad Productiva</Label>
                              <Input
                                type="number"
                                step="0.01"
                                value={producto.capacidad_productiva || ''}
                                onChange={(e) => {
                                  const updatedProductos = [...(editedData?.productos || [])]
                                  updatedProductos[index] = {
                                    ...updatedProductos[index],
                                    capacidad_productiva: e.target.value
                                  }
                                  setEditedData(editedData ? { ...editedData, productos: updatedProductos } : null)
                                }}
                                placeholder="Ej: 1000"
                              />
                            </div>

                            <div>
                              <Label>Unidad de Medida</Label>
                              <Select
                                value={producto.unidad_medida || 'kg'}
                                onValueChange={(value) => {
                                  const updatedProductos = [...(editedData?.productos || [])]
                                  updatedProductos[index] = {
                                    ...updatedProductos[index],
                                    unidad_medida: value
                                  }
                                  setEditedData(editedData ? { ...editedData, productos: updatedProductos } : null)
                                }}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecciona" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="kg">Kilogramos (kg)</SelectItem>
                                  <SelectItem value="tn">Toneladas (tn)</SelectItem>
                                  <SelectItem value="lt">Litros (lt)</SelectItem>
                                  <SelectItem value="m3">Metros cúbicos (m³)</SelectItem>
                                  <SelectItem value="un">Unidades (un)</SelectItem>
                                  <SelectItem value="otro">Otro</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            <div>
                              <Label>Período</Label>
                              <Select
                                value={producto.periodo_capacidad || 'mensual'}
                                onValueChange={(value) => {
                                  const updatedProductos = [...(editedData?.productos || [])]
                                  updatedProductos[index] = {
                                    ...updatedProductos[index],
                                    periodo_capacidad: value
                                  }
                                  setEditedData(editedData ? { ...editedData, productos: updatedProductos } : null)
                                }}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecciona" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="mensual">Mensual</SelectItem>
                                  <SelectItem value="anual">Anual</SelectItem>
                                  <SelectItem value="semanal">Semanal</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>

                          {/* Posición Arancelaria */}
                          {producto.posicion_arancelaria && (
                            <div>
                              <Label>Posición Arancelaria</Label>
                              <Input
                                value={typeof producto.posicion_arancelaria === 'object' 
                                  ? producto.posicion_arancelaria.codigo_arancelario 
                                  : producto.posicion_arancelaria}
                                onChange={(e) => {
                                  const updatedProductos = [...(editedData?.productos || [])]
                                  updatedProductos[index] = {
                                    ...updatedProductos[index],
                                    posicion_arancelaria: {
                                      ...updatedProductos[index].posicion_arancelaria,
                                      codigo_arancelario: e.target.value
                                    }
                                  }
                                  setEditedData(editedData ? { ...editedData, productos: updatedProductos } : null)
                                }}
                                placeholder="Ej: 1234.56.78"
                              />
                            </div>
                          )}
                        </div>

                        {/* Botón Eliminar */}
                        <Button
                          variant="destructive"
                          size="icon"
                          onClick={() => {
                            const updatedProductos = editedData?.productos?.filter((_, i) => i !== index) || []
                            setEditedData(editedData ? { ...editedData, productos: updatedProductos } : null)
                          }}
                          className="flex-shrink-0"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    // MODO LECTURA
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-semibold text-lg">{producto.nombre_producto || producto.nombre}</p>
                        {producto.descripcion && (
                          <p className="text-sm text-muted-foreground mt-2">{producto.descripcion}</p>
                        )}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                          {producto.capacidad_productiva && (
                            <div>
                              <span className="text-sm font-medium">Capacidad Productiva: </span>
                              <span className="text-sm">{producto.capacidad_productiva} {producto.unidad_medida || ''}</span>
                            </div>
                          )}
                          {producto.posicion_arancelaria && (
                            <div>
                              <span className="text-sm font-medium">Posición Arancelaria: </span>
                              <span className="text-sm">
                                {typeof producto.posicion_arancelaria === 'object' 
                                  ? producto.posicion_arancelaria.codigo_arancelario 
                                  : producto.posicion_arancelaria}
                              </span>
                            </div>
                          )}
                          {producto.periodo_capacidad && (
                            <div>
                              <span className="text-sm font-medium">Período: </span>
                              <span className="text-sm">{producto.periodo_capacidad}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground py-4">No hay productos registrados</p>
          )}
        </div>
      )}

      {/* SERVICIOS */}
      {(empresa.tipo_empresa === 'servicio' || empresa.tipo_empresa === 'mixta' || empresa.tipo_empresa_valor === 'servicio' || empresa.tipo_empresa_valor === 'mixta') && (
        <div className={`space-y-4 ${(empresa.tipo_empresa === 'mixta' || empresa.tipo_empresa_valor === 'mixta') ? 'mt-6 pt-6 border-t' : ''}`}>
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-lg">Servicios</h3>
            {isEditing && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  // Agregar nuevo servicio vacío
                  const newServicio = {
                    id: `temp-${Date.now()}`,
                    nombre_servicio: '',
                    nombre: '',
                    descripcion: '',
                    tipo_servicio: '',
                    sector_atendido: '',
                    alcance_servicio: 'local',
                    forma_contratacion: 'hora',
                    es_principal: false,
                  }
                  const serviciosKey = displayData?.servicios_ofrecidos ? 'servicios_ofrecidos' : 'servicios'
                  const currentServicios = editedData?.[serviciosKey] || []
                  const serviciosArray = Array.isArray(currentServicios) ? currentServicios : [currentServicios]
                  
                  setEditedData(editedData ? {
                    ...editedData,
                    [serviciosKey]: [...serviciosArray, newServicio]
                  } : null)
                }}
                className="gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Agregar Servicio
              </Button>
            )}
          </div>

          {(() => {
            const servicios = displayData?.servicios_ofrecidos 
              ? (Array.isArray(displayData.servicios_ofrecidos)
                  ? displayData.servicios_ofrecidos
                  : (Object.keys(displayData.servicios_ofrecidos || {}).length ? [displayData.servicios_ofrecidos] : []))
              : (displayData?.servicios || []);
            
            return servicios && servicios.length > 0 ? (
              <div className="space-y-4">
                {servicios.map((servicio: any, index: number) => (
                  <div key={servicio.id || index} className="p-4 border rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                    {isEditing ? (
                      // MODO EDICIÓN
                      <div className="space-y-4">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 space-y-4">
                            {/* Nombre del Servicio */}
                            <div>
                              <Label>Nombre del Servicio</Label>
                              <Input
                                value={servicio.nombre || servicio.nombre_servicio || servicio.descripcion || ''}
                                onChange={(e) => {
                                  const serviciosKey = editedData?.servicios_ofrecidos ? 'servicios_ofrecidos' : 'servicios'
                                  const currentServicios = editedData?.[serviciosKey] || []
                                  const serviciosArray = Array.isArray(currentServicios) ? currentServicios : [currentServicios]
                                  const updatedServicios = [...serviciosArray]
                                  updatedServicios[index] = {
                                    ...updatedServicios[index],
                                    nombre: e.target.value,
                                    nombre_servicio: e.target.value
                                  }
                                  setEditedData(editedData ? { ...editedData, [serviciosKey]: updatedServicios } : null)
                                }}
                                placeholder="Nombre del servicio"
                              />
                            </div>

                            {/* Descripción */}
                            <div>
                              <Label>Descripción</Label>
                              <Textarea
                                value={servicio.descripcion || ''}
                                onChange={(e) => {
                                  const serviciosKey = editedData?.servicios_ofrecidos ? 'servicios_ofrecidos' : 'servicios'
                                  const currentServicios = editedData?.[serviciosKey] || []
                                  const serviciosArray = Array.isArray(currentServicios) ? currentServicios : [currentServicios]
                                  const updatedServicios = [...serviciosArray]
                                  updatedServicios[index] = {
                                    ...updatedServicios[index],
                                    descripcion: e.target.value
                                  }
                                  setEditedData(editedData ? { ...editedData, [serviciosKey]: updatedServicios } : null)
                                }}
                                placeholder="Descripción del servicio"
                                rows={3}
                              />
                            </div>

                            {/* Tipo de Servicio y Sector */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              <div>
                                <Label>Tipo de Servicio</Label>
                                <Select
                                  value={Array.isArray(servicio.tipo_servicio) ? servicio.tipo_servicio[0] : servicio.tipo_servicio || ''}
                                  onValueChange={(value) => {
                                    const serviciosKey = editedData?.servicios_ofrecidos ? 'servicios_ofrecidos' : 'servicios'
                                    const currentServicios = editedData?.[serviciosKey] || []
                                    const serviciosArray = Array.isArray(currentServicios) ? currentServicios : [currentServicios]
                                    const updatedServicios = [...serviciosArray]
                                    updatedServicios[index] = {
                                      ...updatedServicios[index],
                                      tipo_servicio: value
                                    }
                                    setEditedData(editedData ? { ...editedData, [serviciosKey]: updatedServicios } : null)
                                  }}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Selecciona tipo" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="consultoria">Consultoría y servicios empresariales</SelectItem>
                                    <SelectItem value="tecnologias">Tecnologías de la información (IT)</SelectItem>
                                    <SelectItem value="diseno_marketing">Diseño y marketing</SelectItem>
                                    <SelectItem value="capacitacion">Capacitación y educación online</SelectItem>
                                    <SelectItem value="culturales_eventos">Servicios culturales y eventos</SelectItem>
                                    <SelectItem value="investigacion_desarrollo">Investigación y desarrollo (I+D)</SelectItem>
                                    <SelectItem value="turismo_receptivo">Turismo receptivo</SelectItem>
                                    <SelectItem value="otro">Otro</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>

                              <div>
                                <Label>Sector Atendido</Label>
                                <Input
                                  value={servicio.sector_atendido || (Array.isArray(servicio.sectores) ? servicio.sectores.join(', ') : servicio.sectores || '')}
                                  onChange={(e) => {
                                    const serviciosKey = editedData?.servicios_ofrecidos ? 'servicios_ofrecidos' : 'servicios'
                                    const currentServicios = editedData?.[serviciosKey] || []
                                    const serviciosArray = Array.isArray(currentServicios) ? currentServicios : [currentServicios]
                                    const updatedServicios = [...serviciosArray]
                                    updatedServicios[index] = {
                                      ...updatedServicios[index],
                                      sector_atendido: e.target.value
                                    }
                                    setEditedData(editedData ? { ...editedData, [serviciosKey]: updatedServicios } : null)
                                  }}
                                  placeholder="Ej: Minería, Turismo"
                                />
                              </div>
                            </div>

                            {/* Alcance y Forma de Contratación */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              <div>
                                <Label>Alcance Geográfico</Label>
                                <Select
                                  value={servicio.alcance_geografico || servicio.alcance_servicio || 'local'}
                                  onValueChange={(value) => {
                                    const serviciosKey = editedData?.servicios_ofrecidos ? 'servicios_ofrecidos' : 'servicios'
                                    const currentServicios = editedData?.[serviciosKey] || []
                                    const serviciosArray = Array.isArray(currentServicios) ? currentServicios : [currentServicios]
                                    const updatedServicios = [...serviciosArray]
                                    updatedServicios[index] = {
                                      ...updatedServicios[index],
                                      alcance_geografico: value,
                                      alcance_servicio: value
                                    }
                                    setEditedData(editedData ? { ...editedData, [serviciosKey]: updatedServicios } : null)
                                  }}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Selecciona alcance" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="local">Local</SelectItem>
                                    <SelectItem value="nacional">Nacional</SelectItem>
                                    <SelectItem value="internacional">Internacional</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>

                              <div>
                                <Label>Forma de Contratación</Label>
                                <Select
                                  value={Array.isArray(servicio.forma_contratacion) ? servicio.forma_contratacion[0] : servicio.forma_contratacion || 'hora'}
                                  onValueChange={(value) => {
                                    const serviciosKey = editedData?.servicios_ofrecidos ? 'servicios_ofrecidos' : 'servicios'
                                    const currentServicios = editedData?.[serviciosKey] || []
                                    const serviciosArray = Array.isArray(currentServicios) ? currentServicios : [currentServicios]
                                    const updatedServicios = [...serviciosArray]
                                    updatedServicios[index] = {
                                      ...updatedServicios[index],
                                      forma_contratacion: value
                                    }
                                    setEditedData(editedData ? { ...editedData, [serviciosKey]: updatedServicios } : null)
                                  }}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Selecciona forma" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="hora">Por Hora</SelectItem>
                                    <SelectItem value="proyecto">Por Proyecto</SelectItem>
                                    <SelectItem value="mensual">Mensual</SelectItem>
                                    <SelectItem value="otro">Otro</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                          </div>

                          {/* Botón Eliminar */}
                          <Button
                            variant="destructive"
                            size="icon"
                            onClick={() => {
                              const serviciosKey = editedData?.servicios_ofrecidos ? 'servicios_ofrecidos' : 'servicios'
                              const currentServicios = editedData?.[serviciosKey] || []
                              const serviciosArray = Array.isArray(currentServicios) ? currentServicios : [currentServicios]
                              const updatedServicios = serviciosArray.filter((_, i) => i !== index)
                              setEditedData(editedData ? { ...editedData, [serviciosKey]: updatedServicios } : null)
                            }}
                            className="flex-shrink-0"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ) : (
                      // MODO LECTURA (código existente)
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-semibold text-lg">
                            {servicio.nombre || servicio.nombre_servicio || servicio.descripcion || `Servicio ${index + 1}`}
                          </p>
                          {servicio.descripcion && (servicio.nombre || servicio.nombre_servicio) && (
                            <p className="text-sm text-muted-foreground mt-2">{servicio.descripcion}</p>
                          )}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                            {servicio.tipo_servicio && (
                              <div>
                                <span className="text-sm font-medium">Tipo: </span>
                                <span className="text-sm">
                                  {Array.isArray(servicio.tipo_servicio) 
                                    ? servicio.tipo_servicio.join(', ') 
                                    : servicio.tipo_servicio}
                                </span>
                              </div>
                            )}
                            {(servicio.sector_atendido || (servicio.sectores && servicio.sectores.length > 0)) && (
                              <div>
                                <span className="text-sm font-medium">Sectores Atendidos: </span>
                                <span className="text-sm">
                                  {servicio.sector_atendido || 
                                   (Array.isArray(servicio.sectores) ? servicio.sectores.join(', ') : servicio.sectores)}
                                </span>
                              </div>
                            )}
                            {(servicio.alcance_geografico || servicio.alcance_servicio) && (
                              <div>
                                <span className="text-sm font-medium">Alcance Geográfico: </span>
                                <span className="text-sm">
                                  {servicio.alcance_geografico || servicio.alcance_servicio || 'N/A'}
                                </span>
                              </div>
                            )}
                            {servicio.forma_contratacion && (
                              <div>
                                <span className="text-sm font-medium">Forma de Contratación: </span>
                                <span className="text-sm">
                                  {Array.isArray(servicio.forma_contratacion) 
                                    ? servicio.forma_contratacion.map(formatFormaContratacion).join(', ') 
                                    : formatFormaContratacion(servicio.forma_contratacion)}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground py-4">No hay servicios registrados</p>
            );
          })()}
        </div>
      )}
    </CardContent>
  </Card>
</TabsContent>

          <TabsContent value="certificaciones" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-[#222A59]">Certificaciones</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label>Certificado MiPyME</Label>
                  <p className="mt-1 font-semibold">{displayData?.certificadopyme ? 'Sí' : 'No'}</p>
                </div>
                <div>
                  <Label>Material Promocional en 2 Idiomas</Label>
                  <p className="mt-1 font-semibold">{displayData?.promo2idiomas ? 'Sí' : 'No'}</p>
                </div>
                <div className="md:col-span-2">
                  <Label>Certificaciones</Label>
                  {isEditing ? (
                    <Textarea
                      value={displayData?.certificaciones || ''}
                      onChange={(e) => setEditedData(displayData ? { ...displayData, certificaciones: e.target.value } : null)}
                      rows={4}
                    />
                  ) : (
                    <p className="mt-1 font-semibold">{displayData?.certificaciones || 'N/A'}</p>
                  )}
                </div>
                <div className="md:col-span-2">
                  <Label>Observaciones</Label>
                  {isEditing ? (
                    <Textarea
                      value={displayData?.observaciones || ''}
                      onChange={(e) => setEditedData(displayData ? { ...displayData, observaciones: e.target.value } : null)}
                      rows={4}
                    />
                  ) : (
                    <p className="mt-1 font-semibold">{displayData?.observaciones || 'N/A'}</p>
                  )}
                </div>
                <div className="md:col-span-2">
                  <Label>Brochure / Catálogo (PDF)</Label>
                  {isEditing ? (
                    <p className="mt-1 text-sm text-muted-foreground">Se puede subir o actualizar el brochure desde la edición.</p>
                  ) : (
                    displayData?.brochure ? (
                      <a
                        href={displayData.brochure}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-1 inline-block text-sm text-[#3259B5] font-semibold hover:underline"
                      >
                        Descargar Brochure / Catálogo
                      </a>
                    ) : (
                      <p className="mt-1 font-semibold">N/A</p>
                    )
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      
      {empresa && (
        <ExportEmpresaDialog
          open={showExportDialog}
          onClose={() => setShowExportDialog(false)}
          empresa={empresa}
        />
      )}
    </MainLayout>
  )
}

export default function EmpresaProfilePage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={
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
              <Skeleton className="h-48 w-full" />
            </div>
          </div>
        </div>
      </MainLayout>
    }>
      <EmpresaProfileContent params={params} />
    </Suspense>
  )
}
