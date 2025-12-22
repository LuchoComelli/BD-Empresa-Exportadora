import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Eye } from "lucide-react"
import Link from "next/link"

interface Company {
  id: number
  nombre: string
  categoria: "Exportadora" | "Potencial Exportadora" | "Etapa Inicial"
  ubicacion: string
  fecha: string
  estado: string
  tipo_empresa?: string
}

interface RecentCompaniesTableProps {
  companies: Company[]
}

function getCategoryColor(category: string) {
  switch (category) {
    case "Exportadora":
      return "bg-[#C3C840] text-[#222A59]"
    case "Potencial Exportadora":
      return "bg-[#C0217E] text-white"
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
        <CardTitle className="text-[#222A59] text-base md:text-lg lg:text-xl">Empresas Recientes</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {/* Vista de Cards para móviles */}
        <div className="block lg:hidden p-4 space-y-3">
          {companies.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              No hay empresas recientes
            </div>
          ) : (
            companies.map((company, index) => {
              const uniqueKey = company.tipo_empresa 
                ? `${company.id}-${company.tipo_empresa}` 
                : `company-${company.id}-${index}`
              return (
                <div
                  key={uniqueKey}
                  className="border rounded-lg p-4 space-y-2 bg-white border-border"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm text-foreground truncate">
                        {company.nombre}
                      </div>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      asChild
                      className="h-8 w-8 p-0 hover:bg-[#3259B5]/10 hover:text-[#3259B5] shrink-0"
                    >
                      <Link href={`/dashboard/empresas/${company.id}`}>
                        <Eye className="h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                  <div className="space-y-1.5 text-xs">
                    <div className="text-muted-foreground">
                      <span className="font-medium">Ubicación: </span>
                      {company.ubicacion}
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge className={`${getCategoryColor(company.categoria)} text-xs`}>
                        {company.categoria}
                      </Badge>
                      <Badge variant="outline" className="text-xs capitalize">
                        {company.estado}
                      </Badge>
                    </div>
                    <div className="text-muted-foreground">
                      <span className="font-medium">Fecha: </span>
                      {new Date(company.fecha).toLocaleDateString("es-AR")}
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Vista de Tabla para pantallas grandes */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left py-3 px-4 text-sm font-semibold text-[#222A59]">
                  Empresa
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-[#222A59]">
                  Ubicación
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-[#222A59]">
                  Categoría
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-[#222A59]">
                  Estado
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-[#222A59]">
                  Fecha
                </th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-[#222A59]">
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
                companies.map((company, index) => {
                  const uniqueKey = company.tipo_empresa 
                    ? `${company.id}-${company.tipo_empresa}` 
                    : `company-${company.id}-${index}`
                  return (
                    <tr key={uniqueKey} className={index % 2 === 0 ? "bg-white" : "bg-muted/30"}>
                      <td className="py-3 px-4 text-sm font-medium text-foreground">
                        {company.nombre}
                      </td>
                      <td className="py-3 px-4 text-sm text-muted-foreground">
                        {company.ubicacion}
                      </td>
                      <td className="py-3 px-4">
                        <Badge className={`${getCategoryColor(company.categoria)} text-xs`}>
                          {company.categoria}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant="outline" className="text-xs capitalize">
                          {company.estado}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-sm text-muted-foreground">
                        {new Date(company.fecha).toLocaleDateString("es-AR")}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          asChild
                          className="hover:bg-[#3259B5]/10 hover:text-[#3259B5]"
                        >
                          <Link href={`/dashboard/empresas/${company.id}`}>
                            <Eye className="h-4 w-4" />
                          </Link>
                        </Button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}
