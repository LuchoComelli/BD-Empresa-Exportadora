// frontend/src/pages/registro/RegistroEmpresa.tsx

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Building2, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { RegistroEmpresaFormData } from '@/types/registro';

// Importar pasos
import { RegistroStep1 } from '@/components/registro/RegistroStep1';
import { RegistroStep2 } from '@/components/registro/RegistroStep2';
import { RegistroStep3 } from '@/components/registro/RegistroStep3';
import { RegistroStep4 } from '@/components/registro/RegistroStep4';

export default function RegistroEmpresa() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<RegistroEmpresaFormData>({
    rubro: '',
    subRubro: '',
    razonSocial: '',
    cuit: '',
    productos: [
      { id: '1', nombre: '', posicionArancelaria: '', descripcion: '', capacidadProductiva: '' },
    ],
    contactoPrincipal: { nombre: '', cargo: '', telefono: '', email: '' },
    contactosSecundarios: [],
    direccion: '',
    provincia: '',
    departamento: '',
    municipio: '',
    localidad: '',
    paginaWeb: '',
    geolocalizacion: '',
    exporta: '',
    destinoExportacion: '',
    importa: '',
    materialPromocion: '',
    actividadesPromocion: [],
    observaciones: '',
    certificadoMiPyme: '',
    certificaciones: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Formulario enviado:', formData);
    alert('Registro enviado exitosamente (simulado)');
  };

  const nextStep = () => {
    if (step < 4) {
      setStep(step + 1);
      window.scrollTo(0, 0);
    }
  };

  const prevStep = () => {
    if (step > 1) {
      setStep(step - 1);
      window.scrollTo(0, 0);
    }
  };

  const updateFormData = (field: string, value: any) => {
    console.log('🔄 updateFormData llamado con:', { field, value }); // DEBUG
    
    setFormData((prevData) => {
      const newData = { ...prevData, [field]: value };
      console.log('✅ Nuevo formData:', newData); // DEBUG
      return newData;
    });
  };

  // DEBUG: Mostrar formData en cada render
  console.log('📊 Render de RegistroEmpresa, formData actual:', formData);

  return (
    <div className="min-h-screen bg-ministerio-light-gray">
      {/* Header */}
      <header className="border-b bg-ministerio-navy sticky top-0 z-50 shadow-md">
        <div className="container mx-auto px-4 py-3 md:py-4 flex items-center justify-between gap-2">
          <Link to="/" className="flex items-center gap-2 md:gap-3 min-w-0">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-white rounded-lg flex items-center justify-center flex-shrink-0">
              <Building2 className="w-6 h-6 md:w-7 md:h-7 text-ministerio-navy" />
            </div>
            <div className="min-w-0 hidden sm:block">
              <h1 className="text-sm md:text-lg font-bold text-white truncate">
                Ministerio de Desarrollo Productivo
              </h1>
              <p className="text-xs text-white/80 hidden md:block">Provincia de Catamarca</p>
            </div>
          </Link>
          <Link to="/">
            <Button
              variant="ghost"
              size="sm"
              className="text-white hover:text-white hover:bg-white/10 text-xs md:text-sm"
            >
              <ArrowLeft className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
              <span className="hidden sm:inline">Volver al Inicio</span>
              <span className="sm:hidden">Volver</span>
            </Button>
          </Link>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 md:py-12 max-w-4xl">
        {/* Progress Indicator */}
        <div className="mb-6 md:mb-8">
          <div className="flex items-center justify-between mb-3 md:mb-4">
            {[1, 2, 3, 4].map((s) => (
              <div key={s} className="flex items-center flex-1">
                <div
                  className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center text-sm md:text-base font-semibold ${
                    step >= s ? 'bg-ministerio-blue text-white' : 'bg-gray-200 text-gray-500'
                  }`}
                >
                  {step > s ? <CheckCircle2 className="w-4 h-4 md:w-6 md:h-6" /> : s}
                </div>
                {s < 4 && (
                  <div className={`flex-1 h-1 mx-1 md:mx-2 ${step > s ? 'bg-ministerio-blue' : 'bg-gray-200'}`} />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between text-xs md:text-sm text-ministerio-gray px-1">
            <span className="text-center flex-1">Información Básica</span>
            <span className="text-center flex-1">Contacto y Ubicación</span>
            <span className="text-center flex-1">Actividad Comercial</span>
            <span className="text-center flex-1">Certificaciones</span>
          </div>
        </div>

        {/* Form Content */}
        <Card className="p-5 md:p-8 bg-white">
          <form onSubmit={handleSubmit}>
            {step === 1 && (
              <RegistroStep1
                formData={formData}
                updateFormData={updateFormData}
                onNext={nextStep}
              />
            )}

            {step === 2 && (
              <RegistroStep2
                formData={formData}
                updateFormData={updateFormData}
                onNext={nextStep}
                onPrevious={prevStep}
              />
            )}

            {step === 3 && (
              <RegistroStep3
                formData={formData}
                updateFormData={updateFormData}
                onNext={nextStep}
                onPrevious={prevStep}
              />
            )}

            {step === 4 && (
              <RegistroStep4
                formData={formData}
                updateFormData={updateFormData}
                onPrevious={prevStep}
                onSubmit={handleSubmit}
                isSubmitting={false}
              />
            )}
          </form>
        </Card>
      </div>
    </div>
  );
}