import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Shield, Wrench, FileText, Camera, Clock, ArrowLeft, Star, Users, Award, Gauge, Settings, Search, AlertTriangle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import InspectionRequestForm from "@/components/InspectionRequestForm";

const InspectionServices = () => {
  const navigate = useNavigate();

  const inspectionSteps = [
    {
      icon: Search,
      title: "Inspektimi i Jashtëm",
      description: "Kontrollojmë karocerinë, ngjyrën, dëmtimet, gomrat dhe sistemin e ndriçimit",
      details: ["Kontrolli i karocerisë për korrozion", "Vlerësimi i gjendjes së ngjyrës", "Inspektimi i dritareve dhe pasqyrave", "Kontrolli i gomrave dhe rrotave"]
    },
    {
      icon: Wrench,
      title: "Inspektimi i Motorit",
      description: "Testimi i plotë i motorit, transmisionit dhe sistemeve kryesore",
      details: ["Diagnostikimi elektronik", "Kontrolli i niveleve të lëngjeve", "Testimi i performancës së motorit", "Inspektimi i transmisionit"]
    },
    {
      icon: Shield,
      title: "Sistemet e Sigurisë",
      description: "Verifikimi i frënave, airbag-ëve dhe sistemeve të sigurisë",
      details: ["Testimi i sistemit të frënimit", "Kontrolli i airbag-ëve", "Inspektimi i qendrimeve të sigurisë", "Verifikimi i çelësave dhe kyçjeve"]
    },
    {
      icon: Settings,
      title: "Inspektimi Elektronik",
      description: "Kontrolli i sistemeve elektrike dhe elektronike të automjetit",
      details: ["Diagnostikimi me kompjuter", "Kontrolli i sistemit të ndezjes", "Testimi i klimatizimit", "Verifikimi i sistemeve multimediale"]
    },
    {
      icon: FileText,
      title: "Dokumentacioni",
      description: "Verifikimi i dokumentacionit dhe historisë së automjetit",
      details: ["Kontrolli i VIN numrit", "Verifikimi i historisë së aksidenteve", "Kontrolli i dokumenteve ligjore", "Raport i detajuar me foto"]
    },
    {
      icon: Camera,
      title: "Dokumentimi Fotografik",
      description: "Fotografim profesional i çdo detaji të rëndësishëm",
      details: ["Foto me rezolucion të lartë", "Dokumentim i dëmtimeve", "Foto të motorit dhe komponentëve", "Album i plotë fotografik"]
    }
  ];

  const benefits = [
    {
      icon: Shield,
      title: "Sigurie e Garantuar",
      description: "Mekanikët tanë të certifikuar sigurojnë inspektim të plotë dhe profesional"
    },
    {
      icon: Award,
      title: "Ekspertizë e Provuar",
      description: "Mbi 10 vjet përvojë në inspektimin e automjeteve evropiane dhe aziatike"
    },
    {
      icon: Clock,
      title: "Shërbim i Shpejtë",
      description: "Raport të detajuar brenda 24-48 orësh pas inspektimit"
    },
    {
      icon: Users,
      title: "Ekip Profesional",
      description: "Mekanikë të certifikuar dhe të trajnuar për të gjitha markat e makinave"
    }
  ];

  const packages = [
    {
      name: "Inspektim Bazik",
      price: "€150",
      features: [
        "Inspektimi i jashtëm",
        "Kontrolli bazik i motorit",
        "Raport me foto",
        "Vlerësim i përgjithshëm"
      ],
      recommended: false
    },
    {
      name: "Inspektim Standard",
      price: "€250",
      features: [
        "Të gjitha nga paketa bazike",
        "Inspektim elektronik i plotë",
        "Testim në rrugë",
        "Raport i detajuar 20+ faqe",
        "Gaanci 30 ditore"
      ],
      recommended: true
    },
    {
      name: "Inspektim Premium",
      price: "€350",
      features: [
        "Të gjitha nga paketa standard",
        "Inspektim me kamera termale",
        "Analiza e vajit dhe lëngjeve",
        "Raport me video",
        "Gaanci 60 ditore",
        "Konsultim i personalizuar"
      ],
      recommended: false
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      {/* Header */}
      <div className="bg-primary text-primary-foreground py-16">
        <div className="container-responsive">
          <div className="flex items-center gap-4 mb-8">
            <Button 
              variant="secondary" 
              onClick={() => navigate('/')} 
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Kthehu
            </Button>
          </div>
          
          <div className="max-w-4xl">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Inspektimi Profesional i Automjeteve
            </h1>
            <p className="text-xl md:text-2xl opacity-90 mb-8">
              Shërbime të specializuara inspektimi për makina nga Koreja e Jugut dhe Evropa. 
              Sigurohuni për cilësinë përpara se të blini!
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <InspectionRequestForm 
                trigger={
                  <Button size="lg" variant="secondary" className="px-8 py-4 text-lg">
                    <FileText className="h-5 w-5 mr-2" />
                    Kërko Inspektim Tani
                  </Button>
                }
                carId="general"
                carMake="N/A"
                carModel="N/A" 
                carYear={new Date().getFullYear()}
              />
              <Button 
                size="lg" 
                variant="outline" 
                className="px-8 py-4 text-lg border-white text-white hover:bg-white hover:text-primary"
                onClick={() => window.open('tel:+38348181116', '_self')}
              >
                <Shield className="h-5 w-5 mr-2" />
                Kontakto Ekspertët
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container-responsive py-16">
        {/* Why Choose Our Inspection */}
        <section className="mb-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">
              Pse të Zgjidhni KORAUTO?
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Ofrojmë shërbime inspektimi të nivelit më të lartë me teknologji moderne dhe ekspertizë të provuar
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {benefits.map((benefit, index) => (
              <Card key={index} className="text-center card-enhanced">
                <CardHeader>
                  <div className="mx-auto w-16 h-16 bg-primary rounded-full flex items-center justify-center mb-4">
                    <benefit.icon className="h-8 w-8 text-primary-foreground" />
                  </div>
                  <CardTitle className="text-xl">{benefit.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{benefit.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Inspection Process */}
        <section className="mb-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">
              Procesi Ynë i Inspektimit
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Një proces i detajuar dhe sistematik që garanton inspektimin e plotë të çdo komponenti
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {inspectionSteps.map((step, index) => (
              <Card key={index} className="card-enhanced">
                <CardHeader>
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center">
                      <step.icon className="h-6 w-6 text-primary-foreground" />
                    </div>
                    <div>
                      <Badge variant="secondary" className="mb-2">Hapi {index + 1}</Badge>
                      <CardTitle className="text-xl">{step.title}</CardTitle>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-muted-foreground">{step.description}</p>
                  <ul className="space-y-2">
                    {step.details.map((detail, idx) => (
                      <li key={idx} className="flex items-center gap-2 text-sm">
                        <CheckCircle className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                        <span>{detail}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Pricing Packages */}
        <section className="mb-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">
              Paketat e Inspektimit
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Zgjidhni paketën që përshtatet më së miri me nevojat tuaja
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {packages.map((pkg, index) => (
              <Card key={index} className={`relative card-enhanced ${pkg.recommended ? 'border-primary shadow-xl scale-105' : ''}`}>
                {pkg.recommended && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-primary text-primary-foreground px-4 py-2">
                      <Star className="h-4 w-4 mr-1" />
                      Rekomanduar
                    </Badge>
                  </div>
                )}
                
                <CardHeader className="text-center">
                  <CardTitle className="text-2xl">{pkg.name}</CardTitle>
                  <div className="text-4xl font-bold text-primary mb-2">{pkg.price}</div>
                  <p className="text-muted-foreground">për automjet</p>
                </CardHeader>
                
                <CardContent className="space-y-6">
                  <ul className="space-y-3">
                    {pkg.features.map((feature, idx) => (
                      <li key={idx} className="flex items-center gap-2">
                        <CheckCircle className="h-5 w-5 text-emerald-500 flex-shrink-0" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  
                  <InspectionRequestForm 
                    trigger={
                      <Button 
                        className={`w-full py-3 ${pkg.recommended ? 'bg-primary hover:bg-primary/90' : ''}`}
                        variant={pkg.recommended ? "default" : "outline"}
                      >
                        Zgjidh {pkg.name}
                      </Button>
                    }
                    carId="package"
                    carMake={pkg.name}
                    carModel="N/A"
                    carYear={new Date().getFullYear()}
                  />
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* What We Check */}
        <section className="mb-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">
              Çfarë Kontrollojmë
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Inspektim i detajuar i mbi 200 pikave kontrolli
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                category: "Motori & Transmisioni",
                checks: ["Performanca e motorit", "Sistemi i ftohjes", "Sistemi i vajit", "Transimisioni", "Amortizatorët"]
              },
              {
                category: "Sistemi Elektrik",
                checks: ["Bateria dhe alternatori", "Sistemi i ndezjes", "Dritaret dhe sinjalet", "Sistemi i klimatizimit", "Diagnostiku elektronik"]
              },
              {
                category: "Siguria & Struktura",
                checks: ["Sistemi i frënimit", "Airbag dhe rripi sigurimi", "Struktura e karocerisë", "Pezullimi", "Drejtimi"]
              },
              {
                category: "Interiori & Komforti",
                checks: ["Ulëset dhe çapitjes", "Sistemi audio/video", "Kondicioneri", "Kontrollet elektronike", "Hapësirat ruajtëse"]
              },
              {
                category: "Eksteriori",
                checks: ["Karoceria dhe ngjyra", "Dritaret dhe xhamat", "Dritaret LED/Xenon", "Gomrat dhe rrotat", "Sistemet e sigurisë"]
              },
              {
                category: "Dokumentacioni",
                checks: ["VIN dhe numri serik", "Historia e aksidenteve", "Dokumentet ligjore", "Shërbimet e mëparshme", "Garancias dhe certifikime"]
              }
            ].map((section, index) => (
              <Card key={index} className="card-enhanced">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Gauge className="h-5 w-5 text-primary" />
                    {section.category}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {section.checks.map((check, idx) => (
                      <li key={idx} className="flex items-center gap-2 text-sm">
                        <CheckCircle className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                        <span>{check}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* CTA Section */}
        <section className="text-center bg-gradient-to-r from-primary to-primary/80 text-primary-foreground rounded-2xl p-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Gati për Inspektim Profesional?
          </h2>
          <p className="text-xl opacity-90 mb-8 max-w-2xl mx-auto">
            Mos e rrezikoni blerjen pa një inspektim të plotë. Kontaktoni ekspertët tanë sot!
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <InspectionRequestForm 
              trigger={
                <Button size="lg" variant="secondary" className="px-8 py-4 text-lg">
                  <FileText className="h-5 w-5 mr-2" />
                  Rezervo Inspektimin
                </Button>
              }
              carId="cta"
              carMake="N/A"
              carModel="N/A"
              carYear={new Date().getFullYear()}
            />
            <Button 
              size="lg" 
              variant="outline" 
              className="px-8 py-4 text-lg border-white text-white hover:bg-white hover:text-primary"
              onClick={() => window.open('https://wa.me/38348181116', '_blank')}
            >
              <Shield className="h-5 w-5 mr-2" />
              WhatsApp: +383 48 181 116
            </Button>
          </div>
        </section>
      </div>
    </div>
  );
};

export default InspectionServices;