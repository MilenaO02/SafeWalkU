export const PRIMARY_GEOLOCATION_OPTIONS = Object.freeze({
  enableHighAccuracy: true,
  timeout: 20000,
  maximumAge: 30000
});

export const FALLBACK_GEOLOCATION_OPTIONS = Object.freeze({
  enableHighAccuracy: false,
  timeout: 20000,
  maximumAge: 60000
});

const shouldRetry = (error) => error?.code === 2 || error?.code === 3;

export function getGeolocationError(error) {
  const messages = {
    1: ['denied', 'No se pudo acceder a tu ubicación porque Safari o iOS no autorizaron este sitio. En iPhone revisa Ajustes > Privacidad y seguridad > Localización > Safari o Sitios web de Safari; permite la ubicación y activa Ubicación precisa.'],
    2: ['unavailable', 'El permiso está disponible, pero el iPhone no pudo determinar tu ubicación en este momento. Verifica que Localización esté activada y vuelve a intentarlo.'],
    3: ['timeout', 'El iPhone tardó demasiado en obtener la ubicación. Inténtalo nuevamente en un lugar con mejor señal.']
  };
  const [status, message] = messages[error?.code] || ['error', 'No fue posible obtener la ubicación del dispositivo.'];
  return { status, message };
}

export function withUserLocationMarker(previous, position) {
  return {
    ...previous,
    centro: position,
    zoom: 16,
    markers: [
      ...previous.markers.filter((marker) => marker.kind !== 'user'),
      { position, kind: 'user', title: 'Tu ubicación', desc: 'Ubicación GPS actual' }
    ]
  };
}

/**
 * Obtiene una posición mediante una llamada iniciada directamente por el usuario.
 * No consulta Permissions API: en Safari/iOS no es una fuente fiable de permisos.
 */
export function requestCurrentPosition({ geolocation, onPosition, onError, onDiagnostic, now = Date.now }) {
  let completed = false;

  const attempt = (options, attemptNumber) => {
    const startedAt = now();

    geolocation.getCurrentPosition(
      (position) => {
        if (completed) return;
        completed = true;
        onDiagnostic?.({
          attempt: attemptNumber,
          outcome: 'success',
          durationMs: Math.max(0, now() - startedAt)
        });
        onPosition(position);
      },
      (error) => {
        if (completed) return;
        onDiagnostic?.({
          attempt: attemptNumber,
          outcome: 'error',
          code: Number.isInteger(error?.code) ? error.code : null,
          durationMs: Math.max(0, now() - startedAt)
        });

        if (attemptNumber === 1 && shouldRetry(error)) {
          attempt(FALLBACK_GEOLOCATION_OPTIONS, 2);
          return;
        }

        completed = true;
        onError(error, { usedFallback: attemptNumber === 2 });
      },
      options
    );
  };

  attempt(PRIMARY_GEOLOCATION_OPTIONS, 1);
}
