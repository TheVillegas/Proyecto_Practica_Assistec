-- 03_add_subcategorias.sql
-- Agregar tabla subcategorias_producto y modificar solicitud_ingreso

-- 1. Crear tabla subcategorias_producto
CREATE TABLE IF NOT EXISTS subcategorias_producto (
    id_subcategoria BIGSERIAL PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    id_categoria BIGINT NOT NULL REFERENCES categorias_producto(id_categoria),
    activo VARCHAR(1) DEFAULT 'S',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Modificar solicitud_ingreso: codigo_externo pasa a DEFAULT ''
ALTER TABLE solicitud_ingreso
ALTER COLUMN codigo_externo SET DEFAULT '';

-- 3. Agregar columna codigo_equipo_manual a solicitud_ingreso
ALTER TABLE solicitud_ingreso
ADD COLUMN IF NOT EXISTS codigo_equipo_manual VARCHAR(50) NULL;

-- 4. Seed de subcategorías
INSERT INTO subcategorias_producto (nombre, id_categoria) VALUES
    -- Categoría: Agua (1)
    ('Agua Potable', 1),
    ('Agua de Pozo', 1),
    ('Agua Superficial', 1),
    ('Agua Residual', 1),
    ('Agua de Mar', 1),
    -- Categoría: Alimento (2)
    ('Lácteos', 2),
    ('Cárnicos', 2),
    ('Vegetales', 2),
    ('Frutas', 2),
    ('Cereales', 2),
    ('Conservas', 2),
    -- Categoría: Harinas (3)
    ('Harina de Trigo', 3),
    ('Harina de Maíz', 3),
    ('Harina de Arroz', 3),
    ('Harina Integral', 3),
    -- Categoría: Productos Hidrobiológicos (4)
    ('Pescado Fresco', 4),
    ('Pescado Congelado', 4),
    ('Mariscos', 4),
    ('Algas', 4),
    ('Harina de Pescado', 4)
ON CONFLICT DO NOTHING;
