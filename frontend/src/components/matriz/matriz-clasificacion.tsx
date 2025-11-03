import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MatrizHeader } from './matriz-header';
import { CriterioRow } from './criterio-row';
import { calcularCategoria, criteriosIniciales } from '@/lib/matriz-utils';
import { RotateCcw, Save } from 'lucide-react';

interface MatrizClasificacionProps {
  empresaId?: string;
}

export function MatrizClasificacion({ empresaId }: MatrizClasificacionProps) {
  const [criterios, setCriterios] = useState(criteriosIniciales);

  const puntajeTotal = criterios.reduce((sum, criterio) => sum + criterio.puntaje, 0);
  const puntajeMaximo = criterios.reduce((sum, criterio) => sum + criterio.puntajeMaximo, 0);
  const categoria = calcularCategoria(puntajeTotal);

  const handlePuntajeChange = (criterioId: string, puntaje: number) => {
    setCriterios((prev) => prev.map((criterio) => (criterio.id === criterioId ? { ...criterio, puntaje } : criterio)));
  };

  const handleReset = () => {
    setCriterios(criteriosIniciales);
  };

  const handleSave = () => {
    console.log('Guardando evaluación:', {
      empresaId,
      criterios,
      puntajeTotal,
      categoria,
    });
    alert('Evaluación guardada correctamente');
    // Handle save logic with API
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-6">
          <MatrizHeader puntajeTotal={puntajeTotal} puntajeMaximo={puntajeMaximo} categoria={categoria} />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <div className="divide-y divide-gray-200">
            {criterios.map((criterio) => (
              <CriterioRow key={criterio.id} criterio={criterio} onPuntajeChange={handlePuntajeChange} />
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gray-50">
        <CardContent className="p-6">
          <div className="space-y-4">
            <h3 className="font-semibold text-ministerio-navy">Criterios de Evaluación</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-ministerio-yellow" />
                  <span className="font-semibold text-gray-900">Exportadora (12-18 pts)</span>
                </div>
                <p className="text-ministerio-gray text-xs leading-relaxed">
                  Empresa con experiencia consolidada en exportación, estructura adecuada y certificaciones
                  internacionales.
                </p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-orange-500" />
                  <span className="font-semibold text-gray-900">Potencial Exportadora (6-11 pts)</span>
                </div>
                <p className="text-ministerio-gray text-xs leading-relaxed">
                  Empresa con capacidad productiva y algunos elementos para exportar, requiere fortalecimiento en áreas
                  específicas.
                </p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-ministerio-light-blue" />
                  <span className="font-semibold text-gray-900">Etapa Inicial (0-5 pts)</span>
                </div>
                <p className="text-ministerio-gray text-xs leading-relaxed">
                  Empresa en etapa temprana, requiere desarrollo significativo en múltiples áreas para iniciar proceso
                  exportador.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-between">
        <Button variant="outline" onClick={handleReset} className="gap-2 bg-transparent">
          <RotateCcw className="h-4 w-4" />
          Reiniciar Evaluación
        </Button>
        <Button onClick={handleSave} className="gap-2 bg-ministerio-blue hover:bg-ministerio-navy">
          <Save className="h-4 w-4" />
          Guardar Evaluación
        </Button>
      </div>
    </div>
  );
}