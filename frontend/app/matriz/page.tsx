"use client"

import { useState } from "react"
import { MainLayout } from "@/components/layout/main-layout"
import { MatrizClasificacion } from "@/components/matriz/matriz-clasificacion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Building2, MapPin, Phone, Mail } from "lucide-react"

const empresas = [
  {
    id: "1",
    nombre: "Vinos del Valle S.A.",
    rubro: "Alimentos y Bebidas",
    ubicacion: "Capital, Catamarca",
    telefono: "+54 383 4123456",
    email: "contacto@vinosdelvalle.com",
    categoria: "Exportadora",
  },
  {
    id: "2",
    nombre: "Textiles Andinos",
    rubro: "Textil",
    ubicacion: "Andalgalá, Catamarca",
    telefono: "+54 383 4234567",
    email: "info@textilesandinos.com",
    categoria: "Potencial Exportadora",
  },
  {
    id: "3",
    nombre: "Minerales del Norte",
    rubro: "Minería",
    ubicacion: "Belén, Catamarca",
    telefono: "+54 383 4345678",
    email: "ventas@mineralesdelnorte.com",
    categoria: "Etapa Inicial",
  },
]

export default function MatrizPage() {
  const [empresaSeleccionada, setEmpresaSeleccionada] = useState<string>("")

  const empresaActual = empresas.find((e) => e.id === empresaSeleccionada)

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
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-[#222A59]">Matriz de Clasificación</h1>
          <p className="text-muted-foreground mt-1 text-sm md:text-base">
            Sistema de evaluación del perfil exportador de empresas
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-[#222A59]">Seleccionar Empresa</CardTitle>
            <CardDescription>Elige una empresa para evaluar o modificar su matriz de clasificación</CardDescription>
          </CardHeader>
          <CardContent>
            <Select value={empresaSeleccionada} onValueChange={setEmpresaSeleccionada}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecciona una empresa..." />
              </SelectTrigger>
              <SelectContent>
                {empresas.map((empresa) => (
                  <SelectItem key={empresa.id} value={empresa.id}>
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-[#3259B5]" />
                      <span>{empresa.nombre}</span>
                      <span className="text-xs text-muted-foreground">- {empresa.rubro}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {empresaActual && (
              <div className="mt-4 p-4 bg-[#629BD2]/5 border border-[#629BD2]/20 rounded-lg">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-lg text-[#222A59]">{empresaActual.nombre}</h3>
                      <Badge className={getCategoriaColor(empresaActual.categoria)}>{empresaActual.categoria}</Badge>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-[#3259B5]" />
                        <span>{empresaActual.rubro}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-[#3259B5]" />
                        <span>{empresaActual.ubicacion}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-[#3259B5]" />
                        <span>{empresaActual.telefono}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-[#3259B5]" />
                        <span className="truncate">{empresaActual.email}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {empresaSeleccionada ? (
          <MatrizClasificacion />
        ) : (
          <Card>
            <CardContent className="py-12">
              <div className="text-center space-y-3">
                <Building2 className="h-16 w-16 text-[#3259B5]/30 mx-auto" />
                <div>
                  <p className="text-lg font-semibold text-[#222A59]">Selecciona una empresa</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Elige una empresa del selector superior para evaluar su perfil exportador
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </MainLayout>
  )
}
