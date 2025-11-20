import { Card, CardContent } from "@/components/ui/card";

export const CarDetailsSkeleton = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="container-responsive py-6 max-w-[1600px] space-y-6">
        {/* Back buttons skeleton */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="h-9 w-40 rounded-lg bg-gradient-to-r from-muted/60 via-muted/40 to-muted/60 animate-shimmer bg-[length:200%_100%]" />
          <div className="h-9 w-32 rounded-lg bg-gradient-to-r from-muted/60 via-muted/40 to-muted/60 animate-shimmer bg-[length:200%_100%]" />
        </div>

        <div className="grid gap-6 lg:grid-cols-5">
          {/* Main content - left side */}
          <div className="lg:col-span-3 space-y-4">
            {/* Main image skeleton */}
            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl border border-border/40 bg-gradient-to-br from-muted/40 to-muted/20">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer bg-[length:200%_100%]" />
            </div>

            {/* Thumbnails skeleton */}
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="aspect-square rounded-lg bg-gradient-to-br from-muted/50 to-muted/30 relative overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer bg-[length:200%_100%]" style={{ animationDelay: `${i * 0.1}s` }} />
                </div>
              ))}
            </div>

            {/* Car title skeleton */}
            <div className="space-y-3">
              <div className="h-8 w-3/4 rounded-lg bg-gradient-to-r from-muted/60 via-muted/40 to-muted/60 animate-shimmer bg-[length:200%_100%]" />
              <div className="h-6 w-1/2 rounded-lg bg-gradient-to-r from-muted/50 via-muted/30 to-muted/50 animate-shimmer bg-[length:200%_100%]" />
            </div>

            {/* Specs grid skeleton */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {Array.from({ length: 9 }).map((_, i) => (
                <div
                  key={i}
                  className="h-16 rounded-xl bg-gradient-to-br from-muted/40 to-muted/20 relative overflow-hidden border border-border/20"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer bg-[length:200%_100%]" style={{ animationDelay: `${i * 0.05}s` }} />
                </div>
              ))}
            </div>

            {/* Equipment section skeleton */}
            <Card className="border-border/40 overflow-hidden">
              <CardContent className="p-4 space-y-3">
                <div className="h-6 w-48 rounded-lg bg-gradient-to-r from-muted/60 via-muted/40 to-muted/60 animate-shimmer bg-[length:200%_100%]" />
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                  {Array.from({ length: 12 }).map((_, i) => (
                    <div
                      key={i}
                      className="h-20 rounded-lg bg-gradient-to-br from-muted/40 to-muted/20 relative overflow-hidden"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer bg-[length:200%_100%]" style={{ animationDelay: `${i * 0.05}s` }} />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar - right side */}
          <div className="lg:col-span-2 space-y-4">
            {/* Price card skeleton */}
            <Card className="overflow-hidden border-border/40">
              <CardContent className="p-6 space-y-4">
                <div className="h-10 w-32 rounded-lg bg-gradient-to-r from-muted/60 via-muted/40 to-muted/60 animate-shimmer bg-[length:200%_100%]" />
                <div className="h-12 w-full rounded-lg bg-gradient-to-r from-primary/20 via-primary/10 to-primary/20 animate-shimmer bg-[length:200%_100%]" />
                <div className="h-12 w-full rounded-lg bg-gradient-to-r from-muted/50 via-muted/30 to-muted/50 animate-shimmer bg-[length:200%_100%]" />
              </CardContent>
            </Card>

            {/* Contact card skeleton */}
            <Card className="overflow-hidden border-border/40">
              <CardContent className="p-6 space-y-3">
                <div className="h-6 w-40 rounded-lg bg-gradient-to-r from-muted/60 via-muted/40 to-muted/60 animate-shimmer bg-[length:200%_100%]" />
                <div className="h-10 w-full rounded-lg bg-gradient-to-r from-green-500/20 via-green-500/10 to-green-500/20 animate-shimmer bg-[length:200%_100%]" />
                <div className="h-10 w-full rounded-lg bg-gradient-to-r from-muted/50 via-muted/30 to-muted/50 animate-shimmer bg-[length:200%_100%]" />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

