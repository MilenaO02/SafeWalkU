USE safewalku;

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

SET @PASSWORD_HASH = '$2b$10$2.eu4fNb14pX0VxtAxAZP.2YiYb3JGNi3QRt.6Fol/.v/AR3k.J4y';

INSERT INTO usuario (id_usuario, nombre, apellido, correo, contrasena, rol, estado) VALUES
(1,'Edgar Anderson','Bustos Castillo','edgar.bustos1@uide.edu.ec',@PASSWORD_HASH,'ESTUDIANTE','ACTIVO'),
(2,'Hector Antonio','Campoverde Rodriguez','hector.campoverde2@uide.edu.ec',@PASSWORD_HASH,'ESTUDIANTE','ACTIVO'),
(3,'Anyela Carolina','Carpio Torres','anyela.carpio3@uide.edu.ec',@PASSWORD_HASH,'ESTUDIANTE','ACTIVO'),
(4,'Carlo Sebastián','Carrion Espinosa','carlo.carrion4@uide.edu.ec',@PASSWORD_HASH,'ESTUDIANTE','ACTIVO'),
(5,'Joseph Steven','Cartuche Vicente','joseph.cartuche5@uide.edu.ec',@PASSWORD_HASH,'ESTUDIANTE','ACTIVO'),
(6,'Charlie Alexander','Cardenas Toledo','charlie.cardenas6@uide.edu.ec',@PASSWORD_HASH,'ADMINISTRADOR','ACTIVO'),
(7,'Steven Paul','Chininin Camacas','steven.chininin7@uide.edu.ec',@PASSWORD_HASH,'ESTUDIANTE','ACTIVO'),
(8,'Stephano Dilan','Galvez Perez','stephano.galvez8@uide.edu.ec',@PASSWORD_HASH,'ESTUDIANTE','ACTIVO'),
(9,'Maria Jose','Guanca Guaman','maria.guanca9@uide.edu.ec',@PASSWORD_HASH,'ESTUDIANTE','ACTIVO'),
(10,'Diego Fernando','Fernando Lopez Saquicela','diego.lopez10@uide.edu.ec',@PASSWORD_HASH,'ESTUDIANTE','ACTIVO'),
(11,'Deyvi Hernan','Masache Rengel','deyvi.masache11@uide.edu.ec',@PASSWORD_HASH,'ESTUDIANTE','ACTIVO'),
(12,'Janneth Nayerly','Medina Cambisaca','janneth.medina12@uide.edu.ec',@PASSWORD_HASH,'ESTUDIANTE','ACTIVO'),
(13,'Angel Fernando','Medina Mendoza','angel.medina13@uide.edu.ec',@PASSWORD_HASH,'ESTUDIANTE','ACTIVO'),
(14,'Alejandro David','Morocho Grageda','alejandro.morocho14@uide.edu.ec',@PASSWORD_HASH,'ADMINISTRADOR','ACTIVO'),
(15,'Milena Yamileth','Ordoñez Leon','milena.ordonez15@uide.edu.ec',@PASSWORD_HASH,'ADMINISTRADOR','ACTIVO'),
(16,'Santiago Alexander','Rios Rios','santiago.rios16@uide.edu.ec',@PASSWORD_HASH,'ESTUDIANTE','ACTIVO'),
(17,'Felix Agustin','Rodas Melgar','felix.rodas17@uide.edu.ec',@PASSWORD_HASH,'ESTUDIANTE','ACTIVO'),
(18,'Paula Alejandra','Rojas Granda','paula.rojas18@uide.edu.ec',@PASSWORD_HASH,'ESTUDIANTE','ACTIVO'),
(19,'Yostin Daniel','Ruiz Sinche','yostin.ruiz19@uide.edu.ec',@PASSWORD_HASH,'ESTUDIANTE','ACTIVO'),
(20,'Derky Alejandro','Sanchez Granda','derky.sanchez20@uide.edu.ec',@PASSWORD_HASH,'ESTUDIANTE','ACTIVO'),
(21,'Jhosty Jhair','Soto Leon','jhosty.soto21@uide.edu.ec',@PASSWORD_HASH,'ESTUDIANTE','ACTIVO'),
(22,'Aurora Marina','Zhuma Jaramillo','aurora.zhuma22@uide.edu.ec',@PASSWORD_HASH,'ESTUDIANTE','ACTIVO');

INSERT INTO administrador (id_administrador, id_usuario, cargo, fecha_asignacion) VALUES
(1,6,'Docente administrador del sistema','2026-06-01'),
(2,14,'Administrador de rutas seguras','2026-06-01'),
(3,15,'Administradora de reportes','2026-06-01');

INSERT INTO ubicacion (id_ubicacion, nombre, direccion, tipo_zona) VALUES
(1,'UIDE Campus Loja','Av. Salvador Bustamante Celi, campus Loja','UNIVERSIDAD'),
(2,'Entrada Principal UIDE','Ingreso principal del campus','UNIVERSIDAD'),
(3,'Garita Seguridad UIDE','Punto de control de seguridad institucional','LUGAR_SEGURO'),
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
(1,-3.97410000,-79.20310000,1),
(2,-3.97420000,-79.20320000,2),
(3,-3.97440000,-79.20340000,3),
(4,-3.97430000,-79.20330000,4),
(5,-3.97390000,-79.20400000,5),
(6,-3.97150000,-79.20200000,6),
(7,-3.97080000,-79.20150000,7),
(8,-3.97090000,-79.20220000,8),
(9,-3.99310000,-79.20450000,9),
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
(12,'Ruta UIDE - Garita','Ruta interna hacia garita principal','ALTO',3),
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
(2,1,3,2),
(3,2,1,1),
(4,2,4,2),
(5,3,1,1),
(6,3,5,2),
(7,4,1,1),
(8,4,6,2),
(9,5,1,1),
(10,5,7,2),
(11,6,1,1),
(12,6,8,2),
(13,7,1,1),
(14,7,9,2),
(15,8,1,1),
(16,8,10,2),
(17,9,1,1),
(18,9,11,2),
(19,10,1,1),
(20,10,12,2),
(21,11,1,1),
(22,11,13,2),
(23,12,1,1),
(24,12,14,2),
(25,13,1,1),
(26,13,15,2),
(27,14,1,1),
(28,14,16,2),
(29,15,1,1),
(30,15,17,2),
(31,16,1,1),
(32,16,18,2),
(33,17,1,1),
(34,17,19,2),
(35,18,1,1),
(36,18,20,2),
(37,19,1,1),
(38,19,21,2),
(39,20,1,1),
(40,20,22,2),
(41,21,1,1),
(42,21,1,2),
(43,22,1,1),
(44,22,2,2);

INSERT INTO reporte (id_reporte, descripcion, nivel_riesgo, estado, id_usuario, id_ubicacion, id_administrador, estado_registro) VALUES
(1,'Zona con poca iluminación durante la noche','ALTO','PENDIENTE',4,5,NULL,'ACTIVO'),
(2,'Paradero con baja presencia de personas','MEDIO','VALIDADO',5,6,3,'ACTIVO'),
(3,'Congestión vehicular en entrada principal','MEDIO','VALIDADO',6,7,1,'ACTIVO'),
(4,'Sector poco transitado en horario nocturno','ALTO','PENDIENTE',7,8,NULL,'ACTIVO'),
(5,'Ruta segura dentro del campus','BAJO','VALIDADO',8,9,3,'ACTIVO'),
(6,'Presencia de vehículos en hora pico','MEDIO','PENDIENTE',9,10,NULL,'ACTIVO'),
(7,'Falta de señalización visible','MEDIO','VALIDADO',10,11,2,'ACTIVO'),
(8,'Zona oscura cercana al parque','ALTO','RECHAZADO',11,12,3,'ACTIVO'),
(9,'Servicio de emergencia cercano identificado','BAJO','VALIDADO',12,13,1,'ACTIVO'),
(10,'Calle posterior con poca iluminación','ALTO','PENDIENTE',13,14,NULL,'ACTIVO'),
(11,'Zona con tráfico intenso','MEDIO','VALIDADO',14,15,3,'ACTIVO'),
(12,'Sector recomendado como lugar seguro','BAJO','VALIDADO',15,16,1,'ACTIVO'),
(13,'Barrio con reportes de inseguridad','ALTO','PENDIENTE',16,17,NULL,'ACTIVO'),
(14,'Ruta alternativa con mejor iluminación','BAJO','VALIDADO',17,18,3,'ACTIVO'),
(15,'Zona con baja circulación peatonal','MEDIO','PENDIENTE',18,19,NULL,'ACTIVO'),
(16,'Punto cercano a servicio médico','BAJO','VALIDADO',19,20,2,'ACTIVO'),
(17,'Sector con antecedentes de robos','ALTO','VALIDADO',20,21,3,'ACTIVO'),
(18,'Cruce peatonal con poca señalética','MEDIO','PENDIENTE',21,22,NULL,'ACTIVO'),
(19,'Acceso interno seguro','BAJO','VALIDADO',22,1,2,'ACTIVO'),
(20,'Zona posterior no recomendable con lluvia','MEDIO','VALIDADO',3,2,3,'ACTIVO'),
(21,'Falta de transporte público en horario nocturno','MEDIO','PENDIENTE',4,3,NULL,'ACTIVO'),
(22,'Punto de apoyo cercano para estudiantes','ALTO','VALIDADO',5,4,2,'ACTIVO');

INSERT INTO evidencia (id_evidencia, url_archivo, tipo_archivo, id_reporte) VALUES
(1,'https://safewalk.com/evidencias/evidencia1.jpg','IMAGEN',1),
(2,'https://safewalk.com/evidencias/evidencia2.jpg','IMAGEN',2),
(3,'https://safewalk.com/evidencias/evidencia3.jpg','IMAGEN',3),
(4,'https://safewalk.com/evidencias/evidencia4.jpg','IMAGEN',4),
(5,'https://safewalk.com/evidencias/evidencia5.mp4','VIDEO',5),
(6,'https://safewalk.com/evidencias/evidencia6.jpg','IMAGEN',6),
(7,'https://safewalk.com/evidencias/evidencia7.jpg','IMAGEN',7),
(8,'https://safewalk.com/evidencias/evidencia8.jpg','IMAGEN',8),
(9,'https://safewalk.com/evidencias/evidencia9.jpg','IMAGEN',9),
(10,'https://safewalk.com/evidencias/evidencia10.mp4','VIDEO',10),
(11,'https://safewalk.com/evidencias/evidencia11.jpg','IMAGEN',11),
(12,'https://safewalk.com/evidencias/evidencia12.jpg','IMAGEN',12),
(13,'https://safewalk.com/evidencias/evidencia13.jpg','IMAGEN',13),
(14,'https://safewalk.com/evidencias/evidencia14.jpg','IMAGEN',14),
(15,'https://safewalk.com/evidencias/evidencia15.mp4','VIDEO',15),
(16,'https://safewalk.com/evidencias/evidencia16.jpg','IMAGEN',16),
(17,'https://safewalk.com/evidencias/evidencia17.jpg','IMAGEN',17),
(18,'https://safewalk.com/evidencias/evidencia18.jpg','IMAGEN',18),
(19,'https://safewalk.com/evidencias/evidencia19.jpg','IMAGEN',19),
(20,'https://safewalk.com/evidencias/evidencia20.mp4','VIDEO',20),
(21,'https://safewalk.com/evidencias/evidencia21.jpg','IMAGEN',21),
(22,'https://safewalk.com/evidencias/evidencia22.jpg','IMAGEN',22);

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
(18,'Hospital Universitario','HOSPITAL','072560100',9),
(19,'Bomberos Loja Sur','BOMBEROS','102',20),
(20,'Policía Campus','POLICIA','911',3),
(21,'Punto ECU 911 Loja','POLICIA','911',14),
(22,'Cruz Roja Loja','HOSPITAL','131',14);

INSERT INTO lugarseguro (id_lugar_seguro, nombre, descripcion, id_ubicacion) VALUES
(1,'Garita UIDE','Punto de seguridad institucional',3),
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
(13,'Garita secundaria','Punto de vigilancia alterno',1),
(14,'Zona comercial centro','Área con presencia de personas',16),
(15,'Centro de Salud Norte','Servicio de apoyo médico',22),
(16,'Bomberos Jipiro','Punto de ayuda inmediata',7),
(17,'Policía Campus','Apoyo en zona universitaria',3),
(18,'Hospital del Día','Servicio de emergencia cercano',21),
(19,'Paradero iluminado','Zona de espera con iluminación',6),
(20,'Acceso biblioteca','Punto interno seguro',4),
(21,'UPC Las Pitas','Punto de apoyo policial',11),
(22,'Punto seguro entrada campus','Zona vigilada en la entrada',2);

INSERT INTO contactoemergencia (id_contacto, nombre, telefono, parentesco, id_usuario) VALUES
(1,'Contacto emergencia 1','0990000001','PADRE',3),
(2,'Contacto emergencia 2','0990000002','HERMANA',4),
(3,'Contacto emergencia 3','0990000003','HERMANO',3),
(4,'Contacto emergencia 4','0990000004','AMIGO',4),
(5,'Contacto emergencia 5','0990000005','OTRO',5),
(6,'Contacto emergencia 6','0990000006','PAREJA',6),
(7,'Contacto emergencia 7','0990000007','MADRE',7),
(8,'Contacto emergencia 8','0990000008','PADRE',8),
(9,'Contacto emergencia 9','0990000009','HERMANA',9),
(10,'Contacto emergencia 10','0990000010','HERMANO',10),
(11,'Contacto emergencia 11','0990000011','AMIGO',11),
(12,'Contacto emergencia 12','0990000012','OTRO',12),
(13,'Contacto emergencia 13','0990000013','PAREJA',13),
(14,'Contacto emergencia 14','0990000014','MADRE',14),
(15,'Contacto emergencia 15','0990000015','PADRE',15),
(16,'Contacto emergencia 16','0990000016','HERMANA',16),
(17,'Contacto emergencia 17','0990000017','HERMANO',17),
(18,'Contacto emergencia 18','0990000018','AMIGO',18),
(19,'Contacto emergencia 19','0990000019','OTRO',19),
(20,'Contacto emergencia 20','0990000020','PAREJA',20),
(21,'Contacto emergencia 21','0990000021','MADRE',21),
(22,'Contacto emergencia 22','0990000022','PADRE',22);

INSERT INTO rutafavorita (id_favorita, id_usuario, id_ruta, fecha_guardado) VALUES
(1,1,1,CURRENT_TIMESTAMP),
(2,2,2,CURRENT_TIMESTAMP),
(3,3,3,CURRENT_TIMESTAMP),
(4,4,4,CURRENT_TIMESTAMP),
(5,5,5,CURRENT_TIMESTAMP),
(6,6,6,CURRENT_TIMESTAMP),
(7,7,7,CURRENT_TIMESTAMP),
(8,8,8,CURRENT_TIMESTAMP),
(9,9,9,CURRENT_TIMESTAMP),
(10,10,10,CURRENT_TIMESTAMP),
(11,11,11,CURRENT_TIMESTAMP),
(12,12,12,CURRENT_TIMESTAMP),
(13,13,13,CURRENT_TIMESTAMP),
(14,14,14,CURRENT_TIMESTAMP),
(15,15,15,CURRENT_TIMESTAMP),
(16,16,16,CURRENT_TIMESTAMP),
(17,17,17,CURRENT_TIMESTAMP),
(18,18,18,CURRENT_TIMESTAMP),
(19,19,19,CURRENT_TIMESTAMP),
(20,20,20,CURRENT_TIMESTAMP),
(21,21,21,CURRENT_TIMESTAMP),
(22,22,22,CURRENT_TIMESTAMP);

INSERT INTO compartirubicacion (id_compartir, fecha_inicio, fecha_fin, estado, id_usuario, id_contacto) VALUES
(1,'2026-07-02 18:00:00','2026-07-02 19:00:00','FINALIZADO',1,1),
(2,'2026-07-03 19:00:00',NULL,'ACTIVO',2,2),
(3,'2026-07-04 20:00:00','2026-07-04 21:00:00','FINALIZADO',3,3),
(4,'2026-07-05 21:00:00',NULL,'ACTIVO',4,4),
(5,'2026-07-06 17:00:00','2026-07-06 18:00:00','FINALIZADO',5,5),
(6,'2026-07-07 18:00:00',NULL,'ACTIVO',6,6),
(7,'2026-07-08 19:00:00','2026-07-08 20:00:00','FINALIZADO',7,7),
(8,'2026-07-09 20:00:00',NULL,'ACTIVO',8,8),
(9,'2026-07-10 21:00:00','2026-07-10 22:00:00','FINALIZADO',9,9),
(10,'2026-07-01 17:00:00',NULL,'ACTIVO',10,10),
(11,'2026-07-02 18:00:00','2026-07-02 19:00:00','FINALIZADO',11,11),
(12,'2026-07-03 19:00:00',NULL,'ACTIVO',12,12),
(13,'2026-07-04 20:00:00','2026-07-04 21:00:00','FINALIZADO',13,13),
(14,'2026-07-05 21:00:00',NULL,'ACTIVO',14,14),
(15,'2026-07-06 17:00:00','2026-07-06 18:00:00','FINALIZADO',15,15),
(16,'2026-07-07 18:00:00',NULL,'ACTIVO',16,16),
(17,'2026-07-08 19:00:00','2026-07-08 20:00:00','FINALIZADO',17,17),
(18,'2026-07-09 20:00:00',NULL,'ACTIVO',18,18),
(19,'2026-07-10 21:00:00','2026-07-10 22:00:00','FINALIZADO',19,19),
(20,'2026-07-01 17:00:00',NULL,'ACTIVO',20,20),
(21,'2026-07-02 18:00:00','2026-07-02 19:00:00','FINALIZADO',21,21),
(22,'2026-07-03 19:00:00',NULL,'ACTIVO',22,22);


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
