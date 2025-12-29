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
  ultima_notificacion_credenciales?: string
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
  // Solo usar categoria_matriz si existe y tiene un valor válido
  // No hacer fallback al campo exporta porque son conceptos diferentes
  if (empresa.categoria_matriz && 
      (empresa.categoria_matriz === "Exportadora" || 
       empresa.categoria_matriz === "Potencial Exportadora" || 
       empresa.categoria_matriz === "Etapa Inicial")) {
    return empresa.categoria_matriz as "Exportadora" | "Potencial Exportadora" | "Etapa Inicial"
  }
  // Si no hay categoria_matriz válida, retornar "Etapa Inicial" por defecto
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
    <Card className="shadow-sm w-full max-w-full overflow-hidden">
      <CardContent className="p-0 w-full max-w-full overflow-hidden">
        {/* Vista de Cards para móviles y tablets */}
        <div className="block lg:hidden w-full max-w-full overflow-hidden">
          {/* Header con seleccionar todas */}
          <div className="px-2 sm:px-3 md:px-4 pt-2 sm:pt-3 md:pt-4 pb-1.5 sm:pb-2 border-b bg-gradient-to-r from-[#EFF6FF] to-[#F0F9FF]">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <Checkbox
                checked={isAllSelected}
                onCheckedChange={handleSelectAll}
                className="h-4 w-4 sm:h-5 sm:w-5 shrink-0"
                ref={(el) => {
                  if (el) {
                    (el as HTMLInputElement).indeterminate = isIndeterminate
                  }
                }}
              />
              <span className="text-xs sm:text-sm font-semibold text-[#222A59]">Seleccionar todas</span>
            </div>
          </div>
          <div className="p-2 sm:p-3 md:p-4 space-y-2 sm:space-y-3 w-full max-w-full overflow-hidden">
          {empresas.map((empresa, index) => {
            const category = getCategoryFromEmpresa(empresa)
            const isSelected = selectedEmpresas.includes(empresa.id)
            
            return (
              <div
                key={empresa.id}
                className={`border rounded-lg p-2 sm:p-3 md:p-4 space-y-2 sm:space-y-3 w-full max-w-full overflow-hidden ${
                  isSelected ? "bg-[#EFF6FF] border-[#3259B5]" : "bg-white border-border"
                }`}
              >
                {/* Checkbox y acciones en la parte superior */}
                <div className="flex items-start justify-between gap-1.5 sm:gap-2">
                  <div className="flex items-center gap-1.5 sm:gap-2 flex-1 min-w-0">
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={(checked) => handleSelectOne(empresa.id, checked as boolean)}
                      className="h-4 w-4 sm:h-5 sm:w-5 shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-xs sm:text-sm text-foreground truncate">
                        {empresa.razon_social}
                      </div>
                      <div className="text-[10px] sm:text-xs text-muted-foreground truncate">CUIT: {empresa.cuit_cuil}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-0.5 sm:gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      asChild
                      title="Ver"
                      className="h-7 w-7 sm:h-8 sm:w-8 p-0 hover:bg-[#3259B5]/10 hover:text-[#3259B5]"
                    >
                      <Link href={`/dashboard/empresas/${empresa.id}`}>
                        <Eye className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      </Link>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      asChild
                      title="Editar"
                      className="h-7 w-7 sm:h-8 sm:w-8 p-0 hover:bg-[#3259B5]/10 hover:text-[#3259B5]"
                    >
                      <Link href={`/dashboard/empresas/${empresa.id}?edit=true`}>
                        <Edit className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
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
                        className="h-7 w-7 sm:h-8 sm:w-8 p-0 hover:bg-green-500/10 hover:text-green-600"
                      >
                        {restoringId === empresa.id ? (
                          <Loader2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin text-green-600" />
                        ) : (
                          <RotateCcw className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-green-600" />
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
                        className="h-7 w-7 sm:h-8 sm:w-8 p-0 hover:bg-destructive/10 hover:text-destructive"
                      >
                        {deletingId === empresa.id ? (
                          <Loader2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin text-destructive" />
                        ) : (
                          <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-destructive" />
                        )}
                      </Button>
                    )}
                  </div>
                </div>

                {/* Información adicional */}
                <div className="space-y-1.5 sm:space-y-2 text-[10px] sm:text-xs">
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

                {/* Badges de categoría y notificación */}
                <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                  <Badge className={`${getCategoryColor(category)} text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5`}>
                    {category}
                  </Badge>
                  {empresa.ultima_notificacion_credenciales && (
                    <Badge className="bg-[#66A29C] text-white text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5">
                      Not. {new Date(empresa.ultima_notificacion_credenciales).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' })}
                    </Badge>
                  )}
                </div>
              </div>
            )
          })}
          </div>
        </div>

        {/* Vista de Tabla para pantallas grandes (desktop) */}
        <div className="hidden lg:block w-full max-w-full overflow-hidden">
          <table className="w-full table-fixed">
            <colgroup>
              <col className="w-12" />
              <col className="w-[25%]" />
              <col className="w-[15%]" />
              <col className="w-[18%]" />
              <col className="w-[12%]" />
              <col className="w-[18%]" />
              <col className="w-[12%]" />
            </colgroup>
            <thead className="bg-gradient-to-r from-[#EFF6FF] to-[#F0F9FF] border-b-2 border-[#3259B5]/20">
              <tr>
                <th className="text-left py-2 lg:py-3 px-1.5 lg:px-2 xl:px-3 text-xs lg:text-sm font-bold text-[#222A59]">
                  <div className="flex items-center gap-1">
                    <Checkbox
                      checked={isAllSelected}
                      onCheckedChange={handleSelectAll}
                      className="h-4 w-4 lg:h-5 lg:w-5"
                      ref={(el) => {
                        if (el) {
                          (el as HTMLInputElement).indeterminate = isIndeterminate
                        }
                      }}
                    />
                    <span className="hidden xl:inline text-xs">Sel.</span>
                  </div>
                </th>
                <th className="text-left py-2 lg:py-3 px-1.5 lg:px-2 xl:px-3 text-xs lg:text-sm font-bold text-[#222A59]">
                  Empresa
                </th>
                <th className="text-left py-2 lg:py-3 px-1.5 lg:px-2 xl:px-3 text-xs lg:text-sm font-bold text-[#222A59]">
                  Sector
                </th>
                <th className="text-left py-2 lg:py-3 px-1.5 lg:px-2 xl:px-3 text-xs lg:text-sm font-bold text-[#222A59]">
                  Ubicación
                </th>
                <th className="text-left py-2 lg:py-3 px-1.5 lg:px-2 xl:px-3 text-xs lg:text-sm font-bold text-[#222A59]">
                  Categoría
                </th>
                <th className="text-left py-2 lg:py-3 px-1.5 lg:px-2 xl:px-3 text-xs lg:text-sm font-bold text-[#222A59]">
                  Contacto
                </th>
                <th className="text-right py-2 lg:py-3 px-1.5 lg:px-2 xl:px-3 text-xs lg:text-sm font-bold text-[#222A59]">
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
                    <td className="py-2 lg:py-3 px-1.5 lg:px-2 xl:px-3">
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={(checked) => handleSelectOne(empresa.id, checked as boolean)}
                        className="h-4 w-4 lg:h-5 lg:w-5"
                      />
                    </td>
                    <td className="py-2 lg:py-3 px-1.5 lg:px-2 xl:px-3 overflow-hidden">
                      <div className="font-medium text-foreground text-xs lg:text-sm truncate" title={empresa.razon_social}>
                        {empresa.razon_social}
                      </div>
                      <div className="text-[10px] lg:text-xs text-muted-foreground truncate">CUIT: {empresa.cuit_cuil}</div>
                      {empresa.nombre_fantasia && (
                        <div className="text-[10px] lg:text-xs text-muted-foreground italic truncate" title={empresa.nombre_fantasia}>
                          {empresa.nombre_fantasia}
                        </div>
                      )}
                    </td>
                    <td className="py-2 lg:py-3 px-1.5 lg:px-2 xl:px-3 text-xs lg:text-sm text-muted-foreground overflow-hidden">
                      <div className="truncate" title={empresa.rubro_nombre || empresa.rubro_principal || empresa.id_rubro?.nombre || "N/A"}>
                        {empresa.rubro_nombre || empresa.rubro_principal || empresa.id_rubro?.nombre || "N/A"}
                      </div>
                    </td>
                    <td className="py-2 lg:py-3 px-1.5 lg:px-2 xl:px-3 text-xs lg:text-sm text-muted-foreground overflow-hidden">
                      <div className="truncate" title={[
                        empresa.departamento_nombre || empresa.departamento?.nomdpto || empresa.departamento,
                        empresa.municipio_nombre || empresa.municipio?.nommun || empresa.municipio,
                        empresa.localidad_nombre || empresa.localidad?.nomloc || empresa.localidad
                      ].filter(Boolean).join(", ") || "N/A"}>
                        {[
                          empresa.departamento_nombre || empresa.departamento?.nomdpto || empresa.departamento,
                          empresa.municipio_nombre || empresa.municipio?.nommun || empresa.municipio,
                          empresa.localidad_nombre || empresa.localidad?.nomloc || empresa.localidad
                        ].filter(Boolean).join(", ") || "N/A"}
                      </div>
                    </td>
                    <td className="py-2 lg:py-3 px-1.5 lg:px-2 xl:px-3 overflow-hidden">
                      <div className="flex items-center gap-1 flex-wrap">
                        <Badge className={`${getCategoryColor(category)} text-[10px] lg:text-xs whitespace-nowrap px-1.5 py-0.5`}>
                          {category}
                        </Badge>
                        {empresa.ultima_notificacion_credenciales && (
                          <Badge className="bg-[#66A29C] text-white text-[10px] lg:text-xs whitespace-nowrap px-1.5 py-0.5">
                            Not. {new Date(empresa.ultima_notificacion_credenciales).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' })}
                          </Badge>
                        )}
                      </div>
                    </td>
                    <td className="py-2 lg:py-3 px-1.5 lg:px-2 xl:px-3 overflow-hidden">
                      <div className="text-[10px] lg:text-xs xl:text-sm text-muted-foreground">
                        {empresa.correo && (
                          <div className="truncate" title={empresa.correo}>{empresa.correo}</div>
                        )}
                        {empresa.telefono && (
                          <div className="truncate" title={empresa.telefono}>{empresa.telefono}</div>
                        )}
                        {!empresa.correo && !empresa.telefono && "N/A"}
                      </div>
                    </td>
                    <td className="py-2 lg:py-3 px-1.5 lg:px-2 xl:px-3">
                      <div className="flex items-center justify-end gap-0.5">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          asChild 
                          title={`Ver detalles de ${empresa.razon_social}`}
                          className="hover:bg-[#3259B5]/10 hover:text-[#3259B5] h-7 w-7 lg:h-8 lg:w-8 p-0"
                        >
                          <Link href={`/dashboard/empresas/${empresa.id}`}>
                            <Eye className="h-3 w-3 lg:h-3.5 lg:w-3.5 xl:h-4 xl:w-4" />
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
                            <Edit className="h-3 w-3 lg:h-3.5 lg:w-3.5 xl:h-4 xl:w-4" />
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
                              <Loader2 className="h-3 w-3 lg:h-3.5 lg:w-3.5 xl:h-4 xl:w-4 animate-spin text-green-600" />
                            ) : (
                              <RotateCcw className="h-3 w-3 lg:h-3.5 lg:w-3.5 xl:h-4 xl:w-4 text-green-600" />
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
                              <Loader2 className="h-3 w-3 lg:h-3.5 lg:w-3.5 xl:h-4 xl:w-4 animate-spin text-destructive" />
                            ) : (
                              <Trash2 className="h-3 w-3 lg:h-3.5 lg:w-3.5 xl:h-4 xl:w-4 text-destructive" />
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
        <div className="flex flex-col sm:flex-row items-center justify-between px-2 sm:px-3 md:px-4 lg:px-6 py-2 sm:py-3 md:py-4 border-t border-border gap-2 sm:gap-3 w-full max-w-full overflow-x-hidden">
          <div className="text-[10px] sm:text-xs md:text-sm text-muted-foreground text-center sm:text-left truncate">
            Mostrando {((pagination.page - 1) * pagination.pageSize) + 1} a{" "}
            {Math.min(pagination.page * pagination.pageSize, pagination.total)} de {pagination.total} empresas
          </div>
          <div className="flex items-center gap-1 sm:gap-1.5">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(pagination.page - 1)}
              disabled={pagination.page === 1}
              className="text-[10px] sm:text-xs md:text-sm h-7 sm:h-8 md:h-9 px-2 sm:px-3"
            >
              <ChevronLeft className="h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4" />
              <span className="hidden sm:inline ml-0.5 sm:ml-1">Ant.</span>
            </Button>
            <div className="flex items-center gap-0.5 sm:gap-1">
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
                    className={`text-[10px] sm:text-xs md:text-sm h-7 sm:h-8 md:h-9 px-2 sm:px-3 ${pagination.page === pageNum ? "bg-[#3259B5]" : ""}`}
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
              className="text-[10px] sm:text-xs md:text-sm h-7 sm:h-8 md:h-9 px-2 sm:px-3"
            >
              <span className="hidden sm:inline mr-0.5 sm:mr-1">Sig.</span>
              <ChevronRight className="h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
