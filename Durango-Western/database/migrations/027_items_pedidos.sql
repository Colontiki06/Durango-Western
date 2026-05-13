CREATE TABLE items_pedidos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    pedido_id UUID NOT NULL REFERENCES pedidos(id),

    producto_id UUID,
    variante_id UUID,

    nombre_producto VARCHAR(255) NOT NULL,
    descripcion_variante VARCHAR(255),

    sku VARCHAR(100),

    imagen_url TEXT,

    precio_unitario NUMERIC(12,2) NOT NULL,

    cantidad INT NOT NULL,

    subtotal NUMERIC(12,2) NOT NULL,

    fecha_creacion TIMESTAMP DEFAULT NOW()
);