CREATE TABLE configuraciones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    clave VARCHAR(150) UNIQUE NOT NULL,

    valor TEXT,

    fecha_creacion TIMESTAMP DEFAULT NOW(),
    fecha_actualizacion TIMESTAMP DEFAULT NOW()
);