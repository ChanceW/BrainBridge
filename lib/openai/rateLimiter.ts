import { OPENAI_CONFIG } from './config';

interface RequestWindow {
  timestamps: number[];
  windowMs: number;
  maxRequests: number;
}

class RateLimiter {
  private windows: RequestWindow[];
  private queue: (() => void)[] = [];
  private processing: boolean = false;

  constructor() {
    // Initialize rate limit windows for different time periods
    this.windows = [
      {
        timestamps: [], // Per-minute window
        windowMs: 60000,
        maxRequests: OPENAI_CONFIG.rateLimits.requestsPerMinute
      },
      {
        timestamps: [], // Per-hour window
        windowMs: 3600000,
        maxRequests: OPENAI_CONFIG.rateLimits.requestsPerHour
      }
    ];
  }

  private cleanupTimestamps(window: RequestWindow): void {
    const now = Date.now();
    window.timestamps = window.timestamps.filter(time => now - time < window.windowMs);
  }

  private async checkWindow(window: RequestWindow): Promise<boolean> {
    this.cleanupTimestamps(window);
    
    if (window.timestamps.length >= window.maxRequests) {
      const oldestTimestamp = window.timestamps[0];
      const waitTime = window.windowMs - (Date.now() - oldestTimestamp);
      
      if (waitTime > 0) {
        await new Promise(resolve => setTimeout(resolve, waitTime));
        return this.checkWindow(window);
      }
    }
    
    return true;
  }

  private async processQueue(): Promise<void> {
    if (this.processing || this.queue.length === 0) return;
    
    this.processing = true;
    
    while (this.queue.length > 0) {
      const resolve = this.queue.shift();
      if (resolve) {
        // Check all windows
        for (const window of this.windows) {
          await this.checkWindow(window);
        }
        
        // Add timestamps to all windows
        const now = Date.now();
        this.windows.forEach(window => window.timestamps.push(now));
        
        resolve();
        
        // Add delay between requests
        await new Promise(resolve => 
          setTimeout(resolve, OPENAI_CONFIG.rateLimits.retryDelay)
        );
      }
    }
    
    this.processing = false;
  }

  async waitForAvailability(): Promise<void> {
    return new Promise<void>(resolve => {
      this.queue.push(resolve);
      this.processQueue();
    });
  }

  reset(): void {
    this.windows.forEach(window => window.timestamps = []);
    this.queue = [];
    this.processing = false;
  }
}

// Export a single instance for the entire application
export const openAIRateLimiter = new RateLimiter(); 