import { Suspense } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PageTransition from "@/components/PageTransition";
import { Skeleton } from "@/components/ui/skeleton";

const ContentSkeleton = () => (
  <div className="min-h-[60vh] bg-background">
    <div className="container-responsive py-6 space-y-6">
      <Skeleton className="h-10 w-2/3" />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <Skeleton key={i} className="h-48 w-full" />
        ))}
      </div>
    </div>
  </div>
);

const Layout = () => {
  const location = useLocation();
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main id="main" className="flex-1">
        <PageTransition key={location.pathname}>
          <Suspense fallback={<ContentSkeleton />}>
            <Outlet />
          </Suspense>
        </PageTransition>
      </main>
      <Footer />
    </div>
  );
};

export default Layout;
