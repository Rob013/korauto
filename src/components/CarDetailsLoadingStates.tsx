import { memo, Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";

// Early loading skeleton that shows immediately
const CarDetailsLoadingSkeleton = memo(() => (
  <div className="min-h-screen bg-background">
    <div className="container-responsive py-8">
      {/* Header skeleton */}
      <div className="flex items-center justify-between mb-6">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-8 w-24" />
      </div>
      
      {/* Main content skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Image gallery skeleton */}
        <div className="space-y-4">
          <Skeleton className="h-[400px] w-full rounded-lg" />
          <div className="flex space-x-2">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-16 w-16 rounded" />
            ))}
          </div>
        </div>
        
        {/* Details skeleton */}
        <div className="space-y-6">
          <div className="space-y-2">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-6 w-1/2" />
            <Skeleton className="h-10 w-1/3" />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-6 w-24" />
              </div>
            ))}
          </div>
          
          <div className="space-y-3">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        </div>
      </div>
      
      {/* Additional sections skeleton */}
      <div className="mt-8 space-y-6">
        <Skeleton className="h-64 w-full rounded-lg" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Skeleton className="h-32 w-full rounded-lg" />
          <Skeleton className="h-32 w-full rounded-lg" />
        </div>
      </div>
    </div>
  </div>
));

CarDetailsLoadingSkeleton.displayName = 'CarDetailsLoadingSkeleton';

// Enhanced error boundary for car details
const CarDetailsErrorBoundary = memo(({ error, onRetry }: { error: string; onRetry?: () => void }) => (
  <div className="min-h-screen bg-background flex items-center justify-center">
    <div className="text-center space-y-4 p-8">
      <div className="text-6xl">🚗</div>
      <h2 className="text-2xl font-bold text-foreground">Car Details Unavailable</h2>
      <p className="text-muted-foreground max-w-md">{error}</p>
      {onRetry && (
        <button 
          onClick={onRetry}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
        >
          Try Again
        </button>
      )}
    </div>
  </div>
));

CarDetailsErrorBoundary.displayName = 'CarDetailsErrorBoundary';

// Quick loading state component for immediate feedback
const QuickLoadingState = memo(() => (
  <div className="min-h-screen bg-background">
    <div className="container-responsive py-8">
      <div className="animate-pulse space-y-6">
        <div className="h-8 bg-muted rounded w-32"></div>
        <div className="h-64 bg-muted rounded"></div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="h-6 bg-muted rounded w-3/4"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
            <div className="h-32 bg-muted rounded"></div>
          </div>
          <div className="space-y-4">
            <div className="h-6 bg-muted rounded w-1/2"></div>
            <div className="h-24 bg-muted rounded"></div>
          </div>
        </div>
      </div>
    </div>
  </div>
));

QuickLoadingState.displayName = 'QuickLoadingState';

export { CarDetailsLoadingSkeleton, CarDetailsErrorBoundary, QuickLoadingState };