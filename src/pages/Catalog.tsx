import Header from "@/components/Header";
import FilteredCarsSection from "@/components/FilteredCarsSection";
import Footer from "@/components/Footer";

const Catalog = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <FilteredCarsSection />
      <Footer />
    </div>
  );
};

export default Catalog;