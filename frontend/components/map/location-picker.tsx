"use client"

import { useEffect, useState } from "react"
import { MapPin } from "lucide-react"
import { Card } from "@/components/ui/card"

interface LocationPickerProps {
  value: string
  onChange: (coordinates: string) => void
}

export function LocationPicker({ value, onChange }: LocationPickerProps) {
  const [mounted, setMounted] = useState(false)
  const [map, setMap] = useState<any>(null)
  const [marker, setMarker] = useState<any>(null)
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number }>(() => {
    if (value && typeof value === 'string' && value.trim()) {
      try {
        const [lat, lng] = value.split(",").map((v) => Number.parseFloat(v.trim()))
        if (!isNaN(lat) && !isNaN(lng)) {
          return { lat, lng }
        }
      } catch (error) {
        console.error('Error parsing coordinates:', error)
      }
    }
    return { lat: -28.4696, lng: -65.7795 } // Default: Catamarca
  })

  useEffect(() => {
    setMounted(true)
    
    // Agregar estilos CSS para limitar el z-index del mapa
    const style = document.createElement('style')
    style.textContent = `
      #location-picker-map .leaflet-container {
        z-index: 0 !important;
      }
      #location-picker-map .leaflet-control-container {
        z-index: 1 !important;
      }
      #location-picker-map .leaflet-top,
      #location-picker-map .leaflet-bottom {
        z-index: 1 !important;
      }
      #location-picker-map .leaflet-pane {
        z-index: 0 !important;
      }
      #location-picker-map .leaflet-control {
        z-index: 1 !important;
      }
    `
    document.head.appendChild(style)
    
    return () => {
      document.head.removeChild(style)
    }
  }, [])

  useEffect(() => {
    if (!mounted || typeof window === "undefined") return

    const loadLeaflet = async () => {
      try {
        // Dynamically import Leaflet
        const leafletModule = await import("leaflet")
        // Leaflet puede exportarse de diferentes formas dependiendo de la versión
        const L = (leafletModule as any).default || leafletModule

        if (!L || !L.map) {
          console.error('Leaflet no se pudo cargar correctamente', L)
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
        const mapElement = document.getElementById("location-picker-map")
        if (!mapElement) {
          console.error('Map element not found')
          return
        }

        const mapInstance = L.map("location-picker-map").setView([coordinates.lat, coordinates.lng], 13)

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        }).addTo(mapInstance)

        // Add initial marker
        const markerInstance = L.marker([coordinates.lat, coordinates.lng], {
          draggable: true,
        }).addTo(mapInstance)

        // Update coordinates when marker is dragged
        markerInstance.on("dragend", (e: any) => {
          const position = e.target.getLatLng()
          setCoordinates({ lat: position.lat, lng: position.lng })
          onChange(`${position.lat.toFixed(6)}, ${position.lng.toFixed(6)}`)
        })

        // Add marker on map click
        mapInstance.on("click", (e: any) => {
          const { lat, lng } = e.latlng
          markerInstance.setLatLng([lat, lng])
          setCoordinates({ lat, lng })
          onChange(`${lat.toFixed(6)}, ${lng.toFixed(6)}`)
        })

        setMap(mapInstance)
        setMarker(markerInstance)
      } catch (error) {
        console.error('Error loading Leaflet:', error)
      }
    }

    loadLeaflet()

    return () => {
      if (map) {
        map.remove()
      }
    }
  }, [mounted])

  // Update marker position when value changes externally
  useEffect(() => {
    if (marker && value && typeof value === 'string' && value.trim()) {
      try {
        const [lat, lng] = value.split(",").map((v) => Number.parseFloat(v.trim()))
        if (!isNaN(lat) && !isNaN(lng)) {
          marker.setLatLng([lat, lng])
          if (map) {
            map.setView([lat, lng], 13)
          }
        }
      } catch (error) {
        console.error('Error updating marker position:', error)
      }
    }
  }, [value, marker, map])

  if (!mounted) {
    return (
      <Card className="h-[400px] flex items-center justify-center bg-muted">
        <div className="text-center space-y-2">
          <MapPin className="h-12 w-12 text-[#3259B5] mx-auto" />
          <p className="text-sm text-muted-foreground">Cargando mapa...</p>
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-3">
      <div 
        id="location-picker-map" 
        className="h-[300px] md:h-[400px] rounded-lg border shadow-sm w-full relative z-0"
        style={{ isolation: 'isolate' }}
      />
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-xs md:text-sm text-muted-foreground">
        <MapPin className="h-4 w-4 text-[#3259B5] flex-shrink-0" />
        <span className="break-words">
          Haz clic en el mapa o arrastra el marcador para seleccionar la ubicación. Coordenadas:{" "}
          <span className="font-mono">{coordinates.lat.toFixed(6)}, {coordinates.lng.toFixed(6)}</span>
        </span>
      </div>
    </div>
  )
}
