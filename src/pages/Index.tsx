import Header from "@/components/Header";
import HomeSection from "@/components/HomeSection";
import HomeCarsSection from "@/components/HomeCarsSection";
import BrandRanking from "@/components/BrandRanking";
import InspectionSection from "@/components/InspectionSection";
import ContactSection from "@/components/ContactSection";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <HomeSection />
      <HomeCarsSection />
      <BrandRanking />
      <ContactSection />
      <Footer />
    </div>
  );
};

export default Index;
