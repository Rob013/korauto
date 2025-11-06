import { ReactNode } from "react";
import { LazyLoadErrorBoundary } from "./LazyLoadErrorBoundary";

interface PageTransitionProps {
  children: ReactNode;
}

const PageTransition = ({ children }: PageTransitionProps) => {
  return (
    <LazyLoadErrorBoundary>
      <div 
        className="animate-fade-in optimize-rendering"
        style={{
          willChange: 'opacity, transform',
          transform: 'translate3d(0, 0, 0)',
          backfaceVisibility: 'hidden',
          WebkitBackfaceVisibility: 'hidden',
          WebkitFontSmoothing: 'antialiased',
          MozOsxFontSmoothing: 'grayscale',
          isolation: 'isolate'
        }}
      >
        {children}
      </div>
    </LazyLoadErrorBoundary>
  );
};

export default PageTransition;
