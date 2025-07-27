import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { MessageCircle } from "lucide-react";

interface InspectionRequestFormProps {
  trigger: React.ReactNode;
}

const InspectionRequestForm = ({ trigger }: InspectionRequestFormProps) => {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: ""
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Create WhatsApp message
    const message = `Kërkesë për Inspektim - KORAUTO\n\nEmri: ${formData.firstName}\nMbiemri: ${formData.lastName}\nEmail: ${formData.email}\nTelefon: ${formData.phone}\n\nTë përshëndet! Unë dëshiroj të kërkojë shërbimin e inspektimit të makinës nga KORAUTO. Ju lutem më kontaktoni për detaje të mëtejshme.`;
    
    const whatsappUrl = `https://wa.me/38348181116?text=${encodeURIComponent(message)}`;
    
    // Open WhatsApp
    window.open(whatsappUrl, '_blank');
    
    // Also send email notification (this would typically be done through a backend service)
    const emailSubject = "Kërkesë e Re për Inspektim - KORAUTO";
    const emailBody = `Kërkesë e re për inspektim të makinës:\n\nEmri: ${formData.firstName}\nMbiemri: ${formData.lastName}\nEmail: ${formData.email}\nTelefon: ${formData.phone}`;
    
    // For demo purposes, we'll just show a toast
    toast({
      title: "Kërkesa u Dërgua",
      description: "Kërkesa juaj për inspektim u dërgua me sukses! Do t'ju kontaktojmë së shpejti.",
      duration: 5000,
    });

    // Reset form and close dialog
    setFormData({ firstName: "", lastName: "", email: "", phone: "" });
    setIsOpen(false);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

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
                    placeholder="Emri juaj"
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">Mbiemri</Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) => handleInputChange("lastName", e.target.value)}
                    required
                    placeholder="Mbiemri juaj"
                  />
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
                  placeholder="email@shembull.com"
                />
              </div>
              
              <div>
                <Label htmlFor="phone">Numri i Telefonit</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleInputChange("phone", e.target.value)}
                  required
                  placeholder="+383 XX XXX XXX"
                />
              </div>
              
              <Button type="submit" className="w-full bg-primary hover:bg-primary/90">
                Dërgo Kërkesën
              </Button>
            </form>
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  );
};

export default InspectionRequestForm;