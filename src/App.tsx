import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Catalog from "./pages/Catalog";
import CarDetails from "./pages/CarDetails";
import CarDetailsOptimized from "./components/CarDetailsOptimized";
import AdminDashboard from "./pages/AdminDashboard";
import AuthPage from "./pages/AuthPage";
import FavoritesPage from "./pages/FavoritesPage";
import InspectionServices from "./pages/InspectionServices";
import MyAccount from "./pages/MyAccount";
import NotFound from "./pages/NotFound";
import { AdminSyncDashboard } from "./components/AdminSyncDashboard";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/catalog" element={<Catalog />} />
          <Route path="/car/:id" element={<CarDetailsOptimized />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/sync" element={<AdminSyncDashboard />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/account" element={<MyAccount />} />
          <Route path="/favorites" element={<FavoritesPage />} />
          <Route path="/inspections" element={<InspectionServices />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
