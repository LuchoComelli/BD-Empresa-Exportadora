"use client"

import { useState, useEffect } from "react"
import { MainLayout } from "@/components/layout/main-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Download, FileText, BarChart3, TrendingUp, Building2, FileSpreadsheet } from "lucide-react"
import api from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { useDashboardAuth, handleAuthError } from "@/hooks/use-dashboard-auth"

interface DashboardStats {
  total_empresas: number
  exportadoras: number
  potencial_exportadora: number
  etapa_inicial: number
  pendientes: number
  aprobadas: number
  rechazadas: number
  en_revision: number
  tipo_producto: number
  tipo_servicio: number
  tipo_mixta: number
  con_certificado_pyme: number
}

interface Empresa {
  id: number
  razon_social: string
  cuit_cuil: string
  estado: string
  tipo_empresa?: string
  exporta?: string
  categoria_matriz?: string
  departamento?: string
  rubro_principal?: string
  actividades_promocion_internacional?: Array<{
    tipo: string
    lugar?: string
    anio?: string
    observaciones?: string
  }>
  [key: string]: any
}

export default function ReportesPage() {
  const { user, isLoading: authLoading, canAccessDashboard } = useDashboardAuth()
  const { toast } = useToast()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  
  // Estado para los filtros del reporte
  const [tipoReporte, setTipoReporte] = useState<string>("")
  const [formato, setFormato] = useState<string>("pdf")
  const [rubroSeleccionado, setRubroSeleccionado] = useState<string>("")
  const [departamentoSeleccionado, setDepartamentoSeleccionado] = useState<string>("")
  
  // Estados para opciones de filtros
  const [rubros, setRubros] = useState<any[]>([])
  const [departamentos, setDepartamentos] = useState<any[]>([])

  useEffect(() => {
    if (!authLoading && canAccessDashboard) {
      loadStats()
      loadRubros()
      loadDepartamentos()
    }
  }, [authLoading, canAccessDashboard])

  const loadStats = async () => {
    try {
      setLoading(true)
      const data = await api.getDashboardStats()
      setStats(data)
    } catch (error: any) {
      if (!handleAuthError(error)) {
        console.error("Error cargando estadísticas:", error)
        toast({
          title: "Error",
          description: "No se pudieron cargar las estadísticas",
          variant: "destructive",
        })
      }
    } finally {
      setLoading(false)
    }
  }

  const loadRubros = async () => {
    try {
      const data = await api.getRubros()
      setRubros(Array.isArray(data) ? data : (data.results || []))
    } catch (error) {
      console.error("Error cargando rubros:", error)
    }
  }

  const loadDepartamentos = async () => {
    try {
      const data = await api.getDepartamentos()
      setDepartamentos(Array.isArray(data) ? data : (data.results || []))
    } catch (error) {
      console.error("Error cargando departamentos:", error)
    }
  }

  const obtenerEmpresasFiltradas = async (tipoReporteParam?: string, rubroParam?: string, deptoParam?: string): Promise<Empresa[]> => {
    const tipo = tipoReporteParam || tipoReporte
    const rubro = rubroParam !== undefined ? rubroParam : rubroSeleccionado
    const depto = deptoParam !== undefined ? deptoParam : departamentoSeleccionado
    
    let params: any = {
      page_size: 10000 // Obtener todas las empresas
    }
    
    // Configurar parámetros según el tipo de reporte
    switch (tipo) {
      case "general":
        // Todas las empresas - sin filtros adicionales
        break
      case "exportadoras":
        params.categoria_matriz = "Exportadora"
        break
      case "potenciales":
        params.categoria_matriz = "Potencial"
        break
      case "etapa_inicial":
        params.categoria_matriz = "Etapa Inicial"
        break
      case "sector":
        if (rubro) {
          // Usar el ID del rubro (api.ts lo convierte a id_rubro)
          params.rubro = rubro
        }
        break
      case "ubicacion":
        if (depto) {
          // El backend ahora acepta el ID del departamento directamente
          params.departamento = depto
        }
        break
    }
    
    try {
      console.log('[Reportes] Tipo de reporte:', tipo)
      console.log('[Reportes] Parámetros de búsqueda:', params)
      const response = await api.getEmpresas(params)
      const empresas = Array.isArray(response) ? response : (response.results || response.data || [])
      console.log('[Reportes] Empresas encontradas:', empresas.length)
      if (empresas.length > 0 && tipo !== 'general') {
        console.log('[Reportes] Primeras 3 empresas (ejemplo):', empresas.slice(0, 3).map(e => ({
          id: e.id,
          razon_social: e.razon_social,
          categoria_matriz: e.categoria_matriz,
          departamento: e.departamento_nombre || e.departamento?.nombre || e.departamento
        })))
      }
      return empresas
    } catch (error) {
      console.error("Error obteniendo empresas:", error)
      throw error
    }
  }

  // Todos los campos disponibles para exportar (EXACTAMENTE los mismos que en export-dialog.tsx)
  const getAllAvailableFields = () => {
    return [
      // Información Básica
      { id: "razon_social", label: "Razón Social", field: "razon_social" },
      { id: "nombre_fantasia", label: "Nombre de Fantasía", field: "nombre_fantasia" },
      { id: "cuit_cuil", label: "CUIT/CUIL", field: "cuit_cuil" },
      { id: "tipo_sociedad", label: "Tipo de Sociedad", field: "tipo_sociedad" },
      { id: "tipo_empresa", label: "Tipo de Empresa", field: "tipo_empresa_nombre" },
      { id: "fecha_creacion", label: "Fecha de Registro", field: "fecha_creacion" },
      
      // Rubro y Categorización
      { id: "rubro_principal", label: "Rubro Principal", field: "rubro_nombre" },
      { id: "categoria_matriz", label: "Categoría Matriz", field: "categoria_matriz" },
      
      // Años por Etapa
      { id: "anos_etapa_inicial", label: "Años en Etapa Inicial", field: "anos_etapa_inicial" },
      { id: "anos_potencial_exportadora", label: "Años como Potencial Exportadora", field: "anos_potencial_exportadora" },
      { id: "anos_exportadora", label: "Años como Exportadora", field: "anos_exportadora" },
      
      // Ubicación
      { id: "departamento", label: "Departamento", field: "departamento_nombre" },
      { id: "municipio", label: "Municipio", field: "municipio_nombre" },
      { id: "localidad", label: "Localidad", field: "localidad_nombre" },
      { id: "direccion", label: "Dirección", field: "direccion" },
      { id: "codigo_postal", label: "Código Postal", field: "codigo_postal" },
      { id: "geolocalizacion", label: "Geolocalización", field: "geolocalizacion" },
      
      // Contacto
      { id: "telefono", label: "Teléfono", field: "telefono" },
      { id: "correo", label: "Email", field: "correo" },
      { id: "sitioweb", label: "Sitio Web", field: "sitioweb" },
      { id: "email_secundario", label: "Email Secundario", field: "email_secundario" },
      { id: "email_terciario", label: "Email Terciario", field: "email_terciario" },
      
      // Contacto Principal
      { id: "contacto_principal_nombre", label: "Contacto Principal - Nombre", field: "contacto_principal_nombre" },
      { id: "contacto_principal_cargo", label: "Contacto Principal - Cargo", field: "contacto_principal_cargo" },
      { id: "contacto_principal_telefono", label: "Contacto Principal - Teléfono", field: "contacto_principal_telefono" },
      { id: "contacto_principal_email", label: "Contacto Principal - Email", field: "contacto_principal_email" },
      
      // Contacto Secundario
      { id: "contacto_secundario_nombre", label: "Contacto Secundario - Nombre", field: "contacto_secundario_nombre" },
      { id: "contacto_secundario_cargo", label: "Contacto Secundario - Cargo", field: "contacto_secundario_cargo" },
      { id: "contacto_secundario_telefono", label: "Contacto Secundario - Teléfono", field: "contacto_secundario_telefono" },
      { id: "contacto_secundario_email", label: "Contacto Secundario - Email", field: "contacto_secundario_email" },
      
      // Actividad Comercial
      { id: "exporta", label: "¿Exporta?", field: "exporta" },
      { id: "destinoexporta", label: "Destino de Exportación", field: "destinoexporta" },
      { id: "importa", label: "¿Importa?", field: "importa" },
      { id: "interes_exportar", label: "Interés en Exportar", field: "interes_exportar" },
      
      // Certificaciones
      { id: "certificadopyme", label: "Certificado MiPYME", field: "certificadopyme" },
      { id: "certificaciones", label: "Certificaciones", field: "certificaciones" },
      
      // Promoción y Material
      { id: "promo2idiomas", label: "Material en Múltiples Idiomas", field: "promo2idiomas" },
      { id: "idiomas_trabaja", label: "Idiomas de Trabajo", field: "idiomas_trabaja" },
      
      // Actividades de Internacionalización
      { id: "ferias", label: "Ferias", field: "ferias" },
      { id: "rondas", label: "Rondas de Negocios", field: "rondas" },
      { id: "misiones", label: "Misiones Comerciales", field: "misiones" },
      
      // Otros
      { id: "observaciones", label: "Observaciones", field: "observaciones" },
    ]
  }

  const formatDate = (dateString: string | null | undefined): string => {
    if (!dateString) return ""
    
    try {
      const date = new Date(dateString)
      if (isNaN(date.getTime())) return String(dateString)
      
      const day = String(date.getDate()).padStart(2, '0')
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const year = date.getFullYear()
      
      return `${day}/${month}/${year}`
    } catch (e) {
      return String(dateString)
    }
  }

  const getFieldValue = (empresa: Empresa, fieldName: string, isExcel: boolean = false): any => {
    // Manejar campos especiales que vienen del JSON actividades_promocion_internacional
    if (fieldName === "ferias" || fieldName === "rondas" || fieldName === "misiones") {
      const actividades = empresa.actividades_promocion_internacional
      if (!actividades || !Array.isArray(actividades)) {
        return ""
      }
      
      const tipoMap: { [key: string]: string } = {
        "ferias": "feria",
        "rondas": "ronda",
        "misiones": "mision"
      }
      
      const tipo = tipoMap[fieldName]
      const actividadesFiltradas = actividades.filter((act: any) => act.tipo === tipo)
      
      if (actividadesFiltradas.length === 0) {
        return ""
      }
      
      // Formatear cada actividad como "Lugar (Año): Observaciones"
      return actividadesFiltradas.map((act: any) => {
        const partes = []
        if (act.lugar) partes.push(act.lugar)
        if (act.anio) partes.push(`(${act.anio})`)
        const actividadStr = partes.join(' ')
        if (act.observaciones) {
          return actividadStr ? `${actividadStr}: ${act.observaciones}` : act.observaciones
        }
        return actividadStr
      }).join('; ')
    }
    
    // Intentar obtener el valor del campo
    let value = empresa[fieldName]
    
    // Si el valor es null o undefined, retornar cadena vacía
    if (value === null || value === undefined) {
      // Para tipo_sociedad, verificar si existe en el objeto aunque sea null
      if (fieldName === "tipo_sociedad" && fieldName in empresa) {
        return "" // El campo existe pero está vacío
      }
      return ""
    }
    
    // Formatear fecha_creacion para Excel
    if (isExcel && fieldName === "fecha_creacion" && value) {
      return formatDate(String(value))
    }
    
    if (typeof value === 'boolean') return value ? 'Sí' : 'No'
    if (typeof value === 'object') {
      if (Array.isArray(value)) {
        return value.map(v => typeof v === 'object' ? JSON.stringify(v) : String(v)).join('; ')
      }
      if (value.nombre) return value.nombre
      if (value.razon_social) return value.razon_social
      return JSON.stringify(value)
    }
    
    // Convertir a string y limpiar espacios en blanco
    const stringValue = String(value).trim()
    return stringValue || ""
  }

  const escapeCSV = (value: any): string => {
    const stringValue = String(value)
    if (stringValue.includes(",") || stringValue.includes('"') || stringValue.includes("\n")) {
      return `"${stringValue.replace(/"/g, '""')}"`
    }
    return stringValue
  }

  const exportToCSV = (empresas: Empresa[]) => {
    const allFields = getAllAvailableFields()
    const headers = allFields.map(f => f.label)
    
    const csvLines: string[] = []
    csvLines.push(headers.join(','))
    
    empresas.forEach(empresa => {
      const row = allFields.map(field => {
        const value = getFieldValue(empresa, field.field, false)
        return escapeCSV(value)
      })
      csvLines.push(row.join(','))
    })

    const csvContent = csvLines.join("\n")
    const blob = new Blob(['\ufeff' + csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", `reporte_${tipoReporte}_${new Date().toISOString().split("T")[0]}.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const escapeHTML = (text: string): string => {
    const div = document.createElement('div')
    div.textContent = text
    return div.innerHTML
  }

  const exportToExcel = (empresas: Empresa[]) => {
    const allFields = getAllAvailableFields()
    const headers = allFields.map(f => f.label)
    
    // Crear contenido HTML para Excel (formato tabla con estilos)
    let htmlContent = `
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            table {
              border-collapse: collapse;
              width: 100%;
            }
            th {
              background-color: #3259B5;
              color: white;
              font-weight: bold;
              padding: 8px;
              text-align: left;
              border: 1px solid #ddd;
            }
            td {
              padding: 6px;
              border: 1px solid #ddd;
            }
            tr:nth-child(even) {
              background-color: #f2f2f2;
            }
          </style>
        </head>
        <body>
          <table>
            <thead>
              <tr>
                ${headers.map(h => `<th>${escapeHTML(h)}</th>`).join('')}
              </tr>
            </thead>
            <tbody>
    `
    
    empresas.forEach(empresa => {
      htmlContent += '<tr>'
      allFields.forEach(field => {
        const value = getFieldValue(empresa, field.field, true) // true para Excel
        const stringValue = String(value)
        htmlContent += `<td>${escapeHTML(stringValue)}</td>`
      })
      htmlContent += '</tr>'
    })
    
    htmlContent += `
            </tbody>
          </table>
        </body>
      </html>
    `
    
    const blob = new Blob(['\ufeff' + htmlContent], { type: "application/vnd.ms-excel;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", `reporte_${tipoReporte}_${new Date().toISOString().split("T")[0]}.xls`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const handleGenerateReport = async () => {
    if (!tipoReporte || !formato) {
      toast({
        title: "Campos requeridos",
        description: "Por favor selecciona el tipo de reporte y el formato",
        variant: "destructive",
      })
      return
    }

    // Validar filtros adicionales
    if (tipoReporte === "sector" && !rubroSeleccionado) {
      toast({
        title: "Filtro requerido",
        description: "Por favor selecciona un rubro para el reporte por sector",
        variant: "destructive",
      })
      return
    }

    if (tipoReporte === "ubicacion" && !departamentoSeleccionado) {
      toast({
        title: "Filtro requerido",
        description: "Por favor selecciona un departamento para el reporte por ubicación",
        variant: "destructive",
      })
      return
    }

    try {
      setGenerating(true)
      
      // Obtener empresas filtradas
      const empresas = await obtenerEmpresasFiltradas()
      
      if (empresas.length === 0) {
        toast({
          title: "Sin resultados",
          description: "No se encontraron empresas con los filtros seleccionados",
          variant: "destructive",
        })
        return
      }

      // Exportar según el formato
      if (formato === "pdf") {
        // Usar la lógica existente de exportación PDF con todos los campos
        const empresasIds = empresas.map(e => e.id)
        const allFields = getAllAvailableFields()
        const camposParaPDF = allFields.map(f => f.id)
        
        const blob = await api.exportEmpresasSeleccionadasPDF(empresasIds, camposParaPDF)
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `reporte_${tipoReporte}_${new Date().toISOString().split('T')[0]}.pdf`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      } else if (formato === "csv") {
        exportToCSV(empresas)
      } else if (formato === "excel") {
        exportToExcel(empresas)
      }
      
      toast({
        title: "Éxito",
        description: `Reporte generado y descargado correctamente (${empresas.length} empresas)`,
      })
    } catch (error: any) {
      console.error("Error generando reporte:", error)
      toast({
        title: "Error",
        description: error.message || "No se pudo generar el reporte",
        variant: "destructive",
      })
    } finally {
      setGenerating(false)
    }
  }

  const handlePredefinedReport = async (tipo: string, nombre: string, formatoPredefinido: string = "pdf") => {
    try {
      setGenerating(true)
      
      // Determinar el tipo de reporte
      const tipoReporteTemp = tipo === "completo" ? "general" : tipo
      
      // Obtener empresas filtradas (sin estado, ya que lo quitamos)
      const empresas = await obtenerEmpresasFiltradas(tipoReporteTemp)

      if (empresas.length === 0) {
        toast({
          title: "Sin resultados",
          description: "No se encontraron empresas para este reporte",
          variant: "destructive",
        })
        return
      }

      if (formatoPredefinido === "pdf") {
        const empresasIds = empresas.map(e => e.id)
        const allFields = getAllAvailableFields()
        const camposParaPDF = allFields.map(f => f.id)
        
        const blob = await api.exportEmpresasSeleccionadasPDF(empresasIds, camposParaPDF)
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `${nombre}_${new Date().toISOString().split('T')[0]}.pdf`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      } else if (formatoPredefinido === "csv") {
        exportToCSV(empresas)
      } else if (formatoPredefinido === "excel") {
        exportToExcel(empresas)
      }
      
      toast({
        title: "Éxito",
        description: `Reporte generado y descargado correctamente (${empresas.length} empresas)`,
      })
    } catch (error: any) {
      console.error("Error generando reporte predefinido:", error)
      toast({
        title: "Error",
        description: error.message || "No se pudo generar el reporte",
        variant: "destructive",
      })
    } finally {
      setGenerating(false)
    }
  }

  // Mostrar carga mientras se verifica el usuario
  if (authLoading || !user) {
    return (
      <MainLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <p className="text-lg text-[#6B7280]">Cargando...</p>
          </div>
        </div>
      </MainLayout>
    )
  }

  // Verificar permisos final
  if (!canAccessDashboard) {
    return null
  }

  return (
    <MainLayout>
      <div className="space-y-4 md:space-y-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-[#222A59]">Reportes y Estadísticas</h1>
          <p className="text-sm md:text-base text-muted-foreground mt-1 md:mt-2">Genera reportes personalizados y exporta datos del sistema</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          <Card>
            <CardHeader className="pb-2 md:pb-3">
              <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground">Total Empresas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-xl md:text-2xl font-bold text-[#222A59]">
                  {loading ? "..." : stats?.total_empresas || 0}
                </div>
                <Building2 className="h-6 w-6 md:h-8 md:w-8 text-[#3259B5]" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2 md:pb-3">
              <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground">Exportadoras</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-xl md:text-2xl font-bold text-[#C3C840]">
                  {loading ? "..." : stats?.exportadoras || 0}
                </div>
                <TrendingUp className="h-6 w-6 md:h-8 md:w-8 text-[#C3C840]" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2 md:pb-3">
              <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground">Potenciales</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-xl md:text-2xl font-bold text-[#F59E0B]">
                  {loading ? "..." : stats?.potencial_exportadora || 0}
                </div>
                <BarChart3 className="h-6 w-6 md:h-8 md:w-8 text-[#F59E0B]" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2 md:pb-3">
              <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground">Etapa Inicial</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-xl md:text-2xl font-bold text-[#629BD2]">
                  {loading ? "..." : stats?.etapa_inicial || 0}
                </div>
                <FileText className="h-6 w-6 md:h-8 md:w-8 text-[#629BD2]" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-[#222A59]">Generar Reporte</CardTitle>
            <CardDescription>Selecciona los parámetros para generar un reporte personalizado</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 md:space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
              <div className="space-y-2">
                <Label htmlFor="tipo-reporte">Tipo de Reporte</Label>
                <Select value={tipoReporte} onValueChange={(value) => {
                  setTipoReporte(value)
                  // Limpiar filtros adicionales cuando cambia el tipo
                  setRubroSeleccionado("")
                  setDepartamentoSeleccionado("")
                }}>
                  <SelectTrigger id="tipo-reporte">
                    <SelectValue placeholder="Seleccionar tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">Reporte General</SelectItem>
                    <SelectItem value="exportadoras">Exportadoras (12-18 pts)</SelectItem>
                    <SelectItem value="potenciales">Potenciales Exportadoras (6-11 pts)</SelectItem>
                    <SelectItem value="etapa_inicial">Etapa Inicial (0-5 pts)</SelectItem>
                    <SelectItem value="sector">Por Sector</SelectItem>
                    <SelectItem value="ubicacion">Por Ubicación</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Filtro adicional para Sector */}
              {tipoReporte === "sector" && (
                <div className="space-y-2">
                  <Label htmlFor="rubro">Rubro</Label>
                  <Select value={rubroSeleccionado} onValueChange={setRubroSeleccionado}>
                    <SelectTrigger id="rubro">
                      <SelectValue placeholder="Seleccionar rubro" />
                    </SelectTrigger>
                    <SelectContent>
                      {rubros.map((rubro) => (
                        <SelectItem key={rubro.id} value={String(rubro.id)}>
                          {rubro.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Filtro adicional para Ubicación */}
              {tipoReporte === "ubicacion" && (
                <div className="space-y-2">
                  <Label htmlFor="departamento">Departamento</Label>
                  <Select value={departamentoSeleccionado} onValueChange={setDepartamentoSeleccionado}>
                    <SelectTrigger id="departamento">
                      <SelectValue placeholder="Seleccionar departamento" />
                    </SelectTrigger>
                    <SelectContent>
                      {departamentos.map((depto) => (
                        <SelectItem key={depto.id} value={String(depto.id)}>
                          {depto.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="formato">Formato de Exportación</Label>
                <Select value={formato} onValueChange={setFormato}>
                  <SelectTrigger id="formato">
                    <SelectValue placeholder="Seleccionar formato" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pdf">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        PDF
                      </div>
                    </SelectItem>
                    <SelectItem value="excel">
                      <div className="flex items-center gap-2">
                        <FileSpreadsheet className="h-4 w-4" />
                        Excel (XLS)
                      </div>
                    </SelectItem>
                    <SelectItem value="csv">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        CSV
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 md:gap-3">
              <Button 
                className="bg-[#3259B5] hover:bg-[#222A59] gap-2 w-full sm:w-auto"
                onClick={handleGenerateReport}
                disabled={generating || !tipoReporte || !formato || (tipoReporte === "sector" && !rubroSeleccionado) || (tipoReporte === "ubicacion" && !departamentoSeleccionado)}
              >
                <Download className="h-4 w-4" />
                {generating ? "Generando..." : "Generar y Descargar"}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-[#222A59]">Reportes Predefinidos</CardTitle>
            <CardDescription>Accede rápidamente a reportes frecuentes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
              <Button 
                variant="outline" 
                className="h-auto py-3 md:py-4 justify-start gap-2 md:gap-3 bg-transparent"
                onClick={async () => {
                  try {
                    setGenerating(true)
                    const empresas = await obtenerEmpresasFiltradas("general")
                    if (empresas.length === 0) {
                      toast({
                        title: "Sin resultados",
                        description: "No se encontraron empresas",
                        variant: "destructive",
                      })
                      return
                    }
                    const empresasIds = empresas.map(e => e.id)
                    const allFields = getAllAvailableFields()
                    const camposParaPDF = allFields.map(f => f.id)
                    const blob = await api.exportEmpresasSeleccionadasPDF(empresasIds, camposParaPDF)
                    const url = window.URL.createObjectURL(blob)
                    const a = document.createElement("a")
                    a.href = url
                    a.download = `listado_completo_empresas_${new Date().toISOString().split('T')[0]}.pdf`
                    document.body.appendChild(a)
                    a.click()
                    window.URL.revokeObjectURL(url)
                    document.body.removeChild(a)
                    toast({
                      title: "Éxito",
                      description: `Reporte generado (${empresas.length} empresas)`,
                    })
                  } catch (error: any) {
                    toast({
                      title: "Error",
                      description: error.message || "No se pudo generar el reporte",
                      variant: "destructive",
                    })
                  } finally {
                    setGenerating(false)
                  }
                }}
                disabled={generating}
              >
                <FileText className="h-4 w-4 md:h-5 md:w-5 text-[#3259B5] flex-shrink-0" />
                <div className="text-left min-w-0">
                  <div className="font-semibold text-sm md:text-base">Listado Completo de Empresas</div>
                  <div className="text-xs text-muted-foreground">Todas las empresas registradas (PDF)</div>
                </div>
              </Button>

              <Button 
                variant="outline" 
                className="h-auto py-3 md:py-4 justify-start gap-2 md:gap-3 bg-transparent"
                onClick={async () => {
                  try {
                    setGenerating(true)
                    const empresas = await obtenerEmpresasFiltradas("exportadoras")
                    if (empresas.length === 0) {
                      toast({
                        title: "Sin resultados",
                        description: "No se encontraron empresas exportadoras",
                        variant: "destructive",
                      })
                      return
                    }
                    const empresasIds = empresas.map(e => e.id)
                    const allFields = getAllAvailableFields()
                    const camposParaPDF = allFields.map(f => f.id)
                    const blob = await api.exportEmpresasSeleccionadasPDF(empresasIds, camposParaPDF)
                    const url = window.URL.createObjectURL(blob)
                    const a = document.createElement("a")
                    a.href = url
                    a.download = `empresas_exportadoras_${new Date().toISOString().split('T')[0]}.pdf`
                    document.body.appendChild(a)
                    a.click()
                    window.URL.revokeObjectURL(url)
                    document.body.removeChild(a)
                    toast({
                      title: "Éxito",
                      description: `Reporte generado (${empresas.length} empresas)`,
                    })
                  } catch (error: any) {
                    toast({
                      title: "Error",
                      description: error.message || "No se pudo generar el reporte",
                      variant: "destructive",
                    })
                  } finally {
                    setGenerating(false)
                  }
                }}
                disabled={generating}
              >
                <BarChart3 className="h-4 w-4 md:h-5 md:w-5 text-[#C3C840] flex-shrink-0" />
                <div className="text-left min-w-0">
                  <div className="font-semibold text-sm md:text-base">Empresas Exportadoras</div>
                  <div className="text-xs text-muted-foreground">Categoría: Exportadora (12-18 pts) - PDF</div>
                </div>
              </Button>

              <Button 
                variant="outline" 
                className="h-auto py-3 md:py-4 justify-start gap-2 md:gap-3 bg-transparent"
                onClick={async () => {
                  try {
                    setGenerating(true)
                    const empresas = await obtenerEmpresasFiltradas("potenciales")
                    if (empresas.length === 0) {
                      toast({
                        title: "Sin resultados",
                        description: "No se encontraron empresas potenciales",
                        variant: "destructive",
                      })
                      return
                    }
                    const empresasIds = empresas.map(e => e.id)
                    const allFields = getAllAvailableFields()
                    const camposParaPDF = allFields.map(f => f.id)
                    const blob = await api.exportEmpresasSeleccionadasPDF(empresasIds, camposParaPDF)
                    const url = window.URL.createObjectURL(blob)
                    const a = document.createElement("a")
                    a.href = url
                    a.download = `empresas_potenciales_exportadoras_${new Date().toISOString().split('T')[0]}.pdf`
                    document.body.appendChild(a)
                    a.click()
                    window.URL.revokeObjectURL(url)
                    document.body.removeChild(a)
                    toast({
                      title: "Éxito",
                      description: `Reporte generado (${empresas.length} empresas)`,
                    })
                  } catch (error: any) {
                    toast({
                      title: "Error",
                      description: error.message || "No se pudo generar el reporte",
                      variant: "destructive",
                    })
                  } finally {
                    setGenerating(false)
                  }
                }}
                disabled={generating}
              >
                <TrendingUp className="h-4 w-4 md:h-5 md:w-5 text-[#F59E0B] flex-shrink-0" />
                <div className="text-left min-w-0">
                  <div className="font-semibold text-sm md:text-base">Potenciales Exportadoras</div>
                  <div className="text-xs text-muted-foreground">Categoría: Potencial (6-11 pts) - PDF</div>
                </div>
              </Button>

              <Button 
                variant="outline" 
                className="h-auto py-3 md:py-4 justify-start gap-2 md:gap-3 bg-transparent"
                onClick={async () => {
                  try {
                    setGenerating(true)
                    const empresas = await obtenerEmpresasFiltradas("etapa_inicial")
                    if (empresas.length === 0) {
                      toast({
                        title: "Sin resultados",
                        description: "No se encontraron empresas en etapa inicial",
                        variant: "destructive",
                      })
                      return
                    }
                    const empresasIds = empresas.map(e => e.id)
                    const allFields = getAllAvailableFields()
                    const camposParaPDF = allFields.map(f => f.id)
                    const blob = await api.exportEmpresasSeleccionadasPDF(empresasIds, camposParaPDF)
                    const url = window.URL.createObjectURL(blob)
                    const a = document.createElement("a")
                    a.href = url
                    a.download = `empresas_etapa_inicial_${new Date().toISOString().split('T')[0]}.pdf`
                    document.body.appendChild(a)
                    a.click()
                    window.URL.revokeObjectURL(url)
                    document.body.removeChild(a)
                    toast({
                      title: "Éxito",
                      description: `Reporte generado (${empresas.length} empresas)`,
                    })
                  } catch (error: any) {
                    toast({
                      title: "Error",
                      description: error.message || "No se pudo generar el reporte",
                      variant: "destructive",
                    })
                  } finally {
                    setGenerating(false)
                  }
                }}
                disabled={generating}
              >
                <Building2 className="h-4 w-4 md:h-5 md:w-5 text-[#629BD2] flex-shrink-0" />
                <div className="text-left min-w-0">
                  <div className="font-semibold text-sm md:text-base">Etapa Inicial</div>
                  <div className="text-xs text-muted-foreground">Categoría: Etapa Inicial (0-5 pts) - PDF</div>
                </div>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  )
}
