CREATE TABLE imagenes_productos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    producto_id UUID REFERENCES productos(id) ON DELETE CASCADE,
    variante_id UUID REFERENCES variantes_productos(id) ON DELETE CASCADE,

    imagen_url TEXT NOT NULL,

    texto_alternativo VARCHAR(255),

    orden INT DEFAULT 0,

    fecha_creacion TIMESTAMP DEFAULT NOW()
);

