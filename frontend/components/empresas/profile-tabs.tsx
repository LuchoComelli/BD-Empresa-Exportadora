"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface ProfileTabsProps {
  companyId: string
}

export function ProfileTabs({ companyId }: ProfileTabsProps) {
  const [activeTab, setActiveTab] = useState("general")

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
      <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
        <TabsTrigger value="general">Información General</TabsTrigger>
        <TabsTrigger value="comercial">Actividad Comercial</TabsTrigger>
        <TabsTrigger value="certificaciones">Certificaciones</TabsTrigger>
        <TabsTrigger value="historial">Historial</TabsTrigger>
      </TabsList>

      <TabsContent value="general" className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-[#222A59]">Datos de la Empresa</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Razón Social</p>
              <p className="text-base font-semibold text-foreground mt-1">Vitivinícola del Valle S.A.</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">CUIT</p>
              <p className="text-base font-semibold text-foreground mt-1">30-12345678-9</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Tipo de Sociedad</p>
              <p className="text-base font-semibold text-foreground mt-1">S.A.</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Fecha de Constitución</p>
              <p className="text-base font-semibold text-foreground mt-1">15/03/2010</p>
            </div>
            <div className="md:col-span-2">
              <p className="text-sm font-medium text-muted-foreground">Dirección</p>
              <p className="text-base font-semibold text-foreground mt-1">
                Av. Belgrano 1234, San Fernando del Valle de Catamarca, Catamarca (4700)
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-[#222A59]">Estructura Interna</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground leading-relaxed">
              La empresa cuenta con 45 empleados distribuidos en las áreas de producción, administración, ventas y
              logística. Posee un departamento de comercio exterior con 3 especialistas dedicados a la gestión de
              exportaciones.
            </p>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="comercial" className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-[#222A59]">Información Comercial</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Sector</p>
              <p className="text-base font-semibold text-foreground mt-1">Agroindustria</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Subsector</p>
              <p className="text-base font-semibold text-foreground mt-1">Vitivinicultura</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Posición Arancelaria</p>
              <p className="text-base font-semibold text-foreground mt-1">2204.21.00</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Volumen de Producción Anual</p>
              <p className="text-base font-semibold text-foreground mt-1">500,000 litros</p>
            </div>
            <div className="md:col-span-2">
              <p className="text-sm font-medium text-muted-foreground">Productos / Servicios</p>
              <p className="text-base text-foreground mt-1 leading-relaxed">
                Producción y comercialización de vinos finos de alta gama. Variedades: Malbec, Cabernet Sauvignon,
                Torrontés. Líneas premium y reserva.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-[#222A59]">Experiencia Exportadora</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground leading-relaxed mb-4">
              La empresa exporta desde 2015 a diversos mercados internacionales. Principales destinos: Brasil, Estados
              Unidos, China y países de la Unión Europea. Volumen de exportación anual: USD 2,500,000.
            </p>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">Brasil</Badge>
              <Badge variant="outline">Estados Unidos</Badge>
              <Badge variant="outline">China</Badge>
              <Badge variant="outline">Alemania</Badge>
              <Badge variant="outline">Reino Unido</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-[#222A59]">Presencia Digital</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Sitio web corporativo con e-commerce integrado. Presencia activa en redes sociales: Instagram (15K
              seguidores), Facebook (8K seguidores), LinkedIn (empresa verificada). Catálogo digital disponible en 3
              idiomas.
            </p>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="certificaciones" className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-[#222A59]">Certificaciones Nacionales</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start gap-4 p-4 bg-muted/30 rounded-lg">
                <div className="w-12 h-12 bg-[#C3C840]/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-xl font-bold text-[#C3C840]">✓</span>
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-foreground">SENASA</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    Certificación de calidad alimentaria - Vigente hasta 2025
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4 p-4 bg-muted/30 rounded-lg">
                <div className="w-12 h-12 bg-[#C3C840]/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-xl font-bold text-[#C3C840]">✓</span>
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-foreground">INV</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    Instituto Nacional de Vitivinicultura - Registro actualizado
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-[#222A59]">Certificaciones Internacionales</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start gap-4 p-4 bg-muted/30 rounded-lg">
                <div className="w-12 h-12 bg-[#3259B5]/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-xl font-bold text-[#3259B5]">✓</span>
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-foreground">ISO 9001:2015</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    Sistema de Gestión de Calidad - Vigente hasta 2026
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4 p-4 bg-muted/30 rounded-lg">
                <div className="w-12 h-12 bg-[#3259B5]/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-xl font-bold text-[#3259B5]">✓</span>
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-foreground">HACCP</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    Análisis de Peligros y Puntos Críticos de Control - Vigente
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4 p-4 bg-muted/30 rounded-lg">
                <div className="w-12 h-12 bg-[#3259B5]/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-xl font-bold text-[#3259B5]">✓</span>
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-foreground">Orgánico Certificado</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    Certificación de producción orgánica - Vigente hasta 2025
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="historial" className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-[#222A59]">Historial de Actividades</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                {
                  date: "15/01/2024",
                  action: "Actualización de datos",
                  user: "Admin Sistema",
                  description: "Se actualizó la información de contacto",
                },
                {
                  date: "10/01/2024",
                  action: "Evaluación de perfil",
                  user: "Analista Comercio Exterior",
                  description: "Se realizó evaluación de matriz de clasificación - Puntaje: 16/18",
                },
                {
                  date: "05/01/2024",
                  action: "Registro de certificación",
                  user: "Admin Sistema",
                  description: "Se agregó certificación ISO 9001:2015",
                },
                {
                  date: "20/12/2023",
                  action: "Creación de perfil",
                  user: "Admin Sistema",
                  description: "Se creó el perfil de la empresa en el sistema",
                },
              ].map((item, index) => (
                <div key={index} className="flex gap-4 pb-4 border-b border-border last:border-0">
                  <div className="flex-shrink-0 w-24 text-sm text-muted-foreground">{item.date}</div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-foreground">{item.action}</h4>
                    <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
                    <p className="text-xs text-muted-foreground mt-2">Por: {item.user}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  )
}
