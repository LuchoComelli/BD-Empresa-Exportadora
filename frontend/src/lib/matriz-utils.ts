// src/lib/matriz-utils.ts

export type Categoria = 'Exportadora' | 'Potencial Exportadora' | 'Etapa Inicial';

export interface CriterioEvaluacion {
  id: string;
  nombre: string;
  descripcion: string;
  puntajeMaximo: number;
  puntaje: number;
}

export const criteriosIniciales: CriterioEvaluacion[] = [
  {
    id: '1',
    nombre: 'Experiencia Exportadora',
    descripcion: 'Historial y trayectoria de la empresa en exportaciones',
    puntajeMaximo: 2,
    puntaje: 0,
  },
  {
    id: '2',
    nombre: 'Capacidad Productiva',
    descripcion: 'Volumen y escala de producción para mercados internacionales',
    puntajeMaximo: 2,
    puntaje: 0,
  },
  {
    id: '3',
    nombre: 'Estructura Organizacional',
    descripcion: 'Áreas especializadas y personal capacitado en comercio exterior',
    puntajeMaximo: 2,
    puntaje: 0,
  },
  {
    id: '4',
    nombre: 'Certificaciones',
    descripcion: 'Normas de calidad, seguridad y certificaciones internacionales',
    puntajeMaximo: 2,
    puntaje: 0,
  },
  {
    id: '5',
    nombre: 'Logística y Distribución',
    descripcion: 'Capacidad de gestión logística y canales de distribución internacional',
    puntajeMaximo: 2,
    puntaje: 0,
  },
  {
    id: '6',
    nombre: 'Marketing Digital',
    descripcion: 'Presencia digital, e-commerce y estrategias de marketing internacional',
    puntajeMaximo: 2,
    puntaje: 0,
  },
  {
    id: '7',
    nombre: 'Capacidad Financiera',
    descripcion: 'Recursos financieros y acceso a financiamiento para exportación',
    puntajeMaximo: 2,
    puntaje: 0,
  },
  {
    id: '8',
    nombre: 'Adaptación de Producto',
    descripcion: 'Flexibilidad para adaptar productos a mercados internacionales',
    puntajeMaximo: 2,
    puntaje: 0,
  },
  {
    id: '9',
    nombre: 'Conocimiento de Mercados',
    descripcion: 'Investigación y comprensión de mercados internacionales objetivo',
    puntajeMaximo: 2,
    puntaje: 0,
  },
];

export function calcularCategoria(puntajeTotal: number): Categoria {
  if (puntajeTotal >= 12) return 'Exportadora';
  if (puntajeTotal >= 6) return 'Potencial Exportadora';
  return 'Etapa Inicial';
}

export function getCategoriaColor(categoria: Categoria): string {
  switch (categoria) {
    case 'Exportadora':
      return '#C3C840';
    case 'Potencial Exportadora':
      return '#F59E0B';
    case 'Etapa Inicial':
      return '#629BD2';
  }
}

export function getCategoriaTextColor(categoria: Categoria): string {
  switch (categoria) {
    case 'Exportadora':
      return '#222A59';
    case 'Potencial Exportadora':
      return '#FFFFFF';
    case 'Etapa Inicial':
      return '#FFFFFF';
  }
}