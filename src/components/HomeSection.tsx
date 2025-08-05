import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";

const HomeSection = () => {
  return (
    <section id="home" className="min-h-[85vh] flex items-center justify-center bg-background section-padding-mobile relative">
      <div className="container-mobile text-center">
        <div className="max-w-4xl mx-auto">
          {/* Logo on Homepage */}
          <div className="mb-6 sm:mb-8">
            <div className="w-40 h-40 sm:w-48 sm:h-48 md:w-56 md:h-56 lg:w-64 lg:h-64 mx-auto flex items-center justify-center mb-4">
              <img 
                src="/lovable-uploads/d1ff645d-f293-44ab-b806-ae5eb2483633.png" 
                alt="KORAUTO Logo" 
                className="w-full h-full object-contain dark:invert transition-all duration-300" 
              />
            </div>
          </div>
          
          <h1 className="heading-mobile-h1 mb-4 sm:mb-6 text-foreground">
            Mirë se vini në KORAUTO
          </h1>
          <p className="text-responsive-sm mb-6 sm:mb-8 text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Find your perfect car from South Korea with best price and quality
          </p>
          
          <div className="flex-mobile-stack sm:flex-row justify-center items-center mb-8 sm:mb-12">
            <Button 
              className="btn-mobile w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg hover:shadow-xl" 
              onClick={() => document.getElementById('cars')?.scrollIntoView({
                behavior: 'smooth'
              })}
            >
              Shfleto Makinat
            </Button>
            <Button 
              variant="outline" 
              className="btn-mobile w-full sm:w-auto border-primary text-primary hover:bg-primary hover:text-primary-foreground transition-colors" 
              onClick={() => window.location.href = '/catalog'}
            >
              Katalogu
            </Button>
            <Button 
              variant="outline" 
              className="btn-mobile w-full sm:w-auto border-primary text-primary hover:bg-primary hover:text-primary-foreground transition-colors" 
              onClick={() => window.location.href = '/inspections'}
            >
              Mëso për Inspektimet
            </Button>
          </div>

          {/* Quick Stats */}
          <div className="stats-grid-mobile max-w-2xl mx-auto">
            <div className="text-center p-4 sm:p-6 rounded-lg bg-card/50 backdrop-blur-sm">
              <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-primary mb-2">300+</div>
              <div className="text-sm sm:text-base text-muted-foreground leading-tight">Makina të Shitura në Kosovë</div>
            </div>
            <div className="text-center p-4 sm:p-6 rounded-lg bg-card/50 backdrop-blur-sm">
              <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-primary mb-2">100%</div>
              <div className="text-sm sm:text-base text-muted-foreground leading-tight">Profesional</div>
            </div>
            <div className="text-center p-4 sm:p-6 rounded-lg bg-card/50 backdrop-blur-sm">
              <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-primary mb-2">24/7</div>
              <div className="text-sm sm:text-base text-muted-foreground leading-tight">Mbështetje</div>
            </div>
          </div>
        </div>
      </div>

      {/* Sleek arrows on the sides - desktop only */}
      <div className="absolute left-4 top-1/2 transform -translate-y-1/2 hidden lg:block">
        <ChevronDown 
          className="w-8 h-8 text-primary/60 animate-bounce cursor-pointer hover:text-primary transition-colors duration-300 rotate-45 touch-target"
          onClick={() => document.getElementById('cars')?.scrollIntoView({ behavior: 'smooth' })}
        />
      </div>
      <div className="absolute right-4 top-1/2 transform -translate-y-1/2 hidden lg:block">
        <ChevronDown 
          className="w-8 h-8 text-primary/60 animate-bounce cursor-pointer hover:text-primary transition-colors duration-300 -rotate-45 touch-target"
          onClick={() => document.getElementById('cars')?.scrollIntoView({ behavior: 'smooth' })}
        />
      </div>
    </section>
  );
};

export default HomeSection;