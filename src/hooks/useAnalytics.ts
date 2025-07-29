import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface AnalyticsEvent {
  page_url: string;
  page_title?: string;
  action_type: 'page_view' | 'car_view' | 'favorite_add' | 'favorite_remove' | 'inspection_request' | 'search' | 'contact';
  car_id?: string;
  metadata?: any;
}

export const useAnalytics = () => {
  const trackEvent = async (event: AnalyticsEvent) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      // Create a session ID if none exists
      let sessionId = sessionStorage.getItem('analytics_session_id');
      if (!sessionId) {
        sessionId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        sessionStorage.setItem('analytics_session_id', sessionId);
      }

      await supabase
        .from('website_analytics')
        .insert({
          user_id: user?.id || null,
          session_id: sessionId,
          page_url: event.page_url,
          page_title: event.page_title || document.title,
          referrer: document.referrer || null,
          user_agent: navigator.userAgent,
          action_type: event.action_type,
          car_id: event.car_id || null,
          metadata: event.metadata || null
        });
    } catch (error) {
      console.error('Analytics tracking failed:', error);
    }
  };

  const trackPageView = (url?: string) => {
    trackEvent({
      page_url: url || window.location.pathname,
      page_title: document.title,
      action_type: 'page_view'
    });
  };

  const trackCarView = (carId: string) => {
    trackEvent({
      page_url: window.location.pathname,
      action_type: 'car_view',
      car_id: carId
    });
  };

  const trackFavoriteAction = (carId: string, action: 'add' | 'remove') => {
    trackEvent({
      page_url: window.location.pathname,
      action_type: action === 'add' ? 'favorite_add' : 'favorite_remove',
      car_id: carId
    });
  };

  const trackInspectionRequest = (carId?: string) => {
    trackEvent({
      page_url: window.location.pathname,
      action_type: 'inspection_request',
      car_id: carId
    });
  };

  const trackSearch = (searchQuery: string, filters?: any) => {
    trackEvent({
      page_url: window.location.pathname,
      action_type: 'search',
      metadata: { search_query: searchQuery, filters }
    });
  };

  const trackContact = (method: string) => {
    trackEvent({
      page_url: window.location.pathname,
      action_type: 'contact',
      metadata: { contact_method: method }
    });
  };

  // Auto track page views
  useEffect(() => {
    trackPageView();
  }, []);

  return {
    trackEvent,
    trackPageView,
    trackCarView,
    trackFavoriteAction,
    trackInspectionRequest,
    trackSearch,
    trackContact
  };
};