"use client"

import { MainLayout } from "@/components/layout/main-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MapPin, Building2, Phone, Mail } from "lucide-react"
import { useState } from "react"

// Mock data for companies
const empresas = [
  {
    id: 1,
    nombre: "Vinos del Valle S.A.",
    categoria: "Exportadora",
    sector: "Alimentos y Bebidas",
    ubicacion: "San Fernando del Valle de Catamarca",
    lat: -28.4696,
    lng: -65.7795,
    telefono: "+54 383 4123456",
    email: "contacto@vinosdelvalle.com",
  },
  {
    id: 2,
    nombre: "Textiles Andinos",
    categoria: "Potencial Exportadora",
    sector: "Textil",
    ubicacion: "Andalgalá",
    lat: -27.5833,
    lng: -66.3167,
    telefono: "+54 383 4234567",
    email: "info@textilesandinos.com",
  },
  {
    id: 3,
    nombre: "Minerales del Norte",
    categoria: "Exportadora",
    sector: "Minería",
    ubicacion: "Belén",
    lat: -27.6458,
    lng: -67.0306,
    telefono: "+54 383 4345678",
    email: "ventas@mineralesdelnorte.com",
  },
]

export default function MapaPage() {
  const [selectedEmpresa, setSelectedEmpresa] = useState(empresas[0])

  const getCategoriaColor = (categoria: string) => {
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
          <p className="text-sm md:text-base text-muted-foreground mt-1 md:mt-2">Visualiza la ubicación geográfica de las empresas exportadoras</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-[#222A59]">Mapa Interactivo</CardTitle>
              <CardDescription>Haz clic en los marcadores para ver detalles de cada empresa</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-muted rounded-lg h-[300px] md:h-[400px] lg:h-[500px] flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-[#629BD2]/20 to-[#3259B5]/20" />
                <div className="relative z-10 text-center space-y-3 md:space-y-4 px-4">
                  <MapPin className="h-12 w-12 md:h-16 md:w-16 text-[#3259B5] mx-auto" />
                  <div>
                    <p className="text-base md:text-lg font-semibold text-[#222A59]">Mapa de Catamarca</p>
                    <p className="text-xs md:text-sm text-muted-foreground">
                      Integración con Leaflet para visualización de ubicaciones
                    </p>
                  </div>
                  <div className="flex gap-2 md:gap-4 justify-center flex-wrap">
                    {empresas.map((empresa) => (
                      <button
                        key={empresa.id}
                        onClick={() => setSelectedEmpresa(empresa)}
                        className="flex items-center gap-2 px-3 py-2 md:px-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow text-xs md:text-sm"
                      >
                        <MapPin className="h-3 w-3 md:h-4 md:w-4 text-[#3259B5]" />
                        <span className="font-medium">{empresa.nombre}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-[#222A59]">Detalles de Empresa</CardTitle>
              <CardDescription>Información de la empresa seleccionada</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 md:space-y-4">
              <div>
                <h3 className="font-semibold text-base md:text-lg text-[#222A59]">{selectedEmpresa.nombre}</h3>
                <Badge className={`mt-2 text-xs md:text-sm ${getCategoriaColor(selectedEmpresa.categoria)}`}>
                  {selectedEmpresa.categoria}
                </Badge>
              </div>

              <div className="space-y-2 md:space-y-3 pt-3 md:pt-4 border-t">
                <div className="flex items-start gap-2 md:gap-3">
                  <Building2 className="h-4 w-4 md:h-5 md:w-5 text-[#3259B5] mt-0.5 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs md:text-sm font-medium text-muted-foreground">Sector</p>
                    <p className="text-xs md:text-sm text-foreground break-words">{selectedEmpresa.sector}</p>
                  </div>
                </div>

                <div className="flex items-start gap-2 md:gap-3">
                  <MapPin className="h-4 w-4 md:h-5 md:w-5 text-[#3259B5] mt-0.5 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs md:text-sm font-medium text-muted-foreground">Ubicación</p>
                    <p className="text-xs md:text-sm text-foreground break-words">{selectedEmpresa.ubicacion}</p>
                    <p className="text-xs text-muted-foreground mt-1 break-all">
                      Lat: {selectedEmpresa.lat}, Lng: {selectedEmpresa.lng}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2 md:gap-3">
                  <Phone className="h-4 w-4 md:h-5 md:w-5 text-[#3259B5] mt-0.5 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs md:text-sm font-medium text-muted-foreground">Teléfono</p>
                    <p className="text-xs md:text-sm text-foreground break-words">{selectedEmpresa.telefono}</p>
                  </div>
                </div>

                <div className="flex items-start gap-2 md:gap-3">
                  <Mail className="h-4 w-4 md:h-5 md:w-5 text-[#3259B5] mt-0.5 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs md:text-sm font-medium text-muted-foreground">Email</p>
                    <p className="text-xs md:text-sm text-foreground break-all">{selectedEmpresa.email}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-[#222A59]">Leyenda del Mapa</CardTitle>
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
      </div>
    </MainLayout>
  )
}

