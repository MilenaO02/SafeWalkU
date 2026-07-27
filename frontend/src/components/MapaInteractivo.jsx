import React, { useEffect, useRef, useState } from 'react';

let googleMapsPromise = null;
function loadGoogleMaps(apiKey) {
  if (window.google?.maps) {
    return Promise.resolve(window.google.maps);
  }
  if (!googleMapsPromise) {
    googleMapsPromise = new Promise((resolve, reject) => {
      const existingScript = document.getElementById('google-maps-js-script');
      if (existingScript) {
        existingScript.addEventListener('load', () => resolve(window.google.maps));
        existingScript.addEventListener('error', (e) => reject(e));
        return;
      }
      const script = document.createElement('script');
      script.id = 'google-maps-js-script';
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&language=es`;
      script.async = true;
      script.defer = true;
      script.onload = () => resolve(window.google.maps);
      script.onerror = (err) => reject(err);
      document.head.appendChild(script);
    });
  }
  return googleMapsPromise;
}

export default function MapaInteractivo({
  centro = [-3.97245, -79.19933],
  zoom = 17,
  markers = [],
  circle = null,
  polyline = null
}) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const activeObjectsRef = useRef({ markers: [], circle: null, polyline: null });

  const [userLocation, setUserLocation] = useState(null);
  const [accuracy, setAccuracy] = useState(null);
  const [geoState, setGeoState] = useState('prompt');
  const [geoError, setGeoError] = useState(null);
  const [manual, setManual] = useState({ lat: '', lng: '' });
  const watchId = useRef(null);

  const googleApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  // Inicializar Google Map
  useEffect(() => {
    if (!mapRef.current || !googleApiKey) return;
    loadGoogleMaps(googleApiKey).then((maps) => {
      if (!mapInstanceRef.current && mapRef.current) {
        mapInstanceRef.current = new maps.Map(mapRef.current, {
          center: { lat: centro[0], lng: centro[1] },
          zoom,
          disableDefaultUI: true,
          zoomControl: true
        });
      }
    });
  }, [googleApiKey]);

  // Actualizar centro y zoom
  useEffect(() => {
    if (mapInstanceRef.current && Array.isArray(centro) && centro.length === 2) {
      mapInstanceRef.current.setCenter({ lat: centro[0], lng: centro[1] });
      mapInstanceRef.current.setZoom(zoom);
    }
  }, [centro, zoom]);

  // Dibujar Marcadores, Círculos y Polilíneas en Google Maps
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !window.google?.maps) return;
    const gmaps = window.google.maps;

    // Limpiar anteriores
    activeObjectsRef.current.markers.forEach((m) => m.setMap(null));
    if (activeObjectsRef.current.circle) activeObjectsRef.current.circle.setMap(null);
    if (activeObjectsRef.current.polyline) activeObjectsRef.current.polyline.setMap(null);

    const newMarkers = [];
    const allMarkers = userLocation
      ? [...markers, { position: userLocation, title: 'Tu ubicación', desc: accuracy ? `Precisión: ±${accuracy}m` : 'Ubicación manual', user: true }]
      : markers;

    allMarkers.forEach((item) => {
      if (!Array.isArray(item.position) || item.position.length < 2) return;
      const marker = new gmaps.Marker({
        position: { lat: Number(item.position[0]), lng: Number(item.position[1]) },
        map,
        title: item.title,
        draggable: Boolean(item.user)
      });

      if (item.desc || item.title) {
        const infoWindow = new gmaps.InfoWindow({
          content: `<div style="color:#000;font-size:12px;padding:4px;"><strong>${item.title}</strong><p style="margin:2px 0 0;">${item.desc || ''}</p></div>`
        });
        marker.addListener('click', () => infoWindow.open(map, marker));
      }

      if (item.user) {
        marker.addListener('dragend', (e) => {
          const newLat = e.latLng.lat();
          const newLng = e.latLng.lng();
          setUserLocation([newLat, newLng]);
          setAccuracy(null);
          setGeoState('manual');
        });
      }

      newMarkers.push(marker);
    });

    // Círculo de Zona de Riesgo
    let newCircle = null;
    if (circle && Array.isArray(circle.center)) {
      newCircle = new gmaps.Circle({
        strokeColor: circle.color || '#ef4444',
        strokeOpacity: 0.8,
        strokeWeight: 2,
        fillColor: circle.color || '#ef4444',
        fillOpacity: 0.2,
        map,
        center: { lat: Number(circle.center[0]), lng: Number(circle.center[1]) },
        radius: Number(circle.radius) || 90
      });
    }

    // Polilínea de Ruta
    let newPolyline = null;
    if (Array.isArray(polyline) && polyline.length >= 2) {
      const path = polyline.map((pt) => ({ lat: Number(pt[0]), lng: Number(pt[1]) }));
      newPolyline = new gmaps.Polyline({
        path,
        geodesic: true,
        strokeColor: '#4a208c',
        strokeOpacity: 0.9,
        strokeWeight: 5,
        map
      });
    }

    activeObjectsRef.current = { markers: newMarkers, circle: newCircle, polyline: newPolyline };
  }, [markers, circle, polyline, userLocation, accuracy]);

  const requestGps = () => {
    if (!navigator.geolocation) {
      setGeoState('error');
      setGeoError('Este navegador no ofrece geolocalización.');
      return;
    }
    setGeoState('requesting');
    setGeoError(null);
    watchId.current = navigator.geolocation.watchPosition(
      ({ coords }) => {
        const pos = [coords.latitude, coords.longitude];
        setUserLocation(pos);
        setAccuracy(Math.round(coords.accuracy));
        setGeoState('granted');
        if (mapInstanceRef.current) {
          mapInstanceRef.current.setCenter({ lat: pos[0], lng: pos[1] });
        }
      },
      (error) => {
        setGeoState(error.code === error.PERMISSION_DENIED ? 'denied' : 'error');
        setGeoError('No fue posible obtener tu ubicación.');
      },
      { enableHighAccuracy: true, maximumAge: 30000, timeout: 15000 }
    );
  };

  const applyManual = () => {
    const lat = Number(manual.lat);
    const lng = Number(manual.lng);
    if (!Number.isFinite(lat) || lat < -90 || lat > 90 || !Number.isFinite(lng) || lng < -180 || lng > 180) {
      setGeoError('Ingresa una latitud entre -90 y 90 y una longitud entre -180 y 180.');
      return;
    }
    if (watchId.current !== null && navigator.geolocation) navigator.geolocation.clearWatch(watchId.current);
    watchId.current = null;
    setUserLocation([lat, lng]);
    setAccuracy(null);
    setGeoState('manual');
    setGeoError(null);
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setCenter({ lat, lng });
    }
  };

  const needsLocation = ['prompt', 'denied', 'error'].includes(geoState);

  return (
    <div className="relative z-0 h-full min-h-[300px] w-full">
      {needsLocation && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center rounded-3xl bg-slate-900/70 p-5 text-center text-white backdrop-blur-sm">
          <span className="material-symbols-outlined text-4xl">{geoState === 'denied' ? 'location_off' : 'location_on'}</span>
          <h3 className="mt-2 text-lg font-bold">Ubicación para el mapa</h3>
          <p className="mt-1 max-w-[320px] text-xs text-slate-200">El GPS solo se activa al presionar el botón mientras esta web permanezca abierta.</p>
          <button type="button" onClick={requestGps} className="mt-4 min-h-11 rounded-xl bg-purple-600 px-6 text-sm font-bold shadow-md hover:bg-purple-700">Usar mi GPS</button>
          <div className="mt-4 grid w-full max-w-[320px] grid-cols-2 gap-2">
            <input aria-label="Latitud" inputMode="decimal" placeholder="Latitud" value={manual.lat} onChange={(event) => setManual((value) => ({ ...value, lat: event.target.value }))} className="min-h-11 rounded-xl bg-white px-3 text-sm text-slate-900" />
            <input aria-label="Longitud" inputMode="decimal" placeholder="Longitud" value={manual.lng} onChange={(event) => setManual((value) => ({ ...value, lng: event.target.value }))} className="min-h-11 rounded-xl bg-white px-3 text-sm text-slate-900" />
          </div>
          <button type="button" onClick={applyManual} className="mt-2 min-h-11 w-full max-w-[320px] rounded-xl border border-white/50 px-4 text-sm font-bold">Usar coordenadas</button>
          {geoError && <p role="alert" className="mt-2 max-w-[320px] text-xs font-semibold text-amber-200">{geoError}</p>}
        </div>
      )}
      {geoState === 'requesting' && <div className="absolute left-3 top-3 z-20 rounded-xl bg-white px-4 py-3 text-xs font-bold shadow-lg text-slate-900">Obteniendo ubicación…</div>}
      
      {/* Contenedor nativo de Google Maps */}
      <div ref={mapRef} className="absolute inset-0 h-full w-full overflow-hidden rounded-3xl shadow-inner" />

      {/* Botón de centrado */}
      {userLocation && (
        <button
          type="button"
          onClick={() => mapInstanceRef.current?.setCenter({ lat: userLocation[0], lng: userLocation[1] })}
          aria-label="Centrar en mi ubicación"
          className="absolute bottom-6 right-4 z-10 flex h-12 w-12 items-center justify-center rounded-full bg-white text-purple-900 shadow-xl hover:bg-slate-50 cursor-pointer"
        >
          <span className="material-symbols-outlined text-2xl font-bold">my_location</span>
        </button>
      )}
    </div>
  );
}

