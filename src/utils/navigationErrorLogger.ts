interface NavigationError {
  id: string;
  timestamp: string;
  path: string;
  userAgent: string;
  referrer: string;
  errorType: 'not_found' | 'navigation_error' | 'route_error';
  message?: string;
}

interface NavigationErrorConfig {
  enabled: boolean;
  maxEntries: number;
  logLevel: string;
}

interface NavigationErrorLog {
  errors: NavigationError[];
  lastUpdated: string | null;
  config: NavigationErrorConfig;
}

class NavigationErrorLogger {
  private static instance: NavigationErrorLogger;
  private errorLog: NavigationErrorLog;

  private constructor() {
    this.errorLog = {
      errors: [],
      lastUpdated: null,
      config: {
        enabled: true,
        maxEntries: 100,
        logLevel: 'error'
      }
    };
  }

  public static getInstance(): NavigationErrorLogger {
    if (!NavigationErrorLogger.instance) {
      NavigationErrorLogger.instance = new NavigationErrorLogger();
    }
    return NavigationErrorLogger.instance;
  }

  public logNavigationError(
    path: string, 
    errorType: NavigationError['errorType'] = 'not_found',
    message?: string
  ): void {
    if (!this.errorLog.config.enabled) {
      return;
    }

    const error: NavigationError = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      path,
      userAgent: navigator.userAgent,
      referrer: document.referrer,
      errorType,
      message
    };

    this.errorLog.errors.unshift(error);
    this.errorLog.lastUpdated = new Date().toISOString();

    // Keep only the latest maxEntries
    if (this.errorLog.errors.length > this.errorLog.config.maxEntries) {
      this.errorLog.errors = this.errorLog.errors.slice(0, this.errorLog.config.maxEntries);
    }

    // Log to console for development
    if (process.env.NODE_ENV === 'development') {
      console.error('Navigation Error:', error);
    }

    // In a real application, you might want to send this to a logging service
    this.saveToLocalStorage();
  }

  public getErrorLog(): NavigationErrorLog {
    return { ...this.errorLog };
  }

  public clearErrors(): void {
    this.errorLog.errors = [];
    this.errorLog.lastUpdated = new Date().toISOString();
    this.saveToLocalStorage();
  }

  private saveToLocalStorage(): void {
    try {
      localStorage.setItem('navigationErrors', JSON.stringify(this.errorLog));
    } catch (error) {
      console.error('Failed to save navigation errors to localStorage:', error);
    }
  }

  public loadFromLocalStorage(): void {
    try {
      const stored = localStorage.getItem('navigationErrors');
      if (stored) {
        const parsed = JSON.parse(stored);
        this.errorLog = { ...this.errorLog, ...parsed };
      }
    } catch (error) {
      console.error('Failed to load navigation errors from localStorage:', error);
    }
  }

  public exportAsJSON(): string {
    return JSON.stringify(this.errorLog, null, 2);
  }
}

export const navigationErrorLogger = NavigationErrorLogger.getInstance();
export type { NavigationError, NavigationErrorLog };