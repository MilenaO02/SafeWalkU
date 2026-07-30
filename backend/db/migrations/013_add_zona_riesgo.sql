-- Zonas de riesgo permanentes aprobadas por administracion.
-- Las zonas dinamicas no se guardan aqui hasta ser aprobadas.
USE safewalku;

CREATE TABLE IF NOT EXISTS zona_riesgo (
    id_zona INT NOT NULL AUTO_INCREMENT,
    nombre VARCHAR(150) NOT NULL,
    descripcion VARCHAR(500) NOT NULL,
    observaciones VARCHAR(500) DEFAULT NULL,
    nivel_riesgo ENUM('BAJO','MEDIO','ALTO','CRITICO') NOT NULL,
    tipo_riesgo ENUM('ROBO','ASALTO','ACOSO','POCA_ILUMINACION','ACCIDENTES','ZONA_CONFLICTIVA','OTRO') NOT NULL,
    estado ENUM('ACTIVA','INACTIVA') NOT NULL DEFAULT 'ACTIVA',
    origen_zona ENUM('ADMINISTRADOR','DINAMICA_APROBADA') NOT NULL DEFAULT 'ADMINISTRADOR',
    color VARCHAR(9) NOT NULL DEFAULT '#f97316',
    opacidad DECIMAL(3,2) NOT NULL DEFAULT 0.35,
    radio_proximidad_metros INT NOT NULL DEFAULT 80,
    polygon_json JSON NOT NULL,
    min_lat DECIMAL(10,8) NOT NULL,
    max_lat DECIMAL(10,8) NOT NULL,
    min_lng DECIMAL(11,8) NOT NULL,
    max_lng DECIMAL(11,8) NOT NULL,
    fecha_creacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    id_administrador INT NOT NULL,
    PRIMARY KEY (id_zona),
    KEY idx_zona_riesgo_estado (estado),
    KEY idx_zona_riesgo_bbox (min_lat, max_lat, min_lng, max_lng),
    KEY idx_zona_riesgo_admin (id_administrador),
    CONSTRAINT fk_zona_riesgo_administrador FOREIGN KEY (id_administrador)
      REFERENCES administrador(id_administrador),
    CONSTRAINT chk_zona_riesgo_lat CHECK (min_lat BETWEEN -90 AND 90 AND max_lat BETWEEN -90 AND 90 AND min_lat <= max_lat),
    CONSTRAINT chk_zona_riesgo_lng CHECK (min_lng BETWEEN -180 AND 180 AND max_lng BETWEEN -180 AND 180 AND min_lng <= max_lng),
    CONSTRAINT chk_zona_riesgo_opacidad CHECK (opacidad >= 0.05 AND opacidad <= 0.90),
    CONSTRAINT chk_zona_riesgo_radio CHECK (radio_proximidad_metros BETWEEN 10 AND 1000)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
