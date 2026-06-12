'use client';
import { useEffect } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

// Forza il ricalcolo delle dimensioni della mappa: su mobile il contenitore
// flex/grid viene misurato prima di essere stabile, causando tile grigie/tagliate.
function MapResizer() {
  const map = useMap();
  useEffect(() => {
    const fix = () => map.invalidateSize();
    const t = setTimeout(fix, 200);
    window.addEventListener('resize', fix);
    window.addEventListener('orientationchange', fix);
    return () => {
      clearTimeout(t);
      window.removeEventListener('resize', fix);
      window.removeEventListener('orientationchange', fix);
    };
  }, [map]);
  return null;
}

const GA4_BLUE = '#1A73E8';
const GA4_LIGHT = '#8AB4F8';
const GA4_DARK = '#1557B0';
const GA4_GREEN = '#34A853';
const GA4_ORANGE = '#FA7B17';

function getColorByDensity(users, maxUsers) {
  const ratio = maxUsers > 0 ? users / maxUsers : 0;
  if (ratio > 0.75) return GA4_DARK;
  if (ratio > 0.5) return GA4_BLUE;
  if (ratio > 0.25) return GA4_LIGHT;
  return '#C6DAFC';
}

function getRadius(users) {
  return Math.max(6, Math.log(users + 1) * 5);
}

function getWeight(users, maxUsers) {
  const ratio = maxUsers > 0 ? users / maxUsers : 0;
  return ratio > 0.75 ? 2.5 : ratio > 0.25 ? 1.5 : 1;
}

export default function GeoMap({ mapData = [] }) {
  if (!mapData || mapData.length === 0) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-slate-50 rounded-xl">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
          Nessun dato geografico
        </p>
      </div>
    );
  }

  const maxUsers = Math.max(...mapData.map(c => c.users));

  return (
    <div className="relative h-full w-full">
      <MapContainer
        key="geo-map"
        center={[41.8719, 12.5674]}
        zoom={6}
        className="h-full w-full z-0"
        zoomControl={true}
        scrollWheelZoom={false}
        tap={true}
      >
        <MapResizer />
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
        />

        {mapData.map((city, idx) => {
          const fillColor = getColorByDensity(city.users, maxUsers);
          const radius = getRadius(city.users);
          const weight = getWeight(city.users, maxUsers);

          return (
            <CircleMarker
              key={`${city.city}-${idx}`}
              center={city.position}
              radius={radius}
              pathOptions={{
                fillColor,
                color: '#ffffff',
                weight,
                fillOpacity: 0.7,
              }}
            >
              <Popup>
                <div className="font-sans min-w-[160px]">
                  <p className="text-[11px] font-black uppercase tracking-wider text-slate-700 mb-1.5 border-b border-slate-200 pb-1">
                    {city.city}
                  </p>
                  <div className="space-y-0.5 text-[10px]">
                    <div className="flex justify-between gap-4">
                      <span className="text-slate-500 font-medium">Utenti</span>
                      <span className="font-black text-[#1A73E8]">{city.users.toLocaleString('it-IT')}</span>
                    </div>
                    {city.sessions > 0 && (
                      <div className="flex justify-between gap-4">
                        <span className="text-slate-500 font-medium">Sessioni</span>
                        <span className="font-bold text-slate-700">{city.sessions.toLocaleString('it-IT')}</span>
                      </div>
                    )}
                    {city.avgDuration && (
                      <div className="flex justify-between gap-4">
                        <span className="text-slate-500 font-medium">Durata</span>
                        <span className="font-bold text-slate-700">{city.avgDuration}</span>
                      </div>
                    )}
                  </div>
                </div>
              </Popup>
            </CircleMarker>
          );
        })}
      </MapContainer>

      {/* Legend */}
      <div className="absolute bottom-3 left-3 z-[1000] glass-strong rounded-lg px-3 py-2 text-[9px] shadow-lg">
        <p className="font-black uppercase tracking-wider text-slate-500 mb-1.5">Intensità</p>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#C6DAFC' }} />
          <span className="text-slate-400 font-medium">Bassa</span>
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: GA4_LIGHT }} />
          <span className="text-slate-400 font-medium">Media</span>
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: GA4_BLUE }} />
          <span className="text-slate-400 font-medium">Alta</span>
          <div className="w-3 h-3 rounded" style={{ backgroundColor: GA4_DARK }} />
          <span className="text-slate-400 font-medium">Max</span>
        </div>
      </div>
    </div>
  );
}
