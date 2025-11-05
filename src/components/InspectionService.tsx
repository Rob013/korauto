import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Shield, FileText, Camera } from "lucide-react";

const InspectionService = () => {
  const inspectionFeatures = [
    {
      icon: <Shield className="h-6 w-6" />,
      title: "Professional Assessment",
      description: "Certified mechanics conduct thorough 150-point inspections"
    },
    {
      icon: <Camera className="h-6 w-6" />,
      title: "Photo Documentation",
      description: "High-resolution photos of exterior, interior, and engine bay"
    },
    {
      icon: <FileText className="h-6 w-6" />,
      title: "Detailed Report",
      description: "Comprehensive condition report with maintenance recommendations"
    },
    {
      icon: <CheckCircle className="h-6 w-6" />,
      title: "Quality Guarantee",
      description: "100% satisfaction guarantee or full refund policy"
    }
  ];

  return (
    <section className="py-16 bg-background">
      <div className="container-responsive">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4">Professional Inspection Service</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Get peace of mind with our comprehensive vehicle inspection service. Only €50 per car.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Features */}
          <div className="space-y-6">
            {inspectionFeatures.map((feature, index) => (
              <div key={index} className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center text-accent">
                  {feature.icon}
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>

          {/* CTA Card */}
          <div className="space-y-6">
            <Card className="border-2 border-accent/20">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">Request Inspection</CardTitle>
                <div className="text-4xl font-bold text-accent">€50</div>
                <p className="text-muted-foreground">per vehicle</p>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span className="text-sm">150-point inspection checklist</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span className="text-sm">Professional photo documentation</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span className="text-sm">Detailed condition report</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span className="text-sm">Money-back guarantee</span>
                  </div>
                </div>
                
                <Button className="w-full bg-accent hover:bg-accent/90 text-white" size="lg">
                  Request Inspection Now
                </Button>
                
                <p className="text-xs text-center text-muted-foreground">
                  Available for all listed vehicles. Inspection scheduled within 24 hours.
                </p>
              </CardContent>
            </Card>

            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-2">
                Trusted by 15,000+ buyers
              </p>
              <div className="flex justify-center space-x-2">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="w-5 h-5 bg-yellow-400 rounded-full" />
                ))}
                <span className="ml-2 text-sm font-medium">4.9/5 rating</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default InspectionService;