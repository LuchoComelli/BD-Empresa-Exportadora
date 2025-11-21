"use client"

import { useState, useEffect } from "react"
import { MainLayout } from "@/components/layout/main-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Download, FileText, BarChart3, TrendingUp, Building2 } from "lucide-react"
import api from "@/lib/api"
import { useToast } from "@/hooks/use-toast"

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

export default function ReportesPage() {
  const { toast } = useToast()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  
  // Estado para los filtros del reporte
  const [tipoReporte, setTipoReporte] = useState<string>("")
  const [periodo, setPeriodo] = useState<string>("")
  const [formato, setFormato] = useState<string>("pdf")

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      setLoading(true)
      const data = await api.getDashboardStats()
      setStats(data)
    } catch (error) {
      console.error("Error cargando estadísticas:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar las estadísticas",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
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

    try {
      setGenerating(true)
      
      let params: any = {}
      
      // Configurar parámetros según el tipo de reporte
      switch (tipoReporte) {
        case "general":
          // Reporte general - todas las empresas
          break
        case "categoria":
          // Por categoría - necesitaríamos más filtros
          break
        case "sector":
          // Por sector - necesitaríamos más filtros
          break
        case "ubicacion":
          // Por ubicación - necesitaríamos más filtros
          break
        case "certificaciones":
          params.exporta = "certificaciones"
          break
      }

      // Exportar según el formato
      if (formato === "pdf") {
        const blob = await api.exportEmpresasPDF(params)
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `reporte_${tipoReporte}_${new Date().toISOString().split('T')[0]}.pdf`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
        
        toast({
          title: "Éxito",
          description: "Reporte generado y descargado correctamente",
        })
      } else {
        toast({
          title: "Formato no disponible",
          description: "Por el momento solo está disponible la exportación en PDF",
          variant: "destructive",
        })
      }
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

  const handlePredefinedReport = async (tipo: string, nombre: string) => {
    try {
      setGenerating(true)
      
      let params: any = {}
      
      switch (tipo) {
        case "completo":
          // Todas las empresas
          break
        case "exportadoras":
          params.exporta = "exportadoras"
          break
        case "potenciales":
          params.exporta = "potenciales"
          break
        case "sector":
          // Distribución por sector - necesitaríamos más lógica
          break
      }

      const blob = await api.exportEmpresasPDF(params)
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `${nombre}_${new Date().toISOString().split('T')[0]}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      
      toast({
        title: "Éxito",
        description: "Reporte generado y descargado correctamente",
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
                <Select value={tipoReporte} onValueChange={setTipoReporte}>
                  <SelectTrigger id="tipo-reporte">
                    <SelectValue placeholder="Seleccionar tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">Reporte General</SelectItem>
                    <SelectItem value="categoria">Por Categoría</SelectItem>
                    <SelectItem value="sector">Por Sector</SelectItem>
                    <SelectItem value="ubicacion">Por Ubicación</SelectItem>
                    <SelectItem value="certificaciones">Certificaciones</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="periodo">Período</Label>
                <Select value={periodo} onValueChange={setPeriodo}>
                  <SelectTrigger id="periodo">
                    <SelectValue placeholder="Seleccionar período" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mes">Último mes</SelectItem>
                    <SelectItem value="trimestre">Último trimestre</SelectItem>
                    <SelectItem value="semestre">Último semestre</SelectItem>
                    <SelectItem value="anio">Último año</SelectItem>
                    <SelectItem value="todo">Todo el período</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="formato">Formato de Exportación</Label>
                <Select value={formato} onValueChange={setFormato}>
                  <SelectTrigger id="formato">
                    <SelectValue placeholder="Seleccionar formato" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pdf">PDF</SelectItem>
                    <SelectItem value="excel">Excel (XLSX)</SelectItem>
                    <SelectItem value="csv">CSV</SelectItem>
                    <SelectItem value="json">JSON</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 md:gap-3">
              <Button 
                className="bg-[#3259B5] hover:bg-[#222A59] gap-2 w-full sm:w-auto"
                onClick={handleGenerateReport}
                disabled={generating || !tipoReporte || !formato}
              >
                <Download className="h-4 w-4" />
                {generating ? "Generando..." : "Generar y Descargar"}
              </Button>
              <Button 
                variant="outline" 
                className="w-full sm:w-auto"
                onClick={() => {
                  toast({
                    title: "Vista Previa",
                    description: "La funcionalidad de vista previa estará disponible próximamente",
                  })
                }}
              >
                Vista Previa
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
                onClick={() => handlePredefinedReport("completo", "listado_completo_empresas")}
                disabled={generating}
              >
                <FileText className="h-4 w-4 md:h-5 md:w-5 text-[#3259B5] flex-shrink-0" />
                <div className="text-left min-w-0">
                  <div className="font-semibold text-sm md:text-base">Listado Completo de Empresas</div>
                  <div className="text-xs text-muted-foreground">Todas las empresas registradas</div>
                </div>
              </Button>

              <Button 
                variant="outline" 
                className="h-auto py-3 md:py-4 justify-start gap-2 md:gap-3 bg-transparent"
                onClick={() => handlePredefinedReport("exportadoras", "empresas_exportadoras")}
                disabled={generating}
              >
                <BarChart3 className="h-4 w-4 md:h-5 md:w-5 text-[#C3C840] flex-shrink-0" />
                <div className="text-left min-w-0">
                  <div className="font-semibold text-sm md:text-base">Empresas Exportadoras</div>
                  <div className="text-xs text-muted-foreground">Categoría: Exportadora (12-18 pts)</div>
                </div>
              </Button>

              <Button 
                variant="outline" 
                className="h-auto py-3 md:py-4 justify-start gap-2 md:gap-3 bg-transparent"
                onClick={() => handlePredefinedReport("potenciales", "empresas_potenciales_exportadoras")}
                disabled={generating}
              >
                <TrendingUp className="h-4 w-4 md:h-5 md:w-5 text-[#F59E0B] flex-shrink-0" />
                <div className="text-left min-w-0">
                  <div className="font-semibold text-sm md:text-base">Potenciales Exportadoras</div>
                  <div className="text-xs text-muted-foreground">Categoría: Potencial (6-11 pts)</div>
                </div>
              </Button>

              <Button 
                variant="outline" 
                className="h-auto py-3 md:py-4 justify-start gap-2 md:gap-3 bg-transparent"
                onClick={() => {
                  toast({
                    title: "Próximamente",
                    description: "El reporte de distribución por sector estará disponible próximamente",
                  })
                }}
                disabled={generating}
              >
                <Building2 className="h-4 w-4 md:h-5 md:w-5 text-[#629BD2] flex-shrink-0" />
                <div className="text-left min-w-0">
                  <div className="font-semibold text-sm md:text-base">Distribución por Sector</div>
                  <div className="text-xs text-muted-foreground">Análisis sectorial completo</div>
                </div>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  )
}
