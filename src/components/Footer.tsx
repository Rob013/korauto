import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Facebook, Twitter, Instagram, Youtube, Mail, Phone, MapPin } from "lucide-react";
import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="bg-primary text-primary-foreground mobile-section">
      <div className="container-responsive">
        <div className="mobile-stack md:grid md:grid-cols-3 gap-8">
          {/* Company Info */}
          <div className="mobile-stack-sm">
            <h3 className="mobile-subtitle font-bold">KORAUTO</h3>
            <p className="mobile-body opacity-90">
              Partneri juaj i besuar për makina të cilësisë së lartë me shërbime profesionale inspektimi në të gjithë Evropën.
            </p>
          </div>

          {/* Quick Links */}
          <div className="mobile-stack-sm">
            <h4 className="mobile-subtitle font-semibold">Lidhje të Shpejta</h4>
            <div className="mobile-stack-sm">
              <Link to="/" className="touch-target mobile-body hover:text-gray-300 transition-colors">Kryefaqja</Link>
              <Link to="/catalog" className="touch-target mobile-body hover:text-gray-300 transition-colors">Katalogu</Link>
              <button 
                onClick={() => {
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                  setTimeout(() => {
                    document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' });
                  }, 500);
                }}
                className="touch-target mobile-body hover:text-gray-300 transition-colors text-left bg-transparent border-none cursor-pointer p-0"
              >
                Kontakti
              </button>
            </div>
          </div>

          {/* Contact Info */}
          <div className="mobile-stack-sm">
            <h4 className="mobile-subtitle font-semibold">Informacioni i Kontaktit</h4>
            <div className="mobile-stack-sm">
              <div className="flex items-center gap-3">
                <Phone className="h-5 w-5 flex-shrink-0" />
                <a href="tel:+38348181116" className="mobile-body hover:text-gray-300 transition-colors touch-target">
                  +38348181116
                </a>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 flex-shrink-0" />
                <a href="mailto:INFO.RGSHPK@gmail.com" className="mobile-body hover:text-gray-300 transition-colors touch-target break-all">
                  INFO.RGSHPK@gmail.com
                </a>
              </div>
              <div className="flex items-center gap-3">
                <MapPin className="h-5 w-5 flex-shrink-0" />
                <a 
                  href="https://maps.google.com/?q=KORAUTO,Rr.+Ilaz+Kodra+70,Prishtinë,Kosovo" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="mobile-body hover:text-gray-300 transition-colors touch-target"
                >
                  Rr. Ilaz Kodra 70, Prishtinë
                </a>
              </div>
              
              {/* Social Media Links */}
              <div className="flex items-center gap-6 mt-4">
                <a 
                  href="https://www.facebook.com/korauto.ks" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hover:text-gray-300 transition-colors touch-target"
                >
                  <Facebook className="h-6 w-6" />
                </a>
                <a 
                  href="https://www.instagram.com/korauto.ks" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hover:text-gray-300 transition-colors touch-target"
                >
                  <Instagram className="h-6 w-6" />
                </a>
                <a 
                  href="https://wa.me/38348181116" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-green-400 hover:text-green-300 transition-colors mobile-body font-medium touch-target"
                >
                  WhatsApp
                </a>
                <a 
                  href="viber://chat?number=+38348181116" 
                  className="text-purple-400 hover:text-purple-300 transition-colors mobile-body font-medium touch-target"
                >
                  Viber
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-white/20 mt-8 pt-8 mobile-center">
          <p className="mobile-caption opacity-75">
            © 2024 KORAUTO. Të gjitha të drejtat e rezervuara. Shërbime profesionale inspektimi makinash.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;