import { Button } from "@/components/ui/button";
import { Search, User, Menu } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState } from "react";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              AutoElite
            </h1>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <a href="#" className="text-sm font-medium transition-colors hover:text-accent">
              Live Auctions
            </a>
            <a href="#" className="text-sm font-medium transition-colors hover:text-accent">
              Browse Cars
            </a>
            <a href="#" className="text-sm font-medium transition-colors hover:text-accent">
              Sell Your Car
            </a>
            <a href="#" className="text-sm font-medium transition-colors hover:text-accent">
              Inspection Service
            </a>
            <a href="#" className="text-sm font-medium transition-colors hover:text-accent">
              About
            </a>
          </nav>

          {/* Search Bar */}
          <div className="hidden lg:flex items-center space-x-2 flex-1 max-w-md mx-8">
            <div className="relative w-full">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search cars by make, model..."
                className="pl-8"
              />
            </div>
          </div>

          {/* User Actions */}
          <div className="flex items-center space-x-4">
            <Button variant="outline" size="sm" className="hidden sm:flex">
              <User className="h-4 w-4 mr-2" />
              Sign In
            </Button>
            <Button size="sm" className="hidden sm:flex">
              Register
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
          <div className="md:hidden border-t bg-background/95 backdrop-blur">
            <nav className="flex flex-col space-y-4 p-4">
              <a href="#" className="text-sm font-medium transition-colors hover:text-accent">
                Live Auctions
              </a>
              <a href="#" className="text-sm font-medium transition-colors hover:text-accent">
                Browse Cars
              </a>
              <a href="#" className="text-sm font-medium transition-colors hover:text-accent">
                Sell Your Car
              </a>
              <a href="#" className="text-sm font-medium transition-colors hover:text-accent">
                Inspection Service
              </a>
              <a href="#" className="text-sm font-medium transition-colors hover:text-accent">
                About
              </a>
              <div className="pt-4 border-t">
                <Button variant="outline" size="sm" className="w-full mb-2">
                  <User className="h-4 w-4 mr-2" />
                  Sign In
                </Button>
                <Button size="sm" className="w-full">
                  Register
                </Button>
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;