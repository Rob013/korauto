import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Facebook, Twitter, Instagram, Youtube, Mail, Phone, MapPin } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-primary text-primary-foreground">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="space-y-4">
            <h3 className="text-2xl font-bold text-accent">AutoElite</h3>
            <p className="text-sm opacity-90">
              Europe's premier online car auction platform. Connecting buyers and sellers with premium vehicles since 2020.
            </p>
            <div className="flex space-x-3">
              <Button variant="ghost" size="sm" className="p-2 hover:bg-white/10">
                <Facebook className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" className="p-2 hover:bg-white/10">
                <Twitter className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" className="p-2 hover:bg-white/10">
                <Instagram className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" className="p-2 hover:bg-white/10">
                <Youtube className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold">Quick Links</h4>
            <div className="space-y-2 text-sm">
              <a href="#" className="block hover:text-accent transition-colors">Live Auctions</a>
              <a href="#" className="block hover:text-accent transition-colors">Browse Cars</a>
              <a href="#" className="block hover:text-accent transition-colors">Sell Your Car</a>
              <a href="#" className="block hover:text-accent transition-colors">Inspection Service</a>
              <a href="#" className="block hover:text-accent transition-colors">How It Works</a>
              <a href="#" className="block hover:text-accent transition-colors">Success Stories</a>
            </div>
          </div>

          {/* Support */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold">Support</h4>
            <div className="space-y-2 text-sm">
              <a href="#" className="block hover:text-accent transition-colors">Help Center</a>
              <a href="#" className="block hover:text-accent transition-colors">Bidding Guide</a>
              <a href="#" className="block hover:text-accent transition-colors">Payment Methods</a>
              <a href="#" className="block hover:text-accent transition-colors">Shipping Info</a>
              <a href="#" className="block hover:text-accent transition-colors">Terms of Service</a>
              <a href="#" className="block hover:text-accent transition-colors">Privacy Policy</a>
            </div>
            
            <div className="space-y-2 pt-4">
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-4 w-4 text-accent" />
                +49 123 456 789
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 text-accent" />
                support@autoelite.com
              </div>
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="h-4 w-4 text-accent" />
                Munich, Germany
              </div>
            </div>
          </div>

          {/* Newsletter */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold">Stay Updated</h4>
            <p className="text-sm opacity-90">
              Get notified about new auctions and exclusive deals.
            </p>
            <div className="space-y-2">
              <Input
                type="email"
                placeholder="Enter your email"
                className="bg-white/10 border-white/20 text-white placeholder:text-white/60"
              />
              <Button className="w-full bg-accent hover:bg-accent/90 text-white">
                Subscribe
              </Button>
            </div>
            <p className="text-xs opacity-75">
              No spam, unsubscribe anytime. Your privacy is our priority.
            </p>
          </div>
        </div>

        <div className="border-t border-white/20 mt-12 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <p className="text-sm opacity-75">
              © 2024 AutoElite. All rights reserved.
            </p>
            <div className="flex space-x-6 text-sm">
              <a href="#" className="hover:text-accent transition-colors">Terms</a>
              <a href="#" className="hover:text-accent transition-colors">Privacy</a>
              <a href="#" className="hover:text-accent transition-colors">Cookies</a>
              <a href="#" className="hover:text-accent transition-colors">Legal</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;