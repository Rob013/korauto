import { Button } from "@/components/ui/button";
import { Car, Heart, Menu, X } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";

const Header = () => {
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <header className="bg-background/95 backdrop-blur-sm shadow-sm border-b border-border sticky top-0 z-50">
      {/* Main header */}
      <div className="container-responsive py-3">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center space-x-3 flex-shrink-0">
            <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 bg-primary rounded-lg flex items-center justify-center overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300">
              <img 
                src="/lovable-uploads/3094fd63-7a92-4497-8103-e166b6b09f70.png" 
                alt="KORAUTO Logo" 
                className="w-full h-full object-contain"
              />
            </div>
            <div className="min-w-0">
              <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-primary">KORAUTO</h1>
              <p className="text-xs md:text-sm text-muted-foreground whitespace-nowrap hidden sm:block">Ekspertë të Inspektimit të Makinave</p>
            </div>
          </div>
          
          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center justify-center space-x-8">
            <Link to="/" className="text-foreground hover:text-primary font-medium transition-all duration-200 hover:scale-105 focus-enhanced relative group">
              Kryefaqja
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full"></span>
            </Link>
            <Link to="/catalog" className="text-foreground hover:text-primary font-medium transition-all duration-200 hover:scale-105 focus-enhanced relative group">
              Katalogu
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full"></span>
            </Link>
            <Link to="/inspections" className="text-foreground hover:text-primary font-medium transition-all duration-200 hover:scale-105 focus-enhanced relative group">
              Inspektimet
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full"></span>
            </Link>
            <button 
              onClick={() => {
                navigate('/');
                setTimeout(() => {
                  document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' });
                }, 100);
              }}
              className="text-foreground hover:text-primary font-medium transition-all duration-200 hover:scale-105 bg-transparent border-none cursor-pointer focus-enhanced relative group"
            >
              Kontakti
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full"></span>
            </button>
            <Link to="/favorites" className="flex items-center gap-2 text-foreground hover:text-primary font-medium transition-all duration-200 hover:scale-105 focus-enhanced relative group">
              <Heart className="h-4 w-4" />
              <span className="hidden xl:inline">Të Preferuarat</span>
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full"></span>
            </Link>
          </nav>
          
          {/* Right side actions */}
          <div className="flex items-center space-x-2 sm:space-x-4">
            <ThemeToggle />
            
            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden focus-enhanced"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
            
            {/* Desktop Auth Buttons */}
            <div className="hidden lg:flex items-center space-x-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => navigate('/auth')}
                className="btn-enhanced focus-enhanced"
              >
                Hyr
              </Button>
              <Button 
                size="sm" 
                onClick={() => navigate('/admin')}
                className="btn-enhanced focus-enhanced"
              >
                Admin
              </Button>
            </div>
          </div>

        </div>
      </div>

      {/* Mobile Navigation */}
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
              <Link 
                to="/inspections" 
                className="text-foreground hover:text-primary font-medium transition-colors py-2 px-3 rounded-md hover:bg-primary/10"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Inspektimet
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