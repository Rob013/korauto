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
              <span>Professional Car Inspection Service</span>
              <span>•</span>
              <span>Contact: +38348181116</span>
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
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <Car className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-primary">KORAUTO</h1>
              <p className="text-xs text-gray-600">Car Inspection Experts</p>
            </div>
          </div>
          
          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <a href="#home" className="text-gray-700 hover:text-primary font-medium transition-colors">
              Home
            </a>
            <a href="#cars" className="text-gray-700 hover:text-primary font-medium transition-colors">
              Used Cars
            </a>
            <a href="#inspection" className="text-gray-700 hover:text-primary font-medium transition-colors">
              Inspection Service
            </a>
            <a href="#contact" className="text-gray-700 hover:text-primary font-medium transition-colors">
              Contact
            </a>
          </nav>

          {/* CTA Buttons */}
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" className="hidden md:flex border-primary text-primary hover:bg-primary hover:text-white">
              Get Quote
            </Button>
            <Button size="sm" className="bg-primary hover:bg-primary/90">
              View Cars
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;