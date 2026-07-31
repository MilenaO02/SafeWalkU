const WORDS = {
  SOS: 'SOS', GPS: 'GPS', UIDE: 'UIDE',
  PANICO: 'pánico', ILUMINACION: 'iluminación', CRITICO: 'crítico',
  UBICACION: 'ubicación', CONFIGURACION: 'configuración',
  ADMINISTRADOR: 'administrador', ESTUDIANTE: 'estudiante'
};

export function formatLabel(value) {
  if (value === null || value === undefined || value === '') return '';
  return String(value)
    .trim()
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((word, index) => {
      const upper = word.toLocaleUpperCase('es-EC');
      const label = WORDS[upper] || upper.toLocaleLowerCase('es-EC');
      return index === 0 && !['SOS', 'GPS', 'UIDE'].includes(label)
        ? `${label.charAt(0).toLocaleUpperCase('es-EC')}${label.slice(1)}`
        : label;
    })
    .join(' ');
}
