CREATE TABLE promociones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    nombre VARCHAR(255) NOT NULL,

    descripcion TEXT,

    tipo_descuento VARCHAR(50) NOT NULL,

    valor_descuento NUMERIC(12,2) NOT NULL,

    fecha_inicio TIMESTAMP,
    fecha_expiracion TIMESTAMP,

    activa BOOLEAN DEFAULT TRUE,

    fecha_creacion TIMESTAMP DEFAULT NOW()
);