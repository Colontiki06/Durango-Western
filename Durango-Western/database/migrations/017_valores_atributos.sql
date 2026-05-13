CREATE TABLE valores_atributos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    atributo_id UUID NOT NULL REFERENCES atributos(id),

    valor VARCHAR(100) NOT NULL,

    fecha_creacion TIMESTAMP DEFAULT NOW()
);