// frontend/src/components/registro/RegistroStep2.tsx

import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight, Plus, X } from 'lucide-react';
import { LocationPicker } from '@/components/map/LocationPicker';
import { PROVINCIAS_ARGENTINA, DEPARTAMENTOS_DATA, type DepartamentoKey } from '@/data/registroData';
import type { RegistroEmpresaFormData, ContactoRegistro } from '@/types/registro';

interface RegistroStep2Props {
  formData: RegistroEmpresaFormData;
  updateFormData: (field: string, value: any) => void;
  onNext: () => void;
  onPrevious: () => void;
}

export function RegistroStep2({ formData, updateFormData, onNext, onPrevious }: RegistroStep2Props) {
  const toUpperCase = (value: string) => value.toUpperCase();

  const municipiosDisponibles = formData.departamento
    ? Object.entries(
        DEPARTAMENTOS_DATA[formData.departamento as DepartamentoKey]?.municipios || {}
      )
    : [];

  const localidadesDisponibles = formData.municipio && formData.departamento
    ? DEPARTAMENTOS_DATA[formData.departamento as DepartamentoKey]?.municipios[
        formData.municipio as keyof typeof DEPARTAMENTOS_DATA.capital.municipios
      ]?.localidades || []
    : [];

  const agregarContacto = () => {
    if (formData.contactosSecundarios.length < 2) {
      const nuevosContactos = [
        ...formData.contactosSecundarios,
        { id: Date.now().toString(), nombre: '', cargo: '', telefono: '', email: '' },
      ];
      updateFormData('contactosSecundarios', nuevosContactos);
    }
  };

  const eliminarContacto = (id: string) => {
    const nuevosContactos = formData.contactosSecundarios.filter((c) => c.id !== id);
    updateFormData('contactosSecundarios', nuevosContactos);
  };

  const actualizarContacto = (id: string, field: keyof ContactoRegistro, value: string) => {
    const nuevosContactos = formData.contactosSecundarios.map((c) =>
      c.id === id ? { ...c, [field]: value } : c
    );
    updateFormData('contactosSecundarios', nuevosContactos);
  };

  const actualizarContactoPrincipal = (field: keyof ContactoRegistro, value: string) => {
    updateFormData('contactoPrincipal', { ...formData.contactoPrincipal, [field]: value });
  };

  const handleNext = () => {
    // Validaciones
    if (
      !formData.contactoPrincipal.nombre ||
      !formData.contactoPrincipal.cargo ||
      !formData.contactoPrincipal.telefono ||
      !formData.contactoPrincipal.email
    ) {
      alert('Por favor complete todos los datos del contacto principal');
      return;
    }
    if (!formData.direccion) {
      alert('Por favor ingrese la dirección');
      return;
    }
    if (!formData.provincia || !formData.departamento || !formData.municipio || !formData.localidad) {
      alert('Por favor complete la ubicación completa');
      return;
    }
    if (!formData.geolocalizacion) {
      alert('Por favor seleccione la ubicación en el mapa');
      return;
    }

    onNext();
  };

  return (
    <div className="space-y-4 md:space-y-6">
      <div>
        <h2 className="text-xl md:text-2xl font-bold text-[#222A59] mb-2">Contacto y Ubicación</h2>
        <p className="text-sm md:text-base text-[#6B7280]">
          Información de contacto y ubicación de tu empresa
        </p>
      </div>

      <div className="space-y-6">
        {/* Contacto Principal */}
        <div className="space-y-4 p-4 border border-[#629BD2]/30 rounded-lg bg-[#629BD2]/5">
          <h3 className="font-semibold text-[#222A59] flex items-center gap-2">Contacto Principal</h3>

          <div>
            <Label htmlFor="contacto">
              Persona de Contacto <span className="text-red-500">*</span>
            </Label>
            <Input
              id="contacto"
              value={formData.contactoPrincipal.nombre}
              onChange={(e) => actualizarContactoPrincipal('nombre', toUpperCase(e.target.value))}
              placeholder="NOMBRE COMPLETO"
              className="uppercase"
            />
          </div>

          <div>
            <Label htmlFor="cargo">
              Cargo <span className="text-red-500">*</span>
            </Label>
            <Input
              id="cargo"
              value={formData.contactoPrincipal.cargo}
              onChange={(e) => actualizarContactoPrincipal('cargo', toUpperCase(e.target.value))}
              placeholder="EJ: GERENTE GENERAL, DIRECTOR, PROPIETARIO"
              className="uppercase"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="telefono">
                Teléfono <span className="text-red-500">*</span>
              </Label>
              <Input
                id="telefono"
                type="tel"
                value={formData.contactoPrincipal.telefono}
                onChange={(e) => actualizarContactoPrincipal('telefono', e.target.value)}
                placeholder="(0383) 4XXXXXX"
              />
            </div>

            <div>
              <Label htmlFor="mail">
                Correo Electrónico <span className="text-red-500">*</span>
              </Label>
              <Input
                id="mail"
                type="email"
                value={formData.contactoPrincipal.email}
                onChange={(e) => actualizarContactoPrincipal('email', e.target.value)}
                placeholder="contacto@empresa.com"
              />
            </div>
          </div>
        </div>

        {/* Contactos Secundarios */}
        {formData.contactosSecundarios.map((contacto, index) => (
          <div
            key={contacto.id}
            className="space-y-4 p-4 border border-[#66A29C]/30 rounded-lg bg-[#66A29C]/5"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-[#222A59]">
                Contacto {index === 0 ? 'Secundario' : 'Terciario'}
              </h3>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => eliminarContacto(contacto.id!)}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div>
              <Label>Persona de Contacto</Label>
              <Input
                value={contacto.nombre}
                onChange={(e) =>
                  actualizarContacto(contacto.id!, 'nombre', toUpperCase(e.target.value))
                }
                placeholder="NOMBRE COMPLETO"
                className="uppercase"
              />
            </div>

            <div>
              <Label>Cargo</Label>
              <Input
                value={contacto.cargo}
                onChange={(e) => actualizarContacto(contacto.id!, 'cargo', toUpperCase(e.target.value))}
                placeholder="EJ: SUBJEFE, ENCARGADO DE VENTAS"
                className="uppercase"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Teléfono</Label>
                <Input
                  type="tel"
                  value={contacto.telefono}
                  onChange={(e) => actualizarContacto(contacto.id!, 'telefono', e.target.value)}
                  placeholder="(0383) 4XXXXXX"
                />
              </div>

              <div>
                <Label>Correo Electrónico</Label>
                <Input
                  type="email"
                  value={contacto.email}
                  onChange={(e) => actualizarContacto(contacto.id!, 'email', e.target.value)}
                  placeholder="contacto@empresa.com"
                />
              </div>
            </div>
          </div>
        ))}

        {formData.contactosSecundarios.length < 2 && (
          <Button
            type="button"
            variant="outline"
            onClick={agregarContacto}
            className="w-full border-dashed border-[#3259B5] text-[#3259B5] hover:bg-[#3259B5]/5 bg-transparent"
          >
            <Plus className="w-4 h-4 mr-2" />
            Agregar Contacto {formData.contactosSecundarios.length === 0 ? 'Secundario' : 'Terciario'}
          </Button>
        )}

        {/* Domicilio */}
        <div className="space-y-4 pt-4 border-t">
          <h3 className="font-semibold text-[#222A59]">Domicilio del Establecimiento</h3>

          <div>
            <Label htmlFor="direccion">
              Dirección <span className="text-red-500">*</span>
            </Label>
            <Input
              id="direccion"
              value={formData.direccion}
              onChange={(e) => updateFormData('direccion', toUpperCase(e.target.value))}
              placeholder="CALLE, NÚMERO"
              className="uppercase"
            />
          </div>

          <div>
            <Label htmlFor="provincia">
              Provincia <span className="text-red-500">*</span>
            </Label>
            <Select
              value={formData.provincia}
              onValueChange={(value) => updateFormData('provincia', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona la provincia" />
              </SelectTrigger>
              <SelectContent>
                {PROVINCIAS_ARGENTINA.map((provincia) => (
                  <SelectItem key={provincia} value={provincia}>
                    {provincia}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="departamento">
                Departamento <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.departamento}
                onValueChange={(value) => {
                  updateFormData('departamento', value);
                  updateFormData('municipio', '');
                  updateFormData('localidad', '');
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(DEPARTAMENTOS_DATA).map(([key, data]) => (
                    <SelectItem key={key} value={key}>
                      {data.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="municipio">
                Municipio <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.municipio}
                onValueChange={(value) => {
                  updateFormData('municipio', value);
                  updateFormData('localidad', '');
                }}
                disabled={!formData.departamento}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona" />
                </SelectTrigger>
                <SelectContent>
                  {municipiosDisponibles.map(([key, data]) => (
                    <SelectItem key={key} value={key}>
                      {data.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="localidad">
                Localidad <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.localidad}
                onValueChange={(value) => updateFormData('localidad', value)}
                disabled={!formData.municipio}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona" />
                </SelectTrigger>
                <SelectContent>
                  {localidadesDisponibles.map((localidad) => (
                    <SelectItem key={localidad} value={localidad}>
                      {localidad}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="paginaWeb">Página Web</Label>
            <Input
              id="paginaWeb"
              type="url"
              value={formData.paginaWeb}
              onChange={(e) => updateFormData('paginaWeb', e.target.value)}
              placeholder="https://www.tuempresa.com"
            />
          </div>

          <div>
            <Label htmlFor="geolocalizacion">
              Geolocalización <span className="text-red-500">*</span>
            </Label>
            <p className="text-xs text-[#6B7280] mb-3">
              Haz clic en el mapa o arrastra el marcador para seleccionar la ubicación de tu empresa
            </p>
            <LocationPicker
              value={formData.geolocalizacion}
              onChange={(coords) => updateFormData('geolocalizacion', coords)}
            />
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex flex-col sm:flex-row justify-between gap-3">
        <Button
          type="button"
          onClick={onPrevious}
          variant="outline"
          className="border-[#3259B5] text-[#3259B5] bg-transparent text-sm md:text-base"
        >
          <ArrowLeft className="mr-2 w-4 h-4" />
          Anterior
        </Button>
        <Button
          type="button"
          onClick={handleNext}
          className="bg-[#3259B5] hover:bg-[#3259B5]/90 text-white text-sm md:text-base"
        >
          Siguiente
          <ArrowRight className="ml-2 w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}