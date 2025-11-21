"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { X, Loader2 } from "lucide-react"
import api from "@/lib/api"

interface FiltersSidebarProps {
  onFilterChange: (filters: any) => void
  onClearFilters: () => void
  filters?: any
}

export function FiltersSidebar({ onFilterChange, onClearFilters, filters = {} }: FiltersSidebarProps) {
  const [rubros, setRubros] = useState<any[]>([])
  const [subRubros, setSubRubros] = useState<any[]>([])
  const [departamentos, setDepartamentos] = useState<any[]>([])
  const [loadingRubros, setLoadingRubros] = useState(false)
  const [loadingDepartamentos, setLoadingDepartamentos] = useState(false)

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

  // Cargar subrubros cuando se selecciona un rubro
  useEffect(() => {
    const loadSubRubros = async () => {
      if (filters.rubro && filters.rubro !== 'all') {
        try {
          setLoadingRubros(true)
          const data = await api.getSubRubrosPorRubro(filters.rubro)
          setSubRubros(Array.isArray(data) ? data : (data.results || []))
        } catch (error) {
          console.error("Error loading subrubros:", error)
          setSubRubros([])
        } finally {
          setLoadingRubros(false)
        }
      } else {
        setSubRubros([])
      }
    }
    loadSubRubros()
  }, [filters.rubro])

  // Cargar departamentos
  useEffect(() => {
    const loadDepartamentos = async () => {
      try {
        setLoadingDepartamentos(true)
        // Obtener departamentos desde la API de geografía
        // Primero obtener provincias, luego departamentos de la primera provincia (Catamarca = 10)
        const provincias = await api.getProvincias()
        const catamarca = provincias.find((p: any) => p.id === '10' || p.nombre === 'Catamarca')
        if (catamarca) {
          const data = await api.getDepartamentosPorProvincia(catamarca.id)
          setDepartamentos(Array.isArray(data) ? data : (data.results || []))
        }
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
    // Si cambia el rubro, limpiar subrubro
    if (key === 'rubro' && value === 'all') {
      newFilters.subRubro = 'all'
    }
    onFilterChange(newFilters)
  }

  return (
    <Card className="w-full lg:w-64">
      <CardHeader className="flex flex-row items-center justify-between p-4 md:p-6">
        <CardTitle className="text-base md:text-lg text-[#222A59]">Filtros</CardTitle>
        <Button variant="ghost" size="sm" onClick={onClearFilters} className="text-xs md:text-sm">
          <X className="h-3 w-3 md:h-4 md:w-4 mr-1" />
          <span className="hidden sm:inline">Limpiar</span>
        </Button>
      </CardHeader>
      <CardContent className="space-y-3 md:space-y-4 p-4 md:p-6 pt-0 max-h-[calc(100vh-200px)] overflow-y-auto">
        {/* Tipo de Empresa */}
        <div className="space-y-2">
          <Label htmlFor="tipo_empresa">Tipo de Empresa</Label>
          <Select 
            value={filters.tipo_empresa || "all"} 
            onValueChange={(value) => handleFilterChange('tipo_empresa', value)}
          >
            <SelectTrigger id="tipo_empresa">
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
          <Label htmlFor="rubro">Rubro</Label>
          <Select 
            value={filters.rubro || "all"} 
            onValueChange={(value) => handleFilterChange('rubro', value)}
            disabled={loadingRubros}
          >
            <SelectTrigger id="rubro">
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

        {/* Sub-Rubro */}
        {filters.rubro && filters.rubro !== 'all' && (
          <div className="space-y-2">
            <Label htmlFor="subRubro">Sub-Rubro</Label>
            <Select 
              value={filters.subRubro || "all"} 
              onValueChange={(value) => handleFilterChange('subRubro', value)}
              disabled={loadingRubros}
            >
              <SelectTrigger id="subRubro">
                <SelectValue placeholder={loadingRubros ? "Cargando..." : "Todos los sub-rubros"} />
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
          </div>
        )}

        {/* Departamento */}
        <div className="space-y-2">
          <Label htmlFor="departamento">Departamento</Label>
          <Select 
            value={filters.departamento || "all"} 
            onValueChange={(value) => handleFilterChange('departamento', value)}
            disabled={loadingDepartamentos}
          >
            <SelectTrigger id="departamento">
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
          <Label htmlFor="categoria_matriz">Categoría de Clasificación</Label>
          <Select 
            value={filters.categoria_matriz || "all"} 
            onValueChange={(value) => handleFilterChange('categoria_matriz', value)}
          >
            <SelectTrigger id="categoria_matriz">
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
          <Label htmlFor="exporta">¿Exporta Actualmente?</Label>
          <Select 
            value={filters.exporta || "all"} 
            onValueChange={(value) => handleFilterChange('exporta', value)}
          >
            <SelectTrigger id="exporta">
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
          <Label htmlFor="importa">¿Importa Actualmente?</Label>
          <Select 
            value={filters.importa || "all"} 
            onValueChange={(value) => handleFilterChange('importa', value)}
          >
            <SelectTrigger id="importa">
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
          <Label htmlFor="promo2idiomas">Material Promoción 2 Idiomas</Label>
          <Select 
            value={filters.promo2idiomas || "all"} 
            onValueChange={(value) => handleFilterChange('promo2idiomas', value)}
          >
            <SelectTrigger id="promo2idiomas">
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
          <Label htmlFor="certificadopyme">Certificado MiPyME</Label>
          <Select 
            value={filters.certificadopyme || "all"} 
            onValueChange={(value) => handleFilterChange('certificadopyme', value)}
          >
            <SelectTrigger id="certificadopyme">
              <SelectValue placeholder="Todas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="si">Sí</SelectItem>
              <SelectItem value="no">No</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  )
}
