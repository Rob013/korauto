import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ContactSection from "@/components/ContactSection";

const Contacts = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="py-8">
        <ContactSection />
      </div>
      <Footer />
    </div>
  );
};

export default Contacts;