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

  if (!hasValidInfo) {
    return (
      <Card className="border-amber-200 bg-amber-50/50 dark:border-amber-800 dark:bg-amber-950/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-amber-800 dark:text-amber-200">
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
    <Card className="border-amber-200 bg-gradient-to-br from-amber-50 to-amber-100/50 dark:border-amber-800 dark:from-amber-950/50 dark:to-amber-900/30 shadow-lg">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-amber-900 dark:text-amber-100">
            <Shield className="h-5 w-5" />
            Dealer Information
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge
              variant="secondary"
              className="bg-amber-200 text-amber-900 dark:bg-amber-800 dark:text-amber-100"
            >
              Admin Only
            </Badge>
            {isLiveLoading ? (
              <span className="flex items-center gap-1 text-xs text-amber-900 dark:text-amber-200">
                <Loader2 className="h-3 w-3 animate-spin" />
                Updating
              </span>
            ) : liveContact ? (
              <Badge
                variant="outline"
                className="border-amber-300 text-amber-900 dark:border-amber-700 dark:text-amber-100"
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
          <div className="flex items-start gap-3 p-3 bg-white/60 dark:bg-gray-900/40 rounded-lg border border-amber-200/50 dark:border-amber-800/50">
            <div className="p-2 bg-amber-100 dark:bg-amber-900/50 rounded-md">
              <User className="h-4 w-4 text-amber-700 dark:text-amber-300" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-muted-foreground mb-0.5">
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
          <div className="flex items-start gap-3 p-3 bg-white/60 dark:bg-gray-900/40 rounded-lg border border-amber-200/50 dark:border-amber-800/50">
            <div className="p-2 bg-amber-100 dark:bg-amber-900/50 rounded-md">
              <Building2 className="h-4 w-4 text-amber-700 dark:text-amber-300" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-muted-foreground mb-0.5">
                Company
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
              Address
            </p>
            <p className="text-sm font-semibold text-foreground break-words flex items-center gap-2">
              {isLiveLoading && (
                <Loader2 className="h-4 w-4 animate-spin text-amber-600" />
              )}
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
          <div className="flex items-center justify-between pt-2 border-t border-amber-200/50 dark:border-amber-800/50">
            <p className="text-xs text-muted-foreground">User Type</p>
            <Badge variant="outline" className="text-xs">
              {dealerInfo.userType}
            </Badge>
          </div>
        )}

        <div className="pt-2 border-t border-amber-200/50 dark:border-amber-800/50 space-y-2">
          {error && (
            <div className="text-[11px] text-destructive bg-destructive/10 border border-destructive/30 rounded-md px-2 py-1">
              Failed to update from Encars API: {error}
            </div>
          )}
          {liveUpdatedLabel && !error && (
            <p className="text-[10px] text-muted-foreground flex items-center gap-1">
              <Sparkles className="h-3 w-3 text-amber-500" />
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
