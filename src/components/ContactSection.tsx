import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, Phone, MapPin, Clock } from "lucide-react";

const ContactSection = () => {
  return (
    <section id="contact" className="py-16 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4 text-foreground">Na Kontaktoni</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Lidhuni me ekipin tonë për inspektime, pyetje, ose mbështetje.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-4xl mx-auto">
          <Card className="text-center hover:shadow-lg transition-shadow duration-300">
            <CardHeader>
              <div className="mx-auto w-12 h-12 bg-primary rounded-lg flex items-center justify-center mb-4">
                <Mail className="h-6 w-6 text-primary-foreground" />
              </div>
              <CardTitle className="text-lg">Email</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-2">Dërgoni një mesazh</p>
              <a 
                href="mailto:info@korauto.com" 
                className="text-primary hover:text-primary/80 transition-colors font-medium"
              >
                info@korauto.com
              </a>
            </CardContent>
          </Card>

          <Card className="text-center hover:shadow-lg transition-shadow duration-300">
            <CardHeader>
              <div className="mx-auto w-12 h-12 bg-primary rounded-lg flex items-center justify-center mb-4">
                <Phone className="h-6 w-6 text-primary-foreground" />
              </div>
              <CardTitle className="text-lg">Telefoni</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-2">Na telefononi direkt</p>
              <a 
                href="tel:+49123456789" 
                className="text-primary hover:text-primary/80 transition-colors font-medium"
              >
                +49 123 456 789
              </a>
            </CardContent>
          </Card>

          <Card className="text-center hover:shadow-lg transition-shadow duration-300">
            <CardHeader>
              <div className="mx-auto w-12 h-12 bg-primary rounded-lg flex items-center justify-center mb-4">
                <MapPin className="h-6 w-6 text-primary-foreground" />
              </div>
              <CardTitle className="text-lg">Vendndodhja</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-2">Vizitoni zyrën tonë</p>
              <p className="text-primary font-medium">Munich, Germany</p>
            </CardContent>
          </Card>

          <Card className="text-center hover:shadow-lg transition-shadow duration-300">
            <CardHeader>
              <div className="mx-auto w-12 h-12 bg-primary rounded-lg flex items-center justify-center mb-4">
                <Clock className="h-6 w-6 text-primary-foreground" />
              </div>
              <CardTitle className="text-lg">Orari</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-2">Jemi të disponueshëm</p>
              <div className="text-primary font-medium">
                <p>Mon-Fri: 9:00-18:00</p>
                <p>Sat: 10:00-16:00</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="text-center mt-12">
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