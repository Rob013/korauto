import { memo, lazy, Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";

// Lazy load heavy components
const CarInspectionDiagram = lazy(() => import("@/components/CarInspectionDiagram"));
const ImageZoom = lazy(() => import("@/components/ImageZoom").then(module => ({ default: module.ImageZoom })));

interface OptimizedCarDetailsProps {
  children: React.ReactNode;
}

const CarDetailsSkeleton = () => (
  <div className="space-y-6">
    <Skeleton className="h-[500px] w-full rounded-lg" />
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Skeleton className="h-32 w-full" />
      <Skeleton className="h-32 w-full" />
    </div>
  </div>
);

const OptimizedCarDetails = memo(({ children }: OptimizedCarDetailsProps) => {
  return (
    <Suspense fallback={<CarDetailsSkeleton />}>
      {children}
    </Suspense>
  );
});

OptimizedCarDetails.displayName = 'OptimizedCarDetails';

export default OptimizedCarDetails;