-- Compatibilidad para bases creadas antes de incorporar SOS y borrado lógico.
USE safewalku;

ALTER TABLE reporte
    ADD COLUMN tipo_reporte ENUM('INCIDENTE', 'SOS_PANICO') NOT NULL DEFAULT 'INCIDENTE',
    ADD COLUMN estado_registro ENUM('ACTIVO', 'INACTIVO') NOT NULL DEFAULT 'ACTIVO';
