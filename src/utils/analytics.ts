import { supabase } from "@/integrations/supabase/client";

interface AnalyticsEvent {
  action_type: string;
  page_url: string;
  page_title?: string;
  car_id?: string;
  referrer?: string;
  user_agent?: string;
  metadata?: Record<string, any>;
}

// Generate a session ID that persists for the browser session
const getSessionId = (): string => {
  let sessionId = sessionStorage.getItem('analytics_session_id');
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem('analytics_session_id', sessionId);
  }
  return sessionId;
};

// Get client IP (will be null in browser, but that's fine)
const getClientIP = async (): Promise<string | null> => {
  try {
    // In a real app, you might want to use a service like ipapi.co
    // For now, we'll use a placeholder
    return null;
  } catch {
    return null;
  }
};

// Rate limiting for analytics to prevent spam
const analyticsRateLimit = new Map<string, number>();
const RATE_LIMIT_WINDOW = 10000; // 10 seconds
const MAX_EVENTS_PER_WINDOW = 5;

export const trackEvent = async (event: AnalyticsEvent) => {
  try {
    // Rate limiting check
    const now = Date.now();
    const key = `${event.action_type}_${event.page_url}`;
    const lastTracked = analyticsRateLimit.get(key) || 0;
    
    if (now - lastTracked < RATE_LIMIT_WINDOW) {
      console.log('📊 Analytics event rate limited:', event.action_type);
      return;
    }
    
    analyticsRateLimit.set(key, now);
    
    const sessionId = getSessionId();
    
    const analyticsData = {
      action_type: event.action_type,
      page_url: event.page_url,
      page_title: event.page_title || document.title,
      car_id: event.car_id,
      session_id: sessionId,
      user_id: null, // Simplified - avoid auth calls that might fail
      ip_address: null,
      referrer: event.referrer || document.referrer || null,
      user_agent: event.user_agent || navigator.userAgent,
      metadata: event.metadata || null,
      created_at: new Date().toISOString()
    };

    console.log('📊 Tracking analytics event:', analyticsData);

    // Use a timeout to prevent hanging requests
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Analytics timeout')), 5000)
    );
    
    const insertPromise = supabase
      .from('website_analytics')
      .insert(analyticsData);

    try {
      const result = await Promise.race([insertPromise, timeoutPromise]) as any;
      
      if (result?.error) {
        console.error('❌ Analytics tracking failed:', result.error);
      } else {
        console.log('✅ Analytics event tracked successfully');
      }
    } catch (error) {
      console.log('⏱️ Analytics request failed or timed out:', error);
    }
  } catch (error) {
    console.error('❌ Analytics tracking error:', error);
  }
};

// Convenience functions for common events
export const trackPageView = (carId?: string, metadata?: Record<string, any>) => {
  trackEvent({
    action_type: 'page_view',
    page_url: window.location.pathname + window.location.search,
    page_title: document.title,
    car_id: carId,
    metadata
  });
};

export const trackCarView = (carId: string, carDetails?: any) => {
  trackEvent({
    action_type: 'car_view',
    page_url: window.location.pathname + window.location.search,
    car_id: carId,
    metadata: carDetails ? {
      make: carDetails.make,
      model: carDetails.model,
      year: carDetails.year,
      price: carDetails.price
    } : undefined
  });
};

export const trackSearch = (query: string, filters?: any, resultCount?: number) => {
  trackEvent({
    action_type: 'search',
    page_url: window.location.pathname + window.location.search,
    metadata: {
      query,
      filters,
      result_count: resultCount
    }
  });
};

export const trackFavorite = (carId: string, action: 'add' | 'remove') => {
  trackEvent({
    action_type: 'favorite',
    page_url: window.location.pathname,
    car_id: carId,
    metadata: {
      action
    }
  });
};

export const trackInspectionRequest = (carId?: string, requestData?: any) => {
  trackEvent({
    action_type: 'inspection_request',
    page_url: window.location.pathname,
    car_id: carId,
    metadata: requestData
  });
};

export const trackContact = (method: 'email' | 'phone' | 'form', carId?: string) => {
  trackEvent({
    action_type: 'contact',
    page_url: window.location.pathname,
    car_id: carId,
    metadata: {
      contact_method: method
    }
  });
};

export const trackCatalogView = (filters?: any, sortBy?: string, resultCount?: number) => {
  trackEvent({
    action_type: 'catalog_view',
    page_url: window.location.pathname + window.location.search,
    metadata: {
      filters,
      sort_by: sortBy,
      result_count: resultCount
    }
  });
};

// Initialize analytics tracking for the current page
export const initializeAnalytics = () => {
  // Track initial page view
  trackPageView();
  
  // Track page visibility changes
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      trackEvent({
        action_type: 'page_focus',
        page_url: window.location.pathname + window.location.search
      });
    }
  });
  
  // Track time on page (simplified version)
  const startTime = Date.now();
  window.addEventListener('beforeunload', () => {
    const timeOnPage = Math.round((Date.now() - startTime) / 1000);
    trackEvent({
      action_type: 'page_time',
      page_url: window.location.pathname + window.location.search,
      metadata: {
        time_on_page_seconds: timeOnPage
      }
    });
  });
};