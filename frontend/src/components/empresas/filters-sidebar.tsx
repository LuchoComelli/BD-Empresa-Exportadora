import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

interface FiltersSidebarProps {
  onFilterChange: (filters: any) => void;
  onClearFilters: () => void;
}

export function FiltersSidebar({ onFilterChange, onClearFilters }: FiltersSidebarProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg text-ministerio-navy">Filtros</CardTitle>
        <Button variant="ghost" size="sm" onClick={onClearFilters}>
          <X className="h-4 w-4 mr-1" />
          Limpiar
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="categoria">Categoría</Label>
          <Select onValueChange={(value) => onFilterChange({ categoria: value })}>
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
          <Select onValueChange={(value) => onFilterChange({ sector: value })}>
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
          <Select onValueChange={(value) => onFilterChange({ departamento: value })}>
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
          <Label htmlFor="puntaje">Puntaje Mínimo</Label>
          <Select onValueChange={(value) => onFilterChange({ puntaje: value })}>
            <SelectTrigger id="puntaje">
              <SelectValue placeholder="Cualquier puntaje" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="12">12+ (Exportadora)</SelectItem>
              <SelectItem value="6">6+ (Potencial)</SelectItem>
              <SelectItem value="0">0+ (Todas)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="certificacion">Certificaciones</Label>
          <Select onValueChange={(value) => onFilterChange({ certificacion: value })}>
            <SelectTrigger id="certificacion">
              <SelectValue placeholder="Todas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="internacional">Internacional</SelectItem>
              <SelectItem value="nacional">Nacional</SelectItem>
              <SelectItem value="sin">Sin certificación</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
}