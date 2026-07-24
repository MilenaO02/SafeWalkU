-- Fase 4: distinguir una alerta SOS cancelada de un reporte rechazado.
USE safewalku;

ALTER TABLE reporte
    MODIFY COLUMN estado ENUM(
        'PENDIENTE',
        'VALIDADO',
        'RECHAZADO',
        'DUPLICADO',
        'CANCELADO'
    ) NOT NULL DEFAULT 'PENDIENTE';
