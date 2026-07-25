-- Compatibilidad idempotente para instalaciones creadas antes de las fases 3 y 4.

SET @has_user_photo = (
    SELECT COUNT(*)
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'usuario'
      AND COLUMN_NAME = 'foto_perfil'
);
SET @sql_user_photo = IF(
    @has_user_photo = 0,
    'ALTER TABLE usuario ADD COLUMN foto_perfil VARCHAR(255) DEFAULT NULL COMMENT ''URL de la foto de perfil''',
    'SELECT 1'
);
PREPARE stmt_user_photo FROM @sql_user_photo;
EXECUTE stmt_user_photo;
DEALLOCATE PREPARE stmt_user_photo;

SET @has_report_type = (
    SELECT COUNT(*)
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'reporte'
      AND COLUMN_NAME = 'tipo_reporte'
);
SET @sql_report_type = IF(
    @has_report_type = 0,
    'ALTER TABLE reporte ADD COLUMN tipo_reporte ENUM(''INCIDENTE'', ''SOS_PANICO'') NOT NULL DEFAULT ''INCIDENTE''',
    'SELECT 1'
);
PREPARE stmt_report_type FROM @sql_report_type;
EXECUTE stmt_report_type;
DEALLOCATE PREPARE stmt_report_type;

SET @has_report_registry_status = (
    SELECT COUNT(*)
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'reporte'
      AND COLUMN_NAME = 'estado_registro'
);
SET @sql_report_registry_status = IF(
    @has_report_registry_status = 0,
    'ALTER TABLE reporte ADD COLUMN estado_registro ENUM(''ACTIVO'', ''INACTIVO'') NOT NULL DEFAULT ''ACTIVO''',
    'SELECT 1'
);
PREPARE stmt_report_registry_status FROM @sql_report_registry_status;
EXECUTE stmt_report_registry_status;
DEALLOCATE PREPARE stmt_report_registry_status;

SET @has_location_city = (
    SELECT COUNT(*)
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'ubicacion'
      AND COLUMN_NAME = 'ciudad'
);
SET @sql_location_city = IF(
    @has_location_city = 0,
    'ALTER TABLE ubicacion ADD COLUMN ciudad VARCHAR(100) NOT NULL DEFAULT ''Loja''',
    'SELECT 1'
);
PREPARE stmt_location_city FROM @sql_location_city;
EXECUTE stmt_location_city;
DEALLOCATE PREPARE stmt_location_city;

SET @has_location_radius = (
    SELECT COUNT(*)
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'ubicacion'
      AND COLUMN_NAME = 'radio_metros'
);
SET @sql_location_radius = IF(
    @has_location_radius = 0,
    'ALTER TABLE ubicacion ADD COLUMN radio_metros INT NOT NULL DEFAULT 50',
    'SELECT 1'
);
PREPARE stmt_location_radius FROM @sql_location_radius;
EXECUTE stmt_location_radius;
DEALLOCATE PREPARE stmt_location_radius;

ALTER TABLE reporte
    MODIFY COLUMN estado ENUM(
        'PENDIENTE',
        'VALIDADO',
        'RECHAZADO',
        'DUPLICADO',
        'CANCELADO'
    ) NOT NULL DEFAULT 'PENDIENTE';
