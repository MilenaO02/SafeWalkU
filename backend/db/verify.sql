-- SafeWalk U - Verificación posterior a schema.sql y seed.sql
-- Cada consulta debe devolver 0 inconsistencias.
USE safewalku;

SELECT 'usuarios_sin_rol_admin' AS verificacion, COUNT(*) AS inconsistencias
FROM administrador a
JOIN usuario u ON u.id_usuario = a.id_usuario
WHERE u.rol <> 'ADMINISTRADOR'
UNION ALL
SELECT 'coordenadas_fuera_de_rango', COUNT(*)
FROM coordenada
WHERE latitud NOT BETWEEN -90 AND 90 OR longitud NOT BETWEEN -180 AND 180
UNION ALL
SELECT 'reportes_revisados_sin_admin', COUNT(*)
FROM reporte
WHERE estado IN ('VALIDADO', 'RECHAZADO', 'DUPLICADO') AND id_administrador IS NULL
UNION ALL
SELECT 'reportes_pendientes_con_admin', COUNT(*)
FROM reporte
WHERE estado = 'PENDIENTE' AND id_administrador IS NOT NULL
UNION ALL
SELECT 'rutas_con_orden_repetido', COUNT(*)
FROM (
    SELECT id_ruta, orden_punto
    FROM ruta_ubicacion
    GROUP BY id_ruta, orden_punto
    HAVING COUNT(*) > 1
) duplicados
UNION ALL
SELECT 'favoritas_duplicadas', COUNT(*)
FROM (
    SELECT id_usuario, id_ruta
    FROM rutafavorita
    GROUP BY id_usuario, id_ruta
    HAVING COUNT(*) > 1
) duplicados
UNION ALL
SELECT 'contactos_compartidos_por_otro_usuario', COUNT(*)
FROM compartirubicacion cu
JOIN contactoemergencia ce ON ce.id_contacto = cu.id_contacto
WHERE ce.id_usuario <> cu.id_usuario
UNION ALL
SELECT 'sesiones_con_estado_fecha_inconsistente', COUNT(*)
FROM compartirubicacion
WHERE (estado = 'ACTIVO' AND fecha_fin IS NOT NULL)
   OR (estado = 'FINALIZADO' AND fecha_fin IS NULL)
UNION ALL
SELECT 'cancelados_que_no_son_sos', COUNT(*)
FROM reporte
WHERE estado = 'CANCELADO' AND tipo_reporte <> 'SOS_PANICO'
UNION ALL
SELECT 'evidencias_de_reportes_inactivos', COUNT(*)
FROM evidencia e
JOIN reporte r ON r.id_reporte = e.id_reporte
WHERE r.estado_registro = 'INACTIVO';

-- Resumen esperado con los datos de seed.sql.
SELECT 'usuario' AS tabla, COUNT(*) AS total FROM usuario
UNION ALL SELECT 'administrador', COUNT(*) FROM administrador
UNION ALL SELECT 'ubicacion', COUNT(*) FROM ubicacion
UNION ALL SELECT 'coordenada', COUNT(*) FROM coordenada
UNION ALL SELECT 'ruta', COUNT(*) FROM ruta
UNION ALL SELECT 'ruta_ubicacion', COUNT(*) FROM ruta_ubicacion
UNION ALL SELECT 'reporte', COUNT(*) FROM reporte
UNION ALL SELECT 'evidencia', COUNT(*) FROM evidencia
UNION ALL SELECT 'servicioemergencia', COUNT(*) FROM servicioemergencia
UNION ALL SELECT 'lugarseguro', COUNT(*) FROM lugarseguro
UNION ALL SELECT 'contactoemergencia', COUNT(*) FROM contactoemergencia
UNION ALL SELECT 'rutafavorita', COUNT(*) FROM rutafavorita
UNION ALL SELECT 'compartirubicacion', COUNT(*) FROM compartirubicacion;
