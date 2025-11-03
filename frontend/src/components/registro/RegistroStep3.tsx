// frontend/src/components/registro/RegistroStep3.tsx

import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, ArrowRight, Plus, X } from 'lucide-react';
import type { RegistroEmpresaFormData, ActividadPromocion } from '@/types/registro';

interface RegistroStep3Props {
  formData: RegistroEmpresaFormData;
  updateFormData: (field: string, value: any) => void;
  onNext: () => void;
  onPrevious: () => void;
}

export function RegistroStep3({ formData, updateFormData, onNext, onPrevious }: RegistroStep3Props) {
  const toUpperCase = (value: string) => value.toUpperCase();

  const agregarActividad = (tipo: 'feria' | 'mision' | 'ronda') => {
    const nuevasActividades = [
      ...formData.actividadesPromocion,
      { id: Date.now().toString(), tipo, lugar: '', anio: '' },
    ];
    updateFormData('actividadesPromocion', nuevasActividades);
  };

  const eliminarActividad = (id: string) => {
    const nuevasActividades = formData.actividadesPromocion.filter((a) => a.id !== id);
    updateFormData('actividadesPromocion', nuevasActividades);
  };

  const actualizarActividad = (
    id: string,
    field: keyof ActividadPromocion,
    value: string
  ) => {
    const nuevasActividades = formData.actividadesPromocion.map((a) =>
      a.id === id ? { ...a, [field]: value } : a
    );
    updateFormData('actividadesPromocion', nuevasActividades);
  };

  const handleNext = () => {
    // Validaciones
    if (!formData.exporta) {
      alert('Por favor indique si exporta actualmente');
      return;
    }
    if (!formData.importa) {
      alert('Por favor indique si importa actualmente');
      return;
    }

    onNext();
  };

  return (
    <div className="space-y-4 md:space-y-6">
      <div>
        <h2 className="text-xl md:text-2xl font-bold text-[#222A59] mb-2">Actividad Comercial</h2>
        <p className="text-sm md:text-base text-[#6B7280]">
          Información sobre exportaciones e importaciones
        </p>
      </div>

      <div className="space-y-4">
        {/* Exporta */}
        <div>
          <Label htmlFor="exporta">
            ¿Exporta actualmente? <span className="text-red-500">*</span>
          </Label>
          <Select
            value={formData.exporta}
            onValueChange={(value) => updateFormData('exporta', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecciona una opción" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="si">Sí</SelectItem>
              <SelectItem value="no">No</SelectItem>
              <SelectItem value="en-proceso">En proceso</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {formData.exporta === 'si' && (
          <div>
            <Label htmlFor="destinoExportacion">Destino de Exportación</Label>
            <Textarea
              id="destinoExportacion"
              value={formData.destinoExportacion}
              onChange={(e) => updateFormData('destinoExportacion', toUpperCase(e.target.value))}
              placeholder="PAÍSES A LOS QUE EXPORTA (SEPARADOS POR COMAS)"
              rows={3}
              className="uppercase"
            />
          </div>
        )}

        {/* Importa */}
        <div>
          <Label htmlFor="importa">
            ¿Importa actualmente? <span className="text-red-500">*</span>
          </Label>
          <Select
            value={formData.importa}
            onValueChange={(value) => updateFormData('importa', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecciona una opción" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="si">Sí</SelectItem>
              <SelectItem value="no">No</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Material de Promoción */}
        <div>
          <Label htmlFor="materialPromocion">
            ¿Cuenta con material de promoción en 2 idiomas?
          </Label>
          <Select
            value={formData.materialPromocion}
            onValueChange={(value) => updateFormData('materialPromocion', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecciona una opción" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="si">Sí</SelectItem>
              <SelectItem value="no">No</SelectItem>
              <SelectItem value="en-desarrollo">En desarrollo</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Actividades de Promoción */}
        <div className="space-y-4 pt-4 border-t">
          <div>
            <h3 className="font-semibold text-[#222A59] mb-2">
              Actividades de Promoción Internacional a las que Asistió
            </h3>
            <p className="text-xs text-[#6B7280] mb-3">
              Agregue las ferias, misiones comerciales y rondas de negocios en las que participó
            </p>
          </div>

          {formData.actividadesPromocion.map((actividad) => (
            <div
              key={actividad.id}
              className="space-y-3 p-4 border border-[#3259B5]/30 rounded-lg bg-[#3259B5]/5"
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold text-[#222A59] text-sm">
                  {actividad.tipo === 'feria'
                    ? 'Feria'
                    : actividad.tipo === 'mision'
                      ? 'Misión Comercial'
                      : 'Ronda de Negocios'}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => eliminarActividad(actividad.id!)}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <Label>Lugar</Label>
                  <Input
                    value={actividad.lugar}
                    onChange={(e) =>
                      actualizarActividad(actividad.id!, 'lugar', toUpperCase(e.target.value))
                    }
                    placeholder="CIUDAD, PAÍS"
                    className="uppercase"
                  />
                </div>
                <div>
                  <Label>Año</Label>
                  <Input
                    value={actividad.anio}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '');
                      if (value.length <= 4) {
                        actualizarActividad(actividad.id!, 'anio', value);
                      }
                    }}
                    placeholder="2024"
                  />
                </div>
              </div>
            </div>
          ))}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => agregarActividad('feria')}
              className="border-dashed border-[#3259B5] text-[#3259B5] hover:bg-[#3259B5]/5 bg-transparent"
            >
              <Plus className="w-4 h-4 mr-2" />
              Agregar Feria
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => agregarActividad('mision')}
              className="border-dashed border-[#66A29C] text-[#66A29C] hover:bg-[#66A29C]/5 bg-transparent"
            >
              <Plus className="w-4 h-4 mr-2" />
              Agregar Misión
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => agregarActividad('ronda')}
              className="border-dashed border-[#807DA1] text-[#807DA1] hover:bg-[#807DA1]/5 bg-transparent"
            >
              <Plus className="w-4 h-4 mr-2" />
              Agregar Ronda
            </Button>
          </div>
        </div>

        {/* Observaciones */}
        <div>
          <Label htmlFor="observaciones">Observaciones</Label>
          <Textarea
            id="observaciones"
            value={formData.observaciones}
            onChange={(e) => updateFormData('observaciones', toUpperCase(e.target.value))}
            placeholder="INFORMACIÓN ADICIONAL RELEVANTE"
            rows={4}
            className="uppercase"
          />
        </div>
      </div>

      {/* Navigation */}
      <div className="flex flex-col sm:flex-row justify-between gap-3">
        <Button
          type="button"
          onClick={onPrevious}
          variant="outline"
          className="border-[#3259B5] text-[#3259B5] bg-transparent text-sm md:text-base"
        >
          <ArrowLeft className="mr-2 w-4 h-4" />
          Anterior
        </Button>
        <Button
          type="button"
          onClick={handleNext}
          className="bg-[#3259B5] hover:bg-[#3259B5]/90 text-white text-sm md:text-base"
        >
          Siguiente
          <ArrowRight className="ml-2 w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}