"use client"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { CriterioEvaluacion } from "@/lib/matriz-utils"

interface CriterioRowProps {
  criterio: CriterioEvaluacion
  onPuntajeChange: (criterioId: string, puntaje: number) => void
}

export function CriterioRow({ criterio, onPuntajeChange }: CriterioRowProps) {
  const puntajes = Array.from({ length: criterio.puntajeMaximo + 1 }, (_, i) => i)

  return (
    <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_auto] gap-4 items-center p-4 border-b border-border hover:bg-muted/30 transition-colors">
      <div className="space-y-1">
        <h4 className="font-semibold text-foreground">{criterio.nombre}</h4>
        <p className="text-sm text-muted-foreground">{criterio.descripcion}</p>
      </div>

      <div className="flex gap-2">
        {puntajes.map((puntaje) => (
          <Button
            key={puntaje}
            variant="outline"
            size="sm"
            onClick={() => onPuntajeChange(criterio.id, puntaje)}
            className={cn(
              "w-10 h-10 transition-all",
              criterio.puntaje === puntaje
                ? "bg-[#3259B5] text-white border-[#3259B5] hover:bg-[#222A59] hover:text-white"
                : "hover:border-[#3259B5] hover:text-[#3259B5]",
            )}
          >
            {puntaje}
          </Button>
        ))}
      </div>

      <div className="text-center md:text-right">
        <span className="text-lg font-bold text-[#222A59]">
          {criterio.puntaje}/{criterio.puntajeMaximo}
        </span>
      </div>
    </div>
  )
}
