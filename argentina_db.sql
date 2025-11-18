-- =====================================================
-- BASE DE DATOS DE DIVISIONES POLÍTICO-ADMINISTRATIVAS
-- REPÚBLICA ARGENTINA - Según estándar VARA
-- Fuente: API Georef (datos.gob.ar)
-- =====================================================

-- Crear esquema para mejor organización
CREATE SCHEMA IF NOT EXISTS geografia_ar;

-- =====================================================
-- TABLA: PROVINCIAS
-- División político-territorial de primer orden
-- =====================================================
CREATE TABLE geografia_ar.provincias (
    id VARCHAR(2) PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    nombre_completo VARCHAR(150) NOT NULL,
    iso_id VARCHAR(5) NOT NULL,
    iso_nombre VARCHAR(100) NOT NULL,
    categoria VARCHAR(50) NOT NULL,
    centroide_lat DECIMAL(10, 7),
    centroide_lon DECIMAL(10, 7),
    geometria JSONB,
    fuente VARCHAR(100),
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_provincia_nombre UNIQUE(nombre)
);

-- Índices para búsquedas
CREATE INDEX idx_provincias_nombre ON geografia_ar.provincias USING gin(to_tsvector('spanish', nombre));
CREATE INDEX idx_provincias_iso ON geografia_ar.provincias(iso_id);
CREATE INDEX idx_provincias_centroide ON geografia_ar.provincias(centroide_lat, centroide_lon);

-- =====================================================
-- TABLA: DEPARTAMENTOS/PARTIDOS
-- División político-administrativa de segundo orden
-- =====================================================
CREATE TABLE geografia_ar.departamentos (
    id VARCHAR(5) PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    nombre_completo VARCHAR(150) NOT NULL,
    categoria VARCHAR(50) NOT NULL,
    provincia_id VARCHAR(2) NOT NULL,
    centroide_lat DECIMAL(10, 7),
    centroide_lon DECIMAL(10, 7),
    geometria JSONB,
    fuente VARCHAR(100),
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_depto_provincia 
        FOREIGN KEY (provincia_id) 
        REFERENCES geografia_ar.provincias(id)
        ON DELETE CASCADE,
    CONSTRAINT uk_depto_nombre_provincia UNIQUE(nombre, provincia_id)
);

-- Índices
CREATE INDEX idx_departamentos_provincia ON geografia_ar.departamentos(provincia_id);
CREATE INDEX idx_departamentos_nombre ON geografia_ar.departamentos USING gin(to_tsvector('spanish', nombre));
CREATE INDEX idx_departamentos_centroide ON geografia_ar.departamentos(centroide_lat, centroide_lon);

-- =====================================================
-- TABLA: MUNICIPIOS
-- División político-administrativa de tercer orden
-- =====================================================
CREATE TABLE geografia_ar.municipios (
    id VARCHAR(6) PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    nombre_completo VARCHAR(150) NOT NULL,
    categoria VARCHAR(50) NOT NULL,
    provincia_id VARCHAR(2) NOT NULL,
    departamento_id VARCHAR(5),
    centroide_lat DECIMAL(10, 7),
    centroide_lon DECIMAL(10, 7),
    geometria JSONB,
    fuente VARCHAR(100),
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_municipio_provincia 
        FOREIGN KEY (provincia_id) 
        REFERENCES geografia_ar.provincias(id)
        ON DELETE CASCADE,
    CONSTRAINT fk_municipio_departamento 
        FOREIGN KEY (departamento_id) 
        REFERENCES geografia_ar.departamentos(id)
        ON DELETE SET NULL
);

-- Índices
CREATE INDEX idx_municipios_provincia ON geografia_ar.municipios(provincia_id);
CREATE INDEX idx_municipios_departamento ON geografia_ar.municipios(departamento_id);
CREATE INDEX idx_municipios_nombre ON geografia_ar.municipios USING gin(to_tsvector('spanish', nombre));
CREATE INDEX idx_municipios_centroide ON geografia_ar.municipios(centroide_lat, centroide_lon);

-- =====================================================
-- TABLA: LOCALIDADES (BAHRA)
-- Asentamientos humanos según Base BAHRA
-- =====================================================
CREATE TABLE geografia_ar.localidades (
    id VARCHAR(20) PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL,
    categoria VARCHAR(100),
    tipo_asentamiento VARCHAR(50),
    provincia_id VARCHAR(2) NOT NULL,
    departamento_id VARCHAR(5) NOT NULL,
    municipio_id VARCHAR(6),
    centroide_lat DECIMAL(10, 7),
    centroide_lon DECIMAL(10, 7),
    geometria JSONB,
    fuente VARCHAR(100),
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_localidad_provincia 
        FOREIGN KEY (provincia_id) 
        REFERENCES geografia_ar.provincias(id)
        ON DELETE CASCADE,
    CONSTRAINT fk_localidad_departamento 
        FOREIGN KEY (departamento_id) 
        REFERENCES geografia_ar.departamentos(id)
        ON DELETE CASCADE,
    CONSTRAINT fk_localidad_municipio 
        FOREIGN KEY (municipio_id) 
        REFERENCES geografia_ar.municipios(id)
        ON DELETE SET NULL
);

-- Índices
CREATE INDEX idx_localidades_provincia ON geografia_ar.localidades(provincia_id);
CREATE INDEX idx_localidades_departamento ON geografia_ar.localidades(departamento_id);
CREATE INDEX idx_localidades_municipio ON geografia_ar.localidades(municipio_id);
CREATE INDEX idx_localidades_nombre ON geografia_ar.localidades USING gin(to_tsvector('spanish', nombre));
CREATE INDEX idx_localidades_tipo ON geografia_ar.localidades(tipo_asentamiento);
CREATE INDEX idx_localidades_centroide ON geografia_ar.localidades(centroide_lat, centroide_lon);

-- =====================================================
-- TABLA: LOCALIDADES CENSALES (INDEC)
-- Localidades según definición censal INDEC
-- =====================================================
CREATE TABLE geografia_ar.localidades_censales (
    id VARCHAR(20) PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL,
    provincia_id VARCHAR(2) NOT NULL,
    departamento_id VARCHAR(5) NOT NULL,
    municipio_id VARCHAR(6),
    centroide_lat DECIMAL(10, 7),
    centroide_lon DECIMAL(10, 7),
    geometria JSONB,
    poblacion INTEGER,
    fuente VARCHAR(100),
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_localidad_censal_provincia 
        FOREIGN KEY (provincia_id) 
        REFERENCES geografia_ar.provincias(id)
        ON DELETE CASCADE,
    CONSTRAINT fk_localidad_censal_departamento 
        FOREIGN KEY (departamento_id) 
        REFERENCES geografia_ar.departamentos(id)
        ON DELETE CASCADE
);

-- Índices
CREATE INDEX idx_localidades_censales_provincia ON geografia_ar.localidades_censales(provincia_id);
CREATE INDEX idx_localidades_censales_departamento ON geografia_ar.localidades_censales(departamento_id);
CREATE INDEX idx_localidades_censales_nombre ON geografia_ar.localidades_censales USING gin(to_tsvector('spanish', nombre));
CREATE INDEX idx_localidades_censales_poblacion ON geografia_ar.localidades_censales(poblacion);

-- =====================================================
-- VISTAS ÚTILES
-- =====================================================

-- Vista jerárquica completa
CREATE OR REPLACE VIEW geografia_ar.jerarquia_completa AS
SELECT 
    l.id as localidad_id,
    l.nombre as localidad,
    l.categoria as tipo_localidad,
    m.id as municipio_id,
    m.nombre as municipio,
    d.id as departamento_id,
    d.nombre as departamento,
    d.categoria as tipo_departamento,
    p.id as provincia_id,
    p.nombre as provincia,
    l.centroide_lat,
    l.centroide_lon
FROM geografia_ar.localidades l
JOIN geografia_ar.departamentos d ON l.departamento_id = d.id
JOIN geografia_ar.provincias p ON l.provincia_id = p.id
LEFT JOIN geografia_ar.municipios m ON l.municipio_id = m.id;

-- Vista de provincias con conteo de divisiones
CREATE OR REPLACE VIEW geografia_ar.provincias_estadisticas AS
SELECT 
    p.id,
    p.nombre,
    COUNT(DISTINCT d.id) as cantidad_departamentos,
    COUNT(DISTINCT m.id) as cantidad_municipios,
    COUNT(DISTINCT l.id) as cantidad_localidades
FROM geografia_ar.provincias p
LEFT JOIN geografia_ar.departamentos d ON p.id = d.provincia_id
LEFT JOIN geografia_ar.municipios m ON p.id = m.provincia_id
LEFT JOIN geografia_ar.localidades l ON p.id = l.provincia_id
GROUP BY p.id, p.nombre
ORDER BY p.nombre;

-- =====================================================
-- FUNCIONES ÚTILES
-- =====================================================

-- Función para buscar localidades por nombre (fuzzy search)
CREATE OR REPLACE FUNCTION geografia_ar.buscar_localidad(
    p_nombre VARCHAR
)
RETURNS TABLE (
    id VARCHAR,
    nombre VARCHAR,
    provincia VARCHAR,
    departamento VARCHAR,
    similitud REAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        l.id,
        l.nombre,
        p.nombre as provincia,
        d.nombre as departamento,
        similarity(l.nombre, p_nombre) as similitud
    FROM geografia_ar.localidades l
    JOIN geografia_ar.provincias p ON l.provincia_id = p.id
    JOIN geografia_ar.departamentos d ON l.departamento_id = d.id
    WHERE l.nombre % p_nombre
    ORDER BY similitud DESC
    LIMIT 10;
END;
$$ LANGUAGE plpgsql;

-- Función para obtener jerarquía completa de una localidad
CREATE OR REPLACE FUNCTION geografia_ar.obtener_jerarquia(
    p_localidad_id VARCHAR
)
RETURNS TABLE (
    nivel VARCHAR,
    id VARCHAR,
    nombre VARCHAR
) AS $$
BEGIN
    RETURN QUERY
    SELECT 'Provincia'::VARCHAR, p.id, p.nombre
    FROM geografia_ar.localidades l
    JOIN geografia_ar.provincias p ON l.provincia_id = p.id
    WHERE l.id = p_localidad_id
    UNION ALL
    SELECT 'Departamento'::VARCHAR, d.id, d.nombre
    FROM geografia_ar.localidades l
    JOIN geografia_ar.departamentos d ON l.departamento_id = d.id
    WHERE l.id = p_localidad_id
    UNION ALL
    SELECT 'Municipio'::VARCHAR, m.id, m.nombre
    FROM geografia_ar.localidades l
    JOIN geografia_ar.municipios m ON l.municipio_id = m.id
    WHERE l.id = p_localidad_id AND m.id IS NOT NULL
    UNION ALL
    SELECT 'Localidad'::VARCHAR, l.id, l.nombre
    FROM geografia_ar.localidades l
    WHERE l.id = p_localidad_id;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- COMENTARIOS EN LAS TABLAS
-- =====================================================
COMMENT ON SCHEMA geografia_ar IS 'Esquema para datos geográficos de Argentina según estándar VARA';
COMMENT ON TABLE geografia_ar.provincias IS 'Provincias de Argentina (división político-territorial de primer orden)';
COMMENT ON TABLE geografia_ar.departamentos IS 'Departamentos y Partidos (división político-administrativa de segundo orden)';
COMMENT ON TABLE geografia_ar.municipios IS 'Municipios (división político-administrativa de tercer orden)';
COMMENT ON TABLE geografia_ar.localidades IS 'Localidades según BAHRA (Base de Asentamientos Humanos)';
COMMENT ON TABLE geografia_ar.localidades_censales IS 'Localidades censales según INDEC';

-- =====================================================
-- PERMISOS (ajustar según necesidad)
-- =====================================================
-- GRANT USAGE ON SCHEMA geografia_ar TO tu_usuario;
-- GRANT SELECT ON ALL TABLES IN SCHEMA geografia_ar TO tu_usuario;

-- =====================================================
-- TRIGGERS DE AUDITORÍA
-- =====================================================

-- Función genérica para actualizar timestamp
CREATE OR REPLACE FUNCTION geografia_ar.actualizar_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.fecha_actualizacion = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger a todas las tablas
CREATE TRIGGER trg_actualizar_provincias
    BEFORE UPDATE ON geografia_ar.provincias
    FOR EACH ROW EXECUTE FUNCTION geografia_ar.actualizar_timestamp();

CREATE TRIGGER trg_actualizar_departamentos
    BEFORE UPDATE ON geografia_ar.departamentos
    FOR EACH ROW EXECUTE FUNCTION geografia_ar.actualizar_timestamp();

CREATE TRIGGER trg_actualizar_municipios
    BEFORE UPDATE ON geografia_ar.municipios
    FOR EACH ROW EXECUTE FUNCTION geografia_ar.actualizar_timestamp();

CREATE TRIGGER trg_actualizar_localidades
    BEFORE UPDATE ON geografia_ar.localidades
    FOR EACH ROW EXECUTE FUNCTION geografia_ar.actualizar_timestamp();

CREATE TRIGGER trg_actualizar_localidades_censales
    BEFORE UPDATE ON geografia_ar.localidades_censales
    FOR EACH ROW EXECUTE FUNCTION geografia_ar.actualizar_timestamp();

-- =====================================================
-- FIN DEL SCRIPT
-- =====================================================