/**
 * Performance monitoring utilities for StellarPay
 */

export interface PerformanceMetric {
  name: string;
  duration: number;
  timestamp: number;
  metadata?: Record<string, unknown>;
}

class PerformanceMonitor {
  private metrics: Map<string, number> = new Map();
  private enabled: boolean;

  constructor() {
    this.enabled = typeof window !== 'undefined' && 'performance' in window;
  }

  /**
   * Start timing an operation
   */
  start(name: string): void {
    if (!this.enabled) return;
    this.metrics.set(name, performance.now());
  }

  /**
   * End timing and log the duration
   */
  end(name: string, metadata?: Record<string, unknown>): PerformanceMetric | null {
    if (!this.enabled) return null;

    const startTime = this.metrics.get(name);
    if (!startTime) {
      console.warn(`Performance: No start time found for "${name}"`);
      return null;
    }

    const duration = performance.now() - startTime;
    this.metrics.delete(name);

    const metric: PerformanceMetric = {
      name,
      duration,
      timestamp: Date.now(),
      metadata,
    };

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`⏱️ ${name}: ${duration.toFixed(2)}ms`, metadata || '');
    }

    // Send to analytics/monitoring service
    this.sendToMonitoring(metric);

    return metric;
  }

  /**
   * Measure an async function
   */
  async measure<T>(
    name: string,
    fn: () => Promise<T>,
    metadata?: Record<string, unknown>
  ): Promise<T> {
    this.start(name);
    try {
      const result = await fn();
      this.end(name, { ...metadata, status: 'success' });
      return result;
    } catch (error) {
      this.end(name, { ...metadata, status: 'error', error: String(error) });
      throw error;
    }
  }

  /**
   * Send metrics to monitoring service (Sentry, etc.)
   */
  private sendToMonitoring(metric: PerformanceMetric): void {
    // In production, send to Sentry or your monitoring service
    if (typeof window !== 'undefined' && window.Sentry) {
      window.Sentry.addBreadcrumb({
        category: 'performance',
        message: metric.name,
        level: 'info',
        data: {
          duration: metric.duration,
          ...metric.metadata,
        },
      });
    }
  }

  /**
   * Get Web Vitals metrics
   */
  getWebVitals(): void {
    if (!this.enabled) return;

    // Largest Contentful Paint (LCP)
    new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1];
      console.log('LCP:', lastEntry.startTime);
    }).observe({ entryTypes: ['largest-contentful-paint'] });

    // First Input Delay (FID)
    new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry: PerformanceEntry) => {
        const fidEntry = entry as any;
        if (fidEntry.processingStart) {
          const fid = fidEntry.processingStart - fidEntry.startTime;
          console.log('FID:', fid);
        }
      });
    }).observe({ entryTypes: ['first-input'] });

    // Cumulative Layout Shift (CLS)
    let clsScore = 0;
    new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry: PerformanceEntry) => {
        const layoutShiftEntry = entry as any;
        if (!layoutShiftEntry.hadRecentInput && layoutShiftEntry.value) {
          clsScore += layoutShiftEntry.value;
        }
      });
      console.log('CLS:', clsScore);
    }).observe({ entryTypes: ['layout-shift'] });
  }
}

// Singleton instance
export const performanceMonitor = new PerformanceMonitor();

/**
 * Decorator for measuring function performance
 */
export function measurePerformance(name?: string) {
  return function (
    target: unknown,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;
    const metricName = name || `${target?.constructor?.name}.${propertyKey}`;

    descriptor.value = async function (...args: unknown[]) {
      return performanceMonitor.measure(
        metricName,
        () => originalMethod.apply(this, args)
      );
    };

    return descriptor;
  };
}

/**
 * Track page load performance
 */
export function trackPageLoad(pageName: string): void {
  if (typeof window === 'undefined') return;

  window.addEventListener('load', () => {
    const perfData = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    
    if (perfData) {
      const metrics = {
        dns: perfData.domainLookupEnd - perfData.domainLookupStart,
        tcp: perfData.connectEnd - perfData.connectStart,
        ttfb: perfData.responseStart - perfData.requestStart,
        download: perfData.responseEnd - perfData.responseStart,
        domInteractive: perfData.domInteractive - perfData.fetchStart,
        domComplete: perfData.domComplete - perfData.fetchStart,
        loadComplete: perfData.loadEventEnd - perfData.fetchStart,
      };

      console.log(`📊 Page Load Metrics (${pageName}):`, metrics);

      // Send to monitoring
      if (window.Sentry) {
        window.Sentry.addBreadcrumb({
          category: 'navigation',
          message: `Page loaded: ${pageName}`,
          level: 'info',
          data: metrics,
        });
      }
    }
  });
}

/**
 * Track API call performance
 */
export async function trackApiCall<T>(
  endpoint: string,
  fn: () => Promise<T>
): Promise<T> {
  return performanceMonitor.measure(`API: ${endpoint}`, fn, { endpoint });
}

/**
 * Track Stellar transaction performance
 */
export async function trackStellarTransaction<T>(
  operation: string,
  fn: () => Promise<T>
): Promise<T> {
  return performanceMonitor.measure(`Stellar: ${operation}`, fn, { operation });
}

// Type augmentation for Sentry
declare global {
  interface Window {
    Sentry?: {
      addBreadcrumb: (breadcrumb: {
        category: string;
        message: string;
        level: string;
        data?: Record<string, unknown>;
      }) => void;
    };
  }
}
