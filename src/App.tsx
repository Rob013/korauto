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

// Lazy load all pages for better code splitting
const Index = lazy(() => import("./pages/Index"));
const Catalog = lazy(() => import("./pages/Catalog"));
const CarDetails = lazy(() => import("./pages/CarDetails"));
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
      // Cache for 10 minutes by default (increased from 5)
      staleTime: 10 * 60 * 1000,
      // Keep data for 30 minutes (increased from 10)
      gcTime: 30 * 60 * 1000,
      // Refetch on window focus for critical data only
      refetchOnWindowFocus: false,
      // Retry failed requests up to 2 times
      retry: 2,
      // Only refetch if data is stale (improved from 'always')
      refetchOnMount: false,
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

  // Initialize accessibility enhancements
  useEffect(() => {
    const enhancer = AccessibilityEnhancer.getInstance();
    enhancer.init();
    enhancer.addSkipLinks();
    
    return () => {
      enhancer.destroy();
    };
  }, []);

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
      </TooltipProvider>
      </StatusRefreshProvider>
    </QueryClientProvider>
  );
};

export default App;
