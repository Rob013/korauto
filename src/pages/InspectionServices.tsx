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
  return <div className="min-h-screen bg-white text-black">
      {/* Header - Modern Black Theme */}
      <div className="bg-black text-white py-20 relative overflow-hidden">
        {/* Subtle geometric background pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-0 left-0 w-96 h-96 border border-white rounded-full transform -translate-x-48 -translate-y-48"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 border border-white rounded-full transform translate-x-48 translate-y-48"></div>
        </div>
        
        <div className="container-responsive relative z-10">
          <div className="flex items-center gap-4 mb-12">
            <Button variant="outline" onClick={() => navigate('/')} className="flex items-center gap-2 border-white text-white hover:bg-white hover:text-black transition-all">
              <ArrowLeft className="h-4 w-4" />
              Kryefaqja
            </Button>
          </div>
          
          <div className="max-w-5xl">
            <div className="mb-6">
              <Badge className="bg-white text-black text-sm px-4 py-2 mb-4">SHËRBIM PROFESIONAL</Badge>
            </div>
            <h1 className="text-5xl md:text-7xl font-black mb-8 leading-tight">
              Inspektimi{" "}
              <span className="relative">
                <span className="bg-white text-black px-4 py-2">FALAS</span>
              </span>{" "}
              i Automjeteve
            </h1>
            <p className="text-xl md:text-2xl text-gray-300 mb-10 max-w-4xl leading-relaxed">
              Shërbime të specializuara inspektimi pa pagesë për makina nga Koreja e Jugut. 
              Nënshkruajmë kontratë garancioni për motorin, transmisionin dhe kilometrazhin pas blerjes!
            </p>
            
            <div className="flex flex-col sm:flex-row gap-6">
              <InspectionRequestForm trigger={<Button size="lg" className="bg-white text-black hover:bg-gray-100 px-10 py-6 text-lg font-bold border-0 shadow-xl transform hover:scale-105 transition-all">
                    <FileText className="h-6 w-6 mr-3" />
                    Kërko Inspektim Tani
                  </Button>} carId="general" carMake="N/A" carModel="N/A" carYear={new Date().getFullYear()} />
              <Button size="lg" variant="outline" className="border-2 border-white text-white hover:bg-white hover:text-black px-10 py-6 text-lg font-bold transform hover:scale-105 transition-all" onClick={() => window.open('tel:+38348181116', '_self')}>
                <Shield className="h-6 w-6 mr-3" />
                Kontakto Ekspertët
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container-responsive py-20 bg-white">
        {/* Why Choose Our Inspection - Modern Grid Layout */}
        <section className="mb-24">
          <div className="text-center mb-16">
            <Badge className="bg-black text-white text-sm px-4 py-2 mb-6">PËRPARËSITË TONA</Badge>
            <h2 className="text-4xl md:text-5xl font-black mb-6 text-black leading-tight">
              Pse të Zgjidhni{" "}
              <span className="relative">
                <span className="bg-black text-white px-4 py-2">KORAUTO</span>
              </span>?
            </h2>
            <p className="text-xl text-gray-600 max-w-4xl mx-auto leading-relaxed">
              Ofrojmë shërbime inspektimi të nivelit më të lartë me teknologji moderne dhe ekspertizë të provuar
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {benefits.map((benefit, index) => (
              <div key={index} className="group">
                <div className="bg-white border-2 border-gray-100 hover:border-black transition-all duration-300 p-8 text-center h-full transform hover:-translate-y-2 hover:shadow-2xl">
                  <div className="mx-auto w-20 h-20 bg-black group-hover:bg-white border-2 border-black rounded-2xl flex items-center justify-center mb-6 transition-all duration-300">
                    <benefit.icon className="h-10 w-10 text-white group-hover:text-black transition-all duration-300" />
                  </div>
                  <h3 className="text-xl font-bold text-black mb-4 group-hover:text-black">{benefit.title}</h3>
                  <p className="text-gray-600 group-hover:text-gray-800 leading-relaxed">{benefit.description}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Inspection Process - Modern Timeline Layout */}
        <section className="mb-24 bg-gray-50 py-20 -mx-8 px-8 rounded-3xl">
          <div className="text-center mb-16">
            <Badge className="bg-black text-white text-sm px-4 py-2 mb-6">PROCESI YNË</Badge>
            <h2 className="text-4xl md:text-5xl font-black mb-6 text-black leading-tight">
              Inspektimi i{" "}
              <span className="relative">
                <span className="bg-black text-white px-4 py-2">Detajuar</span>
              </span>
            </h2>
            <p className="text-xl text-gray-600 max-w-4xl mx-auto leading-relaxed">
              Një proces i detajuar dhe sistematik që garanton inspektimin e plotë të çdo komponenti
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {inspectionSteps.map((step, index) => (
              <div key={index} className="group relative">
                {/* Step number */}
                <div className="absolute -top-4 -left-4 w-12 h-12 bg-black text-white rounded-full flex items-center justify-center font-bold text-lg z-10">
                  {index + 1}
                </div>
                
                <div className="bg-white border-2 border-gray-200 group-hover:border-black transition-all duration-300 p-8 h-full transform group-hover:-translate-y-2 group-hover:shadow-2xl rounded-2xl">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-16 h-16 bg-black group-hover:bg-white border-2 border-black rounded-xl flex items-center justify-center transition-all duration-300">
                      <step.icon className="h-8 w-8 text-white group-hover:text-black transition-all duration-300" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-black group-hover:text-black">{step.title}</h3>
                    </div>
                  </div>
                  <p className="text-gray-600 group-hover:text-gray-800 mb-6 leading-relaxed">{step.description}</p>
                  <ul className="space-y-3">
                    {step.details.map((detail, idx) => (
                      <li key={idx} className="flex items-start gap-3 text-sm">
                        <CheckCircle className="h-5 w-5 text-black flex-shrink-0 mt-0.5" />
                        <span className="text-gray-700">{detail}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* CTA Section - Modern Black Design */}
        <section className="bg-black text-white rounded-3xl p-12 md:p-16 text-center relative overflow-hidden">
          {/* Background pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-1/2 left-1/2 w-96 h-96 border border-white rounded-full transform -translate-x-1/2 -translate-y-1/2"></div>
            <div className="absolute top-1/4 left-1/4 w-32 h-32 border border-white rounded-full"></div>
            <div className="absolute bottom-1/4 right-1/4 w-24 h-24 border border-white rounded-full"></div>
          </div>
          
          <div className="relative z-10">
            <Badge className="bg-white text-black text-sm px-4 py-2 mb-8">FALAS & PROFESIONAL</Badge>
            <h2 className="text-4xl md:text-5xl font-black mb-6 leading-tight">
              Gati për Inspektim{" "}
              <span className="relative">
                <span className="bg-white text-black px-4 py-2">FALAS</span>
              </span>?
            </h2>
            <p className="text-xl text-gray-300 mb-12 max-w-3xl mx-auto leading-relaxed">
              Inspektimi është krejtësisht falas! Kontaktoni ekspertët tanë për një vlerësim të plotë të automjetit.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <InspectionRequestForm trigger={<Button size="lg" className="bg-white text-black hover:bg-gray-100 px-10 py-6 text-lg font-bold border-0 shadow-xl transform hover:scale-105 transition-all">
                    <FileText className="h-6 w-6 mr-3" />
                    Kërko Inspektim FALAS
                  </Button>} carId="cta" carMake="N/A" carModel="N/A" carYear={new Date().getFullYear()} />
              <Button size="lg" variant="outline" className="border-2 border-white text-white hover:bg-white hover:text-black px-10 py-6 text-lg font-bold transform hover:scale-105 transition-all" onClick={() => window.open('https://wa.me/38348181116', '_blank')}>
                <Shield className="h-6 w-6 mr-3" />
                WhatsApp: +383 48 181 116
              </Button>
            </div>
          </div>
        </section>
      </div>
    </div>;
};
export default InspectionServices;