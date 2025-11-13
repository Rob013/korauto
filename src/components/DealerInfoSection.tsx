import { memo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, Shield, Loader2 } from "lucide-react";
import type { EncarsVehicleResponse } from "@/services/encarApi";

interface DealerInfoSectionProps {
  car: any;
  liveContact?: EncarsVehicleResponse["contact"] | null;
  isLiveLoading?: boolean;
  error?: string | null;
}

/**
 * Dealer information section - Only visible to administrators
 * Displays dealer contact and location details from API
 */
const DealerInfoSectionComponent = ({
  car,
  liveContact,
  isLiveLoading = false,
  error,
}: DealerInfoSectionProps) => {
  const contact = liveContact ?? car?.encarVehicle?.contact ?? null;
  const partnershipDealer = car?.encarVehicle?.partnership?.dealer ?? null;
  const fallbackDealer = car?.details?.dealer ?? null;

  const NO_ADDRESS_INFO_AVAILABLE = "Nuk ka informacion për adresën";

  const address =
    contact?.address ||
    partnershipDealer?.address ||
    fallbackDealer?.address ||
    "";

  const resolvedAddress = address || NO_ADDRESS_INFO_AVAILABLE;

  return (
    <Card className="glass-card border border-border/50 bg-card/90 shadow-lg backdrop-blur-md">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-foreground">
          <Shield className="h-5 w-5" />
          Dealer Information
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-start gap-3 rounded-lg border border-border/40 bg-background/60 p-3 dark:bg-background/40">
          <div className="rounded-md bg-primary/10 p-2">
            {isLiveLoading ? (
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
            ) : (
              <MapPin className="h-4 w-4 text-primary" />
            )}
          </div>
          <p className="text-sm font-semibold text-foreground break-words">
            {resolvedAddress}
          </p>
        </div>
        {error && (
          <p className="mt-2 text-xs text-destructive">
            {error}
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export const DealerInfoSection = memo(DealerInfoSectionComponent);

DealerInfoSection.displayName = "DealerInfoSection";
