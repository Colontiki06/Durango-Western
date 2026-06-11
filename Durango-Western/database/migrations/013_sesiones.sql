CREATE TABLE sesiones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,

    token TEXT NOT NULL,

    fecha_expiracion TIMESTAMP NOT NULL,

    fecha_creacion TIMESTAMP DEFAULT NOW()
);