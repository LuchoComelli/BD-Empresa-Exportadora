# Guía: Agregar Subrubro al Modelo Empresa sin Romper Nada

## 🎯 Objetivo Principal

**Permitir editar los subrubros de una empresa**, igual que se pueden editar los rubros.

### Problema Actual
- ✅ **Rubros SÍ se pueden editar**: Existe `id_rubro` (ForeignKey) en el modelo `Empresa`
- ❌ **Subrubros NO se pueden editar**: No existe campo de subrubro en el modelo `Empresa`
- **Consecuencia**: Los subrubros solo se pueden ver (desde `SolicitudRegistro`), pero no modificar

### Solución
Agregar campos ForeignKey a `SubRubro` en el modelo `Empresa` para que funcionen igual que `id_rubro`:
- Se pueden editar desde el formulario de edición de empresa
- Se guardan directamente en la empresa
- Se pueden actualizar mediante la API

---

## 📋 Situación Actual

### Estado del Modelo `Empresa`
- **Tiene**: Campo `id_rubro` (ForeignKey a `Rubro`) - **✅ EDITABLE**
- **NO tiene**: Campo para subrubro - **❌ NO EDITABLE**
- **Ubicación**: `backend/proyectoempresa/apps/empresas/models.py` (línea 567)

### Estado del Modelo `SolicitudRegistro`
- **Tiene**: Campos de subrubro como texto (CharField):
  - `sub_rubro` (CharField, max_length=100)
  - `sub_rubro_producto` (CharField, max_length=100) - para empresas mixtas
  - `sub_rubro_servicio` (CharField, max_length=100) - para empresas mixtas
- **Ubicación**: `backend/proyectoempresa/apps/registro/models.py` (líneas 94, 98, 100)

### Estado del Modelo `SubRubro`
- **Existe**: Modelo completo con ForeignKey a `Rubro`
- **Ubicación**: `backend/proyectoempresa/apps/empresas/models.py` (líneas 103-125)
- **Estructura**:
  ```python
  class SubRubro(models.Model):
      nombre = models.CharField(max_length=100)
      descripcion = models.TextField(blank=True, null=True)
      rubro = models.ForeignKey(Rubro, on_delete=models.CASCADE, related_name='subrubros')
      activo = models.BooleanField(default=True)
      orden = models.PositiveIntegerField(default=0)
  ```

---

## 🔍 Dónde se Usa Subrubro Actualmente

### 1. **Frontend - Formularios de Registro y Nueva Empresa**
- **Archivos**:
  - `frontend/app/registro/page.tsx`
  - `frontend/app/dashboard/nueva-empresa/page.tsx`
- **Uso**: Los usuarios seleccionan subrubros desde dropdowns que se cargan dinámicamente según el rubro seleccionado
- **API**: `api.getSubRubrosPorRubro(rubroId)` obtiene subrubros desde `/empresas/subrubros/`

### 2. **Backend - Serializers de Empresa**
- **Archivo**: `backend/proyectoempresa/apps/empresas/serializers.py`
- **Métodos actuales** (workaround):
  - `get_sub_rubro_nombre()` en `EmpresaproductoSerializer` (línea 375)
  - `get_sub_rubro_nombre()` en `EmpresaservicioSerializer` (línea 612)
  - `get_sub_rubro_nombre()`, `get_sub_rubro_producto_nombre()`, `get_sub_rubro_servicio_nombre()` en `EmpresaMixtaSerializer` (líneas 865-938)

- **Cómo funciona actualmente**:
  ```python
  def get_sub_rubro_nombre(self, obj):
      # Busca en SolicitudRegistro relacionada por CUIT
      # Normaliza CUITs y busca coincidencias
      # Retorna el subrubro como texto desde la solicitud
  ```
  - **Problema**: Solo funciona para empresas creadas desde solicitudes aprobadas
  - **Problema**: No funciona para empresas creadas directamente desde el dashboard
  - **Problema**: Es ineficiente (consulta adicional por cada empresa)

### 3. **Backend - Filtros en ViewSets**
- **Archivo**: `backend/proyectoempresa/apps/empresas/viewsets.py`
- **Uso**: Filtrado por subrubro en listados de empresas
- **Implementación actual**:
  ```python
  sub_rubro = self.request.query_params.get('sub_rubro')
  if sub_rubro:
      queryset = queryset.filter(id_rubro__subrubros__id=sub_rubro).distinct()
  ```
  - **Problema**: Filtra por rubro que tiene ese subrubro, no por el subrubro específico de la empresa

### 4. **Frontend - Visualización y Exportación**
- **Archivos**:
  - `frontend/app/dashboard/empresas/page.tsx` - Listado de empresas
  - `frontend/app/dashboard/empresas/[id]/page.tsx` - Detalle de empresa
  - `frontend/components/empresas/export-dialog.tsx` - Exportación de datos
  - `frontend/app/dashboard/mapa/page.tsx` - Mapa de empresas
- **Uso**: Muestra `sub_rubro_nombre` en las interfaces y lo incluye en exportaciones

### 5. **Backend - Creación de Empresa desde Solicitud**
- **Archivo**: `backend/proyectoempresa/apps/registro/views.py`
- **Función**: `crear_empresa_desde_solicitud()` (línea 319)
- **Problema actual**: **NO transfiere el subrubro** de la solicitud a la empresa
- **Línea 538**: Solo asigna `id_rubro`, no subrubro

---

## ⚠️ Problemas Identificados

### 🔴 Problema Principal: NO se pueden editar subrubros

1. **El subrubro NO está en el modelo `Empresa`**
   - Solo existe en `SolicitudRegistro` como texto (CharField)
   - Al aprobar una solicitud, el subrubro NO se transfiere a la empresa
   - **No se puede editar** porque no hay campo en `Empresa` para modificar
   - Los rubros SÍ se pueden editar porque tienen `id_rubro` (ForeignKey)

2. **Los serializers usan un workaround ineficiente**
   - Buscan el subrubro en `SolicitudRegistro` por CUIT (consulta adicional)
   - Solo funciona para empresas creadas desde solicitudes aprobadas
   - No funciona para empresas creadas directamente desde el dashboard
   - Retorna solo el nombre (texto), no el objeto completo

3. **No se puede actualizar el subrubro de una empresa existente**
   - No hay campo en `Empresa` para guardar el cambio
   - El formulario de edición no puede modificar algo que no existe en el modelo
   - Los serializers no pueden procesar actualizaciones de subrubro

4. **Las empresas existentes no tienen subrubro**
   - Necesitan migración de datos desde `SolicitudRegistro`

---

## ✅ Solución Propuesta

### Opción Recomendada: ForeignKey a SubRubro

Agregar campos ForeignKey a `SubRubro` en el modelo `Empresa`:

1. **Para empresas simples** (producto o servicio):
   - `id_subrubro` (ForeignKey a `SubRubro`, nullable)

2. **Para empresas mixtas**:
   - `id_subrubro_producto` (ForeignKey a `SubRubro`, nullable)
   - `id_subrubro_servicio` (ForeignKey a `SubRubro`, nullable)

### Ventajas:
- ✅ Relación directa con el modelo `SubRubro`
- ✅ Integridad referencial
- ✅ Consultas eficientes
- ✅ Funciona para todas las empresas (no solo las creadas desde solicitudes)
- ✅ Compatible con el sistema de filtros existente

### Desventajas:
- ⚠️ Requiere migración de datos existentes
- ⚠️ Las empresas sin subrubro tendrán `null` (aceptable)

---

## 📝 Plan de Implementación

### Paso 1: Modificar el Modelo `Empresa`

**Archivo**: `backend/proyectoempresa/apps/empresas/models.py`

**Ubicación**: Después de la línea 568 (después de `id_rubro`)

**Código a agregar**:
```python
# Relaciones
id_usuario = models.ForeignKey('core.Usuario', on_delete=models.CASCADE, verbose_name="Usuario")
id_rubro = models.ForeignKey(Rubro, on_delete=models.PROTECT, verbose_name="Rubro")
id_subrubro = models.ForeignKey(
    SubRubro,
    on_delete=models.PROTECT,
    blank=True,
    null=True,
    verbose_name="Sub-Rubro",
    help_text="Sub-rubro principal de la empresa (para empresas de producto o servicio único)"
)
# Para empresas mixtas
id_subrubro_producto = models.ForeignKey(
    SubRubro,
    on_delete=models.PROTECT,
    blank=True,
    null=True,
    related_name='empresas_producto',
    verbose_name="Sub-Rubro de Productos",
    help_text="Sub-rubro para productos (solo empresas mixtas)"
)
id_subrubro_servicio = models.ForeignKey(
    SubRubro,
    on_delete=models.PROTECT,
    blank=True,
    null=True,
    related_name='empresas_servicio',
    verbose_name="Sub-Rubro de Servicios",
    help_text="Sub-rubro para servicios (solo empresas mixtas)"
)
tipo_empresa = models.ForeignKey(TipoEmpresa, on_delete=models.PROTECT, verbose_name="Tipo de Empresa")
```

**Notas importantes**:
- Todos los campos son `blank=True, null=True` para no romper empresas existentes
- `on_delete=models.PROTECT` para evitar eliminar subrubros que están en uso
- `related_name` diferente para evitar conflictos en empresas mixtas

---

### Paso 2: Crear Migración

**Comando**:
```bash
docker-compose exec backend python manage.py makemigrations empresas
```

**Verificar la migración generada**:
- Debe crear los campos como `null=True` por defecto
- Debe agregar índices si es necesario

**Aplicar la migración**:
```bash
docker-compose exec backend python manage.py migrate empresas
```

---

### Paso 3: Actualizar `crear_empresa_desde_solicitud()`

**Archivo**: `backend/proyectoempresa/apps/registro/views.py`

**Función**: `crear_empresa_desde_solicitud()` (línea 319)

**Código a agregar** (después de obtener el rubro, línea ~444):

```python
# Obtener o crear subrubro
from apps.empresas.models import SubRubro

id_subrubro = None
id_subrubro_producto = None
id_subrubro_servicio = None

if solicitud.tipo_empresa == 'mixta':
    # Para empresas mixtas, buscar subrubros de productos y servicios
    if solicitud.sub_rubro_producto:
        try:
            # Buscar subrubro de productos por nombre dentro del rubro
            id_subrubro_producto = SubRubro.objects.filter(
                rubro=rubro,
                nombre__iexact=solicitud.sub_rubro_producto,
                activo=True
            ).first()
            if not id_subrubro_producto:
                logger.warning(f"Subrubro de productos '{solicitud.sub_rubro_producto}' no encontrado en rubro '{rubro.nombre}'")
        except Exception as e:
            logger.error(f"Error al buscar subrubro de productos: {str(e)}")
    
    if solicitud.sub_rubro_servicio:
        try:
            # Para servicios, necesitamos el rubro de servicios
            # Si la solicitud tiene rubro_servicio, buscar ese rubro primero
            rubro_servicio = None
            if solicitud.rubro_servicio:
                try:
                    rubro_servicio = Rubro.objects.get(nombre=solicitud.rubro_servicio)
                except Rubro.DoesNotExist:
                    logger.warning(f"Rubro de servicios '{solicitud.rubro_servicio}' no encontrado")
            
            if rubro_servicio:
                id_subrubro_servicio = SubRubro.objects.filter(
                    rubro=rubro_servicio,
                    nombre__iexact=solicitud.sub_rubro_servicio,
                    activo=True
                ).first()
                if not id_subrubro_servicio:
                    logger.warning(f"Subrubro de servicios '{solicitud.sub_rubro_servicio}' no encontrado en rubro '{rubro_servicio.nombre}'")
        except Exception as e:
            logger.error(f"Error al buscar subrubro de servicios: {str(e)}")
else:
    # Para empresas de producto o servicio único
    if solicitud.sub_rubro:
        try:
            id_subrubro = SubRubro.objects.filter(
                rubro=rubro,
                nombre__iexact=solicitud.sub_rubro,
                activo=True
            ).first()
            if not id_subrubro:
                logger.warning(f"Subrubro '{solicitud.sub_rubro}' no encontrado en rubro '{rubro.nombre}'")
        except Exception as e:
            logger.error(f"Error al buscar subrubro: {str(e)}")
```

**Agregar a `empresa_kwargs`** (después de línea 538):
```python
empresa_kwargs = {
    # ... campos existentes ...
    'id_rubro': rubro,
    'id_subrubro': id_subrubro,
    'id_subrubro_producto': id_subrubro_producto,
    'id_subrubro_servicio': id_subrubro_servicio,
    'tipo_empresa': tipo_empresa,
    # ... resto de campos ...
}
```

---

### Paso 4: Actualizar Serializers (Mantener Compatibilidad)

**Archivo**: `backend/proyectoempresa/apps/empresas/serializers.py`

**Estrategia**: Mantener los métodos `get_sub_rubro_nombre()` pero hacer que primero intenten usar el campo directo, y solo si no existe, busquen en `SolicitudRegistro`.

**Ejemplo para `EmpresaproductoSerializer`** (línea 375):

```python
def get_sub_rubro_nombre(self, obj):
    """Obtener nombre del subrubro desde el campo directo o desde la solicitud relacionada"""
    # Primero intentar usar el campo directo (nuevo)
    if obj.id_subrubro:
        return obj.id_subrubro.nombre
    
    # Si no existe, usar el método antiguo como fallback (compatibilidad)
    try:
        from apps.registro.models import SolicitudRegistro
        cuit_empresa = str(obj.cuit_cuil).replace('-', '').replace(' ', '').strip()
        
        solicitudes = SolicitudRegistro.objects.filter(estado='aprobada')
        solicitud = None
        for sol in solicitudes:
            cuit_sol = str(sol.cuit_cuil).replace('-', '').replace(' ', '').strip()
            if cuit_sol == cuit_empresa:
                solicitud = sol
                break
        
        if solicitud:
            return solicitud.sub_rubro or None
    except Exception as e:
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"Error obteniendo sub_rubro_nombre: {str(e)}", exc_info=True)
    
    return None
```

**Hacer lo mismo para**:
- `EmpresaservicioSerializer.get_sub_rubro_nombre()` (línea 612)
- `EmpresaMixtaSerializer.get_sub_rubro_nombre()` (línea 865)
- `EmpresaMixtaSerializer.get_sub_rubro_producto_nombre()` (línea 893)
- `EmpresaMixtaSerializer.get_sub_rubro_servicio_nombre()` (línea 917)

**Agregar campos a los serializers** (en la clase Meta, fields):
```python
class Meta:
    model = Empresa
    fields = [
        # ... campos existentes ...
        'id_subrubro',
        'id_subrubro_producto',
        'id_subrubro_servicio',
        # ... resto de campos ...
    ]
```

---

### Paso 5: Actualizar Serializers para Permitir Edición

**Archivo**: `backend/proyectoempresa/apps/empresas/serializers.py`

**IMPORTANTE**: Este paso es crucial para permitir la edición de subrubros.

#### 5.1. Agregar campos a los serializers

En las clases `Meta` de cada serializer, agregar los nuevos campos:

**Para `EmpresaproductoSerializer` y `EmpresaservicioSerializer`**:
```python
class Meta:
    model = Empresa
    fields = [
        # ... campos existentes ...
        'id_rubro',  # Ya existe
        'id_subrubro',  # ← NUEVO - Permite editar subrubro
        # ... resto de campos ...
    ]
```

**Para `EmpresaMixtaSerializer`**:
```python
class Meta:
    model = Empresa
    fields = [
        # ... campos existentes ...
        'id_rubro',  # Ya existe
        'id_subrubro_producto',  # ← NUEVO - Permite editar subrubro de productos
        'id_subrubro_servicio',  # ← NUEVO - Permite editar subrubro de servicios
        # ... resto de campos ...
    ]
```

#### 5.2. Actualizar métodos `create()` y `update()`

**En los métodos `create()` y `update()`**:
- Aceptar `id_subrubro`, `id_subrubro_producto`, `id_subrubro_servicio` en `validated_data`
- Validar que el subrubro pertenezca al rubro seleccionado
- Guardar los campos en la empresa

**Ejemplo para `EmpresaproductoSerializer.update()`**:
```python
def update(self, instance, validated_data):
    """
    Actualizar empresa incluyendo subrubro
    """
    # Extraer subrubro si viene en los datos
    id_subrubro = validated_data.pop('id_subrubro', None)
    
    # Validar que el subrubro pertenezca al rubro
    rubro = validated_data.get('id_rubro', instance.id_rubro)
    
    if id_subrubro:
        # Validar que el subrubro pertenezca al rubro seleccionado
        if id_subrubro.rubro != rubro:
            raise serializers.ValidationError({
                'id_subrubro': 'El subrubro debe pertenecer al rubro seleccionado'
            })
        instance.id_subrubro = id_subrubro
    
    # Si se cambia el rubro, limpiar el subrubro si no pertenece al nuevo rubro
    if 'id_rubro' in validated_data and validated_data['id_rubro'] != instance.id_rubro:
        if instance.id_subrubro and instance.id_subrubro.rubro != validated_data['id_rubro']:
            instance.id_subrubro = None
    
    # Actualizar otros campos
    return super().update(instance, validated_data)
```

**Ejemplo para `EmpresaMixtaSerializer.update()`**:
```python
def update(self, instance, validated_data):
    """
    Actualizar empresa mixta incluyendo subrubros de productos y servicios
    """
    # Extraer subrubros si vienen en los datos
    id_subrubro_producto = validated_data.pop('id_subrubro_producto', None)
    id_subrubro_servicio = validated_data.pop('id_subrubro_servicio', None)
    
    # Validar subrubros
    rubro = validated_data.get('id_rubro', instance.id_rubro)
    
    if id_subrubro_producto:
        if id_subrubro_producto.rubro != rubro:
            raise serializers.ValidationError({
                'id_subrubro_producto': 'El subrubro de productos debe pertenecer al rubro seleccionado'
            })
        instance.id_subrubro_producto = id_subrubro_producto
    
    if id_subrubro_servicio:
        # Para servicios, validar contra rubro_servicio si existe
        # Si hay un rubro_servicio separado, validar contra ese
        # Por ahora, validamos contra el rubro principal
        if id_subrubro_servicio.rubro != rubro:
            raise serializers.ValidationError({
                'id_subrubro_servicio': 'El subrubro de servicios debe pertenecer al rubro seleccionado'
            })
        instance.id_subrubro_servicio = id_subrubro_servicio
    
    # Si se cambia el rubro, limpiar subrubros si no pertenecen al nuevo rubro
    if 'id_rubro' in validated_data and validated_data['id_rubro'] != instance.id_rubro:
        if instance.id_subrubro_producto and instance.id_subrubro_producto.rubro != validated_data['id_rubro']:
            instance.id_subrubro_producto = None
        if instance.id_subrubro_servicio and instance.id_subrubro_servicio.rubro != validated_data['id_rubro']:
            instance.id_subrubro_servicio = None
    
    # Actualizar otros campos
    return super().update(instance, validated_data)
```

**Ejemplo para `create()` (similar)**:
```python
def create(self, validated_data):
    # ... código existente ...
    
    # Extraer subrubros
    id_subrubro = validated_data.pop('id_subrubro', None)
    id_subrubro_producto = validated_data.pop('id_subrubro_producto', None)
    id_subrubro_servicio = validated_data.pop('id_subrubro_servicio', None)
    
    rubro = validated_data.get('id_rubro')
    tipo_empresa_valor = validated_data.get('tipo_empresa_valor')
    
    # Validar subrubros según tipo de empresa
    if tipo_empresa_valor == 'mixta':
        if id_subrubro_producto and id_subrubro_producto.rubro != rubro:
            raise serializers.ValidationError({
                'id_subrubro_producto': 'El subrubro de productos debe pertenecer al rubro seleccionado'
            })
        if id_subrubro_servicio and id_subrubro_servicio.rubro != rubro:
            raise serializers.ValidationError({
                'id_subrubro_servicio': 'El subrubro de servicios debe pertenecer al rubro seleccionado'
            })
    else:
        if id_subrubro and id_subrubro.rubro != rubro:
            raise serializers.ValidationError({
                'id_subrubro': 'El subrubro debe pertenecer al rubro seleccionado'
            })
    
    # Crear empresa
    empresa = Empresa.objects.create(**validated_data)
    
    # Asignar subrubros
    if id_subrubro:
        empresa.id_subrubro = id_subrubro
    if id_subrubro_producto:
        empresa.id_subrubro_producto = id_subrubro_producto
    if id_subrubro_servicio:
        empresa.id_subrubro_servicio = id_subrubro_servicio
    
    empresa.save()
    
    # ... resto del código ...
    return empresa
```

**Nota importante**: Los campos `id_subrubro`, `id_subrubro_producto`, `id_subrubro_servicio` ahora serán editables desde el frontend, igual que `id_rubro`.

---

### Paso 7: Actualizar Filtros en ViewSets

**Archivo**: `backend/proyectoempresa/apps/empresas/viewsets.py`

**Cambiar el filtro de subrubro** (líneas 97-102, 176-181, 236-241):

**Antes**:
```python
sub_rubro = self.request.query_params.get('sub_rubro')
if sub_rubro:
    # Filtrar empresas cuyo rubro tenga el subrubro especificado
    queryset = queryset.filter(id_rubro__subrubros__id=sub_rubro).distinct()
```

**Después**:
```python
sub_rubro = self.request.query_params.get('sub_rubro')
if sub_rubro:
    # Filtrar empresas que tengan el subrubro especificado
    queryset = queryset.filter(
        models.Q(id_subrubro_id=sub_rubro) |
        models.Q(id_subrubro_producto_id=sub_rubro) |
        models.Q(id_subrubro_servicio_id=sub_rubro)
    ).distinct()
```

---

### Paso 8: Migración de Datos Existentes (Opcional pero Recomendado)

**Crear un comando de gestión**:

**Archivo**: `backend/proyectoempresa/apps/empresas/management/commands/migrar_subrubros_empresas.py`

```python
from django.core.management.base import BaseCommand
from apps.empresas.models import Empresa, SubRubro
from apps.registro.models import SolicitudRegistro
import logging

logger = logging.getLogger(__name__)

class Command(BaseCommand):
    help = 'Migrar subrubros desde SolicitudRegistro a Empresa'

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('Iniciando migración de subrubros...'))
        
        empresas_actualizadas = 0
        empresas_sin_subrubro = 0
        errores = 0
        
        # Obtener todas las empresas
        empresas = Empresa.objects.all()
        
        for empresa in empresas:
            try:
                # Buscar solicitud relacionada por CUIT
                cuit_empresa = str(empresa.cuit_cuil).replace('-', '').replace(' ', '').strip()
                
                solicitud = None
                solicitudes = SolicitudRegistro.objects.filter(estado='aprobada')
                for sol in solicitudes:
                    cuit_sol = str(sol.cuit_cuil).replace('-', '').replace(' ', '').strip()
                    if cuit_sol == cuit_empresa:
                        solicitud = sol
                        break
                
                if not solicitud:
                    empresas_sin_subrubro += 1
                    continue
                
                # Buscar y asignar subrubros
                actualizado = False
                
                if empresa.tipo_empresa_valor == 'mixta':
                    # Empresas mixtas
                    if solicitud.sub_rubro_producto and not empresa.id_subrubro_producto:
                        subrubro_prod = SubRubro.objects.filter(
                            rubro=empresa.id_rubro,
                            nombre__iexact=solicitud.sub_rubro_producto,
                            activo=True
                        ).first()
                        if subrubro_prod:
                            empresa.id_subrubro_producto = subrubro_prod
                            actualizado = True
                    
                    if solicitud.sub_rubro_servicio and not empresa.id_subrubro_servicio:
                        # Buscar rubro de servicios si existe
                        # (requiere lógica adicional si hay rubros separados)
                        subrubro_serv = SubRubro.objects.filter(
                            nombre__iexact=solicitud.sub_rubro_servicio,
                            activo=True
                        ).first()
                        if subrubro_serv:
                            empresa.id_subrubro_servicio = subrubro_serv
                            actualizado = True
                else:
                    # Empresas simples
                    if solicitud.sub_rubro and not empresa.id_subrubro:
                        subrubro = SubRubro.objects.filter(
                            rubro=empresa.id_rubro,
                            nombre__iexact=solicitud.sub_rubro,
                            activo=True
                        ).first()
                        if subrubro:
                            empresa.id_subrubro = subrubro
                            actualizado = True
                
                if actualizado:
                    empresa.save()
                    empresas_actualizadas += 1
                    self.stdout.write(f'  ✓ Empresa {empresa.razon_social} actualizada')
                else:
                    empresas_sin_subrubro += 1
                    
            except Exception as e:
                errores += 1
                logger.error(f"Error procesando empresa {empresa.id}: {str(e)}")
                self.stdout.write(self.style.ERROR(f'  ✗ Error en empresa {empresa.id}: {str(e)}'))
        
        self.stdout.write(self.style.SUCCESS(f'\nMigración completada:'))
        self.stdout.write(f'  Empresas actualizadas: {empresas_actualizadas}')
        self.stdout.write(f'  Empresas sin subrubro: {empresas_sin_subrubro}')
        self.stdout.write(f'  Errores: {errores}')
```

**Ejecutar el comando**:
```bash
docker-compose exec backend python manage.py migrar_subrubros_empresas
```

---

### Paso 6: Actualizar Frontend para Edición

**Archivos**:
- `frontend/app/dashboard/nueva-empresa/page.tsx` - Crear empresa
- `frontend/app/dashboard/empresas/[id]/page.tsx` - **Editar empresa** (IMPORTANTE)

**Cambios necesarios**:

#### 6.1. Verificar que el formulario de edición envíe los campos correctos

El frontend ya debería estar enviando IDs de subrubros. Verificar que:

1. **Al cargar una empresa para editar**, se carguen los subrubros actuales:
   ```typescript
   // En el formulario de edición
   const [formData, setFormData] = useState({
     // ... otros campos ...
     rubro: empresa.id_rubro?.id || "",
     subrubro: empresa.id_subrubro?.id || "",  // ← Debe cargar el subrubro actual
     // Para empresas mixtas:
     subrubroProducto: empresa.id_subrubro_producto?.id || "",
     subrubroServicio: empresa.id_subrubro_servicio?.id || "",
   });
   ```

2. **Al enviar la actualización**, se envíen los IDs:
   ```typescript
   const handleSubmit = async () => {
     const data = {
       // ... otros campos ...
       id_rubro: formData.rubro,
       id_subrubro: formData.subrubro,  // ← Enviar ID del subrubro
       // Para empresas mixtas:
       id_subrubro_producto: formData.subrubroProducto,
       id_subrubro_servicio: formData.subrubroServicio,
     };
     
     await api.updateEmpresa(empresaId, data);
   };
   ```

3. **Al cambiar el rubro**, limpiar el subrubro y recargar subrubros disponibles:
   ```typescript
   const handleRubroChange = async (rubroId: string) => {
     setFormData(prev => ({ ...prev, rubro: rubroId, subrubro: "" }));
     // Cargar subrubros del nuevo rubro
     const subrubros = await api.getSubRubrosPorRubro(rubroId);
     setSubrubros(subrubros);
   };
   ```

**Verificar**:
- Los formularios ya usan IDs de subrubros (no nombres)
- El formulario de edición carga el subrubro actual de la empresa
- Al guardar, se envía el ID del subrubro seleccionado
- El backend ahora acepta y guarda estos campos

---

## ⚠️ Consideraciones Importantes

### 1. **Compatibilidad hacia atrás**
- Los métodos `get_sub_rubro_nombre()` mantienen el fallback a `SolicitudRegistro`
- Las empresas existentes sin subrubro seguirán funcionando (retornarán `null`)

### 2. **Empresas Mixtas**
- Requieren lógica especial para manejar dos subrubros
- El rubro de servicios puede ser diferente al rubro de productos
- Considerar si necesitas un campo `id_rubro_servicio` separado

### 3. **Validación**
- Validar que el subrubro pertenezca al rubro seleccionado
- Validar que empresas mixtas tengan ambos subrubros si es requerido

### 4. **Rendimiento**
- Agregar índices en los campos ForeignKey si es necesario
- Las consultas serán más eficientes al usar ForeignKey directo

### 5. **Datos Existentes**
- Las empresas creadas antes de esta migración no tendrán subrubro
- Ejecutar el comando de migración para llenar datos históricos
- Las empresas nuevas desde ahora tendrán subrubro automáticamente

---

## 🧪 Pruebas Recomendadas

### Prueba Principal: Edición de Subrubros

1. **✅ Editar subrubro de una empresa existente** (PRUEBA PRINCIPAL)
   - Ir a editar una empresa
   - Cambiar el subrubro
   - Guardar
   - Verificar que el cambio se guardó correctamente
   - Recargar la página y verificar que el subrubro se mantiene

2. **Crear empresa desde solicitud aprobada**
   - Verificar que el subrubro se transfiere correctamente
   - Verificar que se puede editar después de crear

3. **Crear empresa directamente desde dashboard**
   - Verificar que se puede seleccionar y guardar subrubro
   - Verificar que se puede editar después de crear

4. **Editar empresa existente - Cambiar rubro y subrubro**
   - Cambiar el rubro
   - Verificar que el subrubro se limpia si no pertenece al nuevo rubro
   - Seleccionar un nuevo subrubro del nuevo rubro
   - Guardar y verificar

5. **Filtros por subrubro**
   - Verificar que los filtros funcionan correctamente
   - Filtrar por subrubro y verificar que solo muestra empresas con ese subrubro

6. **Exportación de datos**
   - Verificar que el subrubro aparece en PDFs y Excel
   - Verificar que el subrubro editado se exporta correctamente

7. **Empresas mixtas**
   - Verificar que ambos subrubros se guardan y muestran correctamente
   - Verificar que se pueden editar ambos subrubros independientemente

---

## 📊 Resumen de Archivos a Modificar

1. ✅ `backend/proyectoempresa/apps/empresas/models.py` - Agregar campos
2. ✅ `backend/proyectoempresa/apps/registro/views.py` - Transferir subrubro al crear empresa
3. ✅ `backend/proyectoempresa/apps/empresas/serializers.py` - Actualizar métodos y campos
4. ✅ `backend/proyectoempresa/apps/empresas/viewsets.py` - Actualizar filtros
5. ✅ Crear migración con `makemigrations`
6. ✅ Crear comando de migración de datos (opcional pero recomendado)

---

## 🚀 Orden de Ejecución

1. **Modificar modelo** → Crear migración → Aplicar migración
2. **Actualizar `crear_empresa_desde_solicitud()`**
3. **Actualizar serializers** (mantener compatibilidad)
4. **Actualizar viewset filters**
5. **Ejecutar comando de migración de datos** (opcional)
6. **Probar creación de empresa nueva**
7. **Probar aprobación de solicitud**
8. **Verificar que todo funciona en frontend**

---

## ✅ Ventajas Finales

### 🎯 Objetivo Cumplido: Edición de Subrubros

- ✅ **Subrubro EDITABLE** - Se puede modificar igual que el rubro
- ✅ **Subrubro guardado directamente en `Empresa`** - No depende de `SolicitudRegistro`
- ✅ **Funciona en formularios de edición** - El frontend puede enviar y actualizar subrubros
- ✅ **Validación automática** - El subrubro debe pertenecer al rubro seleccionado
- ✅ **Consultas más eficientes** - Sin buscar en `SolicitudRegistro`
- ✅ **Funciona para todas las empresas** - No solo las creadas desde solicitudes
- ✅ **Compatible con empresas existentes** - Campos nullable, no rompe datos existentes
- ✅ **Mantiene compatibilidad hacia atrás** - Fallback en serializers para empresas sin subrubro
- ✅ **Mejor integridad de datos** - ForeignKey asegura relaciones válidas
- ✅ **Filtros más precisos y eficientes** - Filtra directamente por subrubro de la empresa

---

**Nota**: Este plan asegura que no se rompa nada existente mientras se agrega la funcionalidad nueva. Los campos son opcionales (`null=True`) y los serializers mantienen el fallback para empresas que aún no tienen subrubro asignado.

