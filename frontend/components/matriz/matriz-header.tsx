import { Progress } from "@/components/ui/progress"
import type { Categoria } from "@/lib/matriz-utils"
import { getCategoriaColor, getCategoriaTextColor } from "@/lib/matriz-utils"

interface MatrizHeaderProps {
  puntajeTotal: number
  puntajeMaximo: number
  categoria: Categoria
}

export function MatrizHeader({ puntajeTotal, puntajeMaximo, categoria }: MatrizHeaderProps) {
  const porcentaje = (puntajeTotal / puntajeMaximo) * 100

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[#222A59]">Matriz de Clasificación de Perfil Exportador</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Evalúe cada criterio para determinar el perfil exportador de la empresa
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Puntaje Total</p>
            <p className="text-4xl font-bold text-[#222A59]">
              {puntajeTotal}
              <span className="text-2xl text-muted-foreground">/{puntajeMaximo}</span>
            </p>
          </div>
          <div
            className="px-6 py-3 rounded-lg font-semibold text-sm uppercase tracking-wide"
            style={{
              backgroundColor: getCategoriaColor(categoria),
              color: getCategoriaTextColor(categoria),
            }}
          >
            {categoria}
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Progreso de Evaluación</span>
          <span className="font-semibold text-[#222A59]">{Math.round(porcentaje)}%</span>
        </div>
        <Progress value={porcentaje} className="h-3" />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Etapa Inicial (0-5)</span>
          <span>Potencial Exportadora (6-11)</span>
          <span>Exportadora (12-18)</span>
        </div>
      </div>
    </div>
  )
}
