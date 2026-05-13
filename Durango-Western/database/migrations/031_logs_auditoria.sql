CREATE TABLE logs_auditoria (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    usuario_id UUID REFERENCES usuarios(id),

    accion VARCHAR(100) NOT NULL,

    tipo_entidad VARCHAR(100),

    entidad_id UUID,

    valores_anteriores JSONB,
    valores_nuevos JSONB,

    fecha_creacion TIMESTAMP DEFAULT NOW()
);

