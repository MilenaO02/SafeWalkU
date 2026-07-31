export type RouteCandidate = {
    label: string;
    duration_min: number;
    distance_m: number;
    safety: { score: number; crossed_risk_zones: number };
};

export function selectRouteAlternatives<T extends RouteCandidate>(evaluated: T[]) {
    if (!evaluated.length) throw new Error('No existen alternativas de ruta para seleccionar');
    const sortedBySafety = [...evaluated].sort((a, b) => b.safety.score - a.safety.score || a.duration_min - b.duration_min);
    const sortedByTime = [...evaluated].sort((a, b) => a.duration_min - b.duration_min || a.distance_m - b.distance_m);
    const recommended = sortedBySafety[0];
    const fastest = sortedByTime[0];
    const sameRoute = fastest === recommended;

    recommended.label = sameRoute ? 'RECOMENDADA_MAS_RAPIDA' : 'RECOMENDADA';
    if (!sameRoute) fastest.label = 'MAS_RAPIDA';

    return {
        recommended,
        fastest,
        alternatives: sameRoute ? [recommended] : [recommended, fastest],
        comparison: {
            fastest_is_recommended: sameRoute,
            fastest_duration_min: fastest.duration_min,
            recommended_duration_min: recommended.duration_min,
            duration_difference_min: Math.max(0, recommended.duration_min - fastest.duration_min),
            distance_difference_m: Math.max(0, recommended.distance_m - fastest.distance_m),
            safety_difference_points: Math.max(0, recommended.safety.score - fastest.safety.score),
            risks_avoided: Math.max(0, fastest.safety.crossed_risk_zones - recommended.safety.crossed_risk_zones)
        }
    };
}
