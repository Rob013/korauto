import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, Phone, MapPin, Clock } from "lucide-react";

const ContactSection = () => {
  return (
    <section id="contact" className="mobile-section bg-background">
      <div className="container-responsive">
        <div className="mobile-center mb-8">
          <h2 className="mobile-title mb-4 text-foreground">Na Kontaktoni</h2>
          <p className="mobile-body text-muted-foreground max-w-2xl mx-auto">
            Lidhuni me ekipin tonë për inspektime, pyetje, ose mbështetje.
          </p>
        </div>

        <div className="grid-responsive-auto max-w-6xl mx-auto">
          <Card className="card-mobile text-center hover:shadow-lg transition-shadow duration-300 h-full">
            <CardHeader className="pb-4">
              <div className="mx-auto w-14 h-14 bg-primary rounded-lg flex items-center justify-center mb-4">
                <Mail className="h-7 w-7 text-primary-foreground" />
              </div>
              <CardTitle className="mobile-subtitle">Email</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col justify-between">
              <p className="text-muted-foreground mb-3 mobile-caption">Dërgoni një mesazh</p>
              <a 
                href="mailto:INFO.RGSHPK@gmail.com" 
                className="text-primary hover:text-primary/80 transition-colors font-medium mobile-body break-all touch-target"
              >
                INFO.RGSHPK@gmail.com
              </a>
            </CardContent>
          </Card>

          <Card className="card-mobile text-center hover:shadow-lg transition-shadow duration-300 h-full">
            <CardHeader>
              <div className="mx-auto w-14 h-14 bg-primary rounded-lg flex items-center justify-center mb-4">
                <MapPin className="h-7 w-7 text-primary-foreground" />
              </div>
              <CardTitle className="mobile-subtitle">Vendndodhja</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col justify-between">
              <p className="text-muted-foreground mb-3 mobile-caption">Vizitoni zyrën tonë</p>
              <a 
                href="https://maps.google.com/?q=KORAUTO,Rr.+Ilaz+Kodra+70,Prishtinë,Kosovo" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary font-medium hover:text-primary/80 transition-colors mobile-body touch-target"
              >
                Rr. Ilaz Kodra 70, Prishtinë
              </a>
            </CardContent>
          </Card>

          <Card className="card-mobile text-center hover:shadow-lg transition-shadow duration-300 h-full">
            <CardHeader>
              <div className="mx-auto w-14 h-14 bg-primary rounded-lg flex items-center justify-center mb-4">
                <Clock className="h-7 w-7 text-primary-foreground" />
              </div>
              <CardTitle className="mobile-subtitle">Orari</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col justify-between">
              <p className="text-muted-foreground mb-3 mobile-caption">Jemi të disponueshëm</p>
              <div className="text-primary font-medium mobile-body">
                <p>Çdo ditë: 9:00-18:00</p>
              </div>
            </CardContent>
          </Card>

          <Card className="card-mobile text-center hover:shadow-lg transition-shadow duration-300 h-full">
            <CardHeader>
              <div className="mx-auto w-14 h-14 bg-primary rounded-lg flex items-center justify-center mb-4">
                <Phone className="h-7 w-7 text-primary-foreground" />
              </div>
              <CardTitle className="mobile-subtitle">Robert Gashi</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col justify-between">
              <p className="text-muted-foreground mb-3 mobile-caption">Agent shitjesh</p>
              <div className="mobile-stack-sm">
                <a 
                  href="tel:+38348181116" 
                  className="mobile-body text-primary hover:text-primary/80 transition-colors font-medium touch-target"
                >
                  +38348181116
                </a>
                <div className="flex gap-3 justify-center">
                  <a 
                    href="https://wa.me/38348181116" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="btn-mobile bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors text-sm font-medium"
                  >
                    WhatsApp
                  </a>
                  <a 
                    href="viber://chat?number=+38348181116" 
                    className="btn-mobile bg-purple-500 text-white px-4 py-2 rounded-lg hover:bg-purple-600 transition-colors text-sm font-medium"
                  >
                    Viber
                  </a>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid-responsive-auto max-w-6xl mx-auto mt-8">
          <Card className="card-mobile text-center hover:shadow-lg transition-shadow duration-300 h-full">
            <CardHeader>
              <div className="mx-auto w-14 h-14 bg-primary rounded-lg flex items-center justify-center mb-4">
                <Phone className="h-7 w-7 text-primary-foreground" />
              </div>
              <CardTitle className="mobile-subtitle">Rajmond</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col justify-between">
              <p className="text-muted-foreground mb-3 mobile-caption">Agent shitjesh</p>
              <div className="mobile-stack-sm">
                <a 
                  href="tel:+38346105588" 
                  className="mobile-body text-primary hover:text-primary/80 transition-colors font-medium touch-target"
                >
                  +38346105588
                </a>
                <div className="flex gap-3 justify-center">
                  <a 
                    href="https://wa.me/38346105588" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="btn-mobile bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors text-sm font-medium"
                  >
                    WhatsApp
                  </a>
                  <a 
                    href="viber://chat?number=+38346105588" 
                    className="btn-mobile bg-purple-500 text-white px-4 py-2 rounded-lg hover:bg-purple-600 transition-colors text-sm font-medium"
                  >
                    Viber
                  </a>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-mobile text-center hover:shadow-lg transition-shadow duration-300 h-full">
            <CardHeader>
              <div className="mx-auto w-14 h-14 bg-primary rounded-lg flex items-center justify-center mb-4">
                <Phone className="h-7 w-7 text-primary-foreground" />
              </div>
              <CardTitle className="mobile-subtitle">Renato</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col justify-between">
              <p className="text-muted-foreground mb-3 mobile-caption">Agent shitjesh</p>
              <div className="mobile-stack-sm">
                <a 
                  href="tel:+38348181117" 
                  className="mobile-body text-primary hover:text-primary/80 transition-colors font-medium touch-target"
                >
                  +38346181117
                </a>
                <div className="flex gap-3 justify-center">
                  <a 
                    href="https://wa.me/38348181117" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="btn-mobile bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors text-sm font-medium"
                  >
                    WhatsApp
                  </a>
                  <a 
                    href="viber://chat?number=+38348181117" 
                    className="btn-mobile bg-purple-500 text-white px-4 py-2 rounded-lg hover:bg-purple-600 transition-colors text-sm font-medium"
                  >
                    Viber
                  </a>
                </div>
              </div>
            </CardContent>
          </Card> 
        </div>

        <div className="mobile-center mt-8">
          <Card className="card-mobile max-w-2xl mx-auto bg-muted/50">
            <CardContent className="mobile-padding py-8">
              <h3 className="mobile-subtitle mb-4 text-foreground">Përgjigje e Shpejtë</h3>
              <p className="mobile-body text-muted-foreground">
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