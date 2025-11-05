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
            <Route path="/car/:id/report" element={
              <Suspense fallback={<PageSkeleton />}>
                <CarInspectionReport />
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
            <Route path="/garancioni" element={
              <Suspense fallback={<PageSkeleton />}>
                <Warranty />
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
