-- Conserva el historial de reportes, rutas y auditorías cuando una ubicación
-- deja de estar disponible para uso operativo.
SET @location_lifecycle_exists := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ubicacion' AND COLUMN_NAME = 'estado_registro'
);
SET @location_lifecycle_sql := IF(@location_lifecycle_exists = 0,
  'ALTER TABLE ubicacion ADD COLUMN estado_registro ENUM(''ACTIVO'', ''INACTIVO'') NOT NULL DEFAULT ''ACTIVO'' AFTER tipo_zona',
  'SELECT 1'
);
PREPARE location_lifecycle_statement FROM @location_lifecycle_sql;
EXECUTE location_lifecycle_statement;
DEALLOCATE PREPARE location_lifecycle_statement;
