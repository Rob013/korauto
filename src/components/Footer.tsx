import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Facebook, Twitter, Instagram, Youtube, Mail, Phone, MapPin } from "lucide-react";
import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="bg-primary text-primary-foreground py-8">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Company Info */}
          <div className="space-y-4">
            <h3 className="text-2xl font-bold">KORAUTO</h3>
            <p className="text-sm opacity-90">
              Partneri juaj i besuar për makina të cilësisë së lartë me shërbime profesionale inspektimi në të gjithë Evropën.
            </p>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold">Lidhje të Shpejta</h4>
            <div className="space-y-2 text-sm">
              <Link to="/" className="block hover:text-gray-300 transition-colors">Kryefaqja</Link>
              <Link to="/catalog" className="block hover:text-gray-300 transition-colors">Katalogu</Link>
              <button 
                onClick={() => {
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                  setTimeout(() => {
                    document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' });
                  }, 500);
                }}
                className="block hover:text-gray-300 transition-colors text-left bg-transparent border-none cursor-pointer p-0"
              >
                Kontakti
              </button>
            </div>
          </div>

          {/* Contact Info */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold">Informacioni i Kontaktit</h4>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                <a href="tel:+38348181116" className="hover:text-gray-300 transition-colors">
                  +38348181116
                </a>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                <a href="mailto:INFO.RGSHPK@gmail.com" className="hover:text-gray-300 transition-colors">
                  INFO.RGSHPK@gmail.com
                </a>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                <a 
                  href="https://maps.google.com/?q=Rr.Ilaz+Kodra+70+Prishtine+Kosovo+KORAUTO" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hover:text-gray-300 transition-colors"
                >
                  Rr. Ilaz Kodra 70, Prishtinë
                </a>
              </div>
              
              {/* Social Media Links */}
              <div className="flex items-center gap-4 mt-4">
                <a 
                  href="https://www.facebook.com/korauto.ks" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hover:text-gray-300 transition-colors"
                >
                  <Facebook className="h-5 w-5" />
                </a>
                <a 
                  href="https://www.instagram.com/korauto.ks" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hover:text-gray-300 transition-colors"
                >
                  <Instagram className="h-5 w-5" />
                </a>
                <a 
                  href="https://wa.me/38348181116" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-green-400 hover:text-green-300 transition-colors"
                >
                  WhatsApp
                </a>
                <a 
                  href="viber://chat?number=+38348181116" 
                  className="text-purple-400 hover:text-purple-300 transition-colors"
                >
                  Viber
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-white/20 mt-8 pt-8 text-center">
          <p className="text-sm opacity-75">
            © 2024 KORAUTO. Të gjitha të drejtat e rezervuara. Shërbime profesionale inspektimi makinash.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;