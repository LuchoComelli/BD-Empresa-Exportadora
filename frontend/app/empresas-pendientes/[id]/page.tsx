"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { MainLayout } from "@/components/layout/main-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, CheckCircle, XCircle, Edit2, Save } from "lucide-react"
import Link from "next/link"

// Mock data - In real app, fetch from database based on ID
const empresaData = {
  id: "1",
  razonSocial: "Vinos del Valle S.A.",
  cuit: "30-12345678-9",
  rubro: "Alimentos y Bebidas",
  direccion: "Av. Belgrano 1234",
  departamento: "capital",
  municipio: "san-fernando",
  localidad: "Centro",
  paginaWeb: "https://www.vinosdelvalle.com",
  geolocalizacion: "-28.4696,-65.7795",
  contactoPrincipal: {
    nombre: "Juan Pérez",
    telefono: "(0383) 4123456",
    email: "contacto@vinosdelvalle.com",
  },
  productos: [
    {
      id: "1",
      nombre: "Vino Malbec Premium",
      descripcion: "Vino tinto de alta calidad elaborado con uvas seleccionadas",
      posicionArancelaria: "2204.21.00",
      capacidadProductiva: "50,000 botellas/mes",
    },
  ],
  exporta: "si",
  destinoExportacion: "Brasil, Chile, Estados Unidos",
  importa: "no",
  materialPromocion: "si",
  feriaAsistio: "Feria Internacional del Vino 2023\nExpo Alimentos Argentina 2023",
  certificadoMiPyme: "si",
  certificaciones: "ISO 9001:2015\nHACCP\nCertificación Orgánica",
  observaciones: "Empresa familiar con 20 años de experiencia en la producción de vinos de alta calidad.",
  fechaRegistro: "2024-01-15",
  status: "pendiente",
}

export default function RevisarEmpresaPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState(empresaData)

  const handleApprove = () => {
    console.log("[v0] Approving company:", formData.id)
    alert(`Empresa "${formData.razonSocial}" aprobada exitosamente. Se enviará un email de confirmación.`)
    router.push("/empresas-pendientes")
  }

  const handleReject = () => {
    const reason = prompt("Motivo del rechazo:")
    if (reason) {
      console.log("[v0] Rejecting company:", formData.id, "Reason:", reason)
      alert(`Empresa "${formData.razonSocial}" rechazada. Se enviará un email con el motivo.`)
      router.push("/empresas-pendientes")
    }
  }

  const handleSave = () => {
    console.log("[v0] Saving changes:", formData)
    alert("Cambios guardados exitosamente")
    setIsEditing(false)
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Link href="/empresas-pendientes">
              <Button variant="ghost" className="mb-2 text-[#3259B5] hover:text-[#3259B5]/80">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Volver a Empresas Pendientes
              </Button>
            </Link>
            <h1 className="text-2xl md:text-3xl font-bold text-[#222A59]">{formData.razonSocial}</h1>
            <p className="text-sm md:text-base text-[#6B7280] mt-1">
              Registrada el {new Date(formData.fechaRegistro).toLocaleDateString("es-AR")}
            </p>
          </div>
          <Badge className="bg-[#F59E0B] text-white">Pendiente</Badge>
        </div>

        <Card className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-[#222A59]">Información de la Empresa</h2>
            {!isEditing ? (
              <Button onClick={() => setIsEditing(true)} variant="outline" className="border-[#3259B5] text-[#3259B5]">
                <Edit2 className="w-4 h-4 mr-2" />
                Editar
              </Button>
            ) : (
              <Button onClick={handleSave} className="bg-[#C3C840] hover:bg-[#C3C840]/90 text-[#222A59]">
                <Save className="w-4 h-4 mr-2" />
                Guardar Cambios
              </Button>
            )}
          </div>

          <div className="space-y-6">
            {/* Información Básica */}
            <div className="space-y-4">
              <h3 className="font-semibold text-[#222A59] border-b pb-2">Información Básica</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Razón Social</Label>
                  {isEditing ? (
                    <Input
                      value={formData.razonSocial}
                      onChange={(e) => setFormData({ ...formData, razonSocial: e.target.value })}
                    />
                  ) : (
                    <p className="text-[#222A59] font-medium">{formData.razonSocial}</p>
                  )}
                </div>
                <div>
                  <Label>CUIT</Label>
                  {isEditing ? (
                    <Input value={formData.cuit} onChange={(e) => setFormData({ ...formData, cuit: e.target.value })} />
                  ) : (
                    <p className="text-[#222A59] font-medium">{formData.cuit}</p>
                  )}
                </div>
                <div>
                  <Label>Rubro</Label>
                  {isEditing ? (
                    <Select
                      value={formData.rubro}
                      onValueChange={(value) => setFormData({ ...formData, rubro: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Agrícola">Agrícola</SelectItem>
                        <SelectItem value="Ganadero">Ganadero</SelectItem>
                        <SelectItem value="Industrial">Industrial</SelectItem>
                        <SelectItem value="Textil">Textil</SelectItem>
                        <SelectItem value="Alimentos y Bebidas">Alimentos y Bebidas</SelectItem>
                        <SelectItem value="Minería">Minería</SelectItem>
                        <SelectItem value="Tecnología">Tecnología</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <p className="text-[#222A59] font-medium">{formData.rubro}</p>
                  )}
                </div>
                <div>
                  <Label>Página Web</Label>
                  {isEditing ? (
                    <Input
                      value={formData.paginaWeb}
                      onChange={(e) => setFormData({ ...formData, paginaWeb: e.target.value })}
                    />
                  ) : (
                    <a
                      href={formData.paginaWeb}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#3259B5] hover:underline"
                    >
                      {formData.paginaWeb}
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* Productos */}
            <div className="space-y-4">
              <h3 className="font-semibold text-[#222A59] border-b pb-2">Productos</h3>
              {formData.productos.map((producto, index) => (
                <Card key={producto.id} className="p-4 bg-[#3259B5]/5">
                  <h4 className="font-semibold text-[#222A59] mb-3">Producto {index + 1}</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Nombre</Label>
                      <p className="text-[#222A59] font-medium">{producto.nombre}</p>
                    </div>
                    <div>
                      <Label>Posición Arancelaria</Label>
                      <p className="text-[#222A59] font-medium">{producto.posicionArancelaria}</p>
                    </div>
                    <div className="md:col-span-2">
                      <Label>Descripción</Label>
                      <p className="text-[#222A59]">{producto.descripcion}</p>
                    </div>
                    <div>
                      <Label>Capacidad Productiva</Label>
                      <p className="text-[#222A59] font-medium">{producto.capacidadProductiva}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {/* Contacto */}
            <div className="space-y-4">
              <h3 className="font-semibold text-[#222A59] border-b pb-2">Contacto Principal</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label>Nombre</Label>
                  <p className="text-[#222A59] font-medium">{formData.contactoPrincipal.nombre}</p>
                </div>
                <div>
                  <Label>Teléfono</Label>
                  <p className="text-[#222A59] font-medium">{formData.contactoPrincipal.telefono}</p>
                </div>
                <div>
                  <Label>Email</Label>
                  <p className="text-[#222A59] font-medium">{formData.contactoPrincipal.email}</p>
                </div>
              </div>
            </div>

            {/* Ubicación */}
            <div className="space-y-4">
              <h3 className="font-semibold text-[#222A59] border-b pb-2">Ubicación</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Dirección</Label>
                  <p className="text-[#222A59] font-medium">{formData.direccion}</p>
                </div>
                <div>
                  <Label>Localidad</Label>
                  <p className="text-[#222A59] font-medium">{formData.localidad}</p>
                </div>
                <div>
                  <Label>Coordenadas</Label>
                  <p className="text-[#222A59] font-medium">{formData.geolocalizacion}</p>
                </div>
              </div>
            </div>

            {/* Actividad Comercial */}
            <div className="space-y-4">
              <h3 className="font-semibold text-[#222A59] border-b pb-2">Actividad Comercial</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Exporta</Label>
                  <p className="text-[#222A59] font-medium">{formData.exporta === "si" ? "Sí" : "No"}</p>
                </div>
                {formData.exporta === "si" && (
                  <div>
                    <Label>Destinos de Exportación</Label>
                    <p className="text-[#222A59] font-medium">{formData.destinoExportacion}</p>
                  </div>
                )}
                <div>
                  <Label>Importa</Label>
                  <p className="text-[#222A59] font-medium">{formData.importa === "si" ? "Sí" : "No"}</p>
                </div>
                <div>
                  <Label>Material de Promoción en 2 Idiomas</Label>
                  <p className="text-[#222A59] font-medium">{formData.materialPromocion === "si" ? "Sí" : "No"}</p>
                </div>
              </div>
            </div>

            {/* Certificaciones */}
            <div className="space-y-4">
              <h3 className="font-semibold text-[#222A59] border-b pb-2">Certificaciones</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Certificado MiPyME</Label>
                  <p className="text-[#222A59] font-medium">{formData.certificadoMiPyme === "si" ? "Sí" : "No"}</p>
                </div>
                <div className="md:col-span-2">
                  <Label>Otras Certificaciones</Label>
                  <p className="text-[#222A59] whitespace-pre-line">{formData.certificaciones}</p>
                </div>
              </div>
            </div>

            {/* Observaciones */}
            {formData.observaciones && (
              <div className="space-y-2">
                <h3 className="font-semibold text-[#222A59] border-b pb-2">Observaciones</h3>
                <p className="text-[#222A59]">{formData.observaciones}</p>
              </div>
            )}
          </div>
        </Card>

        {/* Action Buttons */}
        <Card className="p-6">
          <h3 className="font-semibold text-[#222A59] mb-4">Acciones</h3>
          <div className="flex flex-col sm:flex-row gap-4">
            <Button onClick={handleApprove} className="flex-1 bg-[#C3C840] hover:bg-[#C3C840]/90 text-[#222A59]">
              <CheckCircle className="w-4 h-4 mr-2" />
              Aprobar Empresa
            </Button>
            <Button onClick={handleReject} variant="destructive" className="flex-1">
              <XCircle className="w-4 h-4 mr-2" />
              Rechazar Solicitud
            </Button>
          </div>
          <p className="text-xs text-[#6B7280] mt-4">
            Al aprobar, la empresa recibirá un email de confirmación y podrá iniciar sesión en el sistema. Al rechazar,
            se enviará un email con el motivo del rechazo.
          </p>
        </Card>
      </div>
    </MainLayout>
  )
}
