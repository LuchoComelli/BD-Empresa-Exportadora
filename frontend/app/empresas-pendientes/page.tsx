"use client"

import { useState } from "react"
import { MainLayout } from "@/components/layout/main-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Search, Eye, Clock } from "lucide-react"
import Link from "next/link"

// Mock data - In real app, fetch from database
const empresasPendientes = [
  {
    id: "1",
    razonSocial: "Vinos del Valle S.A.",
    cuit: "30-12345678-9",
    rubro: "Alimentos y Bebidas",
    email: "contacto@vinosdelvalle.com",
    fechaRegistro: "2024-01-15",
    status: "pendiente",
  },
  {
    id: "2",
    razonSocial: "Textiles Catamarca SRL",
    cuit: "30-98765432-1",
    rubro: "Textil",
    email: "info@textilescatamarca.com",
    fechaRegistro: "2024-01-14",
    status: "pendiente",
  },
  {
    id: "3",
    razonSocial: "Aceites Orgánicos del Norte",
    cuit: "30-55555555-5",
    rubro: "Agrícola",
    email: "ventas@aceitesorganicos.com",
    fechaRegistro: "2024-01-13",
    status: "pendiente",
  },
]

export default function EmpresasPendientesPage() {
  const [searchTerm, setSearchTerm] = useState("")

  const filteredEmpresas = empresasPendientes.filter(
    (empresa) =>
      empresa.razonSocial.toLowerCase().includes(searchTerm.toLowerCase()) ||
      empresa.cuit.includes(searchTerm) ||
      empresa.email.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-[#222A59]">Empresas Pendientes de Aprobación</h1>
          <p className="text-sm md:text-base text-[#6B7280] mt-2">
            Revisa y aprueba las solicitudes de registro de nuevas empresas
          </p>
        </div>

        <Card className="p-4 md:p-6">
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#6B7280] w-4 h-4" />
              <Input
                placeholder="Buscar por razón social, CUIT o email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="space-y-4">
            {filteredEmpresas.length === 0 ? (
              <div className="text-center py-12">
                <Clock className="w-12 h-12 text-[#6B7280] mx-auto mb-4" />
                <p className="text-[#6B7280]">No hay empresas pendientes de aprobación</p>
              </div>
            ) : (
              filteredEmpresas.map((empresa) => (
                <Card key={empresa.id} className="p-4 hover:shadow-md transition-shadow">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-start gap-3">
                        <div className="flex-1">
                          <h3 className="font-semibold text-[#222A59] text-lg">{empresa.razonSocial}</h3>
                          <p className="text-sm text-[#6B7280]">CUIT: {empresa.cuit}</p>
                        </div>
                        <Badge className="bg-[#F59E0B] text-white">
                          <Clock className="w-3 h-3 mr-1" />
                          Pendiente
                        </Badge>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-[#6B7280]">Rubro:</span>{" "}
                          <span className="font-medium text-[#222A59]">{empresa.rubro}</span>
                        </div>
                        <div>
                          <span className="text-[#6B7280]">Email:</span>{" "}
                          <span className="font-medium text-[#222A59]">{empresa.email}</span>
                        </div>
                        <div className="sm:col-span-2">
                          <span className="text-[#6B7280]">Fecha de registro:</span>{" "}
                          <span className="font-medium text-[#222A59]">
                            {new Date(empresa.fechaRegistro).toLocaleDateString("es-AR")}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2">
                      <Link href={`/empresas-pendientes/${empresa.id}`}>
                        <Button className="w-full sm:w-auto bg-[#3259B5] hover:bg-[#3259B5]/90 text-white">
                          <Eye className="w-4 h-4 mr-2" />
                          Revisar
                        </Button>
                      </Link>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        </Card>
      </div>
    </MainLayout>
  )
}
