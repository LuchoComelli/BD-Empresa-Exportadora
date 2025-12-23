# Scripts de Gestión de Geografía - Catamarca

## Scripts Disponibles

### Scripts de Verificación (ÚTILES PARA MANTENIMIENTO)

Estos scripts son útiles para verificar la integridad de los datos geográficos:

- **`verificacion_final_catamarca.py`** - Verificación completa de todos los departamentos
  - Uso: `python manage.py verificacion_final_catamarca`
  - Muestra el estado de todos los departamentos, municipios y localidades

- **`revisar_departamento_individual.py`** - Revisa un departamento específico en detalle
  - Uso: `python manage.py revisar_departamento_individual "Nombre Departamento"`
  - Muestra municipios, localidades y sus relaciones

- **`revisar_todos_departamentos.py`** - Revisa todos los departamentos
  - Uso: `python manage.py revisar_todos_departamentos`
  - Resumen rápido de todos los departamentos

- **`verificar_municipios_vs_localidades.py`** - Verifica relaciones municipio-localidad
  - Uso: `python manage.py verificar_municipios_vs_localidades`
  - Detecta nombres que son tanto municipio como localidad

- **`detalle_departamentos_catamarca.py`** - Muestra detalles de departamentos
  - Uso: `python manage.py detalle_departamentos_catamarca`
  - Lista detallada de cada departamento con sus municipios y localidades

### Scripts de Corrección

- **`corregir_catamarca_completo.py`** - Corrige todas las relaciones de departamentos, municipios y localidades
  - Uso: `python manage.py corregir_catamarca_completo`
  - Aplica correcciones automáticas para todas las relaciones incorrectas
  - Útil después de restaurar un backup o cuando se detectan problemas

### Scripts de Utilidad

- **`resumen_catamarca.py`** - Genera un resumen de la estructura geográfica
- **`revisar_catamarca.py`** - Revisión general de Catamarca
- **`verificar_corregir_catamarca.py`** - Verificación y corrección automática (solo detecta, no corrige todo)
- **`verificar_datos_catamarca.py`** - Verificación de datos
- **`generar_md_catamarca.py`** - Genera documentación en Markdown
- **`populate_catamarca.py`** - Población inicial de datos (si es necesario)
- **`populate_localidades_completas.py`** - Población completa de localidades

## Estado de los Datos

Todos los departamentos de Catamarca han sido verificados y corregidos:
- ✅ 16 departamentos
- ✅ 36 municipios  
- ✅ 517 localidades
- ✅ Todas las relaciones correctas (Provincia → Departamento → Municipio → Localidad)

**Los datos están listos para producción.**

## Nota

Los scripts de corrección específica fueron eliminados ya que los datos ya están corregidos y no son necesarios para el funcionamiento normal del sistema. Solo se mantienen los scripts de verificación que pueden ser útiles para mantenimiento futuro.

