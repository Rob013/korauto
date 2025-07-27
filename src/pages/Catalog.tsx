import Header from "@/components/Header";
import CatalogCarsSection from "@/components/CatalogCarsSection";
import Footer from "@/components/Footer";

const Catalog = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <CatalogCarsSection />
      <Footer />
    </div>
  );
};

export default Catalog;