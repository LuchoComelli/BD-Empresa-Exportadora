import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Eye } from "lucide-react"

interface Company {
  id: number
  nombre: string
  categoria: "Exportadora" | "Potencial Exportadora" | "Etapa Inicial"
  ubicacion: string
  fecha: string
  estado: string
}

interface RecentCompaniesTableProps {
  companies: Company[]
}

function getCategoryColor(category: string) {
  switch (category) {
    case "Exportadora":
      return "bg-[#C3C840] text-[#222A59]"
    case "Potencial Exportadora":
      return "bg-[#F59E0B] text-white"
    case "Etapa Inicial":
      return "bg-[#629BD2] text-white"
    default:
      return "bg-gray-500 text-white"
  }
}

export function RecentCompaniesTable({ companies }: RecentCompaniesTableProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-[#222A59] text-lg md:text-xl">Empresas Recientes</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px]">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 md:py-3 px-2 md:px-4 text-xs md:text-sm font-semibold text-[#222A59]">
                  Empresa
                </th>
                <th className="text-left py-2 md:py-3 px-2 md:px-4 text-xs md:text-sm font-semibold text-[#222A59]">
                  Ubicación
                </th>
                <th className="text-left py-2 md:py-3 px-2 md:px-4 text-xs md:text-sm font-semibold text-[#222A59]">
                  Categoría
                </th>
                <th className="text-left py-2 md:py-3 px-2 md:px-4 text-xs md:text-sm font-semibold text-[#222A59]">
                  Estado
                </th>
                <th className="text-left py-2 md:py-3 px-2 md:px-4 text-xs md:text-sm font-semibold text-[#222A59]">
                  Fecha
                </th>
                <th className="text-right py-2 md:py-3 px-2 md:px-4 text-xs md:text-sm font-semibold text-[#222A59]">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody>
              {companies.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-sm text-muted-foreground">
                    No hay empresas recientes
                  </td>
                </tr>
              ) : (
                companies.map((company, index) => (
                  <tr key={company.id} className={index % 2 === 0 ? "bg-white" : "bg-muted/30"}>
                    <td className="py-2 md:py-3 px-2 md:px-4 text-xs md:text-sm font-medium text-foreground">
                      {company.nombre}
                    </td>
                    <td className="py-2 md:py-3 px-2 md:px-4 text-xs md:text-sm text-muted-foreground">
                      {company.ubicacion}
                    </td>
                    <td className="py-2 md:py-3 px-2 md:px-4">
                      <Badge className={`${getCategoryColor(company.categoria)} text-xs`}>
                        {company.categoria}
                      </Badge>
                    </td>
                    <td className="py-2 md:py-3 px-2 md:px-4">
                      <Badge variant="outline" className="text-xs capitalize">
                        {company.estado}
                      </Badge>
                    </td>
                    <td className="py-2 md:py-3 px-2 md:px-4 text-xs md:text-sm text-muted-foreground">
                      {new Date(company.fecha).toLocaleDateString("es-AR")}
                    </td>
                    <td className="py-2 md:py-3 px-2 md:px-4 text-right">
                      <Button variant="ghost" size="sm">
                        <Eye className="h-3 w-3 md:h-4 md:w-4" />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}
