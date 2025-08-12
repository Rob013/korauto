import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Facebook, Twitter, Instagram, Youtube, Mail, Phone, MapPin, Car, Shield, Award } from "lucide-react";
import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-white">
      {/* Main Footer Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <img 
                src="/lovable-uploads/d1ff645d-f293-44ab-b806-ae5eb2483633.png" 
                alt="KORAUTO Logo" 
                className="h-8 w-auto object-contain invert"
              />
            </div>
            <p className="text-gray-300 text-sm leading-relaxed">
              Your trusted partner for premium quality vehicles with professional inspection services throughout South Korea.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-400 hover:text-blue-400 transition-colors">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-blue-400 transition-colors">
                <Instagram className="h-5 w-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-blue-400 transition-colors">
                <Youtube className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Services */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-white">Services</h4>
            <div className="space-y-3 text-sm">
              <Link to="/catalog" className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors">
                <Car className="h-4 w-4" />
                Browse Cars
              </Link>
              <Link to="/inspections" className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors">
                <Shield className="h-4 w-4" />
                Vehicle Inspection
              </Link>
              <Link to="/contacts" className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors">
                <Award className="h-4 w-4" />
                Premium Support
              </Link>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-white">Quick Links</h4>
            <div className="space-y-3 text-sm">
              <Link to="/" className="block text-gray-300 hover:text-white transition-colors">Home</Link>
              <Link to="/catalog" className="block text-gray-300 hover:text-white transition-colors">All Cars</Link>
              <Link to="/favorites" className="block text-gray-300 hover:text-white transition-colors">Favorites</Link>
              <Link to="/contacts" className="block text-gray-300 hover:text-white transition-colors">Contact Us</Link>
            </div>
          </div>

          {/* Contact Info */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-white">Contact Information</h4>
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-blue-400" />
                <a href="tel:+38348181116" className="text-gray-300 hover:text-white transition-colors">
                  +383 48 181 116
                </a>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-blue-400" />
                <a href="mailto:info@korauto.com" className="text-gray-300 hover:text-white transition-colors">
                  info@korauto.com
                </a>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-blue-400" />
                <a 
                  href="https://maps.google.com/?q=KORAUTO,Rr.+Ilaz+Kodra+70,Prishtinë,Kosovo" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-gray-300 hover:text-white transition-colors"
                >
                  Prishtinë, Kosovo
                </a>
              </div>
              
              {/* WhatsApp CTA */}
              <div className="mt-4">
                <a 
                  href="https://wa.me/38348181116" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  <Phone className="h-4 w-4" />
                  WhatsApp Us
                </a>
              </div>
            </div>
          </div>
        </div>
        
        {/* Newsletter Section */}
        <div className="border-t border-gray-800 mt-12 pt-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div>
              <h4 className="text-lg font-semibold text-white mb-2">Stay Updated</h4>
              <p className="text-gray-300 text-sm">Get notified about new arrivals and special offers</p>
            </div>
            <div className="flex gap-3">
              <Input 
                type="email" 
                placeholder="Enter your email" 
                className="flex-1 bg-gray-800 border-gray-700 text-white placeholder-gray-400 focus:border-blue-500"
              />
              <Button className="bg-blue-600 hover:bg-blue-700 text-white px-6">
                Subscribe
              </Button>
            </div>
          </div>
        </div>
        
        {/* Bottom Bar */}
        <div className="border-t border-gray-800 mt-8 pt-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <p className="text-sm text-gray-400">
              © 2024 KORAUTO. All rights reserved. Professional car inspection services.
            </p>
            <div className="flex items-center gap-6 text-sm text-gray-400">
              <Link to="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
              <Link to="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
              <span className="text-blue-400">🇰🇷 Direct from South Korea</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;