"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"

interface FiltersSidebarProps {
  onFilterChange: (filters: any) => void
  onClearFilters: () => void
  filters?: any
}

export function FiltersSidebar({ onFilterChange, onClearFilters, filters = {} }: FiltersSidebarProps) {
  return (
    <Card className="w-full lg:w-64">
      <CardHeader className="flex flex-row items-center justify-between p-4 md:p-6">
        <CardTitle className="text-base md:text-lg text-[#222A59]">Filtros</CardTitle>
        <Button variant="ghost" size="sm" onClick={onClearFilters} className="text-xs md:text-sm">
          <X className="h-3 w-3 md:h-4 md:w-4 mr-1" />
          <span className="hidden sm:inline">Limpiar</span>
        </Button>
      </CardHeader>
      <CardContent className="space-y-3 md:space-y-4 p-4 md:p-6 pt-0">
        <div className="space-y-2">
          <Label htmlFor="categoria">Categoría</Label>
          <Select 
            value={filters.categoria || "all"} 
            onValueChange={(value) => onFilterChange({ categoria: value })}
          >
            <SelectTrigger id="categoria">
              <SelectValue placeholder="Todas las categorías" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="exportadora">Exportadora</SelectItem>
              <SelectItem value="potencial">Potencial Exportadora</SelectItem>
              <SelectItem value="inicial">Etapa Inicial</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="sector">Sector</Label>
          <Select 
            value={filters.sector || "all"} 
            onValueChange={(value) => onFilterChange({ sector: value })}
          >
            <SelectTrigger id="sector">
              <SelectValue placeholder="Todos los sectores" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="agroindustria">Agroindustria</SelectItem>
              <SelectItem value="textil">Textil</SelectItem>
              <SelectItem value="mineria">Minería</SelectItem>
              <SelectItem value="alimentos">Alimentos</SelectItem>
              <SelectItem value="artesanias">Artesanías</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="departamento">Departamento</Label>
          <Select 
            value={filters.departamento || "all"} 
            onValueChange={(value) => onFilterChange({ departamento: value })}
          >
            <SelectTrigger id="departamento">
              <SelectValue placeholder="Todos los departamentos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="capital">Capital</SelectItem>
              <SelectItem value="andalgala">Andalgalá</SelectItem>
              <SelectItem value="belen">Belén</SelectItem>
              <SelectItem value="santa-maria">Santa María</SelectItem>
              <SelectItem value="tinogasta">Tinogasta</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="certificacion">Certificaciones</Label>
          <Select 
            value={filters.certificacion || "all"} 
            onValueChange={(value) => onFilterChange({ certificacion: value })}
          >
            <SelectTrigger id="certificacion">
              <SelectValue placeholder="Todas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="si">Con Certificación</SelectItem>
              <SelectItem value="no">Sin Certificación</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  )
}
