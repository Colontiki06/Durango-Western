CREATE TABLE sucursales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    nombre VARCHAR(150) NOT NULL,
    codigo VARCHAR(50) UNIQUE NOT NULL,

    pais VARCHAR(100),
    estado VARCHAR(100),
    ciudad VARCHAR(100),

    direccion TEXT,

    telefono VARCHAR(30),
    correo VARCHAR(255),

    activa BOOLEAN DEFAULT TRUE,

    fecha_creacion TIMESTAMP DEFAULT NOW(),
    fecha_actualizacion TIMESTAMP DEFAULT NOW(),
    fecha_eliminacion TIMESTAMP
);