CREATE TABLE variantes_valores_atributos (
    variante_id UUID REFERENCES variantes_productos(id) ON DELETE CASCADE,
    valor_atributo_id UUID REFERENCES valores_atributos(id) ON DELETE CASCADE,

    PRIMARY KEY(variante_id, valor_atributo_id)
);