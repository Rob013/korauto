import Header from "@/components/Header";
import HomeSection from "@/components/HomeSection";
import LiveCatalog from "@/components/LiveCatalog";
import InspectionSection from "@/components/InspectionSection";
import ContactSection from "@/components/ContactSection";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <HomeSection />
      <LiveCatalog />
      <ContactSection />
      <Footer />
    </div>
  );
};

export default Index;
