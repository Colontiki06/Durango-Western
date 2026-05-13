CREATE TABLE categorias (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    categoria_padre_id UUID REFERENCES categorias(id),

    nombre VARCHAR(150) NOT NULL,
    slug VARCHAR(200) UNIQUE NOT NULL,

    descripcion TEXT,

    imagen_url TEXT,

    activa BOOLEAN DEFAULT TRUE,

    fecha_creacion TIMESTAMP DEFAULT NOW(),
    fecha_actualizacion TIMESTAMP DEFAULT NOW(),
    fecha_eliminacion TIMESTAMP
);