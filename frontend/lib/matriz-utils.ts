export interface CriterioEvaluacion {
  id: string
  nombre: string
  descripcion: string
  puntaje: number
  puntajeMaximo: number
  opcion?: string // Opción seleccionada (Sí/No, Alta/Media/Baja, etc.)
  opciones?: string[] // Lista de opciones disponibles para este criterio
}

export type Categoria = "Exportadora" | "Potencial Exportadora" | "Etapa Inicial"

export function calcularCategoria(puntajeTotal: number): Categoria {
  if (puntajeTotal >= 12) return "Exportadora"
  if (puntajeTotal >= 6) return "Potencial Exportadora"
  return "Etapa Inicial"
}

export function getCategoriaColor(categoria: Categoria): string {
  switch (categoria) {
    case "Exportadora":
      return "#C3C840"
    case "Potencial Exportadora":
      return "#F59E0B"
    case "Etapa Inicial":
      return "#629BD2"
  }
}

export function getCategoriaTextColor(categoria: Categoria): string {
  switch (categoria) {
    case "Exportadora":
      return "#222A59"
    case "Potencial Exportadora":
      return "#FFFFFF"
    case "Etapa Inicial":
      return "#FFFFFF"
  }
}

// Mapeo de opciones por criterio
export const opcionesPorCriterio: Record<string, { valor: string; puntaje: number }[]> = {
  "experiencia-exportadora": [
    { valor: "Sí", puntaje: 3 },
    { valor: "No", puntaje: 0 },
  ],
  "volumen-produccion": [
    { valor: "Alta", puntaje: 3 },
    { valor: "Media", puntaje: 2 },
    { valor: "Baja", puntaje: 1 },
    { valor: "Desconocida", puntaje: 0 },
  ],
  "presencia-digital": [
    { valor: "Sí", puntaje: 2 },
    { valor: "No", puntaje: 0 },
  ],
  "posicion-arancelaria": [
    { valor: "Sí", puntaje: 1 },
    { valor: "No", puntaje: 0 },
  ],
  "participacion-internacionalizacion": [
    { valor: "Sí", puntaje: 2 },
    { valor: "No", puntaje: 0 },
  ],
  "estructura-interna": [
    { valor: "Alta", puntaje: 2 },
    { valor: "Media", puntaje: 1 },
    { valor: "No", puntaje: 0 },
  ],
  "interes-exportador": [
    { valor: "Sí", puntaje: 1 },
    { valor: "No", puntaje: 0 },
  ],
  "certificaciones-nacionales": [
    { valor: "≥2", puntaje: 2 },
    { valor: "1", puntaje: 1 },
    { valor: "Ninguna", puntaje: 0 },
  ],
  "certificaciones-internacionales": [
    { valor: "≥1", puntaje: 2 },
    { valor: "Ninguna", puntaje: 0 },
  ],
}

export const criteriosIniciales: CriterioEvaluacion[] = [
  {
    id: "experiencia-exportadora",
    nombre: "Experiencia exportadora",
    descripcion: "Ha realizado exportaciones reales",
    puntaje: 0,
    puntajeMaximo: 3,
    opcion: "No",
    opciones: opcionesPorCriterio["experiencia-exportadora"].map(o => o.valor),
  },
  {
    id: "volumen-produccion",
    nombre: "Volumen de producción",
    descripcion: "Capacidad productiva estimada",
    puntaje: 0,
    puntajeMaximo: 3,
    opcion: "Desconocida",
    opciones: opcionesPorCriterio["volumen-produccion"].map(o => o.valor),
  },
  {
    id: "presencia-digital",
    nombre: "Presencia digital",
    descripcion: "Página web, catálogo online, redes activas",
    puntaje: 0,
    puntajeMaximo: 2,
    opcion: "No",
    opciones: opcionesPorCriterio["presencia-digital"].map(o => o.valor),
  },
  {
    id: "posicion-arancelaria",
    nombre: "Posición arancelaria (NCM)",
    descripcion: "Producto correctamente clasificado",
    puntaje: 0,
    puntajeMaximo: 1,
    opcion: "No",
    opciones: opcionesPorCriterio["posicion-arancelaria"].map(o => o.valor),
  },
  {
    id: "participacion-internacionalizacion",
    nombre: "Participación en acciones de internacionalización",
    descripcion: "Ferias, rondas, misiones, capacitaciones",
    puntaje: 0,
    puntajeMaximo: 2,
    opcion: "No",
    opciones: opcionesPorCriterio["participacion-internacionalizacion"].map(o => o.valor),
  },
  {
    id: "estructura-interna",
    nombre: "Estructura interna para exportar",
    descripcion: "Área, persona o proveedor externo para comercio exterior",
    puntaje: 0,
    puntajeMaximo: 2,
    opcion: "No",
    opciones: opcionesPorCriterio["estructura-interna"].map(o => o.valor),
  },
  {
    id: "interes-exportador",
    nombre: "Interés exportador",
    descripcion: "Declarado en entrevistas o formularios",
    puntaje: 0,
    puntajeMaximo: 1,
    opcion: "No",
    opciones: opcionesPorCriterio["interes-exportador"].map(o => o.valor),
  },
  {
    id: "certificaciones-nacionales",
    nombre: "Certificaciones nacionales",
    descripcion: "SENASA, INV, RPE, RNPA, INAL, etc.",
    puntaje: 0,
    puntajeMaximo: 2,
    opcion: "Ninguna",
    opciones: opcionesPorCriterio["certificaciones-nacionales"].map(o => o.valor),
  },
  {
    id: "certificaciones-internacionales",
    nombre: "Certificaciones internacionales",
    descripcion: "Orgánico, Kosher, Halal, Fair Trade, ISO, etc.",
    puntaje: 0,
    puntajeMaximo: 2,
    opcion: "Ninguna",
    opciones: opcionesPorCriterio["certificaciones-internacionales"].map(o => o.valor),
  },
]

// Función para obtener el puntaje de una opción
export function getPuntajeFromOpcion(criterioId: string, opcion: string): number {
  const opciones = opcionesPorCriterio[criterioId]
  const opcionEncontrada = opciones?.find(o => o.valor === opcion)
  return opcionEncontrada?.puntaje ?? 0
}
