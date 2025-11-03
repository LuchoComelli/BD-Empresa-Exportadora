import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, ChevronLeft, ChevronRight, Save } from 'lucide-react';
import type { RegistroEmpresaFormData } from '@/types/registro';

// Importar pasos del registro
import { RegistroStep1 } from '@/components/registro/RegistroStep1';
import { RegistroStep2 } from '@/components/registro/RegistroStep2';
import { RegistroStep3 } from '@/components/registro/RegistroStep3';
import { RegistroStep4 } from '@/components/registro/RegistroStep4';

export function CompanyForm() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      console.log('Empresa creada:', formData);
      // Aquí irá la llamada al backend para crear la empresa
      alert('Empresa creada exitosamente');
      navigate('/empresas');
    } catch (error) {
      console.error('Error al crear empresa:', error);
      alert('Error al crear la empresa');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveDraft = () => {
    console.log('Guardando borrador:', formData);
    alert('Borrador guardado exitosamente');
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
    setFormData((prevData) => ({
      ...prevData,
      [field]: value,
    }));
  };

  return (
    <div className="space-y-6">
      {/* Progress Indicator */}
      <div className="mb-6 md:mb-8">
        <div className="flex items-center justify-between mb-3 md:mb-4">
          {[1, 2, 3, 4].map((s) => (
            <div key={s} className="flex items-center flex-1">
              <div
                className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center text-sm md:text-base font-semibold ${
                  step >= s ? 'bg-[#3259B5] text-white' : 'bg-gray-200 text-gray-500'
                }`}
              >
                {step > s ? <CheckCircle2 className="w-4 h-4 md:w-6 md:h-6" /> : s}
              </div>
              {s < 4 && (
                <div className={`flex-1 h-1 mx-1 md:mx-2 ${step > s ? 'bg-[#3259B5]' : 'bg-gray-200'}`} />
              )}
            </div>
          ))}
        </div>
        <div className="flex justify-between text-xs md:text-sm text-[#6B7280] px-1">
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
              isSubmitting={isSubmitting}
            />
          )}
        </form>
      </Card>

      {/* Navigation Buttons */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={prevStep}
          disabled={step === 1}
          className="gap-2 bg-transparent"
        >
          <ChevronLeft className="h-4 w-4" />
          Anterior
        </Button>

        <div className="flex gap-3">
          <Button 
            variant="outline" 
            onClick={handleSaveDraft}
            className="gap-2 bg-transparent"
            type="button"
          >
            <Save className="h-4 w-4" />
            Guardar Borrador
          </Button>

          {step < 4 ? (
            <Button 
              onClick={nextStep} 
              className="gap-2 bg-[#3259B5] hover:bg-[#222A59]"
              type="button"
            >
              Siguiente
              <ChevronRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button 
              onClick={handleSubmit} 
              disabled={isSubmitting}
              className="gap-2 bg-[#C3C840] hover:bg-[#C3C840]/90 text-[#222A59]"
              type="submit"
            >
              <Save className="h-4 w-4" />
              {isSubmitting ? 'Guardando...' : 'Guardar Empresa'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}