"use client"

import { useState, useMemo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Eye, Edit, Trash2, ChevronLeft, ChevronRight, Loader2, RotateCcw } from "lucide-react"
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
  eliminado?: boolean
}

interface CompaniesTableProps {
  empresas: Empresa[] // Empresas de la página actual
  loading: boolean
  filters: any
  searchQuery: string
  selectedEmpresas: number[]
  onSelectionChange: (selected: number[]) => void
  onDelete?: (id: number) => void
  onRestore?: (id: number) => void
  onRefresh?: () => void
  pagination: {
    page: number
    pageSize: number
    total: number
    totalPages: number
  }
  onPageChange: (page: number) => void
  allEmpresas?: Empresa[] // Todas las empresas filtradas (para seleccionar todas)
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
  onRestore,
  onRefresh,
  pagination,
  onPageChange,
  allEmpresas,
}: CompaniesTableProps) {
  const [selectAll, setSelectAll] = useState(false)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [restoringId, setRestoringId] = useState<number | null>(null)

  // Usar allEmpresas si está disponible, sino usar empresas (compatibilidad hacia atrás)
  const empresasParaSeleccionar = allEmpresas || empresas

  const handleSelectAll = (checked: boolean) => {
    setSelectAll(checked)
    if (checked) {
      // Seleccionar todas las empresas filtradas, no solo las de la página actual
      const todasLasIds = empresasParaSeleccionar.map(e => e.id)
      // Mantener las selecciones existentes y agregar las nuevas
      const nuevasSelecciones = [...new Set([...selectedEmpresas, ...todasLasIds])]
      onSelectionChange(nuevasSelecciones)
    } else {
      // Deseleccionar solo las empresas de la página actual
      const idsDeLaPagina = empresas.map(e => e.id)
      onSelectionChange(selectedEmpresas.filter(id => !idsDeLaPagina.includes(id)))
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
    // Verificar si todas las empresas de la página actual están seleccionadas
    return empresas.length > 0 && empresas.every(e => selectedEmpresas.includes(e.id))
  }, [empresas, selectedEmpresas])

  const isIndeterminate = useMemo(() => {
    // Mostrar estado indeterminado si hay algunas seleccionadas pero no todas de la página actual
    const algunasSeleccionadas = empresas.some(e => selectedEmpresas.includes(e.id))
    return algunasSeleccionadas && !isAllSelected
  }, [empresas, selectedEmpresas, isAllSelected])

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
        {/* Vista de Cards para móviles y tablets */}
        <div className="block lg:hidden">
          {/* Header con seleccionar todas */}
          <div className="px-4 pt-4 pb-2 border-b bg-gradient-to-r from-[#EFF6FF] to-[#F0F9FF]">
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
              <span className="text-sm font-semibold text-[#222A59]">Seleccionar todas</span>
            </div>
          </div>
          <div className="p-4 space-y-3">
          {empresas.map((empresa, index) => {
            const category = getCategoryFromEmpresa(empresa)
            const isSelected = selectedEmpresas.includes(empresa.id)
            
            return (
              <div
                key={empresa.id}
                className={`border rounded-lg p-4 space-y-3 ${
                  isSelected ? "bg-[#EFF6FF] border-[#3259B5]" : "bg-white border-border"
                }`}
              >
                {/* Checkbox y acciones en la parte superior */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 flex-1">
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={(checked) => handleSelectOne(empresa.id, checked as boolean)}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm text-foreground truncate">
                        {empresa.razon_social}
                      </div>
                      <div className="text-xs text-muted-foreground">CUIT: {empresa.cuit_cuil}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      asChild
                      title="Ver"
                      className="h-8 w-8 p-0 hover:bg-[#3259B5]/10 hover:text-[#3259B5]"
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
                      className="h-8 w-8 p-0 hover:bg-[#3259B5]/10 hover:text-[#3259B5]"
                    >
                      <Link href={`/dashboard/empresas/${empresa.id}?edit=true`}>
                        <Edit className="h-4 w-4" />
                      </Link>
                    </Button>
                    {empresa.eliminado ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          if (onRestore) {
                            setRestoringId(empresa.id)
                            onRestore(empresa.id)
                          }
                        }}
                        disabled={restoringId === empresa.id}
                        title="Activar"
                        className="h-8 w-8 p-0 hover:bg-green-500/10 hover:text-green-600"
                      >
                        {restoringId === empresa.id ? (
                          <Loader2 className="h-4 w-4 animate-spin text-green-600" />
                        ) : (
                          <RotateCcw className="h-4 w-4 text-green-600" />
                        )}
                      </Button>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          if (onDelete) {
                            setDeletingId(empresa.id)
                            onDelete(empresa.id)
                          }
                        }}
                        disabled={deletingId === empresa.id}
                        title="Eliminar"
                        className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive"
                      >
                        {deletingId === empresa.id ? (
                          <Loader2 className="h-4 w-4 animate-spin text-destructive" />
                        ) : (
                          <Trash2 className="h-4 w-4 text-destructive" />
                        )}
                      </Button>
                    )}
                  </div>
                </div>

                {/* Información adicional */}
                <div className="space-y-2 text-xs">
                  {empresa.nombre_fantasia && (
                    <div className="text-muted-foreground italic">
                      <span className="font-medium">Nombre fantasia: </span>
                      {empresa.nombre_fantasia}
                    </div>
                  )}
                  <div className="text-muted-foreground">
                    <span className="font-medium">Sector: </span>
                    {empresa.rubro_nombre || empresa.rubro_principal || empresa.id_rubro?.nombre || "N/A"}
                  </div>
                  <div className="text-muted-foreground">
                    <span className="font-medium">Ubicación: </span>
                    {[
                      empresa.departamento_nombre || empresa.departamento?.nomdpto || empresa.departamento,
                      empresa.municipio_nombre || empresa.municipio?.nommun || empresa.municipio,
                      empresa.localidad_nombre || empresa.localidad?.nomloc || empresa.localidad
                    ].filter(Boolean).join(", ") || "N/A"}
                  </div>
                  {(empresa.correo || empresa.telefono) && (
                    <div className="text-muted-foreground">
                      <span className="font-medium">Contacto: </span>
                      {empresa.correo && <span>{empresa.correo}</span>}
                      {empresa.correo && empresa.telefono && <span> • </span>}
                      {empresa.telefono && <span>{empresa.telefono}</span>}
                    </div>
                  )}
                </div>

                {/* Badge de categoría */}
                <div>
                  <Badge className={`${getCategoryColor(category)} text-xs`}>{category}</Badge>
                </div>
              </div>
            )
          })}
          </div>
        </div>

        {/* Vista de Tabla para pantallas grandes (desktop) */}
        <div className="hidden lg:block overflow-x-auto -mx-4 sm:mx-0">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-[#EFF6FF] to-[#F0F9FF] border-b-2 border-[#3259B5]/20">
              <tr>
                <th className="text-left py-3 px-3 lg:px-4 text-xs lg:text-sm font-bold text-[#222A59] w-12 lg:w-auto">
                  <div className="flex items-center gap-1 lg:gap-2">
                    <Checkbox
                      checked={isAllSelected}
                      onCheckedChange={handleSelectAll}
                      ref={(el) => {
                        if (el) {
                          (el as HTMLInputElement).indeterminate = isIndeterminate
                        }
                      }}
                    />
                    <span className="hidden xl:inline">Seleccionar</span>
                  </div>
                </th>
                <th className="text-left py-3 px-3 lg:px-4 text-xs lg:text-sm font-bold text-[#222A59] min-w-[200px]">
                  Empresa
                </th>
                <th className="text-left py-3 px-3 lg:px-4 text-xs lg:text-sm font-bold text-[#222A59] min-w-[120px]">
                  Sector
                </th>
                <th className="text-left py-3 px-3 lg:px-4 text-xs lg:text-sm font-bold text-[#222A59] min-w-[150px]">
                  Ubicación
                </th>
                <th className="text-left py-3 px-3 lg:px-4 text-xs lg:text-sm font-bold text-[#222A59] w-24">
                  Categoría
                </th>
                <th className="text-left py-3 px-3 lg:px-4 text-xs lg:text-sm font-bold text-[#222A59] min-w-[140px]">
                  Contacto
                </th>
                <th className="text-right py-3 px-3 lg:px-4 text-xs lg:text-sm font-bold text-[#222A59] w-28">
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
                    <td className="py-3 px-3 lg:px-4">
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={(checked) => handleSelectOne(empresa.id, checked as boolean)}
                      />
                    </td>
                    <td className="py-3 px-3 lg:px-4">
                      <div className="font-medium text-foreground text-xs lg:text-sm truncate">{empresa.razon_social}</div>
                      <div className="text-xs text-muted-foreground">CUIT: {empresa.cuit_cuil}</div>
                      {empresa.nombre_fantasia && (
                        <div className="text-xs text-muted-foreground italic truncate">{empresa.nombre_fantasia}</div>
                      )}
                    </td>
                    <td className="py-3 px-3 lg:px-4 text-xs lg:text-sm text-muted-foreground">
                      <div className="truncate max-w-[120px] lg:max-w-none">
                        {empresa.rubro_nombre || empresa.rubro_principal || empresa.id_rubro?.nombre || "N/A"}
                      </div>
                    </td>
                    <td className="py-3 px-3 lg:px-4 text-xs lg:text-sm text-muted-foreground">
                      <div className="truncate max-w-[150px] lg:max-w-none">
                        {[
                          empresa.departamento_nombre || empresa.departamento?.nomdpto || empresa.departamento,
                          empresa.municipio_nombre || empresa.municipio?.nommun || empresa.municipio,
                          empresa.localidad_nombre || empresa.localidad?.nomloc || empresa.localidad
                        ].filter(Boolean).join(", ") || "N/A"}
                      </div>
                    </td>
                    <td className="py-3 px-3 lg:px-4">
                      <Badge className={`${getCategoryColor(category)} text-xs whitespace-nowrap`}>{category}</Badge>
                    </td>
                    <td className="py-3 px-3 lg:px-4">
                      <div className="text-xs lg:text-sm text-muted-foreground">
                        {empresa.correo && (
                          <div className="truncate max-w-[140px] lg:max-w-[150px]">{empresa.correo}</div>
                        )}
                        {empresa.telefono && (
                          <div className="truncate">{empresa.telefono}</div>
                        )}
                        {!empresa.correo && !empresa.telefono && "N/A"}
                      </div>
                    </td>
                    <td className="py-3 px-3 lg:px-4">
                      <div className="flex items-center justify-end gap-1 lg:gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          asChild 
                          title={`Ver detalles de ${empresa.razon_social}`}
                          className="hover:bg-[#3259B5]/10 hover:text-[#3259B5] h-7 w-7 lg:h-8 lg:w-8 p-0"
                        >
                          <Link href={`/dashboard/empresas/${empresa.id}`}>
                            <Eye className="h-3 w-3 lg:h-4 lg:w-4" />
                          </Link>
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          asChild
                          title="Editar"
                          className="hover:bg-[#3259B5]/10 hover:text-[#3259B5] h-7 w-7 lg:h-8 lg:w-8 p-0"
                        >
                          <Link href={`/dashboard/empresas/${empresa.id}?edit=true`}>
                            <Edit className="h-3 w-3 lg:h-4 lg:w-4" />
                          </Link>
                        </Button>
                        {empresa.eliminado ? (
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => {
                              if (onRestore) {
                                setRestoringId(empresa.id)
                                onRestore(empresa.id)
                              }
                            }}
                            disabled={restoringId === empresa.id}
                            title="Activar"
                            className="hover:bg-green-500/10 hover:text-green-600 h-7 w-7 lg:h-8 lg:w-8 p-0"
                          >
                            {restoringId === empresa.id ? (
                              <Loader2 className="h-3 w-3 lg:h-4 lg:w-4 animate-spin text-green-600" />
                            ) : (
                              <RotateCcw className="h-3 w-3 lg:h-4 lg:w-4 text-green-600" />
                            )}
                          </Button>
                        ) : (
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => {
                              if (onDelete) {
                                setDeletingId(empresa.id)
                                onDelete(empresa.id)
                              }
                            }}
                            disabled={deletingId === empresa.id}
                            title="Eliminar"
                            className="hover:bg-destructive/10 hover:text-destructive h-7 w-7 lg:h-8 lg:w-8 p-0"
                          >
                            {deletingId === empresa.id ? (
                              <Loader2 className="h-3 w-3 lg:h-4 lg:w-4 animate-spin text-destructive" />
                            ) : (
                              <Trash2 className="h-3 w-3 lg:h-4 lg:w-4 text-destructive" />
                            )}
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex flex-col sm:flex-row items-center justify-between px-4 md:px-6 py-4 border-t border-border gap-3">
          <div className="text-xs sm:text-sm text-muted-foreground">
            Mostrando {((pagination.page - 1) * pagination.pageSize) + 1} a{" "}
            {Math.min(pagination.page * pagination.pageSize, pagination.total)} de {pagination.total} empresas
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(pagination.page - 1)}
              disabled={pagination.page === 1}
              className="text-xs sm:text-sm"
            >
              <ChevronLeft className="h-4 w-4" />
              <span className="hidden sm:inline ml-1">Anterior</span>
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
                    className={`text-xs sm:text-sm ${pagination.page === pageNum ? "bg-[#3259B5]" : ""}`}
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
              className="text-xs sm:text-sm"
            >
              <span className="hidden sm:inline mr-1">Siguiente</span>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
