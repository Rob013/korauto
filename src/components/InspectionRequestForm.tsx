import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { MessageCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface InspectionRequestFormProps {
  trigger: React.ReactNode;
  carId?: string;
  carMake?: string;
  carModel?: string;
  carYear?: number;
}

const InspectionRequestForm = ({ trigger, carId, carMake, carModel, carYear }: InspectionRequestFormProps) => {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    whatsappPhone: ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    console.log('Form submitted');
    console.log('Form data:', formData);
    
    try {
      // Store in Supabase database
      const { error } = await supabase
        .from('inspection_requests')
        .insert({
          customer_name: `${formData.firstName} ${formData.lastName}`,
          customer_email: formData.email,
          customer_phone: formData.whatsappPhone,
          car_id: carId,
          car_make: carMake,
          car_model: carModel,
          car_year: carYear
        });

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      // Send email notifications
      try {
        await supabase.functions.invoke('send-inspection-notification', {
          body: {
            customer_name: `${formData.firstName} ${formData.lastName}`,
            customer_email: formData.email,
            customer_phone: formData.whatsappPhone,
            car_make: carMake,
            car_model: carModel,
            car_year: carYear
          }
        });
      } catch (emailError) {
        console.error('Email notification failed:', emailError);
        // Don't fail the whole process if email fails
      }

      // Send WhatsApp notification
      const carInfo = carMake && carModel && carYear ? `🚗 Makina: ${carYear} ${carMake} ${carModel}\n` : '';
      const ownerMessage = `🔔 Kërkesë e Re për Inspektim - KORAUTO\n\n👤 Emri: ${formData.firstName} ${formData.lastName}\n📧 Email: ${formData.email}\n📱 WhatsApp: ${formData.whatsappPhone}\n${carInfo}✅ Klient i ri kërkon shërbimin e inspektimit të makinës. Kontaktojeni sa më shpejt!`;
      
      const ownerWhatsappUrl = `https://wa.me/38348181116?text=${encodeURIComponent(ownerMessage)}`;
      window.open(ownerWhatsappUrl, '_blank');
      
      toast({
        title: "Faleminderit për Kërkesën!",
        description: "Kërkesa juaj për inspektim u dërgua me sukses! Do t'ju kontaktojmë brenda 24 orëve.",
        duration: 5000,
      });

      // Reset form and close dialog
      setFormData({ firstName: "", lastName: "", email: "", whatsappPhone: "" });
      setIsOpen(false);
      
    } catch (error) {
      console.error('Failed to submit inspection request:', error);
      
      // Fallback - still send WhatsApp message
      const carInfo = carMake && carModel && carYear ? `🚗 Makina: ${carYear} ${carMake} ${carModel}\n` : '';
      const ownerMessage = `🔔 Kërkesë e Re për Inspektim - KORAUTO\n\n👤 Emri: ${formData.firstName} ${formData.lastName}\n📧 Email: ${formData.email}\n📱 WhatsApp: ${formData.whatsappPhone}\n${carInfo}✅ Klient i ri kërkon shërbimin e inspektimit të makinës. Kontaktojeni sa më shpejt!`;
      
      const ownerWhatsappUrl = `https://wa.me/38348181116?text=${encodeURIComponent(ownerMessage)}`;
      window.open(ownerWhatsappUrl, '_blank');
      
      toast({
        title: "Kërkesa u Dërgua",
        description: "Kërkesa juaj u dërgua përmes WhatsApp. Do t'ju kontaktojmë së shpejti!",
        duration: 5000,
      });

      // Reset form and close dialog
      setFormData({ firstName: "", lastName: "", email: "", whatsappPhone: "" });
      setIsOpen(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto mx-4 sm:mx-auto" aria-describedby="inspection-form-description">
        <DialogHeader className="pb-4">
          <DialogTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <MessageCircle className="h-5 w-5 text-primary" />
            Kërkesë për Inspektim
          </DialogTitle>
          <p id="inspection-form-description" className="text-sm text-muted-foreground">
            Plotësoni formularin për të kërkuar shërbimin e inspektimit të makinës.
          </p>
        </DialogHeader>
        <Card className="border-0 shadow-none">
          <CardContent className="p-0">
            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <Label htmlFor="firstName" className="text-sm font-medium">Emri</Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) => handleInputChange("firstName", e.target.value)}
                    required
                    placeholder="Emri juaj"
                    className="mt-1 h-11"
                  />
                </div>
                <div>
                  <Label htmlFor="lastName" className="text-sm font-medium">Mbiemri</Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) => handleInputChange("lastName", e.target.value)}
                    required
                    placeholder="Mbiemri juaj"
                    className="mt-1 h-11"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="email" className="text-sm font-medium">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  required
                  placeholder="email@shembull.com"
                  className="mt-1 h-11"
                />
              </div>
              
              <div>
                <Label htmlFor="whatsappPhone" className="text-sm font-medium">Numri i WhatsApp (format ndërkombëtar)</Label>
                <Input
                  id="whatsappPhone"
                  type="tel"
                  value={formData.whatsappPhone}
                  onChange={(e) => handleInputChange("whatsappPhone", e.target.value)}
                  required
                  placeholder="+38348181116"
                  className="mt-1 h-11"
                />
              </div>

              <div className="bg-muted p-3 sm:p-4 rounded-lg text-sm">
                <h4 className="font-semibold mb-2">Informacione:</h4>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• Do të kontaktoheni brenda 24 orëve</li>
                  <li>• Shërbimi i inspektimit është falas</li>
                  <li>• Mbajeni me vete dokumentet e makinës</li>
                </ul>
              </div>
              
              <Button type="submit" className="w-full bg-primary hover:bg-primary/90 h-11 sm:h-12 text-base font-medium">
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