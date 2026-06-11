CREATE TABLE paginas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    titulo VARCHAR(255) NOT NULL,

    slug VARCHAR(255) UNIQUE NOT NULL,

    contenido TEXT,

    seo_titulo VARCHAR(255),
    seo_descripcion TEXT,

    publicada BOOLEAN DEFAULT FALSE,

    fecha_creacion TIMESTAMP DEFAULT NOW(),
    fecha_actualizacion TIMESTAMP DEFAULT NOW()
);