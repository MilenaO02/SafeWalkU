-- Catálogo operativo único de servicios oficiales para Loja.
-- Las ubicaciones históricas se conservan inactivas para no romper reportes ni rutas.
START TRANSACTION;

UPDATE ubicacion u
INNER JOIN servicioemergencia s ON s.id_ubicacion = u.id_ubicacion
SET u.estado_registro = 'INACTIVO';

INSERT INTO ubicacion (nombre, direccion, ciudad, radio_metros, tipo_zona, estado_registro)
SELECT 'ECU 911 Loja', 'Barrio Turunuma Alto, calles Barcelona y Zaragoza', 'Loja', 80, 'SERVICIO_EMERGENCIA', 'ACTIVO'
WHERE NOT EXISTS (SELECT 1 FROM ubicacion WHERE nombre = 'ECU 911 Loja');

INSERT INTO ubicacion (nombre, direccion, ciudad, radio_metros, tipo_zona, estado_registro)
SELECT 'Cruz Roja Loja', 'Av. Universitaria 04-26 y Quito', 'Loja', 80, 'SERVICIO_EMERGENCIA', 'ACTIVO'
WHERE NOT EXISTS (SELECT 1 FROM ubicacion WHERE nombre = 'Cruz Roja Loja');

INSERT INTO ubicacion (nombre, direccion, ciudad, radio_metros, tipo_zona, estado_registro)
SELECT 'Cuerpo de Bomberos de Loja', 'Av. Universitaria y 10 de Agosto', 'Loja', 80, 'SERVICIO_EMERGENCIA', 'ACTIVO'
WHERE NOT EXISTS (SELECT 1 FROM ubicacion WHERE nombre = 'Cuerpo de Bomberos de Loja');

UPDATE ubicacion
SET direccion = 'Av. Manuel Agustín Aguirre y Juan José Samaniego', ciudad = 'Loja',
    radio_metros = 80, tipo_zona = 'SERVICIO_EMERGENCIA', estado_registro = 'ACTIVO'
WHERE nombre = 'Hospital General Isidro Ayora';

UPDATE ubicacion
SET tipo_zona = 'SERVICIO_EMERGENCIA', estado_registro = 'ACTIVO'
WHERE nombre IN ('ECU 911 Loja', 'Cruz Roja Loja', 'Cuerpo de Bomberos de Loja');

INSERT INTO coordenada (latitud, longitud, verificada, fuente, id_ubicacion)
SELECT -3.97455950, -79.20790710, 1, 'Google Places: ECU-911 Loja', id_ubicacion
FROM ubicacion WHERE nombre = 'ECU 911 Loja'
ON DUPLICATE KEY UPDATE latitud = VALUES(latitud), longitud = VALUES(longitud), verificada = 1, fuente = VALUES(fuente);

INSERT INTO coordenada (latitud, longitud, verificada, fuente, id_ubicacion)
SELECT -3.99386440, -79.20520530, 1, 'Google Places: Cruz Roja Ecuatoriana Junta Provincial de Loja', id_ubicacion
FROM ubicacion WHERE nombre = 'Cruz Roja Loja'
ON DUPLICATE KEY UPDATE latitud = VALUES(latitud), longitud = VALUES(longitud), verificada = 1, fuente = VALUES(fuente);

INSERT INTO coordenada (latitud, longitud, verificada, fuente, id_ubicacion)
SELECT -3.99718611, -79.20488333, 1, 'Municipio de Loja: parada Los Bomberos', id_ubicacion
FROM ubicacion WHERE nombre = 'Cuerpo de Bomberos de Loja'
ON DUPLICATE KEY UPDATE latitud = VALUES(latitud), longitud = VALUES(longitud), verificada = 1, fuente = VALUES(fuente);

INSERT INTO coordenada (latitud, longitud, verificada, fuente, id_ubicacion)
SELECT -3.99354720, -79.20616370, 1, 'Google Places: Hospital Isidro Ayora', id_ubicacion
FROM ubicacion WHERE nombre = 'Hospital General Isidro Ayora'
ON DUPLICATE KEY UPDATE latitud = VALUES(latitud), longitud = VALUES(longitud), verificada = 1, fuente = VALUES(fuente);

DELETE FROM servicioemergencia;

INSERT INTO servicioemergencia (nombre, tipo, telefono, id_ubicacion)
SELECT 'ECU 911 Loja', 'POLICIA', '911', id_ubicacion FROM ubicacion WHERE nombre = 'ECU 911 Loja'
UNION ALL
SELECT 'Cruz Roja Loja', 'HOSPITAL', '072570200', id_ubicacion FROM ubicacion WHERE nombre = 'Cruz Roja Loja'
UNION ALL
SELECT 'Cuerpo de Bomberos de Loja', 'BOMBEROS', '102', id_ubicacion FROM ubicacion WHERE nombre = 'Cuerpo de Bomberos de Loja'
UNION ALL
SELECT 'Hospital General Isidro Ayora', 'HOSPITAL', '072570540', id_ubicacion FROM ubicacion WHERE nombre = 'Hospital General Isidro Ayora';

COMMIT;
