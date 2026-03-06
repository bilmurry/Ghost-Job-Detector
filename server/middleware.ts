import type { Request, Response, NextFunction } from "express";

export function securityHeaders(_req: Request, res: Response, next: NextFunction) {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  res.setHeader(
    "Strict-Transport-Security",
    "max-age=31536000; includeSubDomains"
  );
  next();
}

interface RateLimitStore {
  [key: string]: { count: number; resetTime: number };
}

interface RateLimitOptions {
  windowMs: number;
  max: number;
  message?: string;
}

export function rateLimit(options: RateLimitOptions) {
  const { windowMs, max, message = "Too many requests, please try again later." } = options;
  const store: RateLimitStore = {};

  setInterval(() => {
    const now = Date.now();
    for (const key of Object.keys(store)) {
      if (store[key].resetTime <= now) {
        delete store[key];
      }
    }
  }, windowMs);

  return (req: Request, res: Response, next: NextFunction) => {
    const key = req.ip || req.socket.remoteAddress || "unknown";
    const now = Date.now();

    if (!store[key] || store[key].resetTime <= now) {
      store[key] = { count: 1, resetTime: now + windowMs };
    } else {
      store[key].count++;
    }

    const remaining = Math.max(0, max - store[key].count);
    const resetSeconds = Math.ceil((store[key].resetTime - now) / 1000);

    res.setHeader("X-RateLimit-Limit", String(max));
    res.setHeader("X-RateLimit-Remaining", String(remaining));
    res.setHeader("X-RateLimit-Reset", String(resetSeconds));

    if (store[key].count > max) {
      res.setHeader("Retry-After", String(resetSeconds));
      return res.status(429).json({ error: message });
    }

    next();
  };
}

export function requestSizeLimiter(maxBytes: number = 100 * 1024) {
  return (req: Request, res: Response, next: NextFunction) => {
    const contentLength = parseInt(req.headers["content-length"] || "0", 10);
    if (contentLength > maxBytes) {
      return res.status(413).json({ error: "Request body too large." });
    }
    next();
  };
}
