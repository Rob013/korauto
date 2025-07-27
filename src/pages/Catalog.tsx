import Header from "@/components/Header";
import DatabaseCatalog from "@/components/DatabaseCatalog";
import Footer from "@/components/Footer";

const Catalog = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <DatabaseCatalog />
      <Footer />
    </div>
  );
};

export default Catalog;