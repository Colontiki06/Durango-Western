CREATE TABLE productos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    categoria_id UUID REFERENCES categorias(id),
    marca_id UUID REFERENCES marcas(id),

    nombre VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,

    descripcion_corta TEXT,
    descripcion TEXT,

    genero VARCHAR(50),

    material VARCHAR(150),

    destacado BOOLEAN DEFAULT FALSE,
    activo BOOLEAN DEFAULT TRUE,

    seo_titulo VARCHAR(255),
    seo_descripcion TEXT,

    fecha_creacion TIMESTAMP DEFAULT NOW(),
    fecha_actualizacion TIMESTAMP DEFAULT NOW(),
    fecha_eliminacion TIMESTAMP
);