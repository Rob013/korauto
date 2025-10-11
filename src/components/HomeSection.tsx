import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";
const HomeSection = () => {
  return <section id="home" className="home-section">
      {/* Background decorative elements - Deferred to not block LCP */}
      <div className="absolute inset-0 pointer-events-none opacity-0 animate-fade-in" style={{animationDelay: '0.5s', animationFillMode: 'forwards'}}>
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-pulse delay-75"></div>
      </div>
      
      <div className="container-responsive text-center relative z-10">
        <div className="max-w-4xl mx-auto">
          {/* Logo on Homepage - Optimized for LCP */}
          <div className="mb-4">
            <div className="logo-container">
              <img 
                src="/lovable-uploads/d1ff645d-f293-44ab-b806-ae5eb2483633.png" 
                alt="KORAUTO Logo" 
                className="logo-image"
                loading="eager"
                fetchPriority="high"
                width="256"
                height="256"
              />
            </div>
          </div>
          
          <h1 className="text-4xl md:text-6xl font-bold mb-4 text-foreground animate-slide-in-left">
            Mirë se vini në KORAUTO
          </h1>
          <p className="text-lg md:text-xl mb-6 text-muted-foreground max-w-3xl mx-auto animate-slide-in-right">
            Gjeni makinën tuaj të përsosur nga Koreja e Jugut me çmimin më të mirë dhe cilësinë e lartë
          </p>
          
          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center mb-8 animate-bounce-in">
            <Button variant="outline" size="lg" className="btn-enhanced border-primary text-primary hover:bg-primary hover:text-primary-foreground px-8 py-3 text-lg transition-all duration-300 hover-lift-gentle" onClick={() => window.location.href = '/catalog'}>Shfleto Veturat</Button>
            <Button variant="outline" size="lg" className="btn-enhanced border-primary text-primary hover:bg-primary hover:text-primary-foreground px-8 py-3 text-lg transition-all duration-300 hover-lift-gentle" onClick={() => window.location.href = '/inspections'}>
              Mëso për Inspektimet
            </Button>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 max-w-2xl mx-auto mt-8 stagger-animation">
            <div className="text-center modern-card p-6 hover-lift-gentle">
              <div className="text-3xl md:text-4xl font-bold gradient-text mb-1">400+</div>
              <div className="text-sm text-muted-foreground">Makina të Shitura në Kosovë</div>
            </div>
            <div className="text-center modern-card p-6 hover-lift-gentle">
              <div className="text-3xl md:text-4xl font-bold gradient-text mb-1">100%</div>
              <div className="text-sm text-muted-foreground">Garancion ne Motor, Transimison dhe KM</div>
            </div>
            <div className="text-center col-span-2 md:col-span-1 modern-card p-6 hover-lift-gentle">
              <div className="text-3xl md:text-4xl font-bold gradient-text mb-1">24/7</div>
              <div className="text-sm text-muted-foreground">Mbështetje</div>
            </div>
          </div>
        </div>
      </div>

      {/* Sleek arrows on the sides */}
      <div className="absolute left-4 top-1/2 transform -translate-y-1/2 hidden lg:block">
        <ChevronDown className="w-8 h-8 text-primary/60 animate-bounce cursor-pointer hover:text-primary transition-colors duration-300 rotate-45" onClick={() => document.getElementById('cars')?.scrollIntoView({
        behavior: 'smooth'
      })} />
      </div>
      <div className="absolute right-4 top-1/2 transform -translate-y-1/2 hidden lg:block">
        <ChevronDown className="w-8 h-8 text-primary/60 animate-bounce cursor-pointer hover:text-primary transition-colors duration-300 -rotate-45" onClick={() => document.getElementById('cars')?.scrollIntoView({
        behavior: 'smooth'
      })} />
      </div>
    </section>;
};
export default HomeSection;