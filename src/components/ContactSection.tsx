import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, Phone, MapPin, Clock } from "lucide-react";

const ContactSection = () => {
  return (
    <section id="contact" className="py-4 sm:py-6 lg:py-8 bg-background">
      <div className="container-responsive">
        <div className="text-center mb-4 sm:mb-6">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-3 sm:mb-4 text-foreground">Na Kontaktoni</h2>
          <p className="text-base sm:text-lg lg:text-xl text-muted-foreground max-w-2xl mx-auto px-4">
            Lidhuni me ekipin tonë për inspektime, pyetje, ose mbështetje.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 max-w-6xl mx-auto">
          <Card className="text-center hover:shadow-lg transition-shadow duration-300 h-full">
            <CardHeader className="pb-3">
              <div className="mx-auto w-12 h-12 bg-primary rounded-lg flex items-center justify-center mb-3">
                <Mail className="h-6 w-6 text-primary-foreground" />
              </div>
              <CardTitle className="text-lg">Email</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col justify-between">
              <p className="text-muted-foreground mb-2 text-sm">Dërgoni një mesazh</p>
              <a 
                href="mailto:INFO.RGSHPK@gmail.com" 
                className="text-primary hover:text-primary/80 transition-colors font-medium text-sm break-all"
              >
                INFO.RGSHPK@gmail.com
              </a>
            </CardContent>
          </Card>

          <Card className="text-center hover:shadow-lg transition-shadow duration-300 h-full">
            <CardHeader>
              <div className="mx-auto w-12 h-12 bg-primary rounded-lg flex items-center justify-center mb-4">
                <MapPin className="h-6 w-6 text-primary-foreground" />
              </div>
              <CardTitle className="text-lg">Vendndodhja</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col justify-between">
              <p className="text-muted-foreground mb-2">Vizitoni zyrën tonë</p>
              <a 
                href="https://maps.google.com/?q=KORAUTO,Rr.+Ilaz+Kodra+70,Prishtinë,Kosovo" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary font-medium hover:text-primary/80 transition-colors"
              >
                Rr. Ilaz Kodra 70, Prishtinë
              </a>
            </CardContent>
          </Card>

          <Card className="text-center card-hover modern-card h-full">
            <CardHeader>
              <div className="mx-auto w-12 h-12 bg-primary rounded-lg flex items-center justify-center mb-4 interactive-element">
                <Clock className="h-6 w-6 text-primary-foreground" />
              </div>
              <CardTitle className="text-lg">Orari</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col justify-between">
              <p className="text-muted-foreground mb-2">Jemi të disponueshëm</p>
              <div className="text-primary font-medium">
                <p>Çdo ditë: 9:00-18:00</p>
              </div>
            </CardContent>
          </Card>

          <Card className="text-center hover:shadow-lg transition-shadow duration-300 h-full">
            <CardHeader>
              <div className="mx-auto w-12 h-12 bg-primary rounded-lg flex items-center justify-center mb-4">
                <Phone className="h-6 w-6 text-primary-foreground" />
              </div>
              <CardTitle className="text-lg">Robert Gashi</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col justify-between">
              <p className="text-muted-foreground mb-2">Agent shitjesh</p>
              <div className="space-y-2">
                <a 
                  href="tel:+38348181116" 
                  className="block text-primary hover:text-primary/80 transition-colors font-medium"
                >
                  +38348181116
                </a>
                <div className="flex gap-2 justify-center">
                  <a 
                    href="https://wa.me/38348181116" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-xs bg-green-500 text-white px-2 py-1 rounded hover:bg-green-600 transition-colors"
                  >
                    WhatsApp
                  </a>
                  <a 
                    href="viber://chat?number=+38348181116" 
                    className="text-xs bg-purple-500 text-white px-2 py-1 rounded hover:bg-purple-600 transition-colors"
                  >
                    Viber
                  </a>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 max-w-6xl mx-auto mt-6">
          <Card className="text-center hover:shadow-lg transition-shadow duration-300 h-full">
            <CardHeader>
              <div className="mx-auto w-12 h-12 bg-primary rounded-lg flex items-center justify-center mb-4">
                <Phone className="h-6 w-6 text-primary-foreground" />
              </div>
              <CardTitle className="text-lg">Rajmond</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col justify-between">
              <p className="text-muted-foreground mb-2">Agent shitjesh</p>
              <div className="space-y-2">
                <a 
                  href="tel:+38346105588" 
                  className="block text-primary hover:text-primary/80 transition-colors font-medium"
                >
                  +38346105588
                </a>
                <div className="flex gap-2 justify-center">
                  <a 
                    href="https://wa.me/38346105588" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-xs bg-green-500 text-white px-2 py-1 rounded hover:bg-green-600 transition-colors"
                  >
                    WhatsApp
                  </a>
                  <a 
                    href="viber://chat?number=+38346105588" 
                    className="text-xs bg-purple-500 text-white px-2 py-1 rounded hover:bg-purple-600 transition-colors"
                  >
                    Viber
                  </a>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="text-center hover:shadow-lg transition-shadow duration-300 h-full">
            <CardHeader>
              <div className="mx-auto w-12 h-12 bg-primary rounded-lg flex items-center justify-center mb-4">
                <Phone className="h-6 w-6 text-primary-foreground" />
              </div>
              <CardTitle className="text-lg">Renato</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col justify-between">
              <p className="text-muted-foreground mb-2">Agent shitjesh</p>
              <div className="space-y-2">
                <a 
                  href="tel:+38348181117" 
                  className="block text-primary hover:text-primary/80 transition-colors font-medium"
                >
                  +38346181117
                </a>
                <div className="flex gap-2 justify-center">
                  <a 
                    href="https://wa.me/38348181117" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-xs bg-green-500 text-white px-2 py-1 rounded hover:bg-green-600 transition-colors"
                  >
                    WhatsApp
                  </a>
                  <a 
                    href="viber://chat?number=+38348181117" 
                    className="text-xs bg-purple-500 text-white px-2 py-1 rounded hover:bg-purple-600 transition-colors"
                  >
                    Viber
                  </a>
                </div>
              </div>
            </CardContent>
          </Card> 
        </div>

        <div className="text-center mt-6">
          <Card className="max-w-2xl mx-auto bg-muted/50">
            <CardContent className="p-6">
              <h3 className="text-xl font-semibold mb-4 text-foreground">Përgjigje e Shpejtë</h3>
              <p className="text-muted-foreground">
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