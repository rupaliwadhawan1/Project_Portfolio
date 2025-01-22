import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, ZoomControl } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { fetchAirQualityData, getNAQIColor } from '../services/airQualityService';

interface Station {
  name: string;
  lat: number;
  lng: number;
  aqi?: number;
  category?: string;
  loading?: boolean;
  error?: string;
}

const MONITORING_STATIONS: Station[] = [
  { name: 'Anand Vihar', lat: 28.6469, lng: 77.3164 },
  { name: 'ITO', lat: 28.6289, lng: 77.2404 },
  { name: 'RK Puram', lat: 28.5651, lng: 77.1752 },
  { name: 'Dwarka', lat: 28.5913, lng: 77.0395 },
  { name: 'Rohini', lat: 28.7325, lng: 77.1192 },
  { name: 'Greater Noida', lat: 28.4744, lng: 77.5040 },
  { name: 'Ghaziabad', lat: 28.6692, lng: 77.4538 },
  { name: 'Noida Sector 62', lat: 28.6245, lng: 77.3639 },
  { name: 'Gurugram', lat: 28.4595, lng: 77.0266 },
  { name: 'Faridabad', lat: 28.4089, lng: 77.3178 }
];

export default function Map() {
  const [stations, setStations] = useState<Station[]>(MONITORING_STATIONS);

  useEffect(() => {
    const fetchData = async () => {
      const updatedStations = await Promise.all(
        stations.map(async (station) => {
          try {
            const data = await fetchAirQualityData(station.lat, station.lng);
            return {
              ...station,
              aqi: data.naqiValue,
              category: data.category,
              loading: false
            };
          } catch (error) {
            return {
              ...station,
              error: 'Failed to load data',
              loading: false
            };
          }
        })
      );
      setStations(updatedStations);
    };

    fetchData();
  }, []);

  const createMarkerIcon = (aqi: number | undefined) => {
    const color = aqi ? getNAQIColor(aqi) : '#gray-400';
    const size = 40;
    
    return L.divIcon({
      className: 'custom-div-icon',
      html: `
        <div style="
          width: ${size}px;
          height: ${size}px;
          background-color: ${color};
          border: 2px solid white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: ${aqi && aqi > 100 ? 'black' : 'black'};
          font-weight: bold;
          font-size: 12px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        ">
          ${aqi ? Math.round(aqi) : '?'}
        </div>
      `,
      iconSize: [size, size],
      iconAnchor: [size/2, size/2]
    });
  };

  const getAQITextColor = (aqi: number | undefined) => {
    if (!aqi) return 'text-gray-600';
    
    if (aqi <= 50) return 'text-emerald-700';
    if (aqi <= 100) return 'text-lime-700';
    if (aqi <= 200) return 'text-amber-700';
    if (aqi <= 300) return 'text-orange-700';
    return 'text-red-700';
  };

  return (
    <div className="relative w-full h-full min-h-[400px] rounded-xl overflow-hidden">
      <MapContainer
        center={[28.6139, 77.2090]}
        zoom={10}
        zoomControl={false}
        className="w-full h-full"
      >
        <ZoomControl position="topright" />
        
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />

        {stations.map((station) => (
          <Marker
            key={`${station.lat}-${station.lng}`}
            position={[station.lat, station.lng]}
            icon={createMarkerIcon(station.aqi)}
          >
            <Popup>
              <div className="p-2">
                <h3 className="font-semibold text-gray-900 text-base">
                  {station.name}
                </h3>
                {station.loading ? (
                  <p className="text-sm text-gray-600">Loading...</p>
                ) : station.error ? (
                  <p className="text-sm text-red-600">{station.error}</p>
                ) : (
                  <div className="mt-2 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-700 font-medium">AQI:</span>
                      <span className={`text-lg font-bold ${getAQITextColor(station.aqi)}`}>
                        {station.aqi ? Math.round(station.aqi) : 'N/A'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-700 font-medium">Category:</span>
                      <span className={`text-sm ${getAQITextColor(station.aqi)}`}>
                        {station.category || 'Unknown'}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* Legend with improved contrast */}
      <div className="absolute bottom-4 right-4 bg-white p-4 rounded-lg shadow-lg z-[1000]">
        <h4 className="font-semibold text-gray-900 text-sm mb-2">Air Quality Index</h4>
        <div className="space-y-2 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
            <span className="text-gray-700">Good (0-50)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-lime-500"></div>
            <span className="text-gray-700">Moderate (51-100)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-amber-500"></div>
            <span className="text-gray-700">Unhealthy (101-200)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-orange-500"></div>
            <span className="text-gray-700">Very Unhealthy (201-300)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <span className="text-gray-700">Hazardous (301+)</span>
          </div>
        </div>
      </div>
    </div>
  );
}