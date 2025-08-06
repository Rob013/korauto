import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Facebook, Twitter, Instagram, Youtube, Mail, Phone, MapPin } from "lucide-react";
import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="bg-gradient-to-b from-background to-muted/20 dark:from-background dark:to-slate-950 border-t border-border py-12 relative overflow-hidden">
      {/* Modern background pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-0 left-0 w-full h-full" 
             style={{
               backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
               backgroundSize: '60px 60px'
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
                className="h-8 w-auto object-contain dark:invert brightness-100 contrast-100 transition-all duration-300"
              />
              <h3 className="text-2xl font-bold text-foreground">KORAUTO</h3>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Partneri juaj i besuar për makina të cilësisë së lartë me shërbime profesionale inspektimi në të gjithë South Korea.
            </p>
            <div className="flex space-x-4 pt-4">
              <a 
                href="#" 
                className="p-2 rounded-full bg-muted hover:bg-muted/80 hover:text-primary transition-all duration-300 hover:scale-110"
                aria-label="Facebook"
              >
                <Facebook className="w-5 h-5" />
              </a>
              <a 
                href="#" 
                className="p-2 rounded-full bg-muted hover:bg-muted/80 hover:text-primary transition-all duration-300 hover:scale-110"
                aria-label="Instagram"
              >
                <Instagram className="w-5 h-5" />
              </a>
              <a 
                href="#" 
                className="p-2 rounded-full bg-muted hover:bg-muted/80 hover:text-primary transition-all duration-300 hover:scale-110"
                aria-label="Youtube"
              >
                <Youtube className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-foreground border-b border-border/50 pb-2">Lidhje të Shpejta</h4>
            <div className="space-y-3 text-sm">
              <Link 
                to="/" 
                className="block text-muted-foreground hover:text-foreground transition-colors duration-200 hover:translate-x-1 transform"
              >
                Kryefaqja
              </Link>
              <Link 
                to="/catalog" 
                className="block text-muted-foreground hover:text-foreground transition-colors duration-200 hover:translate-x-1 transform"
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
                className="block text-muted-foreground hover:text-foreground transition-colors duration-200 hover:translate-x-1 transform text-left focus:outline-none focus:ring-2 focus:ring-primary/50 rounded"
              >
                Kontakti
              </button>
              <Link 
                to="/inspections" 
                className="block text-muted-foreground hover:text-foreground transition-colors duration-200 hover:translate-x-1 transform"
              >
                Shërbimet e Inspektimit
              </Link>
            </div>
          </div>

          {/* Contact Info */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-foreground border-b border-border/50 pb-2">Informacioni i Kontaktit</h4>
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-3 group">
                <div className="p-2 rounded-full bg-muted group-hover:bg-muted/80 group-hover:text-primary transition-all duration-300">
                  <Phone className="h-4 w-4" />
                </div>
                <a 
                  href="tel:+38348181116" 
                  className="text-muted-foreground hover:text-foreground transition-colors duration-200"
                >
                  +38348181116
                </a>
              </div>
              <div className="flex items-center gap-3 group">
                <div className="p-2 rounded-full bg-muted group-hover:bg-muted/80 group-hover:text-primary transition-all duration-300">
                  <Mail className="h-4 w-4" />
                </div>
                <a 
                  href="mailto:INFO.RGSHPK@gmail.com" 
                  className="text-muted-foreground hover:text-foreground transition-colors duration-200"
                >
                  INFO.RGSHPK@gmail.com
                </a>
              </div>
              <div className="flex items-center gap-3 group">
                <div className="p-2 rounded-full bg-muted group-hover:bg-muted/80 group-hover:text-primary transition-all duration-300">
                  <MapPin className="h-4 w-4" />
                </div>
                <span className="text-muted-foreground">
                  Kosovë, South Korea
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-border/50 mt-12 pt-8 text-center">
          <p className="text-sm text-muted-foreground">
            © 2024 KORAUTO. Të gjitha të drejtat e rezervuara. | Shërbime profesionale importi dhe inspektimi të automjeteve.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;