import { Button } from "@/components/ui/button";
import { Search, User, Menu } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState } from "react";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full bg-primary text-primary-foreground shadow-md">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold text-white">
              KORAUTO
            </h1>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <a href="#home" className="text-sm font-medium transition-colors hover:text-gray-300">
              Home
            </a>
            <a href="#cars" className="text-sm font-medium transition-colors hover:text-gray-300">
              Cars
            </a>
            <a href="#inspection" className="text-sm font-medium transition-colors hover:text-gray-300">
              Inspection
            </a>
            <a href="#contact" className="text-sm font-medium transition-colors hover:text-gray-300">
              Contact
            </a>
          </nav>

          {/* Search Bar */}
          <div className="hidden lg:flex items-center space-x-2 flex-1 max-w-md mx-8">
            <div className="relative w-full">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search cars by make, model..."
                className="pl-8 bg-white/10 border-white/20 text-white placeholder:text-gray-400"
              />
            </div>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden text-white hover:bg-white/10"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              <Menu className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-white/20 bg-primary">
            <nav className="flex flex-col space-y-4 p-4">
              <a href="#home" className="text-sm font-medium transition-colors hover:text-gray-300 text-white">
                Home
              </a>
              <a href="#cars" className="text-sm font-medium transition-colors hover:text-gray-300 text-white">
                Cars
              </a>
              <a href="#inspection" className="text-sm font-medium transition-colors hover:text-gray-300 text-white">
                Inspection
              </a>
              <a href="#contact" className="text-sm font-medium transition-colors hover:text-gray-300 text-white">
                Contact
              </a>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;