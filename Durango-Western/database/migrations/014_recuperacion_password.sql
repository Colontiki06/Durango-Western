CREATE TABLE recuperacion_password (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,

    token TEXT NOT NULL,

    fecha_expiracion TIMESTAMP NOT NULL,

    usado BOOLEAN DEFAULT FALSE,

    fecha_creacion TIMESTAMP DEFAULT NOW()
);