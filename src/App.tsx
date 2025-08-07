import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { lazy, Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { InstallPrompt } from "./components/InstallPrompt";
import FloatingPerformanceWidget from "./components/FloatingPerformanceWidget";
import { useResourcePreloader } from "./hooks/useResourcePreloader";

// Lazy load all pages for better code splitting
const Index = lazy(() => import("./pages/Index"));
const Catalog = lazy(() => import("./pages/Catalog"));


const AuthPage = lazy(() => import("./pages/AuthPage"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Contacts = lazy(() => import("./pages/Contacts"));

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
      refetchOnMount: true,
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
            <Route path="/auth" element={
              <Suspense fallback={<PageSkeleton />}>
                <AuthPage />
              </Suspense>
            } />
            <Route path="/contacts" element={
              <Suspense fallback={<PageSkeleton />}>
                <Contacts />
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
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
