import { RequestHandler } from "express";

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

const store: RateLimitStore = {};

/**
 * Create a rate limiter middleware
 * @param options.windowMs - Time window in milliseconds (default: 15 minutes)
 * @param options.maxRequests - Max requests per window (default: 100)
 * @param options.keyGenerator - Function to generate key from request (default: IP address)
 */
export function createRateLimiter(
  options: {
    windowMs?: number;
    maxRequests?: number;
    keyGenerator?: (req: any) => string;
  } = {},
): RequestHandler {
  const windowMs = options.windowMs || 15 * 60 * 1000; // 15 minutes
  const maxRequests = options.maxRequests || 100;
  const keyGenerator =
    options.keyGenerator ||
    ((req: any) => {
      return req.ip || req.connection.remoteAddress || "unknown";
    });

  return (req, res, next) => {
    const key = keyGenerator(req);
    const now = Date.now();

    // Clean up old entries
    if (!store[key]) {
      store[key] = { count: 0, resetTime: now + windowMs };
    }

    // Reset if window has passed
    if (now > store[key].resetTime) {
      store[key] = { count: 0, resetTime: now + windowMs };
    }

    // Increment counter
    store[key].count++;

    // Set response headers
    res.setHeader("X-RateLimit-Limit", maxRequests);
    res.setHeader(
      "X-RateLimit-Remaining",
      Math.max(0, maxRequests - store[key].count),
    );
    res.setHeader(
      "X-RateLimit-Reset",
      new Date(store[key].resetTime).toISOString(),
    );

    // Check limit
    if (store[key].count > maxRequests) {
      return res.status(429).json({
        error: "Too many requests",
        retryAfter: Math.ceil((store[key].resetTime - now) / 1000),
      });
    }

    next();
  };
}

/**
 * Stricter rate limiter for login/register endpoints
 */
export const authRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 5, // 5 requests per 15 minutes
});

/**
 * General API rate limiter
 */
export const apiRateLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 60, // 60 requests per minute
});

/**
 * Strict rate limiter for critical endpoints
 */
export const strictRateLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 10, // 10 requests per minute
});

export default createRateLimiter;
