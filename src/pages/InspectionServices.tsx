import { useEffect } from "react";
import { trackPageView } from "@/utils/analytics";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Shield, Wrench, FileText, Camera, Clock, ArrowLeft, Star, Users, Award, Gauge, Settings, Search, AlertTriangle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import InspectionRequestForm from "@/components/InspectionRequestForm";
const InspectionServices = () => {
  useEffect(() => {
    // Track inspection services page view
    trackPageView(undefined, { page_type: 'inspection_services' });
  }, []);

  const navigate = useNavigate();
  const inspectionSteps = [{
    icon: Search,
    title: "Inspektimi i Jashtëm",
    description: "Kontrollojmë karocerinë, ngjyrën, dëmtimet, gomrat dhe sistemin e ndriçimit",
    details: ["Kontrolli i karocerisë për korrozion", "Vlerësimi i gjendjes së ngjyrës", "Inspektimi i dritareve dhe pasqyrave", "Kontrolli i gomrave dhe rrotave"]
  }, {
    icon: Wrench,
    title: "Inspektimi i Motorit",
    description: "Testimi i plotë i motorit, transmisionit dhe sistemeve kryesore",
    details: ["Diagnostikimi elektronik", "Kontrolli i niveleve të lëngjeve", "Testimi i performancës së motorit", "Inspektimi i transmisionit"]
  }, {
    icon: Shield,
    title: "Sistemet e Sigurisë",
    description: "Verifikimi i frënave, airbag-ëve dhe sistemeve të sigurisë",
    details: ["Testimi i sistemit të frënimit", "Kontrolli i airbag-ëve", "Inspektimi i qendrimeve të sigurisë", "Verifikimi i çelësave dhe kyçjeve"]
  }, {
    icon: Settings,
    title: "Inspektimi Elektronik",
    description: "Kontrolli i sistemeve elektrike dhe elektronike të automjetit",
    details: ["Diagnostikimi me kompjuter", "Kontrolli i sistemit të ndezjes", "Testimi i klimatizimit", "Verifikimi i sistemeve multimediale"]
  }, {
    icon: FileText,
    title: "Dokumentacioni",
    description: "Verifikimi i dokumentacionit dhe historisë së automjetit",
    details: ["Kontrolli i VIN numrit", "Verifikimi i historisë së aksidenteve", "Kontrolli i dokumenteve ligjore", "Raport i detajuar me foto"]
  }, {
    icon: Camera,
    title: "Dokumentimi Fotografik",
    description: "Fotografim profesional i çdo detaji të rëndësishëm",
    details: ["Foto me rezolucion të lartë", "Dokumentim i dëmtimeve", "Foto të motorit dhe komponentëve", "Album i plotë fotografik"]
  }];
  const benefits = [{
    icon: Shield,
    title: "Inspektim FALAS",
    description: "Ofrojmë inspektim të plotë pa asnjë kosto për të gjithë klientët tanë"
  }, {
    icon: Award,
    title: "Kontratë Garancioni",
    description: "Nënshkruajmë kontratë zyrtare për garanci të motorit, transmisionit dhe kilometrazhit"
  }, {
    icon: Clock,
    title: "Shërbim i Shpejtë",
    description: "Raport të detajuar brenda 24-48 orësh pas inspektimit"
  }, {
    icon: Users,
    title: "Ekspertizë 10+ Vjetëshe",
    description: "Mekanikë të certifikuar dhe të trajnuar për të gjitha markat e makinave"
  }];
  return <div className="min-h-screen bg-background text-foreground animate-fade-in">
      {/* Header */}
      <div className="bg-foreground text-background py-12 sm:py-16 lg:py-20 animate-slide-in-up">
        <div className="container-responsive">
          <div className="flex items-center gap-3 sm:gap-4 mb-6 sm:mb-8">
            <Button variant="secondary" onClick={() => navigate('/')} className="flex items-center gap-2 btn-press-effect">
              <ArrowLeft className="h-4 w-4" />
              Kryefaqja
            </Button>
          </div>
          
          <div className="max-w-5xl">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 sm:mb-6 animate-scale-in">
              Inspektimi FALAS i Automjeteve
            </h1>
            <p className="text-lg sm:text-xl md:text-2xl opacity-90 mb-6 sm:mb-8 leading-relaxed">Shërbime të specializuara inspektimi pa pagesë për makina nga Koreja e Jugut dhe nënshkruajmë kontratë garancioni për motorin, transmisionin dhe kilometrazhin pas blerjes!</p>
            
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <Button size="lg" variant="secondary" className="px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg btn-press-effect shadow-[var(--shadow-md)] hover:shadow-[var(--shadow-lg)]" onClick={() => window.open('/garancioni', '_blank')}>
                <Shield className="h-5 w-5 mr-2" />
                Mëso më shumë për Garancionin
              </Button>
              <InspectionRequestForm trigger={<Button size="lg" variant="secondary" className="px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg btn-press-effect shadow-[var(--shadow-md)] hover:shadow-[var(--shadow-lg)]">
                    <FileText className="h-5 w-5 mr-2" />
                    Kërko Inspektim Tani
                  </Button>} carId="general" carMake="N/A" carModel="N/A" carYear={new Date().getFullYear()} />
              <Button size="lg" variant="secondary" className="px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg btn-press-effect shadow-[var(--shadow-md)] hover:shadow-[var(--shadow-lg)]" onClick={() => window.open('tel:+38348181116', '_self')}>
                <Shield className="h-5 w-5 mr-2" />
                Kontakto Ekspertët
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container-responsive py-12 sm:py-16 lg:py-20">
        {/* Why Choose Our Inspection */}
        <section className="mb-16 sm:mb-20">
          <div className="text-center mb-10 sm:mb-12 animate-slide-in-up">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4 sm:mb-6 text-foreground">
              Pse të Zgjidhni KORAUTO?
            </h2>
            <p className="text-lg sm:text-xl md:text-2xl text-muted-foreground max-w-4xl mx-auto px-4">
              Ofrojmë shërbime inspektimi të nivelit më të lartë me teknologji moderne dhe ekspertizë të provuar
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 stagger-animation">
            {benefits.map((benefit, index) => <Card key={index} className="glass-card text-center card-hover">
                <CardHeader className="pb-4">
                  <div className="mx-auto w-14 h-14 sm:w-16 sm:h-16 bg-foreground rounded-xl flex items-center justify-center mb-4 shadow-[var(--shadow-md)] transform transition-transform hover:scale-110">
                    <benefit.icon className="h-7 w-7 sm:h-8 sm:w-8 text-background" />
                  </div>
                  <CardTitle className="text-lg sm:text-xl text-foreground">{benefit.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-sm sm:text-base">{benefit.description}</p>
                </CardContent>
              </Card>)}
          </div>
        </section>

        {/* Inspection Process */}
        <section className="mb-16 sm:mb-20">
          <div className="text-center mb-10 sm:mb-12 animate-slide-in-up">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4 sm:mb-6 text-foreground">
              Procesi Ynë i Inspektimit
            </h2>
            <p className="text-lg sm:text-xl md:text-2xl text-muted-foreground max-w-4xl mx-auto px-4">
              Një proces i detajuar dhe sistematik që garanton inspektimin e plotë të çdo komponenti
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 stagger-animation">
            {inspectionSteps.map((step, index) => <Card key={index} className="glass-card card-hover">
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-3 sm:gap-4 mb-4">
                    <div className="w-12 h-12 sm:w-14 sm:h-14 bg-foreground rounded-xl flex items-center justify-center shadow-[var(--shadow-md)] transform transition-transform hover:scale-110">
                      <step.icon className="h-6 w-6 sm:h-7 sm:w-7 text-background" />
                    </div>
                    <div>
                      <Badge variant="secondary" className="mb-2 bg-secondary text-secondary-foreground text-xs sm:text-sm">Hapi {index + 1}</Badge>
                      <CardTitle className="text-base sm:text-lg md:text-xl text-foreground">{step.title}</CardTitle>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-muted-foreground text-sm sm:text-base">{step.description}</p>
                  <ul className="space-y-2">
                    {step.details.map((detail, idx) => <li key={idx} className="flex items-start gap-2 text-xs sm:text-sm">
                        <CheckCircle className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                        <span className="text-muted-foreground">{detail}</span>
                      </li>)}
                  </ul>
                </CardContent>
              </Card>)}
          </div>
        </section>

        {/* CTA Section */}
        <section className="text-center bg-foreground text-background rounded-2xl sm:rounded-3xl p-8 sm:p-10 lg:p-12 shadow-[var(--shadow-xl)] animate-scale-in">
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4 sm:mb-6">
            Gati për Inspektim FALAS?
          </h2>
          <p className="text-lg sm:text-xl md:text-2xl opacity-90 mb-6 sm:mb-8 max-w-3xl mx-auto px-4">
            Inspektimi është krejtësisht falas! Kontaktoni ekspertët tanë për një vlerësim të plotë të automjetit.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
            <InspectionRequestForm trigger={<Button size="lg" variant="secondary" className="px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg btn-press-effect shadow-[var(--shadow-md)] hover:shadow-[var(--shadow-lg)]">
                  <FileText className="h-5 w-5 mr-2" />
                  Kërko Inspektim FALAS
                </Button>} carId="cta" carMake="N/A" carModel="N/A" carYear={new Date().getFullYear()} />
            <Button size="lg" variant="secondary" className="px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg btn-press-effect shadow-[var(--shadow-md)] hover:shadow-[var(--shadow-lg)]" onClick={() => window.open('https://wa.me/38348181116', '_blank')}>
              <Shield className="h-5 w-5 mr-2" />
              WhatsApp: +383 48 181 116
            </Button>
          </div>
        </section>
      </div>
    </div>;
};
export default InspectionServices;