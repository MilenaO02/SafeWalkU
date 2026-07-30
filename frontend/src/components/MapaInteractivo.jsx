import React, { useEffect, useRef, useState } from 'react';
import { loadGoogleMaps } from '../utils/googleMaps';

function isValidCoordinate(value) {
  return Array.isArray(value)
    && value.length >= 2
    && Number.isFinite(Number(value[0]))
    && Number.isFinite(Number(value[1]))
    && Number(value[0]) >= -90 && Number(value[0]) <= 90
    && Number(value[1]) >= -180 && Number(value[1]) <= 180;
}

function escapeHtml(value = '') {
  return String(value).replace(/[&<>'"]/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
  }[character]));
}

export default function MapaInteractivo({
  centro = [-3.97245, -79.19933],
  zoom = 17,
  markers = [],
  circle = null,
  polyline = null,
  onClick = null
}) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const mapsLibraryRef = useRef(null);
  const activeObjectsRef = useRef({ markers: [], circle: null, polyline: null, mapClick: null });
  const initialCenterRef = useRef(centro);
  const initialZoomRef = useRef(zoom);
  const viewportSignatureRef = useRef(null);
  const onClickRef = useRef(onClick);
  const [mapError, setMapError] = useState(null);
  const [mapReady, setMapReady] = useState(false);
  const googleApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  useEffect(() => { onClickRef.current = onClick; }, [onClick]);

  useEffect(() => {
    if (!googleApiKey || !mapRef.current) {
      if (!googleApiKey) setMapError('No se encontró VITE_GOOGLE_MAPS_API_KEY.');
      return undefined;
    }

    loadGoogleMaps(googleApiKey)
      .then((maps) => {
        mapsLibraryRef.current = maps;
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

          if (onClickRef.current) {
            activeObjectsRef.current.mapClick = mapInstanceRef.current.addListener('click', (e) => {
              if (e.latLng && onClickRef.current) onClickRef.current({ lat: e.latLng.lat(), lng: e.latLng.lng() });
            });
          }

          setMapReady(true);
          setMapError(null);
        }
      })
      .catch((error) => {
        console.error('Error al cargar Google Maps JS API:', error instanceof Error ? error.message : 'desconocido');
        setMapError('Error al cargar Google Maps. Verifica la API Key y sus restricciones.');
      });
  }, [googleApiKey, onClick]);

  useEffect(() => {
    const map = mapInstanceRef.current;
    const hasRoute = Array.isArray(polyline) && polyline.filter(isValidCoordinate).length >= 2;
    const nextSignature = isValidCoordinate(centro)
      ? `${Number(centro[0]).toFixed(6)}:${Number(centro[1]).toFixed(6)}:${Number(zoom)}`
      : null;
    if (map && nextSignature && !hasRoute && viewportSignatureRef.current !== nextSignature) {
      map.setCenter({ lat: Number(centro[0]), lng: Number(centro[1]) });
      if (Number.isFinite(Number(zoom))) map.setZoom(Number(zoom));
      viewportSignatureRef.current = nextSignature;
    }
  }, [centro, zoom, polyline]);

  useEffect(() => {
    const map = mapInstanceRef.current;
    const gmaps = mapsLibraryRef.current;
    const AdvancedMarkerElement = gmaps?.marker?.AdvancedMarkerElement;
    if (!map || !gmaps || !AdvancedMarkerElement || !mapReady) return undefined;

    activeObjectsRef.current.markers.forEach((marker) => { marker.map = null; });
    activeObjectsRef.current.circle?.setMap(null);
    activeObjectsRef.current.polyline?.setMap(null);
    activeObjectsRef.current.mapClick?.remove();

    const newMarkers = markers.flatMap((item, index) => {
      if (!isValidCoordinate(item.position)) return [];
      const options = {
        map,
        position: { lat: Number(item.position[0]), lng: Number(item.position[1]) },
        title: item.title || `Marcador ${index + 1}`,
        zIndex: item.kind === 'user' ? 1000 : undefined,
        gmpClickable: Boolean(item.desc || item.title),
        gmpDraggable: Boolean(item.draggable)
      };
      if (gmaps.marker.PinElement && (item.kind === 'user' || item.kind === 'editable')) {
        options.content = new gmaps.marker.PinElement({
          background: item.kind === 'editable' ? '#7e22ce' : '#2563eb',
          borderColor: '#ffffff',
          glyphColor: '#ffffff'
        });
      }
      const marker = new AdvancedMarkerElement(options);
      if (item.desc || item.title) {
        const infoWindow = new gmaps.InfoWindow({
          content: `<div style="color:#000;font-size:12px;padding:4px"><strong>${escapeHtml(item.title)}</strong><p style="margin:2px 0 0">${escapeHtml(item.desc)}</p></div>`
        });
        marker.addEventListener('gmp-click', () => infoWindow.open({ map, anchor: marker }));
      }
      if (item.draggable && typeof item.onPositionChange === 'function') {
        const handleDragEnd = () => {
          const position = marker.position;
          const lat = typeof position?.lat === 'function' ? position.lat() : Number(position?.lat);
          const lng = typeof position?.lng === 'function' ? position.lng() : Number(position?.lng);
          if (Number.isFinite(lat) && Number.isFinite(lng)) item.onPositionChange([lat, lng]);
        };
        marker.addListener('dragend', handleDragEnd);
        marker.addEventListener('gmp-dragend', handleDragEnd);
      }
      return [marker];
    });

    let newCircle = null;
    if (circle && isValidCoordinate(circle.center)) {
      const radius = Number(circle.radius);
      newCircle = new gmaps.Circle({
        strokeColor: circle.color || '#ef4444', strokeOpacity: 0.8, strokeWeight: 2,
        fillColor: circle.color || '#ef4444', fillOpacity: 0.2, map,
        center: { lat: Number(circle.center[0]), lng: Number(circle.center[1]) },
        radius: Number.isFinite(radius) && radius > 0 ? radius : 90
      });
    }

    const validPolyline = Array.isArray(polyline) ? polyline.filter(isValidCoordinate) : [];
    let newPolyline = null;
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
      map.fitBounds(bounds, 40);
    }

    const mapClick = onClickRef.current
      ? map.addListener('click', (event) => {
          const lat = event.latLng?.lat();
          const lng = event.latLng?.lng();
          if (Number.isFinite(lat) && Number.isFinite(lng)) onClickRef.current({ lat, lng });
        })
      : null;

    activeObjectsRef.current = { markers: newMarkers, circle: newCircle, polyline: newPolyline, mapClick };
    return undefined;
  }, [markers, circle, polyline, mapReady]);

  useEffect(() => () => {
    activeObjectsRef.current.markers.forEach((marker) => { marker.map = null; });
    activeObjectsRef.current.circle?.setMap(null);
    activeObjectsRef.current.polyline?.setMap(null);
    activeObjectsRef.current.mapClick?.remove();
    mapInstanceRef.current = null;
    mapsLibraryRef.current = null;
  }, []);

  return (
    <div className="relative z-0 h-full min-h-[300px] w-full bg-slate-100 dark:bg-[#2B2B2F]">
      {mapError && <div className="absolute inset-0 z-20 flex flex-col items-center justify-center rounded-3xl bg-slate-900/80 p-6 text-center text-white backdrop-blur-sm"><span className="material-symbols-outlined text-4xl text-amber-400">warning</span><h3 className="mt-2 text-base font-bold">Error de Google Maps</h3><p className="mt-2 max-w-[360px] text-xs text-slate-200">{mapError}</p></div>}
      <div ref={mapRef} className="absolute inset-0 h-full w-full overflow-hidden rounded-3xl shadow-inner" />
    </div>
  );
}
