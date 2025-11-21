# 📋 Guía para Poblar la Base de Datos

Esta guía te permitirá poblar completamente la base de datos con todos los datos necesarios: rubros, subrubros, provincias, departamentos, municipios y localidades.

## 🎯 Datos que se van a cargar

### **Rubros y Subrubros**
- **23 rubros principales** (Agrícola, Industrial, Tecnología, Servicios, etc.)
- **158 subrubros** asociados
- Mantiene IDs originales y relaciones exactas

### **Geografía Argentina**
- **24 provincias** argentinas
- **~500 departamentos**
- **~2,200 municipios**
- **~45,000 localidades** (BAHRA - Base de Asentamientos Humanos de la República Argentina)

---

## 🚀 Instrucciones de Instalación

### **Paso 1: Preparar el Entorno**

Asegúrate de tener el proyecto funcionando:

```bash
# Clonar el repositorio (si no lo tienes)
git clone [URL_DEL_REPOSITORIO]
cd BD-Empresa-Exportadora

# Iniciar los servicios
docker-compose up -d

# Esperar a que los servicios estén listos
# Verificar que estén funcionando:
docker-compose ps
```

### **Paso 2: Verificar la Base de Datos**

```bash
# Verificar que la base de datos esté funcionando
docker-compose exec backend python manage.py check

# Aplicar migraciones si es necesario
docker-compose exec backend python manage.py migrate
```

---

## 📊 Cargar Rubros y Subrubros

### **Opción 1: Usando el Script Python (Recomendado)**

```bash
# Copiar el script al contenedor backend
docker cp cargar_rubros_subrubros.py bd-empresa-exportadora-backend-1:/app/

# Ejecutar el script
docker-compose exec backend python cargar_rubros_subrubros.py
```

### **Opción 2: Ejecutar desde el Host**

```bash
# Desde el directorio raíz del proyecto
cd backend/proyectoempresa
python cargar_rubros_subrubros.py
```

### **¿Qué hace este script?**
- ✅ Carga 23 rubros principales
- ✅ Carga 158 subrubros asociados
- ✅ Mantiene IDs originales
- ✅ Actualiza registros existentes
- ✅ Verifica integridad de datos
- ✅ Muestra estadísticas detalladas

**Salida esperada:**
```
🚀 Iniciando carga de rubros y subrubros...
✅ Rubro creado: Agrícola (ID: 2)
  ✅ Subrubro creado: Vinos (ID: 1)
  ✅ Subrubro creado: Aceite de Oliva (ID: 2)
  ...
🎉 CARGA COMPLETADA EXITOSAMENTE
📊 Rubros creados: 23
📊 Subrubros creados: 158
```

---

## 🗺️ Cargar Datos Geográficos

### **Paso 1: Cargar Provincias, Departamentos y Municipios**

```bash
# Importar todo (incluye localidades - proceso más lento ~30-60 min)
docker-compose exec backend python manage.py populate_geografia

# O importar sin localidades (proceso más rápido ~5-10 min)
docker-compose exec backend python manage.py populate_geografia --skip-localidades
```

### **¿Qué hace este comando?**
- ✅ Obtiene datos de la API oficial Georef (datos.gob.ar)
- ✅ Importa 24 provincias argentinas
- ✅ Importa ~500 departamentos
- ✅ Importa ~2,200 municipios
- ✅ Importa ~45,000 localidades (si no usas --skip-localidades)
- ✅ Mantiene coordenadas geográficas
- ✅ Establece relaciones jerárquicas correctas

**Salida esperada:**
```
============================================================
IMPORTACIÓN DE DATOS GEOGRÁFICOS DE ARGENTINA
Fuente: API Georef - datos.gob.ar
============================================================

📍 Importando provincias...
✓ 24 provincias procesadas (24 nuevas)

🗺️ Importando departamentos...
✓ 527 departamentos procesados (527 nuevos)

🏛️ Importando municipios...
✓ 2267 municipios procesados (2267 nuevos)

🏘️ Importando localidades BAHRA...
✓ 45000 localidades procesadas (45000 nuevas)

✓ IMPORTACIÓN COMPLETADA
```

### **Paso 2: Asociar Municipios a Departamentos (Opcional)**

Si algunos municipios no quedaron correctamente asociados a sus departamentos:

```bash
# Asociar todos los municipios pendientes
docker-compose exec backend python manage.py asociar_municipios_departamentos

# O procesar solo una provincia específica (ej: Catamarca = ID 02)
docker-compose exec backend python manage.py asociar_municipios_departamentos --provincia 02
```

---

## ⚡ Proceso Completo Paso a Paso

### **Opción Rápida (Sin Localidades)**
```bash
# 1. Iniciar servicios
docker-compose up -d

# 2. Cargar rubros y subrubros
docker cp cargar_rubros_subrubros.py bd-empresa-exportadora-backend-1:/app/
docker-compose exec backend python cargar_rubros_subrubros.py

# 3. Cargar geografía (sin localidades)
docker-compose exec backend python manage.py populate_geografia --skip-localidades

# 4. Verificar carga
docker-compose exec backend python manage.py shell -c "
from apps.empresas.models import Rubro, SubRubro
from apps.geografia.models import Provincia, Departamento, Municipio
print(f'Rubros: {Rubro.objects.count()}')
print(f'Subrubros: {SubRubro.objects.count()}')
print(f'Provincias: {Provincia.objects.count()}')
print(f'Departamentos: {Departamento.objects.count()}')
print(f'Municipios: {Municipio.objects.count()}')
"
```

### **Opción Completa (Con Localidades)**
```bash
# 1. Iniciar servicios
docker-compose up -d

# 2. Cargar rubros y subrubros
docker cp cargar_rubros_subrubros.py bd-empresa-exportadora-backend-1:/app/
docker-compose exec backend python cargar_rubros_subrubros.py

# 3. Cargar geografía completa (incluye localidades)
docker-compose exec backend python manage.py populate_geografia

# 4. Asociar municipios pendientes (si es necesario)
docker-compose exec backend python manage.py asociar_municipios_departamentos

# 5. Verificar carga completa
docker-compose exec backend python manage.py shell -c "
from apps.empresas.models import Rubro, SubRubro
from apps.geografia.models import Provincia, Departamento, Municipio, Localidad
print(f'Rubros: {Rubro.objects.count()}')
print(f'Subrubros: {SubRubro.objects.count()}')
print(f'Provincias: {Provincia.objects.count()}')
print(f'Departamentos: {Departamento.objects.count()}')
print(f'Municipios: {Municipio.objects.count()}')
print(f'Localidades: {Localidad.objects.count()}')
"
```

---

## 🔍 Verificación de Datos

### **Verificar Rubros y Subrubros**
```bash
docker-compose exec backend python manage.py shell -c "
from apps.empresas.models import Rubro, SubRubro

print('=== RUBROS Y SUBRUBROS ===')
for rubro in Rubro.objects.all().order_by('nombre'):
    count = SubRubro.objects.filter(rubro=rubro).count()
    print(f'{rubro.nombre}: {count} subrubros')

print(f'\nTotal: {Rubro.objects.count()} rubros, {SubRubro.objects.count()} subrubros')
"
```

### **Verificar Geografía**
```bash
docker-compose exec backend python manage.py shell -c "
from apps.geografia.models import Provincia, Departamento, Municipio, Localidad

print('=== GEOGRAFÍA ===')
for provincia in Provincia.objects.all().order_by('nombre'):
    deptos = Departamento.objects.filter(provincia=provincia).count()
    munis = Municipio.objects.filter(provincia=provincia).count()
    locs = Localidad.objects.filter(provincia=provincia).count()
    print(f'{provincia.nombre}: {deptos} deptos, {munis} municipios, {locs} localidades')

print(f'\nTotal: {Provincia.objects.count()} provincias')
print(f'Total: {Departamento.objects.count()} departamentos')
print(f'Total: {Municipio.objects.count()} municipios')
print(f'Total: {Localidad.objects.count()} localidades')
"
```

---

## 📁 Archivos Necesarios

Asegúrate de tener estos archivos en tu proyecto:

### **Para Rubros y Subrubros:**
- `cargar_rubros_subrubros.py` - Script principal de carga
- `RUBROS_Y_SUBRUBROS.md` - Documentación de todos los datos

### **Para Geografía (Ya incluidos en el proyecto):**
- `backend/proyectoempresa/apps/geografia/management/commands/populate_geografia.py`
- `backend/proyectoempresa/apps/geografia/management/commands/asociar_municipios_departamentos.py`

---

## ⚠️ Consideraciones Importantes

### **Tiempo de Ejecución:**
- **Rubros y Subrubros:** ~1-2 minutos
- **Geografía sin localidades:** ~5-10 minutos
- **Geografía con localidades:** ~30-60 minutos

### **Conexión a Internet:**
- Los scripts de geografía requieren conexión a internet
- Usan la API oficial del gobierno argentino (apis.datos.gob.ar)

### **Espacio en Disco:**
- Rubros y subrubros: ~50 KB
- Geografía sin localidades: ~2 MB
- Geografía con localidades: ~50-100 MB

### **Manejo de Errores:**
- Los scripts manejan errores de conexión automáticamente
- Si falla la API, reintenta con parámetros más conservadores
- Los datos se guardan incrementalmente (puedes reanudar si se interrumpe)

---

## 🆘 Solución de Problemas

### **Error: "No module named 'apps'"**
```bash
# Asegúrate de ejecutar desde el directorio correcto
cd backend/proyectoempresa
python cargar_rubros_subrubros.py
```

### **Error: "Connection refused"**
```bash
# Verificar que los servicios estén funcionando
docker-compose ps
docker-compose up -d
```

### **Error: "API timeout"**
```bash
# Reintentar con parámetros más conservadores
docker-compose exec backend python manage.py populate_geografia --skip-localidades
```

### **Verificar logs:**
```bash
# Ver logs del backend
docker-compose logs backend

# Ver logs de la base de datos
docker-compose logs db
```

---

## ✅ Resultado Final

Al completar todos los pasos tendrás:

- ✅ **23 rubros** con sus descripciones
- ✅ **158 subrubros** correctamente relacionados
- ✅ **24 provincias** argentinas
- ✅ **~500 departamentos** con coordenadas
- ✅ **~2,200 municipios** con relaciones correctas
- ✅ **~45,000 localidades** (opcional) con datos BAHRA

**¡Tu base de datos estará completamente poblada y lista para usar!** 🎉

---

## 📞 Contacto

Si tienes problemas durante la instalación, revisa:
1. Los logs de Docker
2. La conectividad a internet
3. Que todos los servicios estén funcionando
4. Los archivos de script estén en las ubicaciones correctas

**¡Buena suerte con la población de tu base de datos!** 🚀
