-- Reinicio controlado del catalogo para entornos de desarrollo.
-- Debe habilitarse de forma explicita en la misma sesion MySQL:
-- SET @ALLOW_SAFEWALK_RESET = 1;
-- SOURCE backend/db/seed.sql;
-- La barrera evita ejecutar por accidente los TRUNCATE en produccion.
USE safewalku;

CREATE TEMPORARY TABLE `_safewalk_seed_guard` (
  `permitido` TINYINT NOT NULL CHECK (`permitido` = 1)
);
INSERT INTO `_safewalk_seed_guard` (`permitido`)
VALUES (COALESCE(@ALLOW_SAFEWALK_RESET, 0));
DROP TEMPORARY TABLE `_safewalk_seed_guard`;

SET FOREIGN_KEY_CHECKS = 0;

TRUNCATE TABLE compartirubicacion;
TRUNCATE TABLE rutafavorita;
TRUNCATE TABLE evidencia;
TRUNCATE TABLE reporte;
TRUNCATE TABLE ruta_ubicacion;
TRUNCATE TABLE servicioemergencia;
TRUNCATE TABLE lugarseguro;
TRUNCATE TABLE coordenada;
TRUNCATE TABLE administrador;
TRUNCATE TABLE contactoemergencia;
TRUNCATE TABLE ruta;
TRUNCATE TABLE ubicacion;
TRUNCATE TABLE usuario;
SET FOREIGN_KEY_CHECKS = 1;

INSERT INTO ubicacion (id_ubicacion, nombre, direccion, tipo_zona) VALUES
(1,'UIDE Campus Loja','Av. Salvador Bustamante Celi, campus Loja','UNIVERSIDAD'),
(2,'Entrada Principal UIDE','Ingreso principal del campus','UNIVERSIDAD'),
(4,'Biblioteca UIDE','Interior del campus universitario','LUGAR_SEGURO'),
(5,'Calle Beethoven','Parte posterior del campus UIDE','CALLE'),
(6,'Paradero Jipiro','Parada de transporte público sector Jipiro','PARADERO'),
(7,'Parque Jipiro','Av. Salvador Bustamante Celi','PARQUE'),
(8,'UPC Jipiro','Unidad de Policía Comunitaria sector Jipiro','SERVICIO_EMERGENCIA'),
(9,'Hospital Isidro Ayora','Av. Iberoamérica, Loja','SERVICIO_EMERGENCIA'),
(10,'Bomberos Norte Loja','Sector norte de Loja','SERVICIO_EMERGENCIA'),
(11,'Barrio Las Pitas','Sector Las Pitas, Loja','BARRIO'),
(12,'Barrio Sauces Norte','Sector Sauces Norte, Loja','BARRIO'),
(13,'Barrio Motupe','Sector Motupe, Loja','BARRIO'),
(14,'Parque Central Loja','Centro histórico de Loja','PARQUE'),
(15,'Terminal Terrestre Loja','Av. 8 de Diciembre','PARADERO'),
(16,'Zona Rosa Loja','Zona comercial y nocturna del centro','BARRIO'),
(17,'Vía Zamora','Salida oriental de Loja','CALLE'),
(18,'Túnel de los Ahorcados','Sector oriental de Loja','CALLE'),
(19,'Calle 10 de Agosto','Centro de Loja','CALLE'),
(20,'Calle Ramón Pinto','Centro de Loja','CALLE'),
(21,'Hospital del Día','Centro médico cercano','SERVICIO_EMERGENCIA'),
(22,'Centro de Salud Norte','Sector norte de Loja','SERVICIO_EMERGENCIA');

INSERT INTO coordenada (id_coordenada, latitud, longitud, id_ubicacion) VALUES
(1,-3.97245000,-79.19933000,1),
(2,-3.97252000,-79.19942000,2),
(4,-3.97239000,-79.19925000,4),
(5,-3.97390000,-79.20400000,5),
(6,-3.97150000,-79.20200000,6),
(7,-3.97203900,-79.20351400,7),
(8,-3.97090000,-79.20220000,8),
(9,-3.99345200,-79.20639200,9),
(10,-3.96980000,-79.20530000,10),
(11,-3.96500000,-79.21000000,11),
(12,-3.96010000,-79.21400000,12),
(13,-3.95000000,-79.22000000,13),
(14,-3.99600000,-79.20100000,14),
(15,-3.98750000,-79.20900000,15),
(16,-3.99550000,-79.20240000,16),
(17,-3.99000000,-79.19000000,17),
(18,-3.98500000,-79.18800000,18),
(19,-3.99900000,-79.20300000,19),
(20,-3.99820000,-79.20410000,20),
(21,-3.99100000,-79.20550000,21),
(22,-3.96250000,-79.21150000,22);

INSERT INTO ruta (id_ruta, nombre_ruta, descripcion, nivel_seguridad, tiempo_estimado) VALUES
(1,'Ruta UIDE - Jipiro','Ruta desde el campus hacia el sector Jipiro','ALTO',12),
(2,'Ruta UIDE - Paradero Jipiro','Ruta hacia parada de transporte público','MEDIO',8),
(3,'Ruta interna Biblioteca','Recorrido seguro dentro del campus hacia biblioteca','ALTO',5),
(4,'Ruta UIDE - Sauces Norte','Ruta hacia Sauces Norte','MEDIO',20),
(5,'Ruta UIDE - Motupe','Ruta hacia Motupe','MEDIO',25),
(6,'Ruta UIDE - Parque Central','Ruta hacia el centro de Loja','MEDIO',30),
(7,'Ruta UIDE - Hospital','Ruta hacia Hospital Isidro Ayora','ALTO',18),
(8,'Ruta UIDE - UPC Jipiro','Ruta hacia UPC cercana','ALTO',10),
(9,'Ruta UIDE - Terminal','Ruta hacia terminal terrestre','MEDIO',22),
(10,'Ruta UIDE - Las Pitas','Ruta hacia barrio Las Pitas','MEDIO',28),
(11,'Ruta UIDE - Beethoven','Ruta posterior del campus','BAJO',10),
(13,'Ruta UIDE - Bomberos Norte','Ruta hacia estación de bomberos','ALTO',14),
(14,'Ruta UIDE - Zona Rosa','Ruta hacia zona céntrica con mayor riesgo nocturno','BAJO',35),
(15,'Ruta UIDE - Vía Zamora','Ruta hacia vía Zamora','BAJO',32),
(16,'Ruta UIDE - Ramón Pinto','Ruta hacia Ramón Pinto','MEDIO',29),
(17,'Ruta UIDE - 10 de Agosto','Ruta hacia calle 10 de Agosto','MEDIO',31),
(18,'Ruta UIDE - Parque Jipiro','Ruta directa al parque Jipiro','ALTO',13),
(19,'Ruta UIDE - Centro de Salud Norte','Ruta hacia centro de salud','ALTO',19),
(20,'Ruta UIDE - Hospital del Día','Ruta hacia hospital del día','ALTO',21),
(21,'Ruta alternativa norte','Ruta alternativa hacia zona norte','MEDIO',24),
(22,'Ruta segura campus nocturna','Ruta recomendada para salida nocturna del campus','ALTO',6);

INSERT INTO ruta_ubicacion (id_ruta_ubicacion, id_ruta, id_ubicacion, orden_punto) VALUES
(1,1,1,1),
(2,1,7,2),
(3,2,1,1),
(4,2,6,2),
(5,3,1,1),
(6,3,4,2),
(7,4,1,1),
(8,4,12,2),
(9,5,1,1),
(10,5,13,2),
(11,6,1,1),
(12,6,14,2),
(13,7,1,1),
(14,7,9,2),
(15,8,1,1),
(16,8,8,2),
(17,9,1,1),
(18,9,15,2),
(19,10,1,1),
(20,10,11,2),
(21,11,1,1),
(22,11,5,2),
(25,13,1,1),
(26,13,10,2),
(27,14,1,1),
(28,14,16,2),
(29,15,1,1),
(30,15,17,2),
(31,16,1,1),
(32,16,20,2),
(33,17,1,1),
(34,17,19,2),
(35,18,1,1),
(36,18,7,2),
(37,19,1,1),
(38,19,22,2),
(39,20,1,1),
(40,20,21,2),
(41,21,1,1),
(42,21,12,2),
(43,22,1,1),
(44,22,2,2);

INSERT INTO servicioemergencia (id_servicio, nombre, tipo, telefono, id_ubicacion) VALUES
(1,'UPC Jipiro','UPC','911',8),
(2,'Hospital Isidro Ayora','HOSPITAL','072570200',9),
(3,'Bomberos Norte Loja','BOMBEROS','102',10),
(4,'Policía Loja Centro','POLICIA','911',14),
(5,'UPC Terminal Terrestre','UPC','911',15),
(6,'Hospital del Día','HOSPITAL','072545000',21),
(7,'Centro de Salud Norte','HOSPITAL','072530000',22),
(8,'Bomberos Jipiro','BOMBEROS','102',7),
(9,'Policía Comunitaria Norte','POLICIA','911',12),
(10,'UPC Motupe','UPC','911',13),
(11,'Bomberos Motupe','BOMBEROS','102',13),
(12,'Policía Zona Rosa','POLICIA','911',16),
(13,'UPC Las Pitas','UPC','911',11),
(14,'Centro Médico Loja','HOSPITAL','072555000',19),
(15,'Bomberos Centro','BOMBEROS','102',14),
(16,'Policía Vía Zamora','POLICIA','911',17),
(17,'UPC Sauces Norte','UPC','911',12),
(19,'Bomberos Loja Sur','BOMBEROS','102',20),
(21,'Punto ECU 911 Loja','POLICIA','911',14),
(22,'Cruz Roja Loja','HOSPITAL','131',14);

INSERT INTO lugarseguro (id_lugar_seguro, nombre, descripcion, id_ubicacion) VALUES
(2,'Biblioteca UIDE','Espacio seguro dentro del campus',4),
(3,'UPC Jipiro','Unidad policial cercana',8),
(4,'Hospital Isidro Ayora','Atención médica cercana',9),
(5,'Bomberos Norte','Apoyo en emergencias',10),
(6,'Parque Jipiro iluminado','Zona pública con presencia ciudadana',7),
(7,'Entrada principal UIDE','Punto de control institucional',2),
(8,'Parque Central','Zona con alta circulación',14),
(9,'Terminal Terrestre','Lugar con vigilancia y transporte',15),
(10,'Centro Médico Loja','Servicio médico cercano',19),
(11,'UPC Sauces Norte','Unidad policial del sector',12),
(12,'UPC Motupe','Unidad policial del sector',13),
(14,'Zona comercial centro','Área con presencia de personas',16),
(15,'Centro de Salud Norte','Servicio de apoyo médico',22),
(16,'Bomberos Jipiro','Punto de ayuda inmediata',7),
(18,'Hospital del Día','Servicio de emergencia cercano',21),
(19,'Paradero iluminado','Zona de espera con iluminación',6),
(20,'Acceso biblioteca','Punto interno seguro',4),
(21,'UPC Las Pitas','Punto de apoyo policial',11),
(22,'Punto seguro entrada campus','Zona vigilada en la entrada',2);

-- Verificación de cantidad de registros principales
SELECT 'usuario' AS tabla, COUNT(*) AS total FROM usuario
UNION ALL SELECT 'ubicacion', COUNT(*) FROM ubicacion
UNION ALL SELECT 'coordenada', COUNT(*) FROM coordenada
UNION ALL SELECT 'ruta', COUNT(*) FROM ruta
UNION ALL SELECT 'reporte', COUNT(*) FROM reporte
UNION ALL SELECT 'evidencia', COUNT(*) FROM evidencia
UNION ALL SELECT 'servicioemergencia', COUNT(*) FROM servicioemergencia
UNION ALL SELECT 'lugarseguro', COUNT(*) FROM lugarseguro
UNION ALL SELECT 'contactoemergencia', COUNT(*) FROM contactoemergencia;
