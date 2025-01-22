import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AirQualityData {
  timestamp: string;
  aqi: number;
  pollutants: {
    pm25: number;
    pm10: number;
    no2: number;
    o3: number;
    co: number;
  };
}

interface Settings {
  notificationThreshold: number;
  refreshInterval: number;
}

interface AirQualityState {
  data: AirQualityData[];
  settings: Settings;
  addData: (data: AirQualityData) => void;
  updateSettings: (settings: Partial<Settings>) => void;
  clearData: () => void;
}

const initialSettings: Settings = {
  notificationThreshold: 150,
  refreshInterval: 300000, // 5 minutes
};

export const useAirQualityStore = create<AirQualityState>()(
  persist(
    (set) => ({
      data: [],
      settings: initialSettings,
      addData: (newData) =>
        set((state) => ({
          data: [...state.data, newData].slice(-288), // Keep last 24 hours (5-minute intervals)
        })),
      updateSettings: (newSettings) =>
        set((state) => ({
          settings: { ...state.settings, ...newSettings },
        })),
      clearData: () =>
        set(() => ({
          data: [],
          settings: initialSettings,
        })),
    }),
    {
      name: 'air-quality-storage',
      version: 1,
    }
  )
);