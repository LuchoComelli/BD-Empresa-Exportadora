"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Filter, X, Loader2 } from "lucide-react"
import api from "@/lib/api"

interface FiltersDropdownProps {
  onFilterChange: (filters: any) => void
  onClearFilters: () => void
  filters?: any
}

export function FiltersDropdown({ onFilterChange, onClearFilters, filters = {} }: FiltersDropdownProps) {
  const [open, setOpen] = useState(false)
  const [rubros, setRubros] = useState<any[]>([])
  const [subRubros, setSubRubros] = useState<any[]>([])
  const [departamentos, setDepartamentos] = useState<any[]>([])
  const [loadingRubros, setLoadingRubros] = useState(false)
  const [loadingDepartamentos, setLoadingDepartamentos] = useState(false)

  // Contar filtros activos
  const activeFiltersCount = Object.keys(filters).filter(
    key => filters[key] && filters[key] !== 'all'
  ).length

  // Cargar rubros
  useEffect(() => {
    const loadRubros = async () => {
      try {
        setLoadingRubros(true)
        const data = await api.getRubros()
        setRubros(Array.isArray(data) ? data : (data.results || []))
      } catch (error) {
        console.error("Error loading rubros:", error)
      } finally {
        setLoadingRubros(false)
      }
    }
    loadRubros()
  }, [])

  // Cargar subrubros - solo cuando hay un rubro seleccionado
  useEffect(() => {
    const loadSubRubros = async () => {
      // Solo cargar subrubros si hay un rubro seleccionado
      if (!filters.rubro || filters.rubro === 'all') {
        setSubRubros([])
        return
      }
      
      try {
        setLoadingRubros(true)
        // Cargar solo los subrubros del rubro seleccionado
        const data = await api.getSubRubros(filters.rubro)
        setSubRubros(Array.isArray(data) ? data : (data.results || []))
      } catch (error) {
        console.error("Error loading subrubros:", error)
        setSubRubros([])
      } finally {
        setLoadingRubros(false)
      }
    }
    loadSubRubros()
  }, [filters.rubro])

  // Cargar departamentos (solo de Catamarca)
  useEffect(() => {
    const loadDepartamentos = async () => {
      try {
        setLoadingDepartamentos(true)
        const data = await api.getDepartamentos()
        setDepartamentos(Array.isArray(data) ? data : (data.results || []))
      } catch (error) {
        console.error("Error loading departamentos:", error)
      } finally {
        setLoadingDepartamentos(false)
      }
    }
    loadDepartamentos()
  }, [])

  const handleFilterChange = (key: string, value: string) => {
    const newFilters = { ...filters, [key]: value }
    // Si cambia el rubro, limpiar el subrubro seleccionado
    if (key === 'rubro') {
      // Siempre limpiar el subrubro cuando cambia el rubro
      newFilters.subRubro = 'all'
    }
    onFilterChange(newFilters)
  }

  const handleClearAll = () => {
    onClearFilters()
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Filter className="h-4 w-4" />
          Filtros
          {activeFiltersCount > 0 && (
            <span className="ml-1 bg-[#3259B5] text-white rounded-full px-2 py-0.5 text-xs font-medium">
              {activeFiltersCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 max-h-[80vh] overflow-y-auto" align="start">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-[#222A59]">Filtros</h3>
            {activeFiltersCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearAll}
                className="h-8 text-xs"
              >
                <X className="h-3 w-3 mr-1" />
                Limpiar
              </Button>
            )}
          </div>

          <div className="space-y-4">
            {/* Tipo de Empresa */}
            <div className="space-y-2">
              <Label htmlFor="tipo_empresa" className="text-sm">Tipo de Empresa</Label>
              <Select 
                value={filters.tipo_empresa || "all"} 
                onValueChange={(value) => handleFilterChange('tipo_empresa', value)}
              >
                <SelectTrigger id="tipo_empresa" className="h-9">
                  <SelectValue placeholder="Todos los tipos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="producto">Solo Productos</SelectItem>
                  <SelectItem value="servicio">Solo Servicios</SelectItem>
                  <SelectItem value="mixta">Productos y Servicios</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Rubro */}
            <div className="space-y-2">
              <Label htmlFor="rubro" className="text-sm">Rubro</Label>
              <Select 
                value={filters.rubro || "all"} 
                onValueChange={(value) => handleFilterChange('rubro', value)}
                disabled={loadingRubros}
              >
                <SelectTrigger id="rubro" className="h-9">
                  <SelectValue placeholder={loadingRubros ? "Cargando..." : "Todos los rubros"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {rubros.map((rubro) => (
                    <SelectItem key={rubro.id} value={String(rubro.id)}>
                      {rubro.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Sub-Rubro - Solo habilitado cuando hay un rubro seleccionado */}
            <div className="space-y-2">
              <Label htmlFor="subRubro" className="text-sm">Sub-Rubro</Label>
              <Select 
                value={filters.subRubro || "all"} 
                onValueChange={(value) => handleFilterChange('subRubro', value)}
                disabled={
                  !filters.rubro || 
                  filters.rubro === 'all' || 
                  loadingRubros || 
                  (filters.rubro && filters.rubro !== 'all' && subRubros.length === 0)
                }
              >
                <SelectTrigger id="subRubro" className="h-9">
                  <SelectValue placeholder={
                    !filters.rubro || filters.rubro === 'all'
                      ? "Primero selecciona un rubro"
                      : loadingRubros 
                        ? "Cargando..." 
                        : subRubros.length === 0
                          ? "No hay sub-rubros disponibles"
                          : "Selecciona un sub-rubro"
                  } />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {subRubros.map((subRubro) => (
                    <SelectItem key={subRubro.id} value={String(subRubro.id)}>
                      {subRubro.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {(!filters.rubro || filters.rubro === 'all') && (
                <p className="text-xs text-muted-foreground">
                  Debes seleccionar un rubro primero
                </p>
              )}
              {filters.rubro && filters.rubro !== 'all' && subRubros.length === 0 && !loadingRubros && (
                <p className="text-xs text-muted-foreground">
                  No hay sub-rubros disponibles para este rubro
                </p>
              )}
            </div>

            {/* Departamento */}
            <div className="space-y-2">
              <Label htmlFor="departamento" className="text-sm">Departamento</Label>
              <Select 
                value={filters.departamento || "all"} 
                onValueChange={(value) => handleFilterChange('departamento', value)}
                disabled={loadingDepartamentos}
              >
                <SelectTrigger id="departamento" className="h-9">
                  <SelectValue placeholder={loadingDepartamentos ? "Cargando..." : "Todos los departamentos"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {departamentos.map((depto) => (
                    <SelectItem key={depto.id} value={depto.id}>
                      {depto.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Categoría Matriz */}
            <div className="space-y-2">
              <Label htmlFor="categoria_matriz" className="text-sm">Categoría de Clasificación</Label>
              <Select 
                value={filters.categoria_matriz || "all"} 
                onValueChange={(value) => handleFilterChange('categoria_matriz', value)}
              >
                <SelectTrigger id="categoria_matriz" className="h-9">
                  <SelectValue placeholder="Todas las categorías" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="exportadora">Exportadora</SelectItem>
                  <SelectItem value="potencial_exportadora">Potencial Exportadora</SelectItem>
                  <SelectItem value="etapa_inicial">Etapa Inicial</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Exporta Actualmente */}
            <div className="space-y-2">
              <Label htmlFor="exporta" className="text-sm">¿Exporta Actualmente?</Label>
              <Select 
                value={filters.exporta || "all"} 
                onValueChange={(value) => handleFilterChange('exporta', value)}
              >
                <SelectTrigger id="exporta" className="h-9">
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="si">Sí</SelectItem>
                  <SelectItem value="no">No</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Importa Actualmente */}
            <div className="space-y-2">
              <Label htmlFor="importa" className="text-sm">¿Importa Actualmente?</Label>
              <Select 
                value={filters.importa || "all"} 
                onValueChange={(value) => handleFilterChange('importa', value)}
              >
                <SelectTrigger id="importa" className="h-9">
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="si">Sí</SelectItem>
                  <SelectItem value="no">No</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Material Promoción 2 Idiomas */}
            <div className="space-y-2">
              <Label htmlFor="promo2idiomas" className="text-sm">Material Promoción 2 Idiomas</Label>
              <Select 
                value={filters.promo2idiomas || "all"} 
                onValueChange={(value) => handleFilterChange('promo2idiomas', value)}
              >
                <SelectTrigger id="promo2idiomas" className="h-9">
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="si">Sí</SelectItem>
                  <SelectItem value="no">No</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Certificado MiPyME */}
            <div className="space-y-2">
              <Label htmlFor="certificadopyme" className="text-sm">Certificado MiPyME</Label>
              <Select 
                value={filters.certificadopyme || "all"} 
                onValueChange={(value) => handleFilterChange('certificadopyme', value)}
              >
                <SelectTrigger id="certificadopyme" className="h-9">
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="si">Sí</SelectItem>
                  <SelectItem value="no">No</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}

