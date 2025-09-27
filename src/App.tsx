import React, { Suspense, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import { InstallPrompt } from "./components/InstallPrompt";
import { StatusRefreshProvider } from "./components/StatusRefreshProvider";

// Import pages directly to avoid lazy loading issues during debugging
import Index from "./pages/Index";
import Catalog from "./pages/Catalog";
import CarDetails from "./pages/CarDetails";
import CarGallery from "./pages/CarGallery";
import AdminDashboard from "./pages/AdminDashboard";
import AuthPage from "./pages/AuthPage";
import EmailConfirmationPage from "./pages/EmailConfirmationPage";
import FavoritesPage from "./pages/FavoritesPage";
import InspectionServices from "./pages/InspectionServices";
import MyAccount from "./pages/MyAccount";
import NotFound from "./pages/NotFound";
import Contacts from "./pages/Contacts";
import ShipmentTracking from "./pages/ShipmentTracking";
import PerformanceDashboard from "./components/PerformanceDashboard";
import AuditTestPage from "./pages/AuditTestPage";
import ApiInfoDemo from "./components/ApiInfoDemo";
import AdminSyncDashboard from "./components/AdminSyncDashboard";
import CookieManagementDashboard from "./components/CookieManagementDashboard";

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

const App: React.FC = () => {
  console.log('🚀 App component rendering');

  return (
    <QueryClientProvider client={queryClient}>
      <StatusRefreshProvider intervalHours={6} enabled={true}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/catalog" element={<Catalog />} />
              <Route path="/car/:id" element={<CarDetails />} />
              <Route path="/car/:id/gallery" element={<CarGallery />} />
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/sync" element={<AdminSyncDashboard />} />
              <Route path="/auth" element={<AuthPage />} />
              <Route path="/auth/confirm" element={<EmailConfirmationPage />} />
              <Route path="/account" element={<MyAccount />} />
              <Route path="/favorites" element={<FavoritesPage />} />
              <Route path="/inspections" element={<InspectionServices />} />
              <Route path="/contacts" element={<Contacts />} />
              <Route path="/tracking" element={<ShipmentTracking />} />
              <Route path="/performance" element={<PerformanceDashboard />} />
              <Route path="/cookie-management" element={<CookieManagementDashboard />} />
              <Route path="/audit-test" element={<AuditTestPage />} />
              <Route path="/api-info-demo" element={<ApiInfoDemo />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
          <InstallPrompt />
        </TooltipProvider>
      </StatusRefreshProvider>
    </QueryClientProvider>
  );
};

export default App;
