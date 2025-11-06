import React, { useCallback, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { useHaptics } from "@/hooks/useHaptics";
import { MessageCircle, Shield } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { trackInspectionRequest } from "@/utils/analytics";

interface InspectionRequestFormProps {
  trigger: React.ReactNode;
  carId?: string;
  carMake?: string;
  carModel?: string;
  carYear?: number;
}

// Input validation functions
const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validatePhone = (phone: string): boolean => {
  const phoneRegex = /^\+?[\d\s\-\(\)]{8,15}$/;
  return phoneRegex.test(phone);
};

const sanitizeInput = (input: string): string => {
  return input.trim().replace(/[<>"'&]/g, "");
};

const InspectionRequestForm = ({
  trigger,
  carId,
  carMake,
  carModel,
  carYear,
}: InspectionRequestFormProps) => {
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const { impact, notification } = useHaptics();
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    whatsappPhone: "",
  });
  const [errors, setErrors] = useState({
    firstName: "",
    lastName: "",
    email: "",
    whatsappPhone: "",
  });

  const validateForm = (): boolean => {
    console.log("🔍 Validating form with data:", formData);

    const newErrors = {
      firstName: "",
      lastName: "",
      email: "",
      whatsappPhone: "",
    };

    // Validate first name
    if (!formData.firstName.trim()) {
      newErrors.firstName = "Emri është i detyrueshëm";
      console.log("❌ First name validation failed: empty");
    } else if (formData.firstName.trim().length < 2) {
      newErrors.firstName = "Emri duhet të ketë të paktën 2 karaktere";
      console.log("❌ First name validation failed: too short");
    } else {
      console.log("✅ First name validation passed");
    }

    // Validate last name
    if (!formData.lastName.trim()) {
      newErrors.lastName = "Mbiemri është i detyrueshëm";
      console.log("❌ Last name validation failed: empty");
    } else if (formData.lastName.trim().length < 2) {
      newErrors.lastName = "Mbiemri duhet të ketë të paktën 2 karaktere";
      console.log("❌ Last name validation failed: too short");
    } else {
      console.log("✅ Last name validation passed");
    }

    // Validate email
    if (!formData.email.trim()) {
      newErrors.email = "Email-i është i detyrueshëm";
      console.log("❌ Email validation failed: empty");
    } else if (!validateEmail(formData.email)) {
      newErrors.email = "Ju lutem shkruani një email të vlefshëm";
      console.log("❌ Email validation failed: invalid format");
    } else {
      console.log("✅ Email validation passed");
    }

    // Validate phone
    if (!formData.whatsappPhone.trim()) {
      newErrors.whatsappPhone = "Numri i telefonit është i detyrueshëm";
      console.log("❌ Phone validation failed: empty");
    } else if (!validatePhone(formData.whatsappPhone)) {
      newErrors.whatsappPhone = "Ju lutem shkruani një numër telefoni të vlefshëm";
      console.log("❌ Phone validation failed: invalid format");
    } else {
      console.log("✅ Phone validation passed");
    }

    setErrors(newErrors);
    const isValid = !Object.values(newErrors).some((error) => error !== "");
    console.log("🔍 Final validation result:", isValid, "Errors:", newErrors);
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();

    console.log("🔵 Form submission triggered!");
    console.log("🔵 Current form data:", formData);
    console.log("🔵 Is submitting:", isSubmitting);

    // Haptic feedback on submit
    impact('medium');

    if (isSubmitting) {
      console.log("⚠️ Already submitting, returning early");
      return;
    }

    // Validate form
    console.log("🔵 Starting form validation...");
    const isValid = validateForm();
    console.log("🔵 Form validation result:", isValid);
    console.log("🔵 Current errors:", errors);

    if (!isValid) {
      console.log("❌ Form validation failed - stopping submission");
      toast({
        title: "Gabim në validim",
        description: "Ju lutem korrigjoni gabimet në formular",
        variant: "destructive",
      });
      return;
    }

    console.log("✅ Form validation passed, proceeding with submission");
    setIsSubmitting(true);

    try {
      console.log("🚀 Starting form submission...");
      console.log("🚗 Car ID being submitted:", carId);
      console.log("🚗 Car details being submitted:", {
        carMake,
        carModel,
        carYear,
      });

      // Sanitize inputs
      const sanitizedData = {
        firstName: sanitizeInput(formData.firstName),
        lastName: sanitizeInput(formData.lastName),
        email: sanitizeInput(formData.email.toLowerCase()),
        whatsappPhone: sanitizeInput(formData.whatsappPhone),
      };

      console.log("📝 Sanitized form data:", sanitizedData);
      console.log("🚗 Final car details for submission:", {
        carId,
        carMake,
        carModel,
        carYear,
      });

      console.log("🚀 Starting database insertion...");

      // Store in Supabase database with all form and car information
      const insertData = {
        customer_name: `${sanitizedData.firstName} ${sanitizedData.lastName}`,
        customer_email: sanitizedData.email,
        customer_phone: sanitizedData.whatsappPhone,
        car_id: carId || null,
        notes:
          carId && carMake && carModel && carYear
            ? `Car: ${carYear} ${carMake} ${carModel}`
            : "General inspection request",
        status: "pending",
      };

      console.log("📝 Data to insert:", insertData);

      const { data, error } = await supabase
        .from("inspection_requests")
        .insert(insertData)
        .select();

      console.log("📊 Database response:", { data, error });

      if (error) {
        console.error("❌ Supabase error:", error);
        throw error;
      }

      console.log("✅ Successfully saved to database:", data);

      // Send email notifications
      try {
        await supabase.functions.invoke("send-inspection-notification", {
          body: {
            customer_name: `${sanitizedData.firstName} ${sanitizedData.lastName}`,
            customer_email: sanitizedData.email,
            customer_phone: sanitizedData.whatsappPhone,
            car_make: carMake,
            car_model: carModel,
            car_year: carYear,
          },
        });
      } catch (emailError) {
        console.error("Email notification failed:", emailError);
        // Don't fail the whole process if email fails
      }

      // Send WhatsApp notification
      const carInfo =
        carMake && carModel && carYear
          ? `🚗 Makina: ${carYear} ${carMake} ${carModel}\n`
          : "";
      const ownerMessage = `🔔 Kërkesë e Re për Inspektim - KORAUTO\n\n👤 Emri: ${sanitizedData.firstName} ${sanitizedData.lastName}\n📧 Email: ${sanitizedData.email}\n📱 WhatsApp: ${sanitizedData.whatsappPhone}\n${carInfo}✅ Klient i ri kërkon shërbimin e inspektimit të makinës. Kontaktojeni sa më shpejt!`;

      const ownerWhatsappUrl = `https://wa.me/38348181116?text=${encodeURIComponent(
        ownerMessage
      )}`;
      window.open(ownerWhatsappUrl, "_blank");

      // Reset form and close dialog
      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        whatsappPhone: "",
      });
      setErrors({
        firstName: "",
        lastName: "",
        email: "",
        whatsappPhone: "",
      });
      setIsOpen(false);

      // Track inspection request analytics
      trackInspectionRequest(carId || undefined, {
        customer_name: `${sanitizedData.firstName} ${sanitizedData.lastName}`,
        customer_email: sanitizedData.email,
        has_car_id: !!carId,
        form_type: carId ? "specific_car" : "general_inquiry",
      });

      // Success haptic feedback
      notification('success');

      toast({
        title: "Kërkesa u dërgua me sukses",
        description:
          "E kemi pranuar kërkesën tuaj për inspektim dhe do t'ju kontaktojmë së shpejti.",
      });
    } catch (error: any) {
      console.error("❌ Error submitting inspection request:", error);

      // Error haptic feedback
      notification('error');

      let errorMessage =
        "Ndodhi një gabim gjatë dërgimit të kërkesës. Ju lutem provoni përsëri.";
      if (error?.message?.includes("rate")) {
        errorMessage = "Shumë kërkesa. Ju lutem prisni pak dhe provoni përsëri.";
      } else if (error?.message?.includes("network")) {
        errorMessage =
          "Gabim rrjeti. Ju lutem kontrolloni lidhjen tuaj dhe provoni përsëri.";
      }

      toast({
        title: "Gabim",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    console.log(`📝 Input changed: ${name} = "${value}"`);

    // Clear error for this field when user starts typing
    if (errors[name as keyof typeof errors]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const enhancedTrigger = useMemo(() => {
    if (React.isValidElement(trigger)) {
      const originalOnClick = (trigger.props as any)?.onClick;
      return React.cloneElement(trigger as React.ReactElement<any>, {
        onClick: (event: React.MouseEvent<any>) => {
          impact('light');
          originalOnClick?.(event);
          if (!event.defaultPrevented) {
            setIsOpen(true);
          }
        }
      });
    }

    return (
      <button type="button" onClick={() => {
        impact('light');
        setIsOpen(true);
      }} className="w-full">
        {trigger}
      </button>
    );
  }, [trigger, impact]);

  const handleOpenWarranty = useCallback(() => {
    impact('light');
    window.open("/garancioni", "_blank", "noopener,noreferrer");
  }, [impact]);

  const formContent = (
    <Card className="border-0 shadow-none">
      <CardContent className="px-2 py-4">
        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
          <div className="space-y-4">
            <div>
              <Label htmlFor="firstName">Emri</Label>
              <Input
                id="firstName"
                name="firstName"
                type="text"
                value={formData.firstName}
                onChange={handleInputChange}
                required
                maxLength={50}
                className={errors.firstName ? "border-destructive" : ""}
              />
              {errors.firstName && (
                <p className="text-sm text-destructive mt-1">
                  {errors.firstName}
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="lastName">Mbiemri</Label>
              <Input
                id="lastName"
                name="lastName"
                type="text"
                value={formData.lastName}
                onChange={handleInputChange}
                required
                maxLength={50}
                className={errors.lastName ? "border-destructive" : ""}
              />
              {errors.lastName && (
                <p className="text-sm text-destructive mt-1">
                  {errors.lastName}
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                required
                maxLength={100}
                className={errors.email ? "border-destructive" : ""}
              />
              {errors.email && (
                <p className="text-sm text-destructive mt-1">
                  {errors.email}
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="whatsappPhone">Numri i telefonit (WhatsApp)</Label>
              <Input
                id="whatsappPhone"
                name="whatsappPhone"
                type="tel"
                placeholder="+383 48 111 111"
                value={formData.whatsappPhone}
                onChange={handleInputChange}
                required
                maxLength={20}
                className={errors.whatsappPhone ? "border-destructive" : ""}
              />
              {errors.whatsappPhone && (
                <p className="text-sm text-destructive mt-1">
                  {errors.whatsappPhone}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Button
                type="submit"
                className="w-full"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Duke dërguar...
                  </>
                ) : (
                  "Dërgo Kërkesën"
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={handleOpenWarranty}
              >
                <Shield className="h-4 w-4 mr-2" />
                Shiko Garancionin
              </Button>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );

  if (isMobile) {
    return (
      <Drawer open={isOpen} onOpenChange={setIsOpen}>
        <DrawerTrigger asChild>{enhancedTrigger}</DrawerTrigger>
        <DrawerContent className="max-h-[90vh]">
          <DrawerHeader className="text-left pb-4">
            <DrawerTitle className="flex items-center gap-2 text-lg">
              <MessageCircle className="h-5 w-5 text-primary" />
              Kërkesë për Inspektim
            </DrawerTitle>
            <p className="text-sm text-muted-foreground">
              Plotësoni formularin për të kërkuar shërbimin e inspektimit të
              makinës.
            </p>
          </DrawerHeader>
          <div className="px-4 pb-4 overflow-y-auto">
            {formContent}
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{enhancedTrigger}</DialogTrigger>
      <DialogContent
        className="sm:max-w-md max-h-[90vh] overflow-y-auto mx-4 sm:mx-auto"
        aria-describedby="inspection-form-description"
      >
        <DialogHeader className="pb-4">
          <DialogTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <MessageCircle className="h-5 w-5 text-primary" />
            Kërkesë për Inspektim
          </DialogTitle>
          <p
            id="inspection-form-description"
            className="text-sm text-muted-foreground"
          >
            Plotësoni formularin për të kërkuar shërbimin e inspektimit të
            makinës.
          </p>
        </DialogHeader>
        {formContent}
      </DialogContent>
    </Dialog>
  );
};

export default InspectionRequestForm;
