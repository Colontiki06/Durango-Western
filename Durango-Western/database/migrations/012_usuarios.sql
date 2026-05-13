CREATE TABLE usuarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    rol_id UUID NOT NULL REFERENCES roles(id),

    nombre VARCHAR(150) NOT NULL,
    apellido VARCHAR(150),

    correo VARCHAR(255) UNIQUE NOT NULL,
    telefono VARCHAR(30),

    password_hash TEXT NOT NULL,

    correo_verificado BOOLEAN DEFAULT FALSE,
    activo BOOLEAN DEFAULT TRUE,

    fecha_creacion TIMESTAMP DEFAULT NOW(),
    fecha_actualizacion TIMESTAMP DEFAULT NOW(),
    fecha_eliminacion TIMESTAMP
);