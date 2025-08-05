import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, Phone, MapPin, Clock } from "lucide-react";

const ContactSection = () => {
  return (
    <section id="contact" className="section-padding-mobile bg-background">
      <div className="container-mobile">
        <div className="text-center mb-8 sm:mb-12">
          <h2 className="heading-mobile-h2 mb-4 text-foreground">Na Kontaktoni</h2>
          <p className="text-responsive-sm text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Lidhuni me ekipin tonë për inspektime, pyetje, ose mbështetje.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 max-w-6xl mx-auto">
          <Card className="contact-card-mobile text-center h-full">
            <CardHeader className="pb-3">
              <div className="mx-auto w-14 h-14 bg-primary rounded-lg flex items-center justify-center mb-4 touch-target">
                <Mail className="h-6 w-6 text-primary-foreground" />
              </div>
              <CardTitle className="heading-mobile-h3">Email</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col justify-between">
              <p className="text-muted-foreground mb-3 text-sm sm:text-base">Dërgoni një mesazh</p>
              <a 
                href="mailto:INFO.RGSHPK@gmail.com" 
                className="text-primary hover:text-primary/80 transition-colors font-medium text-sm sm:text-base break-all touch-target"
              >
                INFO.RGSHPK@gmail.com
              </a>
            </CardContent>
          </Card>

          <Card className="contact-card-mobile text-center h-full">
            <CardHeader>
              <div className="mx-auto w-14 h-14 bg-primary rounded-lg flex items-center justify-center mb-4 touch-target">
                <MapPin className="h-6 w-6 text-primary-foreground" />
              </div>
              <CardTitle className="heading-mobile-h3">Vendndodhja</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col justify-between">
              <p className="text-muted-foreground mb-3 text-sm sm:text-base">Vizitoni zyrën tonë</p>
              <a 
                href="https://maps.google.com/?q=KORAUTO,Rr.+Ilaz+Kodra+70,Prishtinë,Kosovo" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary font-medium hover:text-primary/80 transition-colors text-sm sm:text-base touch-target"
              >
                Rr. Ilaz Kodra 70, Prishtinë
              </a>
            </CardContent>
          </Card>

          <Card className="contact-card-mobile text-center h-full">
            <CardHeader>
              <div className="mx-auto w-14 h-14 bg-primary rounded-lg flex items-center justify-center mb-4 touch-target">
                <Clock className="h-6 w-6 text-primary-foreground" />
              </div>
              <CardTitle className="heading-mobile-h3">Orari</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col justify-between">
              <p className="text-muted-foreground mb-3 text-sm sm:text-base">Jemi të disponueshëm</p>
              <div className="text-primary font-medium text-sm sm:text-base">
                <p>Çdo ditë: 9:00-18:00</p>
              </div>
            </CardContent>
          </Card>

          <Card className="contact-card-mobile text-center h-full">
            <CardHeader>
              <div className="mx-auto w-14 h-14 bg-primary rounded-lg flex items-center justify-center mb-4 touch-target">
                <Phone className="h-6 w-6 text-primary-foreground" />
              </div>
              <CardTitle className="heading-mobile-h3">Robert Gashi</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col justify-between">
              <p className="text-muted-foreground mb-3 text-sm sm:text-base">Agent shitjesh</p>
              <div className="flex-mobile-stack">
                <a 
                  href="tel:+38348181116" 
                  className="text-primary hover:text-primary/80 transition-colors font-medium text-sm sm:text-base touch-target"
                >
                  +38348181116
                </a>
                <div className="flex gap-2 justify-center">
                  <a 
                    href="https://wa.me/38348181116" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="touch-target-large text-xs sm:text-sm bg-green-500 text-white px-3 py-2 rounded hover:bg-green-600 transition-colors"
                  >
                    WhatsApp
                  </a>
                  <a 
                    href="viber://chat?number=+38348181116" 
                    className="touch-target-large text-xs sm:text-sm bg-purple-500 text-white px-3 py-2 rounded hover:bg-purple-600 transition-colors"
                  >
                    Viber
                  </a>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 max-w-6xl mx-auto mt-6">
          <Card className="contact-card-mobile text-center h-full">
            <CardHeader>
              <div className="mx-auto w-14 h-14 bg-primary rounded-lg flex items-center justify-center mb-4 touch-target">
                <Phone className="h-6 w-6 text-primary-foreground" />
              </div>
              <CardTitle className="heading-mobile-h3">Rajmond</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col justify-between">
              <p className="text-muted-foreground mb-3 text-sm sm:text-base">Agent shitjesh</p>
              <div className="flex-mobile-stack">
                <a 
                  href="tel:+38346105588" 
                  className="text-primary hover:text-primary/80 transition-colors font-medium text-sm sm:text-base touch-target"
                >
                  +38346105588
                </a>
                <div className="flex gap-2 justify-center">
                  <a 
                    href="https://wa.me/38346105588" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="touch-target-large text-xs sm:text-sm bg-green-500 text-white px-3 py-2 rounded hover:bg-green-600 transition-colors"
                  >
                    WhatsApp
                  </a>
                  <a 
                    href="viber://chat?number=+38346105588" 
                    className="touch-target-large text-xs sm:text-sm bg-purple-500 text-white px-3 py-2 rounded hover:bg-purple-600 transition-colors"
                  >
                    Viber
                  </a>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="contact-card-mobile text-center h-full">
            <CardHeader>
              <div className="mx-auto w-14 h-14 bg-primary rounded-lg flex items-center justify-center mb-4 touch-target">
                <Phone className="h-6 w-6 text-primary-foreground" />
              </div>
              <CardTitle className="heading-mobile-h3">Renato</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col justify-between">
              <p className="text-muted-foreground mb-3 text-sm sm:text-base">Agent shitjesh</p>
              <div className="flex-mobile-stack">
                <a 
                  href="tel:+38348181117" 
                  className="text-primary hover:text-primary/80 transition-colors font-medium text-sm sm:text-base touch-target"
                >
                  +38346181117
                </a>
                <div className="flex gap-2 justify-center">
                  <a 
                    href="https://wa.me/38348181117" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="touch-target-large text-xs sm:text-sm bg-green-500 text-white px-3 py-2 rounded hover:bg-green-600 transition-colors"
                  >
                    WhatsApp
                  </a>
                  <a 
                    href="viber://chat?number=+38348181117" 
                    className="touch-target-large text-xs sm:text-sm bg-purple-500 text-white px-3 py-2 rounded hover:bg-purple-600 transition-colors"
                  >
                    Viber
                  </a>
                </div>
              </div>
            </CardContent>
          </Card> 
        </div>

        <div className="text-center mt-8 sm:mt-12">
          <Card className="max-w-2xl mx-auto bg-muted/50 card-mobile">
            <CardContent className="p-6 sm:p-8">
              <h3 className="heading-mobile-h3 mb-4 text-foreground">Përgjigje e Shpejtë</h3>
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