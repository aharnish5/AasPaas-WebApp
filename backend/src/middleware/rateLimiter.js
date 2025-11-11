// Simple in-memory token bucket rate limiter per IP+route
// For production, use a robust store (Redis) and express-rate-limit or rate-limiter-flexible

const buckets = new Map();

export function rateLimiter({ windowMs = 60_000, max = 30 } = {}) {
  return (req, res, next) => {
    const key = `${req.ip}:${req.baseUrl}${req.path}`;
    const now = Date.now();
    let b = buckets.get(key);
    if (!b || now > b.reset) {
      b = { remaining: max, reset: now + windowMs };
      buckets.set(key, b);
    }
    if (b.remaining <= 0) {
      const retryAfter = Math.ceil((b.reset - now) / 1000);
      res.set('Retry-After', String(retryAfter));
      return res.status(429).json({ error: 'Too many requests, please try again later.' });
    }
    b.remaining -= 1;
    next();
  };
}
