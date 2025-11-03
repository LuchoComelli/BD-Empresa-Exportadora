import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { CriterioEvaluacion } from '@/lib/matriz-utils';

interface CriterioRowProps {
  criterio: CriterioEvaluacion;
  onPuntajeChange: (criterioId: string, puntaje: number) => void;
}

export function CriterioRow({ criterio, onPuntajeChange }: CriterioRowProps) {
  const puntajes = Array.from({ length: criterio.puntajeMaximo + 1 }, (_, i) => i);

  return (
    <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_auto] gap-4 items-center p-4 border-b border-gray-200 hover:bg-gray-50 transition-colors">
      <div className="space-y-1">
        <h4 className="font-semibold text-gray-900">{criterio.nombre}</h4>
        <p className="text-sm text-ministerio-gray">{criterio.descripcion}</p>
      </div>

      <div className="flex gap-2">
        {puntajes.map((puntaje) => (
          <Button
            key={puntaje}
            variant="outline"
            size="sm"
            onClick={() => onPuntajeChange(criterio.id, puntaje)}
            className={cn(
              'w-10 h-10 transition-all',
              criterio.puntaje === puntaje
                ? 'bg-ministerio-blue text-white border-ministerio-blue hover:bg-ministerio-navy hover:text-white'
                : 'hover:border-ministerio-blue hover:text-ministerio-blue'
            )}
          >
            {puntaje}
          </Button>
        ))}
      </div>

      <div className="text-center md:text-right">
        <span className="text-lg font-bold text-ministerio-navy">
          {criterio.puntaje}/{criterio.puntajeMaximo}
        </span>
      </div>
    </div>
  );
}