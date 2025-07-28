import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";
const HomeSection = () => {
  return <section id="home" className="min-h-screen flex items-center justify-center bg-background pt-4 pb-8 relative">
      <div className="container mx-auto px-4 text-center">
        <div className="max-w-4xl mx-auto">
          {/* Logo on Homepage */}
          <div className="mb-8">
            <div className="w-56 h-56 sm:w-64 sm:h-64 md:w-72 md:h-72 mx-auto flex items-center justify-center mb-4">
              <img 
                src="/lovable-uploads/d1ff645d-f293-44ab-b806-ae5eb2483633.png" 
                alt="KORAUTO Logo" 
                className="w-full h-full object-contain dark:invert transition-all duration-300" 
              />
            </div>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold mb-6 text-foreground">
            Mirë se vini në KORAUTO
          </h1>
          <p className="text-xl md:text-2xl mb-8 text-muted-foreground max-w-3xl mx-auto">
            Find your perfect car from South Korea with best price and quality
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
            <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-3 text-lg" onClick={() => document.getElementById('cars')?.scrollIntoView({
            behavior: 'smooth'
          })}>
              Shfleto Makinat
            </Button>
            <Button variant="outline" size="lg" className="border-primary text-primary hover:bg-primary hover:text-primary-foreground px-8 py-3 text-lg transition-colors" onClick={() => window.location.href = '/catalog'}>
              Katalogu
            </Button>
            <Button variant="outline" size="lg" className="border-primary text-primary hover:bg-primary hover:text-primary-foreground px-8 py-3 text-lg transition-colors" onClick={() => window.location.href = '/inspections'}>
              Mëso për Inspektimet
            </Button>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6 md:gap-8 max-w-2xl mx-auto mt-16">
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-primary mb-1">500+</div>
              <div className="text-sm text-muted-foreground">Makina të Inspektuara</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-primary mb-1">100%</div>
              <div className="text-sm text-muted-foreground">Profesional</div>
            </div>
            <div className="text-center col-span-2 md:col-span-1">
              <div className="text-3xl md:text-4xl font-bold text-primary mb-1">24/7</div>
              <div className="text-sm text-muted-foreground">Mbështetje</div>
            </div>
          </div>
        </div>
      </div>

      {/* Sleek arrows on the sides */}
      <div className="absolute left-4 top-1/2 transform -translate-y-1/2 hidden lg:block">
        <ChevronDown 
          className="w-8 h-8 text-primary/60 animate-bounce cursor-pointer hover:text-primary transition-colors duration-300 rotate-45"
          onClick={() => document.getElementById('cars')?.scrollIntoView({ behavior: 'smooth' })}
        />
      </div>
      <div className="absolute right-4 top-1/2 transform -translate-y-1/2 hidden lg:block">
        <ChevronDown 
          className="w-8 h-8 text-primary/60 animate-bounce cursor-pointer hover:text-primary transition-colors duration-300 -rotate-45"
          onClick={() => document.getElementById('cars')?.scrollIntoView({ behavior: 'smooth' })}
        />
      </div>
    </section>;
};
export default HomeSection;