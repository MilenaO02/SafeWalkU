import React, { useEffect, useMemo, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';

import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});
L.Marker.prototype.options.icon = DefaultIcon;

function ManejadorMapa({ centro, zoom = 17 }) {
  const map = useMap();

  useEffect(() => {
    if (map && centro) {
      map.invalidateSize();
      map.setView(centro, zoom, {
        animate: true,
        duration: 1.5
      });
    }
  }, [map, centro, zoom]);

  return null;
}

export default function MapaInteractivo({
  centro = [-3.97245, -79.19933],
  zoom = 17,
  markers = [
    { position: [-3.97245, -79.19933], title: 'UIDE - Extensión Loja', desc: 'Calle Agustín Carrión Palacios, Sector Jipiro' }
  ],
  circle = null,
  polyline = null
}) {
  const [userLocation, setUserLocation] = useState(null);
  const [geoError, setGeoError] = useState(null);

  useEffect(() => {
    if (!navigator.geolocation) {
      setGeoError('La geolocalización no está disponible en este navegador.');
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        setUserLocation([position.coords.latitude, position.coords.longitude]);
        setGeoError(null);
      },
      (error) => {
        setGeoError(error.message || 'No fue posible obtener la ubicación.');
      },
      {
        enableHighAccuracy: true,
        maximumAge: 5000,
        timeout: 10000,
      }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  const mapaMarkers = useMemo(() => {
    const baseMarkers = Array.isArray(markers) ? markers : [];

    if (!userLocation) {
      return baseMarkers;
    }

    return [
      ...baseMarkers,
      {
        position: userLocation,
        title: 'Tu ubicación actual',
        desc: 'Seguimiento en tiempo real',
      }
    ];
  }, [markers, userLocation]);

  const activeCenter = userLocation ?? centro;

  return (
    <div className="w-full h-full min-h-[300px] relative z-0">
      {geoError && (
        <div className="absolute left-3 top-3 z-[1000] rounded-xl bg-white/90 px-3 py-2 text-xs font-semibold text-slate-700 shadow">
          {geoError}
        </div>
      )}

      <MapContainer
        center={activeCenter}
        zoom={zoom}
        scrollWheelZoom
        className="w-full h-full absolute inset-0 rounded-3xl overflow-hidden shadow-inner"
      >
        <ManejadorMapa centro={activeCenter} zoom={zoom} />

        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {circle && (
          <Circle
            center={circle.center}
            pathOptions={{
              color: circle.color || '#ef4444',
              fillColor: circle.color || '#ef4444',
              fillOpacity: 0.15
            }}
            radius={circle.radius || 90}
          />
        )}

        {mapaMarkers.map((marker, idx) => (
          <Marker key={`${marker.title}-${idx}`} position={marker.position}>
            <Popup>
              <div className="text-xs font-sans p-1">
                <p className="font-bold text-purple-950 text-sm mb-0.5">{marker.title}</p>
                <p className="text-slate-600 font-medium leading-relaxed">{marker.desc}</p>
              </div>
            </Popup>
          </Marker>
        ))}

        {polyline && (
          <Polyline pathOptions={{ color: '#4a208c', weight: 5, dashArray: '10, 10' }} positions={polyline} />
        )}
      </MapContainer>
    </div>
  );
}