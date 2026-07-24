import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Circle, MapContainer, Marker, Polyline, Popup, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import markerIconPng from 'leaflet/dist/images/marker-icon.png?url';
import markerShadowPng from 'leaflet/dist/images/marker-shadow.png?url';

L.Marker.prototype.options.icon = L.icon({ iconUrl: markerIconPng, shadowUrl: markerShadowPng, iconSize: [25, 41], iconAnchor: [12, 41] });

function MapView({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (Array.isArray(center) && center.length === 2) map.setView(center, zoom, { animate: true });
  }, [map, center, zoom]);
  return null;
}

function CenterButton({ position }) {
  const map = useMap();
  if (!position) return null;
  return <button type="button" onClick={() => map.setView(position, 17)} aria-label="Centrar en mi ubicación" className="absolute bottom-6 right-4 z-[1000] flex h-12 w-12 items-center justify-center rounded-full bg-white text-blue-600 shadow-xl"><span className="material-symbols-outlined">my_location</span></button>;
}

export default function MapaInteractivo({ centro = [-3.97245, -79.19933], zoom = 17, markers = [], circle = null, polyline = null }) {
  const [userLocation, setUserLocation] = useState(null);
  const [accuracy, setAccuracy] = useState(null);
  const [geoState, setGeoState] = useState('prompt');
  const [geoError, setGeoError] = useState(null);
  const [manual, setManual] = useState({ lat: '', lng: '' });
  const watchId = useRef(null);

  useEffect(() => () => {
    if (watchId.current !== null && navigator.geolocation) navigator.geolocation.clearWatch(watchId.current);
  }, []);

  const requestGps = () => {
    if (!navigator.geolocation) {
      setGeoState('error');
      setGeoError('Este navegador no ofrece geolocalización. Usa las coordenadas manuales.');
      return;
    }
    setGeoState('requesting');
    setGeoError(null);
    watchId.current = navigator.geolocation.watchPosition(
      ({ coords }) => {
        setUserLocation([coords.latitude, coords.longitude]);
        setAccuracy(Math.round(coords.accuracy));
        setGeoState('granted');
      },
      (error) => {
        setGeoState(error.code === error.PERMISSION_DENIED ? 'denied' : 'error');
        setGeoError('No fue posible obtener tu ubicación. Puedes ingresarla manualmente.');
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
  };

  const allMarkers = useMemo(() => userLocation ? [...markers, { position: userLocation, title: 'Tu ubicación', desc: accuracy ? `Precisión aproximada: ±${accuracy} metros` : 'Ubicación ingresada manualmente', user: true }] : markers, [markers, userLocation, accuracy]);
  const needsLocation = ['prompt', 'denied', 'error'].includes(geoState);

  return <div className="relative z-0 h-full min-h-[300px] w-full">
    {needsLocation && <div className="absolute inset-0 z-[2000] flex flex-col items-center justify-center rounded-3xl bg-slate-900/70 p-5 text-center text-white backdrop-blur-sm">
      <span className="material-symbols-outlined text-4xl">{geoState === 'denied' ? 'location_off' : 'location_on'}</span>
      <h3 className="mt-2 text-lg font-bold">Ubicación para el mapa</h3>
      <p className="mt-1 max-w-[320px] text-xs text-slate-200">El GPS solo se activa al tocar el botón y mientras esta web permanezca abierta. También puedes continuar manualmente.</p>
      <button type="button" onClick={requestGps} className="mt-4 min-h-11 rounded-xl bg-purple-600 px-6 text-sm font-bold">Usar mi GPS</button>
      <div className="mt-4 grid w-full max-w-[320px] grid-cols-2 gap-2">
        <input aria-label="Latitud" inputMode="decimal" placeholder="Latitud" value={manual.lat} onChange={(event) => setManual((value) => ({ ...value, lat: event.target.value }))} className="min-h-11 rounded-xl bg-white px-3 text-sm text-slate-900" />
        <input aria-label="Longitud" inputMode="decimal" placeholder="Longitud" value={manual.lng} onChange={(event) => setManual((value) => ({ ...value, lng: event.target.value }))} className="min-h-11 rounded-xl bg-white px-3 text-sm text-slate-900" />
      </div>
      <button type="button" onClick={applyManual} className="mt-2 min-h-11 w-full max-w-[320px] rounded-xl border border-white/50 px-4 text-sm font-bold">Usar coordenadas</button>
      {geoError && <p role="alert" className="mt-2 max-w-[320px] text-xs font-semibold text-amber-200">{geoError}</p>}
    </div>}
    {geoState === 'requesting' && <div className="absolute left-3 top-3 z-[2000] rounded-xl bg-white px-4 py-3 text-xs font-bold shadow-lg">Obteniendo ubicación…</div>}
    <MapContainer center={centro} zoom={zoom} scrollWheelZoom className="absolute inset-0 h-full w-full overflow-hidden rounded-3xl shadow-inner" zoomControl={false}>
      <MapView center={userLocation || centro} zoom={zoom} />
      <CenterButton position={userLocation} />
      <TileLayer attribution='&copy; OpenStreetMap contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      {circle && <Circle center={circle.center} radius={circle.radius || 90} pathOptions={{ color: circle.color || '#ef4444', fillColor: circle.color || '#ef4444', fillOpacity: 0.15 }} />}
      {allMarkers.map((marker, index) => <Marker key={`${marker.title}-${index}`} position={marker.position} draggable={Boolean(marker.user)} eventHandlers={marker.user ? { dragend: (event) => { const point = event.target.getLatLng(); setUserLocation([point.lat, point.lng]); setAccuracy(null); setGeoState('manual'); } } : undefined}>
        <Popup><strong>{marker.title}</strong><p>{marker.desc}</p></Popup>
      </Marker>)}
      {polyline && <Polyline positions={polyline} pathOptions={{ color: '#4a208c', weight: 5, dashArray: '10, 10' }} />}
    </MapContainer>
  </div>;
}
