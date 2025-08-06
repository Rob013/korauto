import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Loader2 } from 'lucide-react';

interface OptimizedLoadingStateProps {
  type?: 'cars' | 'filters' | 'initial' | 'navigation';
  count?: number;
  message?: string;
  showSpinner?: boolean;
}

export const OptimizedLoadingState: React.FC<OptimizedLoadingStateProps> = ({
  type = 'cars',
  count = 6,
  message,
  showSpinner = true
}) => {
  if (type === 'initial') {
    return (
      <div className="min-h-screen bg-background">
        <div className="animate-pulse">
          {/* Header skeleton */}
          <header className="border-b">
            <div className="container-responsive py-4">
              <div className="flex items-center justify-between">
                <Skeleton className="h-8 w-32" />
                <div className="flex items-center space-x-4">
                  <Skeleton className="h-8 w-20" />
                  <Skeleton className="h-8 w-20" />
                  <Skeleton className="h-8 w-20" />
                </div>
              </div>
            </div>
          </header>
          
          {/* Content skeleton */}
          <main className="container-responsive py-8">
            <div className="space-y-6">
              <Skeleton className="h-12 w-3/4" />
              <Skeleton className="h-6 w-1/2" />
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {[...Array(6)].map((_, i) => (
                  <Skeleton key={i} className="h-48 w-full" />
                ))}
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  if (type === 'navigation') {
    return (
      <div className="flex items-center justify-center py-4">
        {showSpinner && <Loader2 className="h-5 w-5 animate-spin mr-2" />}
        <span className="text-sm text-muted-foreground">
          {message || "Navigating..."}
        </span>
      </div>
    );
  }

  if (type === 'filters') {
    return (
      <div className="space-y-4 p-4">
        <div className="space-y-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-10 w-full" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-10 w-full" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-10 w-full" />
        </div>
      </div>
    );
  }

  // Default cars loading
  return (
    <div className="space-y-4">
      {showSpinner && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin mr-2" />
          <span>{message || "Loading cars..."}</span>
        </div>
      )}
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {[...Array(count)].map((_, i) => (
          <div key={i} className="bg-card rounded-lg overflow-hidden border">
            <Skeleton className="h-48 w-full" />
            <div className="p-4 space-y-3">
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <div className="flex justify-between">
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-4 w-1/4" />
              </div>
              <Skeleton className="h-8 w-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default OptimizedLoadingState;