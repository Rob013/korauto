import Header from "@/components/Header";
import HomeSection from "@/components/HomeSection";
import FilteredCarsSection from "@/components/FilteredCarsSection";
import InspectionSection from "@/components/InspectionSection";
import ContactSection from "@/components/ContactSection";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <HomeSection />
      <FilteredCarsSection />
      <InspectionSection />
      <ContactSection />
      <Footer />
    </div>
  );
};

export default Index;
