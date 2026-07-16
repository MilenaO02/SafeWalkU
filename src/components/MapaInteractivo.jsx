import React, { useEffect, useMemo, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';

import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

import { useAuth } from '../context/AuthContext';

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
    if (map && Array.isArray(centro) && centro.length === 2 && !isNaN(centro[0])) {
      try {
        map.setView(centro, zoom, {
          animate: true,
          duration: 1.5
        });
      } catch (e) {
        console.warn("Leaflet setView error:", e);
      }
    }
  }, [map, centro, zoom]);

  // Invalidamos el tamaño del mapa una sola vez después de montar para prevenir glitches de renderizado
  useEffect(() => {
    if (map) {
      const timer = setTimeout(() => {
        try { map.invalidateSize(); } catch(e){}
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [map]);

  return null;
}

function BotonCentrar({ userLocation }) {
  const map = useMap();
  if (!userLocation) return null;
  
  return (
    <button
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        map.setView(userLocation, 17, { animate: true, duration: 1 });
      }}
      className="absolute bottom-6 right-4 z-[1000] w-12 h-12 bg-white dark:bg-[#3C3C40] rounded-full shadow-xl flex items-center justify-center text-blue-600 dark:text-blue-400 border border-slate-100 dark:border-[#4A4A50] hover:bg-slate-50 dark:hover:bg-[#2B2B2F] transition-all cursor-pointer hover:scale-105 active:scale-95"
      title="Centrar en mi ubicación"
    >
      <span className="material-symbols-outlined text-[26px]">my_location</span>
    </button>
  );
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
  const [userAccuracy, setUserAccuracy] = useState(null);
  const [geoState, setGeoState] = useState('checking'); 
  const [geoError, setGeoError] = useState(null);
  
  const isManualLocationRef = useRef(false);
  
  // Extraemos el usuario para su foto de perfil
  const { user } = useAuth();

  useEffect(() => {
    let watchId;
    const startWatching = () => {
      watchId = navigator.geolocation.watchPosition(
        (position) => {
          // Si el usuario movió manualmente el marcador, ignoramos el GPS inexacto
          if (!isManualLocationRef.current) {
            setUserLocation([position.coords.latitude, position.coords.longitude]);
            setUserAccuracy(Math.round(position.coords.accuracy));
            setGeoError(null);
          }
        },
        (error) => {
          if (!isManualLocationRef.current) {
            setGeoError(error.message || 'No fue posible obtener la ubicación.');
            if (error.code === error.PERMISSION_DENIED) setGeoState('denied');
          }
        },
        { enableHighAccuracy: true, maximumAge: 0, timeout: 15000 }
      );
    };

    if (!navigator.geolocation) {
      setGeoError('La geolocalización no está disponible en este navegador.');
      setGeoState('error');
      return;
    }

    startWatching();

    return () => { if (watchId) navigator.geolocation.clearWatch(watchId); };
  }, []);

  const requestLocation = () => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGeoState('granted');
        setUserAccuracy(Math.round(pos.coords.accuracy));
      },
      () => setGeoState('denied'),
      { enableHighAccuracy: true }
    );
  };

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
        desc: userAccuracy 
          ? `Precisión del GPS: ±${userAccuracy} metros. Mantén presionado y arrastra para corregir.`
          : 'Mantén presionado y arrastra este ícono para corregir tu ubicación manualmente.',
      }
    ];
  }, [markers, userLocation, userAccuracy]);

  return (
    <div className="w-full h-full min-h-[300px] relative z-0">
      
      {geoState === 'prompt' && (
        <div className="absolute inset-0 z-[2000] bg-slate-900/40 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center text-white rounded-3xl transition-all">
           <div className="bg-white/10 p-4 rounded-full mb-4 ring-4 ring-white/20">
             <span className="material-symbols-outlined text-4xl block">location_on</span>
           </div>
           <h3 className="text-xl font-bold mb-2 drop-shadow-md">Acompañamiento Activo</h3>
           <p className="text-sm text-slate-100 mb-6 max-w-[280px] drop-shadow-sm font-medium">SafeWalkU necesita tu ubicación para monitorear tu trayecto y alertar en caso de emergencia.</p>
           <button onClick={requestLocation} className="bg-purple-600 hover:bg-purple-500 text-white font-black tracking-wide py-3 px-8 rounded-2xl transition-all shadow-xl hover:shadow-purple-500/30 hover:-translate-y-1">
             Activar GPS
           </button>
        </div>
      )}

      {geoState === 'denied' && (
        <div className="absolute inset-0 z-[2000] bg-slate-900/60 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center text-white rounded-3xl transition-all">
           <div className="bg-red-500/20 p-4 rounded-full mb-4 ring-4 ring-red-500/30 text-red-400">
             <span className="material-symbols-outlined text-4xl block">location_off</span>
           </div>
           <h3 className="text-xl font-bold mb-2 drop-shadow-md">Ubicación Bloqueada</h3>
           <p className="text-sm text-slate-200 mb-6 max-w-[300px] drop-shadow-sm font-medium">No podemos protegerte sin saber dónde estás. Haz clic en el ícono del candado (🔒) en la barra de direcciones de tu navegador y cambia el permiso de ubicación a "Permitir". Luego, recarga la página.</p>
        </div>
      )}

      {geoError && geoState !== 'prompt' && geoState !== 'denied' && (
        <div className="absolute left-3 top-3 z-[1000] rounded-xl bg-white/95 px-3 py-2 text-xs font-semibold text-slate-700 shadow-lg border border-slate-200">
          {geoError}
        </div>
      )}

      <MapContainer
        center={centro}
        zoom={zoom}
        scrollWheelZoom
        className="w-full h-full absolute inset-0 rounded-3xl overflow-hidden shadow-inner"
        zoomControl={false}
      >
        <ManejadorMapa centro={centro} zoom={zoom} />
        <BotonCentrar userLocation={userLocation} />

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

        {mapaMarkers.map((marker, idx) => {
          let bgColor = 'bg-purple-900';
          let iconName = 'location_on';
          let pulse = false;
          let ringColor = 'border-white';
          let isUser = false;

          if (marker.title.includes('Tu ubicación')) {
            bgColor = 'bg-blue-600';
            iconName = 'my_location';
            pulse = true;
            isUser = true;
          } else if (marker.title.includes('SOS')) {
            bgColor = 'bg-red-600';
            iconName = 'warning';
            pulse = true;
          } else if (marker.title.includes('Riesgo') || marker.title.includes('Reporte')) {
            bgColor = 'bg-amber-500';
            iconName = 'report';
          } else if (marker.title.includes('UIDE')) {
            bgColor = 'bg-purple-900';
            iconName = 'school';
            ringColor = 'border-purple-200';
          }

          let innerContent = `<span class="material-symbols-outlined" style="font-size: 20px; font-weight: 600;">${iconName}</span>`;
          
          if (isUser && user?.foto_perfil) {
            // Si es el marcador del usuario y tiene foto de perfil, mostramos la foto en lugar del icono
            innerContent = `<img src="${user.foto_perfil}" alt="Tu foto" class="w-full h-full object-cover rounded-full" />`;
          }

          const htmlString = `
            <div class="relative flex items-center justify-center w-9 h-9">
              ${pulse ? `<div class="absolute inset-0 rounded-full ${bgColor} animate-ping opacity-60 duration-1000"></div>` : ''}
              <div class="relative flex items-center justify-center w-9 h-9 ${bgColor} text-white rounded-full shadow-xl border-[2.5px] ${ringColor} z-10 transition-transform hover:scale-110 overflow-hidden">
                ${innerContent}
              </div>
            </div>
          `;

          const customIcon = L.divIcon({
            className: 'bg-transparent border-none',
            html: htmlString,
            iconSize: [36, 36],
            iconAnchor: [18, 18],
            popupAnchor: [0, -20]
          });

          return (
            <Marker 
              key={`${marker.title}-${idx}`} 
              position={marker.position} 
              icon={customIcon}
              draggable={isUser}
              eventHandlers={{
                dragend: (e) => {
                  if (isUser) {
                    const movedMarker = e.target;
                    const position = movedMarker.getLatLng();
                    isManualLocationRef.current = true; // Cancelar sobreescritura de GPS
                    setUserLocation([position.lat, position.lng]);
                  }
                }
              }}
            >
              <Popup>
                <div className="text-xs font-sans p-1 min-w-[140px]">
                  <p className="font-bold text-slate-800 text-sm mb-0.5">{marker.title}</p>
                  <p className="text-slate-500 font-medium leading-relaxed">{marker.desc}</p>
                  {isUser && isManualLocationRef.current && (
                    <span className="inline-block mt-2 px-2 py-1 bg-amber-100 text-amber-700 font-bold rounded-md text-[10px] uppercase tracking-wider border border-amber-200">
                      Ubicación manual
                    </span>
                  )}
                </div>
              </Popup>
            </Marker>
          );
        })}

        {polyline && (
          <Polyline pathOptions={{ color: '#4a208c', weight: 5, dashArray: '10, 10' }} positions={polyline} />
        )}
      </MapContainer>
    </div>
  );
}