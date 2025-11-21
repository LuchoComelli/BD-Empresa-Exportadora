"use client"

import { useEffect, useState } from "react"
import { MapPin } from "lucide-react"
import { Card } from "@/components/ui/card"

interface CompanyMapProps {
  coordinates: { lat: number; lng: number }
  address?: string
}

export function CompanyMap({ coordinates, address }: CompanyMapProps) {
  const [mounted, setMounted] = useState(false)
  const [map, setMap] = useState<any>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted || typeof window === "undefined") return
    if (!coordinates || !coordinates.lat || !coordinates.lng) {
      console.error('[CompanyMap] Coordenadas inválidas:', coordinates)
      return
    }

    console.log('[CompanyMap] Inicializando mapa con coordenadas:', coordinates)

    const loadLeaflet = async () => {
      try {
        // Dynamically import Leaflet
        const L = (await import("leaflet")).default

        // Load Leaflet CSS
        if (!document.querySelector('link[href*="leaflet.css"]')) {
          const link = document.createElement("link")
          link.rel = "stylesheet"
          link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
          document.head.appendChild(link)
        }

        // Fix default marker icon issue
        delete (L.Icon.Default.prototype as any)._getIconUrl
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
          iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
          shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
        })

        // Verify element exists
        const mapElement = document.getElementById("company-map")
        if (!mapElement) {
          console.error('[CompanyMap] Elemento #company-map no encontrado')
          return
        }

        // Initialize map
        const lat = Number(coordinates.lat)
        const lng = Number(coordinates.lng)
        
        if (isNaN(lat) || isNaN(lng)) {
          console.error('[CompanyMap] Coordenadas no son números válidos:', { lat, lng })
          return
        }

        console.log('[CompanyMap] Creando mapa con:', { lat, lng })
        const mapInstance = L.map("company-map", {
          zoomControl: true,
          scrollWheelZoom: true,
        }).setView([lat, lng], 15)

        // Add OpenStreetMap tiles
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          maxZoom: 19,
        }).addTo(mapInstance)

        // Add marker with custom icon
        const customIcon = L.icon({
          iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
          iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
          shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
          iconSize: [25, 41],
          iconAnchor: [12, 41],
          popupAnchor: [1, -34],
          shadowSize: [41, 41],
        })

        const markerLat = Number(coordinates.lat)
        const markerLng = Number(coordinates.lng)
        
        L.marker([markerLat, markerLng], { icon: customIcon })
          .addTo(mapInstance)
          .bindPopup(address || "Ubicación de la empresa")

        console.log('[CompanyMap] Mapa creado exitosamente')
        setMap(mapInstance)
      } catch (error) {
        console.error("[CompanyMap] Error loading map:", error)
      }
    }

    loadLeaflet()

    return () => {
      if (map) {
        map.remove()
      }
    }
  }, [mounted, coordinates?.lat, coordinates?.lng, address])

  if (!mounted) {
    return (
      <Card className="h-[350px] flex items-center justify-center bg-gradient-to-br from-[#F3F4F6] to-[#E5E7EB] rounded-xl border-2 border-[#3259B5]/20">
        <div className="text-center space-y-3">
          <div className="w-16 h-16 bg-[#3259B5]/10 rounded-full flex items-center justify-center mx-auto">
            <MapPin className="h-8 w-8 text-[#3259B5] animate-pulse" />
          </div>
          <p className="text-sm font-medium text-[#6B7280]">Cargando mapa...</p>
        </div>
      </Card>
    )
  }

  if (!coordinates || typeof coordinates.lat !== 'number' || typeof coordinates.lng !== 'number') {
    return (
      <Card className="h-[350px] flex items-center justify-center bg-gradient-to-br from-[#F3F4F6] to-[#E5E7EB] rounded-xl border-2 border-[#3259B5]/20">
        <div className="text-center space-y-3">
          <div className="w-16 h-16 bg-[#3259B5]/10 rounded-full flex items-center justify-center mx-auto">
            <MapPin className="h-8 w-8 text-[#3259B5]" />
          </div>
          <p className="text-sm font-medium text-[#6B7280]">Coordenadas no disponibles</p>
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-3">
      <div 
        id="company-map" 
        className="h-[350px] w-full rounded-xl border-2 border-[#3259B5]/20 shadow-lg overflow-hidden"
        style={{ 
          borderRadius: '0.75rem',
          transition: 'all 0.3s ease'
        }}
      />
      <div className="flex items-center gap-2 text-sm text-[#6B7280] bg-[#F9FAFB] px-3 py-2 rounded-lg">
        <MapPin className="h-4 w-4 text-[#3259B5]" />
        <span className="font-medium">
          Coordenadas: {coordinates.lat.toFixed(6)}, {coordinates.lng.toFixed(6)}
        </span>
      </div>
    </div>
  )
}
