import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, Phone, MapPin, Clock } from "lucide-react";

const ContactSection = () => {
  return (
    <section id="contact" className="py-16 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4 text-foreground">Contact Us</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Get in touch with our team for inspections, questions, or support.
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
              <p className="text-muted-foreground mb-2">Send us a message</p>
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
              <CardTitle className="text-lg">Phone</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-2">Call us directly</p>
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
              <CardTitle className="text-lg">Location</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-2">Visit our office</p>
              <p className="text-primary font-medium">Munich, Germany</p>
            </CardContent>
          </Card>

          <Card className="text-center hover:shadow-lg transition-shadow duration-300">
            <CardHeader>
              <div className="mx-auto w-12 h-12 bg-primary rounded-lg flex items-center justify-center mb-4">
                <Clock className="h-6 w-6 text-primary-foreground" />
              </div>
              <CardTitle className="text-lg">Hours</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-2">We're available</p>
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
              <h3 className="text-xl font-semibold mb-4 text-foreground">Quick Response</h3>
              <p className="text-muted-foreground">
                Need an inspection? Contact us and we'll schedule your professional car inspection within 24 hours. 
                Our certified mechanics are ready to provide detailed assessments for any vehicle in our listings.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default ContactSection;