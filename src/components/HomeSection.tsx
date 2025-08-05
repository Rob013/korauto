import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";
const HomeSection = () => {
  return <section id="home" className="min-h-[85vh] flex items-center justify-center bg-background mobile-section-lg relative">
      <div className="container-responsive text-center">
        <div className="max-w-4xl mx-auto mobile-stack">
          {/* Logo on Homepage */}
          <div className="mobile-center">
            <div className="w-40 h-40 sm:w-48 sm:h-48 md:w-56 md:h-56 lg:w-64 lg:h-64 mx-auto flex items-center justify-center mb-4">
              <img 
                src="/lovable-uploads/d1ff645d-f293-44ab-b806-ae5eb2483633.png" 
                alt="KORAUTO Logo" 
                className="w-full h-full object-contain dark:invert transition-all duration-300" 
              />
            </div>
          </div>
          
          <h1 className="mobile-title text-foreground mb-4">
            Mirë se vini në KORAUTO
          </h1>
          <p className="mobile-body text-muted-foreground max-w-3xl mx-auto mb-8">
            Find your perfect car from South Korea with best price and quality
          </p>
          
          <div className="mobile-stack-sm sm:flex-row sm:justify-center sm:items-center mb-8">
            <Button 
              size="lg" 
              className="btn-mobile bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-4 text-lg font-semibold w-full sm:w-auto" 
              onClick={() => document.getElementById('cars')?.scrollIntoView({
                behavior: 'smooth'
              })}
            >
              Shfleto Makinat
            </Button>
            <Button 
              variant="outline" 
              size="lg" 
              className="btn-mobile border-primary text-primary hover:bg-primary hover:text-primary-foreground px-8 py-4 text-lg font-semibold w-full sm:w-auto transition-colors" 
              onClick={() => window.location.href = '/catalog'}
            >
              Katalogu
            </Button>
            <Button 
              variant="outline" 
              size="lg" 
              className="btn-mobile border-primary text-primary hover:bg-primary hover:text-primary-foreground px-8 py-4 text-lg font-semibold w-full sm:w-auto transition-colors" 
              onClick={() => window.location.href = '/inspections'}
            >
              Mëso për Inspektimet
            </Button>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6 md:gap-8 max-w-2xl mx-auto">
            <div className="mobile-center">
              <div className="text-3xl sm:text-4xl md:text-5xl font-bold text-primary mb-2">300+</div>
              <div className="mobile-caption">Makina të Shitura në Kosovë</div>
            </div>
            <div className="mobile-center">
              <div className="text-3xl sm:text-4xl md:text-5xl font-bold text-primary mb-2">100%</div>
              <div className="mobile-caption">Profesional</div>
            </div>
            <div className="mobile-center col-span-2 md:col-span-1">
              <div className="text-3xl sm:text-4xl md:text-5xl font-bold text-primary mb-2">24/7</div>
              <div className="mobile-caption">Mbështetje</div>
            </div>
          </div>
        </div>
      </div>

      {/* Sleek arrows on the sides - hidden on mobile for better UX */}
      <div className="absolute left-4 top-1/2 transform -translate-y-1/2 hidden xl:block">
        <ChevronDown 
          className="w-8 h-8 text-primary/60 animate-bounce cursor-pointer hover:text-primary transition-colors duration-300 rotate-45 touch-target"
          onClick={() => document.getElementById('cars')?.scrollIntoView({ behavior: 'smooth' })}
        />
      </div>
      <div className="absolute right-4 top-1/2 transform -translate-y-1/2 hidden xl:block">
        <ChevronDown 
          className="w-8 h-8 text-primary/60 animate-bounce cursor-pointer hover:text-primary transition-colors duration-300 -rotate-45 touch-target"
          onClick={() => document.getElementById('cars')?.scrollIntoView({ behavior: 'smooth' })}
        />
      </div>
    </section>;
};
export default HomeSection;