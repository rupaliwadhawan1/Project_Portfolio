import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getCurrentLocation } from '../../services/locationService';

describe('locationService', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('should use browser geolocation when available', async () => {
    const mockPosition = {
      coords: {
        latitude: 40.7128,
        longitude: -74.0060
      }
    };

    global.navigator.geolocation = {
      getCurrentPosition: vi.fn().mockImplementation((success) => success(mockPosition))
    } as any;

    const location = await getCurrentLocation();
    expect(location.latitude).toBe(40.7128);
    expect(location.longitude).toBe(-74.0060);
  });

  it('should fallback to IP geolocation when browser geolocation fails', async () => {
    global.navigator.geolocation = {
      getCurrentPosition: vi.fn().mockImplementation((_, error) => 
        error(new Error('Permission denied'))
      )
    } as any;

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        latitude: 51.5074,
        longitude: -0.1278,
        city: 'London',
        country_name: 'United Kingdom'
      })
    });

    const location = await getCurrentLocation();
    expect(location.latitude).toBe(51.5074);
    expect(location.longitude).toBe(-0.1278);
    expect(location.city).toBe('London');
  });

  it('should handle errors when both geolocation methods fail', async () => {
    global.navigator.geolocation = {
      getCurrentPosition: vi.fn().mockImplementation((_, error) => 
        error(new Error('Permission denied'))
      )
    } as any;

    global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

    await expect(getCurrentLocation()).rejects.toThrow('Failed to detect location');
  });
});