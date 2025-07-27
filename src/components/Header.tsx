import { Button } from "@/components/ui/button";
import { Car } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";

const Header = () => {
  return (
    <header className="bg-background shadow-sm border-b border-border sticky top-0 z-50">
      {/* Top bar */}
      <div className="bg-primary text-primary-foreground py-1">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-4">
              <span>Shërbim profesional i importit të makinave</span>
              <span>•</span>
              <span>Kontakt: +38348181116</span>
            </div>
            <div className="hidden md:block">
              <a href="mailto:INFO.RGSHPK@gmail.com" className="hover:opacity-80 transition-opacity">
                INFO.RGSHPK@gmail.com
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Main header */}
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center overflow-hidden">
              <img 
                src="/lovable-uploads/3094fd63-7a92-4497-8103-e166b6b09f70.png" 
                alt="KORAUTO Logo" 
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <h1 className="text-xl font-bold text-primary">KORAUTO</h1>
              <p className="text-xs text-muted-foreground">Ekspertë të Inspektimit të Makinave</p>
            </div>
          </div>
          
          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <a href="/" className="text-foreground hover:text-primary font-medium transition-colors">
              Kryefaqja
            </a>
            <a href="/catalog" className="text-foreground hover:text-primary font-medium transition-colors">
              Katalogu
            </a>
            <a href="/#inspection" className="text-foreground hover:text-primary font-medium transition-colors">
              Shërbimi i Inspektimit
            </a>
            <a href="/#contact" className="text-foreground hover:text-primary font-medium transition-colors">
              Kontakti
            </a>
          </nav>

          {/* CTA Buttons */}
          <div className="flex items-center gap-3">
            <ThemeToggle />
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