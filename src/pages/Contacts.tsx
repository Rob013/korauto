import { useEffect, lazy, Suspense } from "react";
import { trackPageView, trackContact } from "@/utils/analytics";
import Header from "@/components/Header";
import { Skeleton } from "@/components/ui/skeleton";

const Footer = lazy(() => import("@/components/Footer"));
const ContactSection = lazy(() => import("@/components/ContactSection"));

const FooterSkeleton = () => (
  <footer className="bg-card">
    <div className="container-responsive py-8">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="space-y-3">
            <Skeleton className="h-5 w-24" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    </div>
  </footer>
);

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
      <Header />
      <div className="py-8">
        <Suspense fallback={<ContactSkeleton />}>
          <ContactSection />
        </Suspense>
      </div>
      <Suspense fallback={<FooterSkeleton />}>
        <Footer />
      </Suspense>
    </div>
  );
};

export default Contacts;