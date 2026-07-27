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
  const [mapError, setMapError] = useState(null);

  const googleApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  // Inicializar Google Map
  useEffect(() => {
    if (!googleApiKey) {
      setMapError('No se encontró VITE_GOOGLE_MAPS_API_KEY. Asegúrate de compilar el frontend con la clave en el archivo .env');
      return;
    }
    if (!mapRef.current) return;

    loadGoogleMaps(googleApiKey)
      .then((maps) => {
        if (!mapInstanceRef.current && mapRef.current) {
          mapInstanceRef.current = new maps.Map(mapRef.current, {
            center: { lat: Number(centro[0]), lng: Number(centro[1]) },
            zoom,
            disableDefaultUI: true,
            zoomControl: true
          });
          setMapError(null);
        }
      })
      .catch((err) => {
        console.error('Error al cargar Google Maps JS API:', err);
        setMapError('Error al cargar Google Maps. Verifica la API Key y las restricciones de dominio en Google Cloud Console.');
      });
  }, [googleApiKey]);

  // Actualizar centro y zoom cuando cambien las props
  useEffect(() => {
    if (mapInstanceRef.current && Array.isArray(centro) && centro.length === 2 && Number.isFinite(Number(centro[0])) && Number.isFinite(Number(centro[1]))) {
      mapInstanceRef.current.setCenter({ lat: Number(centro[0]), lng: Number(centro[1]) });
      if (zoom) mapInstanceRef.current.setZoom(zoom);
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

    markers.forEach((item) => {
      if (!Array.isArray(item.position) || item.position.length < 2) return;
      const lat = Number(item.position[0]);
      const lng = Number(item.position[1]);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;

      const marker = new gmaps.Marker({
        position: { lat, lng },
        map,
        title: item.title
      });

      if (item.desc || item.title) {
        const infoWindow = new gmaps.InfoWindow({
          content: `<div style="color:#000;font-size:12px;padding:4px;"><strong>${item.title}</strong><p style="margin:2px 0 0;">${item.desc || ''}</p></div>`
        });
        marker.addListener('click', () => infoWindow.open(map, marker));
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
  }, [markers, circle, polyline]);

  return (
    <div className="relative z-0 h-full min-h-[300px] w-full bg-slate-100 dark:bg-[#2B2B2F]">
      {mapError && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center rounded-3xl bg-slate-900/80 p-6 text-center text-white backdrop-blur-sm">
          <span className="material-symbols-outlined text-4xl text-amber-400">warning</span>
          <h3 className="mt-2 text-base font-bold text-white">Error de Google Maps</h3>
          <p className="mt-2 max-w-[360px] text-xs leading-relaxed text-slate-200">{mapError}</p>
        </div>
      )}
      
      {/* Contenedor nativo de Google Maps */}
      <div ref={mapRef} className="absolute inset-0 h-full w-full overflow-hidden rounded-3xl shadow-inner" />
    </div>
  );
}

