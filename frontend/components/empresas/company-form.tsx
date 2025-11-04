"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { FormSteps } from "./form-steps"
import { ChevronLeft, ChevronRight, Save } from "lucide-react"

const steps = [
  { number: 1, title: "Información Básica", description: "Datos generales" },
  { number: 2, title: "Ubicación", description: "Dirección y contacto" },
  { number: 3, title: "Actividad Comercial", description: "Sector y productos" },
  { number: 4, title: "Certificaciones", description: "Calidad y estándares" },
]

export function CompanyForm() {
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState({
    // Step 1
    razonSocial: "",
    nombreFantasia: "",
    cuit: "",
    tipoSociedad: "",
    fechaConstitucion: "",
    email: "",
    telefono: "",
    sitioWeb: "",

    // Step 2
    departamento: "",
    municipio: "",
    localidad: "",
    direccion: "",
    codigoPostal: "",

    // Step 3
    sector: "",
    subsector: "",
    productos: "",
    posicionArancelaria: "",
    volumenProduccion: "",
    experienciaExportadora: "",

    // Step 4
    certificacionesNacionales: "",
    certificacionesInternacionales: "",
    estructuraInterna: "",
    presenciaDigital: "",
  })

  const handleInputChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value })
  }

  const handleNext = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSubmit = () => {
    console.log("Form submitted:", formData)
    // Handle form submission
  }

  return (
    <div className="space-y-6">
      <FormSteps steps={steps} currentStep={currentStep} />

      <Card>
        <CardHeader>
          <CardTitle className="text-[#222A59]">{steps[currentStep - 1].title}</CardTitle>
        </CardHeader>
        <CardContent>
          {currentStep === 1 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="razonSocial">
                  Razón Social <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="razonSocial"
                  placeholder="Ingrese la razón social"
                  value={formData.razonSocial}
                  onChange={(e) => handleInputChange("razonSocial", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="nombreFantasia">Nombre de Fantasía</Label>
                <Input
                  id="nombreFantasia"
                  placeholder="Ingrese el nombre de fantasía"
                  value={formData.nombreFantasia}
                  onChange={(e) => handleInputChange("nombreFantasia", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cuit">
                  CUIT <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="cuit"
                  placeholder="XX-XXXXXXXX-X"
                  value={formData.cuit}
                  onChange={(e) => handleInputChange("cuit", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tipoSociedad">Tipo de Sociedad</Label>
                <Select onValueChange={(value) => handleInputChange("tipoSociedad", value)}>
                  <SelectTrigger id="tipoSociedad">
                    <SelectValue placeholder="Seleccione el tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sa">S.A.</SelectItem>
                    <SelectItem value="srl">S.R.L.</SelectItem>
                    <SelectItem value="sas">S.A.S.</SelectItem>
                    <SelectItem value="monotributista">Monotributista</SelectItem>
                    <SelectItem value="autonomo">Autónomo</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="fechaConstitucion">Fecha de Constitución</Label>
                <Input
                  id="fechaConstitucion"
                  type="date"
                  value={formData.fechaConstitucion}
                  onChange={(e) => handleInputChange("fechaConstitucion", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">
                  Email <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="contacto@empresa.com"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="telefono">
                  Teléfono <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="telefono"
                  placeholder="+54 383 XXXXXXX"
                  value={formData.telefono}
                  onChange={(e) => handleInputChange("telefono", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="sitioWeb">Sitio Web</Label>
                <Input
                  id="sitioWeb"
                  placeholder="https://www.empresa.com"
                  value={formData.sitioWeb}
                  onChange={(e) => handleInputChange("sitioWeb", e.target.value)}
                />
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="departamento">
                  Departamento <span className="text-destructive">*</span>
                </Label>
                <Select onValueChange={(value) => handleInputChange("departamento", value)}>
                  <SelectTrigger id="departamento">
                    <SelectValue placeholder="Seleccione el departamento" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="capital">Capital</SelectItem>
                    <SelectItem value="andalgala">Andalgalá</SelectItem>
                    <SelectItem value="belen">Belén</SelectItem>
                    <SelectItem value="santa-maria">Santa María</SelectItem>
                    <SelectItem value="tinogasta">Tinogasta</SelectItem>
                    <SelectItem value="valle-viejo">Valle Viejo</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="municipio">
                  Municipio <span className="text-destructive">*</span>
                </Label>
                <Select onValueChange={(value) => handleInputChange("municipio", value)}>
                  <SelectTrigger id="municipio">
                    <SelectValue placeholder="Seleccione el municipio" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sfvc">San Fernando del Valle de Catamarca</SelectItem>
                    <SelectItem value="andalgala">Andalgalá</SelectItem>
                    <SelectItem value="belen">Belén</SelectItem>
                    <SelectItem value="santa-maria">Santa María</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="localidad">Localidad</Label>
                <Input
                  id="localidad"
                  placeholder="Ingrese la localidad"
                  value={formData.localidad}
                  onChange={(e) => handleInputChange("localidad", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="codigoPostal">Código Postal</Label>
                <Input
                  id="codigoPostal"
                  placeholder="XXXX"
                  value={formData.codigoPostal}
                  onChange={(e) => handleInputChange("codigoPostal", e.target.value)}
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="direccion">
                  Dirección <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="direccion"
                  placeholder="Calle, número, piso, departamento"
                  value={formData.direccion}
                  onChange={(e) => handleInputChange("direccion", e.target.value)}
                />
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="sector">
                  Sector <span className="text-destructive">*</span>
                </Label>
                <Select onValueChange={(value) => handleInputChange("sector", value)}>
                  <SelectTrigger id="sector">
                    <SelectValue placeholder="Seleccione el sector" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="agroindustria">Agroindustria</SelectItem>
                    <SelectItem value="textil">Textil</SelectItem>
                    <SelectItem value="mineria">Minería</SelectItem>
                    <SelectItem value="alimentos">Alimentos</SelectItem>
                    <SelectItem value="artesanias">Artesanías</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="subsector">Subsector</Label>
                <Input
                  id="subsector"
                  placeholder="Especifique el subsector"
                  value={formData.subsector}
                  onChange={(e) => handleInputChange("subsector", e.target.value)}
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="productos">
                  Productos / Servicios <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  id="productos"
                  placeholder="Describa los productos o servicios que ofrece"
                  rows={4}
                  value={formData.productos}
                  onChange={(e) => handleInputChange("productos", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="posicionArancelaria">Posición Arancelaria</Label>
                <Input
                  id="posicionArancelaria"
                  placeholder="XXXX.XX.XX"
                  value={formData.posicionArancelaria}
                  onChange={(e) => handleInputChange("posicionArancelaria", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="volumenProduccion">Volumen de Producción Anual</Label>
                <Input
                  id="volumenProduccion"
                  placeholder="Ej: 10000 unidades"
                  value={formData.volumenProduccion}
                  onChange={(e) => handleInputChange("volumenProduccion", e.target.value)}
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="experienciaExportadora">Experiencia Exportadora</Label>
                <Textarea
                  id="experienciaExportadora"
                  placeholder="Describa su experiencia en exportación (países, años, volúmenes)"
                  rows={3}
                  value={formData.experienciaExportadora}
                  onChange={(e) => handleInputChange("experienciaExportadora", e.target.value)}
                />
              </div>
            </div>
          )}

          {currentStep === 4 && (
            <div className="grid grid-cols-1 gap-6">
              <div className="space-y-2">
                <Label htmlFor="certificacionesNacionales">Certificaciones Nacionales</Label>
                <Textarea
                  id="certificacionesNacionales"
                  placeholder="Liste las certificaciones nacionales (Ej: SENASA, INTI, etc.)"
                  rows={3}
                  value={formData.certificacionesNacionales}
                  onChange={(e) => handleInputChange("certificacionesNacionales", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="certificacionesInternacionales">Certificaciones Internacionales</Label>
                <Textarea
                  id="certificacionesInternacionales"
                  placeholder="Liste las certificaciones internacionales (Ej: ISO, HACCP, etc.)"
                  rows={3}
                  value={formData.certificacionesInternacionales}
                  onChange={(e) => handleInputChange("certificacionesInternacionales", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="estructuraInterna">Estructura Interna</Label>
                <Textarea
                  id="estructuraInterna"
                  placeholder="Describa la estructura organizacional (cantidad de empleados, áreas, etc.)"
                  rows={3}
                  value={formData.estructuraInterna}
                  onChange={(e) => handleInputChange("estructuraInterna", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="presenciaDigital">Presencia Digital</Label>
                <Textarea
                  id="presenciaDigital"
                  placeholder="Describa su presencia en redes sociales, e-commerce, etc."
                  rows={3}
                  value={formData.presenciaDigital}
                  onChange={(e) => handleInputChange("presenciaDigital", e.target.value)}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Navigation Buttons */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={handlePrevious}
          disabled={currentStep === 1}
          className="gap-2 bg-transparent"
        >
          <ChevronLeft className="h-4 w-4" />
          Anterior
        </Button>

        <div className="flex gap-3">
          <Button variant="outline" className="gap-2 bg-transparent">
            <Save className="h-4 w-4" />
            Guardar Borrador
          </Button>

          {currentStep < steps.length ? (
            <Button onClick={handleNext} className="gap-2 bg-[#3259B5] hover:bg-[#222A59]">
              Siguiente
              <ChevronRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={handleSubmit} className="gap-2 bg-[#C3C840] hover:bg-[#66A29C] text-[#222A59]">
              <Save className="h-4 w-4" />
              Guardar Empresa
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
