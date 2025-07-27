import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Shield, FileText, Camera, Clock } from "lucide-react";

const InspectionSection = () => {
  const inspectionSteps = [
    {
      icon: <Shield className="h-8 w-8" />,
      title: "Vlerësim Profesional",
      description: "Mekanikët e certifikuar kryejnë inspektime gjithëpërfshirëse të mjeteve"
    },
    {
      icon: <Camera className="h-8 w-8" />,
      title: "Dokumentim me Foto",
      description: "Dokumentim i detajuar vizual i gjendjes së mjetit"
    },
    {
      icon: <FileText className="h-8 w-8" />,
      title: "Raport i Detajuar",
      description: "Raport i plotë i gjendjes me rekomandime"
    },
    {
      icon: <Clock className="h-8 w-8" />,
      title: "Përgjigje e Shpejtë",
      description: "Inspektimi programohet brenda 24 orësh"
    }
  ];

  return (
    <section id="inspection" className="py-16 bg-muted/50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4 text-foreground">Shërbimi Profesional i Inspektimit</h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Kërkoni një inspektim profesional për çdo makinë vetëm për €50. 
            Fitoni qetësinë mendore me shërbimin tonë gjithëpërfshirës të vlerësimit të mjeteve.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Process Steps */}
          <div className="space-y-6">
            <h3 className="text-2xl font-semibold mb-6 text-foreground">Si Funksionon</h3>
            {inspectionSteps.map((step, index) => (
              <div key={index} className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-16 h-16 bg-primary rounded-lg flex items-center justify-center text-primary-foreground">
                  {step.icon}
                </div>
                <div>
                  <h4 className="font-semibold text-lg mb-2 text-foreground">{step.title}</h4>
                  <p className="text-muted-foreground">{step.description}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Service Card */}
          <div className="space-y-6">
            <Card className="border-2 border-primary/20 shadow-lg">
              <CardHeader className="text-center bg-primary text-primary-foreground">
                <CardTitle className="text-3xl">€50</CardTitle>
                <p className="text-primary-foreground/90">për inspektim mjeti</p>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <h3 className="text-xl font-semibold text-center mb-4 text-foreground">
                  Çfarë Përfshihet:
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                    <span className="text-sm text-foreground">Lista kontrolluese 150-pikëshe</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                    <span className="text-sm text-foreground">Dokumentim me foto rezolucion të lartë</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                    <span className="text-sm text-foreground">Raport i detajuar i gjendjes</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                    <span className="text-sm text-foreground">Vlerësim mekanik</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                    <span className="text-sm text-foreground">Dorëzimi i raportit të njëjtën ditë</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                    <span className="text-sm text-foreground">100% garanci kënaqësie</span>
                  </div>
                </div>
                
                <Button 
                  className="w-full bg-inspection hover:bg-inspection/90 text-inspection-foreground mt-6" 
                  size="lg"
                  onClick={() => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })}
                >
                  Na Kontaktoni për Inspektim
                </Button>
              </CardContent>
            </Card>

            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-2">
                I besuar nga mijëra blerës makinash
              </p>
              <div className="flex justify-center items-center space-x-2">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="w-5 h-5 bg-yellow-400 rounded-full" />
                ))}
                <span className="ml-2 text-sm font-medium text-foreground">4.9/5 rating</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default InspectionSection;