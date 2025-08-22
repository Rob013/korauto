import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { lazy, Suspense, useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { InstallPrompt } from "./components/InstallPrompt";
import FloatingPerformanceWidget from "./components/FloatingPerformanceWidget";
import AccessibilityWidget from "./components/AccessibilityWidget";
import { useResourcePreloader } from "./hooks/useResourcePreloader";
import { useAccessibility } from "./hooks/useAccessibility";

// Lazy load all pages for better code splitting
const Index = lazy(() => import("./pages/Index"));
const Catalog = lazy(() => import("./pages/Catalog"));
const NewCatalog = lazy(() => import("./pages/NewCatalog"));
const CarDetails = lazy(() => import("./pages/CarDetails"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const AuthPage = lazy(() => import("./pages/AuthPage"));
const FavoritesPage = lazy(() => import("./pages/FavoritesPage"));
const InspectionServices = lazy(() => import("./pages/InspectionServices"));
const MyAccount = lazy(() => import("./pages/MyAccount"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Contacts = lazy(() => import("./pages/Contacts"));
const ComponentDemo = lazy(() => import("./pages/ComponentDemo"));
const DiagramDemo = lazy(() => import("./pages/DiagramDemo"));
// Removed demo import - was only for testing layout improvements
const AdminCarSearchDemo = lazy(() => import("./pages/AdminCarSearchDemo"));
const PerformanceDashboard = lazy(() => import("./components/PerformanceDashboard"));
const ComprehensivePerformanceDashboard = lazy(() => import("./components/ComprehensivePerformanceDashboard"));

// Lazy load admin components for better code splitting
const AdminSyncDashboard = lazy(() => import("./components/AdminSyncDashboard"));
const CookieManagementDashboard = lazy(() => import("./components/CookieManagementDashboard"));

const PageSkeleton = () => (
  <div className="min-h-screen bg-background" role="progressbar" aria-label="Loading page content">
    <div className="animate-pulse">
      {/* Header skeleton */}
      <header className="border-b" role="banner">
        <div className="container-responsive py-4">
          <div className="flex items-center justify-between">
            <Skeleton className="h-8 w-32" aria-label="Loading logo" />
            <nav aria-label="Loading navigation">
              <div className="flex items-center space-x-4">
                <Skeleton className="h-8 w-20" aria-label="Loading navigation item" />
                <Skeleton className="h-8 w-20" aria-label="Loading navigation item" />
                <Skeleton className="h-8 w-20" aria-label="Loading navigation item" />
              </div>
            </nav>
          </div>
        </div>
      </header>
      
      {/* Content skeleton */}
      <main className="container-responsive py-8" role="main" id="main-content">
        <div className="space-y-6">
          <Skeleton className="h-12 w-3/4" aria-label="Loading page title" />
          <Skeleton className="h-6 w-1/2" aria-label="Loading page description" />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3" role="grid" aria-label="Loading content grid">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-48 w-full" role="gridcell" aria-label={`Loading content item ${i + 1}`} />
            ))}
          </div>
        </div>
      </main>
    </div>
  </div>
);

const AdminSyncSkeleton = () => (
  <div className="space-y-4" role="progressbar" aria-label="Loading admin dashboard">
    <Skeleton className="h-8 w-64" aria-label="Loading admin title" />
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3" role="grid" aria-label="Loading admin content">
      {[...Array(6)].map((_, i) => (
        <Skeleton key={i} className="h-32 w-full" role="gridcell" aria-label={`Loading admin item ${i + 1}`} />
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
  
  // Initialize accessibility features
  const { announce, isEnabled: accessibilityEnabled } = useAccessibility({
    enabled: true,
    autoFix: true,
    announcements: true
  });

  // Announce page changes for screen readers
  useEffect(() => {
    const handleRouteChange = () => {
      if (accessibilityEnabled) {
        const title = document.title;
        announce(`Navigated to ${title}`, 'polite');
      }
    };

    // Listen for route changes
    window.addEventListener('popstate', handleRouteChange);
    
    return () => {
      window.removeEventListener('popstate', handleRouteChange);
    };
  }, [announce, accessibilityEnabled]);

  return (
    <QueryClientProvider client={queryClient}>
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
            <Route path="/catalog-new" element={
              <Suspense fallback={<PageSkeleton />}>
                <NewCatalog />
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
            <Route path="/demo" element={
              <Suspense fallback={<PageSkeleton />}>
                <ComponentDemo />
              </Suspense>
            } />
            <Route path="/diagram-demo" element={
              <Suspense fallback={<PageSkeleton />}>
                <DiagramDemo />
              </Suspense>
            } />
// Remove the demo route since it was just for testing
            <Route path="/admin-search-demo" element={
              <Suspense fallback={<PageSkeleton />}>
                <AdminCarSearchDemo />
              </Suspense>
            } />
            <Route path="/performance" element={
              <Suspense fallback={<PageSkeleton />}>
                <PerformanceDashboard />
              </Suspense>
            } />
            <Route path="/comprehensive-performance" element={
              <Suspense fallback={<PageSkeleton />}>
                <ComprehensivePerformanceDashboard />
              </Suspense>
            } />
            <Route path="/cookie-management" element={
              <Suspense fallback={<PageSkeleton />}>
                <CookieManagementDashboard />
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
        <FloatingPerformanceWidget />
        <AccessibilityWidget enabled={process.env.NODE_ENV === 'development'} />
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
