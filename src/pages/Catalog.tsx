import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { trackPageView } from "@/utils/analytics";
import Header from "@/components/Header";
import EncarCatalog from "@/components/EncarCatalog";
import Footer from "@/components/Footer";

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
      <EncarCatalog highlightCarId={highlightCarId} />
      <Footer />
    </div>
  );
};

export default Catalog;