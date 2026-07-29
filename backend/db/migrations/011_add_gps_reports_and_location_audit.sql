-- SafeWalk U: GPS real para reportes y trazabilidad de correcciones administrativas.
-- Migración aditiva: no elimina ni modifica registros existentes.

ALTER TABLE reporte
    ADD COLUMN precision_gps DECIMAL(8,2) NULL AFTER estado_registro,
    ADD COLUMN fecha_captura_gps DATETIME NULL AFTER precision_gps;

CREATE TABLE auditoria_coordenada (
    id_auditoria BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    id_ubicacion INT NOT NULL,
    id_usuario_admin INT NOT NULL,
    latitud_anterior DECIMAL(10,8) NULL,
    longitud_anterior DECIMAL(11,8) NULL,
    latitud_nueva DECIMAL(10,8) NOT NULL,
    longitud_nueva DECIMAL(11,8) NOT NULL,
    fecha_actualizacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id_auditoria),
    KEY idx_auditoria_ubicacion_fecha (id_ubicacion, fecha_actualizacion),
    KEY idx_auditoria_admin (id_usuario_admin),
    CONSTRAINT fk_auditoria_coordenada_ubicacion
        FOREIGN KEY (id_ubicacion) REFERENCES ubicacion (id_ubicacion),
    CONSTRAINT fk_auditoria_coordenada_admin
        FOREIGN KEY (id_usuario_admin) REFERENCES usuario (id_usuario)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
