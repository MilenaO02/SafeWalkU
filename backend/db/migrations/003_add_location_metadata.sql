-- Compatibilidad para bases creadas antes de la fase 2.
USE safewalku;

ALTER TABLE ubicacion
    ADD COLUMN ciudad VARCHAR(100) NOT NULL DEFAULT 'Loja',
    ADD COLUMN radio_metros INT NOT NULL DEFAULT 50;
