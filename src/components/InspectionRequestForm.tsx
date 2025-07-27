import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { MessageCircle, CreditCard, Banknote } from "lucide-react";
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
    whatsappPhone: "",
    paymentMethod: "cash"
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    console.log('Form submitted with payment method:', formData.paymentMethod);
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
          car_year: carYear,
          inspection_fee: 50.00,
          payment_status: formData.paymentMethod === "card" ? "processing" : "pending"
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
            car_year: carYear,
            inspection_fee: 50.00,
            payment_status: formData.paymentMethod === "card" ? "processing" : "pending"
          }
        });
      } catch (emailError) {
        console.error('Email notification failed:', emailError);
        // Don't fail the whole process if email fails
      }

      // Handle payment method after saving to database
      if (formData.paymentMethod === "card") {
        console.log('Processing card payment...');
        
        // Store form data before resetting it
        const customerEmail = formData.email;
        const customerName = `${formData.firstName}_${formData.lastName}`;
        
        // Show processing message for card payments
        toast({
          title: "Processing...",
          description: "Ruajmë të dhënat tuaja dhe po ju drejtojmë tek pagesa...",
          duration: 3000,
        });
        
        // Reset form and close dialog first
        setFormData({ firstName: "", lastName: "", email: "", whatsappPhone: "", paymentMethod: "cash" });
        setIsOpen(false);
        
        // Small delay to ensure UI updates, then redirect
        setTimeout(() => {
          console.log('Redirecting to Stripe payment...');
          const stripeUrl = "https://buy.stripe.com/8x2bJ26RB3yz72ocKaco001";
          const params = new URLSearchParams({
            'prefilled_email': customerEmail,
            'client_reference_id': customerName
          });
          const finalUrl = `${stripeUrl}?${params.toString()}`;
          console.log('Final Stripe URL:', finalUrl);
          window.location.href = finalUrl;
        }, 1000);
      } else {
        // Cash payment - send WhatsApp notification
        const carInfo = carMake && carModel && carYear ? `🚗 Makina: ${carYear} ${carMake} ${carModel}\n` : '';
        const ownerMessage = `🔔 Kërkesë e Re për Inspektim - KORAUTO\n\n👤 Emri: ${formData.firstName} ${formData.lastName}\n📧 Email: ${formData.email}\n📱 WhatsApp: ${formData.whatsappPhone}\n${carInfo}💰 Pagesa: Cash (€50)\n✅ Klient i ri kërkon shërbimin e inspektimit të makinës. Kontaktojeni sa më shpejt!`;
        
        const ownerWhatsappUrl = `https://wa.me/38348181116?text=${encodeURIComponent(ownerMessage)}`;
        window.open(ownerWhatsappUrl, '_blank');
        
        toast({
          title: "Faleminderit për Kërkesën!",
          description: "Kërkesa juaj për inspektim u dërgua me sukses! Do t'ju kontaktojmë brenda 24 orëve.",
          duration: 5000,
        });

        // Reset form and close dialog
        setFormData({ firstName: "", lastName: "", email: "", whatsappPhone: "", paymentMethod: "cash" });
        setIsOpen(false);
      }
      
    } catch (error) {
      console.error('Failed to submit inspection request:', error);
      
      // Fallback - still send WhatsApp message
      const carInfo = carMake && carModel && carYear ? `🚗 Makina: ${carYear} ${carMake} ${carModel}\n` : '';
      const paymentInfo = formData.paymentMethod === "card" ? "💳 Pagesa: Kartë Krediti" : "💰 Pagesa: Cash";
      const ownerMessage = `🔔 Kërkesë e Re për Inspektim - KORAUTO\n\n👤 Emri: ${formData.firstName} ${formData.lastName}\n📧 Email: ${formData.email}\n📱 WhatsApp: ${formData.whatsappPhone}\n${carInfo}${paymentInfo} (€50)\n✅ Klient i ri kërkon shërbimin e inspektimit të makinës. Kontaktojeni sa më shpejt!`;
      
      const ownerWhatsappUrl = `https://wa.me/38348181116?text=${encodeURIComponent(ownerMessage)}`;
      window.open(ownerWhatsappUrl, '_blank');
      
      if (formData.paymentMethod === "card") {
        // Also redirect to payment on error
        setTimeout(() => {
          window.location.href = "https://buy.stripe.com/8x2bJ26RB3yz72ocKaco001";
        }, 1000);
      }
      
      toast({
        title: "Kërkesa u Dërgua",
        description: "Kërkesa juaj u dërgua përmes WhatsApp. Do t'ju kontaktojmë së shpejti!",
        duration: 5000,
      });

      // Reset form and close dialog
      setFormData({ firstName: "", lastName: "", email: "", whatsappPhone: "", paymentMethod: "cash" });
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
      <DialogContent className="sm:max-w-md" aria-describedby="inspection-form-description">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-primary" />
            Kërkesë për Inspektim
          </DialogTitle>
          <p id="inspection-form-description" className="text-sm text-muted-foreground">
            Plotësoni formularin për të kërkuar shërbimin e inspektimit të makinës.
          </p>
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
                <Label htmlFor="whatsappPhone">Numri i WhatsApp (format ndërkombëtar)</Label>
                <Input
                  id="whatsappPhone"
                  type="tel"
                  value={formData.whatsappPhone}
                  onChange={(e) => handleInputChange("whatsappPhone", e.target.value)}
                  required
                  placeholder="+38348181116"
                />
              </div>

              <div>
                <Label htmlFor="paymentMethod">Metoda e Pagesës</Label>
                <Select value={formData.paymentMethod} onValueChange={(value) => handleInputChange("paymentMethod", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Zgjidhni metodën e pagesës" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">
                      <div className="flex items-center gap-2">
                        <Banknote className="h-4 w-4" />
                        Cash/Para në dorë
                      </div>
                    </SelectItem>
                    <SelectItem value="card">
                      <div className="flex items-center gap-2">
                        <CreditCard className="h-4 w-4" />
                        Kartë Krediti
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="bg-muted p-3 rounded-lg text-sm">
                <h4 className="font-semibold mb-2">Udhëzime për Pagesë:</h4>
                {formData.paymentMethod === "cash" ? (
                  <ul className="space-y-1 text-muted-foreground">
                    <li>• Pagesa në cash do të bëhet gjatë inspektimit</li>
                    <li>• Çmimi: €50 për inspektim të plotë</li>
                    <li>• Mbajeni me vete dokumentet e makinës</li>
                  </ul>
                ) : (
                  <ul className="space-y-1 text-muted-foreground">
                    <li>• Pagesa me kartë do të bëhet online</li>
                    <li>• Çmimi: €50 për inspektim të plotë</li>
                    <li>• Do t'ju dërgohet linku i pagesës</li>
                  </ul>
                )}
              </div>
              
              <Button type="submit" className="w-full bg-primary hover:bg-primary/90">
                {formData.paymentMethod === "card" ? "Vazhdo në Pagesë" : "Dërgo Kërkesën"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  );
};

export default InspectionRequestForm;