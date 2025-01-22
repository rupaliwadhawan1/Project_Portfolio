import React from 'react';
import { Car, Wind, Navigation, Thermometer, AlertTriangle, Heart, BarChart2 } from 'lucide-react';
import { MetricsCard } from '../components/MetricsCard';
import Map from '../components/Map';
import { LocationInfo } from '../components/LocationInfo';
import { useLocation } from '../hooks/useLocation';
import { useAirQualityData } from '../hooks/useAirQualityData';
import { useTrafficData } from '../hooks/useTrafficData';
import { useRoutesData } from '../hooks/useRoutesData';
import { useEmissionsData } from '../hooks/useEmissionsData';
import { useWeatherData } from '../hooks/useWeatherData';
import { EmissionsChart } from '../components/charts/EmissionsChart';

export default function Dashboard() {
  const { 
    latitude, 
    longitude, 
    city, 
    loading 
  } = useLocation();

  const { 
    data: airQualityData, 
    isLoading: aqiLoading,
    isError: aqiError,
    error: aqiErrorDetails
  } = useAirQualityData(latitude || undefined, longitude || undefined);

  const { 
    data: trafficData, 
    isLoading: trafficLoading,
    isError: trafficError,
    error: trafficErrorDetails
  } = useTrafficData();

  const { 
    data: routesData, 
    isLoading: routesLoading,
    isError: routesError,
    error: routesErrorDetails
  } = useRoutesData();

  const { 
    data: emissionsData, 
    isLoading: emissionsLoading 
  } = useEmissionsData();

  const { 
    data: weatherData, 
    isLoading: weatherLoading,
    isError: weatherError,
    error: weatherErrorDetails
  } = useWeatherData();

  const getTrafficDisplay = () => {
    if (trafficLoading) return "Loading...";
    if (trafficError || !trafficData) return "N/A";
    return `${trafficData.density.toFixed(1)}%`;
  };

  const getAQIDisplay = () => {
    if (aqiLoading) return "Loading...";
    if (aqiError || !airQualityData || typeof airQualityData.naqiValue !== 'number') return "N/A";
    return airQualityData.naqiValue.toFixed(0);
  };

  const getRoutesDisplay = () => {
    if (routesLoading) return "Loading...";
    if (routesError || !routesData) return "N/A";
    return routesData.activeRoutes.toLocaleString();
  };

  const getTemperatureDisplay = () => {
    if (weatherLoading) return "Loading...";
    if (weatherError || !weatherData) return "N/A";
    return `${Math.round(weatherData.temp)}°C`;
  };

  const getErrorMessage = () => {
    const errors = [];
    if (aqiError && aqiErrorDetails) {
      errors.push(`Air Quality: ${aqiErrorDetails instanceof Error ? aqiErrorDetails.message : 'Failed to fetch data'}`);
    }
    if (trafficError && trafficErrorDetails) {
      errors.push(`Traffic: ${trafficErrorDetails instanceof Error ? trafficErrorDetails.message : 'Failed to fetch data'}`);
    }
    if (routesError && routesErrorDetails) {
      errors.push(`Routes: ${routesErrorDetails instanceof Error ? routesErrorDetails.message : 'Failed to fetch data'}`);
    }
    if (weatherError && weatherErrorDetails) {
      errors.push(`Weather: ${weatherErrorDetails instanceof Error ? weatherErrorDetails.message : 'Failed to fetch data'}`);
    }
    return errors;
  };

  return (
    <div className="min-h-screen bg-[#baa0b9]">
      <div className="max-w-[2000px] mx-auto p-6">
        <header className="mb-6 lg:mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <p className="text-sm lg:text-base text-[#6e3972]">
                {loading ? 'Detecting location...' : 
                  city ? `Real-time monitoring for ${city}` : 'Real-time monitoring and analysis'}
              </p>
            </div>
            <LocationInfo />
          </div>
          {(aqiError || trafficError || routesError || weatherError) && (
            <div className="mt-4 p-4 bg-status-error/10 text-status-error rounded-lg">
              <div className="flex items-start gap-2">
                <AlertTriangle className="mt-1 flex-shrink-0" size={16} />
                <div>
                  <p className="font-medium">Error fetching data:</p>
                  <ul className="mt-1 text-sm list-disc list-inside">
                    {getErrorMessage().map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricsCard
            title="Traffic Density"
            value={getTrafficDisplay()}
            change={trafficData?.change}
            icon={<Car className="text-brand-secondary" />}
          />
          <MetricsCard
  title="National Air Quality Index"
  value={getAQIDisplay()}
  subtitle={airQualityData?.category || 'N/A'}
  change={airQualityData?.change}
  icon={<Wind className="text-brand-secondary" />}
  info={airQualityData?.station ? `Source: ${airQualityData.station}` : 'Source: Google Air Quality'}
  isAQI={true}
/>

          <MetricsCard
            title="Active Routes"
            value={getRoutesDisplay()}
            change={routesData?.change}
            icon={<Navigation className="text-brand-secondary" />}
          />
          <MetricsCard
            title="Temperature"
            value={getTemperatureDisplay()}
            subtitle={city || 'Local temperature'}
            icon={<Thermometer className="text-brand-secondary" />}
          />
        </div>

  {/* Map Section */}
  <div className="col-span-full bg-[#fcfcfc] rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] p-6">
    <div className="max-w-8xl mx-auto p-6">
    <h2 className="text-xl font-semibold text-brand-primary mb-4">Traffic Heat Map</h2>
    <div className="w-full h-[600px]">
      <Map />
    </div>
  </div>
</div></div>


            <div className="bg-[#fcfcfc] rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] p-6">
  <div className="flex items-center justify-between mb-4">
    <h2 className="text-xl font-semibold text-brand-primary">Health Recommendations</h2>
    <Heart className="text-brand-secondary" />
  </div>
  <div className="space-y-4">
    {aqiLoading ? (
      <div className="text-brand-tertiary">Loading recommendations...</div>
    ) : airQualityData?.healthRecommendations ? (
      Object.entries(airQualityData.healthRecommendations).map(([group, recommendation]) => (
        <div key={group} className="space-y-1">
          <h3 className="font-medium text-brand-primary capitalize">
            {group.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
          </h3>
          <p className="text-sm text-brand-tertiary">{recommendation}</p>
        </div>
      ))
    ) : (
      <div className="text-brand-tertiary">No health recommendations available</div>
    )}
  </div>
</div>
<div className="bg-[#fcfcfc] rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] p-6">
  <h2 className="text-xl font-semibold text-brand-primary mb-4">Pollutant Sources</h2>
  {aqiLoading ? (
    <div className="text-brand-tertiary">Loading pollutant details...</div>
  ) : airQualityData?.pollutants?.length ? (
    airQualityData.pollutants.map((pollutant) => (
      <div key={pollutant.code} className="space-y-2">
        <h3 className="font-medium text-brand-primary">{pollutant.fullName} ({pollutant.code})</h3>
        <p className="text-sm text-brand-tertiary">
          <strong>Sources:</strong> {pollutant.additionalInfo.sources}
        </p>
        <p className="text-sm text-brand-tertiary">
          <strong>Effects:</strong> {pollutant.additionalInfo.effects}
        </p>
        <p className="text-sm text-brand-tertiary">
          <strong>Mitigation:</strong> {pollutant.additionalInfo.mitigation}
        </p>
      </div>
    ))
  ) : (
    <div className="text-brand-tertiary">No pollutant details available</div>
  )}
</div>

            </div>
          </div>
        </div>
      </div>
  
  );
}