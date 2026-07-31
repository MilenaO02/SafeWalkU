export const RISK_ZONE_PALETTE = Object.freeze({
  BAJO: '#22C55E',
  MEDIO: '#EAB308',
  ALTO: '#F97316',
  CRITICO: '#DC2626'
});

export const riskZoneColor = (level, fallback = RISK_ZONE_PALETTE.MEDIO) =>
  RISK_ZONE_PALETTE[String(level || '').toUpperCase()] || fallback;

export const riskZoneLegend = Object.entries(RISK_ZONE_PALETTE).map(([level, color]) => ({ level, color }));
