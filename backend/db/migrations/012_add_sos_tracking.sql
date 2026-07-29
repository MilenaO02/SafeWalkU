-- SOS GPS tracking (additive and idempotent)
SET @has_fecha_atencion := (
    SELECT COUNT(*)
    FROM information_schema.columns
    WHERE table_schema = DATABASE()
      AND table_name = 'reporte'
      AND column_name = 'fecha_atencion'
);
SET @add_fecha_atencion := IF(
    @has_fecha_atencion = 0,
    'ALTER TABLE reporte ADD COLUMN fecha_atencion DATETIME NULL AFTER fecha_captura_gps',
    'SELECT 1'
);
PREPARE statement FROM @add_fecha_atencion;
EXECUTE statement;
DEALLOCATE PREPARE statement;

