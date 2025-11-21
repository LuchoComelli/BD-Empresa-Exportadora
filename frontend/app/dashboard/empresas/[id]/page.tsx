"use client"

import { useState, useEffect, use, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { MainLayout } from "@/components/layout/main-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
  provincia?: string
  departamento?: any
  departamento_nombre?: string
  municipio?: any
  municipio_nombre?: string
  localidad?: any
  localidad_nombre?: string
  telefono?: string
  correo?: string
  sitioweb?: string
  exporta?: string
  categoria_matriz?: string
  destinoexporta?: string
  importa?: boolean
  certificadopyme?: boolean
  certificaciones?: string
  promo2idiomas?: boolean
  idiomas_trabaja?: string
  observaciones?: string
  geolocalizacion?: string
  id_rubro?: any
  rubro_nombre?: string
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
  const [showExportMenu, setShowExportMenu] = useState(false)

  useEffect(() => {
    loadEmpresa()
  }, [resolvedParams.id])

  useEffect(() => {
    // Activar modo edición si viene con ?edit=true
    const editParam = searchParams?.get('edit')
    if (editParam === 'true') {
      setIsEditing(true)
    }
  }, [searchParams])

  const loadEmpresa = async () => {
    try {
      setLoading(true)
      console.log('[Empresa Detail] Loading empresa with ID:', resolvedParams.id)
      const empresaId = parseInt(resolvedParams.id)
      console.log('[Empresa Detail] Parsed ID:', empresaId)
      
      const data = await api.getEmpresaById(empresaId)
      console.log('[Empresa Detail] Data received:', data)
      
      if (!data || !data.id) {
        console.error('[Empresa Detail] Invalid data received:', data)
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
      // Si viene con ?edit=true, activar modo edición después de cargar
      const editParam = searchParams?.get('edit')
      if (editParam === 'true') {
        setIsEditing(true)
      }
    } catch (error: any) {
      console.error("[Empresa Detail] Error loading empresa:", error)
      console.error("[Empresa Detail] Error details:", error.message, error.response)
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

  const handleEdit = () => {
    setIsEditing(true)
    setEditedData(empresa ? { ...empresa } : null)
  }

  const handleCancel = () => {
    setIsEditing(false)
    setEditedData(empresa ? { ...empresa } : null)
  }

  const handleSave = async () => {
    if (!editedData || !empresa) return

    try {
      setSaving(true)
      const updated = await api.updateEmpresa(empresa.id, editedData)
      setEmpresa(updated)
      setEditedData(updated)
      setIsEditing(false)
      toast({
        title: "Cambios guardados",
        description: "Los cambios se han guardado exitosamente",
        variant: "default",
      })
    } catch (error: any) {
      console.error("Error saving empresa:", error)
      toast({
        title: "Error al guardar",
        description: error.message || "Error al guardar los cambios. Por favor, intenta nuevamente.",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleExport = async (format: 'pdf' | 'csv' | 'xlsx') => {
    if (!empresa) return

    try {
      setShowExportMenu(false)
      
      // Implementación básica de exportación CSV
      if (format === 'csv') {
        const csvData = [
          ['Campo', 'Valor'],
          ['Razón Social', empresa.razon_social],
          ['Nombre Fantasía', empresa.nombre_fantasia || ''],
          ['CUIT', empresa.cuit_cuil],
          ['Tipo de Empresa', empresa.tipo_empresa || ''],
          ['Rubro', empresa.id_rubro ? (typeof empresa.id_rubro === 'object' ? empresa.id_rubro.nombre : empresa.id_rubro) : ''],
          ['Dirección', empresa.direccion || ''],
          ['Departamento', empresa.departamento ? (typeof empresa.departamento === 'object' ? empresa.departamento.nomdpto : empresa.departamento) : ''],
          ['Municipio', empresa.municipio ? (typeof empresa.municipio === 'object' ? empresa.municipio.nommun : empresa.municipio) : ''],
          ['Localidad', empresa.localidad ? (typeof empresa.localidad === 'object' ? empresa.localidad.nomloc : empresa.localidad) : ''],
          ['Teléfono', empresa.telefono || ''],
          ['Email', empresa.correo || ''],
          ['Sitio Web', empresa.sitioweb || ''],
          ['Exporta', empresa.exporta || ''],
          ['Destino Exportación', empresa.destinoexporta || ''],
          ['Importa', empresa.importa ? 'Sí' : 'No'],
          ['Certificado MiPyME', empresa.certificadopyme ? 'Sí' : 'No'],
          ['Certificaciones', empresa.certificaciones || ''],
          ['Material Promocional 2 Idiomas', empresa.promo2idiomas ? 'Sí' : 'No'],
          ['Idiomas de Trabajo', empresa.idiomas_trabaja || ''],
          ['Observaciones', empresa.observaciones || ''],
          ['Instagram', empresa.instagram || ''],
          ['Facebook', empresa.facebook || ''],
          ['LinkedIn', empresa.linkedin || ''],
        ]
        
        const csv = csvData.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n')
        const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' })
        const link = document.createElement('a')
        link.href = URL.createObjectURL(blob)
        link.download = `${empresa.razon_social.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`
        link.click()
      } else if (format === 'xlsx') {
        // Para Excel, necesitarías una librería como xlsx
        // Por ahora, exportar como CSV
        toast({
          title: "Exportación a Excel",
          description: "Exportación a Excel próximamente. Por ahora, usa CSV.",
          variant: "default",
        })
      } else if (format === 'pdf') {
        // Para PDF, necesitarías una librería como jsPDF
        toast({
          title: "Exportación a PDF",
          description: "Exportación a PDF próximamente. Por ahora, usa CSV.",
          variant: "default",
        })
      }
    } catch (error: any) {
      console.error("Error exporting empresa:", error)
      toast({
        title: "Error al exportar",
        description: error.message || "Error al exportar la empresa. Por favor, intenta nuevamente.",
        variant: "destructive",
      })
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
        return "bg-[#F59E0B] text-white"
      case "Etapa Inicial":
        return "bg-[#629BD2] text-white"
      default:
        return "bg-muted text-foreground"
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

  console.log('[Empresa Detail] Rendering with empresa:', empresa)
  console.log('[Empresa Detail] Empresa ID:', empresa?.id)
  console.log('[Empresa Detail] Empresa razon_social:', empresa?.razon_social)
  console.log('[Empresa Detail] Display data:', displayData)
  console.log('[Empresa Detail] Rubro nombre:', displayData?.rubro_nombre)
  console.log('[Empresa Detail] Departamento nombre:', displayData?.departamento_nombre)
  console.log('[Empresa Detail] Municipio nombre:', displayData?.municipio_nombre)
  console.log('[Empresa Detail] Localidad nombre:', displayData?.localidad_nombre)
  console.log('[Empresa Detail] ID Rubro:', displayData?.id_rubro)
  console.log('[Empresa Detail] ID Departamento:', displayData?.departamento)

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
                <div className="relative">
                  <Button 
                    variant="outline" 
                    className="gap-2"
                    onClick={() => setShowExportMenu(!showExportMenu)}
                  >
                    <Download className="h-4 w-4" />
                    Exportar
                  </Button>
                  {showExportMenu && (
                    <>
                      <div 
                        className="fixed inset-0 z-10" 
                        onClick={() => setShowExportMenu(false)}
                      />
                      <div className="absolute right-0 mt-2 w-48 bg-white border rounded-lg shadow-lg z-20">
                        <button
                          onClick={() => handleExport('csv')}
                          className="w-full text-left px-4 py-2 hover:bg-gray-100 text-sm first:rounded-t-lg last:rounded-b-lg"
                        >
                          CSV
                        </button>
                        <button
                          onClick={() => handleExport('xlsx')}
                          className="w-full text-left px-4 py-2 hover:bg-gray-100 text-sm first:rounded-t-lg last:rounded-b-lg"
                        >
                          Excel
                        </button>
                        <button
                          onClick={() => handleExport('pdf')}
                          className="w-full text-left px-4 py-2 hover:bg-gray-100 text-sm first:rounded-t-lg last:rounded-b-lg"
                        >
                          PDF
                        </button>
                      </div>
                    </>
                  )}
                </div>
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
                          <span>, {displayData.departamento_nombre || (typeof displayData.departamento === 'object' ? displayData.departamento.nomdpto : displayData.departamento)}</span>
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
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 lg:w-auto lg:inline-grid">
            <TabsTrigger value="general">Información General</TabsTrigger>
            <TabsTrigger value="comercial">Actividad Comercial</TabsTrigger>
            <TabsTrigger value="productos-servicios">Productos/Servicios</TabsTrigger>
            <TabsTrigger value="certificaciones">Certificaciones</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-[#222A59]">Datos de la Empresa</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label>Razón Social</Label>
                  {isEditing ? (
                    <Input
                      value={displayData?.razon_social || ''}
                      onChange={(e) => setEditedData(displayData ? { ...displayData, razon_social: e.target.value } : null)}
                    />
                  ) : (
                    <p className="mt-1 font-semibold">{displayData?.razon_social}</p>
                  )}
                </div>
                <div>
                  <Label>Nombre de Fantasía</Label>
                  {isEditing ? (
                    <Input
                      value={displayData?.nombre_fantasia || ''}
                      onChange={(e) => setEditedData(displayData ? { ...displayData, nombre_fantasia: e.target.value } : null)}
                    />
                  ) : (
                    <p className="mt-1 font-semibold">{displayData?.nombre_fantasia || 'N/A'}</p>
                  )}
                </div>
                <div>
                  <Label>CUIT</Label>
                  {isEditing ? (
                    <Input
                      value={displayData?.cuit_cuil || ''}
                      onChange={(e) => setEditedData(displayData ? { ...displayData, cuit_cuil: e.target.value } : null)}
                    />
                  ) : (
                    <p className="mt-1 font-semibold">{displayData?.cuit_cuil}</p>
                  )}
                </div>
                <div>
                  <Label>Tipo de Sociedad</Label>
                  <p className="mt-1 font-semibold">{displayData?.tipo_sociedad || 'N/A'}</p>
                </div>
                <div>
                  <Label>Tipo de Empresa</Label>
                  <p className="mt-1 font-semibold">
                    {displayData?.tipo_empresa_detalle?.nombre || 
                     displayData?.tipo_empresa_valor || 
                     displayData?.tipo_empresa || 
                     'N/A'}
                  </p>
                </div>
                <div>
                  <Label>Rubro</Label>
                  <p className="mt-1 font-semibold">
                    {(() => {
                      // Priorizar rubro_nombre si existe
                      if (displayData?.rubro_nombre) {
                        return displayData.rubro_nombre
                      }
                      // Si no, intentar obtener del objeto id_rubro
                      if (displayData?.id_rubro) {
                        if (typeof displayData.id_rubro === 'object' && displayData.id_rubro?.nombre) {
                          return displayData.id_rubro.nombre
                        }
                        // Si es un número, no mostrarlo
                        if (typeof displayData.id_rubro === 'number') {
                          return 'N/A'
                        }
                        return displayData.id_rubro
                      }
                      return 'N/A'
                    })()}
                  </p>
                </div>
                <div>
                  <Label>Dirección</Label>
                  {isEditing ? (
                    <Input
                      value={displayData?.direccion || ''}
                      onChange={(e) => setEditedData(displayData ? { ...displayData, direccion: e.target.value } : null)}
                    />
                  ) : (
                    <p className="mt-1 font-semibold">{displayData?.direccion || 'N/A'}</p>
                  )}
                </div>
                <div>
                  <Label>Código Postal</Label>
                  <p className="mt-1 font-semibold">{displayData?.codigo_postal || 'N/A'}</p>
                </div>
                <div>
                  <Label>Provincia</Label>
                  <p className="mt-1 font-semibold">{displayData?.provincia || 'N/A'}</p>
                </div>
                <div>
                  <Label>Departamento</Label>
                  <p className="mt-1 font-semibold">
                    {(() => {
                      // Priorizar departamento_nombre si existe
                      if (displayData?.departamento_nombre) {
                        return displayData.departamento_nombre
                      }
                      // Si no, intentar obtener del objeto departamento
                      if (displayData?.departamento) {
                        if (typeof displayData.departamento === 'object' && displayData.departamento?.nomdpto) {
                          return displayData.departamento.nomdpto
                        }
                        // Si es un número, no mostrarlo
                        if (typeof displayData.departamento === 'number') {
                          return 'N/A'
                        }
                        return displayData.departamento
                      }
                      return 'N/A'
                    })()}
                  </p>
                </div>
                <div>
                  <Label>Municipio</Label>
                  <p className="mt-1 font-semibold">
                    {(() => {
                      // Priorizar municipio_nombre si existe
                      if (displayData?.municipio_nombre) {
                        return displayData.municipio_nombre
                      }
                      // Si no, intentar obtener del objeto municipio
                      if (displayData?.municipio) {
                        if (typeof displayData.municipio === 'object' && displayData.municipio?.nommun) {
                          return displayData.municipio.nommun
                        }
                        // Si es un número, no mostrarlo
                        if (typeof displayData.municipio === 'number') {
                          return 'N/A'
                        }
                        return displayData.municipio
                      }
                      return 'N/A'
                    })()}
                  </p>
                </div>
                <div>
                  <Label>Localidad</Label>
                  <p className="mt-1 font-semibold">
                    {(() => {
                      // Priorizar localidad_nombre si existe
                      if (displayData?.localidad_nombre) {
                        return displayData.localidad_nombre
                      }
                      // Si no, intentar obtener del objeto localidad
                      if (displayData?.localidad) {
                        if (typeof displayData.localidad === 'object' && displayData.localidad?.nomloc) {
                          return displayData.localidad.nomloc
                        }
                        // Si es un número, no mostrarlo
                        if (typeof displayData.localidad === 'number') {
                          return 'N/A'
                        }
                        return displayData.localidad
                      }
                      return 'N/A'
                    })()}
                  </p>
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
                  <Label>Email</Label>
                  {isEditing ? (
                    <Input
                      type="email"
                      value={displayData?.correo || ''}
                      onChange={(e) => setEditedData(displayData ? { ...displayData, correo: e.target.value } : null)}
                    />
                  ) : (
                    <p className="mt-1 font-semibold">{displayData?.correo || 'N/A'}</p>
                  )}
                </div>
                <div>
                  <Label>Sitio Web</Label>
                  {isEditing ? (
                    <Input
                      type="url"
                      value={displayData?.sitioweb || ''}
                      onChange={(e) => setEditedData(displayData ? { ...displayData, sitioweb: e.target.value } : null)}
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
                {(displayData?.instagram || displayData?.facebook || displayData?.linkedin) && (
                  <div className="md:col-span-2">
                    <Label>Redes Sociales</Label>
                    <div className="mt-2 flex flex-wrap gap-4">
                      {displayData.instagram && (
                        <a href={displayData.instagram.startsWith('http') ? displayData.instagram : `https://instagram.com/${displayData.instagram}`} 
                           target="_blank" rel="noopener noreferrer" 
                           className="text-[#3259B5] hover:underline">
                          Instagram: {displayData.instagram}
                        </a>
                      )}
                      {displayData.facebook && (
                        <a href={displayData.facebook.startsWith('http') ? displayData.facebook : `https://facebook.com/${displayData.facebook}`} 
                           target="_blank" rel="noopener noreferrer" 
                           className="text-[#3259B5] hover:underline">
                          Facebook: {displayData.facebook}
                        </a>
                      )}
                      {displayData.linkedin && (
                        <a href={displayData.linkedin.startsWith('http') ? displayData.linkedin : `https://linkedin.com/company/${displayData.linkedin}`} 
                           target="_blank" rel="noopener noreferrer" 
                           className="text-[#3259B5] hover:underline">
                          LinkedIn: {displayData.linkedin}
                        </a>
                      )}
                    </div>
                  </div>
                )}
                {(displayData?.contacto_principal_nombre || displayData?.contacto_principal_cargo || displayData?.contacto_principal_telefono || displayData?.contacto_principal_email) && (
                  <div className="md:col-span-2">
                    <Label>Contacto Principal</Label>
                    <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-muted/30 rounded-lg">
                      {displayData.contacto_principal_nombre && (
                        <div>
                          <span className="text-sm text-muted-foreground">Nombre: </span>
                          <span className="font-semibold">{displayData.contacto_principal_nombre}</span>
                        </div>
                      )}
                      {displayData.contacto_principal_cargo && (
                        <div>
                          <span className="text-sm text-muted-foreground">Cargo: </span>
                          <span className="font-semibold">{displayData.contacto_principal_cargo}</span>
                        </div>
                      )}
                      {displayData.contacto_principal_telefono && (
                        <div>
                          <span className="text-sm text-muted-foreground">Teléfono: </span>
                          <span className="font-semibold">{displayData.contacto_principal_telefono}</span>
                        </div>
                      )}
                      {displayData.contacto_principal_email && (
                        <div>
                          <span className="text-sm text-muted-foreground">Email: </span>
                          <span className="font-semibold">{displayData.contacto_principal_email}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                {displayData?.geolocalizacion && (() => {
                  // Parsear geolocalizacion string "lat,lng" a objeto { lat, lng }
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
                      <div className="mt-2">
                        <CompanyMap 
                          coordinates={coordinates} 
                          address={displayData?.direccion || displayData?.razon_social}
                        />
                      </div>
                    </div>
                  ) : null
                })()}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="comercial" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-[#222A59]">Actividad Comercial</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                {(empresa.tipo_empresa === 'producto' || empresa.tipo_empresa === 'mixta' || empresa.tipo_empresa_valor === 'producto' || empresa.tipo_empresa_valor === 'mixta') ? (
                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg">Productos</h3>
                    {displayData?.productos && displayData.productos.length > 0 ? (
                      <div className="space-y-4">
                        {displayData.productos.map((producto: any, index: number) => (
                          <div key={producto.id || index} className="p-4 border rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
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
                                      <span className="text-sm">{typeof producto.posicion_arancelaria === 'object' ? producto.posicion_arancelaria.codigo_arancelario : producto.posicion_arancelaria}</span>
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
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted-foreground py-4">No hay productos registrados</p>
                    )}
                  </div>
                ) : null}
                {(empresa.tipo_empresa === 'servicio' || empresa.tipo_empresa === 'mixta' || empresa.tipo_empresa_valor === 'servicio' || empresa.tipo_empresa_valor === 'mixta') ? (
                  <div className="space-y-4 mt-6">
                    <h3 className="font-semibold text-lg">Servicios</h3>
                    {displayData?.servicios && displayData.servicios.length > 0 ? (
                      <div className="space-y-4">
                        {displayData.servicios.map((servicio: any, index: number) => (
                          <div key={servicio.id || index} className="p-4 border rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <p className="font-semibold text-lg">{servicio.nombre_servicio || servicio.descripcion || servicio.nombre}</p>
                                {servicio.descripcion && servicio.nombre_servicio && (
                                  <p className="text-sm text-muted-foreground mt-2">{servicio.descripcion}</p>
                                )}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                                  {servicio.tipo_servicio && (
                                    <div>
                                      <span className="text-sm font-medium">Tipo: </span>
                                      <span className="text-sm">{Array.isArray(servicio.tipo_servicio) ? servicio.tipo_servicio.join(', ') : servicio.tipo_servicio}</span>
                                    </div>
                                  )}
                                  {servicio.sectores && servicio.sectores.length > 0 && (
                                    <div>
                                      <span className="text-sm font-medium">Sectores: </span>
                                      <span className="text-sm">{Array.isArray(servicio.sectores) ? servicio.sectores.join(', ') : servicio.sectores}</span>
                                    </div>
                                  )}
                                  {servicio.alcance_geografico && (
                                    <div>
                                      <span className="text-sm font-medium">Alcance Geográfico: </span>
                                      <span className="text-sm">{servicio.alcance_geografico}</span>
                                    </div>
                                  )}
                                  {servicio.paises_destino && (
                                    <div>
                                      <span className="text-sm font-medium">Países Destino: </span>
                                      <span className="text-sm">{servicio.paises_destino}</span>
                                    </div>
                                  )}
                                  {servicio.idiomas && servicio.idiomas.length > 0 && (
                                    <div>
                                      <span className="text-sm font-medium">Idiomas: </span>
                                      <span className="text-sm">{Array.isArray(servicio.idiomas) ? servicio.idiomas.join(', ') : servicio.idiomas}</span>
                                    </div>
                                  )}
                                  {servicio.forma_contratacion && (
                                    <div>
                                      <span className="text-sm font-medium">Forma de Contratación: </span>
                                      <span className="text-sm">{Array.isArray(servicio.forma_contratacion) ? servicio.forma_contratacion.join(', ') : servicio.forma_contratacion}</span>
                                    </div>
                                  )}
                                  {servicio.certificaciones_tecnicas && (
                                    <div className="md:col-span-2">
                                      <span className="text-sm font-medium">Certificaciones Técnicas: </span>
                                      <span className="text-sm">{servicio.certificaciones_tecnicas}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted-foreground py-4">No hay servicios registrados</p>
                    )}
                  </div>
                ) : null}
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
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
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
