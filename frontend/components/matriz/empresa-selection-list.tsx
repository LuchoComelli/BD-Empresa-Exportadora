"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Building2, MapPin, Phone, Mail, ChevronRight } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"

interface Empresa {
  id: number
  razon_social: string
  tipo_empresa?: string
  rubro_nombre?: string
  departamento_nombre?: string
  municipio_nombre?: string
  telefono?: string
  correo?: string
  categoria_matriz?: string
  exporta?: string
}

interface EmpresaSelectionListProps {
  empresas: Empresa[]
  loading: boolean
  selectedEmpresaId?: string
  onSelectEmpresa: (empresaId: string) => void
}

function getCategoryFromEmpresa(empresa: Empresa): "Exportadora" | "Potencial Exportadora" | "Etapa Inicial" {
  if (empresa.categoria_matriz) {
    return empresa.categoria_matriz as "Exportadora" | "Potencial Exportadora" | "Etapa Inicial"
  }
  if (empresa.exporta === 'Sí' || empresa.exporta === 'si') return "Exportadora"
  if (empresa.exporta === 'en-proceso') return "Potencial Exportadora"
  return "Etapa Inicial"
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

function getTipoEmpresaColor(tipo?: string) {
  switch (tipo?.toLowerCase()) {
    case "producto":
    case "productos":
      return "bg-blue-100 text-blue-800 border-blue-200"
    case "servicio":
    case "servicios":
      return "bg-green-100 text-green-800 border-green-200"
    case "mixta":
    case "ambos":
      return "bg-purple-100 text-purple-800 border-purple-200"
    default:
      return "bg-gray-100 text-gray-800 border-gray-200"
  }
}

export function EmpresaSelectionList({
  empresas,
  loading,
  selectedEmpresaId,
  onSelectEmpresa,
}: EmpresaSelectionListProps) {
  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-3/4 mx-auto"></div>
            <div className="h-4 bg-muted rounded w-1/2 mx-auto"></div>
            <div className="h-4 bg-muted rounded w-2/3 mx-auto"></div>
          </div>
          <p className="text-muted-foreground mt-6 text-sm">Cargando empresas...</p>
        </div>
      </div>
    )
  }

  if (empresas.length === 0) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <Building2 className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-muted-foreground font-medium">No se encontraron empresas</p>
          <p className="text-sm text-muted-foreground mt-2">
            Intenta ajustar los filtros de búsqueda
          </p>
        </div>
      </div>
    )
  }

  return (
    <ScrollArea className="h-[calc(100vh-400px)] min-h-[400px] max-h-[700px]">
      <div className="divide-y divide-border">
        {empresas.map((empresa) => {
          const isSelected = selectedEmpresaId === empresa.id.toString()
          const category = getCategoryFromEmpresa(empresa)

          return (
            <button
              key={empresa.id}
              onClick={() => onSelectEmpresa(empresa.id.toString())}
              className={`w-full text-left p-5 transition-all hover:bg-[#EFF6FF] focus:outline-none focus:ring-2 focus:ring-[#3259B5] focus:ring-inset ${
                isSelected
                  ? "bg-[#3259B5]/5 border-l-4 border-l-[#3259B5]"
                  : "border-l-4 border-l-transparent"
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0 space-y-3">
                  {/* Nombre y tipo */}
                  <div className="space-y-2">
                    <h3
                      className={`font-semibold text-sm md:text-base leading-tight line-clamp-2 ${
                        isSelected ? "text-[#3259B5]" : "text-[#222A59]"
                      }`}
                    >
                      {empresa.razon_social}
                    </h3>
                    <div className="flex items-center gap-2 flex-wrap">
                      {empresa.tipo_empresa && (
                        <Badge
                          variant="outline"
                          className={`text-xs font-medium ${getTipoEmpresaColor(empresa.tipo_empresa)}`}
                        >
                          {empresa.tipo_empresa}
                        </Badge>
                      )}
                      <Badge className={`${getCategoryColor(category)} text-xs font-medium`}>
                        {category}
                      </Badge>
                    </div>
                  </div>

                  {/* Información detallada */}
                  <div className="space-y-2 text-xs md:text-sm text-muted-foreground">
                    {empresa.rubro_nombre && (
                      <div className="flex items-start gap-2">
                        <Building2 className="h-4 w-4 text-[#3259B5] flex-shrink-0 mt-0.5" />
                        <span className="line-clamp-1">{empresa.rubro_nombre}</span>
                      </div>
                    )}
                    {(empresa.departamento_nombre || empresa.municipio_nombre) && (
                      <div className="flex items-start gap-2">
                        <MapPin className="h-4 w-4 text-[#3259B5] flex-shrink-0 mt-0.5" />
                        <span className="line-clamp-1">
                          {[empresa.municipio_nombre, empresa.departamento_nombre]
                            .filter(Boolean)
                            .join(", ")}
                        </span>
                      </div>
                    )}
                    {empresa.telefono && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-[#3259B5] flex-shrink-0" />
                        <span>{empresa.telefono}</span>
                      </div>
                    )}
                    {empresa.correo && (
                      <div className="flex items-start gap-2">
                        <Mail className="h-4 w-4 text-[#3259B5] flex-shrink-0 mt-0.5" />
                        <span className="line-clamp-1 break-all">{empresa.correo}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Indicador de selección */}
                <ChevronRight
                  className={`h-5 w-5 md:h-6 md:w-6 flex-shrink-0 transition-all ${
                    isSelected ? "text-[#3259B5] scale-110" : "text-muted-foreground/40"
                  }`}
                />
              </div>
            </button>
          )
        })}
      </div>
    </ScrollArea>
  )
}