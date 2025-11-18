#!/usr/bin/env python3
"""
Script para poblar la base de datos PostgreSQL con datos de Argentina
usando la API Georef oficial del gobierno argentino.

Fuente: https://apis.datos.gob.ar/georef/api/
Actualizado: 2025
"""

import requests
import psycopg2
from psycopg2.extras import execute_values
import json
from typing import List, Dict, Any
import time
from datetime import datetime

# =====================================================
# CONFIGURACIÓN
# =====================================================

# Configuración de base de datos
DB_CONFIG = {
    'host': 'localhost',
    'database': 'tu_base_de_datos',
    'user': 'tu_usuario',
    'password': 'tu_password',
    'port': 5432
}

# URL base de la API Georef
API_BASE_URL = "https://apis.datos.gob.ar/georef/api"

# Parámetros para la API
MAX_RESULTS = 5000  # Máximo permitido por la API


# =====================================================
# CLASE PRINCIPAL
# =====================================================

class GeorefImporter:
    def __init__(self, db_config: Dict[str, Any]):
        self.db_config = db_config
        self.conn = None
        self.cursor = None
        
    def connect(self):
        """Conectar a PostgreSQL"""
        try:
            self.conn = psycopg2.connect(**self.db_config)
            self.cursor = self.conn.cursor()
            print("✓ Conexión a PostgreSQL establecida")
        except Exception as e:
            print(f"✗ Error conectando a PostgreSQL: {e}")
            raise
    
    def disconnect(self):
        """Desconectar de PostgreSQL"""
        if self.cursor:
            self.cursor.close()
        if self.conn:
            self.conn.close()
        print("✓ Conexión cerrada")
    
    def fetch_from_api(self, endpoint: str, params: Dict[str, Any] = None) -> List[Dict]:
        """
        Obtener datos de la API Georef con paginación
        """
        all_data = []
        offset = 0
        
        if params is None:
            params = {}
        
        params['max'] = MAX_RESULTS
        
        while True:
            params['inicio'] = offset
            url = f"{API_BASE_URL}/{endpoint}"
            
            try:
                response = requests.get(url, params=params, timeout=30)
                response.raise_for_status()
                data = response.json()
                
                # Obtener la clave correcta según el endpoint
                key = endpoint
                items = data.get(key, [])
                
                if not items:
                    break
                
                all_data.extend(items)
                
                total = data.get('total', 0)
                cantidad = data.get('cantidad', 0)
                
                print(f"  → Obtenidos {len(all_data)}/{total} registros de {endpoint}")
                
                # Si ya obtuvimos todos, salir
                if len(all_data) >= total or cantidad < MAX_RESULTS:
                    break
                
                offset += MAX_RESULTS
                time.sleep(0.1)  # Pequeña pausa para no saturar la API
                
            except requests.exceptions.RequestException as e:
                print(f"✗ Error obteniendo datos de {endpoint}: {e}")
                break
        
        return all_data
    
    def import_provincias(self):
        """Importar provincias"""
        print("\n📍 Importando provincias...")
        
        provincias = self.fetch_from_api('provincias', {'campos': 'completo'})
        
        if not provincias:
            print("✗ No se obtuvieron provincias")
            return
        
        # Preparar datos para inserción
        values = []
        for p in provincias:
            values.append((
                p['id'],
                p['nombre'],
                p.get('nombre_completo', p['nombre']),
                p.get('iso_id', ''),
                p.get('iso_nombre', p['nombre']),
                p.get('categoria', 'Provincia'),
                p.get('centroide', {}).get('lat'),
                p.get('centroide', {}).get('lon'),
                json.dumps(p.get('geometria')) if 'geometria' in p else None,
                p.get('fuente', 'API Georef')
            ))
        
        # Insertar en la base de datos
        insert_query = """
            INSERT INTO geografia_ar.provincias 
            (id, nombre, nombre_completo, iso_id, iso_nombre, categoria, 
             centroide_lat, centroide_lon, geometria, fuente)
            VALUES %s
            ON CONFLICT (id) DO UPDATE SET
                nombre = EXCLUDED.nombre,
                nombre_completo = EXCLUDED.nombre_completo,
                fecha_actualizacion = CURRENT_TIMESTAMP
        """
        
        try:
            execute_values(self.cursor, insert_query, values)
            self.conn.commit()
            print(f"✓ {len(values)} provincias importadas")
        except Exception as e:
            self.conn.rollback()
            print(f"✗ Error importando provincias: {e}")
    
    def import_departamentos(self):
        """Importar departamentos"""
        print("\n🗺️  Importando departamentos...")
        
        departamentos = self.fetch_from_api('departamentos', {'campos': 'completo'})
        
        if not departamentos:
            print("✗ No se obtuvieron departamentos")
            return
        
        values = []
        for d in departamentos:
            values.append((
                d['id'],
                d['nombre'],
                d.get('nombre_completo', d['nombre']),
                d.get('categoria', 'Departamento'),
                d['provincia']['id'],
                d.get('centroide', {}).get('lat'),
                d.get('centroide', {}).get('lon'),
                json.dumps(d.get('geometria')) if 'geometria' in d else None,
                d.get('fuente', 'API Georef')
            ))
        
        insert_query = """
            INSERT INTO geografia_ar.departamentos 
            (id, nombre, nombre_completo, categoria, provincia_id,
             centroide_lat, centroide_lon, geometria, fuente)
            VALUES %s
            ON CONFLICT (id) DO UPDATE SET
                nombre = EXCLUDED.nombre,
                nombre_completo = EXCLUDED.nombre_completo,
                fecha_actualizacion = CURRENT_TIMESTAMP
        """
        
        try:
            execute_values(self.cursor, insert_query, values)
            self.conn.commit()
            print(f"✓ {len(values)} departamentos importados")
        except Exception as e:
            self.conn.rollback()
            print(f"✗ Error importando departamentos: {e}")
    
    def import_municipios(self):
        """Importar municipios"""
        print("\n🏛️  Importando municipios...")
        
        municipios = self.fetch_from_api('municipios', {'campos': 'completo'})
        
        if not municipios:
            print("✗ No se obtuvieron municipios")
            return
        
        values = []
        for m in municipios:
            # El departamento puede venir en diferentes formatos
            depto_id = None
            if 'departamento' in m and m['departamento']:
                depto_id = m['departamento'].get('id')
            
            values.append((
                m['id'],
                m['nombre'],
                m.get('nombre_completo', m['nombre']),
                m.get('categoria', 'Municipio'),
                m['provincia']['id'],
                depto_id,
                m.get('centroide', {}).get('lat'),
                m.get('centroide', {}).get('lon'),
                json.dumps(m.get('geometria')) if 'geometria' in m else None,
                m.get('fuente', 'API Georef')
            ))
        
        insert_query = """
            INSERT INTO geografia_ar.municipios 
            (id, nombre, nombre_completo, categoria, provincia_id, departamento_id,
             centroide_lat, centroide_lon, geometria, fuente)
            VALUES %s
            ON CONFLICT (id) DO UPDATE SET
                nombre = EXCLUDED.nombre,
                nombre_completo = EXCLUDED.nombre_completo,
                fecha_actualizacion = CURRENT_TIMESTAMP
        """
        
        try:
            execute_values(self.cursor, insert_query, values)
            self.conn.commit()
            print(f"✓ {len(values)} municipios importados")
        except Exception as e:
            self.conn.rollback()
            print(f"✗ Error importando municipios: {e}")
    
    def import_localidades(self):
        """Importar localidades (BAHRA)"""
        print("\n🏘️  Importando localidades BAHRA...")
        
        # Obtener asentamientos (incluye todas las localidades BAHRA)
        localidades = self.fetch_from_api('asentamientos', {'campos': 'completo'})
        
        if not localidades:
            print("✗ No se obtuvieron localidades")
            return
        
        values = []
        for l in localidades:
            # Obtener municipio si existe
            municipio_id = None
            if 'municipio' in l and l['municipio']:
                municipio_id = l['municipio'].get('id')
            
            values.append((
                l['id'],
                l['nombre'],
                l.get('categoria', ''),
                l.get('tipo', ''),
                l['provincia']['id'],
                l['departamento']['id'],
                municipio_id,
                l.get('centroide', {}).get('lat'),
                l.get('centroide', {}).get('lon'),
                json.dumps(l.get('geometria')) if 'geometria' in l else None,
                l.get('fuente', 'BAHRA')
            ))
        
        insert_query = """
            INSERT INTO geografia_ar.localidades 
            (id, nombre, categoria, tipo_asentamiento, provincia_id, departamento_id, 
             municipio_id, centroide_lat, centroide_lon, geometria, fuente)
            VALUES %s
            ON CONFLICT (id) DO UPDATE SET
                nombre = EXCLUDED.nombre,
                categoria = EXCLUDED.categoria,
                fecha_actualizacion = CURRENT_TIMESTAMP
        """
        
        try:
            # Insertar en lotes de 1000 para evitar problemas de memoria
            batch_size = 1000
            for i in range(0, len(values), batch_size):
                batch = values[i:i + batch_size]
                execute_values(self.cursor, insert_query, batch)
                self.conn.commit()
                print(f"  → Procesados {min(i + batch_size, len(values))}/{len(values)}")
            
            print(f"✓ {len(values)} localidades importadas")
        except Exception as e:
            self.conn.rollback()
            print(f"✗ Error importando localidades: {e}")
    
    def import_localidades_censales(self):
        """Importar localidades censales"""
        print("\n📊 Importando localidades censales...")
        
        localidades = self.fetch_from_api('localidades-censales', {'campos': 'completo'})
        
        if not localidades:
            print("✗ No se obtuvieron localidades censales")
            return
        
        values = []
        for l in localidades:
            municipio_id = None
            if 'municipio' in l and l['municipio']:
                municipio_id = l['municipio'].get('id')
            
            values.append((
                l['id'],
                l['nombre'],
                l['provincia']['id'],
                l['departamento']['id'],
                municipio_id,
                l.get('centroide', {}).get('lat'),
                l.get('centroide', {}).get('lon'),
                json.dumps(l.get('geometria')) if 'geometria' in l else None,
                None,  # población (no disponible en API básica)
                'INDEC'
            ))
        
        insert_query = """
            INSERT INTO geografia_ar.localidades_censales 
            (id, nombre, provincia_id, departamento_id, municipio_id,
             centroide_lat, centroide_lon, geometria, poblacion, fuente)
            VALUES %s
            ON CONFLICT (id) DO UPDATE SET
                nombre = EXCLUDED.nombre,
                fecha_actualizacion = CURRENT_TIMESTAMP
        """
        
        try:
            batch_size = 1000
            for i in range(0, len(values), batch_size):
                batch = values[i:i + batch_size]
                execute_values(self.cursor, insert_query, batch)
                self.conn.commit()
                print(f"  → Procesados {min(i + batch_size, len(values))}/{len(values)}")
            
            print(f"✓ {len(values)} localidades censales importadas")
        except Exception as e:
            self.conn.rollback()
            print(f"✗ Error importando localidades censales: {e}")
    
    def run_full_import(self):
        """Ejecutar importación completa"""
        start_time = datetime.now()
        
        print("=" * 60)
        print("IMPORTACIÓN DE DATOS GEOGRÁFICOS DE ARGENTINA")
        print("Fuente: API Georef - datos.gob.ar")
        print("=" * 60)
        
        try:
            self.connect()
            
            # Importar en orden jerárquico
            self.import_provincias()
            self.import_departamentos()
            self.import_municipios()
            self.import_localidades()
            self.import_localidades_censales()
            
            end_time = datetime.now()
            duration = end_time - start_time
            
            print("\n" + "=" * 60)
            print(f"✓ IMPORTACIÓN COMPLETADA")
            print(f"  Duración: {duration}")
            print(f"  Finalizado: {end_time.strftime('%Y-%m-%d %H:%M:%S')}")
            print("=" * 60)
            
        except Exception as e:
            print(f"\n✗ Error durante la importación: {e}")
            raise
        finally:
            self.disconnect()


# =====================================================
# FUNCIÓN PRINCIPAL
# =====================================================

def main():
    """Función principal"""
    importer = GeorefImporter(DB_CONFIG)
    importer.run_full_import()


if __name__ == "__main__":
    main()
