// frontend/src/data/registroData.ts

/**
 * Catálogos de datos para el registro
 * TODO: Reemplazar con llamadas a API cuando estén disponibles
 */

export const PROVINCIAS_ARGENTINA = [
  'Buenos Aires',
  'Catamarca',
  'Chaco',
  'Chubut',
  'Córdoba',
  'Corrientes',
  'Entre Ríos',
  'Formosa',
  'Jujuy',
  'La Pampa',
  'La Rioja',
  'Mendoza',
  'Misiones',
  'Neuquén',
  'Río Negro',
  'Salta',
  'San Juan',
  'San Luis',
  'Santa Cruz',
  'Santa Fe',
  'Santiago del Estero',
  'Tierra del Fuego',
  'Tucumán',
];

export const RUBROS_DATA = {
  agricola: {
    nombre: 'Agrícola',
    subRubros: [
      'Vinos',
      'Aceite de Oliva',
      'Frutas Frescas',
      'Frutas Secas',
      'Hortalizas',
      'Cereales',
      'Legumbres',
      'Aromáticas',
      'Otro',
    ],
  },
  ganadero: {
    nombre: 'Ganadero',
    subRubros: ['Caprino', 'Bovino', 'Ovino', 'Porcino', 'Avícola', 'Apícola', 'Otro'],
  },
  industrial: {
    nombre: 'Industrial',
    subRubros: [
      'Metalúrgica',
      'Química',
      'Plásticos',
      'Maquinaria',
      'Electrónica',
      'Automotriz',
      'Construcción',
      'Otro',
    ],
  },
  textil: {
    nombre: 'Textil',
    subRubros: ['Hilados', 'Tejidos', 'Confección', 'Indumentaria', 'Calzado', 'Marroquinería', 'Otro'],
  },
  alimentos: {
    nombre: 'Alimentos y Bebidas',
    subRubros: [
      'Conservas',
      'Lácteos',
      'Panificados',
      'Bebidas',
      'Dulces y Mermeladas',
      'Embutidos',
      'Congelados',
      'Otro',
    ],
  },
  mineria: {
    nombre: 'Minería',
    subRubros: ['Metalíferos', 'No Metalíferos', 'Rocas de Aplicación', 'Piedras Preciosas', 'Otro'],
  },
  tecnologia: {
    nombre: 'Tecnología',
    subRubros: ['Software', 'Hardware', 'Telecomunicaciones', 'Servicios IT', 'Otro'],
  },
  servicios: {
    nombre: 'Servicios',
    subRubros: ['Turismo', 'Logística', 'Consultoría', 'Educación', 'Salud', 'Otro'],
  },
  artesanias: {
    nombre: 'Artesanías',
    subRubros: ['Textiles', 'Cerámica', 'Madera', 'Cuero', 'Metal', 'Otro'],
  },
};

export const DEPARTAMENTOS_DATA = {
  capital: {
    nombre: 'Capital',
    municipios: {
      'san-fernando': {
        nombre: 'San Fernando del Valle de Catamarca',
        localidades: ['Centro', 'Villa Cubas', 'Barrio Norte', 'Barrio Sur'],
      },
    },
  },
  'valle-viejo': {
    nombre: 'Valle Viejo',
    municipios: {
      'valle-viejo': {
        nombre: 'Valle Viejo',
        localidades: ['Valle Viejo Centro', 'Colonia del Valle', 'San Isidro'],
      },
    },
  },
  'fray-mamerto-esquiu': {
    nombre: 'Fray Mamerto Esquiú',
    municipios: {
      'san-jose': {
        nombre: 'San José',
        localidades: ['San José Centro', 'El Pantanillo', 'Colonia Nueva Coneta'],
      },
    },
  },
  andalgala: {
    nombre: 'Andalgalá',
    municipios: {
      andalgala: {
        nombre: 'Andalgalá',
        localidades: ['Andalgalá Centro', 'Chaquiago', 'Amanao'],
      },
    },
  },
  belen: {
    nombre: 'Belén',
    municipios: {
      belen: {
        nombre: 'Belén',
        localidades: ['Belén Centro', 'Londres', 'Hualfín'],
      },
    },
  },
  'santa-maria': {
    nombre: 'Santa María',
    municipios: {
      'santa-maria': {
        nombre: 'Santa María',
        localidades: ['Santa María Centro', 'Fuerte Quemado', 'San José'],
      },
    },
  },
  tinogasta: {
    nombre: 'Tinogasta',
    municipios: {
      tinogasta: {
        nombre: 'Tinogasta',
        localidades: ['Tinogasta Centro', 'Fiambalá', 'Anillaco'],
      },
    },
  },
};

export type RubroKey = keyof typeof RUBROS_DATA;
export type DepartamentoKey = keyof typeof DEPARTAMENTOS_DATA;