-- Correcciones respaldadas por direcciones oficiales y fuentes cartograficas.
-- Los puntos internos del campus pueden afinarse desde Admin > Ubicaciones.
SET @has_verified = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'coordenada' AND COLUMN_NAME = 'verificada');
SET @sql_verified = IF(@has_verified = 0, 'ALTER TABLE coordenada ADD COLUMN verificada TINYINT(1) NOT NULL DEFAULT 0', 'SELECT 1');
PREPARE stmt_verified FROM @sql_verified;
EXECUTE stmt_verified;
DEALLOCATE PREPARE stmt_verified;

SET @has_source = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'coordenada' AND COLUMN_NAME = 'fuente');
SET @sql_source = IF(@has_source = 0, 'ALTER TABLE coordenada ADD COLUMN fuente VARCHAR(100) DEFAULT NULL', 'SELECT 1');
PREPARE stmt_source FROM @sql_source;
EXECUTE stmt_source;
DEALLOCATE PREPARE stmt_source;

UPDATE ubicacion
SET direccion = 'Calle Agustin Carrion Palacios entre Av. Salvador Bustamante Celi y Beethoven, sector Jipiro, Loja'
WHERE id_ubicacion = 1;

UPDATE coordenada SET latitud = -3.97245000, longitud = -79.19933000 WHERE id_ubicacion = 1;
UPDATE coordenada SET latitud = -3.97252000, longitud = -79.19942000 WHERE id_ubicacion = 2;
UPDATE coordenada SET latitud = -3.97256000, longitud = -79.19946000 WHERE id_ubicacion = 3;
UPDATE coordenada SET latitud = -3.97239000, longitud = -79.19925000 WHERE id_ubicacion = 4;

UPDATE ubicacion SET nombre = 'Parque Recreacional Jipiro', direccion = 'Av. Velasco Ibarra entre Daniel Armijos y Av. Salvador Bustamante Celi, Loja' WHERE id_ubicacion = 7;
UPDATE coordenada SET latitud = -3.97203900, longitud = -79.20351400 WHERE id_ubicacion = 7;
UPDATE coordenada SET verificada = 1, fuente = 'Municipio de Loja / ficha geografica publica' WHERE id_ubicacion = 7;

UPDATE ubicacion SET nombre = 'Hospital General Isidro Ayora', direccion = 'Av. Manuel Agustin Aguirre y Juan Jose Samaniego, Loja' WHERE id_ubicacion = 9;
UPDATE coordenada SET latitud = -3.99345200, longitud = -79.20639200 WHERE id_ubicacion = 9;
UPDATE coordenada SET verificada = 1, fuente = 'Estudio UNL / cartografia OpenStreetMap' WHERE id_ubicacion = 9;

UPDATE ubicacion SET nombre = 'Terminal Terrestre Reina del Cisne', direccion = 'Av. 8 de Diciembre y Victoriano Palacios, Loja' WHERE id_ubicacion = 15;
