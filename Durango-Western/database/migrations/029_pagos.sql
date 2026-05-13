CREATE TABLE pagos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    pedido_id UUID NOT NULL REFERENCES pedidos(id),

    proveedor VARCHAR(100) NOT NULL,

    proveedor_transaccion_id VARCHAR(255),

    monto NUMERIC(12,2) NOT NULL,

    estado VARCHAR(50) NOT NULL,

    respuesta_api JSONB,

    fecha_pago TIMESTAMP,

    fecha_creacion TIMESTAMP DEFAULT NOW()
);