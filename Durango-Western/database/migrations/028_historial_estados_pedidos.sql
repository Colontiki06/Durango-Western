CREATE TABLE historial_estados_pedidos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    pedido_id UUID NOT NULL REFERENCES pedidos(id),

    estado VARCHAR(50) NOT NULL,

    notas TEXT,

    fecha_creacion TIMESTAMP DEFAULT NOW()
);