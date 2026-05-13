CREATE TABLE atributos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    nombre VARCHAR(100) UNIQUE NOT NULL,

    fecha_creacion TIMESTAMP DEFAULT NOW()
);