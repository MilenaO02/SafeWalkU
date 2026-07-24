-- La garita universitaria no forma parte de la red de seguridad de SafeWalk U.
START TRANSACTION;

UPDATE reporte SET id_ubicacion = 1 WHERE id_ubicacion = 3;

CREATE TEMPORARY TABLE rutas_garita (
    id_ruta INT PRIMARY KEY
);

INSERT IGNORE INTO rutas_garita (id_ruta)
SELECT id_ruta
FROM ruta_ubicacion
WHERE id_ubicacion = 3;

DELETE rf FROM rutafavorita rf
INNER JOIN rutas_garita rg ON rg.id_ruta = rf.id_ruta;

DELETE rp FROM ruta_punto rp
INNER JOIN rutas_garita rg ON rg.id_ruta = rp.id_ruta;

DELETE ru FROM ruta_ubicacion ru
INNER JOIN rutas_garita rg ON rg.id_ruta = ru.id_ruta;

DELETE r FROM ruta r
INNER JOIN rutas_garita rg ON rg.id_ruta = r.id_ruta;

DELETE FROM lugarseguro WHERE id_ubicacion = 3 OR LOWER(nombre) LIKE '%garita%';
DELETE FROM servicioemergencia WHERE id_ubicacion = 3 OR id_ubicacion IN (SELECT id_ubicacion FROM ubicacion WHERE LOWER(nombre) LIKE '%garita%');
DELETE FROM coordenada WHERE id_ubicacion = 3 OR id_ubicacion IN (SELECT id_ubicacion FROM ubicacion WHERE LOWER(nombre) LIKE '%garita%');
DELETE FROM ubicacion WHERE id_ubicacion = 3 OR LOWER(nombre) LIKE '%garita%';

DROP TEMPORARY TABLE rutas_garita;
COMMIT;
