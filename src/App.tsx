import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Suspense, useEffect, ReactNode, useMemo } from "react";
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
import PageTransition from "./components/PageTransition";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { lazyWithPreload, LazyComponentWithPreload } from "./utils/lazyWithPreload";
import { useNavigationPrefetch } from "./hooks/useNavigationPrefetch";
import { GlobalProgressProvider } from "./contexts/ProgressContext";
import { TopLoadingBar } from "./components/TopLoadingBar";
import { NavigationProgressListener } from "./components/NavigationProgressListener";
import { AppErrorBoundary } from "./components/AppErrorBoundary";

// Lazy load all pages for better code splitting
const Index = lazyWithPreload(() => import("./pages/Index"));
const Catalog = lazyWithPreload(() => import("./pages/Catalog"));
const CarDetails = lazyWithPreload(() => import("./pages/CarDetails"));
const CarGallery = lazyWithPreload(() => import("./pages/CarGallery"));
const CarInspectionReport = lazyWithPreload(() => import("./pages/CarInspectionReport"));
const AdminDashboard = lazyWithPreload(() => import("./pages/AdminDashboard"));
const AuthPage = lazyWithPreload(() => import("./pages/AuthPage"));
const EmailConfirmationPage = lazyWithPreload(() => import("./pages/EmailConfirmationPage"));
const FavoritesPage = lazyWithPreload(() => import("./pages/FavoritesPage"));
const InspectionServices = lazyWithPreload(() => import("./pages/InspectionServices"));
const MyAccount = lazyWithPreload(() => import("./pages/MyAccount"));
const NotFound = lazyWithPreload(() => import("./pages/NotFound"));
const Contacts = lazyWithPreload(() => import("./pages/Contacts"));
const ShipmentTracking = lazyWithPreload(() => import("./pages/ShipmentTracking"));
// Demo imports removed - no longer needed
const PerformanceDashboard = lazyWithPreload(() => import("./components/PerformanceDashboard"));
const AuditTestPage = lazyWithPreload(() => import("./pages/AuditTestPage"));
const ApiInfoDemo = lazyWithPreload(() => import("./components/ApiInfoDemo"));
const Warranty = lazyWithPreload(() => import("./pages/Warranty"));
const Auctions = lazyWithPreload(() => import("./pages/Auctions"));

// Lazy load admin components for better code splitting
const AdminSyncDashboard = lazyWithPreload(() => import("./components/AdminSyncDashboard"));
const CookieManagementDashboard = lazyWithPreload(() => import("./components/CookieManagementDashboard"));

const PageSkeleton = () => (
  <div className="min-h-screen bg-background optimize-rendering">
    <div className="animate-pulse" style={{ willChange: 'opacity' }}>
      {/* Header skeleton */}
      <header className="border-b">
        <div className="container-responsive py-4">
          <div className="flex items-center justify-between">
            <Skeleton className="h-8 w-32" style={{ transform: 'translate3d(0,0,0)' }} />
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
              <Skeleton key={i} className="h-48 w-full" style={{ transform: 'translate3d(0,0,0)' }} />
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

const renderWithTransition = (
  Component: LazyComponentWithPreload,
  fallback: ReactNode = <PageSkeleton />
) => (
  <Suspense fallback={fallback}>
    <PageTransition>
      <Component />
    </PageTransition>
  </Suspense>
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

  const routePrefetchers = useMemo(
    () => ({
      '/': () => { Index.preload?.(); },
      '/catalog': () => {
        Catalog.preload?.();
        preloadRouteResources('catalog');
      },
      '/catalog/*': () => {
        Catalog.preload?.();
        preloadRouteResources('catalog');
      },
      '/car/*': () => {
        CarDetails.preload?.();
        CarGallery.preload?.();
        CarInspectionReport.preload?.();
        preloadRouteResources('car-details');
      },
      '/favorites': () => { FavoritesPage.preload?.(); },
      '/favorites/*': () => { FavoritesPage.preload?.(); },
      '/inspections': () => { InspectionServices.preload?.(); },
      '/contacts': () => { Contacts.preload?.(); },
      '/tracking': () => {
        ShipmentTracking.preload?.();
        preloadRouteResources('tracking');
      },
      '/warranty': () => { Warranty.preload?.(); },
      '/garancioni': () => { Warranty.preload?.(); },
      '/account': () => { MyAccount.preload?.(); },
      '/auth': () => {
        AuthPage.preload?.();
        preloadRouteResources('auth');
      },
      '/auth/confirm': () => { EmailConfirmationPage.preload?.(); },
      '/admin': () => {
        AdminDashboard.preload?.();
        preloadRouteResources('admin');
      },
      '/admin/*': () => {
        AdminDashboard.preload?.();
        AdminSyncDashboard.preload?.();
        CookieManagementDashboard.preload?.();
        preloadRouteResources('admin');
      },
      '/performance': () => { PerformanceDashboard.preload?.(); },
      '/cookie-management': () => { CookieManagementDashboard.preload?.(); },
      '/audit-test': () => { AuditTestPage.preload?.(); },
      '/api-info-demo': () => { ApiInfoDemo.preload?.(); },
    }),
    [preloadRouteResources]
  );

  useNavigationPrefetch(routePrefetchers, {
    prefetchDelay: 100,
    warmupDelay: 300,
    disableOnSlowConnection: true,
  });

  // Initialize frame rate optimization for 120fps support
  const { supportsHighRefreshRate, targetFPS, currentFPS } = useFrameRate();

  // Check admin status for performance monitoring
  const { isAdmin } = useAdminCheck();
  
  // Check if mobile to hide performance widget
  const isMobile = useIsMobile();

  // Initialize accessibility enhancements
  useEffect(() => {
    const enhancer = AccessibilityEnhancer.getInstance();
    enhancer.init();
    enhancer.addSkipLinks();

    return () => {
      enhancer.destroy();
    };
  }, []);

  // Memory cleanup on unmount and visibility change
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Clear some caches when app is hidden to free memory
        const memoryThreshold = 0.7; // 70% usage threshold
        if ('memory' in performance) {
          const memory = (performance as any).memory;
          if (memory) {
            const percentUsed = memory.usedJSHeapSize / memory.totalJSHeapSize;
            if (percentUsed > memoryThreshold) {
              console.log('🧹 Clearing caches on visibility change...');
              queryClient.getQueryCache().clear();
            }
          }
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Clear old queries periodically to prevent memory leaks
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const intervalId = window.setInterval(() => {
      queryClient.getQueryCache().clear();
    }, 30 * 60 * 1000); // Clear every 30 minutes

    return () => {
      window.clearInterval(intervalId);
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
    <AppErrorBoundary>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <StatusRefreshProvider intervalHours={6} enabled={true}>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <GlobalProgressProvider>
                <BrowserRouter>
                  <NavigationProgressListener />
                  <Routes>
                    <Route path="/" element={renderWithTransition(Index)} />
                    <Route path="/catalog" element={renderWithTransition(Catalog)} />
                    <Route path="/auctions" element={renderWithTransition(Auctions)} />
                    <Route path="/car/:id" element={renderWithTransition(CarDetails)} />
                    <Route path="/car/:id/gallery" element={renderWithTransition(CarGallery)} />
                    <Route path="/car/:id/report" element={renderWithTransition(CarInspectionReport)} />
                    <Route path="/admin" element={renderWithTransition(AdminDashboard)} />
                    <Route
                      path="/admin/sync"
                      element={renderWithTransition(AdminSyncDashboard, <AdminSyncSkeleton />)}
                    />
                    <Route path="/auth" element={renderWithTransition(AuthPage)} />
                    <Route path="/auth/confirm" element={renderWithTransition(EmailConfirmationPage)} />
                    <Route path="/account" element={renderWithTransition(MyAccount)} />
                    <Route path="/favorites" element={renderWithTransition(FavoritesPage)} />
                    <Route path="/inspections" element={renderWithTransition(InspectionServices)} />
                    <Route path="/warranty" element={renderWithTransition(Warranty)} />
                    <Route path="/contacts" element={renderWithTransition(Contacts)} />
                    <Route path="/garancioni" element={renderWithTransition(Warranty)} />
                    <Route path="/tracking" element={renderWithTransition(ShipmentTracking)} />
                    {/* Demo routes removed - no longer needed */}
                    <Route path="/performance" element={renderWithTransition(PerformanceDashboard)} />
                    <Route
                      path="/cookie-management"
                      element={renderWithTransition(CookieManagementDashboard)}
                    />
                    <Route path="/audit-test" element={renderWithTransition(AuditTestPage)} />
                    <Route path="/api-info-demo" element={renderWithTransition(ApiInfoDemo)} />
                    {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                    <Route path="*" element={renderWithTransition(NotFound)} />
                  </Routes>
                </BrowserRouter>
                <TopLoadingBar />
              </GlobalProgressProvider>
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
    </ErrorBoundary>
    </AppErrorBoundary>
  );
};

export default App;
