import { Button } from "@/components/ui/button";
import { Car, Heart, Menu, X } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";

const Header = () => {
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <header className="bg-background shadow-sm border-b border-border sticky top-0 z-50">
      {/* Main header */}
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center space-x-3 flex-shrink-0">
            <div className="w-12 h-12 md:w-16 md:h-16 bg-primary rounded-lg flex items-center justify-center overflow-hidden">
              <img 
                src="/lovable-uploads/3094fd63-7a92-4497-8103-e166b6b09f70.png" 
                alt="KORAUTO Logo" 
                className="w-full h-full object-contain"
              />
            </div>
            <div className="min-w-0">
              <h1 className="text-xl md:text-2xl font-bold text-primary">KORAUTO</h1>
              <p className="text-xs md:text-sm text-muted-foreground whitespace-nowrap hidden sm:block">Ekspertë të Inspektimit të Makinave</p>
            </div>
          </div>
          
          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center justify-center space-x-8">
            <Link to="/" className="text-foreground hover:text-primary font-medium transition-colors">
              Kryefaqja
            </Link>
            <Link to="/catalog" className="text-foreground hover:text-primary font-medium transition-colors">
              Katalogu
            </Link>
            <button 
              onClick={() => {
                navigate('/');
                setTimeout(() => {
                  document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' });
                }, 100);
              }}
              className="text-foreground hover:text-primary font-medium transition-colors bg-transparent border-none cursor-pointer"
            >
              Kontakti
            </button>
            <Link to="/favorites" className="flex items-center gap-2 text-foreground hover:text-primary font-medium transition-colors">
              <Heart className="h-4 w-4" />
              Favorites
            </Link>
            <Link to="/auth" className="text-foreground hover:text-primary font-medium transition-colors">
              My Account
            </Link>
          </nav>

          {/* Desktop CTA Buttons */}
          <div className="hidden md:flex items-center gap-3">
            <ThemeToggle />
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-foreground hover:text-primary hover:bg-primary/10 transition-all duration-200 rounded-full px-4"
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
              className="bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary text-white shadow-lg hover:shadow-xl transition-all duration-300 rounded-full px-6 hover:scale-105"
              onClick={() => document.getElementById('cars')?.scrollIntoView({ behavior: 'smooth' })}
              aria-label="Shikoni listën e makinave të disponueshme"
            >
              Shiko Makinat
            </Button>
          </div>

          {/* Mobile menu button and theme toggle */}
          <div className="flex items-center gap-2 md:hidden">
            <ThemeToggle />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2"
              aria-label="Toggle mobile menu"
            >
              {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      {isMobileMenuOpen && (
        <div className="lg:hidden bg-background border-t border-border shadow-lg">
          <div className="container mx-auto px-4 py-4">
            <nav className="flex flex-col space-y-4">
              <Link 
                to="/" 
                className="text-foreground hover:text-primary font-medium transition-colors py-2 px-3 rounded-md hover:bg-primary/10"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Kryefaqja
              </Link>
              <Link 
                to="/catalog" 
                className="text-foreground hover:text-primary font-medium transition-colors py-2 px-3 rounded-md hover:bg-primary/10"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Katalogu
              </Link>
              <button 
                onClick={() => {
                  navigate('/');
                  setIsMobileMenuOpen(false);
                  setTimeout(() => {
                    document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' });
                  }, 100);
                }}
                className="text-left text-foreground hover:text-primary font-medium transition-colors py-2 px-3 rounded-md hover:bg-primary/10 bg-transparent border-none cursor-pointer"
              >
                Kontakti
              </button>
              <Link 
                to="/favorites" 
                className="flex items-center gap-2 text-foreground hover:text-primary font-medium transition-colors py-2 px-3 rounded-md hover:bg-primary/10"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <Heart className="h-4 w-4" />
                Favorites
              </Link>
              <Link 
                to="/auth" 
                className="text-foreground hover:text-primary font-medium transition-colors py-2 px-3 rounded-md hover:bg-primary/10"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                My Account
              </Link>
              
              {/* Mobile CTA Buttons */}
              <div className="flex flex-col gap-3 pt-4 border-t border-border">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full text-foreground hover:text-primary hover:bg-primary/10 transition-all duration-200"
                  onClick={() => {
                    const message = "Përshëndetje! Dëshiroj informacion për shërbimet tuaja të inspektimit të makinave.";
                    const whatsappUrl = `https://wa.me/38348181116?text=${encodeURIComponent(message)}`;
                    window.open(whatsappUrl, '_blank');
                    setIsMobileMenuOpen(false);
                  }}
                  aria-label="Kontaktoni nëpërmjet WhatsApp për informacion rreth shërbimeve"
                >
                  Na Kontaktoni
                </Button>
                <Button 
                  size="sm" 
                  className="w-full bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary text-white shadow-lg hover:shadow-xl transition-all duration-300"
                  onClick={() => {
                    document.getElementById('cars')?.scrollIntoView({ behavior: 'smooth' });
                    setIsMobileMenuOpen(false);
                  }}
                  aria-label="Shikoni listën e makinave të disponueshme"
                >
                  Shiko Makinat
                </Button>
              </div>
            </nav>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;