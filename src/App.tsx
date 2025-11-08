import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { lazy, Suspense, useEffect, ReactNode } from "react";
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
import { FavoritesProvider } from "./contexts/FavoritesContext";

// Lazy load all pages for better code splitting
const Index = lazy(() => import("./pages/Index"));
const Catalog = lazy(() => import("./pages/Catalog"));
const CarDetails = lazy(() => import("./pages/CarDetails"));
const CarGallery = lazy(() => import("./pages/CarGallery"));
const CarInspectionReport = lazy(() => import("./pages/CarInspectionReport"));
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
const Warranty = lazy(() => import("./pages/Warranty"));

// Lazy load admin components for better code splitting
const AdminSyncDashboard = lazy(() => import("./components/AdminSyncDashboard"));
const CookieManagementDashboard = lazy(() => import("./components/CookieManagementDashboard"));

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
  Component: React.LazyExoticComponent<React.ComponentType<any>>,
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
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <FavoritesProvider>
            <StatusRefreshProvider intervalHours={6} enabled={true}>
              <TooltipProvider>
                <Toaster />
                <Sonner />
                <BrowserRouter>
                  <Routes>
                <Route path="/" element={renderWithTransition(Index)} />
                <Route path="/catalog" element={renderWithTransition(Catalog)} />
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
                <InstallPrompt />
                <CacheUpdateNotification />
                <IOSEnhancer />
                {/* Performance Monitor for admin users only, hidden on mobile */}
                {isAdmin && !isMobile && (
                  <PerformanceMonitor showDetails={false} />
                )}
              </TooltipProvider>
            </StatusRefreshProvider>
          </FavoritesProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;
