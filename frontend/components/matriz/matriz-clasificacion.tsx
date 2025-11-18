"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { MatrizHeader } from "./matriz-header"
import { CriterioRow } from "./criterio-row"
import { calcularCategoria, criteriosIniciales, type CriterioEvaluacion, getPuntajeFromOpcion, opcionesPorCriterio } from "@/lib/matriz-utils"
import { RotateCcw, Save, Loader2 } from "lucide-react"
import api from "@/lib/api"

interface MatrizClasificacionProps {
  empresaId?: string
}

// Mapeo de IDs de criterios a nombres de campos del backend
const criterioToBackendField: Record<string, string> = {
  "experiencia-exportadora": "experiencia_exportadora",
  "volumen-produccion": "volumen_produccion",
  "presencia-digital": "presencia_digital",
  "posicion-arancelaria": "posicion_arancelaria",
  "participacion-internacionalizacion": "participacion_internacionalizacion",
  "estructura-interna": "estructura_interna",
  "interes-exportador": "interes_exportador",
  "certificaciones-nacionales": "certificaciones_nacionales",
  "certificaciones-internacionales": "certificaciones_internacionales",
}

export function MatrizClasificacion({ empresaId }: MatrizClasificacionProps) {
  const [criterios, setCriterios] = useState<CriterioEvaluacion[]>(criteriosIniciales)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [empresaInfo, setEmpresaInfo] = useState<{
    tipo_empresa?: string
    razon_social?: string
  }>({})

  useEffect(() => {
    if (empresaId) {
      cargarMatrizExistente()
    } else {
      setCriterios(criteriosIniciales)
    }
  }, [empresaId])
  
  const cargarMatrizExistente = async () => {
    if (!empresaId) return
    
    try {
      // Primero intentar cargar matriz existente
      setLoading(true)
      const matrizExistente = await api.get<any>(`/empresas/matriz-clasificacion/empresa/${empresaId}/`)
      
      if (matrizExistente) {
        // Determinar tipo de empresa desde el campo empresa unificado
        const tipo_empresa = matrizExistente.empresa_tipo || matrizExistente.empresa?.tipo_empresa_valor || 'producto'
        const razon_social = matrizExistente.empresa_nombre || matrizExistente.empresa?.razon_social || 'Empresa'
        
        // Mapear matriz existente a criterios
        const nuevosCriterios = criteriosIniciales.map((criterio) => {
          const backendField = criterioToBackendField[criterio.id]
          const puntaje = matrizExistente[backendField] || 0
          // Calcular opción basada en el puntaje
          const opcion = obtenerOpcionDesdePuntaje(criterio.id, puntaje)
          return { ...criterio, puntaje, opcion }
        })
        
        setCriterios(nuevosCriterios)
        setEmpresaInfo({
          tipo_empresa: tipo_empresa,
          razon_social: razon_social
        })
        setLoading(false)
        return
      }
    } catch (error: any) {
      // Si no existe matriz, calcular automáticamente
      console.log('[Matriz] No se encontró matriz existente, calculando automáticamente:', error?.message)
    }
    
    // Si no existe matriz, calcular automáticamente
    await calcularPuntajesAutomaticos()
  }
  
  const obtenerOpcionDesdePuntaje = (criterioId: string, puntaje: number): string => {
    const opcionesConPuntaje = opcionesPorCriterio[criterioId] || []
    const opcionEncontrada = opcionesConPuntaje.find(o => o.puntaje === puntaje)
    return opcionEncontrada?.valor || opcionesConPuntaje[0]?.valor || 'No'
  }

  const calcularPuntajesAutomaticos = async () => {
    if (!empresaId) return

    try {
      setLoading(true)
      const empresaIdNum = parseInt(empresaId)
      console.log('[Matriz] Calculando puntajes para empresa ID:', empresaIdNum)
      const resultado = await api.calcularPuntajesMatriz(empresaIdNum)
      console.log('[Matriz] Resultado recibido:', resultado)
      
      setEmpresaInfo({
        tipo_empresa: resultado.tipo_empresa,
        razon_social: resultado.razon_social,
      })

      // Mapear puntajes y opciones del backend a criterios del frontend
      const nuevosCriterios = criteriosIniciales.map((criterio) => {
        const backendField = criterioToBackendField[criterio.id]
        const puntaje = resultado.puntajes[backendField as keyof typeof resultado.puntajes] || 0
        const opcion = resultado.opciones?.[backendField as keyof typeof resultado.opciones] || criterio.opcion || 'No'
        return { ...criterio, puntaje, opcion }
      })

      setCriterios(nuevosCriterios)
    } catch (error: any) {
      console.error("Error calculando puntajes:", error)
      const errorMessage = error?.message || error?.response?.data?.error || "Error desconocido"
      console.error('[Matriz] Error completo:', error)
      alert(`Error al calcular los puntajes automáticamente: ${errorMessage}`)
    } finally {
      setLoading(false)
    }
  }

  const puntajeTotal = criterios.reduce((sum, criterio) => sum + criterio.puntaje, 0)
  const puntajeMaximo = criterios.reduce((sum, criterio) => sum + criterio.puntajeMaximo, 0)
  const categoria = calcularCategoria(puntajeTotal)

  const handlePuntajeChange = (criterioId: string, opcion: string) => {
    const puntaje = getPuntajeFromOpcion(criterioId, opcion)
    setCriterios((prev) => prev.map((criterio) => 
      criterio.id === criterioId ? { ...criterio, puntaje, opcion } : criterio
    ))
  }

  const handleReset = () => {
    if (empresaId) {
      calcularPuntajesAutomaticos()
    } else {
      setCriterios(criteriosIniciales)
    }
  }

  const handleSave = async () => {
    if (!empresaId) {
      alert("Por favor, seleccione una empresa primero.")
      return
    }

    try {
      setSaving(true)
      
      // Mapear criterios a formato del backend usando los puntajes calculados
      const data: any = {
        experiencia_exportadora: criterios.find((c) => c.id === "experiencia-exportadora")?.puntaje || 0,
        volumen_produccion: criterios.find((c) => c.id === "volumen-produccion")?.puntaje || 0,
        presencia_digital: criterios.find((c) => c.id === "presencia-digital")?.puntaje || 0,
        posicion_arancelaria: criterios.find((c) => c.id === "posicion-arancelaria")?.puntaje || 0,
        participacion_internacionalizacion: criterios.find((c) => c.id === "participacion-internacionalizacion")?.puntaje || 0,
        estructura_interna: criterios.find((c) => c.id === "estructura-interna")?.puntaje || 0,
        interes_exportador: criterios.find((c) => c.id === "interes-exportador")?.puntaje || 0,
        certificaciones_nacionales: criterios.find((c) => c.id === "certificaciones-nacionales")?.puntaje || 0,
        certificaciones_internacionales: criterios.find((c) => c.id === "certificaciones-internacionales")?.puntaje || 0,
      }

      // Agregar el campo correcto según el tipo de empresa
      // Si no tenemos el tipo de empresa, intentar obtenerlo del cálculo anterior
      if (!empresaInfo.tipo_empresa) {
        // Intentar calcular para obtener el tipo
        try {
          const resultado = await api.calcularPuntajesMatriz(parseInt(empresaId))
          empresaInfo.tipo_empresa = resultado.tipo_empresa
        } catch (error) {
          console.error("Error obteniendo tipo de empresa:", error)
        }
      }
      
      if (empresaInfo.tipo_empresa === "producto") {
        data.empresa_producto = parseInt(empresaId)
      } else if (empresaInfo.tipo_empresa === "servicio") {
        data.empresa_servicio = parseInt(empresaId)
      } else if (empresaInfo.tipo_empresa === "mixta") {
        data.empresa_mixta = parseInt(empresaId)
      } else {
        // Si no se puede determinar, intentar con producto por defecto
        console.warn("No se pudo determinar el tipo de empresa, usando 'producto' por defecto")
        data.empresa_producto = parseInt(empresaId)
      }

      console.log('[Matriz] Guardando evaluación:', data)
      const resultado = await api.guardarEvaluacionMatriz(data)
      console.log('[Matriz] Resultado del guardado:', resultado)
      alert("Evaluación guardada exitosamente.")
    } catch (error: any) {
      console.error("Error guardando evaluación:", error)
      alert(`Error al guardar la evaluación: ${error.message || "Error desconocido"}`)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-12">
          <div className="flex flex-col items-center justify-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-[#3259B5]" />
            <p className="text-muted-foreground">Calculando puntajes automáticamente...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-6">
          <MatrizHeader puntajeTotal={puntajeTotal} puntajeMaximo={puntajeMaximo} categoria={categoria} />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <div className="divide-y divide-border">
            {criterios.map((criterio) => (
              <CriterioRow key={criterio.id} criterio={criterio} onPuntajeChange={handlePuntajeChange} />
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-muted/30">
        <CardContent className="p-6">
          <div className="space-y-4">
            <h3 className="font-semibold text-[#222A59]">Criterios de Evaluación</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-[#C3C840]" />
                  <span className="font-semibold text-foreground">Exportadora (12-18 pts)</span>
                </div>
                <p className="text-muted-foreground text-xs leading-relaxed">
                  Empresa con experiencia consolidada en exportación, estructura adecuada y certificaciones
                  internacionales.
                </p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-[#F59E0B]" />
                  <span className="font-semibold text-foreground">Potencial Exportadora (6-11 pts)</span>
                </div>
                <p className="text-muted-foreground text-xs leading-relaxed">
                  Empresa con capacidad productiva y algunos elementos para exportar, requiere fortalecimiento en áreas
                  específicas.
                </p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-[#629BD2]" />
                  <span className="font-semibold text-foreground">Etapa Inicial (0-5 pts)</span>
                </div>
                <p className="text-muted-foreground text-xs leading-relaxed">
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
        <Button 
          onClick={handleSave} 
          className="gap-2 bg-[#3259B5] hover:bg-[#222A59]"
          disabled={saving || !empresaId}
        >
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Guardando...
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              Guardar Evaluación
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
