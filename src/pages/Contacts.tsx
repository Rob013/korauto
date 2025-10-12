import { useEffect, lazy, Suspense } from "react";
import { trackPageView, trackContact } from "@/utils/analytics";
import { Skeleton } from "@/components/ui/skeleton";

const ContactSection = lazy(() => import("@/components/ContactSection"));

// Footer is rendered by the persistent Layout

const ContactSkeleton = () => (
  <div className="py-16">
    <div className="container-responsive">
      <div className="text-center mb-12">
        <Skeleton className="h-12 w-64 mx-auto mb-4" />
        <Skeleton className="h-6 w-96 mx-auto" />
      </div>
      <div className="grid gap-8 md:grid-cols-2">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="space-y-4">
            <Skeleton className="h-8 w-48" />
            <div className="space-y-3">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-12 w-32" />
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

const Contacts = () => {
  useEffect(() => {
    // Track contacts page view
    trackPageView(undefined, { page_type: 'contacts' });
  }, []);

  const handleContactClick = (method: 'email' | 'phone') => {
    trackContact(method);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="py-8">
        <Suspense fallback={<ContactSkeleton />}>
          <ContactSection />
        </Suspense>
      </div>
      {/* Footer is provided by Layout */}
    </div>
  );
};

export default Contacts;