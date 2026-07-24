USE safewalku;

CREATE TABLE IF NOT EXISTS ruta_punto (
    id_ruta_punto INT NOT NULL AUTO_INCREMENT,
    id_ruta INT NOT NULL,
    orden_punto INT NOT NULL,
    latitud DECIMAL(10,8) NOT NULL,
    longitud DECIMAL(11,8) NOT NULL,
    tipo ENUM('INICIO','INTERMEDIO','CRUCE','APOYO','DESTINO') NOT NULL DEFAULT 'INTERMEDIO',
    observacion VARCHAR(255) DEFAULT NULL,
    PRIMARY KEY (id_ruta_punto),
    UNIQUE KEY idx_rutapunto_orden (id_ruta, orden_punto),
    KEY idx_rutapunto_ruta (id_ruta),
    CONSTRAINT fk_rutapunto_ruta FOREIGN KEY (id_ruta) REFERENCES ruta (id_ruta) ON DELETE CASCADE,
    CONSTRAINT chk_rutapunto_orden CHECK (orden_punto > 0),
    CONSTRAINT chk_rutapunto_latitud CHECK (latitud BETWEEN -90 AND 90),
    CONSTRAINT chk_rutapunto_longitud CHECK (longitud BETWEEN -180 AND 180)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
