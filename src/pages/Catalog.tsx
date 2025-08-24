import { useEffect, lazy, Suspense, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { trackPageView } from "@/utils/analytics";
import Header from "@/components/Header";
import EncarCatalog from "@/components/EncarCatalog";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import PerformanceAuditWidget from "@/components/PerformanceAuditWidget";
import { Activity } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const Footer = lazy(() => import("@/components/Footer"));

const FooterSkeleton = () => (
  <footer className="bg-card">
    <div className="container-responsive py-8">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="space-y-3">
            <Skeleton className="h-5 w-24" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    </div>
  </footer>
);

const Catalog = () => {
  const [searchParams] = useSearchParams();
  const highlightCarId = searchParams.get('highlight');
  const [showAudit, setShowAudit] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    // Track catalog page view
    trackPageView(undefined, { 
      page_type: 'catalog',
      highlighted_car: highlightCarId 
    });
  }, [highlightCarId]);

  // Check admin status
  useEffect(() => {
    const checkAdminStatus = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (session?.user) {
          const { data: adminCheck } = await supabase.rpc("is_admin");
          setIsAdmin(adminCheck || false);
        }
      } catch (error) {
        console.error("Failed to check admin status:", error);
        setIsAdmin(false);
      }
    };
    checkAdminStatus();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Development Audit Tool - Only visible to administrators */}
      {isAdmin && (
        <div className="fixed top-20 right-4 z-50">
          <Button
            onClick={() => setShowAudit(!showAudit)}
            variant="outline"
            size="sm"
            className="bg-background/95 backdrop-blur-sm"
          >
            <Activity className="h-4 w-4 mr-2" />
            {showAudit ? 'Hide Audit' : 'Show Audit'}
          </Button>
        </div>
      )}
      
      {showAudit && (
        <div className="fixed inset-0 bg-background/95 backdrop-blur-sm z-40 overflow-auto p-4">
          <div className="container-responsive py-8">
            <PerformanceAuditWidget />
          </div>
        </div>
      )}
      
      <EncarCatalog highlightCarId={highlightCarId} />
      <Suspense fallback={<FooterSkeleton />}>
        <Footer />
      </Suspense>
    </div>
  );
};

export default Catalog;