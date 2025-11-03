import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Building2, Phone, Mail } from 'lucide-react';

// Mock data for companies
const empresas = [
  {
    id: 1,
    nombre: 'Vinos del Valle S.A.',
    categoria: 'Exportadora',
    sector: 'Alimentos y Bebidas',
    ubicacion: 'San Fernando del Valle de Catamarca',
    lat: -28.4696,
    lng: -65.7795,
    telefono: '+54 383 4123456',
    email: 'contacto@vinosdelvalle.com',
  },
  {
    id: 2,
    nombre: 'Textiles Andinos',
    categoria: 'Potencial Exportadora',
    sector: 'Textil',
    ubicacion: 'Andalgalá',
    lat: -27.5833,
    lng: -66.3167,
    telefono: '+54 383 4234567',
    email: 'info@textilesandinos.com',
  },
  {
    id: 3,
    nombre: 'Minerales del Norte',
    categoria: 'Exportadora',
    sector: 'Minería',
    ubicacion: 'Belén',
    lat: -27.6458,
    lng: -67.0306,
    telefono: '+54 383 4345678',
    email: 'ventas@mineralesdelnorte.com',
  },
];

export default function Mapa() {
  const [selectedEmpresa, setSelectedEmpresa] = useState(empresas[0]);

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
          <h1 className="text-3xl font-bold text-ministerio-navy">Mapa de Empresas</h1>
          <p className="text-ministerio-gray mt-2">Visualiza la ubicación geográfica de las empresas exportadoras</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-ministerio-navy">Mapa Interactivo</CardTitle>
              <CardDescription>Haz clic en los marcadores para ver detalles de cada empresa</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-100 rounded-lg h-[500px] flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-ministerio-light-blue/20 to-ministerio-blue/20" />
                <div className="relative z-10 text-center space-y-4">
                  <MapPin className="h-16 w-16 text-ministerio-blue mx-auto" />
                  <div>
                    <p className="text-lg font-semibold text-ministerio-navy">Mapa de Catamarca</p>
                    <p className="text-sm text-ministerio-gray">
                      Integración con Leaflet para visualización de ubicaciones
                    </p>
                  </div>
                  <div className="flex gap-4 justify-center flex-wrap">
                    {empresas.map((empresa) => (
                      <button
                        key={empresa.id}
                        onClick={() => setSelectedEmpresa(empresa)}
                        className={`flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow ${
                          selectedEmpresa.id === empresa.id ? 'ring-2 ring-ministerio-blue' : ''
                        }`}
                      >
                        <MapPin className="h-4 w-4 text-ministerio-blue" />
                        <span className="text-sm font-medium">{empresa.nombre}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-ministerio-navy">Detalles de Empresa</CardTitle>
              <CardDescription>Información de la empresa seleccionada</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold text-lg text-ministerio-navy">{selectedEmpresa.nombre}</h3>
                <Badge className={`mt-2 ${getCategoriaColor(selectedEmpresa.categoria)}`}>
                  {selectedEmpresa.categoria}
                </Badge>
              </div>

              <div className="space-y-3 pt-4 border-t border-gray-200">
                <div className="flex items-start gap-3">
                  <Building2 className="h-5 w-5 text-ministerio-blue mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-ministerio-gray">Sector</p>
                    <p className="text-sm text-gray-900">{selectedEmpresa.sector}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-ministerio-blue mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-ministerio-gray">Ubicación</p>
                    <p className="text-sm text-gray-900">{selectedEmpresa.ubicacion}</p>
                    <p className="text-xs text-ministerio-gray mt-1">
                      Lat: {selectedEmpresa.lat}, Lng: {selectedEmpresa.lng}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Phone className="h-5 w-5 text-ministerio-blue mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-ministerio-gray">Teléfono</p>
                    <p className="text-sm text-gray-900">{selectedEmpresa.telefono}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Mail className="h-5 w-5 text-ministerio-blue mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-ministerio-gray">Email</p>
                    <p className="text-sm text-gray-900">{selectedEmpresa.email}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-ministerio-navy">Leyenda del Mapa</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 rounded-full bg-ministerio-yellow" />
                <div>
                  <p className="font-semibold text-sm">Exportadora</p>
                  <p className="text-xs text-ministerio-gray">12-18 puntos</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 rounded-full bg-orange-500" />
                <div>
                  <p className="font-semibold text-sm">Potencial Exportadora</p>
                  <p className="text-xs text-ministerio-gray">6-11 puntos</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 rounded-full bg-ministerio-light-blue" />
                <div>
                  <p className="font-semibold text-sm">Etapa Inicial</p>
                  <p className="text-xs text-ministerio-gray">0-5 puntos</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}