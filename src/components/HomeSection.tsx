import { Button } from "@/components/ui/button";

const HomeSection = () => {
  return (
    <section id="home" className="min-h-screen flex items-center justify-center bg-background py-20">
      <div className="container mx-auto px-4 text-center">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-7xl font-bold mb-6 text-foreground">
            Mirë se vini në KORAUTO
          </h1>
          <p className="text-xl md:text-2xl mb-8 text-muted-foreground max-w-3xl mx-auto">
            Find your perfect car from South Korea with best price and quality
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
            <Button 
              size="lg" 
              className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-3 text-lg"
              onClick={() => document.getElementById('cars')?.scrollIntoView({ behavior: 'smooth' })}
            >
              Shfleto Makinat
            </Button>
            <Button 
              variant="outline" 
              size="lg" 
              className="border-primary text-primary hover:bg-primary hover:text-primary-foreground px-8 py-3 text-lg"
              onClick={() => document.getElementById('inspection')?.scrollIntoView({ behavior: 'smooth' })}
            >
              Mëso për Inspektimet
            </Button>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-8 max-w-2xl mx-auto mt-16">
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-primary mb-1">€50</div>
              <div className="text-sm text-muted-foreground">Shërbimi i Inspektimit</div>
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
    </section>
  );
};

export default HomeSection;