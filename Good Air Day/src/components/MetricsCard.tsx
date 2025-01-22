import React from 'react';
import { Info } from 'lucide-react';
import { getNAQIColor } from '../services/airQualityService';

interface MetricsCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  type: 'speed' | 'aqi' | 'number' | 'temperature';
  category?: string;
  flowData?: {
    currentSpeed: number;
    freeFlowSpeed: number;
    confidence: number;
  };
}

export function MetricsCard({ 
  title, 
  value, 
  icon,
  type,
  category,
  flowData 
}: MetricsCardProps) {
  const numericValue = typeof value === 'string' ? parseFloat(value) : value;
  
  // Format the display value based on type
  const displayValue = (() => {
    if (value === "Loading..." || value === "N/A") return value;
    if (isNaN(numericValue)) return "N/A";
    
    switch (type) {
      case 'speed':
        return `${numericValue.toFixed(1)} km/h`;
      case 'temperature':
        return `${Math.round(numericValue)}°C`;
      case 'aqi':
        return Math.round(numericValue).toString();
      case 'number':
        return Math.round(numericValue).toString();
      default:
        return value.toString();
    }
  })();

  return (
    <div className="bg-[#fcfcfc] rounded-xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.18)] transition-shadow duration-300">
      <div className="flex items-center justify-between">
        <span className="text-brand-primary text-sm font-medium">{title}</span>
        <span className="text-brand-secondary">{icon}</span>
      </div>
      <div className="mt-4">
        <div className="flex items-center">
          {type === 'aqi' ? (
            <div className="flex items-center space-x-2">
              <span 
                className="text-2xl font-semibold"
                style={{ 
                  borderBottom: `3px solid ${getNAQIColor(numericValue)}`,
                  paddingBottom: '2px'
                }}
              >
                {displayValue}
              </span>
              <div className="relative group">
                <Info size={16} className="text-brand-tertiary cursor-help" />
                <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block w-64 p-2 bg-[#fcfcfc] rounded-lg shadow-[0_8px_30px_rgb(0,0,0,0.12)] z-10">
                  <div className="text-sm space-y-1">
                    <div className="font-semibold mb-2 text-brand-primary">National Air Quality Index (NAQI) Scale:</div>
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 rounded-full bg-[#009933]" />
                      <span>0-50: Good</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 rounded-full bg-[#58ff09]" />
                      <span>51-100: Satisfactory</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 rounded-full bg-[#ffff00]" />
                      <span>101-200: Moderate</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 rounded-full bg-[#ffa500]" />
                      <span>201-300: Poor</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 rounded-full bg-[#ff0000]" />
                      <span>301-400: Very Poor</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 rounded-full bg-[#990000]" />
                      <span>400+: Severe</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <span className="text-2xl font-semibold text-brand-primary">
              {displayValue}
            </span>
          )}
        </div>
        {category && (
          <span className="text-sm text-brand-tertiary mt-1 block">
            {category}
          </span>
        )}
        {type === 'speed' && flowData && (
          <div className="mt-2 space-y-1">
            <div className="text-xs text-brand-tertiary flex justify-between">
              <span>Current Speed:</span>
              <span className="font-medium">{flowData.currentSpeed.toFixed(1)} km/h</span>
            </div>
            <div className="text-xs text-brand-tertiary flex justify-between">
              <span>Confidence:</span>
              <span className="font-medium">{flowData.confidence}%</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}