CREATE TABLE pedidos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    usuario_id UUID REFERENCES usuarios(id),

    direccion_id UUID REFERENCES direcciones_usuario(id),

    numero_pedido VARCHAR(50) UNIQUE NOT NULL,

    estado VARCHAR(50) NOT NULL,

    subtotal NUMERIC(12,2) NOT NULL,
    costo_envio NUMERIC(12,2) DEFAULT 0,
    impuestos NUMERIC(12,2) DEFAULT 0,
    descuento NUMERIC(12,2) DEFAULT 0,

    total NUMERIC(12,2) NOT NULL,

    moneda VARCHAR(10) DEFAULT 'MXN',

    estado_pago VARCHAR(50) DEFAULT 'pendiente',

    notas TEXT,

    fecha_creacion TIMESTAMP DEFAULT NOW(),
    fecha_actualizacion TIMESTAMP DEFAULT NOW()
);