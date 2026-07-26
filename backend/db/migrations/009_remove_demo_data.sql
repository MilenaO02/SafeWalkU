-- Retira de produccion los datos demostrativos historicos.
-- Esta migracion se ejecuta dentro de una transaccion administrada por
-- scripts/migrate-route-geometry.mjs.

-- Una revision realizada por una cuenta demostrativa no constituye una
-- validacion real. Se conserva el reporte real y vuelve a la cola pendiente.
UPDATE reporte AS r
INNER JOIN administrador AS a
    ON a.id_administrador = r.id_administrador
SET
    r.estado = 'PENDIENTE',
    r.id_administrador = NULL
WHERE a.id_usuario BETWEEN 1 AND 24
  AND r.id_usuario NOT BETWEEN 1 AND 24;

-- Las cuentas 1 a 24 y toda su actividad fueron confirmadas como datos demo.
-- El usuario 14 se conserva por decision funcional, pero sin actividad demo.
DELETE FROM evidencia
WHERE url_archivo LIKE 'https://safewalk.com/evidencias/%';

-- Algunas instalaciones antiguas no tienen ON DELETE CASCADE en evidencia.
-- Se eliminan explicitamente todos los adjuntos de reportes demo antes del padre.
DELETE e
FROM evidencia AS e
INNER JOIN reporte AS r
    ON r.id_reporte = e.id_reporte
WHERE r.id_usuario BETWEEN 1 AND 24;

DELETE FROM reporte
WHERE id_usuario BETWEEN 1 AND 24;

DELETE FROM rutafavorita
WHERE id_usuario BETWEEN 1 AND 24;

DELETE FROM compartirubicacion
WHERE id_usuario BETWEEN 1 AND 24;

DELETE FROM contactoemergencia
WHERE id_usuario BETWEEN 1 AND 24;

DELETE FROM administrador
WHERE id_usuario BETWEEN 1 AND 24;

UPDATE usuario
SET
    rol = 'ESTUDIANTE',
    estado = 'INACTIVO'
WHERE id_usuario = 14;

DELETE FROM usuario
WHERE id_usuario BETWEEN 1 AND 24
  AND id_usuario <> 14;

-- Registro duplicado e inconsistente: apuntaba al Hospital Isidro Ayora.
DELETE FROM servicioemergencia
WHERE id_servicio = 18
  AND nombre = 'Hospital Universitario'
  AND id_ubicacion = 9;
