-- La garita universitaria no forma parte de la red de seguridad de SafeWalk U.
UPDATE reporte SET id_ubicacion = 1 WHERE id_ubicacion = 3;

DELETE rf FROM rutafavorita rf
INNER JOIN ruta_ubicacion ru ON ru.id_ruta = rf.id_ruta
WHERE ru.id_ubicacion = 3;

DELETE rp FROM ruta_punto rp
INNER JOIN ruta_ubicacion ru ON ru.id_ruta = rp.id_ruta
WHERE ru.id_ubicacion = 3;

DELETE r FROM ruta r
INNER JOIN ruta_ubicacion ru ON ru.id_ruta = r.id_ruta
WHERE ru.id_ubicacion = 3;

DELETE FROM lugarseguro WHERE LOWER(nombre) LIKE '%garita%';
DELETE FROM ubicacion WHERE id_ubicacion = 3 OR LOWER(nombre) LIKE '%garita%';
