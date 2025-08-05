import { useEffect } from "react";
import { trackPageView, trackContact } from "@/utils/analytics";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ContactSection from "@/components/ContactSection";

const Contacts = () => {
  useEffect(() => {
    // Track contacts page view
    trackPageView(undefined, { page_type: 'contacts' });
  }, []);

  const handleContactClick = (method: 'email' | 'phone') => {
    trackContact(method);
  };

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