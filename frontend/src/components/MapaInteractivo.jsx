import React, { useEffect, useRef, useState } from 'react';
import { loadGoogleMaps } from '../utils/googleMaps';

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
  const initialCenterRef = useRef(centro);
  const initialZoomRef = useRef(zoom);
  const [mapError, setMapError] = useState(null);
  const [mapReady, setMapReady] = useState(false);

  const googleApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  const centroLat = Array.isArray(centro) && Number.isFinite(Number(centro[0])) ? Number(centro[0]) : null;
  const centroLng = Array.isArray(centro) && Number.isFinite(Number(centro[1])) ? Number(centro[1]) : null;
  const zoomNum = Number.isFinite(Number(zoom)) ? Number(zoom) : 17;

  // Inicializar mapa nativo de Google Maps
  useEffect(() => {
    if (!googleApiKey) {
      setMapError('No se encontró VITE_GOOGLE_MAPS_API_KEY en las variables del navegador.');
      return;
    }
    if (!mapRef.current) return;

    loadGoogleMaps(googleApiKey)
      .then((maps) => {
        if (!mapInstanceRef.current && mapRef.current) {
          const initLat = Array.isArray(initialCenterRef.current) && Number.isFinite(Number(initialCenterRef.current[0]))
            ? Number(initialCenterRef.current[0])
            : -3.97245;
          const initLng = Array.isArray(initialCenterRef.current) && Number.isFinite(Number(initialCenterRef.current[1]))
            ? Number(initialCenterRef.current[1])
            : -79.19933;

          mapInstanceRef.current = new maps.Map(mapRef.current, {
            center: { lat: initLat, lng: initLng },
            zoom: Number.isFinite(Number(initialZoomRef.current)) ? Number(initialZoomRef.current) : 17,
            mapId: import.meta.env.VITE_GOOGLE_MAPS_MAP_ID || 'DEMO_MAP_ID',
            disableDefaultUI: false,
            zoomControl: true,
            mapTypeControl: false,
            streetViewControl: false
          });
          setMapReady(true);
          setMapError(null);
        }
      })
      .catch((err) => {
        console.error('Error al cargar Google Maps JS API:', err);
        setMapError('Error al cargar la API de Google Maps. Revisa la clave y las restricciones del navegador.');
      });
  }, [googleApiKey]);

  // Actualizar centro y zoom solo cuando NO hay polilínea activa
  useEffect(() => {
    const hasActivePolyline = Array.isArray(polyline) && polyline.length >= 2;
    if (mapInstanceRef.current && centroLat !== null && centroLng !== null && !hasActivePolyline) {
      mapInstanceRef.current.setCenter({ lat: centroLat, lng: centroLng });
      if (zoomNum) mapInstanceRef.current.setZoom(zoomNum);
    }
  }, [centroLat, centroLng, zoomNum, polyline]);

  // Renderizar Marcadores, Círculos de Riesgo y Polilínea Peatonal
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !window.google?.maps || !mapReady) return;
    const gmaps = window.google.maps;

    const isValidCoordinate = (value) =>
      Array.isArray(value) &&
      value.length >= 2 &&
      Number.isFinite(Number(value[0])) &&
      Number.isFinite(Number(value[1])) &&
      Number(value[0]) >= -90 && Number(value[0]) <= 90 &&
      Number(value[1]) >= -180 && Number(value[1]) <= 180;

    const AdvancedMarkerElement = gmaps.marker?.AdvancedMarkerElement;
    if (!AdvancedMarkerElement) {
      setMapError('La librería de marcadores avanzados (marker) de Google Maps no está disponible.');
      return;
    }

    // Limpiar elementos anteriores
    activeObjectsRef.current.markers.forEach((m) => { m.map = null; });
    if (activeObjectsRef.current.circle) activeObjectsRef.current.circle.setMap(null);
    if (activeObjectsRef.current.polyline) activeObjectsRef.current.polyline.setMap(null);

    const newMarkers = [];

    markers.forEach((item) => {
      if (!isValidCoordinate(item.position)) return;
      const lat = Number(item.position[0]);
      const lng = Number(item.position[1]);

      const markerOptions = {
        position: { lat, lng },
        map,
        title: item.title || '',
        zIndex: item.kind === 'user' ? 1000 : item.kind === 'destination' ? 900 : 500
      };

      if (gmaps.marker?.PinElement) {
        if (item.kind === 'user') {
          markerOptions.content = new gmaps.marker.PinElement({
            background: '#2563eb',
            borderColor: '#ffffff',
            glyphColor: '#ffffff',
            scale: 1.1
          }).element;
        } else if (item.kind === 'destination') {
          markerOptions.content = new gmaps.marker.PinElement({
            background: '#7c3aed',
            borderColor: '#ffffff',
            glyphColor: '#ffffff',
            scale: 1.2
          }).element;
        }
      }

      const marker = new AdvancedMarkerElement(markerOptions);

      if (item.desc || item.title) {
        const infoWindow = new gmaps.InfoWindow({
          content: `<div style="color:#000;font-size:12px;padding:4px;max-width:200px;">
            <strong style="color:#4c1d95;">${item.title || ''}</strong>
            <p style="margin:4px 0 0;color:#334155;font-size:11px;">${item.desc || ''}</p>
          </div>`
        });
        marker.addListener('click', () => infoWindow.open({ map, anchor: marker }));
      }

      newMarkers.push(marker);
    });

    // Círculo de Zona de Riesgo
    let newCircle = null;
    if (circle && isValidCoordinate(circle.center)) {
      newCircle = new gmaps.Circle({
        strokeColor: circle.color || '#ef4444',
        strokeOpacity: 0.8,
        strokeWeight: 2,
        fillColor: circle.color || '#ef4444',
        fillOpacity: 0.25,
        map,
        center: { lat: Number(circle.center[0]), lng: Number(circle.center[1]) },
        radius: Number(circle.radius) || 90
      });
    }

    // Polilínea de Ruta Peatonal y ajuste de encuadre (fitBounds)
    let newPolyline = null;
    const validPolyline = Array.isArray(polyline) ? polyline.filter(isValidCoordinate) : [];
    if (validPolyline.length >= 2) {
      const path = validPolyline.map((pt) => ({ lat: Number(pt[0]), lng: Number(pt[1]) }));
      newPolyline = new gmaps.Polyline({
        path,
        geodesic: true,
        strokeColor: '#6d28d9',
        strokeOpacity: 0.85,
        strokeWeight: 6,
        map
      });

      const bounds = new gmaps.LatLngBounds();
      path.forEach((point) => bounds.extend(point));
      newMarkers.forEach((m) => {
        if (m.position) bounds.extend(m.position);
      });
      map.fitBounds(bounds, { top: 50, right: 50, bottom: 50, left: 50 });
    }

    activeObjectsRef.current = { markers: newMarkers, circle: newCircle, polyline: newPolyline };
  }, [markers, circle, polyline, mapReady]);

  return (
    <div className="relative z-0 h-full min-h-[340px] w-full bg-slate-100 dark:bg-[#2B2B2F]">
      {mapError && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center rounded-3xl bg-slate-900/85 p-6 text-center text-white backdrop-blur-sm">
          <span className="material-symbols-outlined text-4xl text-amber-400">warning</span>
          <h3 className="mt-2 text-base font-bold text-white">Error en Google Maps</h3>
          <p className="mt-2 max-w-[360px] text-xs leading-relaxed text-slate-200">{mapError}</p>
        </div>
      )}

      <div ref={mapRef} className="absolute inset-0 h-full w-full overflow-hidden rounded-3xl shadow-inner" />
    </div>
  );
}
