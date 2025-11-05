import { Button } from "@/components/ui/button";
import { Car, Heart, Menu, X, User, Ship } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

const Header = () => {
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<any>(null);

  // Check authentication state
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };

    checkAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleAuthClick = () => {
    if (user) {
      navigate('/account');
    } else {
      navigate('/auth');
    }
  };

  return (
    <header className="bg-background/80 backdrop-blur-xl shadow-[var(--shadow-sm)] border-b border-border/50 sticky top-0 z-50 transition-all duration-300 hover:shadow-[var(--shadow-md)]">
      {/* Main header with proper navigation landmark */}
      <nav className="container-responsive" role="navigation" aria-label="Main navigation">
        <div className="flex h-14 sm:h-16 items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2 group min-w-0 focus:outline-none focus:ring-2 focus:ring-primary rounded-lg" aria-label="KORAUTO kryefaqja">
            <div 
              className="rounded-lg flex items-center justify-center group-hover:scale-105 transition-transform duration-300 flex-shrink-0 hover-lift-gentle"
              aria-label="KORAUTO company logo"
            >
              <img 
                src="/lovable-uploads/d1ff645d-f293-44ab-b806-ae5eb2483633.png" 
                alt="KORAUTO Logo - Makina nga Koreja e Jugut" 
                className="h-20 w-auto object-contain dark:invert dark:brightness-0 dark:contrast-100 transition-all duration-300"
              />
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-6">{/* Removed duplicate nav wrapper */}
            <Link 
              to="/" 
              className="text-foreground hover:text-primary font-medium transition-all duration-300 hover-scale-gentle focus:outline-none focus:ring-2 focus:ring-primary rounded-md px-2 py-1"
              aria-label="Shkoni në kryefaqe"
            >
              Kryefaqja
            </Link>
            <Link 
              to="/catalog" 
              className="text-foreground hover:text-primary font-medium transition-all duration-300 hover-scale-gentle focus:outline-none focus:ring-2 focus:ring-primary rounded-md px-2 py-1"
              aria-label="Shikoni katalogun e makinave"
            >
              Katalogu
            </Link>
            <Link 
              to="/inspections" 
              className="text-foreground hover:text-primary font-medium transition-all duration-300 hover-scale-gentle focus:outline-none focus:ring-2 focus:ring-primary rounded-md px-2 py-1"
              aria-label="Mësoni më shumë për inspektimet"
            >
              Inspektimet
            </Link>
            <Link 
              to="/contacts" 
              className="text-foreground hover:text-primary font-medium transition-all duration-300 hover-scale-gentle focus:outline-none focus:ring-2 focus:ring-primary rounded-md px-2 py-1"
              aria-label="Na kontaktoni"
            >
              Kontaktet
            </Link>
            {user && (
              <Link 
                to="/tracking" 
                className="text-foreground hover:text-primary font-medium transition-all duration-300 hover-scale-gentle flex items-center gap-1 focus:outline-none focus:ring-2 focus:ring-primary rounded-md px-2 py-1"
                aria-label="Gjurmoni ngarkesën tuaj"
              >
                <Ship className="h-4 w-4" />
                Gjurmimi
              </Link>
            )}
            <Link 
              to="/favorites" 
              className="text-foreground hover:text-primary font-medium transition-all duration-300 hover-scale-gentle flex items-center gap-1 focus:outline-none focus:ring-2 focus:ring-primary rounded-md px-2 py-1"
              aria-label="Shikoni makinat tuaja të preferuara"
            >
              <Heart className="h-4 w-4" />
              Të Preferuarat
            </Link>
          </div>

          {/* Right side actions */}
          <div className="flex items-center space-x-1 sm:space-x-2">
            <ThemeToggle />
            
            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden focus-enhanced p-2 hover-scale-gentle"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label={isMobileMenuOpen ? "Mbyll menunë" : "Hap menunë"}
              aria-expanded={isMobileMenuOpen}
              aria-controls="mobile-menu"
            >
              {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
            
            {/* Desktop Auth Buttons */}
            <div className="hidden lg:flex items-center space-x-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleAuthClick}
                className="btn-enhanced focus-enhanced flex items-center gap-2 hover-lift-gentle transition-all duration-300"
                aria-label={user ? 'Shkoni në llogarinë tuaj' : 'Hyni në llogari'}
              >
                <User className="h-4 w-4" />
                {user ? 'Llogaria Ime' : 'Llogaria Ime'}
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Navigation */}
      {isMobileMenuOpen && (
        <div 
          className="lg:hidden bg-background border-t border-border shadow-lg animate-slide-in-left"
          id="mobile-menu"
          role="navigation" 
          aria-label="Navigimi mobil"
        >
          <div className="container-responsive py-4">
            <nav className="flex flex-col space-y-4 stagger-animation">
              <Link 
                to="/" 
                className="text-foreground hover:text-primary font-medium transition-all duration-300 py-2 px-3 rounded-md hover:bg-primary/10 hover-lift-gentle focus:outline-none focus:ring-2 focus:ring-primary"
                onClick={() => setIsMobileMenuOpen(false)}
                aria-label="Shkoni në kryefaqe"
              >
                Kryefaqja
              </Link>
              <Link 
                to="/catalog" 
                className="text-foreground hover:text-primary font-medium transition-all duration-300 py-2 px-3 rounded-md hover:bg-primary/10 hover-lift-gentle focus:outline-none focus:ring-2 focus:ring-primary"
                onClick={() => setIsMobileMenuOpen(false)}
                aria-label="Shikoni katalogun e makinave"
              >
                Katalogu
              </Link>
              <Link 
                to="/inspections" 
                className="text-foreground hover:text-primary font-medium transition-all duration-300 py-2 px-3 rounded-md hover:bg-primary/10 hover-lift-gentle focus:outline-none focus:ring-2 focus:ring-primary"
                onClick={() => setIsMobileMenuOpen(false)}
                aria-label="Mësoni më shumë për inspektimet"
              >
                Inspektimet
              </Link>
              <Link 
                to="/contacts" 
                className="text-foreground hover:text-primary font-medium transition-all duration-300 py-2 px-3 rounded-md hover:bg-primary/10 hover-lift-gentle focus:outline-none focus:ring-2 focus:ring-primary"
                onClick={() => setIsMobileMenuOpen(false)}
                aria-label="Na kontaktoni"
              >
                Kontaktet
              </Link>

              {user && (
                <Link 
                  to="/tracking" 
                  className="flex items-center gap-2 text-foreground hover:text-primary font-medium transition-all duration-300 py-2 px-3 rounded-md hover:bg-primary/10 hover-lift-gentle focus:outline-none focus:ring-2 focus:ring-primary"
                  onClick={() => setIsMobileMenuOpen(false)}
                  aria-label="Gjurmoni ngarkesën tuaj"
                >
                  <Ship className="h-4 w-4" />
                  Gjurmimi
                </Link>
              )}

              <Link 
                to="/favorites" 
                className="flex items-center gap-2 text-foreground hover:text-primary font-medium transition-all duration-300 py-2 px-3 rounded-md hover:bg-primary/10 hover-lift-gentle focus:outline-none focus:ring-2 focus:ring-primary"
                onClick={() => setIsMobileMenuOpen(false)}
                aria-label="Shikoni makinat tuaja të preferuara"
              >
                <Heart className="h-4 w-4" />
                Të Preferuarat
              </Link>
              <button 
                className="flex items-center gap-2 text-foreground hover:text-primary font-medium transition-all duration-300 py-2 px-3 rounded-md hover:bg-primary/10 w-full text-left hover-lift-gentle focus:outline-none focus:ring-2 focus:ring-primary"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  handleAuthClick();
                }}
                aria-label={user ? 'Shkoni në llogarinë tuaj' : 'Hyni në llogari'}
              >
                <User className="h-4 w-4" />
                {user ? 'Llogaria Ime' : 'Llogaria Ime'}
              </button>
              
              {/* Mobile CTA Buttons */}
              <div className="flex flex-col gap-3 pt-4 border-t border-border">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full btn-enhanced text-foreground hover:text-primary hover:bg-primary/10 transition-all duration-300 hover-lift-gentle"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    navigate("/catalog");
                  }}
                  aria-label="Shikoni katalogun e makinave"
                >
                  Shiko Makinat
                </Button>
                <Button 
                  size="sm" 
                  className="w-full btn-enhanced bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-200"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    window.open('https://wa.me/38348181116', '_blank');
                  }}
                >
                  Kontakto WhatsApp
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