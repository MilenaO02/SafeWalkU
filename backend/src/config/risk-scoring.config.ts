/**
 * Parametros centralizados del analisis de riesgo. Se mantienen fuera del
 * servicio para que puedan ajustarse sin alterar la geometria ni el CRUD.
 */
export const riskScoringConfig = {
    polygonPenalty: { BAJO: 6, MEDIO: 16, ALTO: 30, CRITICO: 45 },
    reportPenalty: { BAJO: 5, MEDIO: 12, ALTO: 25 },
    sosPenalty: 35,
    proximityMeters: 150,
    dynamicClusterMeters: 180,
    dynamicValidityHours: 168,
    dynamicCacheTtlMs: 5 * 60 * 1000,
    routeSampleMeters: 25
} as const;

export type RiskLevel = keyof typeof riskScoringConfig.polygonPenalty;
