import React from 'react';
import { useAirQualityStore } from '../store/airQualityStore';
import { Bell, RefreshCw, Trash2 } from 'lucide-react';

export default function Settings() {
  const { settings, updateSettings, clearData } = useAirQualityStore();

  const handleClearCache = () => {
    if (window.confirm('Are you sure you want to clear all cached data? This action cannot be undone.')) {
      clearData();
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-2">Customize your monitoring preferences</p>
      </div>
      
      <div className="space-y-6">
        {/* Notification Settings */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-2 mb-4">
            <Bell className="text-brand-secondary" size={20} />
            <h2 className="text-lg font-semibold">Notification Settings</h2>
          </div>
          <div className="space-y-4">
            <div>
              <label htmlFor="threshold" className="block text-sm font-medium text-gray-700">
                AQI Alert Threshold
              </label>
              <input
                type="number"
                id="threshold"
                min="0"
                max="500"
                value={settings.notificationThreshold}
                onChange={(e) => updateSettings({ notificationThreshold: Number(e.target.value) })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-primary focus:ring-brand-primary"
              />
              <p className="mt-2 text-sm text-gray-500">
                You'll receive alerts when AQI exceeds this value
              </p>
            </div>
          </div>
        </div>

        {/* Data Refresh Settings */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-2 mb-4">
            <RefreshCw className="text-brand-secondary" size={20} />
            <h2 className="text-lg font-semibold">Data Refresh Settings</h2>
          </div>
          <div>
            <label htmlFor="refresh" className="block text-sm font-medium text-gray-700">
              Data Refresh Interval
            </label>
            <select
              id="refresh"
              value={settings.refreshInterval / 60000} // Convert milliseconds to minutes
              onChange={(e) => updateSettings({ refreshInterval: Number(e.target.value) * 60000 })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-primary focus:ring-brand-primary"
            >
              <option value="1">Every minute</option>
              <option value="5">Every 5 minutes</option>
              <option value="10">Every 10 minutes</option>
              <option value="15">Every 15 minutes</option>
              <option value="30">Every 30 minutes</option>
            </select>
            <p className="mt-2 text-sm text-gray-500">
              How often the application should fetch new data
            </p>
          </div>
        </div>

        {/* Data Management */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-2 mb-4">
            <Trash2 className="text-brand-secondary" size={20} />
            <h2 className="text-lg font-semibold">Data Management</h2>
          </div>
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-sm font-medium text-gray-700">Clear Cache</h3>
              <p className="text-sm text-gray-500">Reset local storage and cached data</p>
            </div>
            <button
              onClick={handleClearCache}
              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
            >
              Clear Cache
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}