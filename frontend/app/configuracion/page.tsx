import { MainLayout } from "@/components/layout/main-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Save, Bell, Lock, Database, Mail, Globe } from "lucide-react"

export default function ConfiguracionPage() {
  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-[#222A59]">Configuración del Sistema</h1>
          <p className="text-muted-foreground mt-2">Administra las preferencias y configuraciones generales</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-[#222A59] flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Configuración General
              </CardTitle>
              <CardDescription>Ajustes básicos del sistema</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="nombre-sistema">Nombre del Sistema</Label>
                <Input id="nombre-sistema" defaultValue="Sistema de Gestión de Empresas Exportadoras" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="institucion">Institución</Label>
                <Input id="institucion" defaultValue="Dirección de Intercambio Comercial Internacional y Regional - Catamarca" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email-contacto">Email de Contacto</Label>
                <Input id="email-contacto" type="email" defaultValue="contacto@catamarca.gob.ar" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="telefono">Teléfono</Label>
                <Input id="telefono" defaultValue="+54 383 4123456" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-[#222A59] flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notificaciones
              </CardTitle>
              <CardDescription>Preferencias de notificaciones</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Email</Label>
                  <p className="text-xs text-muted-foreground">Recibir notificaciones por email</p>
                </div>
                <Switch defaultChecked />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Nuevas Empresas</Label>
                  <p className="text-xs text-muted-foreground">Notificar al registrar empresas</p>
                </div>
                <Switch defaultChecked />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Reportes</Label>
                  <p className="text-xs text-muted-foreground">Reportes semanales automáticos</p>
                </div>
                <Switch />
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-[#222A59] flex items-center gap-2">
              <Lock className="h-5 w-5" />
              Seguridad
            </CardTitle>
            <CardDescription>Configuración de seguridad y acceso</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-0.5">
                  <Label>Autenticación de dos factores</Label>
                  <p className="text-xs text-muted-foreground">Seguridad adicional para el acceso</p>
                </div>
                <Switch />
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-0.5">
                  <Label>Sesiones múltiples</Label>
                  <p className="text-xs text-muted-foreground">Permitir múltiples sesiones activas</p>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-0.5">
                  <Label>Registro de actividad</Label>
                  <p className="text-xs text-muted-foreground">Guardar logs de acciones</p>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-0.5">
                  <Label>Expiración de sesión</Label>
                  <p className="text-xs text-muted-foreground">Cerrar sesión automáticamente</p>
                </div>
                <Switch defaultChecked />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-[#222A59] flex items-center gap-2">
              <Database className="h-5 w-5" />
              Base de Datos
            </CardTitle>
            <CardDescription>Mantenimiento y respaldo de datos</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button variant="outline" className="h-auto py-4 flex-col gap-2 bg-transparent">
                <Database className="h-6 w-6 text-[#3259B5]" />
                <div className="text-center">
                  <div className="font-semibold">Crear Respaldo</div>
                  <div className="text-xs text-muted-foreground">Backup manual</div>
                </div>
              </Button>

              <Button variant="outline" className="h-auto py-4 flex-col gap-2 bg-transparent">
                <Mail className="h-6 w-6 text-[#66A29C]" />
                <div className="text-center">
                  <div className="font-semibold">Exportar Datos</div>
                  <div className="text-xs text-muted-foreground">Descargar base de datos</div>
                </div>
              </Button>

              <Button variant="outline" className="h-auto py-4 flex-col gap-2 bg-transparent">
                <Lock className="h-6 w-6 text-[#C0217E]" />
                <div className="text-center">
                  <div className="font-semibold">Restaurar</div>
                  <div className="text-xs text-muted-foreground">Desde respaldo</div>
                </div>
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Button variant="outline">Cancelar</Button>
          <Button className="bg-[#3259B5] hover:bg-[#222A59] gap-2">
            <Save className="h-4 w-4" />
            Guardar Cambios
          </Button>
        </div>
      </div>
    </MainLayout>
  )
}
