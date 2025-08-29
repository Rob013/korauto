import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";

export const MaintenanceBanner = () => {
  return (
    <Alert className="mb-4 border-orange-200 bg-orange-50 text-orange-800 dark:border-orange-800 dark:bg-orange-950 dark:text-orange-200">
      <AlertTriangle className="h-4 w-4" />
      <AlertDescription className="font-medium">
        🚧 Website under maintenance - Some features may not work properly until 12:00. We're working to restore full functionality.
      </AlertDescription>
    </Alert>
  );
};