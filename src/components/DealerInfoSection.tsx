import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Building2, User, Phone, Shield } from "lucide-react";

interface DealerInfoSectionProps {
  car: any;
}

/**
 * Dealer information section - Only visible to administrators
 * Displays dealer contact and location details from API
 */
export const DealerInfoSection = ({ car }: DealerInfoSectionProps) => {
  // Extract dealer info from various API sources
  const dealerInfo = {
    name: car?.encarVehicle?.partnership?.dealer?.name || 
          car?.encarVehicle?.partnership?.dealer?.firm?.name ||
          car?.details?.dealer?.name || 
          "Nuk ka informacion",
    userId: car?.encarVehicle?.partnership?.dealer?.userId || 
            car?.encarVehicle?.contact?.userId ||
            car?.details?.dealer?.userId || 
            null,
    firmName: car?.encarVehicle?.partnership?.dealer?.firm?.name || 
              car?.details?.dealer?.firm || 
              null,
    address: car?.encarVehicle?.contact?.address || 
             car?.encarVehicle?.partnership?.dealer?.address ||
             car?.details?.dealer?.address || 
             "Nuk ka informacion për adresën",
    phone: car?.encarVehicle?.contact?.no || 
           car?.encarVehicle?.partnership?.dealer?.phone ||
           car?.details?.dealer?.phone || 
           null,
    userType: car?.encarVehicle?.contact?.userType || 
              car?.encarVehicle?.partnership?.dealer?.userType ||
              null,
  };

  const hasValidInfo = dealerInfo.name !== "Nuk ka informacion" || 
                       dealerInfo.address !== "Nuk ka informacion për adresën" ||
                       dealerInfo.firmName ||
                       dealerInfo.phone;

  if (!hasValidInfo) {
    return (
      <Card className="border-amber-200 bg-amber-50/50 dark:border-amber-800 dark:bg-amber-950/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-amber-800 dark:text-amber-200">
            <Shield className="h-5 w-5" />
            Informacione të Dealerët (Vetëm Admin)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Nuk ka informacione të disponueshme për dealerin për këtë makinë.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-amber-200 bg-gradient-to-br from-amber-50 to-amber-100/50 dark:border-amber-800 dark:from-amber-950/50 dark:to-amber-900/30 shadow-lg">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-amber-900 dark:text-amber-100">
            <Shield className="h-5 w-5" />
            Informacione të Dealerët
          </CardTitle>
          <Badge variant="secondary" className="bg-amber-200 text-amber-900 dark:bg-amber-800 dark:text-amber-100">
            Vetëm Admin
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Dealer Name */}
        {dealerInfo.name && dealerInfo.name !== "Nuk ka informacion" && (
          <div className="flex items-start gap-3 p-3 bg-white/60 dark:bg-gray-900/40 rounded-lg border border-amber-200/50 dark:border-amber-800/50">
            <div className="p-2 bg-amber-100 dark:bg-amber-900/50 rounded-md">
              <User className="h-4 w-4 text-amber-700 dark:text-amber-300" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-muted-foreground mb-0.5">
                Emri i Dealerit
              </p>
              <p className="text-sm font-semibold text-foreground break-words">
                {dealerInfo.name}
              </p>
              {dealerInfo.userId && (
                <p className="text-xs text-muted-foreground mt-1">
                  ID: {dealerInfo.userId}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Firm Name */}
        {dealerInfo.firmName && (
          <div className="flex items-start gap-3 p-3 bg-white/60 dark:bg-gray-900/40 rounded-lg border border-amber-200/50 dark:border-amber-800/50">
            <div className="p-2 bg-amber-100 dark:bg-amber-900/50 rounded-md">
              <Building2 className="h-4 w-4 text-amber-700 dark:text-amber-300" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-muted-foreground mb-0.5">
                Kompania
              </p>
              <p className="text-sm font-semibold text-foreground break-words">
                {dealerInfo.firmName}
              </p>
            </div>
          </div>
        )}

        {/* Address */}
        <div className="flex items-start gap-3 p-3 bg-white/60 dark:bg-gray-900/40 rounded-lg border border-amber-200/50 dark:border-amber-800/50">
          <div className="p-2 bg-amber-100 dark:bg-amber-900/50 rounded-md">
            <MapPin className="h-4 w-4 text-amber-700 dark:text-amber-300" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-muted-foreground mb-0.5">
              Adresa
            </p>
            <p className="text-sm font-semibold text-foreground break-words">
              {dealerInfo.address}
            </p>
          </div>
        </div>

        {/* Phone */}
        {dealerInfo.phone && (
          <div className="flex items-start gap-3 p-3 bg-white/60 dark:bg-gray-900/40 rounded-lg border border-amber-200/50 dark:border-amber-800/50">
            <div className="p-2 bg-amber-100 dark:bg-amber-900/50 rounded-md">
              <Phone className="h-4 w-4 text-amber-700 dark:text-amber-300" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-muted-foreground mb-0.5">
                Telefoni
              </p>
              <p className="text-sm font-semibold text-foreground">
                {dealerInfo.phone}
              </p>
            </div>
          </div>
        )}

        {/* User Type Badge */}
        {dealerInfo.userType && (
          <div className="flex items-center justify-between pt-2 border-t border-amber-200/50 dark:border-amber-800/50">
            <p className="text-xs text-muted-foreground">Lloji i përdoruesit</p>
            <Badge variant="outline" className="text-xs">
              {dealerInfo.userType}
            </Badge>
          </div>
        )}

        <div className="pt-2 border-t border-amber-200/50 dark:border-amber-800/50">
          <p className="text-[10px] text-muted-foreground italic">
            ℹ️ Këto informacione janë të dukshme vetëm për administratorët dhe vijnë drejtpërdrejt nga API.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
