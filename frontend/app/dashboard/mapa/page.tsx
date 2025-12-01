"use client"

import { MainLayout } from "@/components/layout/main-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Download, FileImage, FileDown, MapPin, Building2, Phone, Mail, Loader2, Package, Wrench, Building, Flame, MapPinned, Search, X } from "lucide-react"
import { useState, useEffect } from "react"
import { api } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { FiltersDropdown } from "@/components/empresas/filters-dropdown"




interface Empresa {
  id: number
  razon_social: string
  nombre_fantasia?: string
  categoria?: string
  tipo_empresa?: string
  rubro_nombre?: string
  departamento_nombre?: string
  municipio_nombre?: string
  localidad_nombre?: string
  geolocalizacion?: string
  telefono?: string
  correo?: string
  sitioweb?: string
  lat?: number
  lng?: number
}

// Función para obtener color según cantidad de empresas (fuera del componente)
const getColorPorCantidad = (cantidad: number): string => {
  if (cantidad === 0) return '#e5e7eb'      // gris claro - sin empresas
  if (cantidad <= 5) return '#10b981'       // verde - pocas
  if (cantidad <= 20) return '#fbbf24'      // amarillo - moderado
  if (cantidad <= 40) return '#f97316'      // naranja - bastantes
  return '#ef4444'                          // rojo - muchas
}

export default function MapaPage() {
  const { toast } = useToast()
  const [empresas, setEmpresas] = useState<Empresa[]>([])
  const [selectedEmpresa, setSelectedEmpresa] = useState<Empresa | null>(null)
  const [loading, setLoading] = useState(true)
  const [mapLoaded, setMapLoaded] = useState(false)
  const [map, setMap] = useState<any>(null)
  const [markers, setMarkers] = useState<any[]>([])
  const [heatmapLayer, setHeatmapLayer] = useState<any>(null)
  const [showHeatmap, setShowHeatmap] = useState(false)
  const [departamentosLayer, setDepartamentosLayer] = useState<any>(null)
  const [empresasPorDepartamento, setEmpresasPorDepartamento] = useState<{[key: string]: number}>({})
  const [filters, setFilters] = useState<any>({})
  const [searchQuery, setSearchQuery] = useState("")
  const [allEmpresas, setAllEmpresas] = useState<Empresa[]>([]) // Guardar todas las empresas
  const [selectedDepartamento, setSelectedDepartamento] = useState<string | null>(null)
  const [exportingMap, setExportingMap] = useState(false)
  const [exportingDept, setExportingDept] = useState(false)

  // Agregar estilos CSS para el mapa
  useEffect(() => {
    const style = document.createElement('style')
    style.textContent = `
      #empresas-map .leaflet-container {
        z-index: 0 !important;
      }
      #empresas-map .leaflet-control-container {
        z-index: 1 !important;
      }
      #empresas-map .leaflet-top,
      #empresas-map .leaflet-bottom {
        z-index: 1 !important;
      }
      #empresas-map .leaflet-pane {
        z-index: 0 !important;
      }
      #empresas-map .leaflet-control {
        z-index: 1 !important;
      }
        #empresas-map .leaflet-container {
  cursor: grab;
}
#empresas-map .leaflet-container:active {
  cursor: grabbing;
}
#empresas-map .leaflet-dragging .leaflet-container {
  cursor: grabbing;
}
    `
    document.head.appendChild(style)
    
    return () => {
      document.head.removeChild(style)
    }
  }, [])

  // Cargar empresas
    useEffect(() => {
  const loadEmpresas = async () => {
    try {
      setLoading(true)
      const params: any = {}

      // Búsqueda
      if (searchQuery) {
        params.search = searchQuery
      }

      // Filtros
if (filters.tipo_empresa && filters.tipo_empresa !== 'all') {
        params.tipo_empresa = filters.tipo_empresa
      }

      if (filters.rubro && filters.rubro !== 'all') {
        params.rubro = filters.rubro
      }

      if (filters.subRubro && filters.subRubro !== 'all') {
        params.sub_rubro = filters.subRubro
      }

      if (filters.categoria_matriz && filters.categoria_matriz !== 'all') {
        params.categoria_matriz = filters.categoria_matriz
      }

      if (filters.exporta && filters.exporta !== 'all') {
        params.exporta = filters.exporta === 'si' ? 'Sí' : ''
      }

      const response = await api.getEmpresas(params)
      const empresasData = Array.isArray(response) ? response : (response.results || [])
      
      console.log('[Mapa] Total empresas recibidas:', empresasData.length)
      
      // Filtrar empresas con geolocalización válida y parsear coordenadas
      const empresasConCoords = empresasData
        .map((empresa: any) => {
          if (!empresa.geolocalizacion) {
            return null
          }
          
          try {
            const coords = empresa.geolocalizacion.split(',').map((c: string) => parseFloat(c.trim()))
            if (coords.length === 2 && !isNaN(coords[0]) && !isNaN(coords[1])) {
              return {
                ...empresa,
                lat: coords[0],
                lng: coords[1],
              }
            }
          } catch (error) {
            console.error('Error parsing coordinates for empresa:', empresa.id, error)
          }
          return null
        })
        .filter((e: Empresa | null) => e !== null) as Empresa[]
      
      console.log('[Mapa] Empresas con coordenadas válidas:', empresasConCoords.length)
      
      setAllEmpresas(empresasData) // Guardar todas para estadísticas
      setEmpresas(empresasConCoords)
      
      if (empresasConCoords.length > 0) {
        setSelectedEmpresa(empresasConCoords[0])
      } else {
        setSelectedEmpresa(null)
      }
    } catch (error) {
      console.error('Error loading empresas:', error)
      toast({
        title: "Error",
        description: "No se pudieron cargar las empresas",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }
  
  loadEmpresas()
}, [toast, filters, searchQuery])

  // Calcular empresas por departamento
useEffect(() => {
  if (empresas.length === 0) return
  
  // Función para normalizar nombres (quitar tildes y pasar a minúsculas)
  const normalizar = (str: string): string => {
    return str
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim()
  }
  
  const conteo: {[key: string]: number} = {}
  const mapeoNombres: {[key: string]: string} = {} // Para guardar el nombre original
  
  empresas.forEach(empresa => {
    const dept = empresa.departamento_nombre || 'Sin departamento'
    const deptNormalizado = normalizar(dept)
    conteo[deptNormalizado] = (conteo[deptNormalizado] || 0) + 1
    mapeoNombres[deptNormalizado] = dept // Guardar el nombre original
  })
  
  console.log('[Departamentos] Conteo por departamento:', conteo)
  console.log('[Departamentos] Nombres originales:', mapeoNombres)
  setEmpresasPorDepartamento(conteo)
}, [empresas])

  // Función para obtener color según cantidad de empresas
const getColorPorCantidad = (cantidad: number): string => {
  if (cantidad === 0) return '#e5e7eb'      // gris claro - sin empresas
  if (cantidad <= 5) return '#10b981'       // verde - pocas
  if (cantidad <= 20) return '#fbbf24'      // amarillo - moderado
  if (cantidad <= 40) return '#f97316'      // naranja - bastantes
  return '#ef4444'                          // rojo - muchas
}

  // Cargar y configurar el mapa
  useEffect(() => {
    if (loading || empresas.length === 0) return

    const loadMap = async () => {
      try {
        // Dynamically import Leaflet
        const leafletModule = await import("leaflet")
        const L = (leafletModule as any).default || leafletModule
        const heatModule = await import("leaflet.heat")

        if (!L || !L.map) {
          console.error('Leaflet no se pudo cargar correctamente')
          return
        }

        
// Cargar Leaflet CSS desde CDN
if (!document.querySelector('link[href*="leaflet.css"]')) {
  const link = document.createElement("link")
  link.rel = "stylesheet"
  link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
  link.crossOrigin = "anonymous"
  document.head.appendChild(link)
}
        // Fix default marker icon issue
        if (L.Icon && L.Icon.Default) {
          delete (L.Icon.Default.prototype as any)._getIconUrl
          L.Icon.Default.mergeOptions({
            iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
            iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
            shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
          })
        }

        // Wait a bit for CSS to load
        await new Promise(resolve => setTimeout(resolve, 100))

        // Initialize map
        const mapElement = document.getElementById("empresas-map")
        if (!mapElement) {
          console.error('Map element not found')
          return
        }

        // Verificar si el mapa ya está inicializado y limpiarlo
        if (map) {
          map.remove()
          setMap(null)
          setMarkers([])
        }

        // Limpiar cualquier instancia previa de Leaflet en el contenedor
        if ((mapElement as any)._leaflet_id) {
          delete (mapElement as any)._leaflet_id
        }

        // Centrar el mapa en Catamarca (San Fernando del Valle de Catamarca)
        const catamarcaCenter: [number, number] = [-28.2, -66.0]
        const mapInstance = L.map("empresas-map", {
  preferCanvas: false,
  dragging: true,
  touchZoom: true,
  scrollWheelZoom: true,
  doubleClickZoom: true,
  boxZoom: true,
  keyboard: true,
  tap: true,
  zoomControl: true
}).setView(catamarcaCenter, 8)

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        }).addTo(mapInstance)

        // Crear marcadores para cada empresa
        const newMarkers: any[] = []
        empresas.forEach((empresa) => {
          if (empresa.lat && empresa.lng) {
            console.log(`[Marker] Empresa: ${empresa.razon_social}, Tipo: "${empresa.tipo_empresa}"`)

            const markerColor = getCategoriaColor(empresa.categoria || '')
            const tipoInfo = getTipoEmpresaInfo(empresa.tipo_empresa || '')

            console.log('[Marker] tipoInfo:', tipoInfo)
            
// Actualiza la creación del customIcon:
const customIcon = L.divIcon({
  className: '',
  html: `
    <div style="
      background-color: ${markerColor}; 
      width: 30px; 
      height: 30px; 
      border-radius: ${tipoInfo.borderRadius}; 
      border: 2px solid white; 
      box-shadow: 0 2px 6px rgba(0,0,0,0.4);
      display: flex;
      align-items: center;
      justify-content: center;
      ${tipoInfo.shape === 'diamond' ? 'transform: rotate(45deg);' : ''}
    ">
      <div style="${tipoInfo.shape === 'diamond' ? 'transform: rotate(-45deg);' : ''}">
        ${tipoInfo.iconSvg}
      </div>
    </div>
  `,
  iconSize: [30, 30],
  iconAnchor: [15, 15],
  popupAnchor: [0, -15],
})

            const tipoEmpresaTexto = empresa.tipo_empresa === 'producto' 
              ? 'Productos' 
              : empresa.tipo_empresa === 'servicio' 
                ? 'Servicios' 
                : empresa.tipo_empresa === 'mixta'
                  ? 'Productos y Servicios'
                  : ''

            const marker = L.marker([empresa.lat, empresa.lng], { icon: customIcon })
              .addTo(mapInstance)
              .bindPopup(`
                <div style="min-width: 200px;">
                  <h3 style="font-weight: bold; margin-bottom: 8px;">${empresa.razon_social}</h3>
                  ${tipoEmpresaTexto ? `<p style="margin: 4px 0;"><strong>Tipo:</strong> ${tipoEmpresaTexto}</p>` : ''}
                  ${empresa.categoria ? `<p style="margin: 4px 0;"><strong>Categoría:</strong> ${empresa.categoria}</p>` : ''}
                  ${empresa.rubro_nombre ? `<p style="margin: 4px 0;"><strong>Rubro:</strong> ${empresa.rubro_nombre}</p>` : ''}
                  ${empresa.departamento_nombre ? `<p style="margin: 4px 0;"><strong>Ubicación:</strong> ${empresa.departamento_nombre}${empresa.localidad_nombre ? `, ${empresa.localidad_nombre}` : ''}</p>` : ''}
                  <a href="/dashboard/empresas/${empresa.id}" style="color: #3259B5; text-decoration: underline; margin-top: 8px; display: inline-block;">Ver detalles</a>
                </div>
              `)
            
            marker.on('click', () => {
              setSelectedEmpresa(empresa)
            })

            newMarkers.push(marker)
          }
        })

setMap(mapInstance)
setMarkers(newMarkers)
setMapLoaded(true)

      } catch (error) {
        console.error('Error loading map:', error)
        toast({
          title: "Error",
          description: "No se pudo cargar el mapa",
          variant: "destructive",
        })
      }
    }

    loadMap()

    return () => {
      // Cleanup: remover mapa y marcadores
      const currentMap = map
      const currentMarkers = markers
      
      if (currentMap) {
        try {
          currentMap.remove()
        } catch (e) {
          console.warn('Error removing map:', e)
        }
        setMap(null)
      }
      
      if (currentMarkers && currentMarkers.length > 0) {
        currentMarkers.forEach(marker => {
          try {
            if (marker && typeof marker.remove === 'function') {
              marker.remove()
            }
          } catch (e) {
            console.warn('Error removing marker:', e)
          }
        })
        setMarkers([])
      }
      
      // Limpiar el contenedor del mapa
      const mapElement = document.getElementById("empresas-map")
      if (mapElement && (mapElement as any)._leaflet_id) {
        delete (mapElement as any)._leaflet_id
      }
    }
  }, [loading, empresas, toast])

  // Actualizar capa de departamentos cuando cambie el conteo
useEffect(() => {
  if (!map || Object.keys(empresasPorDepartamento).length === 0) return

  const updateDepartamentosLayer = async () => {
    try {
      const leafletModule = await import("leaflet")
      const L = (leafletModule as any).default || leafletModule

      const response = await fetch('/catamarca_departamentos.geojson')
      const geojsonData = await response.json()
      
      console.log('[GeoJSON Update] Actualizando capa con conteo:', empresasPorDepartamento)
      
      // Si ya existe una capa, removerla
      if (departamentosLayer) {
        map.removeLayer(departamentosLayer)
      }
      
      // Crear nueva capa de polígonos con colores según cantidad
      const deptLayer = L.geoJSON(geojsonData, {
        style: (feature: any) => {
          const nombreDept = feature.properties.nombre
          const nombreNormalizado = nombreDept
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .trim()
          
          const cantidad = empresasPorDepartamento[nombreNormalizado] || 0
          const color = getColorPorCantidad(cantidad)
          
          console.log(`[GeoJSON] Dept: ${nombreDept} -> Normalizado: ${nombreNormalizado} -> Cantidad: ${cantidad}`)
          
          return {
            fillColor: color,
            weight: 2,
            opacity: 1,
            color: '#ffffff',
            fillOpacity: 0.7
          }
        },
        onEachFeature: (feature: any, layer: any) => {
          const nombreDept = feature.properties.nombre
          const nombreNormalizado = nombreDept
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .trim()
          const cantidad = empresasPorDepartamento[nombreNormalizado] || 0
          
          layer.bindPopup(`
            <div style="min-width: 150px;">
              <h3 style="font-weight: bold; margin-bottom: 8px;">${nombreDept}</h3>
              <p style="margin: 4px 0;"><strong>Empresas:</strong> ${cantidad}</p>
            </div>
          `)
          
          layer.on('mouseover', function(e: any) {
            const layer = e.target
            layer.setStyle({
              weight: 3,
              fillOpacity: 0.9
            })
          })
          
          layer.on('mouseout', function(e: any) {
            deptLayer.resetStyle(e.target)
          })
        }
      })
      
      setDepartamentosLayer(deptLayer)
      console.log('[GeoJSON Update] Capa de departamentos actualizada')
    } catch (error) {
      console.error('[GeoJSON Update] Error actualizando departamentos:', error)
    }
  }

  updateDepartamentosLayer()
}, [map, empresasPorDepartamento])

  const toggleHeatmap = () => {
  console.log('[Toggle] Map:', !!map)
  console.log('[Toggle] DepartamentosLayer:', !!departamentosLayer)
  console.log('[Toggle] ShowHeatmap actual:', showHeatmap)
  
  if (!map || !departamentosLayer) {
    console.log('[Toggle] No hay map o departamentosLayer, abortando')
    return
  }
  
  if (showHeatmap) {
    console.log('[Toggle] Removiendo mapa de calor y mostrando markers')
    map.removeLayer(departamentosLayer)
    markers.forEach(marker => marker.addTo(map))
    setShowHeatmap(false)
  } else {
    console.log('[Toggle] Removiendo markers y mostrando mapa de calor')
    markers.forEach(marker => map.removeLayer(marker))
    departamentosLayer.addTo(map)
    setShowHeatmap(true)
  }
}

const exportarMapaCompleto = async (formato: 'png' | 'pdf') => {
  if (!map) return
  
  setExportingMap(true)
  
  try {
    const domtoimage = (await import('dom-to-image-more')).default
    const jsPDF = formato === 'pdf' ? (await import('jspdf')).default : null
    const leafletModule = await import("leaflet")
    const L = (leafletModule as any).default || leafletModule
    
    // Crear un div temporal para el mapa de exportación
    const exportDiv = document.createElement('div')
    exportDiv.id = 'export-map'
    exportDiv.style.width = '1200px'
    exportDiv.style.height = '1400px'  // Más alto porque Catamarca es vertical
    exportDiv.style.position = 'absolute'
    exportDiv.style.left = '-99999px'
    exportDiv.style.top = '0'
    exportDiv.style.zIndex = '-1'
    exportDiv.style.backgroundColor = '#f8f9fa'  // Fondo gris claro
    document.body.appendChild(exportDiv)

// Agregar estilos para eliminar recuadros
const styleOverride = document.createElement('style')
styleOverride.id = 'export-map-override'
styleOverride.textContent = `
  #export-map * {
    box-sizing: border-box;
  }
  #export-map .leaflet-marker-icon {
    background: none !important;
    border: none !important;
    margin: 0 !important;
    padding: 0 !important;
  }
  #export-map .leaflet-div-icon {
    background: transparent !important;
    border: none !important;
  }
  #export-map .leaflet-marker-pane * {
    background: transparent !important;
    border: none !important;
  }
  #export-map .leaflet-overlay-pane * {
    background: transparent !important;
  }
  #export-map [class*="leaflet"] {
    background: transparent !important;
    border: none !important;
  }
`
document.head.appendChild(styleOverride)
    
    // Bounds precisos de SOLO Catamarca
    const catamarcaBounds: [[number, number], [number, number]] = [
      [-29.2, -67.8],  // Suroeste
      [-25.2, -64.5]   // Noreste
    ]
    

    const exportMap = L.map(exportDiv, {
      zoomControl: false,
      attributionControl: false,
      dragging: false,
      touchZoom: false,
      scrollWheelZoom: false,
      doubleClickZoom: false,
      boxZoom: false,
      keyboard: false,
      tap: false
    })
    
    // Ajustar vista a Catamarca
    exportMap.fitBounds(catamarcaBounds, { 
      padding: [50, 50]
    })
    
    // Forzar que el mapa calcule su tamaño
    exportMap.invalidateSize()
    
    // Esperar a que se ajuste la vista
    await new Promise(resolve => setTimeout(resolve, 300))
    
    // Cargar GeoJSON de departamentos de Catamarca
    const response = await fetch('/catamarca_departamentos.geojson')
    const geojsonData = await response.json()
    
    if (showHeatmap) {
      // Modo heatmap: mostrar departamentos con colores
      L.geoJSON(geojsonData, {
        style: (feature: any) => {
          const nombreDept = feature.properties.nombre
          const nombreNormalizado = nombreDept
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .trim()
          
          const cantidad = empresasPorDepartamento[nombreNormalizado] || 0
          const color = getColorPorCantidad(cantidad)
          
          return {
            fillColor: color,
            weight: 2,
            opacity: 1,
            color: '#ffffff',
            fillOpacity: 0.8
          }
        },
        onEachFeature: (feature: any, layer: any) => {
          // Agregar etiquetas de departamentos
          const nombreDept = feature.properties.nombre
          const nombreNormalizado = nombreDept
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .trim()
          const cantidad = empresasPorDepartamento[nombreNormalizado] || 0
          
          const bounds = layer.getBounds()
          const center = bounds.getCenter()
          
          const label = L.marker(center, {
            icon: L.divIcon({
              className: 'dept-label',
              html: `
                <div style="
                  background: rgba(255, 255, 255, 0.9);
                  padding: 4px 8px;
                  border-radius: 4px;
                  font-size: 11px;
                  font-weight: 600;
                  color: #222A59;
                  box-shadow: 0 1px 3px rgba(0,0,0,0.2);
                  white-space: nowrap;
                  text-align: center;
                  border: 1px solid #ddd;
                ">
                  ${nombreDept}<br/>
                  <span style="font-size: 10px; color: #666;">${cantidad} emp.</span>
                </div>
              `,
              iconSize: [0, 0],
              iconAnchor: [0, 0]
            })
          })
          label.addTo(exportMap)
        }
      }).addTo(exportMap)
    } else {
      // Modo marcadores: mostrar solo bordes de departamentos
      L.geoJSON(geojsonData, {
        style: {
          fillColor: '#ffffff',
          weight: 2,
          opacity: 0.6,
          color: '#94a3b8',
          fillOpacity: 0.3
        }
      }).addTo(exportMap)
      
      // Agregar todos los marcadores de empresas
      empresas.forEach((empresa) => {
        if (empresa.lat && empresa.lng) {
          const markerColor = getCategoriaColor(empresa.categoria || '')
          const tipoInfo = getTipoEmpresaInfo(empresa.tipo_empresa || '')
          
const customIcon = L.divIcon({
  className: '',
  html: `
    <div style="
      background-color: ${markerColor}; 
      width: 20px;
      height: 20px;
      border-radius: ${tipoInfo.borderRadius}; 
      border: 2px solid white; 
      box-shadow: 0 2px 6px rgba(0,0,0,0.4);
      display: flex;
      align-items: center;
      justify-content: center;
      position: absolute;
      left: -10px;
      top: -10px;
      ${tipoInfo.shape === 'diamond' ? 'transform: rotate(45deg);' : ''}
    ">
      <div style="${tipoInfo.shape === 'diamond' ? 'transform: rotate(-45deg);' : ''}">
        ${tipoInfo.iconSvg.replace('width="14" height="14"', 'width="11" height="11"')}
      </div>
    </div>
  `,
  iconSize: [0, 0],
  iconAnchor: [0, 0],
})
          
          L.marker([empresa.lat, empresa.lng], { icon: customIcon }).addTo(exportMap)
        }
      })
    }
    
    // Agregar título y información de filtros
const titleDiv = document.createElement('div')
titleDiv.style.cssText = `
  position: absolute;
  top: 20px;
  right: 20px;
  background: white;
  padding: 18px 24px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.15);
  z-index: 1000;
  width: 320px;
`

// Construir información de filtros aplicados
const filtrosAplicados = []
if (filters.tipo_empresa && filters.tipo_empresa !== 'all') {
  const tipoTexto = filters.tipo_empresa === 'producto' ? 'Productos' : 
                    filters.tipo_empresa === 'servicio' ? 'Servicios' : 'Mixtas'
  filtrosAplicados.push(`Tipo: ${tipoTexto}`)
}
if (filters.rubro && filters.rubro !== 'all') {
  // Aquí podrías obtener el nombre del rubro si lo tienes disponible
  filtrosAplicados.push(`Rubro aplicado`)
}
if (filters.subRubro && filters.subRubro !== 'all') {
  filtrosAplicados.push(`Subrubro aplicado`)
}
if (filters.categoria_matriz && filters.categoria_matriz !== 'all') {
  const catTexto = filters.categoria_matriz === 'exportadora' ? 'Exportadora' :
                   filters.categoria_matriz === 'potencial_exportadora' ? 'Potencial Exportadora' : 'Etapa Inicial'
  filtrosAplicados.push(`Categoría: ${catTexto}`)
}
if (filters.exporta && filters.exporta !== 'all') {
  filtrosAplicados.push(filters.exporta === 'si' ? 'Solo exportadoras' : 'No exportadoras')
}
if (searchQuery) {
  filtrosAplicados.push(`Búsqueda: "${searchQuery}"`)
}

const filtrosHtml = filtrosAplicados.length > 0 ? `
  <div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid #e5e7eb;">
    <div style="font-size: 12px; font-weight: 600; color: #6b7280; margin-bottom: 6px;">
      FILTROS APLICADOS
    </div>
    <div style="display: flex; flex-direction: column; gap: 3px;">
      ${filtrosAplicados.map(filtro => `
        <div style="font-size: 11px; color: #374151;">• ${filtro}</div>
      `).join('')}
    </div>
  </div>
` : ''

const legendHtml = showHeatmap ? `
  <div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid #e5e7eb;">
    <div style="font-size: 12px; font-weight: 600; color: #6b7280; margin-bottom: 10px;">DENSIDAD DE EMPRESAS</div>
    <div style="display: flex; flex-direction: column; gap: 8px;">
      <div style="display: flex; align-items: center; gap: 8px;">
        <div style="width: 18px; height: 18px; border-radius: 3px; background: #10b981; flex-shrink: 0;"></div>
        <span style="font-size: 13px; color: #374151;">Baja</span>
      </div>
      <div style="display: flex; align-items: center; gap: 8px;">
        <div style="width: 18px; height: 18px; border-radius: 3px; background: #fbbf24; flex-shrink: 0;"></div>
        <span style="font-size: 13px; color: #374151;">Media</span>
      </div>
      <div style="display: flex; align-items: center; gap: 8px;">
        <div style="width: 18px; height: 18px; border-radius: 3px; background: #f97316; flex-shrink: 0;"></div>
        <span style="font-size: 13px; color: #374151;">Alta</span>
      </div>
      <div style="display: flex; align-items: center; gap: 8px;">
        <div style="width: 18px; height: 18px; border-radius: 3px; background: #ef4444; flex-shrink: 0;"></div>
        <span style="font-size: 13px; color: #374151; white-space: nowrap;">Muy Alta</span>
      </div>
    </div>
  </div>
` : `
  <div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid #e5e7eb;">
    <div style="font-size: 12px; font-weight: 600; color: #6b7280; margin-bottom: 8px;">TIPOS DE EMPRESA</div>
    <div style="display: flex; gap: 12px; flex-wrap: wrap;">
      <div style="display: flex; align-items: center; gap: 5px;">
        <div style="width: 16px; height: 16px; background: #3259B5; border-radius: 3px; border: 2px solid white; box-shadow: 0 1px 3px rgba(0,0,0,0.3);"></div>
        <span style="font-size: 11px; color: #6b7280;">Productos</span>
      </div>
      <div style="display: flex; align-items: center; gap: 5px;">
        <div style="width: 16px; height: 16px; background: #3259B5; border-radius: 50%; border: 2px solid white; box-shadow: 0 1px 3px rgba(0,0,0,0.3);"></div>
        <span style="font-size: 11px; color: #6b7280;">Servicios</span>
      </div>
      <div style="display: flex; align-items: center; gap: 5px;">
        <div style="width: 16px; height: 16px; background: #3259B5; border: 2px solid white; box-shadow: 0 1px 3px rgba(0,0,0,0.3); transform: rotate(45deg);"></div>
        <span style="font-size: 11px; color: #6b7280;">Mixta</span>
      </div>
    </div>
  </div>
`

titleDiv.innerHTML = `
  <div style="font-size: 20px; font-weight: 700; color: #222A59; margin-bottom: 4px;">
    Mapa de Empresas
  </div>
  <div style="font-size: 14px; color: #6b7280; margin-bottom: 2px;">
    Provincia de Catamarca
  </div>
  <div style="font-size: 12px; color: #9ca3af;">
    ${empresas.length} empresa${empresas.length !== 1 ? 's' : ''} ${filtrosAplicados.length > 0 ? 'filtradas' : 'registradas'}
  </div>
  ${filtrosHtml}
  ${legendHtml}
`
    
    exportDiv.appendChild(titleDiv)
    
    // Esperar que todo se renderice
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Capturar la imagen
    const dataUrl = await domtoimage.toPng(exportDiv, {
      quality: 1,
      bgcolor: '#f8f9fa',
      width: 1200,
      height: 1400,
      cacheBust: true,
      skipFonts: true,
      filter: (node: any) => {
        if (node.className && typeof node.className === 'string') {
          return !node.className.includes('leaflet-control')
        }
        return true
      }
    })
    
    // Limpiar
    exportMap.remove()
    document.body.removeChild(exportDiv)
    
    if (formato === 'png') {
      const link = document.createElement('a')
      link.download = `mapa-catamarca-${showHeatmap ? 'densidad' : 'empresas'}-${new Date().toISOString().split('T')[0]}.png`
      link.href = dataUrl
      link.click()
    } else if (jsPDF) {
      const img = new Image()
      img.src = dataUrl
      
      img.onload = () => {
        const pdf = new jsPDF({
          orientation: 'portrait',
          unit: 'mm',
          format: 'a4'
        })
        
        const pageWidth = pdf.internal.pageSize.getWidth()
        const pageHeight = pdf.internal.pageSize.getHeight()
        const imgAspectRatio = img.width / img.height
        
        let finalWidth = pageWidth - 20
        let finalHeight = finalWidth / imgAspectRatio
        
        if (finalHeight > pageHeight - 20) {
          finalHeight = pageHeight - 20
          finalWidth = finalHeight * imgAspectRatio
        }
        
        const xOffset = (pageWidth - finalWidth) / 2
        const yOffset = 10
        
        pdf.addImage(dataUrl, 'PNG', xOffset, yOffset, finalWidth, finalHeight)
        pdf.save(`mapa-catamarca-${showHeatmap ? 'densidad' : 'empresas'}-${new Date().toISOString().split('T')[0]}.pdf`)
      }
    }
    
    toast({
      title: "Éxito",
      description: `Mapa de Catamarca exportado como ${formato.toUpperCase()}`,
    })
  } catch (error) {
    console.error('Error exportando mapa:', error)
    toast({
      title: "Error",
      description: "No se pudo exportar el mapa. Intenta de nuevo.",
      variant: "destructive",
    })
  } finally {
// Limpiar el style override si existe
  const styleOverride = document.getElementById('export-map-override')
  if (styleOverride) {
    document.head.removeChild(styleOverride)
  }
  setExportingMap(false)
}
}

// Función para exportar polígono de un departamento
const exportarDepartamento = async (nombreDepartamento: string) => {
  if (!map) return
  
  setExportingDept(true)
  
  try {
    const domtoimage = (await import('dom-to-image-more')).default
    const leafletModule = await import("leaflet")
    const L = (leafletModule as any).default || leafletModule
    
    // Buscar el feature del departamento en el GeoJSON
    const response = await fetch('/catamarca_departamentos.geojson')
    const geojsonData = await response.json()
    
    let targetFeature: any = null
    
    geojsonData.features.forEach((feature: any) => {
      if (feature.properties.nombre === nombreDepartamento) {
        targetFeature = feature
      }
    })
    
    if (!targetFeature) {
      throw new Error("Departamento no encontrado en GeoJSON")
    }
    
    // Crear un div temporal para el mapa de exportación
    const exportDiv = document.createElement('div')
    exportDiv.id = 'export-dept-map'
    exportDiv.style.width = '900px'
    exportDiv.style.height = '900px'
    exportDiv.style.position = 'absolute'
    exportDiv.style.left = '-99999px'
    exportDiv.style.top = '0'
    exportDiv.style.zIndex = '-1'
    exportDiv.style.backgroundColor = '#f8f9fa'  // Fondo gris claro
    document.body.appendChild(exportDiv)



// AGREGAR ESTO: Inyectar estilos para eliminar recuadros
const styleOverride = document.createElement('style')
styleOverride.id = 'export-dept-override'
styleOverride.textContent = `
  #export-dept-map * {
    box-sizing: border-box;
  }
  #export-dept-map .leaflet-marker-icon {
    background: none !important;
    border: none !important;
    margin: 0 !important;
    padding: 0 !important;
  }
  #export-dept-map .leaflet-div-icon {
    background: transparent !important;
    border: none !important;
  }
  #export-dept-map .leaflet-marker-pane * {
    background: transparent !important;
    border: none !important;
  }
  #export-dept-map .leaflet-overlay-pane * {
    background: transparent !important;
  }
  /* Eliminar cualquier borde/sombra no deseado */
  #export-dept-map [class*="leaflet"] {
    background: transparent !important;
    border: none !important;
  }
`
document.head.appendChild(styleOverride)
    
    // Crear mapa temporal SIN capa base
    const tempMap = L.map(exportDiv, {
      zoomControl: false,
      attributionControl: false,
      dragging: false,
      touchZoom: false,
      scrollWheelZoom: false,
      doubleClickZoom: false,
      boxZoom: false,
      keyboard: false,
      tap: false
    })
    
    // Normalizar nombre para buscar cantidad de empresas
    const nombreNormalizado = nombreDepartamento
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim()
    
    const cantidad = empresasPorDepartamento[nombreNormalizado] || 0
    const color = getColorPorCantidad(cantidad)
    
    // Agregar el polígono del departamento
    const deptGeoJSON = L.geoJSON(targetFeature, {
      style: {
        fillColor: color,
        weight: 3,
        opacity: 1,
        color: '#222A59',
        fillOpacity: 0.7
      }
    }).addTo(tempMap)
    
    // Ajustar vista al departamento con padding
    tempMap.fitBounds(deptGeoJSON.getBounds(), { 
      padding: [80, 80]
    })
    
    // Forzar tamaño
    tempMap.invalidateSize()
    
    // Esperar ajuste de vista
    await new Promise(resolve => setTimeout(resolve, 300))
    
    // Filtrar empresas de este departamento
    const empresasDept = empresas.filter(e => e.departamento_nombre === nombreDepartamento)
    
    // Agregar marcadores de empresas
empresasDept.forEach((empresa) => {
  if (empresa.lat && empresa.lng) {
    const markerColor = getCategoriaColor(empresa.categoria || '')
    const tipoInfo = getTipoEmpresaInfo(empresa.tipo_empresa || '')
    
    const customIcon = L.divIcon({
      className: '',  // ← VACÍO
      html: `
        <div style="
          background-color: ${markerColor}; 
          width: 20px;
          height: 20px;
          border-radius: ${tipoInfo.borderRadius}; 
          border: 2px solid white; 
          box-shadow: 0 2px 6px rgba(0,0,0,0.4);
          display: flex;
          align-items: center;
          justify-content: center;
          position: absolute;
          left: -10px;
          top: -10px;
          ${tipoInfo.shape === 'diamond' ? 'transform: rotate(45deg);' : ''}
        ">
          <div style="${tipoInfo.shape === 'diamond' ? 'transform: rotate(-45deg);' : ''}">
            ${tipoInfo.iconSvg.replace('width="16" height="16"', 'width="11" height="11"').replace('width="14" height="14"', 'width="11" height="11"')}
          </div>
        </div>
      `,
      iconSize: [0, 0],      // ← IMPORTANTE: [0, 0]
      iconAnchor: [0, 0],    // ← IMPORTANTE: [0, 0]
    })
    
    L.marker([empresa.lat, empresa.lng], { icon: customIcon }).addTo(tempMap)
  }
})
    
    // Contar empresas por categoría
    const categorias = {
      'Exportadora': empresasDept.filter(e => e.categoria === 'Exportadora').length,
      'Potencial Exportadora': empresasDept.filter(e => e.categoria === 'Potencial Exportadora').length,
      'Etapa Inicial': empresasDept.filter(e => e.categoria === 'Etapa Inicial').length,
    }
    
 // Agregar título, información y leyenda
const infoDiv = document.createElement('div')
infoDiv.style.cssText = `
  position: absolute;
  top: 20px;
  right: 20px;
  background: white;
  padding: 18px 24px;
  border-radius: 10px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  z-index: 1000;
  width: 320px;
`

// Construir información de filtros aplicados
const filtrosAplicados = []
if (filters.tipo_empresa && filters.tipo_empresa !== 'all') {
  const tipoTexto = filters.tipo_empresa === 'producto' ? 'Productos' : 
                    filters.tipo_empresa === 'servicio' ? 'Servicios' : 'Mixtas'
  filtrosAplicados.push(`Tipo: ${tipoTexto}`)
}
if (filters.rubro && filters.rubro !== 'all') {
  filtrosAplicados.push(`Rubro aplicado`)
}
if (filters.subRubro && filters.subRubro !== 'all') {
  filtrosAplicados.push(`Subrubro aplicado`)
}
if (filters.categoria_matriz && filters.categoria_matriz !== 'all') {
  const catTexto = filters.categoria_matriz === 'exportadora' ? 'Exportadora' :
                   filters.categoria_matriz === 'potencial_exportadora' ? 'Potencial Exportadora' : 'Etapa Inicial'
  filtrosAplicados.push(`Categoría: ${catTexto}`)
}
if (filters.exporta && filters.exporta !== 'all') {
  filtrosAplicados.push(filters.exporta === 'si' ? 'Solo exportadoras' : 'No exportadoras')
}
if (searchQuery) {
  filtrosAplicados.push(`Búsqueda: "${searchQuery}"`)
}

const filtrosHtml = filtrosAplicados.length > 0 ? `
  <div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid #e5e7eb;">
    <div style="font-size: 12px; font-weight: 600; color: #6b7280; margin-bottom: 6px;">
      FILTROS APLICADOS
    </div>
    <div style="display: flex; flex-direction: column; gap: 3px;">
      ${filtrosAplicados.map(filtro => `
        <div style="font-size: 11px; color: #374151;">• ${filtro}</div>
      `).join('')}
    </div>
  </div>
` : ''

infoDiv.innerHTML = `
  <div style="font-size: 20px; font-weight: 700; color: #222A59; margin-bottom: 6px;">
    ${nombreDepartamento}
  </div>
  <div style="font-size: 13px; color: #6b7280; margin-bottom: 3px;">
    Departamento - Catamarca
  </div>
  <div style="font-size: 12px; color: #9ca3af; margin-bottom: 12px;">
    ${empresasDept.length} empresa${empresasDept.length !== 1 ? 's' : ''} ${filtrosAplicados.length > 0 ? 'filtradas' : 'registradas'}
  </div>
  
  ${filtrosHtml}
  
  <div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid #e5e7eb;">
    <div style="font-size: 12px; font-weight: 600; color: #6b7280; margin-bottom: 8px;">
      TIPOS DE EMPRESA
    </div>
    <div style="display: flex; flex-direction: column; gap: 6px;">
      <div style="display: flex; align-items: center; gap: 8px;">
        <div style="width: 18px; height: 18px; background: #3259B5; border-radius: 3px; border: 2px solid white; box-shadow: 0 1px 3px rgba(0,0,0,0.3); flex-shrink: 0;"></div>
        <span style="font-size: 13px; color: #6b7280;">Productos</span>
      </div>
      <div style="display: flex; align-items: center; gap: 8px;">
        <div style="width: 18px; height: 18px; background: #3259B5; border-radius: 50%; border: 2px solid white; box-shadow: 0 1px 3px rgba(0,0,0,0.3); flex-shrink: 0;"></div>
        <span style="font-size: 13px; color: #6b7280;">Servicios</span>
      </div>
      <div style="display: flex; align-items: center; gap: 8px;">
        <div style="width: 18px; height: 18px; background: #3259B5; border: 2px solid white; box-shadow: 0 1px 3px rgba(0,0,0,0.3); transform: rotate(45deg); flex-shrink: 0;"></div>
        <span style="font-size: 13px; color: #6b7280;">Mixta</span>
      </div>
    </div>
  </div>
`
    
    exportDiv.appendChild(infoDiv)
    
    // Agregar etiqueta del nombre del departamento en el centro del polígono
    const bounds = deptGeoJSON.getBounds()
    const center = bounds.getCenter()
    
    // NO crear el centerLabel como marker, sino como un div HTML puro
const centerLabelDiv = document.createElement('div')
centerLabelDiv.style.cssText = `
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  background: rgba(34, 42, 89, 0.15);
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 24px;
  font-weight: 700;
  color: rgba(34, 42, 89, 0.4);
  text-align: center;
  pointer-events: none;
  white-space: nowrap;
  text-transform: uppercase;
  letter-spacing: 1px;
  z-index: 500;
`
//centerLabelDiv.textContent = nombreDepartamento
//exportDiv.appendChild(centerLabelDiv)
    
    // Esperar renderización completa
    await new Promise(resolve => setTimeout(resolve, 800))
    
    // Capturar como imagen
    const dataUrl = await domtoimage.toPng(exportDiv, {
  quality: 1,
  bgcolor: '#f8f9fa',
  width: 900,  // o 1200/1400 según la función
  height: 900, // o 1400 según la función
  cacheBust: true,
  skipFonts: true,
  imagePlaceholder: undefined,
  filter: (node: any) => {
    // Filtrar controles de Leaflet
    if (node.className && typeof node.className === 'string') {
      if (node.className.includes('leaflet-control')) return false
    }
    // Filtrar elementos con recursos externos
    if (node.tagName === 'LINK' && node.href?.includes('_next')) return false
    if (node.tagName === 'STYLE' && node.textContent?.includes('@font-face')) return false
    return true
  },
  onclone: (clonedDoc: any) => {
    // Remover todas las referencias a fuentes en el documento clonado
    const styles = clonedDoc.querySelectorAll('style')
    styles.forEach((style: any) => {
      if (style.textContent?.includes('@font-face')) {
        style.textContent = style.textContent.replace(/@font-face[^}]+}/g, '')
      }
    })
    return clonedDoc
  }
})
    
    // Descargar
    const link = document.createElement('a')
    link.download = `departamento-${nombreDepartamento.toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.png`
    link.href = dataUrl
    link.click()
    
    // Limpiar
    tempMap.remove()
    document.body.removeChild(exportDiv)
    
    toast({
      title: "Éxito",
      description: `Departamento "${nombreDepartamento}" exportado con ${empresasDept.length} empresa${empresasDept.length !== 1 ? 's' : ''}`,
    })
  } catch (error) {
    console.error('Error exportando departamento:', error)
    toast({
      title: "Error",
      description: "No se pudo exportar el departamento",
      variant: "destructive",
    })
  } finally {
    // Limpiar el style override si existe
  const styleOverride = document.getElementById('export-dept-override')
  if (styleOverride) {
    document.head.removeChild(styleOverride)
  }
  setExportingDept(false)
}
}

  const getCategoriaColor = (categoria: string): string => {
    switch (categoria) {
      case "Exportadora":
        return "#C3C840"
      case "Potencial Exportadora":
        return "#F59E0B"
      case "Etapa Inicial":
        return "#629BD2"
      default:
        return "#6B7280"
    }
  }

  const getTipoEmpresaInfo = (tipo: string): { iconSvg: string; shape: string; borderRadius: string } => {
  const icons = {
    producto: '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M16.5 9.4 7.55 4.24"></path><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.29 7 12 12 20.71 7"></polyline><line x1="12" x2="12" y1="22" y2="12"></line></svg>',
    servicio: '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path></svg>',
    mixta: '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect width="16" height="20" x="4" y="2" rx="2" ry="2"></rect><path d="M9 22v-4h6v4"></path><path d="M8 6h.01"></path><path d="M16 6h.01"></path><path d="M12 6h.01"></path><path d="M12 10h.01"></path><path d="M12 14h.01"></path><path d="M16 10h.01"></path><path d="M16 14h.01"></path><path d="M8 10h.01"></path><path d="M8 14h.01"></path></svg>',
    default: '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path><circle cx="12" cy="10" r="3"></circle></svg>'
  }

  switch (tipo) {
    case "producto":
      return { 
        iconSvg: icons.producto,
        shape: "square",
        borderRadius: "4px"  // Cambiar de 3px a 4px para que sea más cuadrado
      }
    case "servicio":
      return { 
        iconSvg: icons.servicio,
        shape: "circle",
        borderRadius: "50%"
      }
    case "mixta":
      return { 
        iconSvg: icons.mixta,
        shape: "diamond",
        borderRadius: "4px"  // Cambiar de 3px a 4px
      }
    default:
      return { 
        iconSvg: icons.default,
        shape: "circle",
        borderRadius: "50%"
      }
  }
}

  const getCategoriaBadgeColor = (categoria: string) => {
    switch (categoria) {
      case "Exportadora":
        return "bg-[#C3C840] text-[#222A59]"
      case "Potencial Exportadora":
        return "bg-[#F59E0B] text-white"
      case "Etapa Inicial":
        return "bg-[#629BD2] text-white"
      default:
        return "bg-gray-500 text-white"
    }
  }

  const handleFilterChange = (newFilters: any) => {
  setFilters({ ...filters, ...newFilters })
}

const handleClearFilters = () => {
  setFilters({})
  setSearchQuery("")
}

const handleSearchChange = (value: string) => {
  setSearchQuery(value)
}

  return (
    <MainLayout>
      <div className="space-y-4 md:space-y-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-[#222A59]">Mapa de Empresas</h1>
          <p className="text-sm md:text-base text-muted-foreground mt-1 md:mt-2">
            Visualiza la ubicación geográfica de las empresas exportadoras
          </p>
        </div>

        {/* AGREGAR AQUÍ - Barra de búsqueda y filtros */}
<div className="flex flex-col sm:flex-row gap-3">
  <div className="flex-1 relative">
    {searchQuery && (
      <button
        onClick={() => handleSearchChange("")}
        className="absolute right-3 top-1/2 transform -translate-y-1/2"
      >
        <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
      </button>
    )}
  </div>
  <FiltersDropdown 
    onFilterChange={handleFilterChange} 
    onClearFilters={handleClearFilters}
    filters={filters}
  />
  <div className="text-sm text-muted-foreground flex items-center">
    Mostrando {empresas.length} de {allEmpresas.length} empresas
  </div>
</div>


        {loading ? (
          <Card>
            <CardContent className="flex items-center justify-center h-[400px]">
              <div className="text-center space-y-4">
                <Loader2 className="h-8 w-8 animate-spin text-[#3259B5] mx-auto" />
                <p className="text-muted-foreground">Cargando empresas...</p>
              </div>
            </CardContent>
          </Card>
        ) : empresas.length === 0 ? (
          <Card>
            <CardContent className="flex items-center justify-center h-[400px]">
              <div className="text-center space-y-4">
                <MapPin className="h-12 w-12 text-muted-foreground mx-auto" />
                <p className="text-muted-foreground">No hay empresas con geolocalización disponible</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-2">
<CardHeader>
  <div className="space-y-3">
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
  <div>
    <CardTitle className="text-[#222A59]">Mapa Interactivo</CardTitle>
    <CardDescription>
      {empresas.length} empresa{empresas.length !== 1 ? 's' : ''} con ubicación geográfica
    </CardDescription>
  </div>
  <div className="flex flex-wrap gap-2">
    <Button
      variant={showHeatmap ? "default" : "outline"}
      size="sm"
      onClick={toggleHeatmap}
      disabled={!mapLoaded}
      className={showHeatmap ? "bg-[#3259B5]" : ""}
    >
      {showHeatmap ? <MapPinned className="h-4 w-4 mr-2" /> : <Flame className="h-4 w-4 mr-2" />}
      {showHeatmap ? "Ver Marcadores" : "Ver Mapa de Calor"}
    </Button>
    
    {/* Botones de exportación */}
    <Button
      variant="outline"
      size="sm"
      onClick={() => exportarMapaCompleto('png')}
      disabled={!mapLoaded || exportingMap}
    >
      {exportingMap ? (
        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
      ) : (
        <FileImage className="h-4 w-4 mr-2" />
      )}
      Exportar PNG
    </Button>
    
    <Button
      variant="outline"
      size="sm"
      onClick={() => exportarMapaCompleto('pdf')}
      disabled={!mapLoaded || exportingMap}
    >
      {exportingMap ? (
        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
      ) : (
        <FileDown className="h-4 w-4 mr-2" />
      )}
      Exportar PDF
    </Button>
  </div>
</div>
    
    {/* Leyenda horizontal compacta */}
    {showHeatmap && (
      <div className="hidden lg:flex items-center gap-4 text-xs bg-muted/50 px-4 py-2 rounded-md">
        <span className="font-semibold text-[#222A59]">Densidad:</span>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded" style={{ backgroundColor: '#10b981' }} />
          <span className="text-muted-foreground">Baja</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded" style={{ backgroundColor: '#fbbf24' }} />
          <span className="text-muted-foreground">Media</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded" style={{ backgroundColor: '#f97316' }} />
          <span className="text-muted-foreground">Alta</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded" style={{ backgroundColor: '#ef4444' }} />
          <span className="text-muted-foreground">Muy Alta</span>
        </div>
      </div>
    )}
  </div>
</CardHeader>
                <CardContent>
                  <div 
                    id="empresas-map" 
                    className="h-[300px] md:h-[400px] lg:h-[500px] rounded-lg border shadow-sm w-full relative z-0"
                    style={{ isolation: 'isolate' }}
                  />
                  {!mapLoaded && (
                    <div className="absolute inset-0 flex items-center justify-center bg-muted/50 rounded-lg">
                      <div className="text-center space-y-2">
                        <Loader2 className="h-6 w-6 animate-spin text-[#3259B5] mx-auto" />
                        <p className="text-sm text-muted-foreground">Cargando mapa...</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-[#222A59]">Detalles de Empresa</CardTitle>
                  <CardDescription>Información de la empresa seleccionada</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 md:space-y-4">
                  {selectedEmpresa ? (
                    <>
                      <div>
                        <h3 className="font-semibold text-base md:text-lg text-[#222A59]">
                          {selectedEmpresa.razon_social}
                        </h3>
                        {selectedEmpresa.nombre_fantasia && (
                          <p className="text-sm text-muted-foreground mt-1">{selectedEmpresa.nombre_fantasia}</p>
                        )}
                        <div className="flex flex-wrap gap-2 mt-2">
                          {selectedEmpresa.tipo_empresa && (
                            <Badge variant="outline" className="text-xs md:text-sm">
                              {selectedEmpresa.tipo_empresa === 'producto' 
                                ? '📦 Productos' 
                                : selectedEmpresa.tipo_empresa === 'servicio' 
                                  ? '🔧 Servicios' 
                                  : selectedEmpresa.tipo_empresa === 'mixta'
                                    ? '🏢 Productos y Servicios'
                                    : selectedEmpresa.tipo_empresa}
                            </Badge>
                          )}
                          {selectedEmpresa.categoria && (
                            <Badge className={`text-xs md:text-sm ${getCategoriaBadgeColor(selectedEmpresa.categoria)}`}>
                              {selectedEmpresa.categoria}
                            </Badge>
                          )}
                        </div>
                      </div>

                      <div className="space-y-2 md:space-y-3 pt-3 md:pt-4 border-t">
                        {selectedEmpresa.rubro_nombre && (
                          <div className="flex items-start gap-2 md:gap-3">
                            <Building2 className="h-4 w-4 md:h-5 md:w-5 text-[#3259B5] mt-0.5 flex-shrink-0" />
                            <div className="min-w-0 flex-1">
                              <p className="text-xs md:text-sm font-medium text-muted-foreground">Rubro</p>
                              <p className="text-xs md:text-sm text-foreground break-words">{selectedEmpresa.rubro_nombre}</p>
                            </div>
                          </div>
                        )}

                        {(selectedEmpresa.departamento_nombre || selectedEmpresa.localidad_nombre) && (
                          <div className="flex items-start gap-2 md:gap-3">
                            <MapPin className="h-4 w-4 md:h-5 md:w-5 text-[#3259B5] mt-0.5 flex-shrink-0" />
                            <div className="min-w-0 flex-1">
                              <p className="text-xs md:text-sm font-medium text-muted-foreground">Ubicación</p>
                              <p className="text-xs md:text-sm text-foreground break-words">
                                {[
                                  selectedEmpresa.localidad_nombre,
                                  selectedEmpresa.municipio_nombre,
                                  selectedEmpresa.departamento_nombre
                                ].filter(Boolean).join(', ')}
                              </p>
                              {selectedEmpresa.lat && selectedEmpresa.lng && (
                                <p className="text-xs text-muted-foreground mt-1 break-all">
                                  Lat: {selectedEmpresa.lat.toFixed(6)}, Lng: {selectedEmpresa.lng.toFixed(6)}
                                </p>
                              )}
                            </div>
                          </div>
                        )}

                        {selectedEmpresa.telefono && (
                          <div className="flex items-start gap-2 md:gap-3">
                            <Phone className="h-4 w-4 md:h-5 md:w-5 text-[#3259B5] mt-0.5 flex-shrink-0" />
                            <div className="min-w-0 flex-1">
                              <p className="text-xs md:text-sm font-medium text-muted-foreground">Teléfono</p>
                              <p className="text-xs md:text-sm text-foreground break-words">{selectedEmpresa.telefono}</p>
                            </div>
                          </div>
                        )}

                        {selectedEmpresa.correo && (
                          <div className="flex items-start gap-2 md:gap-3">
                            <Mail className="h-4 w-4 md:h-5 md:w-5 text-[#3259B5] mt-0.5 flex-shrink-0" />
                            <div className="min-w-0 flex-1">
                              <p className="text-xs md:text-sm font-medium text-muted-foreground">Email</p>
                              <p className="text-xs md:text-sm text-foreground break-all">{selectedEmpresa.correo}</p>
                            </div>
                          </div>
                        )}

                        <div className="pt-2">
                          <Link 
                            href={`/dashboard/empresas/${selectedEmpresa.id}`}
                            className="text-xs md:text-sm text-[#3259B5] hover:underline"
                          >
                            Ver detalles completos →
                          </Link>
                        </div>
                      </div>
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground">Selecciona una empresa en el mapa</p>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-[#222A59]">Leyenda - Categorías</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
                    <div className="flex items-center gap-2 md:gap-3">
                      <div className="w-3 h-3 md:w-4 md:h-4 rounded-full bg-[#C3C840] flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="font-semibold text-xs md:text-sm">Exportadora</p>
                        <p className="text-xs text-muted-foreground">12-18 puntos</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 md:gap-3">
                      <div className="w-3 h-3 md:w-4 md:h-4 rounded-full bg-[#F59E0B] flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="font-semibold text-xs md:text-sm">Potencial Exportadora</p>
                        <p className="text-xs text-muted-foreground">6-11 puntos</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 md:gap-3">
                      <div className="w-3 h-3 md:w-4 md:h-4 rounded-full bg-[#629BD2] flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="font-semibold text-xs md:text-sm">Etapa Inicial</p>
                        <p className="text-xs text-muted-foreground">0-5 puntos</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
  <CardHeader>
    <CardTitle className="text-[#222A59]">Leyenda - Tipos de Empresa</CardTitle>
  </CardHeader>
  <CardContent>
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
      <div className="flex items-center gap-2 md:gap-3">
        <div className="w-6 h-6 rounded bg-[#3259B5] flex items-center justify-center flex-shrink-0 border-2 border-white shadow-md">
          <Package className="h-3.5 w-3.5 text-white" />
        </div>
        <div className="min-w-0">
          <p className="font-semibold text-xs md:text-sm">Productos</p>
          <p className="text-xs text-muted-foreground">Cuadrado</p>
        </div>
      </div>
      <div className="flex items-center gap-2 md:gap-3">
        <div className="w-6 h-6 rounded-full bg-[#3259B5] flex items-center justify-center flex-shrink-0 border-2 border-white shadow-md">
          <Wrench className="h-3.5 w-3.5 text-white" />
        </div>
        <div className="min-w-0">
          <p className="font-semibold text-xs md:text-sm">Servicios</p>
          <p className="text-xs text-muted-foreground">Círculo</p>
        </div>
      </div>
      <div className="flex items-center gap-2 md:gap-3">
        <div className="w-6 h-6 rounded bg-[#3259B5] flex items-center justify-center flex-shrink-0 border-2 border-white shadow-md" style={{ transform: 'rotate(45deg)' }}>
          <div style={{ transform: 'rotate(-45deg)' }}>
            <Building className="h-3.5 w-3.5 text-white" />
          </div>
        </div>
        <div className="min-w-0">
          <p className="font-semibold text-xs md:text-sm">Mixta</p>
          <p className="text-xs text-muted-foreground">Diamante</p>
        </div>
      </div>
    </div>
  </CardContent>
</Card>

{/* Nueva Card para exportar departamentos individuales */}
<Card className="lg:col-span-2">
  <CardHeader>
    <CardTitle className="text-[#222A59]">Exportar Departamentos</CardTitle>
    <CardDescription>
      Haz clic en un departamento para exportarlo
    </CardDescription>
  </CardHeader>
  <CardContent>
    <div className="max-h-[300px] overflow-y-auto pr-2 space-y-2">
      {Object.entries(empresasPorDepartamento)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([deptNormalizado, cantidad]) => {
          const empresaDelDept = empresas.find(
            e => e.departamento_nombre && 
            e.departamento_nombre.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim() === deptNormalizado
          )
          const nombreOriginal = empresaDelDept?.departamento_nombre || deptNormalizado
          
          return (
            <Button
              key={deptNormalizado}
              variant="outline"
              onClick={() => exportarDepartamento(nombreOriginal)}
              disabled={exportingDept}
              className="w-full justify-between h-auto py-3"
            >
              <div className="flex items-center gap-3">
                <div 
                  className="w-4 h-4 rounded flex-shrink-0" 
                  style={{ backgroundColor: getColorPorCantidad(cantidad) }}
                />
                <div className="text-left">
                  <p className="font-medium">{nombreOriginal}</p>
                  <p className="text-xs text-muted-foreground">
                    {cantidad} empresa{cantidad !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
              {exportingDept ? (
                <Loader2 className="h-4 w-4 animate-spin flex-shrink-0" />
              ) : (
                <Download className="h-4 w-4 flex-shrink-0" />
              )}
            </Button>
          )
        })}
    </div>
  </CardContent>
</Card>
            </div>
          </>
        )}
      </div>
    </MainLayout>
  )
}
