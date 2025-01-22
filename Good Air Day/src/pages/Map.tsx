import React from 'react';
import MapComponent from '../components/Map';

export default function MapPage() {
  return (
    <div className="h-full space-y-4">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Air Quality Map</h1>
        <p className="text-gray-600 mt-2">Real-time air quality monitoring across locations</p>
      </div>
      <div className="h-[calc(100vh-12rem)] bg-white rounded-xl shadow-sm">
        <MapComponent />
      </div>
    </div>
  );
}