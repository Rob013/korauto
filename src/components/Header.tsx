import { Button } from "@/components/ui/button";
import { Car, MapPin, Phone, Mail, Menu } from "lucide-react";
import { useState } from "react";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="bg-card shadow-sm border-b border-border sticky top-0 z-50">
      {/* Top Contact Bar */}
      <div className="bg-primary text-primary-foreground py-2">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap items-center justify-between text-sm">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <Phone className="h-3 w-3" />
                <span>+38348181116</span>
              </div>
              <div className="flex items-center gap-1">
                <Mail className="h-3 w-3" />
                <span>robert_gashi@live.com</span>
              </div>
              <div className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                <span>RR.ilaz kodra 70</span>
              </div>
            </div>
            <div className="hidden md:block">
              <a 
                href="https://www.google.com/maps/search/korauto" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary-foreground hover:underline text-sm"
              >
                Find us on Google Maps
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Car className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-2xl font-bold text-foreground">KORAUTO</h1>
              <p className="text-xs text-muted-foreground">Professional Car Inspection Service</p>
            </div>
          </div>
          
          <nav className="hidden md:flex items-center space-x-8">
            <a href="#home" className="text-foreground hover:text-primary transition-colors">
              Home
            </a>
            <a href="#cars" className="text-foreground hover:text-primary transition-colors">
              Cars
            </a>
            <a href="#inspection" className="text-foreground hover:text-primary transition-colors">
              Inspection
            </a>
            <a href="#contact" className="text-foreground hover:text-primary transition-colors">
              Contact
            </a>
          </nav>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" asChild>
              <a href="tel:+38348181116">
                <Phone className="h-4 w-4 mr-1" />
                Call ROBERT
              </a>
            </Button>
            <Button size="sm" asChild>
              <a href="#cars">
                Browse Cars
              </a>
            </Button>
            
            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              <Menu className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden mt-4 pb-4 border-t border-border">
            <nav className="flex flex-col space-y-4 pt-4">
              <a href="#home" className="text-foreground hover:text-primary transition-colors">
                Home
              </a>
              <a href="#cars" className="text-foreground hover:text-primary transition-colors">
                Cars
              </a>
              <a href="#inspection" className="text-foreground hover:text-primary transition-colors">
                Inspection
              </a>
              <a href="#contact" className="text-foreground hover:text-primary transition-colors">
                Contact
              </a>
              <Button variant="outline" size="sm" asChild className="self-start">
                <a href="tel:+38348181116">
                  <Phone className="h-4 w-4 mr-1" />
                  Call ROBERT
                </a>
              </Button>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;