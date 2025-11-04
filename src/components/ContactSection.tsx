import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, Phone, MapPin, Clock } from "lucide-react";
import { useInView } from "@/hooks/useInView";

const ContactSection = () => {
  const { ref, isInView } = useInView({ threshold: 0.1, triggerOnce: true });
  
  return (
    <section ref={ref} id="contact" className={`py-8 sm:py-12 lg:py-16 bg-background transition-all duration-700 ${isInView ? 'animate-fade-in' : 'opacity-0'}`}>
      <div className="container-responsive">
        <div className="text-center mb-8 sm:mb-12 animate-slide-in-up">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 sm:mb-6 text-foreground">Na Kontaktoni</h2>
          <p className="text-base sm:text-lg lg:text-xl text-muted-foreground max-w-3xl mx-auto px-4">
            Lidhuni me ekipin tonë për inspektime, pyetje, ose mbështetje.
          </p>
        </div>

        <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 max-w-7xl mx-auto ${isInView ? 'stagger-animation' : ''}`}>
          <Card className="glass-card text-center card-hover h-full">
            <CardHeader className="pb-4">
              <div className="mx-auto w-14 h-14 sm:w-16 sm:h-16 bg-primary rounded-xl flex items-center justify-center mb-4 shadow-[var(--shadow-md)] transform transition-transform hover:scale-110">
                <Mail className="h-6 w-6 sm:h-7 sm:w-7 text-primary-foreground" />
              </div>
              <CardTitle className="text-lg sm:text-xl">Email</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col justify-between">
              <p className="text-muted-foreground mb-3 text-sm sm:text-base">Dërgoni një mesazh</p>
              <a 
                href="mailto:INFO.RGSHPK@gmail.com" 
                className="text-primary hover:text-primary/80 transition-all duration-300 font-medium text-sm sm:text-base break-all hover:underline"
              >
                INFO.RGSHPK@gmail.com
              </a>
            </CardContent>
          </Card>

          <Card className="glass-card text-center card-hover h-full">
            <CardHeader className="pb-4">
              <div className="mx-auto w-14 h-14 sm:w-16 sm:h-16 bg-primary rounded-xl flex items-center justify-center mb-4 shadow-[var(--shadow-md)] transform transition-transform hover:scale-110">
                <MapPin className="h-6 w-6 sm:h-7 sm:w-7 text-primary-foreground" />
              </div>
              <CardTitle className="text-lg sm:text-xl">Vendndodhja</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col justify-between">
              <p className="text-muted-foreground mb-3 text-sm sm:text-base">Vizitoni zyrën tonë</p>
              <a 
                href="https://maps.google.com/?q=KORAUTO,Rr.+Ilaz+Kodra+70,Prishtinë,Kosovo" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary font-medium hover:text-primary/80 transition-all duration-300 text-sm sm:text-base hover:underline"
              >
                Rr. Ilaz Kodra 70, Prishtinë
              </a>
            </CardContent>
          </Card>

          <Card className="glass-card text-center card-hover h-full">
            <CardHeader className="pb-4">
              <div className="mx-auto w-14 h-14 sm:w-16 sm:h-16 bg-primary rounded-xl flex items-center justify-center mb-4 shadow-[var(--shadow-md)] transform transition-transform hover:scale-110">
                <Clock className="h-6 w-6 sm:h-7 sm:w-7 text-primary-foreground" />
              </div>
              <CardTitle className="text-lg sm:text-xl">Orari</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col justify-between">
              <p className="text-muted-foreground mb-3 text-sm sm:text-base">Jemi të disponueshëm</p>
              <div className="text-primary font-medium text-sm sm:text-base">
                <p>Çdo ditë: 9:00-18:00</p>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card text-center card-hover h-full">
            <CardHeader className="pb-4">
              <div className="mx-auto w-14 h-14 sm:w-16 sm:h-16 bg-primary rounded-xl flex items-center justify-center mb-4 shadow-[var(--shadow-md)] transform transition-transform hover:scale-110">
                <Phone className="h-6 w-6 sm:h-7 sm:w-7 text-primary-foreground" />
              </div>
              <CardTitle className="text-lg sm:text-xl">Robert Gashi</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col justify-between">
              <p className="text-muted-foreground mb-3 text-sm sm:text-base">Agent shitjesh</p>
              <div className="space-y-3">
                <a 
                  href="tel:+38348181116" 
                  className="block text-primary hover:text-primary/80 transition-all duration-300 font-medium text-sm sm:text-base hover:underline"
                >
                  +38348181116
                </a>
                <div className="flex gap-2 justify-center">
                  <a 
                    href="https://wa.me/38348181116" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-xs sm:text-sm bg-green-500 text-white px-3 py-1.5 rounded-lg hover:bg-green-600 transition-all duration-300 btn-press-effect"
                  >
                    WhatsApp
                  </a>
                  <a 
                    href="viber://chat?number=+38348181116" 
                    className="text-xs sm:text-sm bg-purple-500 text-white px-3 py-1.5 rounded-lg hover:bg-purple-600 transition-all duration-300 btn-press-effect"
                  >
                    Viber
                  </a>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className={`grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 max-w-3xl mx-auto mt-6 sm:mt-8 ${isInView ? 'stagger-animation' : ''}`}>
          <Card className="glass-card text-center card-hover h-full">
            <CardHeader className="pb-4">
              <div className="mx-auto w-14 h-14 sm:w-16 sm:h-16 bg-primary rounded-xl flex items-center justify-center mb-4 shadow-[var(--shadow-md)] transform transition-transform hover:scale-110">
                <Phone className="h-6 w-6 sm:h-7 sm:w-7 text-primary-foreground" />
              </div>
              <CardTitle className="text-lg sm:text-xl">Rajmond</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col justify-between">
              <p className="text-muted-foreground mb-3 text-sm sm:text-base">Agent shitjesh</p>
              <div className="space-y-3">
                <a 
                  href="tel:+38346105588" 
                  className="block text-primary hover:text-primary/80 transition-all duration-300 font-medium text-sm sm:text-base hover:underline"
                >
                  +38346105588
                </a>
                <div className="flex gap-2 justify-center">
                  <a 
                    href="https://wa.me/38346105588" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-xs sm:text-sm bg-green-500 text-white px-3 py-1.5 rounded-lg hover:bg-green-600 transition-all duration-300 btn-press-effect"
                  >
                    WhatsApp
                  </a>
                  <a 
                    href="viber://chat?number=+38346105588" 
                    className="text-xs sm:text-sm bg-purple-500 text-white px-3 py-1.5 rounded-lg hover:bg-purple-600 transition-all duration-300 btn-press-effect"
                  >
                    Viber
                  </a>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card text-center card-hover h-full">
            <CardHeader className="pb-4">
              <div className="mx-auto w-14 h-14 sm:w-16 sm:h-16 bg-primary rounded-xl flex items-center justify-center mb-4 shadow-[var(--shadow-md)] transform transition-transform hover:scale-110">
                <Phone className="h-6 w-6 sm:h-7 sm:w-7 text-primary-foreground" />
              </div>
              <CardTitle className="text-lg sm:text-xl">Renato</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col justify-between">
              <p className="text-muted-foreground mb-3 text-sm sm:text-base">Agent shitjesh</p>
              <div className="space-y-3">
                <a 
                  href="tel:+38348181117" 
                  className="block text-primary hover:text-primary/80 transition-all duration-300 font-medium text-sm sm:text-base hover:underline"
                >
                  +38346181117
                </a>
                <div className="flex gap-2 justify-center">
                  <a 
                    href="https://wa.me/38348181117" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-xs sm:text-sm bg-green-500 text-white px-3 py-1.5 rounded-lg hover:bg-green-600 transition-all duration-300 btn-press-effect"
                  >
                    WhatsApp
                  </a>
                  <a 
                    href="viber://chat?number=+38348181117" 
                    className="text-xs sm:text-sm bg-purple-500 text-white px-3 py-1.5 rounded-lg hover:bg-purple-600 transition-all duration-300 btn-press-effect"
                  >
                    Viber
                  </a>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="text-center mt-8 sm:mt-12 animate-slide-in-up">
          <Card className="glass-card max-w-3xl mx-auto">
            <CardContent className="p-6 sm:p-8">
              <h3 className="text-xl sm:text-2xl font-semibold mb-4 text-foreground">Përgjigje e Shpejtë</h3>
              <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
                Keni nevojë për inspektim? Na kontaktoni dhe ne do të programojmë inspektimin tuaj profesional të makinës brenda 24 orësh. 
                Mekanikët tanë të certifikuar janë gati të ofrojnë vlerësime të detajuara për çdo mjet në listat tona.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default ContactSection;