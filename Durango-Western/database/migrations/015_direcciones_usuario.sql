CREATE TABLE direcciones_usuario (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,

    titulo VARCHAR(100),

    nombre_receptor VARCHAR(255) NOT NULL,
    telefono VARCHAR(30),

    pais VARCHAR(100) NOT NULL,
    estado VARCHAR(100) NOT NULL,
    ciudad VARCHAR(100) NOT NULL,

    codigo_postal VARCHAR(20) NOT NULL,

    direccion_linea_1 TEXT NOT NULL,
    direccion_linea_2 TEXT,

    referencias TEXT,

    es_predeterminada BOOLEAN DEFAULT FALSE,

    fecha_creacion TIMESTAMP DEFAULT NOW(),
    fecha_actualizacion TIMESTAMP DEFAULT NOW()
);