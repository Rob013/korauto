import { useEffect, lazy, Suspense } from "react";
import { useSearchParams } from "react-router-dom";
import { trackPageView } from "@/utils/analytics";
import Header from "@/components/Header";
import OptimizedCatalog from "@/components/OptimizedCatalog";
import { Skeleton } from "@/components/ui/skeleton";

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

  useEffect(() => {
    // Track catalog page view
    trackPageView(undefined, { 
      page_type: 'catalog',
      highlighted_car: highlightCarId 
    });
  }, [highlightCarId]);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <OptimizedCatalog highlightCarId={highlightCarId} />
      <Suspense fallback={<FooterSkeleton />}>
        <Footer />
      </Suspense>
    </div>
  );
};

export default Catalog;