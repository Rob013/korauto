import { useEffect } from "react";
import { trackPageView } from "@/utils/analytics";
import Header from "@/components/Header";
import EncarCatalog from "@/components/EncarCatalog";
import Footer from "@/components/Footer";

const Catalog = () => {
  useEffect(() => {
    // Track catalog page view
    trackPageView(undefined, { page_type: 'catalog' });
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <EncarCatalog />
      <Footer />
    </div>
  );
};

export default Catalog;