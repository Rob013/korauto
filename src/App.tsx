import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { lazy, memo, Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
// import { usePerformance } from "@/hooks/use-performance";
// import { PerformanceMonitorComponent } from "@/components/PerformanceMonitor";

// Lazy load pages for better initial load performance
const Index = lazy(() => import("./pages/Index"));
const Catalog = lazy(() => import("./pages/Catalog"));
const CarDetails = lazy(() => import("./pages/CarDetails"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const AuthPage = lazy(() => import("./pages/AuthPage"));
const FavoritesPage = lazy(() => import("./pages/FavoritesPage"));
const InspectionServices = lazy(() => import("./pages/InspectionServices"));
const MyAccount = lazy(() => import("./pages/MyAccount"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Contacts = lazy(() => import("./pages/Contacts"));
const AdminSyncDashboard = lazy(() => import("./components/AdminSyncDashboard").then(module => ({ default: module.AdminSyncDashboard })));
const InstallPrompt = lazy(() => import("./components/InstallPrompt").then(module => ({ default: module.InstallPrompt })));

// Optimized QueryClient with better defaults
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      retry: 2,
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: 1,
    },
  },
});

// Loading fallback component
const PageSkeleton = () => (
  <div className="min-h-screen bg-background">
    <div className="container-responsive py-8">
      <Skeleton className="h-8 w-64 mb-6" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="space-y-3">
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        ))}
      </div>
    </div>
  </div>
);

const App = memo(() => {
  // Performance monitoring - temporarily disabled
  // usePerformance({ name: 'App', enabled: process.env.NODE_ENV === 'development' });

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Suspense fallback={<PageSkeleton />}>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/catalog" element={<Catalog />} />
              <Route path="/car/:id" element={<CarDetails />} />
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/sync" element={<AdminSyncDashboard />} />
              <Route path="/auth" element={<AuthPage />} />
              <Route path="/account" element={<MyAccount />} />
              <Route path="/favorites" element={<FavoritesPage />} />
              <Route path="/inspections" element={<InspectionServices />} />
              <Route path="/contacts" element={<Contacts />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
        <Suspense fallback={null}>
          <InstallPrompt />
        </Suspense>
        {/* <PerformanceMonitorComponent /> */}
      </TooltipProvider>
    </QueryClientProvider>
  );
});

App.displayName = 'App';

export default App;
