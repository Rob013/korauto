import React, { lazy, Suspense } from 'react';
import { useSearchParams } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Skeleton } from '@/components/ui/skeleton';
import EncarStyleCatalog from '@/components/EncarStyleCatalog';

const Header = lazy(() => import('@/components/Header'));
const Footer = lazy(() => import('@/components/Footer'));

// Create a separate QueryClient for the catalog
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 45000, // 45 seconds
      refetchOnWindowFocus: false,
      retry: (failureCount, error) => {
        // Don't retry aborted requests
        if (error instanceof Error && error.name === 'AbortError') {
          return false;
        }
        return failureCount < 2;
      },
    },
  },
});

const FooterSkeleton = () => (
  <footer className="bg-card">
    <div className="container mx-auto px-4 py-8">
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

const CatalogContent: React.FC = () => {
  const [searchParams] = useSearchParams();
  const highlightCarId = searchParams.get('highlight');
  
  return (
    <div className="min-h-screen bg-background">
      <Suspense fallback={<div className="h-16 bg-background" />}>
        <Header />
      </Suspense>
      
      <EncarStyleCatalog highlightCarId={highlightCarId} />

      <Suspense fallback={<FooterSkeleton />}>
        <Footer />
      </Suspense>
    </div>
  );
};

const Catalog = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <CatalogContent />
    </QueryClientProvider>
  );
};

export default Catalog;