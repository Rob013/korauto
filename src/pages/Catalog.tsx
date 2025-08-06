import { useEffect, lazy, Suspense, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { trackPageView } from "@/utils/analytics";
import Header from "@/components/Header";
import EncarCatalog from "@/components/EncarCatalog";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Footer = lazy(() => import("@/components/Footer"));
const InspectedCarsTab = lazy(() => import("@/components/InspectedCarsTab"));

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
  const [activeTab, setActiveTab] = useState("all");

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
      <div className="container-responsive py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="all">Të Gjitha Makinat</TabsTrigger>
            <TabsTrigger value="inspected">TE INSPEKTUARA</TabsTrigger>
          </TabsList>
          
          <TabsContent value="all" className="mt-0">
            <EncarCatalog highlightCarId={highlightCarId} />
          </TabsContent>
          
          <TabsContent value="inspected" className="mt-0">
            <Suspense fallback={
              <div className="flex items-center justify-center py-12">
                <Skeleton className="h-8 w-8 rounded-full mr-2" />
                <span>Loading inspected cars...</span>
              </div>
            }>
              <InspectedCarsTab />
            </Suspense>
          </TabsContent>
        </Tabs>
      </div>
      <Suspense fallback={<FooterSkeleton />}>
        <Footer />
      </Suspense>
    </div>
  );
};

export default Catalog;