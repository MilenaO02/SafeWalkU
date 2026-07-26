-- Autoriza el modo administrativo para la cuenta real confirmada sin cambiar
-- su rol principal de estudiante. El middleware valida esta pertenencia en
-- cada solicitud protegida y no confía solamente en el JWT.
INSERT INTO administrador (id_usuario, cargo, fecha_asignacion)
SELECT
    u.id_usuario,
    'Administradora del sistema SafeWalk U',
    CURRENT_DATE
FROM usuario AS u
WHERE u.id_usuario = 27
  AND u.correo = 'miordonezle@uide.edu.ec'
  AND u.rol = 'ESTUDIANTE'
  AND u.estado = 'ACTIVO'
ON DUPLICATE KEY UPDATE
    cargo = 'Administradora del sistema SafeWalk U';
