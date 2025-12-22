"use client"

import { useEffect, useState, useRef } from "react"
import { MapPin } from "lucide-react"
import { Card } from "@/components/ui/card"

interface CompanyMapProps {
  coordinates: { lat: number; lng: number }
  address?: string
}

export function CompanyMap({ coordinates, address }: CompanyMapProps) {
  const [mounted, setMounted] = useState(false)
  const mapRef = useRef<any>(null)
  const markerRef = useRef<any>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted || typeof window === "undefined") return
    if (!coordinates || !coordinates.lat || !coordinates.lng) {
      return
    }

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
          return
        }

        // Initialize map only if it doesn't exist
        let mapInstance = mapRef.current
        
        if (!mapInstance) {
          const lat = Number(coordinates.lat)
          const lng = Number(coordinates.lng)
          
          if (isNaN(lat) || isNaN(lng)) {
            return
          }

          mapInstance = L.map("company-map", {
            zoomControl: true,
            scrollWheelZoom: true,
            zoomAnimation: true,
          }).setView([lat, lng], 15)

          // Ajustar z-index del contenedor del mapa
          const mapContainer = mapInstance.getContainer()
          if (mapContainer) {
            mapContainer.style.zIndex = '0'
          }

          // Add OpenStreetMap tiles
          L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
            maxZoom: 19,
          }).addTo(mapInstance)

          mapRef.current = mapInstance
        }

        // Update map view and marker if coordinates changed
        const lat = Number(coordinates.lat)
        const lng = Number(coordinates.lng)
        
        if (!isNaN(lat) && !isNaN(lng) && mapInstance) {
          // Update map view
          mapInstance.setView([lat, lng], mapInstance.getZoom())

          // Remove old marker if exists
          if (markerRef.current) {
            mapInstance.removeLayer(markerRef.current)
          }

          // Add new marker
          const customIcon = L.icon({
            iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
            iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
            shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34],
            shadowSize: [41, 41],
          })

          markerRef.current = L.marker([lat, lng], { icon: customIcon })
            .addTo(mapInstance)
            .bindPopup(address || "Ubicación de la empresa")
        }
      } catch (error) {
        // Silently handle errors to avoid console spam
      }
    }

    loadLeaflet()

    return () => {
      // Only cleanup on unmount, not on every coordinate change
      if (mapRef.current) {
        try {
          mapRef.current.remove()
          mapRef.current = null
          markerRef.current = null
        } catch (error) {
          // Ignore cleanup errors
        }
      }
    }
  }, [mounted]) // Only run once when mounted

  // Separate effect to update marker when coordinates change (if map already exists)
  useEffect(() => {
    if (!mounted || !mapRef.current) return
    if (!coordinates || !coordinates.lat || !coordinates.lng) return

    const updateMarker = async () => {
      try {
        const L = (await import("leaflet")).default
        const mapInstance = mapRef.current
        
        if (!mapInstance) return

        const lat = Number(coordinates.lat)
        const lng = Number(coordinates.lng)
        
        if (isNaN(lat) || isNaN(lng)) return

        // Update map view (only if coordinates actually changed)
        const currentCenter = mapInstance.getCenter()
        if (Math.abs(currentCenter.lat - lat) > 0.0001 || Math.abs(currentCenter.lng - lng) > 0.0001) {
          mapInstance.setView([lat, lng], mapInstance.getZoom())
        }

        // Remove old marker
        if (markerRef.current) {
          mapInstance.removeLayer(markerRef.current)
        }

        // Add new marker
        const customIcon = L.icon({
          iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
          iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
          shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
          iconSize: [25, 41],
          iconAnchor: [12, 41],
          popupAnchor: [1, -34],
          shadowSize: [41, 41],
        })

        markerRef.current = L.marker([lat, lng], { icon: customIcon })
          .addTo(mapInstance)
          .bindPopup(address || "Ubicación de la empresa")
      } catch (error) {
        // Silently handle errors
      }
    }

    updateMarker()
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
  className="h-[350px] w-full rounded-xl border-2 border-[#3259B5]/20 shadow-lg overflow-hidden relative"
  style={{ 
    borderRadius: '0.75rem',
    transition: 'all 0.3s ease',
    zIndex: 0  // ← AGREGAR ESTA LÍNEA
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
