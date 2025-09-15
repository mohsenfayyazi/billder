'use client';

// Simple rate limiter
class RateLimiter {
  private requests: number[] = [];
  private maxRequests: number;
  private windowMs: number;

  constructor(maxRequests: number = 10, windowMs: number = 60000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }

  canMakeRequest(): boolean {
    const now = Date.now();
    
    // Remove old requests outside the window
    this.requests = this.requests.filter(time => now - time < this.windowMs);
    
    // Check if we can make a new request
    if (this.requests.length < this.maxRequests) {
      this.requests.push(now);
      return true;
    }
    
    return false;
  }

  getTimeUntilReset(): number {
    if (this.requests.length === 0) return 0;
    const oldestRequest = Math.min(...this.requests);
    return Math.max(0, this.windowMs - (Date.now() - oldestRequest));
  }
}

// Create rate limiter instances for different types of requests
export const apiRateLimiter = new RateLimiter(10, 60000); // 10 requests per minute
export const paymentRateLimiter = new RateLimiter(3, 60000); // 3 payment attempts per minute

// Simple rate limiting hook
export const useRateLimit = (limiter: RateLimiter) => {
  const canMakeRequest = () => limiter.canMakeRequest();
  const getTimeUntilReset = () => limiter.getTimeUntilReset();
  
  return { canMakeRequest, getTimeUntilReset };
};
