CREATE TABLE cupones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    codigo VARCHAR(100) UNIQUE NOT NULL,

    tipo_descuento VARCHAR(50) NOT NULL,

    valor_descuento NUMERIC(12,2) NOT NULL,

    fecha_inicio TIMESTAMP,
    fecha_expiracion TIMESTAMP,

    limite_uso INT,
    cantidad_usos INT DEFAULT 0,

    activo BOOLEAN DEFAULT TRUE,

    fecha_creacion TIMESTAMP DEFAULT NOW()
);