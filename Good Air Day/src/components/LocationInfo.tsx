import React from 'react';
import { MapPin } from 'lucide-react';
import { useLocation } from '../hooks/useLocation';

export function LocationInfo() {
  const { city, country, error, loading } = useLocation();

  if (loading) {
    return (
      <div className="flex items-center space-x-2 text-gray-600 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-lg">
        <MapPin className="animate-pulse" size={20} />
        <span className="text-sm font-medium">Detecting location...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center space-x-2 text-red-600 bg-red-50 px-4 py-2 rounded-lg">
        <MapPin size={20} />
        <span className="text-sm font-medium">{error}</span>
      </div>
    );
  }

  if (!city && !country) {
    return (
      <div className="flex items-center space-x-2 text-gray-600 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-lg">
        <MapPin size={20} />
        <span className="text-sm font-medium">Location unavailable</span>
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-2 text-gray-600 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-lg">
      <MapPin size={20} />
      <span className="text-sm font-medium">{`${city}, ${country}`}</span>
    </div>
  );
}