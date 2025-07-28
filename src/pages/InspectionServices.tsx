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
      title: "Inspektim FALAS",
      description: "Ofrojmë inspektim të plotë pa asnjë kosto për të gjithë klientët tanë"
    },
    {
      icon: Award,
      title: "Kontratë Garancioni",
      description: "Nënshkruajmë kontratë zyrtare për garanci të motorit, transmisionit dhe kilometrazhit"
    },
    {
      icon: Clock,
      title: "Shërbim i Shpejtë",
      description: "Raport të detajuar brenda 24-48 orësh pas inspektimit"
    },
    {
      icon: Users,
      title: "Ekspertizë 10+ Vjetëshe",
      description: "Mekanikë të certifikuar dhe të trajnuar për të gjitha markat e makinave"
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
              Inspektimi FALAS i Automjeteve
            </h1>
            <p className="text-xl md:text-2xl opacity-90 mb-8">
              Shërbime të specializuara inspektimi pa pagesë për makina nga Koreja e Jugut dhe Evropa. 
              Nënshkruajmë kontratë garancioni për motorin, transmisionin dhe kilometrazhin pas blerjes!
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

        {/* Guarantee Contract Section */}
        <section className="mb-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">
              Kontrata e Garancisë
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Pas blerjes së automjetit, nënshkruajmë kontratë zyrtare për garantimin e komponentëve kryesorë
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <Card className="text-center card-enhanced bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950 dark:to-emerald-900 border-emerald-200 dark:border-emerald-800">
              <CardHeader>
                <div className="mx-auto w-16 h-16 bg-emerald-600 rounded-full flex items-center justify-center mb-4">
                  <Wrench className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-xl text-emerald-700 dark:text-emerald-300">Garanci e Motorit</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-emerald-600 dark:text-emerald-400 font-medium mb-4">Garantuar</p>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                    <span>Performanca e motorit</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                    <span>Sistemi i ftohjes</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                    <span>Sistemi i vajit</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="text-center card-enhanced bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border-blue-200 dark:border-blue-800">
              <CardHeader>
                <div className="mx-auto w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mb-4">
                  <Settings className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-xl text-blue-700 dark:text-blue-300">Garanci e Transmisionit</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-blue-600 dark:text-blue-400 font-medium mb-4">Garantuar</p>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-blue-500 flex-shrink-0" />
                    <span>Funksionimi i transmisionit</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-blue-500 flex-shrink-0" />
                    <span>Ndryshimi i marsheve</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-blue-500 flex-shrink-0" />
                    <span>Sistemi i bashkimit</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="text-center card-enhanced bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 border-purple-200 dark:border-purple-800">
              <CardHeader>
                <div className="mx-auto w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center mb-4">
                  <Gauge className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-xl text-purple-700 dark:text-purple-300">Garanci e Kilometrazhit</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-purple-600 dark:text-purple-400 font-medium mb-4">100% e garantuar</p>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-purple-500 flex-shrink-0" />
                    <span>Vërtetësia e kilometrazhit</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-purple-500 flex-shrink-0" />
                    <span>Kontrolli me kompjuter</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-purple-500 flex-shrink-0" />
                    <span>Certifikim zyrtar</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>

          <div className="mt-12 text-center">
            <Card className="max-w-4xl mx-auto bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
              <CardContent className="p-8">
                <div className="flex items-center justify-center gap-3 mb-4">
                  <FileText className="h-8 w-8 text-primary" />
                  <h3 className="text-2xl font-bold text-foreground">Kontrata Zyrtare e Garancisë</h3>
                </div>
                <p className="text-lg text-muted-foreground mb-6">
                  Pas konfirmimit të blerjes, nënshkruajmë kontratë legale që garanton cilësinë e automjetit dhe komponentëve të sipërpërmendur. 
                  Kjo kontratë ju jep siguri dhe mbështetje ligjore për investimin tuaj.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <InspectionRequestForm 
                    trigger={
                      <Button size="lg" className="px-8 py-3">
                        <FileText className="h-5 w-5 mr-2" />
                        Kërko Detaje për Kontratën
                      </Button>
                    }
                    carId="contract"
                    carMake="Garanci"
                    carModel="Kontratë"
                    carYear={new Date().getFullYear()}
                  />
                </div>
              </CardContent>
            </Card>
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
            Gati për Inspektim FALAS?
          </h2>
          <p className="text-xl opacity-90 mb-8 max-w-2xl mx-auto">
            Inspektimi është krejtësisht falas! Kontaktoni ekspertët tanë për një vlerësim të plotë të automjetit.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <InspectionRequestForm 
              trigger={
                <Button size="lg" variant="secondary" className="px-8 py-4 text-lg">
                  <FileText className="h-5 w-5 mr-2" />
                  Kërko Inspektim FALAS
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