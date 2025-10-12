import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { trackPageView } from "@/utils/analytics";
import EncarCatalog from "@/components/EncarCatalog";
// Footer is rendered by the persistent Layout

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
      <div className="animate-fade-in">
        <EncarCatalog highlightCarId={highlightCarId} />
      </div>
      {/* Footer is provided by Layout */}
    </div>
  );
};

export default Catalog;