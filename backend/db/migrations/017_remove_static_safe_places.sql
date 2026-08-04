-- Los lugares seguros deben ser definidos por administracion desde el editor.
-- Elimina los lugares de demostracion cargados por seed.sql sin tocar nuevos lugares con otros nombres.
DELETE FROM lugarseguro
WHERE nombre IN (
  'Biblioteca UIDE',
  'UPC Jipiro',
  'Hospital Isidro Ayora',
  'Bomberos Norte',
  'Parque Jipiro iluminado',
  'Entrada principal UIDE',
  'Parque Central',
  'Terminal Terrestre',
  'Centro Médico Loja',
  'UPC Sauces Norte',
  'UPC Motupe',
  'Zona comercial centro',
  'Centro de Salud Norte',
  'Bomberos Jipiro',
  'Hospital del Día',
  'Paradero iluminado',
  'Acceso biblioteca',
  'UPC Las Pitas',
  'Punto seguro entrada campus'
);

UPDATE ubicacion
SET tipo_zona = 'UNIVERSIDAD'
WHERE nombre = 'Biblioteca UIDE' AND tipo_zona = 'LUGAR_SEGURO';