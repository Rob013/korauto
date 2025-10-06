import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { RefreshCw, X } from 'lucide-react';
import cacheManager from '@/utils/cacheManager';

export const CacheUpdateNotification = () => {
  const [showNotification, setShowNotification] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    // Check for service worker updates
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then((registration) => {
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // New service worker is available
                setShowNotification(true);
              }
            });
          }
        });

        // Check for updates periodically
        setInterval(() => {
          registration.update();
        }, 60000); // Check every minute
      });
    }

    // Check version on mount
    const checkVersion = async () => {
      const hasChanged = cacheManager.hasVersionChanged();
      if (hasChanged) {
        setShowNotification(true);
      }
    };

    checkVersion();
  }, []);

  const handleUpdate = async () => {
    setIsUpdating(true);
    
    try {
      await cacheManager.clearAllCaches();
      await cacheManager.updateServiceWorker();
      cacheManager.updateVersion();
      
      // Force reload after a short delay
      setTimeout(() => {
        window.location.reload();
      }, 500);
    } catch (error) {
      console.error('Error updating app:', error);
      setIsUpdating(false);
    }
  };

  const handleDismiss = () => {
    setShowNotification(false);
  };

  if (!showNotification) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[9999] animate-slide-in-right">
      <Card className="bg-card border-primary/50 shadow-2xl max-w-sm">
        <div className="p-4 flex flex-col gap-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-primary/10 rounded-full">
                <RefreshCw className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-foreground mb-1">
                  Update Available
                </h3>
                <p className="text-sm text-muted-foreground">
                  A new version is available. Update now for the latest features and improvements.
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleDismiss}
              className="h-6 w-6 -mt-1"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="flex gap-2">
            <Button
              onClick={handleUpdate}
              disabled={isUpdating}
              className="flex-1 hover-scale"
              size="sm"
            >
              {isUpdating ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Update Now
                </>
              )}
            </Button>
            <Button
              onClick={handleDismiss}
              variant="outline"
              size="sm"
            >
              Later
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};
