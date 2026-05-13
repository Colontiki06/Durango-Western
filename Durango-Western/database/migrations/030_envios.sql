CREATE TABLE envios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    pedido_id UUID NOT NULL REFERENCES pedidos(id),

    metodo_envio_id UUID REFERENCES metodos_envio(id),

    numero_rastreo VARCHAR(255),

    estado VARCHAR(50),

    etiqueta_envio_url TEXT,

    fecha_envio TIMESTAMP,
    fecha_entrega TIMESTAMP,

    fecha_creacion TIMESTAMP DEFAULT NOW()
);