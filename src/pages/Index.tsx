import { lazy, Suspense, useEffect } from "react";
import { initializeAnalytics, trackPageView } from "@/utils/analytics";
import { initMobileEnhancers } from "@/utils/mobileEnhancer";
import Header from "@/components/Header";
import { Skeleton } from "@/components/ui/skeleton";

// Lazy load components for better initial load performance
const HomeSection = lazy(() => import("@/components/HomeSection"));
const HomeCarsSection = lazy(() => import("@/components/HomeCarsSection"));
const InspectionSection = lazy(() => import("@/components/InspectionSection"));
const ContactSection = lazy(() => import("@/components/ContactSection"));
const Footer = lazy(() => import("@/components/Footer"));
const SeasonalDecorations = lazy(() => import("@/components/SeasonalDecorations").then(module => ({ default: module.SeasonalDecorations })));

// Loading fallback components
const HomeSectionSkeleton = () => (
  <div className="py-20 bg-gradient-to-br from-primary/5 to-secondary/10">
    <div className="container-responsive text-center">
      <Skeleton className="h-16 w-3/4 mx-auto mb-6" />
      <Skeleton className="h-6 w-1/2 mx-auto mb-8" />
      <div className="flex justify-center gap-4">
        <Skeleton className="h-12 w-32" />
        <Skeleton className="h-12 w-32" />
      </div>
    </div>
  </div>
);

const CarsSectionSkeleton = () => (
  <section className="py-8 bg-secondary/30">
    <div className="container-responsive">
      <Skeleton className="h-12 w-64 mx-auto mb-8" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-card rounded-lg overflow-hidden">
            <Skeleton className="h-48 w-full" />
            <div className="p-4 space-y-3">
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-8 w-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  </section>
);

const SectionSkeleton = () => (
  <div className="py-16">
    <div className="container-responsive">
      <Skeleton className="h-12 w-64 mx-auto mb-8" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Skeleton className="h-64 w-full" />
        <div className="space-y-4">
          <Skeleton className="h-6 w-full" />
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-6 w-1/2" />
        </div>
      </div>
    </div>
  </div>
);

const Index = () => {
  useEffect(() => {
    // Initialize analytics tracking for homepage
    initializeAnalytics();
    trackPageView(undefined, { page_type: 'homepage' });

    // Initialize mobile enhancements
    initMobileEnhancers();
  }, []);

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      {/* Header loads immediately for navigation */}
      <Header />

      {/* Main content with proper landmark */}
      <main id="main-content" className="animate-fade-in">
        {/* Lazy load other sections with optimized skeletons */}
        <Suspense fallback={<HomeSectionSkeleton />}>
          <HomeSection />
        </Suspense>

        <Suspense fallback={<CarsSectionSkeleton />}>
          <HomeCarsSection />
        </Suspense>

        <Suspense fallback={<SectionSkeleton />}>
          <ContactSection />
        </Suspense>
      </main>


      <Suspense fallback={<div className="h-64 bg-muted/20 animate-pulse" />}>
        <Footer />
      </Suspense>

      {/* Seasonal decorations overlay */}
      <Suspense fallback={null}>
        <SeasonalDecorations />
      </Suspense>
    </div>
  );
};

export default Index;