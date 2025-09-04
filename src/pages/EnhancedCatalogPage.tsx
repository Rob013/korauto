import React, { lazy, Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import EnhancedCarCatalog from '@/components/EnhancedCarCatalog';

const Header = lazy(() => import('@/components/Header'));
const Footer = lazy(() => import('@/components/Footer'));

const EnhancedCatalogPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Suspense fallback={<Skeleton className="h-16 w-full" />}>
        <Header />
      </Suspense>
      
      <main className="min-h-[calc(100vh-4rem)]">
        <EnhancedCarCatalog />
      </main>
      
      <Suspense fallback={<Skeleton className="h-32 w-full" />}>
        <Footer />
      </Suspense>
    </div>
  );
};

export default EnhancedCatalogPage;