CREATE TABLE roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    nombre VARCHAR(100) UNIQUE NOT NULL,
    descripcion TEXT,

    fecha_creacion TIMESTAMP DEFAULT NOW()
);