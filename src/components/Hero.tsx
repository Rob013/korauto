import { Button } from "@/components/ui/button";
import { ArrowRight, Search } from "lucide-react";
import heroImage from "@/assets/hero-cars.jpg";
import InspectionRequestForm from "./InspectionRequestForm";

const Hero = () => {
  return (
    <section className="relative min-h-[80vh] flex items-center justify-center overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <img
          src={heroImage}
          alt="South Korean luxury cars showroom"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/60" />
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 relative z-10 text-center text-white">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
            Makinat Koreane
            <span className="block text-accent">Inspektim Profesional</span>
          </h1>
          <p className="text-xl md:text-2xl mb-8 text-gray-200 max-w-2xl mx-auto">
            Zbuloni makina të jashtëzakonshme nga Koreja e Jugut. Shërbim inspektimi profesional vetëm €50 për çdo makinë nga Encar.com.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
            <Button 
              size="lg" 
              className="bg-accent hover:bg-accent/90 text-white px-8 py-3 text-lg"
              onClick={() => document.getElementById('cars')?.scrollIntoView({ behavior: 'smooth' })}
            >
              Shiko Makinat Koreane
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <InspectionRequestForm
              trigger={
                <Button 
                  variant="outline" 
                  size="lg" 
                  className="border-white text-white hover:bg-white hover:text-black px-8 py-3 text-lg"
                >
                  <Search className="mr-2 h-5 w-5" />
                  Kërko Inspektim (€50)
                </Button>
              }
            />
          </div>

          {/* Stats for Korean Cars */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-3xl mx-auto">
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-accent mb-1">2k+</div>
              <div className="text-sm text-gray-300">Makina Koreane</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-accent mb-1">€50</div>
              <div className="text-sm text-gray-300">Inspektim Profesional</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-accent mb-1">24h</div>
              <div className="text-sm text-gray-300">Raport i Shpejtë</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-accent mb-1">100%</div>
              <div className="text-sm text-gray-300">E Verifikuar</div>
            </div>
          </div>
        </div>
      </div>

      {/* Decorative elements */}
      <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-background to-transparent z-20" />
    </section>
  );
};

export default Hero;