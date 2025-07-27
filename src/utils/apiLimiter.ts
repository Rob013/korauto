// Global API request limiter to prevent exceeding 50 requests
class APILimiter {
  private requestCount: number = 0;
  private maxRequests: number = 45; // Keep buffer of 5 requests
  private resetTime: number = Date.now() + 60 * 60 * 1000; // Reset every hour

  canMakeRequest(): boolean {
    // Reset counter if hour has passed
    if (Date.now() > this.resetTime) {
      this.requestCount = 0;
      this.resetTime = Date.now() + 60 * 60 * 1000;
    }

    return this.requestCount < this.maxRequests;
  }

  recordRequest(): void {
    this.requestCount++;
    console.log(`API Request count: ${this.requestCount}/${this.maxRequests}`);
  }

  getRemainingRequests(): number {
    return Math.max(0, this.maxRequests - this.requestCount);
  }

  getTimeUntilReset(): number {
    return Math.max(0, this.resetTime - Date.now());
  }
}

export const apiLimiter = new APILimiter();