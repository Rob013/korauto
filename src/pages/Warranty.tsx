import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import WarrantyContent from "@/components/WarrantyContent";

const Warranty = () => {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container-responsive py-8 space-y-6">
        <Card className="shadow-md border-border/70">
          <CardHeader>
            <CardTitle>Gjendja Teknike e Automjetit</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm leading-6 text-muted-foreground">
            <WarrantyContent />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Warranty;
