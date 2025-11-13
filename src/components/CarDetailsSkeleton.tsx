import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

export const CarDetailsSkeleton = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="container-responsive py-6 max-w-[1600px] space-y-6 animate-fade-in">
        {/* Back buttons skeleton */}
        <div className="flex flex-wrap items-center gap-2">
          <Skeleton className="h-9 w-40" />
          <Skeleton className="h-9 w-32" />
        </div>

        <div className="grid gap-6 lg:grid-cols-5">
          {/* Main content - left side */}
          <div className="lg:col-span-3 space-y-4">
            {/* Main image skeleton */}
            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl border border-border bg-muted">
              <Skeleton className="h-full w-full" />
            </div>

            {/* Thumbnails skeleton */}
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="aspect-square rounded-md" />
              ))}
            </div>

            {/* Car title skeleton */}
            <div className="space-y-2">
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-6 w-1/2" />
            </div>

            {/* Specs grid skeleton */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {Array.from({ length: 9 }).map((_, i) => (
                <Skeleton key={i} className="h-16 rounded-lg" />
              ))}
            </div>

            {/* Equipment section skeleton */}
            <Card className="border-border/40">
              <CardContent className="p-4 space-y-3">
                <Skeleton className="h-6 w-48" />
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                  {Array.from({ length: 12 }).map((_, i) => (
                    <Skeleton key={i} className="h-20 rounded-md" />
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar - right side */}
          <div className="lg:col-span-2 space-y-4">
            {/* Price card skeleton */}
            <Card>
              <CardContent className="p-6 space-y-4">
                <Skeleton className="h-10 w-32" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </CardContent>
            </Card>

            {/* Contact card skeleton */}
            <Card>
              <CardContent className="p-6 space-y-3">
                <Skeleton className="h-6 w-40" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};
