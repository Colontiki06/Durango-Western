CREATE TABLE items_carrito (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    carrito_id UUID NOT NULL REFERENCES carritos(id) ON DELETE CASCADE,

    variante_id UUID NOT NULL REFERENCES variantes_productos(id),

    cantidad INT NOT NULL,

    fecha_creacion TIMESTAMP DEFAULT NOW()
);