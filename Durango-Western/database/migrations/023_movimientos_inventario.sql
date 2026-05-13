CREATE TABLE movimientos_inventario (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    inventario_id UUID NOT NULL REFERENCES inventario(id),

    tipo_movimiento VARCHAR(50) NOT NULL,

    cantidad INT NOT NULL,

    tipo_referencia VARCHAR(50),
    referencia_id UUID,

    notas TEXT,

    fecha_creacion TIMESTAMP DEFAULT NOW()
);