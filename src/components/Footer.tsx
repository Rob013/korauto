import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Facebook, Twitter, Instagram, Youtube, Mail, Phone, MapPin } from "lucide-react";
import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="bg-gradient-to-br from-primary to-primary/90 text-primary-foreground py-12 relative overflow-hidden">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-0 left-0 w-full h-full" 
             style={{
               backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='white' fill-opacity='1'%3E%3Cpath d='M20 20c0-5.5-4.5-10-10-10s-10 4.5-10 10 4.5 10 10 10 10-4.5 10-10zm10 0c0-5.5-4.5-10-10-10s-10 4.5-10 10 4.5 10 10 10 10-4.5 10-10z'/%3E%3C/g%3E%3C/svg%3E")`,
               backgroundSize: '40px 40px'
             }}>
        </div>
      </div>

      <div className="container-responsive relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
          {/* Company Info */}
          <div className="space-y-4">
            <div className="flex items-center space-x-3 mb-4">
              <img 
                src="/lovable-uploads/d1ff645d-f293-44ab-b806-ae5eb2483633.png" 
                alt="KORAUTO Logo" 
                className="h-8 w-auto object-contain invert brightness-0 contrast-100"
              />
              <h3 className="text-2xl font-bold">KORAUTO</h3>
            </div>
            <p className="text-sm opacity-90 leading-relaxed">
              Partneri juaj i besuar për makina të cilësisë së lartë me shërbime profesionale inspektimi në të gjithë Evropën.
            </p>
            <div className="flex space-x-4 pt-4">
              <a 
                href="#" 
                className="p-2 rounded-full bg-primary-foreground/10 hover:bg-primary-foreground/20 transition-all duration-300 hover:scale-110"
                aria-label="Facebook"
              >
                <Facebook className="w-5 h-5" />
              </a>
              <a 
                href="#" 
                className="p-2 rounded-full bg-primary-foreground/10 hover:bg-primary-foreground/20 transition-all duration-300 hover:scale-110"
                aria-label="Instagram"
              >
                <Instagram className="w-5 h-5" />
              </a>
              <a 
                href="#" 
                className="p-2 rounded-full bg-primary-foreground/10 hover:bg-primary-foreground/20 transition-all duration-300 hover:scale-110"
                aria-label="Youtube"
              >
                <Youtube className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold border-b border-primary-foreground/20 pb-2">Lidhje të Shpejta</h4>
            <div className="space-y-3 text-sm">
              <Link 
                to="/" 
                className="block hover:text-primary-foreground/80 transition-colors duration-200 hover:translate-x-1 transform"
              >
                Kryefaqja
              </Link>
              <Link 
                to="/catalog" 
                className="block hover:text-primary-foreground/80 transition-colors duration-200 hover:translate-x-1 transform"
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
                className="block hover:text-primary-foreground/80 transition-colors duration-200 hover:translate-x-1 transform text-left focus:outline-none focus:ring-2 focus:ring-primary-foreground/50 rounded"
              >
                Kontakti
              </button>
              <Link 
                to="/inspections" 
                className="block hover:text-primary-foreground/80 transition-colors duration-200 hover:translate-x-1 transform"
              >
                Shërbimet e Inspektimit
              </Link>
            </div>
          </div>

          {/* Contact Info */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold border-b border-primary-foreground/20 pb-2">Informacioni i Kontaktit</h4>
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-3 group">
                <div className="p-2 rounded-full bg-primary-foreground/10 group-hover:bg-primary-foreground/20 transition-all duration-300">
                  <Phone className="h-4 w-4" />
                </div>
                <a 
                  href="tel:+38348181116" 
                  className="hover:text-primary-foreground/80 transition-colors duration-200"
                >
                  +38348181116
                </a>
              </div>
              <div className="flex items-center gap-3 group">
                <div className="p-2 rounded-full bg-primary-foreground/10 group-hover:bg-primary-foreground/20 transition-all duration-300">
                  <Mail className="h-4 w-4" />
                </div>
                <a 
                  href="mailto:INFO.RGSHPK@gmail.com" 
                  className="hover:text-primary-foreground/80 transition-colors duration-200"
                >
                  INFO.RGSHPK@gmail.com
                </a>
              </div>
              <div className="flex items-center gap-3 group">
                <div className="p-2 rounded-full bg-primary-foreground/10 group-hover:bg-primary-foreground/20 transition-all duration-300">
                  <MapPin className="h-4 w-4" />
                </div>
                <span className="text-primary-foreground/90">
                  Kosovë, Evropë
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-primary-foreground/20 mt-12 pt-8 text-center">
          <p className="text-sm opacity-75">
            © 2024 KORAUTO. Të gjitha të drejtat e rezervuara. | Shërbime profesionale importi dhe inspektimi të automjeteve.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;