import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { lazy, Suspense, useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { InstallPrompt } from "./components/InstallPrompt";
import { useResourcePreloader } from "./hooks/useResourcePreloader";
import { AccessibilityEnhancer } from "./utils/accessibilityEnhancer";
import { StatusRefreshProvider } from "./components/StatusRefreshProvider";
import { useFrameRate } from "./hooks/useFrameRate";
import { PerformanceMonitor } from "./components/PerformanceMonitor";
import { useAdminCheck } from "./hooks/useAdminCheck";
import { CacheUpdateNotification } from "./components/CacheUpdateNotification";
import { useIsMobile } from "./hooks/use-mobile";
import { IOSEnhancer } from "./components/IOSEnhancer";

// Lazy load all pages for better code splitting
const Index = lazy(() => import("./pages/Index"));
const Catalog = lazy(() => import("./pages/Catalog"));
const CarDetails = lazy(() => import("./pages/CarDetails"));
const CarGallery = lazy(() => import("./pages/CarGallery"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const AuthPage = lazy(() => import("./pages/AuthPage"));
const EmailConfirmationPage = lazy(() => import("./pages/EmailConfirmationPage"));
const FavoritesPage = lazy(() => import("./pages/FavoritesPage"));
const InspectionServices = lazy(() => import("./pages/InspectionServices"));
const MyAccount = lazy(() => import("./pages/MyAccount"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Contacts = lazy(() => import("./pages/Contacts"));
const ShipmentTracking = lazy(() => import("./pages/ShipmentTracking"));
// Demo imports removed - no longer needed
const PerformanceDashboard = lazy(() => import("./components/PerformanceDashboard"));
const AuditTestPage = lazy(() => import("./pages/AuditTestPage"));
const ApiInfoDemo = lazy(() => import("./components/ApiInfoDemo"));

// Lazy load admin components for better code splitting
const AdminSyncDashboard = lazy(() => import("./components/AdminSyncDashboard"));
const CookieManagementDashboard = lazy(() => import("./components/CookieManagementDashboard"));

const PageSkeleton = () => (
  <div className="min-h-screen bg-background">
    <div className="animate-pulse">
      {/* Header skeleton */}
      <header className="border-b">
        <div className="container-responsive py-4">
          <div className="flex items-center justify-between">
            <Skeleton className="h-8 w-32" />
            <div className="flex items-center space-x-4">
              <Skeleton className="h-8 w-20" />
              <Skeleton className="h-8 w-20" />
              <Skeleton className="h-8 w-20" />
            </div>
          </div>
        </div>
      </header>
      
      {/* Content skeleton */}
      <main className="container-responsive py-8">
        <div className="space-y-6">
          <Skeleton className="h-12 w-3/4" />
          <Skeleton className="h-6 w-1/2" />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-48 w-full" />
            ))}
          </div>
        </div>
      </main>
    </div>
  </div>
);

const AdminSyncSkeleton = () => (
  <div className="space-y-4">
    <Skeleton className="h-8 w-64" />
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {[...Array(6)].map((_, i) => (
        <Skeleton key={i} className="h-32 w-full" />
      ))}
    </div>
  </div>
);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Cache for 5 minutes (reduced for fresher data)
      staleTime: 5 * 60 * 1000,
      // Keep data for 15 minutes (reduced for fresher data)
      gcTime: 15 * 60 * 1000,
      // Refetch on window focus to get fresh data
      refetchOnWindowFocus: true,
      // Retry failed requests up to 2 times
      retry: 2,
      // Refetch on mount if data is stale
      refetchOnMount: 'always',
      // Enable background refetching for better UX
      refetchInterval: false,
      // Network mode optimizations
      networkMode: 'online',
    },
    mutations: {
      // Retry mutations once on failure
      retry: 1,
      // Network mode for mutations
      networkMode: 'online',
    },
  },
});

const App = () => {
  // Initialize resource preloading for better performance
  const { preloadRouteResources } = useResourcePreloader();

  // Initialize frame rate optimization for 120fps support
  const { supportsHighRefreshRate, targetFPS, currentFPS } = useFrameRate();

  // Check admin status for performance monitoring
  const { isAdmin } = useAdminCheck();
  
  // Check if mobile to hide performance widget
  const isMobile = useIsMobile();

  // Mobile debugging
  useEffect(() => {
    console.log('📱 App component mounted on mobile:', isMobile, {
      userAgent: navigator.userAgent,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      }
    });
  }, [isMobile]);

  // Error boundary for mobile issues
  useEffect(() => {
    const handleError = (error: ErrorEvent) => {
      console.error('❌ App error:', error);
      // Don't let errors break the app completely
    };

    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);

  // Initialize accessibility enhancements
  useEffect(() => {
    const enhancer = AccessibilityEnhancer.getInstance();
    enhancer.init();
    enhancer.addSkipLinks();
    
    return () => {
      enhancer.destroy();
    };
  }, []);

  // Ensure Smartsupp chat widget is positioned relative to viewport
  useEffect(() => {
    const ensureSmartsuppPositioning = () => {
      // Find all possible Smartsupp elements with more aggressive selectors
      const smartsuppSelectors = [
        '#chat-application',
        '[data-smartsupp-widget]',
        '.smartsupp-widget',
        'iframe[src*="smartsupp"]',
        'iframe[src*="smartsuppchat"]',
        'div[class*="smartsupp"]',
        'div[id*="smartsupp"]',
        'body > div:last-child',
        'html > body > div:last-child'
      ];

      // Also check all divs that might be Smartsupp
      const allDivs = document.querySelectorAll('div');
      const smartsuppElements: HTMLElement[] = [];

      // Add elements from selectors
      smartsuppSelectors.forEach(selector => {
        const elements = document.querySelectorAll(selector);
        elements.forEach(element => {
          if (element instanceof HTMLElement) {
            smartsuppElements.push(element);
          }
        });
      });

      // Check all divs for Smartsupp characteristics
      allDivs.forEach(div => {
        if (div.id?.includes('smartsupp') || 
            div.className?.includes('smartsupp') ||
            div.getAttribute('data-smartsupp') ||
            div.style.position === 'fixed' ||
            div.style.zIndex === '2147483647' ||
            div.querySelector('iframe[src*="smartsupp"]')) {
          smartsuppElements.push(div);
        }
      });

      // Apply positioning to all found elements
      smartsuppElements.forEach(element => {
        if (element && element.style) {
          element.style.setProperty('position', 'fixed', 'important');
          element.style.setProperty('bottom', '20px', 'important');
          element.style.setProperty('right', '20px', 'important');
          element.style.setProperty('top', 'auto', 'important');
          element.style.setProperty('left', 'auto', 'important');
          element.style.setProperty('z-index', '2147483647', 'important');
          element.style.setProperty('transform', 'none', 'important');
          element.style.setProperty('margin', '0', 'important');
          element.style.setProperty('padding', '0', 'important');
          element.style.setProperty('inset', 'auto', 'important');
        }
      });

      // Also check iframes specifically
      const iframes = document.querySelectorAll('iframe');
      iframes.forEach(iframe => {
        if (iframe.src?.includes('smartsupp') || iframe.src?.includes('smartsuppchat')) {
          iframe.style.setProperty('position', 'fixed', 'important');
          iframe.style.setProperty('bottom', '20px', 'important');
          iframe.style.setProperty('right', '20px', 'important');
          iframe.style.setProperty('top', 'auto', 'important');
          iframe.style.setProperty('left', 'auto', 'important');
          iframe.style.setProperty('z-index', '2147483647', 'important');
        }
      });
    };

    // Run immediately and more frequently
    ensureSmartsuppPositioning();

    // Set up observer to watch for dynamically added Smartsupp elements
    const observer = new MutationObserver((mutations) => {
      let shouldCheck = false;
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              const element = node as Element;
              if (element.id?.includes('smartsupp') || 
                  element.className?.includes('smartsupp') ||
                  element.tagName === 'IFRAME' && (element as HTMLIFrameElement).src?.includes('smartsupp') ||
                  element.querySelector && element.querySelector('iframe[src*="smartsupp"]')) {
                shouldCheck = true;
              }
            }
          });
        }
      });
      
      if (shouldCheck) {
        setTimeout(ensureSmartsuppPositioning, 50);
      }
    });

    // Start observing
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    // Check more frequently
    const interval = setInterval(ensureSmartsuppPositioning, 1000);

    // Also run on window load and resize
    const handleLoad = () => {
      setTimeout(ensureSmartsuppPositioning, 500);
    };

    const handleResize = () => {
      ensureSmartsuppPositioning();
    };

    window.addEventListener('load', handleLoad);
    window.addEventListener('resize', handleResize);

    return () => {
      observer.disconnect();
      clearInterval(interval);
      window.removeEventListener('load', handleLoad);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Log performance information for development
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('🚀 KORAUTO Performance Info:', {
        supportsHighRefreshRate,
        targetFPS,
        currentFPS,
        userAgent: navigator.userAgent,
        devicePixelRatio: window.devicePixelRatio
      });
    }
  }, [supportsHighRefreshRate, targetFPS, currentFPS]);

  return (
    <QueryClientProvider client={queryClient}>
      <StatusRefreshProvider intervalHours={6} enabled={true}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
          <Routes>
            <Route path="/" element={
              <Suspense fallback={<PageSkeleton />}>
                <Index />
              </Suspense>
            } />
            <Route path="/catalog" element={
              <Suspense fallback={<PageSkeleton />}>
                <Catalog />
              </Suspense>
            } />
            <Route path="/car/:id" element={
              <Suspense fallback={<PageSkeleton />}>
                <CarDetails />
              </Suspense>
            } />
            <Route path="/car/:id/gallery" element={
              <Suspense fallback={<PageSkeleton />}>
                <CarGallery />
              </Suspense>
            } />
            <Route path="/admin" element={
              <Suspense fallback={<PageSkeleton />}>
                <AdminDashboard />
              </Suspense>
            } />
            <Route path="/admin/sync" element={
              <Suspense fallback={<AdminSyncSkeleton />}>
                <AdminSyncDashboard />
              </Suspense>
            } />
            <Route path="/auth" element={
              <Suspense fallback={<PageSkeleton />}>
                <AuthPage />
              </Suspense>
            } />
            <Route path="/auth/confirm" element={
              <Suspense fallback={<PageSkeleton />}>
                <EmailConfirmationPage />
              </Suspense>
            } />
            <Route path="/account" element={
              <Suspense fallback={<PageSkeleton />}>
                <MyAccount />
              </Suspense>
            } />
            <Route path="/favorites" element={
              <Suspense fallback={<PageSkeleton />}>
                <FavoritesPage />
              </Suspense>
            } />
            <Route path="/inspections" element={
              <Suspense fallback={<PageSkeleton />}>
                <InspectionServices />
              </Suspense>
            } />
            <Route path="/contacts" element={
              <Suspense fallback={<PageSkeleton />}>
                <Contacts />
              </Suspense>
            } />
            <Route path="/tracking" element={
              <Suspense fallback={<PageSkeleton />}>
                <ShipmentTracking />
              </Suspense>
            } />
            {/* Demo routes removed - no longer needed */}
            <Route path="/performance" element={
              <Suspense fallback={<PageSkeleton />}>
                <PerformanceDashboard />
              </Suspense>
            } />
            <Route path="/cookie-management" element={
              <Suspense fallback={<PageSkeleton />}>
                <CookieManagementDashboard />
              </Suspense>
            } />
            <Route path="/audit-test" element={
              <Suspense fallback={<PageSkeleton />}>
                <AuditTestPage />
              </Suspense>
            } />
            <Route path="/api-info-demo" element={
              <Suspense fallback={<PageSkeleton />}>
                <ApiInfoDemo />
              </Suspense>
            } />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={
              <Suspense fallback={<PageSkeleton />}>
                <NotFound />
              </Suspense>
            } />
          </Routes>
        </BrowserRouter>
        <InstallPrompt />
        <CacheUpdateNotification />
        <IOSEnhancer />
        {/* Performance Monitor for admin users only, hidden on mobile */}
        {isAdmin && !isMobile && (
          <PerformanceMonitor showDetails={false} />
        )}
      </TooltipProvider>
      </StatusRefreshProvider>
    </QueryClientProvider>
  );
};

export default App;
