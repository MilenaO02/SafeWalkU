-- SafeWalk U - Unified Database Schema
-- Version: 1.0.0
-- Database: safewalku

CREATE DATABASE IF NOT EXISTS `safewalku` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
USE `safewalku`;

SET FOREIGN_KEY_CHECKS = 0;

-- 1. Tabla: usuario
DROP TABLE IF EXISTS `usuario`;
CREATE TABLE `usuario` (
  `id_usuario` INT NOT NULL AUTO_INCREMENT,
  `nombre` VARCHAR(100) NOT NULL,
  `apellido` VARCHAR(100) NOT NULL,
  `correo` VARCHAR(100) NOT NULL,
  `contrasena` VARCHAR(255) NOT NULL,
  `rol` ENUM('ESTUDIANTE','ADMINISTRADOR') NOT NULL DEFAULT 'ESTUDIANTE',
  `foto_perfil` VARCHAR(255) DEFAULT NULL,
  `fecha_registro` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `estado` ENUM('ACTIVO','INACTIVO') NOT NULL DEFAULT 'ACTIVO',
  PRIMARY KEY (`id_usuario`),
  UNIQUE KEY `idx_usuario_correo` (`correo`),
  KEY `idx_usuario_estado` (`estado`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 2. Tabla: administrador
DROP TABLE IF EXISTS `administrador`;
CREATE TABLE `administrador` (
  `id_administrador` INT NOT NULL AUTO_INCREMENT,
  `id_usuario` INT NOT NULL,
  `cargo` VARCHAR(100) NOT NULL,
  `fecha_asignacion` DATE NOT NULL,
  PRIMARY KEY (`id_administrador`),
  UNIQUE KEY `idx_admin_usuario` (`id_usuario`),
  CONSTRAINT `fk_admin_usuario` FOREIGN KEY (`id_usuario`) REFERENCES `usuario` (`id_usuario`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 3. Tabla: ubicacion
DROP TABLE IF EXISTS `ubicacion`;
CREATE TABLE `ubicacion` (
  `id_ubicacion` INT NOT NULL AUTO_INCREMENT,
  `nombre` VARCHAR(100) NOT NULL,
  `direccion` VARCHAR(255) NOT NULL,
  `ciudad` VARCHAR(100) NOT NULL DEFAULT 'Loja',
  `radio_metros` INT NOT NULL DEFAULT 50,
  `tipo_zona` ENUM('UNIVERSIDAD','CALLE','PARQUE','BARRIO','PARADERO','LUGAR_SEGURO','SERVICIO_EMERGENCIA') NOT NULL,
  PRIMARY KEY (`id_ubicacion`),
  KEY `idx_ubicacion_ciudad` (`ciudad`),
  CONSTRAINT `chk_ubicacion_radio` CHECK (`radio_metros` > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 4. Tabla: coordenada
DROP TABLE IF EXISTS `coordenada`;
CREATE TABLE `coordenada` (
  `id_coordenada` INT NOT NULL AUTO_INCREMENT,
  `latitud` DECIMAL(10,8) NOT NULL,
  `longitud` DECIMAL(11,8) NOT NULL,
  `verificada` TINYINT(1) NOT NULL DEFAULT 0,
  `fuente` VARCHAR(100) DEFAULT NULL,
  `id_ubicacion` INT NOT NULL,
  PRIMARY KEY (`id_coordenada`),
  UNIQUE KEY `idx_coordenada_ubicacion` (`id_ubicacion`),
  CONSTRAINT `fk_coordenada_ubicacion` FOREIGN KEY (`id_ubicacion`) REFERENCES `ubicacion` (`id_ubicacion`) ON DELETE CASCADE,
  CONSTRAINT `chk_coordenada_latitud` CHECK (`latitud` BETWEEN -90 AND 90),
  CONSTRAINT `chk_coordenada_longitud` CHECK (`longitud` BETWEEN -180 AND 180)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 5. Tabla: reporte
DROP TABLE IF EXISTS `reporte`;
CREATE TABLE `reporte` (
  `id_reporte` INT NOT NULL AUTO_INCREMENT,
  `descripcion` TEXT NOT NULL,
  `fecha_reporte` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `nivel_riesgo` ENUM('BAJO','MEDIO','ALTO') NOT NULL,
  `estado` ENUM('PENDIENTE','VALIDADO','RECHAZADO','DUPLICADO','CANCELADO') NOT NULL DEFAULT 'PENDIENTE',
  `tipo_reporte` ENUM('INCIDENTE','SOS_PANICO') NOT NULL DEFAULT 'INCIDENTE',
  `id_usuario` INT NOT NULL,
  `id_ubicacion` INT NOT NULL,
  `id_administrador` INT DEFAULT NULL,
  `estado_registro` ENUM('ACTIVO','INACTIVO') DEFAULT 'ACTIVO',
  PRIMARY KEY (`id_reporte`),
  KEY `idx_reporte_usuario` (`id_usuario`),
  KEY `idx_reporte_ubicacion` (`id_ubicacion`),
  KEY `idx_reporte_admin` (`id_administrador`),
  CONSTRAINT `fk_reporte_usuario` FOREIGN KEY (`id_usuario`) REFERENCES `usuario` (`id_usuario`),
  CONSTRAINT `fk_reporte_ubicacion` FOREIGN KEY (`id_ubicacion`) REFERENCES `ubicacion` (`id_ubicacion`),
  CONSTRAINT `fk_reporte_admin` FOREIGN KEY (`id_administrador`) REFERENCES `administrador` (`id_administrador`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 6. Tabla: evidencia
DROP TABLE IF EXISTS `evidencia`;
CREATE TABLE `evidencia` (
  `id_evidencia` INT NOT NULL AUTO_INCREMENT,
  `url_archivo` VARCHAR(255) NOT NULL,
  `tipo_archivo` ENUM('IMAGEN','VIDEO') NOT NULL,
  `id_reporte` INT NOT NULL,
  PRIMARY KEY (`id_evidencia`),
  KEY `idx_evidencia_reporte` (`id_reporte`),
  CONSTRAINT `fk_evidencia_reporte` FOREIGN KEY (`id_reporte`) REFERENCES `reporte` (`id_reporte`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 7. Tabla: contactoemergencia
DROP TABLE IF EXISTS `contactoemergencia`;
CREATE TABLE `contactoemergencia` (
  `id_contacto` INT NOT NULL AUTO_INCREMENT,
  `nombre` VARCHAR(100) NOT NULL,
  `telefono` VARCHAR(20) NOT NULL,
  `parentesco` ENUM('PADRE','MADRE','HERMANO','HERMANA','AMIGO','PAREJA','OTRO') NOT NULL,
  `id_usuario` INT NOT NULL,
  PRIMARY KEY (`id_contacto`),
  KEY `idx_contacto_usuario` (`id_usuario`),
  UNIQUE KEY `idx_contacto_usuario_pair` (`id_contacto`, `id_usuario`),
  CONSTRAINT `fk_contacto_usuario` FOREIGN KEY (`id_usuario`) REFERENCES `usuario` (`id_usuario`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 8. Tabla: servicioemergencia
DROP TABLE IF EXISTS `servicioemergencia`;
CREATE TABLE `servicioemergencia` (
  `id_servicio` INT NOT NULL AUTO_INCREMENT,
  `nombre` VARCHAR(100) NOT NULL,
  `tipo` ENUM('POLICIA','UPC','BOMBEROS','HOSPITAL') NOT NULL,
  `telefono` VARCHAR(20) NOT NULL,
  `id_ubicacion` INT NOT NULL,
  PRIMARY KEY (`id_servicio`),
  KEY `idx_servicio_ubicacion` (`id_ubicacion`),
  CONSTRAINT `fk_servicio_ubicacion` FOREIGN KEY (`id_ubicacion`) REFERENCES `ubicacion` (`id_ubicacion`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 9. Tabla: lugarseguro
DROP TABLE IF EXISTS `lugarseguro`;
CREATE TABLE `lugarseguro` (
  `id_lugar_seguro` INT NOT NULL AUTO_INCREMENT,
  `nombre` VARCHAR(100) NOT NULL,
  `descripcion` VARCHAR(255) DEFAULT NULL,
  `id_ubicacion` INT NOT NULL,
  PRIMARY KEY (`id_lugar_seguro`),
  KEY `idx_lugarseguro_ubicacion` (`id_ubicacion`),
  CONSTRAINT `fk_lugarseguro_ubicacion` FOREIGN KEY (`id_ubicacion`) REFERENCES `ubicacion` (`id_ubicacion`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 10. Tabla: compartirubicacion
DROP TABLE IF EXISTS `compartirubicacion`;
CREATE TABLE `compartirubicacion` (
  `id_compartir` INT NOT NULL AUTO_INCREMENT,
  `fecha_inicio` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `fecha_fin` DATETIME DEFAULT NULL,
  `estado` ENUM('ACTIVO','FINALIZADO') NOT NULL DEFAULT 'ACTIVO',
  `id_usuario` INT NOT NULL,
  `id_contacto` INT NOT NULL,
  PRIMARY KEY (`id_compartir`),
  KEY `idx_compartir_usuario` (`id_usuario`),
  KEY `idx_compartir_contacto` (`id_contacto`),
  CONSTRAINT `fk_compartir_contacto_usuario` FOREIGN KEY (`id_contacto`, `id_usuario`) REFERENCES `contactoemergencia` (`id_contacto`, `id_usuario`) ON DELETE CASCADE,
  CONSTRAINT `chk_compartir_fechas` CHECK (`fecha_fin` IS NULL OR `fecha_fin` >= `fecha_inicio`),
  CONSTRAINT `chk_compartir_estado_fin` CHECK (
    (`estado` = 'ACTIVO' AND `fecha_fin` IS NULL)
    OR (`estado` = 'FINALIZADO' AND `fecha_fin` IS NOT NULL)
  )
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 11. Tabla: ruta
DROP TABLE IF EXISTS `ruta`;
CREATE TABLE `ruta` (
  `id_ruta` INT NOT NULL AUTO_INCREMENT,
  `nombre_ruta` VARCHAR(100) NOT NULL,
  `descripcion` VARCHAR(255) DEFAULT NULL,
  `nivel_seguridad` ENUM('BAJO','MEDIO','ALTO') NOT NULL,
  `tiempo_estimado` INT NOT NULL,
  PRIMARY KEY (`id_ruta`),
  CONSTRAINT `chk_ruta_tiempo` CHECK (`tiempo_estimado` > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 12. Tabla: ruta_ubicacion
DROP TABLE IF EXISTS `ruta_ubicacion`;
CREATE TABLE `ruta_ubicacion` (
  `id_ruta_ubicacion` INT NOT NULL AUTO_INCREMENT,
  `id_ruta` INT NOT NULL,
  `id_ubicacion` INT NOT NULL,
  `orden_punto` INT NOT NULL,
  PRIMARY KEY (`id_ruta_ubicacion`),
  KEY `idx_rutaub_ruta` (`id_ruta`),
  KEY `idx_rutaub_ubicacion` (`id_ubicacion`),
  UNIQUE KEY `idx_ruta_orden` (`id_ruta`, `orden_punto`),
  CONSTRAINT `fk_rutaub_ruta` FOREIGN KEY (`id_ruta`) REFERENCES `ruta` (`id_ruta`) ON DELETE CASCADE,
  CONSTRAINT `fk_rutaub_ubicacion` FOREIGN KEY (`id_ubicacion`) REFERENCES `ubicacion` (`id_ubicacion`) ON DELETE CASCADE,
  CONSTRAINT `chk_ruta_orden` CHECK (`orden_punto` > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 13. Tabla: rutafavorita
DROP TABLE IF EXISTS `ruta_punto`;
CREATE TABLE `ruta_punto` (
  `id_ruta_punto` INT NOT NULL AUTO_INCREMENT,
  `id_ruta` INT NOT NULL,
  `orden_punto` INT NOT NULL,
  `latitud` DECIMAL(10,8) NOT NULL,
  `longitud` DECIMAL(11,8) NOT NULL,
  `tipo` ENUM('INICIO','INTERMEDIO','CRUCE','APOYO','DESTINO') NOT NULL DEFAULT 'INTERMEDIO',
  `observacion` VARCHAR(255) DEFAULT NULL,
  PRIMARY KEY (`id_ruta_punto`),
  UNIQUE KEY `idx_rutapunto_orden` (`id_ruta`, `orden_punto`),
  KEY `idx_rutapunto_ruta` (`id_ruta`),
  CONSTRAINT `fk_rutapunto_ruta` FOREIGN KEY (`id_ruta`) REFERENCES `ruta` (`id_ruta`) ON DELETE CASCADE,
  CONSTRAINT `chk_rutapunto_orden` CHECK (`orden_punto` > 0),
  CONSTRAINT `chk_rutapunto_latitud` CHECK (`latitud` BETWEEN -90 AND 90),
  CONSTRAINT `chk_rutapunto_longitud` CHECK (`longitud` BETWEEN -180 AND 180)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 14. Tabla: rutafavorita
DROP TABLE IF EXISTS `rutafavorita`;
CREATE TABLE `rutafavorita` (
  `id_favorita` INT NOT NULL AUTO_INCREMENT,
  `id_usuario` INT NOT NULL,
  `id_ruta` INT NOT NULL,
  `fecha_guardado` DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_favorita`),
  KEY `idx_favorita_usuario` (`id_usuario`),
  KEY `idx_favorita_ruta` (`id_ruta`),
  UNIQUE KEY `idx_favorita_usuario_ruta` (`id_usuario`, `id_ruta`),
  CONSTRAINT `fk_favorita_usuario` FOREIGN KEY (`id_usuario`) REFERENCES `usuario` (`id_usuario`) ON DELETE CASCADE,
  CONSTRAINT `fk_favorita_ruta` FOREIGN KEY (`id_ruta`) REFERENCES `ruta` (`id_ruta`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

SET FOREIGN_KEY_CHECKS = 1;
