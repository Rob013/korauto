import Header from "@/components/Header";
import EnhancedCatalog from "@/components/EnhancedCatalog";
import Footer from "@/components/Footer";

const Catalog = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <EnhancedCatalog />
      <Footer />
    </div>
  );
};

export default Catalog;