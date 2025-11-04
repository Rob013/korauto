import { Button } from "@/components/ui/button";
import { ArrowRight, Play } from "lucide-react";
import heroImage from "@/assets/hero-cars.jpg";

const Hero = () => {
  return (
    <section className="relative min-h-[55vh] xs:min-h-[65vh] sm:min-h-[75vh] lg:min-h-[85vh] flex items-center justify-center overflow-hidden">
      {/* Background Image with iOS-style overlay */}
      <div className="absolute inset-0 z-0">
        <img
          src={heroImage}
          alt="Luxury cars in showroom"
          className="w-full h-full object-cover animate-image-reveal"
          loading="eager"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-black/70 via-black/60 to-black/70" />
      </div>

      {/* Content with iOS-style animations */}
      <div className="container-responsive relative z-10 text-center text-white">
        <div className="max-w-4xl mx-auto space-y-6 sm:space-y-8">
          <h1 className="text-3xl xs:text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-tight animate-fade-in">
            Premium Car Auctions
            <span className="block bg-gradient-to-r from-accent via-accent-hover to-accent bg-clip-text text-transparent mt-2">
              Redefined
            </span>
          </h1>
          
          <p className="text-base xs:text-lg sm:text-xl md:text-2xl text-gray-200 max-w-2xl mx-auto px-4 leading-relaxed animate-slide-in-up opacity-95">
            Discover exceptional vehicles, bid with confidence, and drive away with your dream car from Europe's most trusted auction platform.
          </p>
          
          <div className="flex flex-col xs:flex-row gap-3 xs:gap-4 justify-center items-center px-4 animate-scale-in">
            <Button 
              size="lg" 
              variant="premium"
              className="w-full xs:w-auto min-w-[200px] h-12 sm:h-14 text-base sm:text-lg font-semibold"
            >
              Browse Live Auctions
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button 
              variant="outline" 
              size="lg" 
              className="w-full xs:w-auto min-w-[200px] h-12 sm:h-14 text-base sm:text-lg font-semibold border-white/30 bg-white/10 hover:bg-white/20 backdrop-blur-md text-white hover:border-white/50"
            >
              <Play className="mr-2 h-5 w-5" />
              Watch Demo
            </Button>
          </div>

          {/* Stats with stagger animation */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 lg:gap-8 max-w-3xl mx-auto px-4 pt-8 stagger-animation">
            <div className="glass-card p-4 sm:p-6 rounded-xl border border-white/10 backdrop-blur-md hover-lift-gentle">
              <div className="text-2xl xs:text-3xl sm:text-4xl font-bold bg-gradient-to-br from-accent to-accent-hover bg-clip-text text-transparent mb-2">
                15k+
              </div>
              <div className="text-xs sm:text-sm text-gray-300 font-medium">Cars Sold</div>
            </div>
            <div className="glass-card p-4 sm:p-6 rounded-xl border border-white/10 backdrop-blur-md hover-lift-gentle">
              <div className="text-2xl xs:text-3xl sm:text-4xl font-bold bg-gradient-to-br from-accent to-accent-hover bg-clip-text text-transparent mb-2">
                €2.5M
              </div>
              <div className="text-xs sm:text-sm text-gray-300 font-medium">Total Value</div>
            </div>
            <div className="glass-card p-4 sm:p-6 rounded-xl border border-white/10 backdrop-blur-md hover-lift-gentle">
              <div className="text-2xl xs:text-3xl sm:text-4xl font-bold bg-gradient-to-br from-accent to-accent-hover bg-clip-text text-transparent mb-2">
                98%
              </div>
              <div className="text-xs sm:text-sm text-gray-300 font-medium">Satisfaction</div>
            </div>
            <div className="glass-card p-4 sm:p-6 rounded-xl border border-white/10 backdrop-blur-md hover-lift-gentle">
              <div className="text-2xl xs:text-3xl sm:text-4xl font-bold bg-gradient-to-br from-accent to-accent-hover bg-clip-text text-transparent mb-2">
                24/7
              </div>
              <div className="text-xs sm:text-sm text-gray-300 font-medium">Support</div>
            </div>
          </div>
        </div>
      </div>

      {/* Decorative gradient overlay */}
      <div className="absolute bottom-0 left-0 w-full h-24 xs:h-32 sm:h-40 bg-gradient-to-t from-background via-background/50 to-transparent z-20" />
    </section>
  );
};

export default Hero;