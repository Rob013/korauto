import { Button } from "@/components/ui/button";
import korautoLogo from "@/assets/korauto-logo-black.png";
const HomeSection = () => {
  return <section id="home" className="min-h-screen flex items-center justify-center bg-background py-20">
      <div className="container mx-auto px-4 text-center">
        <div className="max-w-4xl mx-auto">
          {/* Logo on Homepage */}
          <div className="mb-12">
            <div className="w-48 h-48 sm:w-56 sm:h-56 md:w-64 md:h-64 mx-auto flex items-center justify-center mb-6">
              <img 
                src={korautoLogo} 
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
    </section>;
};
export default HomeSection;