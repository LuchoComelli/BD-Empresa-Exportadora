"use client"

import { useState, useMemo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Eye, Edit, Trash2, ChevronLeft, ChevronRight, Loader2 } from "lucide-react"
import Link from "next/link"

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
  correo?: string
  telefono?: string
  fecha_creacion: string
}

interface CompaniesTableProps {
  empresas: Empresa[]
  loading: boolean
  filters: any
  searchQuery: string
  selectedEmpresas: number[]
  onSelectionChange: (selected: number[]) => void
  onDelete?: (id: number) => void
  onRefresh?: () => void
  pagination: {
    page: number
    pageSize: number
    total: number
    totalPages: number
  }
  onPageChange: (page: number) => void
}

function getCategoryFromEmpresa(empresa: Empresa): "Exportadora" | "Potencial Exportadora" | "Etapa Inicial" {
  // Priorizar categoria_matriz si está disponible
  if (empresa.categoria_matriz) {
    return empresa.categoria_matriz as "Exportadora" | "Potencial Exportadora" | "Etapa Inicial"
  }
  // Fallback al campo exporta (legacy)
  if (empresa.exporta === 'si') return "Exportadora"
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

export function CompaniesTable({
  empresas,
  loading,
  selectedEmpresas,
  onSelectionChange,
  onDelete,
  onRefresh,
  pagination,
  onPageChange,
}: CompaniesTableProps) {
  const [selectAll, setSelectAll] = useState(false)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  const handleSelectAll = (checked: boolean) => {
    setSelectAll(checked)
    if (checked) {
      onSelectionChange(empresas.map(e => e.id))
    } else {
      onSelectionChange([])
    }
  }

  const handleSelectOne = (id: number, checked: boolean) => {
    if (checked) {
      onSelectionChange([...selectedEmpresas, id])
    } else {
      onSelectionChange(selectedEmpresas.filter(e => e !== id))
      setSelectAll(false)
    }
  }

  const isAllSelected = useMemo(() => {
    return empresas.length > 0 && empresas.every(e => selectedEmpresas.includes(e.id))
  }, [empresas, selectedEmpresas])

  const isIndeterminate = useMemo(() => {
    return selectedEmpresas.length > 0 && !isAllSelected
  }, [selectedEmpresas, isAllSelected])

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center py-12">
            <p className="text-muted-foreground">Cargando empresas...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (empresas.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center py-12">
            <p className="text-muted-foreground">No se encontraron empresas</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="shadow-sm">
      <CardContent className="p-0">
        <div className="overflow-x-auto -mx-4 sm:mx-0">
          <table className="w-full min-w-[800px]">
            <thead className="bg-gradient-to-r from-[#EFF6FF] to-[#F0F9FF] border-b-2 border-[#3259B5]/20">
              <tr>
                <th className="text-left py-4 md:py-5 px-4 md:px-6 text-xs md:text-sm font-bold text-[#222A59]">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={isAllSelected}
                      onCheckedChange={handleSelectAll}
                      ref={(el) => {
                        if (el) {
                          (el as HTMLInputElement).indeterminate = isIndeterminate
                        }
                      }}
                    />
                    <span>Seleccionar</span>
                  </div>
                </th>
                <th className="text-left py-4 md:py-5 px-4 md:px-6 text-xs md:text-sm font-bold text-[#222A59]">
                  Empresa
                </th>
                <th className="text-left py-4 md:py-5 px-4 md:px-6 text-xs md:text-sm font-bold text-[#222A59]">
                  Sector
                </th>
                <th className="text-left py-4 md:py-5 px-4 md:px-6 text-xs md:text-sm font-bold text-[#222A59]">
                  Ubicación
                </th>
                <th className="text-left py-4 md:py-5 px-4 md:px-6 text-xs md:text-sm font-bold text-[#222A59]">
                  Categoría
                </th>
                <th className="text-left py-4 md:py-5 px-4 md:px-6 text-xs md:text-sm font-bold text-[#222A59]">
                  Contacto
                </th>
                <th className="text-right py-4 md:py-5 px-4 md:px-6 text-xs md:text-sm font-bold text-[#222A59]">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody>
              {empresas.map((empresa, index) => {
                const category = getCategoryFromEmpresa(empresa)
                const isSelected = selectedEmpresas.includes(empresa.id)
                
                return (
                  <tr key={empresa.id} className={`${index % 2 === 0 ? "bg-white" : "bg-muted/20"} hover:bg-[#EFF6FF]/50 transition-colors border-b border-border/50`}>
                    <td className="py-3 md:py-4 px-3 md:px-6">
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={(checked) => handleSelectOne(empresa.id, checked as boolean)}
                      />
                    </td>
                    <td className="py-3 md:py-4 px-3 md:px-6">
                      <div className="font-medium text-foreground text-sm">{empresa.razon_social}</div>
                      <div className="text-xs text-muted-foreground">CUIT: {empresa.cuit_cuil}</div>
                      {empresa.nombre_fantasia && (
                        <div className="text-xs text-muted-foreground italic">{empresa.nombre_fantasia}</div>
                      )}
                    </td>
                    <td className="py-3 md:py-4 px-3 md:px-6 text-xs md:text-sm text-muted-foreground">
                      {empresa.rubro_nombre || empresa.rubro_principal || empresa.id_rubro?.nombre || "N/A"}
                    </td>
                    <td className="py-3 md:py-4 px-3 md:px-6 text-xs md:text-sm text-muted-foreground">
                      {[
                        empresa.departamento_nombre || empresa.departamento?.nomdpto || empresa.departamento,
                        empresa.municipio_nombre || empresa.municipio?.nommun || empresa.municipio,
                        empresa.localidad_nombre || empresa.localidad?.nomloc || empresa.localidad
                      ].filter(Boolean).join(", ") || "N/A"}
                    </td>
                    <td className="py-3 md:py-4 px-3 md:px-6">
                      <Badge className={`${getCategoryColor(category)} text-xs`}>{category}</Badge>
                    </td>
                    <td className="py-3 md:py-4 px-3 md:px-6">
                      <div className="text-xs md:text-sm text-muted-foreground">
                        {empresa.correo && (
                          <div className="truncate max-w-[150px]">{empresa.correo}</div>
                        )}
                        {empresa.telefono && (
                          <div>{empresa.telefono}</div>
                        )}
                        {!empresa.correo && !empresa.telefono && "N/A"}
                      </div>
                    </td>
                    <td className="py-3 md:py-4 px-3 md:px-6">
                      <div className="flex items-center justify-end gap-1 md:gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          asChild 
                          title={`Ver detalles de ${empresa.razon_social}`}
                          className="hover:bg-[#3259B5]/10 hover:text-[#3259B5]"
                        >
                          <Link href={`/dashboard/empresas/${empresa.id}`}>
                            <Eye className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          asChild
                          title="Editar"
                          className="hover:bg-[#3259B5]/10 hover:text-[#3259B5]"
                        >
                          <Link href={`/dashboard/empresas/${empresa.id}?edit=true`}>
                            <Edit className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Button 
  variant="ghost" 
  size="sm"
  onClick={() => {
    if (onDelete) {
      setDeletingId(empresa.id)
      onDelete(empresa.id)
      // No limpiar el deletingId aquí, se limpiará cuando se recargue la tabla
    }
  }}
  disabled={deletingId === empresa.id}
  title="Eliminar"
  className="hover:bg-destructive/10 hover:text-destructive"
>
                          {deletingId === empresa.id ? (
                            <Loader2 className="h-4 w-4 animate-spin text-destructive" />
                          ) : (
                            <Trash2 className="h-4 w-4 text-destructive" />
                          )}
                        </Button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex flex-col sm:flex-row items-center justify-between px-3 md:px-6 py-3 md:py-4 border-t border-border gap-3">
          <div className="text-xs md:text-sm text-muted-foreground">
            Mostrando {((pagination.page - 1) * pagination.pageSize) + 1} a{" "}
            {Math.min(pagination.page * pagination.pageSize, pagination.total)} de {pagination.total} empresas
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(pagination.page - 1)}
              disabled={pagination.page === 1}
              className="text-xs md:text-sm"
            >
              <ChevronLeft className="h-3 w-3 md:h-4 md:w-4" />
              <span className="hidden sm:inline">Anterior</span>
            </Button>
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(pagination.totalPages, 5) }, (_, i) => {
                let pageNum
                if (pagination.totalPages <= 5) {
                  pageNum = i + 1
                } else if (pagination.page <= 3) {
                  pageNum = i + 1
                } else if (pagination.page >= pagination.totalPages - 2) {
                  pageNum = pagination.totalPages - 4 + i
                } else {
                  pageNum = pagination.page - 2 + i
                }
                return (
                  <Button
                    key={pageNum}
                    variant={pagination.page === pageNum ? "default" : "outline"}
                    size="sm"
                    onClick={() => onPageChange(pageNum)}
                    className={`text-xs md:text-sm ${pagination.page === pageNum ? "bg-[#3259B5]" : ""}`}
                  >
                    {pageNum}
                  </Button>
                )
              })}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages}
              className="text-xs md:text-sm"
            >
              <span className="hidden sm:inline">Siguiente</span>
              <ChevronRight className="h-3 w-3 md:h-4 md:w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
