import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Facebook, Twitter, Instagram, Youtube, Mail, Phone, MapPin } from "lucide-react";

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
              <a href="#home" className="block hover:text-gray-300 transition-colors">Kryefaqja</a>
              <a href="#cars" className="block hover:text-gray-300 transition-colors">Makinat</a>
              <a href="#inspection" className="block hover:text-gray-300 transition-colors">Inspektimi</a>
              <a href="#contact" className="block hover:text-gray-300 transition-colors">Kontakti</a>
            </div>
          </div>

          {/* Contact Info */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold">Informacioni i Kontaktit</h4>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                +49 123 456 789
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                info@korauto.com
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Munich, Germany
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