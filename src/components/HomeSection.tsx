import { Button } from "@/components/ui/button";
import { ChevronDown, Sparkles } from "lucide-react";

const HomeSection = () => {
  return (
    <section 
      id="home" 
      className="min-h-[85vh] flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/20 pt-2 pb-4 relative overflow-hidden"
    >
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-32 h-32 bg-primary/5 rounded-full blur-xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-40 h-40 bg-secondary/10 rounded-full blur-2xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-primary/3 to-secondary/5 rounded-full blur-3xl"></div>
      </div>

      <div className="container-responsive text-center relative z-10">
        <div className="max-w-4xl mx-auto">
          {/* Logo on Homepage with enhanced presentation */}
          <div className="mb-6">
            <div className="w-48 h-48 sm:w-56 sm:h-56 md:w-64 md:h-64 mx-auto flex items-center justify-center mb-4 relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-secondary/10 rounded-full blur-xl group-hover:blur-2xl transition-all duration-500"></div>
              <img 
                src="/lovable-uploads/d1ff645d-f293-44ab-b806-ae5eb2483633.png" 
                alt="KORAUTO Logo" 
                className="w-full h-full object-contain dark:invert transition-all duration-300 relative z-10 hover:scale-105 transform" 
              />
              <div className="absolute top-2 right-2 animate-pulse">
                <Sparkles className="w-6 h-6 text-primary/60" />
              </div>
            </div>
          </div>
          
          <h1 className="text-4xl md:text-6xl font-bold mb-6 text-foreground bg-gradient-to-r from-foreground via-foreground to-primary/80 bg-clip-text animate-fade-in-up">
            Mirë se vini në KORAUTO
          </h1>
          <p className="text-lg md:text-xl mb-8 text-muted-foreground max-w-3xl mx-auto leading-relaxed animate-fade-in-up delay-100">
            Find your perfect car from South Korea with best price and quality. 
            Professional inspection services and premium vehicle imports.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-10">
            <Button 
              size="lg" 
              className="bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary text-primary-foreground px-8 py-4 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 btn-enhanced" 
              onClick={() => document.getElementById('cars')?.scrollIntoView({
                behavior: 'smooth'
              })}
            >
              Shfleto Makinat
            </Button>
            <Button 
              variant="outline" 
              size="lg" 
              className="border-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground px-8 py-4 text-lg font-semibold transition-all duration-300 transform hover:scale-105 hover:shadow-lg" 
              onClick={() => window.location.href = '/catalog'}
            >
              Katalogu
            </Button>
            <Button 
              variant="outline" 
              size="lg" 
              className="border-2 border-secondary text-secondary-foreground hover:bg-secondary hover:text-secondary-foreground px-8 py-4 text-lg font-semibold transition-all duration-300 transform hover:scale-105 hover:shadow-lg" 
              onClick={() => window.location.href = '/inspections'}
            >
              Mëso për Inspektimet
            </Button>
          </div>

          {/* Enhanced Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6 md:gap-8 max-w-3xl mx-auto mt-12">
            <div className="text-center p-6 rounded-2xl bg-card/50 backdrop-blur-sm border border-border/50 hover:shadow-lg transition-all duration-300 hover:scale-105">
              <div className="text-3xl md:text-4xl font-bold text-primary mb-2 bg-gradient-to-r from-primary to-primary/70 bg-clip-text">300+</div>
              <div className="text-sm font-medium text-muted-foreground">Makina të Shitura në Kosovë</div>
            </div>
            <div className="text-center p-6 rounded-2xl bg-card/50 backdrop-blur-sm border border-border/50 hover:shadow-lg transition-all duration-300 hover:scale-105">
              <div className="text-3xl md:text-4xl font-bold text-primary mb-2 bg-gradient-to-r from-primary to-primary/70 bg-clip-text">100%</div>
              <div className="text-sm font-medium text-muted-foreground">Profesional</div>
            </div>
            <div className="text-center col-span-2 md:col-span-1 p-6 rounded-2xl bg-card/50 backdrop-blur-sm border border-border/50 hover:shadow-lg transition-all duration-300 hover:scale-105">
              <div className="text-3xl md:text-4xl font-bold text-primary mb-2 bg-gradient-to-r from-primary to-primary/70 bg-clip-text">24/7</div>
              <div className="text-sm font-medium text-muted-foreground">Mbështetje</div>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced animated arrows */}
      <div className="absolute left-6 top-1/2 transform -translate-y-1/2 hidden lg:block">
        <div className="p-2 rounded-full bg-primary/10 backdrop-blur-sm hover:bg-primary/20 transition-all duration-300 cursor-pointer group"
             onClick={() => document.getElementById('cars')?.scrollIntoView({ behavior: 'smooth' })}>
          <ChevronDown 
            className="w-6 h-6 text-primary/70 group-hover:text-primary transition-colors duration-300 rotate-45 group-hover:scale-110 transform"
          />
        </div>
      </div>
      <div className="absolute right-6 top-1/2 transform -translate-y-1/2 hidden lg:block">
        <div className="p-2 rounded-full bg-primary/10 backdrop-blur-sm hover:bg-primary/20 transition-all duration-300 cursor-pointer group"
             onClick={() => document.getElementById('cars')?.scrollIntoView({ behavior: 'smooth' })}>
          <ChevronDown 
            className="w-6 h-6 text-primary/70 group-hover:text-primary transition-colors duration-300 -rotate-45 group-hover:scale-110 transform"
          />
        </div>
      </div>
    </section>
  );
};

export default HomeSection;