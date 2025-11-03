// frontend/src/components/registro/RegistroStep1.tsx

import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { ArrowRight, Plus, X } from 'lucide-react';
import { RUBROS_DATA, type RubroKey } from '@/data/registroData';
import type { RegistroEmpresaFormData, ProductoRegistro } from '@/types/registro';

interface RegistroStep1Props {
  formData: RegistroEmpresaFormData;
  updateFormData: (field: string, value: any) => void;
  onNext: () => void;
}

export function RegistroStep1({ formData, updateFormData, onNext }: RegistroStep1Props) {
  const toUpperCase = (value: string) => value.toUpperCase();

  const subRubrosDisponibles = formData.rubro
    ? RUBROS_DATA[formData.rubro as RubroKey]?.subRubros || []
    : [];

  const agregarProducto = () => {
    const nuevosProductos = [
      ...formData.productos,
      {
        id: Date.now().toString(),
        nombre: '',
        posicionArancelaria: '',
        descripcion: '',
        capacidadProductiva: '',
      },
    ];
    updateFormData('productos', nuevosProductos);
  };

  const eliminarProducto = (id: string) => {
    if (formData.productos.length > 1) {
      const nuevosProductos = formData.productos.filter((p) => p.id !== id);
      updateFormData('productos', nuevosProductos);
    }
  };

  const actualizarProducto = (id: string, field: keyof ProductoRegistro, value: string) => {
    const nuevosProductos = formData.productos.map((p) =>
      p.id === id ? { ...p, [field]: value } : p
    );
    updateFormData('productos', nuevosProductos);
  };

  const handleNext = () => {
    // Validaciones
    if (!formData.rubro || !formData.subRubro) {
      alert('Por favor seleccione rubro y sub-rubro');
      return;
    }
    if (!formData.razonSocial) {
      alert('Por favor ingrese la razón social');
      return;
    }
    if (!formData.cuit) {
      alert('Por favor ingrese el CUIT');
      return;
    }
    if (formData.cuit.replace(/\D/g, '').length !== 11) {
      alert('El CUIT debe tener exactamente 11 dígitos');
      return;
    }
    if (!formData.productos[0].nombre || !formData.productos[0].descripcion) {
      alert('Por favor complete al menos el primer producto');
      return;
    }

    onNext();
  };

  // DEBUG: Agregar console.log para ver si se actualiza
  console.log('FormData actual:', formData);
  console.log('Rubro seleccionado:', formData.rubro);
  console.log('SubRubro seleccionado:', formData.subRubro);

  return (
    <div className="space-y-4 md:space-y-6">
      <div>
        <h2 className="text-xl md:text-2xl font-bold text-ministerio-navy mb-2">Información Básica</h2>
        <p className="text-sm md:text-base text-ministerio-gray">Datos generales de tu empresa</p>
      </div>

      <div className="space-y-4">
        {/* Rubro y Sub-Rubro */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="rubro">
              Rubro <span className="text-red-500">*</span>
            </Label>
            <Select
              value={formData.rubro}
              onValueChange={(value) => {
                console.log('Rubro seleccionado:', value); // DEBUG
                updateFormData('rubro', value);
                updateFormData('subRubro', '');
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona el rubro" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(RUBROS_DATA).map(([key, data]) => {
                  console.log('Renderizando rubro:', key, data.nombre); // DEBUG
                  return (
                    <SelectItem key={key} value={key}>
                      {data.nombre}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
            {/* Mostrar valor actual para debug */}
            <p className="text-xs text-gray-500 mt-1">Valor actual: {formData.rubro || 'ninguno'}</p>
          </div>

          <div>
            <Label htmlFor="subRubro">
              Sub-Rubro <span className="text-red-500">*</span>
            </Label>
            <Select
              value={formData.subRubro}
              onValueChange={(value) => {
                console.log('SubRubro seleccionado:', value); // DEBUG
                updateFormData('subRubro', value);
              }}
              disabled={!formData.rubro}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona el sub-rubro" />
              </SelectTrigger>
              <SelectContent>
                {subRubrosDisponibles.map((subRubro) => (
                  <SelectItem key={subRubro} value={subRubro}>
                    {subRubro}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {/* Mostrar valor actual para debug */}
            <p className="text-xs text-gray-500 mt-1">Valor actual: {formData.subRubro || 'ninguno'}</p>
          </div>
        </div>

        {/* Razón Social */}
        <div>
          <Label htmlFor="razonSocial">
            Razón Social <span className="text-red-500">*</span>
          </Label>
          <Input
            id="razonSocial"
            value={formData.razonSocial}
            onChange={(e) => updateFormData('razonSocial', toUpperCase(e.target.value))}
            placeholder="NOMBRE LEGAL DE LA EMPRESA"
            className="uppercase"
          />
        </div>

        {/* CUIT */}
        <div>
          <Label htmlFor="cuit">
            CUIT <span className="text-red-500">*</span>
          </Label>
          <Input
            id="cuit"
            value={formData.cuit}
            onChange={(e) => updateFormData('cuit', e.target.value)}
            placeholder="XX-XXXXXXXX-X"
            maxLength={13}
          />
          <p className="text-xs text-ministerio-gray mt-1">
            Ingrese el CUIT sin espacios ni guiones (11 dígitos)
          </p>
        </div>

        {/* Productos */}
        <div className="space-y-4 pt-4 border-t">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-ministerio-navy">Productos</h3>
            <span className="text-xs text-ministerio-gray">
              {formData.productos.length} producto{formData.productos.length !== 1 ? 's' : ''}
            </span>
          </div>

          {formData.productos.map((producto, index) => (
            <div
              key={producto.id}
              className="space-y-4 p-4 border border-ministerio-blue/30 rounded-lg bg-ministerio-blue/5"
            >
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-ministerio-navy text-sm">
                  Producto {index + 1}
                  {index === 0 && <span className="text-red-500 ml-1">*</span>}
                </h4>
                {formData.productos.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => eliminarProducto(producto.id!)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>

              <div>
                <Label>
                  Producto {index === 0 && <span className="text-red-500">*</span>}
                </Label>
                <Input
                  value={producto.nombre}
                  onChange={(e) =>
                    actualizarProducto(producto.id!, 'nombre', toUpperCase(e.target.value))
                  }
                  placeholder="EJ: ACEITE DE OLIVA, VINO, TEXTILES"
                  className="uppercase"
                />
                <p className="text-xs text-ministerio-gray mt-1">
                  Ingrese el tipo de producto, no la marca comercial
                </p>
              </div>

              <div>
                <Label>
                  Descripción del Producto {index === 0 && <span className="text-red-500">*</span>}
                </Label>
                <Textarea
                  value={producto.descripcion}
                  onChange={(e) =>
                    actualizarProducto(producto.id!, 'descripcion', toUpperCase(e.target.value))
                  }
                  placeholder="DESCRIBE LAS CARACTERÍSTICAS PRINCIPALES DEL PRODUCTO"
                  rows={3}
                  className="uppercase"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Posición Arancelaria</Label>
                  <Input
                    value={producto.posicionArancelaria}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '');
                      if (value.length <= 12) {
                        actualizarProducto(producto.id!, 'posicionArancelaria', value);
                      }
                    }}
                    placeholder="Código NCM (6-12 dígitos)"
                  />
                  <p className="text-xs text-ministerio-gray mt-1">Mínimo 6 dígitos, máximo 12 dígitos</p>
                </div>

                <div>
                  <Label>Capacidad Productiva</Label>
                  <Input
                    value={producto.capacidadProductiva}
                    onChange={(e) =>
                      actualizarProducto(
                        producto.id!,
                        'capacidadProductiva',
                        toUpperCase(e.target.value)
                      )
                    }
                    placeholder="EJ: 10,000 UNIDADES/MES"
                    className="uppercase"
                  />
                </div>
              </div>
            </div>
          ))}

          <Button
            type="button"
            variant="outline"
            onClick={agregarProducto}
            className="w-full border-dashed border-ministerio-blue text-ministerio-blue hover:bg-ministerio-blue/5 bg-transparent"
          >
            <Plus className="w-4 h-4 mr-2" />
            Agregar Otro Producto
          </Button>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-end">
        <Button
          type="button"
          onClick={handleNext}
          className="bg-ministerio-blue hover:bg-ministerio-blue/90 text-white text-sm md:text-base"
        >
          Siguiente
          <ArrowRight className="ml-2 w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}