import { jest } from '@jest/globals';

let geocodeAddress;
let mockedMapple;

describe('geocodingService cache + Mapple-first', () => {
  const addr = '221B Baker Street, London';
  beforeEach(async () => {
    jest.restoreAllMocks();
  });

  test('uses Mapple when configured and caches result', async () => {
    // Mock mapple module before importing geocodingService
    await jest.unstable_mockModule('../services/mappleService.js', () => ({
      geocodeAddress: jest.fn().mockResolvedValue({
        success: true,
        latitude: 28.61,
        longitude: 77.21,
        formattedAddress: addr,
        city: 'Delhi',
        locality: 'Connaught Place',
        country: 'India',
      }),
      default: { geocodeAddress: jest.fn() },
    }));
    mockedMapple = await import('../services/mappleService.js');
    ({ geocodeAddress } = await import('../services/geocodingService.js'));

    const first = await geocodeAddress(addr);
    const second = await geocodeAddress(addr);

    expect(first.success).toBe(true);
    expect(second.success).toBe(true);
    // Mapple called only once due to cache
    expect(mockedMapple.geocodeAddress).toHaveBeenCalledTimes(1);
  });
});
