"use client"

import { useState, useEffect } from "react"
import { MainLayout } from "@/components/layout/main-layout"
import { MatrizClasificacion } from "@/components/matriz/matriz-clasificacion"
import { EmpresaSelectionList } from "@/components/matriz/empresa-selection-list"
import { FiltersDropdown } from "@/components/empresas/filters-dropdown"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Building2, MapPin, Phone, Mail, Search, X, Filter } from "lucide-react"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import api from "@/lib/api"
import { useDashboardAuth, handleAuthError } from "@/hooks/use-dashboard-auth"

interface Empresa {
  id: number
  razon_social: string
  tipo_empresa: string
  rubro_nombre?: string
  departamento_nombre?: string
  municipio_nombre?: string
  telefono?: string
  correo?: string
  categoria_matriz?: string
  exporta?: string
}

export default function MatrizPage() {
  const { user, isLoading: authLoading, canAccessDashboard } = useDashboardAuth()
  const [empresaSeleccionada, setEmpresaSeleccionada] = useState<string>("")
  const [empresas, setEmpresas] = useState<Empresa[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [filters, setFilters] = useState<any>({})
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    if (!authLoading && canAccessDashboard) {
      loadEmpresas()
    }
  }, [authLoading, canAccessDashboard, filters, searchQuery])

  const loadEmpresas = async () => {
    try {
      setLoading(true)
      const params: any = {
        estado: 'aprobada',
        page_size: 1000,
      }

      if (searchQuery) {
        params.search = searchQuery
      }

      if (filters.tipo_empresa && filters.tipo_empresa !== 'all') {
        params.tipo_empresa = filters.tipo_empresa
      }

      if (filters.rubro && filters.rubro !== 'all') {
        params.rubro = filters.rubro
      }

      if (filters.subRubro && filters.subRubro !== 'all') {
        params.sub_rubro = filters.subRubro
      }

      if (filters.departamento && filters.departamento !== 'all') {
        params.departamento = filters.departamento
      }

      if (filters.categoria_matriz && filters.categoria_matriz !== 'all') {
        params.categoria_matriz = filters.categoria_matriz
      }

      if (filters.exporta && filters.exporta !== 'all') {
        params.exporta = filters.exporta === 'si' ? 'Sí' : ''
      }

      const response = await api.getEmpresas(params)
      setEmpresas(response.results || [])
    } catch (error: any) {
      if (!handleAuthError(error)) {
        console.error("Error loading empresas:", error)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleFilterChange = (newFilters: any) => {
    setFilters({ ...filters, ...newFilters })
  }

  const handleClearFilters = () => {
    setFilters({})
    setSearchQuery("")
  }

  const handleSearchChange = (value: string) => {
    setSearchQuery(value)
  }

  const empresaActual = empresas.find((e) => e.id.toString() === empresaSeleccionada)

  const activeFiltersCount = Object.keys(filters).filter(
    key => filters[key] && filters[key] !== 'all'
  ).length + (searchQuery ? 1 : 0)

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

  if (!canAccessDashboard) {
    return null
  }

  return (
    <MainLayout>
      <div className="space-y-6 pb-8">
        {/* Header */}
        <div className="space-y-3">
          <h1 className="text-2xl md:text-3xl font-bold text-[#222A59]">Matriz de Clasificación</h1>
          <p className="text-muted-foreground text-sm md:text-base">
            Sistema de evaluación del perfil exportador de empresas
          </p>
        </div>

        {/* Búsqueda y filtros - Visible en todas las pantallas */}
        <Card>
          <CardContent className="p-4 md:p-6">
            <div className="space-y-4">
              {/* Búsqueda */}
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por razón social, CUIT, email..."
                    value={searchQuery}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    className="pl-10 pr-10 h-11"
                  />
                  {searchQuery && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
                      onClick={() => setSearchQuery("")}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                {/* Botones de filtro */}
                <div className="flex items-center gap-2">
                  {/* Desktop: Dropdown */}
                  <div className="hidden md:block">
                    <FiltersDropdown
                      onFilterChange={handleFilterChange}
                      onClearFilters={handleClearFilters}
                      filters={filters}
                    />
                  </div>

                  {/* Mobile: Sheet */}
                  <div className="md:hidden">
                    <Sheet open={showFilters} onOpenChange={setShowFilters}>
                      <SheetTrigger asChild>
                        <Button variant="outline" size="default" className="gap-2 h-11">
                          <Filter className="h-4 w-4" />
                          Filtros
                          {activeFiltersCount > 0 && (
                            <Badge className="ml-1 bg-[#3259B5] text-white rounded-full px-2 py-0.5 text-xs">
                              {activeFiltersCount}
                            </Badge>
                          )}
                        </Button>
                      </SheetTrigger>
                      <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                        <SheetHeader>
                          <SheetTitle>Filtros de búsqueda</SheetTitle>
                          <SheetDescription>
                            Filtra empresas por diferentes criterios
                          </SheetDescription>
                        </SheetHeader>
                        <div className="mt-6">
                          <FiltersDropdown
                            onFilterChange={(newFilters) => {
                              handleFilterChange(newFilters)
                              setShowFilters(false)
                            }}
                            onClearFilters={() => {
                              handleClearFilters()
                              setShowFilters(false)
                            }}
                            filters={filters}
                          />
                        </div>
                      </SheetContent>
                    </Sheet>
                  </div>

                  {activeFiltersCount > 0 && (
                    <Button
                      variant="outline"
                      size="default"
                      onClick={handleClearFilters}
                      className="gap-2 h-11"
                    >
                      <X className="h-4 w-4" />
                      <span className="hidden sm:inline">Limpiar</span>
                    </Button>
                  )}
                </div>
              </div>

              {/* Indicador de filtros activos */}
              {activeFiltersCount > 0 && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{activeFiltersCount} {activeFiltersCount === 1 ? 'filtro activo' : 'filtros activos'}</span>
                  {searchQuery && (
                    <Badge variant="secondary" className="text-xs">
                      Búsqueda: "{searchQuery}"
                    </Badge>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Layout principal */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
          {/* Lista de empresas - Ocupa más espacio en desktop */}
          <div className="xl:col-span-4">
            <Card className="h-full">
              <CardHeader className="pb-4">
                <CardTitle className="text-[#222A59] text-base md:text-lg">
                  Empresas Disponibles
                </CardTitle>
                <CardDescription className="text-xs">
                  {empresas.length} {empresas.length === 1 ? 'empresa encontrada' : 'empresas encontradas'}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <EmpresaSelectionList
                  empresas={empresas}
                  loading={loading}
                  selectedEmpresaId={empresaSeleccionada}
                  onSelectEmpresa={setEmpresaSeleccionada}
                />
              </CardContent>
            </Card>
          </div>

          {/* Área de evaluación - Más espacio en desktop */}
          <div className="xl:col-span-8">
            {empresaActual ? (
              <div className="space-y-6">
                {/* Info de empresa seleccionada */}
                <Card>
                  <CardContent className="p-4 md:p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-3 flex-1 min-w-0">
                        <div className="flex items-start gap-3 flex-wrap">
                          <h3 className="font-semibold text-base md:text-lg text-[#222A59] leading-tight">
                            {empresaActual.razon_social}
                          </h3>
                          <Badge variant="outline" className="text-xs shrink-0">
                            {empresaActual.tipo_empresa}
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-muted-foreground">
                          {empresaActual.rubro_nombre && (
                            <div className="flex items-center gap-2">
                              <Building2 className="h-4 w-4 text-[#3259B5] shrink-0" />
                              <span className="truncate">{empresaActual.rubro_nombre}</span>
                            </div>
                          )}
                          {(empresaActual.departamento_nombre || empresaActual.municipio_nombre) && (
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4 text-[#3259B5] shrink-0" />
                              <span className="truncate">
                                {[empresaActual.municipio_nombre, empresaActual.departamento_nombre]
                                  .filter(Boolean)
                                  .join(", ")}
                              </span>
                            </div>
                          )}
                          {empresaActual.telefono && (
                            <div className="flex items-center gap-2">
                              <Phone className="h-4 w-4 text-[#3259B5] shrink-0" />
                              <span className="truncate">{empresaActual.telefono}</span>
                            </div>
                          )}
                          {empresaActual.correo && (
                            <div className="flex items-center gap-2">
                              <Mail className="h-4 w-4 text-[#3259B5] shrink-0" />
                              <span className="truncate">{empresaActual.correo}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEmpresaSeleccionada("")}
                        className="text-muted-foreground hover:text-foreground shrink-0"
                        title="Deseleccionar empresa"
                      >
                        <X className="h-5 w-5" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Matriz de clasificación */}
                <MatrizClasificacion empresaId={empresaSeleccionada} />
              </div>
            ) : (
              <Card className="h-full min-h-[500px]">
                <CardContent className="flex items-center justify-center h-full py-20">
                  <div className="text-center space-y-4 px-4">
                    <Building2 className="h-20 w-20 text-[#3259B5]/20 mx-auto" />
                    <div className="space-y-2">
                      <p className="text-lg md:text-xl font-semibold text-[#222A59]">
                        Selecciona una empresa
                      </p>
                      <p className="text-sm text-muted-foreground max-w-md mx-auto">
                        Elige una empresa de la lista para evaluar su perfil exportador mediante la matriz de clasificación
                      </p>
                    </div>
                    {empresas.length === 0 && !loading && (
                      <p className="text-xs text-muted-foreground mt-4">
                        {searchQuery || activeFiltersCount > 0
                          ? "No hay empresas que coincidan con los criterios de búsqueda"
                          : "No hay empresas aprobadas disponibles"}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  )
}