import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  MapPin,
  Building2,
  User,
  Phone,
  Shield,
  Loader2,
  Sparkles,
} from "lucide-react";
import type { EncarsVehicleResponse } from "@/services/encarApi";
import { translateKoreanText } from "@/utils/koreanTranslation";

interface DealerInfoSectionProps {
  car: any;
  liveContact?: EncarsVehicleResponse["contact"] | null;
  isLiveLoading?: boolean;
  liveFetchedAt?: string | null;
  error?: string | null;
}

/**
 * Dealer information section - Only visible to administrators
 * Displays dealer contact and location details from API
 */
export const DealerInfoSection = ({
  car,
  liveContact,
  isLiveLoading = false,
  liveFetchedAt,
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

  const liveUpdatedLabel = liveFetchedAt
    ? (() => {
        try {
          const parsed = new Date(liveFetchedAt);
          return Number.isNaN(parsed.getTime())
            ? null
            : parsed.toLocaleTimeString();
        } catch {
          return null;
        }
      })()
    : null;

    const translatedAddress = translateKoreanText(dealerInfo.address);

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
            <Badge
                variant="outline"
                className="text-xs font-medium"
            >
              Admin Only
            </Badge>
            {isLiveLoading ? (
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Loader2 className="h-3 w-3 animate-spin text-primary" />
                Updating
              </span>
            ) : liveContact ? (
              <Badge
                  variant="secondary"
                  className="text-xs font-semibold"
              >
                Encars Live
              </Badge>
            ) : null}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Dealer Name */}
          {dealerInfo.name && dealerInfo.name !== NO_INFO_AVAILABLE && (
            <div className="flex items-start gap-4 p-3 bg-background/60 dark:bg-background/40 rounded-lg border border-border/40">
              <div className="p-2 bg-primary/10 rounded-md">
                <User className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-muted-foreground tracking-wide uppercase">
                Dealer Name
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
            <div className="flex items-start gap-4 p-3 bg-background/60 dark:bg-background/40 rounded-lg border border-border/40">
              <div className="p-2 bg-primary/10 rounded-md">
                <Building2 className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Company
              </p>
              <p className="text-sm font-semibold text-foreground break-words">
                {dealerInfo.firmName}
              </p>
            </div>
          </div>
        )}

        {/* Address */}
          <div className="flex items-start gap-4 p-3 bg-background/60 dark:bg-background/40 rounded-lg border border-border/40">
            <div className="p-2 bg-primary/10 rounded-md">
              <MapPin className="h-4 w-4 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Address
            </p>
              <div className="space-y-1.5">
                <p className="text-sm font-semibold text-foreground break-words flex items-center gap-2">
              {isLiveLoading && (
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
              )}
                {translatedAddress || dealerInfo.address}
              </p>
                {translatedAddress && translatedAddress !== dealerInfo.address && (
                  <p className="text-xs text-muted-foreground break-words">
                    {dealerInfo.address}
                  </p>
                )}
              </div>
          </div>
        </div>

        {/* Phone */}
        {dealerInfo.phone && (
            <div className="flex items-start gap-4 p-3 bg-background/60 dark:bg-background/40 rounded-lg border border-border/40">
              <div className="p-2 bg-primary/10 rounded-md">
                <Phone className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Phone
              </p>
              <p className="text-sm font-semibold text-foreground">
                {dealerInfo.phone}
              </p>
            </div>
          </div>
        )}

        {/* User Type Badge */}
        {dealerInfo.userType && (
            <div className="flex items-center justify-between pt-2 border-t border-border/40">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">User Type</p>
              <Badge variant="outline" className="text-xs font-medium">
              {dealerInfo.userType}
            </Badge>
          </div>
        )}

          <div className="pt-2 border-t border-border/40 space-y-2">
          {error && (
              <div className="text-[11px] text-destructive bg-destructive/10 border border-destructive/30 rounded-md px-2 py-1">
              Failed to update from Encars API: {error}
            </div>
          )}
          {liveUpdatedLabel && !error && (
            <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                <Sparkles className="h-3 w-3 text-primary" />
              Updated from Encars API at {liveUpdatedLabel}
            </p>
          )}
          <p className="text-[10px] text-muted-foreground italic">
            ℹ️ This information is visible only to administrators and is
            automatically updated from the Encars API when available.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
