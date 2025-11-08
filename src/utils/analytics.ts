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

export const trackEvent = async (event: AnalyticsEvent) => {
  try {
    const sessionId = getSessionId();
    const { data: { user } } = await supabase.auth.getUser();
    
    const analyticsData = {
      action_type: event.action_type,
      page_url: event.page_url,
      page_title: event.page_title || document.title,
      car_id: event.car_id,
      session_id: sessionId,
      user_id: user?.id || null,
      ip_address: await getClientIP(),
      referrer: event.referrer || document.referrer || null,
      user_agent: event.user_agent || navigator.userAgent,
      metadata: event.metadata || null,
      created_at: new Date().toISOString()
    };

    console.log('📊 Tracking analytics event:', analyticsData);

    const { error } = await supabase
      .from('website_analytics')
      .insert(analyticsData);

    if (error) {
      console.error('❌ Analytics tracking failed:', error);
    } else {
      console.log('✅ Analytics event tracked successfully');
    }
  } catch (error) {
    console.error('❌ Analytics tracking error:', error);
  }
};

export const trackApiFailure = (
  endpoint: string,
  error: unknown,
  metadata?: Record<string, any>
) => {
  const errorMetadata = {
    endpoint,
    message: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
    ...metadata,
  };

  trackEvent({
    action_type: 'api_failure',
    page_url:
      typeof window !== 'undefined'
        ? window.location.pathname + window.location.search
        : endpoint,
    metadata: errorMetadata,
  });
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