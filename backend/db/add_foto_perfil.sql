-- Script para agregar la columna foto_perfil a la tabla usuario
-- Ejecuta este script en tu gestor MySQL (MySQL Workbench, DBeaver, etc.)
-- o via terminal: mysql -u root -p safewalku < add_foto_perfil.sql

USE safewalku;

ALTER TABLE usuario
ADD COLUMN foto_perfil VARCHAR(255) DEFAULT NULL
COMMENT 'URL de la foto de perfil del usuario (almacenada localmente en /uploads/)';
