CREATE TABLE variantes_productos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    producto_id UUID NOT NULL REFERENCES productos(id),

    sku VARCHAR(100) UNIQUE NOT NULL,
    codigo_barras VARCHAR(100),

    precio NUMERIC(12,2) NOT NULL,
    precio_comparacion NUMERIC(12,2),

    costo NUMERIC(12,2),

    peso NUMERIC(10,2),

    activa BOOLEAN DEFAULT TRUE,

    fecha_creacion TIMESTAMP DEFAULT NOW(),
    fecha_actualizacion TIMESTAMP DEFAULT NOW(),
    fecha_eliminacion TIMESTAMP
);