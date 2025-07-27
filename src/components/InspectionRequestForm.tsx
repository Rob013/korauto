import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { MessageCircle, AlertTriangle } from "lucide-react";
import { 
  inspectionFormSchema, 
  sanitizeFormData, 
  checkRateLimit,
  type InspectionFormData 
} from "@/lib/validation";

interface InspectionRequestFormProps {
  trigger: React.ReactNode;
}

const InspectionRequestForm = ({ trigger }: InspectionRequestFormProps) => {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof InspectionFormData, string>>>({});
  const [formData, setFormData] = useState<InspectionFormData>({
    firstName: "",
    lastName: "",
    email: "",
    whatsappPhone: ""
  });

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isSubmitting) return;
    
    try {
      setIsSubmitting(true);
      setErrors({});
      
      // Rate limiting check
      const clientId = `${formData.email}_${Date.now()}`;
      if (!checkRateLimit(clientId)) {
        toast({
          title: "Shumë kërkesa",
          description: "Ju keni dërguar shumë kërkesa. Prisni 1 minutë para se të provoni përsëri.",
          variant: "destructive",
          duration: 5000,
        });
        return;
      }
      
      // Validate form data
      const validationResult = inspectionFormSchema.safeParse(formData);
      
      if (!validationResult.success) {
        const validationErrors: Partial<Record<keyof InspectionFormData, string>> = {};
        validationResult.error.errors.forEach((error) => {
          if (error.path[0]) {
            validationErrors[error.path[0] as keyof InspectionFormData] = error.message;
          }
        });
        setErrors(validationErrors);
        
        toast({
          title: "Gabim në formë",
          description: "Ju lutemi korrigjoni gabimet dhe provoni përsëri.",
          variant: "destructive",
          duration: 3000,
        });
        return;
      }
      
      // Sanitize form data
      const sanitizedData = sanitizeFormData(validationResult.data);
      
      // Log form data to console (dummy endpoint)
      console.log('Inspection Request Submitted:', sanitizedData);
      
      // Create WhatsApp message for owner notification
      const ownerMessage = `🔔 Kërkesë e Re për Inspektim - KORAUTO\n\n👤 Emri: ${sanitizedData.firstName} ${sanitizedData.lastName}\n📧 Email: ${sanitizedData.email}\n📱 WhatsApp: ${sanitizedData.whatsappPhone}\n\n✅ Klient i ri kërkon shërbimin e inspektimit të makinës. Kontaktojeni sa më shpejt!`;
      
      const ownerWhatsappUrl = `https://wa.me/38348181116?text=${encodeURIComponent(ownerMessage)}`;
      
      // Open WhatsApp notification for owner
      window.open(ownerWhatsappUrl, '_blank');
      
      // Show thank you message
      toast({
        title: "Faleminderit për Kërkesën!",
        description: "Kërkesa juaj për inspektim u dërgua me sukses! Do t'ju kontaktojmë brenda 24 orëve.",
        duration: 5000,
      });

      // Reset form and close dialog
      setFormData({ firstName: "", lastName: "", email: "", whatsappPhone: "" });
      setIsOpen(false);
      
    } catch (error) {
      console.error('Form submission error:', error);
      toast({
        title: "Gabim",
        description: "Ndodhi një gabim gjatë dërgimit të kërkesës. Provoni përsëri.",
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, isSubmitting, toast]);

  const handleInputChange = useCallback((field: keyof InspectionFormData, value: string) => {
    // Clear previous error for this field
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
    
    setFormData(prev => ({ ...prev, [field]: value }));
  }, [errors]);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-primary" />
            Kërkesë për Inspektim
          </DialogTitle>
        </DialogHeader>
        <Card className="border-0 shadow-none">
          <CardContent className="p-0">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">Emri</Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) => handleInputChange("firstName", e.target.value)}
                    required
                    maxLength={50}
                    placeholder="Emri juaj"
                    className={errors.firstName ? "border-destructive" : ""}
                    disabled={isSubmitting}
                  />
                  {errors.firstName && (
                    <p className="text-sm text-destructive mt-1">{errors.firstName}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="lastName">Mbiemri</Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) => handleInputChange("lastName", e.target.value)}
                    required
                    maxLength={50}
                    placeholder="Mbiemri juaj"
                    className={errors.lastName ? "border-destructive" : ""}
                    disabled={isSubmitting}
                  />
                  {errors.lastName && (
                    <p className="text-sm text-destructive mt-1">{errors.lastName}</p>
                  )}
                </div>
              </div>
              
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  required
                  maxLength={254}
                  placeholder="email@shembull.com"
                  className={errors.email ? "border-destructive" : ""}
                  disabled={isSubmitting}
                />
                {errors.email && (
                  <p className="text-sm text-destructive mt-1">{errors.email}</p>
                )}
              </div>
              
              <div>
                <Label htmlFor="whatsappPhone">Numri i WhatsApp (format ndërkombëtar)</Label>
                <Input
                  id="whatsappPhone"
                  type="tel"
                  value={formData.whatsappPhone}
                  onChange={(e) => handleInputChange("whatsappPhone", e.target.value)}
                  required
                  maxLength={20}
                  placeholder="+38348181116"
                  className={errors.whatsappPhone ? "border-destructive" : ""}
                  disabled={isSubmitting}
                />
                {errors.whatsappPhone && (
                  <p className="text-sm text-destructive mt-1">{errors.whatsappPhone}</p>
                )}
              </div>
              
              {Object.keys(errors).length > 0 && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Ju lutemi korrigjoni gabimet në formë para se të vazhdoni.
                  </AlertDescription>
                </Alert>
              )}
              
              <Button 
                type="submit" 
                className="w-full bg-primary hover:bg-primary/90"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Duke dërguar..." : "Dërgo Kërkesën"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  );
};

export default InspectionRequestForm;