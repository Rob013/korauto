import Header from "@/components/Header";
import Footer from "@/components/Footer";
import LiveCatalog from "@/components/LiveCatalog";

const Catalog = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <LiveCatalog />
      <Footer />
    </div>
  );
};

export default Catalog;