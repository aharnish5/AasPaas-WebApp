import LRUCache from '../utils/lruCache.js';
import logger from '../config/logger.js';

// Token bucket style per-IP + global limiter for Mapple API calls.
// Configuration via env:
//  MAPPLE_RL_WINDOW_MS (default 60000)
//  MAPPLE_RL_MAX (default 120)  -> per IP
//  MAPPLE_RL_GLOBAL_MAX (default 600) -> across all IPs

const windowMs = parseInt(process.env.MAPPLE_RL_WINDOW_MS || '60000', 10);
const perIpMax = parseInt(process.env.MAPPLE_RL_MAX || '120', 10);
const globalMax = parseInt(process.env.MAPPLE_RL_GLOBAL_MAX || '600', 10);

// store counts in simple LRU with TTL equal to window
const ipCounters = new LRUCache(1000, windowMs);
let globalCounter = { count: 0, resetAt: Date.now() + windowMs };

function resetGlobalIfNeeded() {
  if (Date.now() > globalCounter.resetAt) {
    globalCounter = { count: 0, resetAt: Date.now() + windowMs };
  }
}

export function mappleRateLimiter(req, res, next) {
  resetGlobalIfNeeded();
  const ip = req.ip || req.headers['x-forwarded-for'] || 'unknown';
  const key = `ip:${ip}`;
  const current = ipCounters.get(key) || 0;
  if (current + 1 > perIpMax) {
    return res.status(429).json({ error: 'Rate limit exceeded for Mapple geocoding. Try again later.' });
  }
  if (globalCounter.count + 1 > globalMax) {
    return res.status(429).json({ error: 'Global geocoding capacity reached. Please retry shortly.' });
  }
  ipCounters.set(key, current + 1, windowMs);
  globalCounter.count += 1;
  if ((current + 1) % 25 === 0) {
    logger.debug(`[mappleRateLimiter] IP ${ip} count=${current + 1}`);
  }
  next();
}

export default mappleRateLimiter;