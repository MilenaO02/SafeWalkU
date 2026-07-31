let googleMapsPromise = null;

export function getGoogleMapsApiKey() {
  if (typeof window === 'undefined') return '';
  // La configuración se crea durante el despliegue desde variables de
  // entorno. No se usa import.meta.env para evitar que Vite incruste una
  // clave en los artefactos que puedan quedar versionados.
  return window.__SAFEWALK_CONFIG__?.googleMapsApiKey || '';
}

export function getGoogleMapsMapId() {
  if (typeof window === 'undefined') return 'DEMO_MAP_ID';
  return window.__SAFEWALK_CONFIG__?.googleMapsMapId || 'DEMO_MAP_ID';
}

async function loadLibraries() {
  const maps = window.google?.maps;
  if (!maps) {
    throw new Error('Google Maps JS API no disponible tras cargar script.');
  }

  // With loading=async the global namespace can exist before its
  // constructors are ready. importLibrary waits for each library to finish
  // initializing and avoids errors such as "Map is not a constructor".
  if (typeof maps.importLibrary === 'function') {
    const [mapsLibrary, markerLibrary, placesLibrary] = await Promise.all([
      maps.importLibrary('maps'),
      maps.importLibrary('marker'),
      maps.importLibrary('places')
    ]);

    // Google namespace objects do not guarantee enumerable constructors.
    // Expose the constructors explicitly after asynchronous loading.
    return {
      Map: mapsLibrary.Map || maps.Map,
      Polygon: maps.Polygon,
      Polyline: maps.Polyline,
      Circle: maps.Circle,
      InfoWindow: maps.InfoWindow,
      LatLngBounds: maps.LatLngBounds,
      marker: markerLibrary,
      places: placesLibrary
    };
  }

  if (maps.Map && maps.marker && maps.places) return maps;
  throw new Error('Las librerías de Google Maps no terminaron de inicializarse.');
}

export function loadGoogleMaps(apiKey) {
  if (!apiKey) {
    return Promise.reject(new Error('Clave API de Google Maps no configurada.'));
  }

  if (window.google?.maps?.Map && window.google?.maps?.marker && window.google?.maps?.places) {
    return loadLibraries();
  }

  if (googleMapsPromise) {
    return googleMapsPromise;
  }

  googleMapsPromise = new Promise((resolve, reject) => {
    const existingScript = document.getElementById('google-maps-js-script');

    if (existingScript) {
      existingScript.addEventListener('load', () => loadLibraries().then(resolve).catch(reject));
      existingScript.addEventListener('error', (e) => reject(e));
      return;
    }

    const script = document.createElement('script');
    script.id = 'google-maps-js-script';
    const callbackName = `__safeWalkGoogleMapsReady_${Date.now()}`;
    window[callbackName] = () => {
      loadLibraries()
        .then(resolve)
        .catch((error) => {
          googleMapsPromise = null;
          reject(error);
        })
        .finally(() => {
          delete window[callbackName];
        });
    };
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&libraries=places,marker&language=es&loading=async&callback=${callbackName}&v=weekly`;
    script.async = true;
    script.defer = true;
    script.onerror = (err) => {
      googleMapsPromise = null;
      delete window[callbackName];
      reject(err);
    };
    document.head.appendChild(script);
  });

  return googleMapsPromise;
}
