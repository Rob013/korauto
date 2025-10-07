import { Button } from "@/components/ui/button";
import { ArrowRight, Play } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import heroImage from "@/assets/hero-cars.jpg";

const Hero = () => {
  const { t } = useLanguage();
  
  return (
    <section className="relative min-h-[50vh] xs:min-h-[60vh] sm:min-h-[70vh] lg:min-h-[80vh] flex items-center justify-center overflow-hidden">
      {/* Background Image with parallax effect */}
      <div className="absolute inset-0 z-0 parallax-slow">
        <img
          src={heroImage}
          alt="Luxury cars in showroom"
          className="w-full h-full object-cover scale-105 transition-transform duration-[2s] ease-out"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/60 to-black/70" />
      </div>

      {/* Content with modern animations */}
      <div className="container mx-auto px-3 sm:px-6 relative z-10 text-center text-white">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl xs:text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-bold mb-3 sm:mb-6 leading-tight animate-fade-in-up">
            {t("hero.title")}
            <span className="block text-accent animate-slide-in-right [animation-delay:0.3s] opacity-0 [animation-fill-mode:forwards]">
              {t("hero.subtitle")}
            </span>
          </h1>
          <p className="text-sm xs:text-base sm:text-lg md:text-xl lg:text-2xl mb-4 sm:mb-8 text-gray-200 max-w-2xl mx-auto px-2 animate-fade-in [animation-delay:0.4s] opacity-0 [animation-fill-mode:forwards]">
            {t("hero.description")}
          </p>
          
          <div className="flex flex-col xs:flex-row gap-2 xs:gap-3 sm:gap-4 justify-center items-center mb-6 sm:mb-12 px-2 animate-fade-in [animation-delay:0.6s] opacity-0 [animation-fill-mode:forwards]">
            <Button size="lg" className="w-full xs:w-auto bg-accent hover:bg-accent/90 text-white px-4 xs:px-6 sm:px-8 py-3 text-sm xs:text-base sm:text-lg min-h-[40px] xs:min-h-[44px] transition-elegant hover:scale-105 hover:shadow-2xl">
              {t("hero.cta.browse")}
              <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5 transition-transform group-hover:translate-x-1" />
            </Button>
            <Button variant="outline" size="lg" className="w-full xs:w-auto border-white text-white hover:bg-white hover:text-black px-4 xs:px-6 sm:px-8 py-3 text-sm xs:text-base sm:text-lg min-h-[40px] xs:min-h-[44px] transition-elegant hover:scale-105">
              <Play className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
              {t("hero.cta.demo")}
            </Button>
          </div>

          {/* Stats with stagger animation */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 xs:gap-4 sm:gap-6 lg:gap-8 max-w-3xl mx-auto px-2 stagger-animation">
            <div className="text-center backdrop-blur-sm bg-white/5 rounded-xl p-4 hover-lift">
              <div className="text-xl xs:text-2xl sm:text-3xl lg:text-4xl font-bold text-accent mb-1">15k+</div>
              <div className="text-xs sm:text-sm text-gray-300">{t("hero.stats.cars")}</div>
            </div>
            <div className="text-center backdrop-blur-sm bg-white/5 rounded-xl p-4 hover-lift">
              <div className="text-xl xs:text-2xl sm:text-3xl lg:text-4xl font-bold text-accent mb-1">€2.5M</div>
              <div className="text-xs sm:text-sm text-gray-300">{t("hero.stats.value")}</div>
            </div>
            <div className="text-center backdrop-blur-sm bg-white/5 rounded-xl p-4 hover-lift">
              <div className="text-xl xs:text-2xl sm:text-3xl lg:text-4xl font-bold text-accent mb-1">98%</div>
              <div className="text-xs sm:text-sm text-gray-300">{t("hero.stats.satisfaction")}</div>
            </div>
            <div className="text-center backdrop-blur-sm bg-white/5 rounded-xl p-4 hover-lift">
              <div className="text-xl xs:text-2xl sm:text-3xl lg:text-4xl font-bold text-accent mb-1">24/7</div>
              <div className="text-xs sm:text-sm text-gray-300">{t("hero.stats.support")}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Decorative elements */}
      <div className="absolute bottom-0 left-0 w-full h-16 xs:h-20 sm:h-32 bg-gradient-to-t from-background to-transparent z-20" />
    </section>
  );
};

export default Hero;