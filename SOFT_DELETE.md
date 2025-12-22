# Soft Delete - Documentación

## ¿Qué es el Soft Delete?

El **Soft Delete** (eliminación suave) es un patrón de diseño que permite "eliminar" registros de la base de datos sin borrarlos físicamente. En lugar de eliminar el registro, se marca como eliminado mediante un campo booleano o una fecha de eliminación.

### Ventajas del Soft Delete

- ✅ **Recuperación de datos**: Los datos pueden ser restaurados si se eliminaron por error
- ✅ **Auditoría**: Se mantiene un historial de quién eliminó qué y cuándo
- ✅ **Integridad referencial**: Las relaciones con otras tablas se mantienen intactas
- ✅ **Análisis histórico**: Permite analizar datos históricos incluso después de "eliminarlos"

## Implementación en el Proyecto

### Modelo Base: `SoftDeleteModel`

El proyecto incluye un modelo base en `backend/proyectoempresa/apps/core/models.py` que proporciona la funcionalidad de soft delete:

```python
class SoftDeleteModel(models.Model):
    """
    Modelo base para soft delete
    """
    eliminado = models.BooleanField(default=False, verbose_name="Eliminado")
    fecha_eliminacion = models.DateTimeField(blank=True, null=True, verbose_name="Fecha de Eliminación")
    eliminado_por = models.ForeignKey(
        'core.Usuario', 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='%(class)s_eliminadas',
        verbose_name="Eliminado por"
    )
    
    class Meta:
        abstract = True
    
    def delete(self, using=None, keep_parents=False):
        self.eliminado = True
        self.fecha_eliminacion = timezone.now()
        self.save(using=using)
    
    def hard_delete(self, using=None, keep_parents=False):
        super().delete(using=using, keep_parents=keep_parents)
```

### Modelo Empresa con Soft Delete

El modelo `Empresa` hereda de `SoftDeleteModel` y `TimestampedModel`:

```python
class Empresa(TimestampedModel, SoftDeleteModel):
    # ... campos del modelo ...
    
    # Managers para soft delete
    objects = EmpresaManager()  # Manager por defecto que excluye eliminadas
    all_objects = EmpresaAllManager()  # Manager para acceder a todas incluyendo eliminadas
```

### Managers Personalizados

#### `EmpresaManager` (Manager por defecto)
- Excluye automáticamente las empresas eliminadas
- Se usa cuando haces `Empresa.objects.all()` o cualquier consulta normal
- Las empresas eliminadas no aparecen en los resultados

```python
class EmpresaManager(models.Manager):
    def get_queryset(self):
        return super().get_queryset().filter(eliminado=False)
```

#### `EmpresaAllManager`
- Permite acceder a todas las empresas, incluyendo las eliminadas
- Se usa cuando necesitas ver o restaurar empresas eliminadas

```python
class EmpresaAllManager(models.Manager):
    def get_queryset(self):
        return super().get_queryset()
```

## Uso del Soft Delete

### Eliminar una Empresa (Soft Delete)

Cuando eliminas una empresa desde el frontend o la API, se realiza un soft delete automáticamente:

```python
# En el ViewSet
def perform_destroy(self, instance):
    """
    Realizar soft delete en lugar de eliminación permanente.
    Marca la empresa como eliminada y guarda quién la eliminó.
    """
    from django.utils import timezone
    instance.eliminado = True
    instance.fecha_eliminacion = timezone.now()
    instance.eliminado_por = self.request.user
    instance.save()
```

**Desde el frontend:**
- Al hacer clic en "Eliminar empresa", se muestra un modal de confirmación
- El modal indica que la empresa será marcada como eliminada (no borrada permanentemente)
- La empresa desaparece de las listas pero sigue en la base de datos

### Consultar Empresas

#### Empresas Activas (no eliminadas)
```python
# Usar el manager por defecto
empresas_activas = Empresa.objects.all()
empresa = Empresa.objects.get(id=1)  # Solo si no está eliminada
```

#### Todas las Empresas (incluyendo eliminadas)
```python
# Usar all_objects para incluir eliminadas
todas_las_empresas = Empresa.all_objects.all()
empresa_eliminada = Empresa.all_objects.filter(eliminado=True).first()
```

#### Solo Empresas Eliminadas
```python
empresas_eliminadas = Empresa.all_objects.filter(eliminado=True)
```

### Verificar Empresas Eliminadas

Usa el comando de management para ver un resumen:

```bash
docker-compose exec backend python manage.py verificar_empresas_eliminadas
```

Este comando muestra:
- Total de empresas eliminadas
- Total de empresas activas
- Detalles de cada empresa eliminada (ID, razón social, quién la eliminó, cuándo)

### Restaurar una Empresa Eliminada

Para restaurar una empresa que fue eliminada con soft delete:

```python
# Opción 1: Usando el shell de Django
docker-compose exec backend python manage.py shell

# En el shell:
from apps.empresas.models import Empresa
Empresa.all_objects.filter(id=106).update(
    eliminado=False, 
    fecha_eliminacion=None, 
    eliminado_por=None
)
```

```python
# Opción 2: Desde código Python
empresa = Empresa.all_objects.get(id=106)
empresa.eliminado = False
empresa.fecha_eliminacion = None
empresa.eliminado_por = None
empresa.save()
```

### Eliminación Permanente (Hard Delete)

Si necesitas eliminar una empresa permanentemente de la base de datos:

```python
empresa = Empresa.all_objects.get(id=106)
empresa.hard_delete()  # Eliminación permanente
```

⚠️ **Advertencia**: La eliminación permanente no se puede deshacer. Usa con precaución.

## Campos del Soft Delete

### `eliminado` (BooleanField)
- `False`: Empresa activa (no eliminada)
- `True`: Empresa eliminada (soft delete)
- Valor por defecto: `False`

### `fecha_eliminacion` (DateTimeField)
- Fecha y hora en que se marcó como eliminada
- Se establece automáticamente al hacer soft delete
- `None` si la empresa no está eliminada

### `eliminado_por` (ForeignKey a Usuario)
- Usuario que realizó la eliminación
- Se establece automáticamente al hacer soft delete desde la API
- `None` si la empresa no está eliminada o si se eliminó fuera de la API

## Comportamiento en la API

### Endpoints que Excluyen Empresas Eliminadas

Todos los endpoints normales de la API excluyen automáticamente las empresas eliminadas:

- `GET /api/empresas/` - Lista solo empresas activas
- `GET /api/empresas/{id}/` - Solo si la empresa no está eliminada
- `PUT/PATCH /api/empresas/{id}/` - Solo si la empresa no está eliminada
- `DELETE /api/empresas/{id}/` - Realiza soft delete

### Respuestas de la API

Cuando intentas acceder a una empresa eliminada:

```json
{
  "detail": "No encontrado"
}
```

Esto es porque el manager por defecto excluye las empresas eliminadas.

## Migración de Base de Datos

La migración `0012_add_soft_delete_fields.py` agrega los campos necesarios:

```python
migrations.AddField(
    model_name='empresa',
    name='eliminado',
    field=models.BooleanField(default=False),
),
migrations.AddField(
    model_name='empresa',
    name='fecha_eliminacion',
    field=models.DateTimeField(blank=True, null=True),
),
migrations.AddField(
    model_name='empresa',
    name='eliminado_por',
    field=models.ForeignKey(...),
),
```

**Aplicar la migración:**
```bash
docker-compose exec backend python manage.py migrate
```

## Ejemplos Prácticos

### Ejemplo 1: Listar Empresas Activas
```python
# En un ViewSet o vista
empresas = Empresa.objects.all()  # Solo empresas no eliminadas
```

### Ejemplo 2: Buscar Empresa Eliminada Específica
```python
# Buscar una empresa eliminada por ID
empresa = Empresa.all_objects.filter(id=106, eliminado=True).first()
if empresa:
    print(f"Empresa eliminada: {empresa.razon_social}")
    print(f"Eliminada por: {empresa.eliminado_por}")
    print(f"Fecha: {empresa.fecha_eliminacion}")
```

### Ejemplo 3: Estadísticas de Eliminaciones
```python
from django.utils import timezone
from datetime import timedelta

# Empresas eliminadas en los últimos 30 días
hace_30_dias = timezone.now() - timedelta(days=30)
recientes = Empresa.all_objects.filter(
    eliminado=True,
    fecha_eliminacion__gte=hace_30_dias
).count()

# Empresas eliminadas por un usuario específico
eliminadas_por_admin = Empresa.all_objects.filter(
    eliminado=True,
    eliminado_por__email='admin@example.com'
).count()
```

### Ejemplo 4: Restaurar Múltiples Empresas
```python
# Restaurar todas las empresas eliminadas en los últimos 7 días
from datetime import timedelta
hace_7_dias = timezone.now() - timedelta(days=7)

Empresa.all_objects.filter(
    eliminado=True,
    fecha_eliminacion__gte=hace_7_dias
).update(
    eliminado=False,
    fecha_eliminacion=None,
    eliminado_por=None
)
```

## Consideraciones Importantes

### Relaciones con Otras Tablas

Las relaciones con otras tablas (productos, servicios, etc.) se mantienen intactas cuando se hace soft delete. Esto significa:

- ✅ Los productos de una empresa eliminada siguen existiendo
- ✅ Los servicios de una empresa eliminada siguen existiendo
- ✅ Las relaciones ForeignKey siguen siendo válidas

### Filtros en Consultas

Cuando uses filtros, recuerda que el manager por defecto ya excluye eliminadas:

```python
# Correcto: Solo empresas activas de un rubro
empresas = Empresa.objects.filter(id_rubro=rubro)

# Incorrecto: No necesitas agregar .filter(eliminado=False)
# El manager ya lo hace automáticamente
```

### Serializers

Los campos de soft delete están marcados como `read_only` en los serializers:

```python
read_only_fields = [
    'id', 
    'fecha_creacion', 
    'fecha_actualizacion', 
    'eliminado', 
    'fecha_eliminacion', 
    'eliminado_por'
]
```

Esto significa que no se pueden modificar desde la API, solo desde el backend.

## Troubleshooting

### Problema: Una empresa eliminada aparece en las listas

**Solución**: Verifica que estés usando el manager correcto:
```python
# Incorrecto
empresas = Empresa.all_objects.all()  # Incluye eliminadas

# Correcto
empresas = Empresa.objects.all()  # Solo activas
```

### Problema: No puedo encontrar una empresa que sé que existe

**Solución**: Puede estar eliminada. Verifica:
```python
empresa = Empresa.all_objects.filter(id=ID).first()
if empresa and empresa.eliminado:
    print("La empresa está eliminada")
```

### Problema: Quiero eliminar permanentemente una empresa

**Solución**: Usa `hard_delete()`:
```python
empresa = Empresa.all_objects.get(id=ID)
empresa.hard_delete()  # Eliminación permanente
```

## Resumen

- ✅ **Soft Delete**: Las empresas se marcan como eliminadas, no se borran
- ✅ **Manager por defecto**: Excluye automáticamente empresas eliminadas
- ✅ **all_objects**: Para acceder a todas las empresas incluyendo eliminadas
- ✅ **Auditoría**: Se guarda quién y cuándo eliminó
- ✅ **Recuperable**: Las empresas eliminadas pueden ser restauradas
- ✅ **API**: Los endpoints normales excluyen empresas eliminadas automáticamente

---

**Última actualización**: Diciembre 2024

