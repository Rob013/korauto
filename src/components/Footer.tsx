import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Facebook, Twitter, Instagram, Youtube, Mail, Phone, MapPin } from "lucide-react";
import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="bg-primary text-primary-foreground section-padding-mobile">
      <div className="container-mobile">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {/* Company Info */}
          <div className="space-y-4 text-center sm:text-left">
            <h3 className="heading-mobile-h3">KORAUTO</h3>
            <p className="text-responsive-sm opacity-90 leading-relaxed">
              Partneri juaj i besuar për makina të cilësisë së lartë me shërbime profesionale inspektimi në të gjithë Evropën.
            </p>
          </div>

          {/* Quick Links */}
          <div className="space-y-4 text-center sm:text-left">
            <h4 className="heading-mobile-h3">Lidhje të Shpejta</h4>
            <div className="flex-mobile-stack text-responsive-sm">
              <Link 
                to="/" 
                className="nav-link-mobile sm:block hover:text-gray-300 transition-colors"
              >
                Kryefaqja
              </Link>
              <Link 
                to="/catalog" 
                className="nav-link-mobile sm:block hover:text-gray-300 transition-colors"
              >
                Katalogu
              </Link>
              <button 
                onClick={() => {
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                  setTimeout(() => {
                    document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' });
                  }, 500);
                }}
                className="nav-link-mobile sm:block hover:text-gray-300 transition-colors text-left bg-transparent border-none cursor-pointer w-full sm:w-auto"
              >
                Kontakti
              </button>
            </div>
          </div>

          {/* Contact Info */}
          <div className="space-y-4 text-center sm:text-left sm:col-span-2 lg:col-span-1">
            <h4 className="heading-mobile-h3">Informacioni i Kontaktit</h4>
            <div className="flex-mobile-stack text-responsive-sm">
              <div className="flex items-center gap-3 justify-center sm:justify-start touch-target">
                <Phone className="h-5 w-5 flex-shrink-0" />
                <a 
                  href="tel:+38348181116" 
                  className="hover:text-gray-300 transition-colors touch-target"
                >
                  +38348181116
                </a>
              </div>
              <div className="flex items-center gap-3 justify-center sm:justify-start touch-target">
                <Mail className="h-5 w-5 flex-shrink-0" />
                <a 
                  href="mailto:INFO.RGSHPK@gmail.com" 
                  className="hover:text-gray-300 transition-colors break-all touch-target"
                >
                  INFO.RGSHPK@gmail.com
                </a>
              </div>
              <div className="flex items-center gap-3 justify-center sm:justify-start touch-target">
                <MapPin className="h-5 w-5 flex-shrink-0" />
                <a 
                  href="https://maps.google.com/?q=KORAUTO,Rr.+Ilaz+Kodra+70,Prishtinë,Kosovo" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hover:text-gray-300 transition-colors touch-target"
                >
                  Rr. Ilaz Kodra 70, Prishtinë
                </a>
              </div>
              
              {/* Social Media Links */}
              <div className="flex items-center gap-4 justify-center sm:justify-start mt-4">
                <a 
                  href="https://www.facebook.com/korauto.ks" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hover:text-gray-300 transition-colors touch-target-large"
                >
                  <Facebook className="h-6 w-6" />
                </a>
                <a 
                  href="https://www.instagram.com/korauto.ks" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hover:text-gray-300 transition-colors touch-target-large"
                >
                  <Instagram className="h-6 w-6" />
                </a>
                <a 
                  href="https://wa.me/38348181116" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-green-400 hover:text-green-300 transition-colors text-sm sm:text-base font-medium touch-target-large"
                >
                  WhatsApp
                </a>
                <a 
                  href="viber://chat?number=+38348181116" 
                  className="text-purple-400 hover:text-purple-300 transition-colors text-sm sm:text-base font-medium touch-target-large"
                >
                  Viber
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-white/20 mt-8 pt-6 text-center">
          <p className="text-responsive-xs opacity-75 leading-relaxed">
            © 2024 KORAUTO. Të gjitha të drejtat e rezervuara. Shërbime profesionale inspektimi makinash.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;