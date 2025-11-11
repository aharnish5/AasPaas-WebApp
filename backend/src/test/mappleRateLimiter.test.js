import { jest } from '@jest/globals';

let mappleRateLimiter;

const makeReqRes = () => {
  const req = { ip: '1.2.3.4', headers: {} };
  const res = {
    statusCode: 200,
    body: null,
    status(code) { this.statusCode = code; return this; },
    json(payload) { this.body = payload; return this; },
  };
  const next = jest.fn();
  return { req, res, next };
};

describe('mappleRateLimiter', () => {
  const originalEnv = process.env;
  beforeEach(async () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2024-01-01T00:00:00Z'));
    process.env = { ...originalEnv, MAPPLE_RL_WINDOW_MS: '1000', MAPPLE_RL_MAX: '3', MAPPLE_RL_GLOBAL_MAX: '5' };
    // Re-import middleware after setting env so it picks new limits
    const mod = await import('../middleware/mappleRateLimiter.js');
    mappleRateLimiter = mod.mappleRateLimiter;
  });
  afterEach(() => {
    process.env = originalEnv;
    jest.useRealTimers();
  });

  test('allows up to per-IP limit then returns 429', () => {
    const { req, res, next } = makeReqRes();
    // First 3 pass
    mappleRateLimiter(req, res, next);
    mappleRateLimiter(req, res, next);
    mappleRateLimiter(req, res, next);
    expect(next).toHaveBeenCalledTimes(3);
    // 4th within window is blocked
    const { res: res2 } = makeReqRes();
    mappleRateLimiter(req, res2, next);
    expect(res2.statusCode).toBe(429);
  });

  test('resets after window', () => {
    const { req, res, next } = makeReqRes();
    mappleRateLimiter(req, res, next);
    mappleRateLimiter(req, res, next);
    mappleRateLimiter(req, res, next);
    // advance beyond window
    jest.advanceTimersByTime(1001);
    const { res: res2 } = makeReqRes();
    mappleRateLimiter(req, res2, next);
    expect(res2.statusCode).toBe(200);
  });
});
