import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { MatrizClasificacion } from '@/components/matriz/matriz-clasificacion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Building2, MapPin, Phone, Mail } from 'lucide-react';

const empresas = [
  {
    id: '1',
    nombre: 'Vinos del Valle S.A.',
    rubro: 'Alimentos y Bebidas',
    ubicacion: 'Capital, Catamarca',
    telefono: '+54 383 4123456',
    email: 'contacto@vinosdelvalle.com',
    categoria: 'Exportadora',
  },
  {
    id: '2',
    nombre: 'Textiles Andinos',
    rubro: 'Textil',
    ubicacion: 'Andalgalá, Catamarca',
    telefono: '+54 383 4234567',
    email: 'info@textilesandinos.com',
    categoria: 'Potencial Exportadora',
  },
  {
    id: '3',
    nombre: 'Minerales del Norte',
    rubro: 'Minería',
    ubicacion: 'Belén, Catamarca',
    telefono: '+54 383 4345678',
    email: 'ventas@mineralesdelnorte.com',
    categoria: 'Etapa Inicial',
  },
];

export default function Matriz() {
  const [empresaSeleccionada, setEmpresaSeleccionada] = useState<string>('');

  const empresaActual = empresas.find((e) => e.id === empresaSeleccionada);

  const getCategoriaColor = (categoria: string) => {
    switch (categoria) {
      case 'Exportadora':
        return 'bg-ministerio-yellow text-ministerio-navy';
      case 'Potencial Exportadora':
        return 'bg-orange-500 text-white';
      case 'Etapa Inicial':
        return 'bg-ministerio-light-blue text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-ministerio-navy">Matriz de Clasificación</h1>
          <p className="text-ministerio-gray mt-1 text-sm md:text-base">
            Sistema de evaluación del perfil exportador de empresas
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-ministerio-navy">Seleccionar Empresa</CardTitle>
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
                      <Building2 className="h-4 w-4 text-ministerio-blue" />
                      <span>{empresa.nombre}</span>
                      <span className="text-xs text-ministerio-gray">- {empresa.rubro}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {empresaActual && (
              <div className="mt-4 p-4 bg-ministerio-light-blue/5 border border-ministerio-light-blue/20 rounded-lg">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-lg text-ministerio-navy">{empresaActual.nombre}</h3>
                      <Badge className={getCategoriaColor(empresaActual.categoria)}>{empresaActual.categoria}</Badge>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-ministerio-gray">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-ministerio-blue" />
                        <span>{empresaActual.rubro}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-ministerio-blue" />
                        <span>{empresaActual.ubicacion}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-ministerio-blue" />
                        <span>{empresaActual.telefono}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-ministerio-blue" />
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
          <MatrizClasificacion empresaId={empresaSeleccionada} />
        ) : (
          <Card>
            <CardContent className="py-12">
              <div className="text-center space-y-3">
                <Building2 className="h-16 w-16 text-ministerio-blue/30 mx-auto" />
                <div>
                  <p className="text-lg font-semibold text-ministerio-navy">Selecciona una empresa</p>
                  <p className="text-sm text-ministerio-gray mt-1">
                    Elige una empresa del selector superior para evaluar su perfil exportador
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </MainLayout>
  );
}