CREATE TABLE promociones_productos (
    promocion_id UUID REFERENCES promociones(id) ON DELETE CASCADE,
    producto_id UUID REFERENCES productos(id) ON DELETE CASCADE,

    PRIMARY KEY(promocion_id, producto_id)
);