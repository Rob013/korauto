import { Button } from "@/components/ui/button";
import { Car } from "lucide-react";

const Header = () => {
  return (
    <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      {/* Top bar */}
      <div className="bg-primary text-white py-1">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-4">
              <span>Shërbim profesional i importit të makinave</span>
              <span>•</span>
              <span>Kontakt: +38348181116</span>
            </div>
            <div className="hidden md:block">
              <span>robert_gashi@live.com</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main header */}
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gray-900 rounded-lg flex items-center justify-center overflow-hidden">
              <img 
                src="/lovable-uploads/3094fd63-7a92-4497-8103-e166b6b09f70.png" 
                alt="KORAUTO Logo" 
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <h1 className="text-xl font-bold text-primary">KORAUTO</h1>
              <p className="text-xs text-gray-600">Ekspertë të Inspektimit të Makinave</p>
            </div>
          </div>
          
          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <a href="/" className="text-gray-700 hover:text-primary font-medium transition-colors">
              Kryefaqja
            </a>
            <a href="/catalog" className="text-gray-700 hover:text-primary font-medium transition-colors">
              Katalogu
            </a>
            <a href="/#inspection" className="text-gray-700 hover:text-primary font-medium transition-colors">
              Shërbimi i Inspektimit
            </a>
            <a href="/#contact" className="text-gray-700 hover:text-primary font-medium transition-colors">
              Kontakti
            </a>
          </nav>

          {/* CTA Buttons */}
          <div className="flex items-center gap-3">
            <Button 
              variant="outline" 
              size="sm" 
              className="hidden md:flex border-primary text-primary hover:bg-primary hover:text-white"
              onClick={() => {
                const message = "Përshëndetje! Dëshiroj informacion për shërbimet tuaja të inspektimit të makinave.";
                const whatsappUrl = `https://wa.me/38348181116?text=${encodeURIComponent(message)}`;
                window.open(whatsappUrl, '_blank');
              }}
              aria-label="Kontaktoni nëpërmjet WhatsApp për informacion rreth shërbimeve"
            >
              Na Kontaktoni
            </Button>
            <Button 
              size="sm" 
              className="bg-primary hover:bg-primary/90"
              onClick={() => document.getElementById('cars')?.scrollIntoView({ behavior: 'smooth' })}
              aria-label="Shikoni listën e makinave të disponueshme"
            >
              Shiko Makinat
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;