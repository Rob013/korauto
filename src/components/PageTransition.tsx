import { ReactNode } from "react";
import { LazyLoadErrorBoundary } from "./LazyLoadErrorBoundary";

interface PageTransitionProps {
  children: ReactNode;
}

const PageTransition = ({ children }: PageTransitionProps) => {
  return (
    <LazyLoadErrorBoundary>
      <div 
        className="page-transition"
        style={{
          /* Hardware acceleration */
          transform: 'translate3d(0, 0, 0)',
          backfaceVisibility: 'hidden',
          WebkitBackfaceVisibility: 'hidden',
          
          /* Smooth rendering */
          WebkitFontSmoothing: 'antialiased',
          MozOsxFontSmoothing: 'grayscale',
          
          /* Compositing optimization */
          isolation: 'isolate',
          contain: 'layout style paint',
          
          /* Smooth fade-in */
          animation: 'fadeIn 0.2s ease-out',
          animationFillMode: 'both'
        }}
      >
        {children}
      </div>
    </LazyLoadErrorBoundary>
  );
};

export default PageTransition;
