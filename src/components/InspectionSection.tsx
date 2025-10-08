import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Shield, FileText, Camera, Clock } from "lucide-react";
import InspectionRequestForm from "./InspectionRequestForm";
import { useLanguage } from "@/contexts/LanguageContext";

const InspectionSection = () => {
  const { t } = useLanguage();
  
  const inspectionSteps = [
    {
      icon: <Shield className="h-8 w-8" />,
      title: t("inspection.step1.title"),
      description: t("inspection.step1.desc")
    },
    {
      icon: <Camera className="h-8 w-8" />,
      title: t("inspection.step2.title"),
      description: t("inspection.step2.desc")
    },
    {
      icon: <FileText className="h-8 w-8" />,
      title: t("inspection.step3.title"),
      description: t("inspection.step3.desc")
    },
    {
      icon: <Clock className="h-8 w-8" />,
      title: t("inspection.step4.title"),
      description: t("inspection.step4.desc")
    }
  ];

  return (
    <section id="inspection" className="py-16 bg-muted/50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4 text-foreground">{t("inspection.title")}</h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            {t("inspection.description")}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Process Steps */}
          <div className="space-y-6">
            <h3 className="text-2xl font-semibold mb-6 text-foreground">{t("inspection.howItWorks")}</h3>
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
                <CardTitle className="text-3xl">{t("inspection.price")}</CardTitle>
                <p className="text-primary-foreground/90">{t("inspection.priceDesc")}</p>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <h3 className="text-xl font-semibold text-center mb-4 text-foreground">
                  {t("inspection.whatsIncluded")}
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                    <span className="text-sm text-foreground">{t("inspection.feature1")}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                    <span className="text-sm text-foreground">{t("inspection.feature2")}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                    <span className="text-sm text-foreground">{t("inspection.feature3")}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                    <span className="text-sm text-foreground">{t("inspection.feature4")}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                    <span className="text-sm text-foreground">{t("inspection.feature5")}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                    <span className="text-sm text-foreground">{t("inspection.feature6")}</span>
                  </div>
                </div>
                
                <InspectionRequestForm
                  trigger={
                    <Button 
                      className="w-full bg-inspection hover:bg-inspection/90 text-inspection-foreground mt-6" 
                      size="lg"
                    >
                      {t("inspection.request")}
                    </Button>
                  }
                  carId={undefined}
                  carMake={undefined}
                  carModel={undefined}
                  carYear={undefined}
                />
              </CardContent>
            </Card>

            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-2">
                {t("inspection.trustedBy")}
              </p>
              <div className="flex justify-center items-center space-x-2">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="w-5 h-5 bg-yellow-400 rounded-full" />
                ))}
                <span className="ml-2 text-sm font-medium text-foreground">4.9/5 {t("inspection.rating")}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default InspectionSection;