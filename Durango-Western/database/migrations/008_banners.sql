CREATE TABLE banners (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    titulo VARCHAR(255),

    imagen_url TEXT NOT NULL,

    url_redireccion TEXT,

    activo BOOLEAN DEFAULT TRUE,

    fecha_inicio TIMESTAMP,
    fecha_fin TIMESTAMP,

    fecha_creacion TIMESTAMP DEFAULT NOW()
);