-- Metadatos del origen y destino elegidos mediante Google Places, GPS o mapa.
-- Cada bloque es idempotente para instalaciones existentes.
SET @table_name = 'ruta';

SET @has_origen_nombre = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = @table_name AND COLUMN_NAME = 'origen_nombre');
SET @sql_origen_nombre = IF(@has_origen_nombre = 0, 'ALTER TABLE ruta ADD COLUMN origen_nombre VARCHAR(150) NULL', 'SELECT 1');
PREPARE stmt_origen_nombre FROM @sql_origen_nombre; EXECUTE stmt_origen_nombre; DEALLOCATE PREPARE stmt_origen_nombre;

SET @has_origen_direccion = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = @table_name AND COLUMN_NAME = 'origen_direccion');
SET @sql_origen_direccion = IF(@has_origen_direccion = 0, 'ALTER TABLE ruta ADD COLUMN origen_direccion VARCHAR(255) NULL', 'SELECT 1');
PREPARE stmt_origen_direccion FROM @sql_origen_direccion; EXECUTE stmt_origen_direccion; DEALLOCATE PREPARE stmt_origen_direccion;

SET @has_origen_place = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = @table_name AND COLUMN_NAME = 'origen_place_id');
SET @sql_origen_place = IF(@has_origen_place = 0, 'ALTER TABLE ruta ADD COLUMN origen_place_id VARCHAR(255) NULL', 'SELECT 1');
PREPARE stmt_origen_place FROM @sql_origen_place; EXECUTE stmt_origen_place; DEALLOCATE PREPARE stmt_origen_place;

SET @has_destino_nombre = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = @table_name AND COLUMN_NAME = 'destino_nombre');
SET @sql_destino_nombre = IF(@has_destino_nombre = 0, 'ALTER TABLE ruta ADD COLUMN destino_nombre VARCHAR(150) NULL', 'SELECT 1');
PREPARE stmt_destino_nombre FROM @sql_destino_nombre; EXECUTE stmt_destino_nombre; DEALLOCATE PREPARE stmt_destino_nombre;

SET @has_destino_direccion = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = @table_name AND COLUMN_NAME = 'destino_direccion');
SET @sql_destino_direccion = IF(@has_destino_direccion = 0, 'ALTER TABLE ruta ADD COLUMN destino_direccion VARCHAR(255) NULL', 'SELECT 1');
PREPARE stmt_destino_direccion FROM @sql_destino_direccion; EXECUTE stmt_destino_direccion; DEALLOCATE PREPARE stmt_destino_direccion;

SET @has_destino_place = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = @table_name AND COLUMN_NAME = 'destino_place_id');
SET @sql_destino_place = IF(@has_destino_place = 0, 'ALTER TABLE ruta ADD COLUMN destino_place_id VARCHAR(255) NULL', 'SELECT 1');
PREPARE stmt_destino_place FROM @sql_destino_place; EXECUTE stmt_destino_place; DEALLOCATE PREPARE stmt_destino_place;

SET @has_distancia = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = @table_name AND COLUMN_NAME = 'distancia_m');
SET @sql_distancia = IF(@has_distancia = 0, 'ALTER TABLE ruta ADD COLUMN distancia_m INT NULL', 'SELECT 1');
PREPARE stmt_distancia FROM @sql_distancia; EXECUTE stmt_distancia; DEALLOCATE PREPARE stmt_distancia;

SET @has_duracion = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = @table_name AND COLUMN_NAME = 'duracion_segundos');
SET @sql_duracion = IF(@has_duracion = 0, 'ALTER TABLE ruta ADD COLUMN duracion_segundos INT NULL', 'SELECT 1');
PREPARE stmt_duracion FROM @sql_duracion; EXECUTE stmt_duracion; DEALLOCATE PREPARE stmt_duracion;

SET @has_fuente = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = @table_name AND COLUMN_NAME = 'fuente_trazado');
SET @sql_fuente = IF(@has_fuente = 0, 'ALTER TABLE ruta ADD COLUMN fuente_trazado VARCHAR(40) NULL', 'SELECT 1');
PREPARE stmt_fuente FROM @sql_fuente; EXECUTE stmt_fuente; DEALLOCATE PREPARE stmt_fuente;
