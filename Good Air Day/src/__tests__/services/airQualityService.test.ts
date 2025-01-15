import { describe, it, expect, vi } from 'vitest';
import { fetchAirQualityData, getAQICategory } from '../../services/airQualityService';

describe('airQualityService', () => {
  describe('fetchAirQualityData', () => {
    it('should handle API errors gracefully', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('API Error'));
      
      await expect(fetchAirQualityData()).rejects.toThrow('API Error');
    });
  });

  describe('getAQICategory', () => {
    it('should return "Good" for AQI <= 50', () => {
      expect(getAQICategory(0)).toBe('Good');
      expect(getAQICategory(25)).toBe('Good');
      expect(getAQICategory(50)).toBe('Good');
    });

    it('should return "Moderate" for AQI between 51 and 100', () => {
      expect(getAQICategory(51)).toBe('Moderate');
      expect(getAQICategory(75)).toBe('Moderate');
      expect(getAQICategory(100)).toBe('Moderate');
    });

    it('should return "Unhealthy for Sensitive Groups" for AQI between 101 and 150', () => {
      expect(getAQICategory(101)).toBe('Unhealthy for Sensitive Groups');
      expect(getAQICategory(125)).toBe('Unhealthy for Sensitive Groups');
      expect(getAQICategory(150)).toBe('Unhealthy for Sensitive Groups');
    });

    it('should return "Hazardous" for AQI > 300', () => {
      expect(getAQICategory(301)).toBe('Hazardous');
      expect(getAQICategory(400)).toBe('Hazardous');
    });
  });
});