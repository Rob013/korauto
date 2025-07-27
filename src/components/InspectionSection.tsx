import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Shield, FileText, Camera, Clock } from "lucide-react";

const InspectionSection = () => {
  const inspectionSteps = [
    {
      icon: <Shield className="h-8 w-8" />,
      title: "Professional Assessment",
      description: "Certified mechanics conduct comprehensive vehicle inspections"
    },
    {
      icon: <Camera className="h-8 w-8" />,
      title: "Photo Documentation",
      description: "Detailed visual documentation of vehicle condition"
    },
    {
      icon: <FileText className="h-8 w-8" />,
      title: "Detailed Report",
      description: "Complete condition report with recommendations"
    },
    {
      icon: <Clock className="h-8 w-8" />,
      title: "Quick Turnaround",
      description: "Inspection scheduled within 24 hours"
    }
  ];

  return (
    <section id="inspection" className="py-16 bg-muted/50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4 text-foreground">Professional Inspection Service</h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Request a professional inspection for any car for only €50. 
            Get peace of mind with our comprehensive vehicle assessment service.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Process Steps */}
          <div className="space-y-6">
            <h3 className="text-2xl font-semibold mb-6 text-foreground">How It Works</h3>
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
                <p className="text-primary-foreground/90">per vehicle inspection</p>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <h3 className="text-xl font-semibold text-center mb-4 text-foreground">
                  What's Included:
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                    <span className="text-sm text-foreground">150-point inspection checklist</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                    <span className="text-sm text-foreground">High-resolution photo documentation</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                    <span className="text-sm text-foreground">Detailed condition report</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                    <span className="text-sm text-foreground">Mechanical assessment</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                    <span className="text-sm text-foreground">Same-day report delivery</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                    <span className="text-sm text-foreground">100% satisfaction guarantee</span>
                  </div>
                </div>
                
                <Button 
                  className="w-full bg-inspection hover:bg-inspection/90 text-inspection-foreground mt-6" 
                  size="lg"
                  onClick={() => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })}
                >
                  Contact Us for Inspection
                </Button>
              </CardContent>
            </Card>

            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-2">
                Trusted by thousands of car buyers
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