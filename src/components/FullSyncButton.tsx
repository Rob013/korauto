import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Database, Loader2, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export const FullSyncButton = () => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const { toast } = useToast();

  const handleFullSync = async () => {
    setShowConfirm(false);
    setIsSyncing(true);

    try {
      console.log("🚀 Initiating full database sync...");
      
      const { data, error } = await supabase.functions.invoke("full-db-sync", {
        method: "POST",
      });

      if (error) {
        throw error;
      }

      toast({
        title: "✅ Full Sync Initiated",
        description: data?.message || "Full database sync has been started. This will take several hours to complete.",
        duration: 6000,
      });

      console.log("✅ Full sync response:", data);
    } catch (error) {
      console.error("❌ Full sync error:", error);
      
      toast({
        title: "❌ Full Sync Failed",
        description: error instanceof Error ? error.message : "Failed to start full database sync",
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <>
      <Button
        onClick={() => setShowConfirm(true)}
        disabled={isSyncing}
        variant="default"
        size="sm"
        className="gap-2"
      >
        {isSyncing ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Syncing...
          </>
        ) : (
          <>
            <Database className="h-4 w-4" />
            Full Database Sync
          </>
        )}
      </Button>

      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-yellow-500" />
              Start Full Database Sync?
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                This will fetch and sync ALL cars from the external API to your database.
              </p>
              <p className="font-semibold text-foreground">
                ⚠️ Warning: This process will:
              </p>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Take several hours to complete (up to 1000 pages)</li>
                <li>Make thousands of API requests</li>
                <li>Use significant compute resources</li>
                <li>Sync up to 50,000+ cars with full details</li>
              </ul>
              <p className="text-sm font-medium text-foreground mt-3">
                Are you sure you want to proceed?
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleFullSync}>
              Yes, Start Full Sync
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
