CREATE TABLE inventario (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    sucursal_id UUID NOT NULL REFERENCES sucursales(id),
    variante_id UUID NOT NULL REFERENCES variantes_productos(id),

    cantidad INT DEFAULT 0,
    cantidad_reservada INT DEFAULT 0,

    fecha_creacion TIMESTAMP DEFAULT NOW(),
    fecha_actualizacion TIMESTAMP DEFAULT NOW(),

    UNIQUE(sucursal_id, variante_id)
);
