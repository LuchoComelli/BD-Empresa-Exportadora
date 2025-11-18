import { MainLayout } from "@/components/layout/main-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Download, FileText, BarChart3, TrendingUp, Building2 } from "lucide-react"

export default function ReportesPage() {
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
                <div className="text-xl md:text-2xl font-bold text-[#222A59]">156</div>
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
                <div className="text-xl md:text-2xl font-bold text-[#C3C840]">45</div>
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
                <div className="text-xl md:text-2xl font-bold text-[#F59E0B]">67</div>
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
                <div className="text-xl md:text-2xl font-bold text-[#629BD2]">44</div>
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
                <Select>
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
                <Select>
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
                <Select>
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
              <Button className="bg-[#3259B5] hover:bg-[#222A59] gap-2 w-full sm:w-auto">
                <Download className="h-4 w-4" />
                Generar y Descargar
              </Button>
              <Button variant="outline" className="w-full sm:w-auto">Vista Previa</Button>
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
              <Button variant="outline" className="h-auto py-3 md:py-4 justify-start gap-2 md:gap-3 bg-transparent">
                <FileText className="h-4 w-4 md:h-5 md:w-5 text-[#3259B5] flex-shrink-0" />
                <div className="text-left min-w-0">
                  <div className="font-semibold text-sm md:text-base">Listado Completo de Empresas</div>
                  <div className="text-xs text-muted-foreground">Todas las empresas registradas</div>
                </div>
              </Button>

              <Button variant="outline" className="h-auto py-3 md:py-4 justify-start gap-2 md:gap-3 bg-transparent">
                <BarChart3 className="h-4 w-4 md:h-5 md:w-5 text-[#C3C840] flex-shrink-0" />
                <div className="text-left min-w-0">
                  <div className="font-semibold text-sm md:text-base">Empresas Exportadoras</div>
                  <div className="text-xs text-muted-foreground">Categoría: Exportadora (12-18 pts)</div>
                </div>
              </Button>

              <Button variant="outline" className="h-auto py-3 md:py-4 justify-start gap-2 md:gap-3 bg-transparent">
                <TrendingUp className="h-4 w-4 md:h-5 md:w-5 text-[#F59E0B] flex-shrink-0" />
                <div className="text-left min-w-0">
                  <div className="font-semibold text-sm md:text-base">Potenciales Exportadoras</div>
                  <div className="text-xs text-muted-foreground">Categoría: Potencial (6-11 pts)</div>
                </div>
              </Button>

              <Button variant="outline" className="h-auto py-3 md:py-4 justify-start gap-2 md:gap-3 bg-transparent">
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

