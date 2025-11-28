"use client"

import { MainLayout } from "@/components/layout/main-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MapPin, Building2, Phone, Mail, Loader2, Package, Wrench, Building } from "lucide-react"
import { useState, useEffect } from "react"
import { api } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"

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

export default function MapaPage() {
  const { toast } = useToast()
  const [empresas, setEmpresas] = useState<Empresa[]>([])
  const [selectedEmpresa, setSelectedEmpresa] = useState<Empresa | null>(null)
  const [loading, setLoading] = useState(true)
  const [mapLoaded, setMapLoaded] = useState(false)
  const [map, setMap] = useState<any>(null)
  const [markers, setMarkers] = useState<any[]>([])

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
        const response = await api.getEmpresas({})
        const empresasData = Array.isArray(response) ? response : (response.results || [])
        
        console.log('[Mapa] Total empresas recibidas:', empresasData.length)
        console.log('[Mapa] Primeras empresas:', empresasData.slice(0, 3).map((e: any) => ({
          id: e.id,
          razon_social: e.razon_social,
          geolocalizacion: e.geolocalizacion
        })))
        
        // Filtrar empresas con geolocalización válida y parsear coordenadas
        const empresasConCoords = empresasData
          .map((empresa: any) => {
            if (!empresa.geolocalizacion) {
              console.log('[Mapa] Empresa sin geolocalizacion:', empresa.id, empresa.razon_social)
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
              } else {
                console.log('[Mapa] Coordenadas inválidas para empresa:', empresa.id, empresa.geolocalizacion)
              }
            } catch (error) {
              console.error('Error parsing coordinates for empresa:', empresa.id, error)
            }
            return null
          })
          .filter((e: Empresa | null) => e !== null) as Empresa[]
        
        console.log('[Mapa] Empresas con coordenadas válidas:', empresasConCoords.length)
        
        setEmpresas(empresasConCoords)
        
        if (empresasConCoords.length > 0) {
          setSelectedEmpresa(empresasConCoords[0])
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
  }, [toast])

  // Cargar y configurar el mapa
  useEffect(() => {
    if (loading || empresas.length === 0) return

    const loadMap = async () => {
      try {
        // Dynamically import Leaflet
        const leafletModule = await import("leaflet")
        const L = (leafletModule as any).default || leafletModule

        if (!L || !L.map) {
          console.error('Leaflet no se pudo cargar correctamente')
          return
        }

        // Load Leaflet CSS
        if (!document.querySelector('link[href*="leaflet.css"]')) {
          const link = document.createElement("link")
          link.rel = "stylesheet"
          link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
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
        const catamarcaCenter: [number, number] = [-28.4696, -65.7795]
        const mapInstance = L.map("empresas-map", {
          preferCanvas: false
        }).setView(catamarcaCenter, 8)

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        }).addTo(mapInstance)

        // Crear marcadores para cada empresa
        const newMarkers: any[] = []
        empresas.forEach((empresa) => {
          if (empresa.lat && empresa.lng) {
            const markerColor = getCategoriaColor(empresa.categoria || '')
            const tipoInfo = getTipoEmpresaInfo(empresa.tipo_empresa || '')
            
            // Crear icono según el tipo de empresa
            const customIcon = L.divIcon({
              className: 'custom-marker',
              html: `
                <div style="
                  background-color: ${markerColor}; 
                  width: 24px; 
                  height: 24px; 
                  border-radius: ${tipoInfo.shape === 'circle' ? '50%' : tipoInfo.shape === 'square' ? '4px' : '50% 50% 0 50%'}; 
                  border: 2px solid white; 
                  box-shadow: 0 2px 4px rgba(0,0,0,0.3);
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  font-size: 12px;
                ">
                  ${tipoInfo.icon}
                </div>
              `,
              iconSize: [24, 24],
              iconAnchor: [12, 12],
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

  const getTipoEmpresaInfo = (tipo: string): { icon: string; shape: string } => {
    switch (tipo) {
      case "producto":
        return { icon: "📦", shape: "square" } // Cuadrado para productos
      case "servicio":
        return { icon: "🔧", shape: "circle" } // Círculo para servicios
      case "mixta":
        return { icon: "🏢", shape: "diamond" } // Diamante para mixtas
      default:
        return { icon: "📍", shape: "circle" } // Círculo por defecto
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

  return (
    <MainLayout>
      <div className="space-y-4 md:space-y-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-[#222A59]">Mapa de Empresas</h1>
          <p className="text-sm md:text-base text-muted-foreground mt-1 md:mt-2">
            Visualiza la ubicación geográfica de las empresas exportadoras
          </p>
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
                  <CardTitle className="text-[#222A59]">Mapa Interactivo</CardTitle>
                  <CardDescription>
                    {empresas.length} empresa{empresas.length !== 1 ? 's' : ''} con ubicación geográfica
                  </CardDescription>
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
                      <div className="w-4 h-4 md:w-5 md:h-5 rounded bg-[#3259B5] flex items-center justify-center text-white text-xs flex-shrink-0">
                        📦
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-xs md:text-sm">Productos</p>
                        <p className="text-xs text-muted-foreground">Cuadrado</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 md:gap-3">
                      <div className="w-4 h-4 md:w-5 md:h-5 rounded-full bg-[#3259B5] flex items-center justify-center text-white text-xs flex-shrink-0">
                        🔧
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-xs md:text-sm">Servicios</p>
                        <p className="text-xs text-muted-foreground">Círculo</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 md:gap-3">
                      <div className="w-4 h-4 md:w-5 md:h-5 rounded-tl-full rounded-tr-full rounded-bl-none rounded-br-full bg-[#3259B5] flex items-center justify-center text-white text-xs flex-shrink-0">
                        🏢
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-xs md:text-sm">Mixta</p>
                        <p className="text-xs text-muted-foreground">Diamante</p>
                      </div>
                    </div>
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
