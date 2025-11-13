import { memo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Building2, User, Phone, Shield, Loader2 } from "lucide-react";
import type { EncarsVehicleResponse } from "@/services/encarApi";
import { translateKoreanText } from "@/utils/koreanTranslation";

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

  const NO_INFO_AVAILABLE = "No information available";
  const NO_ADDRESS_INFO_AVAILABLE = "No address information available";

  // Extract dealer info from various API sources
  const dealerInfo = {
    name:
      partnershipDealer?.name ||
      partnershipDealer?.firm?.name ||
      fallbackDealer?.name ||
      NO_INFO_AVAILABLE,
    userId:
      contact?.userId ||
      partnershipDealer?.userId ||
      fallbackDealer?.userId ||
      null,
    firmName: partnershipDealer?.firm?.name || fallbackDealer?.firm || null,
    address:
      contact?.address ||
      partnershipDealer?.address ||
      fallbackDealer?.address ||
      NO_ADDRESS_INFO_AVAILABLE,
    phone:
      contact?.no || partnershipDealer?.phone || fallbackDealer?.phone || null,
    userType: contact?.userType || partnershipDealer?.userType || null,
  };

  const hasValidInfo =
    dealerInfo.name !== NO_INFO_AVAILABLE ||
    dealerInfo.address !== NO_ADDRESS_INFO_AVAILABLE ||
    dealerInfo.firmName ||
    dealerInfo.phone;

  const { translatedText: translatedAddress } = translateKoreanText(
    dealerInfo.address,
  );

  if (!hasValidInfo) {
    return (
      <Card className="glass-card border border-border/50 bg-card/80 dark:bg-card/60">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <Shield className="h-5 w-5" />
            Dealer Information (Admin Only)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No dealer information available for this vehicle.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-card border border-border/50 bg-card/90 shadow-lg backdrop-blur-md">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-foreground">
            <Shield className="h-5 w-5" />
            Dealer Information
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs font-medium">
              Admin Only
            </Badge>
            {isLiveLoading ? (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Loader2 className="h-3 w-3 animate-spin text-primary" />
                Updating
              </span>
            ) : liveContact ? (
              <Badge variant="secondary" className="text-xs font-semibold">
                Encars Live
              </Badge>
            ) : null}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {dealerInfo.name && dealerInfo.name !== NO_INFO_AVAILABLE && (
          <div className="flex items-start gap-4 rounded-lg border border-border/40 bg-background/60 p-3 dark:bg-background/40">
            <div className="rounded-md bg-primary/10 p-2">
              <User className="h-4 w-4 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Dealer Name
              </p>
              <p className="break-words text-sm font-semibold text-foreground">
                {dealerInfo.name}
              </p>
              {dealerInfo.userId && (
                <p className="mt-1 text-xs text-muted-foreground">
                  ID: {dealerInfo.userId}
                </p>
              )}
            </div>
          </div>
        )}

        {dealerInfo.firmName && (
          <div className="flex items-start gap-4 rounded-lg border border-border/40 bg-background/60 p-3 dark:bg-background/40">
            <div className="rounded-md bg-primary/10 p-2">
              <Building2 className="h-4 w-4 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Company
              </p>
              <p className="break-words text-sm font-semibold text-foreground">
                {dealerInfo.firmName}
              </p>
            </div>
          </div>
        )}

        <div className="flex items-start gap-4 rounded-lg border border-border/40 bg-background/60 p-3 dark:bg-background/40">
          <div className="rounded-md bg-primary/10 p-2">
            <MapPin className="h-4 w-4 text-primary" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Address
            </p>
            <div className="space-y-1.5">
              <p className="flex items-center gap-2 break-words text-sm font-semibold text-foreground">
                {isLiveLoading && (
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                )}
                {translatedAddress || dealerInfo.address}
              </p>
              {translatedAddress && translatedAddress !== dealerInfo.address && (
                <p className="break-words text-xs text-muted-foreground">
                  {dealerInfo.address}
                </p>
              )}
            </div>
          </div>
        </div>

        {dealerInfo.phone && (
          <div className="flex items-start gap-4 rounded-lg border border-border/40 bg-background/60 p-3 dark:bg-background/40">
            <div className="rounded-md bg-primary/10 p-2">
              <Phone className="h-4 w-4 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Phone
              </p>
              <p className="text-sm font-semibold text-foreground">
                {dealerInfo.phone}
              </p>
            </div>
          </div>
        )}

        {dealerInfo.userType && (
          <div className="flex items-center justify-between border-t border-border/40 pt-2">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">User Type</p>
            <Badge variant="outline" className="text-xs font-medium">
              {dealerInfo.userType}
            </Badge>
          </div>
        )}

        {error && (
          <div className="space-y-2 border-t border-border/40 pt-2">
            <div className="rounded-md border border-destructive/30 bg-destructive/10 px-2 py-1 text-[11px] text-destructive">
              Failed to update from Encars API: {error}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export const DealerInfoSection = memo(DealerInfoSectionComponent);

DealerInfoSection.displayName = "DealerInfoSection";
