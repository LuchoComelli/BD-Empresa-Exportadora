// frontend/src/components/registro/RegistroStep4.tsx

import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';
import type { RegistroEmpresaFormData } from '@/types/registro';

interface RegistroStep4Props {
  formData: RegistroEmpresaFormData;
  updateFormData: (field: string, value: any) => void;
  onPrevious: () => void;
  onSubmit: (e: React.FormEvent) => void;
  isSubmitting: boolean;
}

export function RegistroStep4({
  formData,
  updateFormData,
  onPrevious,
  onSubmit,
  isSubmitting,
}: RegistroStep4Props) {
  const toUpperCase = (value: string) => value.toUpperCase();

  return (
    <div className="space-y-4 md:space-y-6">
      <div>
        <h2 className="text-xl md:text-2xl font-bold text-[#222A59] mb-2">Certificaciones</h2>
        <p className="text-sm md:text-base text-[#6B7280]">
          Certificaciones y acreditaciones de tu empresa
        </p>
      </div>

      <div className="space-y-4">
        {/* Certificado MiPyME */}
        <div>
          <Label htmlFor="certificadoMiPyme">Certificado MiPyME</Label>
          <Select
            value={formData.certificadoMiPyme}
            onValueChange={(value) => updateFormData('certificadoMiPyme', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="¿Cuenta con certificado MiPyME?" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="si">Sí, vigente</SelectItem>
              <SelectItem value="vencido">Sí, vencido</SelectItem>
              <SelectItem value="en-tramite">En trámite</SelectItem>
              <SelectItem value="no">No</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Certificaciones */}
        <div>
          <Label htmlFor="certificaciones">Certificaciones</Label>
          <Textarea
            id="certificaciones"
            value={formData.certificaciones}
            onChange={(e) => updateFormData('certificaciones', toUpperCase(e.target.value))}
            placeholder="LISTA DE CERTIFICACIONES (ISO, HACCP, ORGÁNICO, ETC.)"
            rows={6}
            className="uppercase"
          />
          <p className="text-xs text-[#6B7280] mt-1">
            Incluye certificaciones de calidad, ambientales, de seguridad alimentaria, etc.
          </p>
        </div>

        {/* Información Importante */}
        <div className="bg-[#629BD2]/10 border border-[#629BD2]/20 rounded-lg p-4">
          <h4 className="font-semibold text-[#222A59] mb-2">Información importante</h4>
          <p className="text-sm text-[#6B7280] leading-relaxed">
            Una vez enviado el formulario, nuestro equipo revisará la información y se pondrá en
            contacto contigo para completar el proceso de registro y realizar la evaluación de tu
            perfil exportador.
          </p>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex flex-col sm:flex-row justify-between gap-3">
        <Button
          type="button"
          onClick={onPrevious}
          variant="outline"
          className="border-[#3259B5] text-[#3259B5] bg-transparent text-sm md:text-base"
          disabled={isSubmitting}
        >
          <ArrowLeft className="mr-2 w-4 h-4" />
          Anterior
        </Button>
        <Button
          type="submit"
          onClick={onSubmit}
          className="bg-[#C3C840] hover:bg-[#C3C840]/90 text-[#222A59] font-semibold text-sm md:text-base"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#222A59] mr-2"></div>
              Enviando...
            </>
          ) : (
            <>
              <CheckCircle2 className="mr-2 w-4 h-4" />
              Enviar Registro
            </>
          )}
        </Button>
      </div>
    </div>
  );
}