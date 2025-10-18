import { ReactNode } from "react";

interface PageTransitionProps {
  children: ReactNode;
}

const PageTransition = ({ children }: PageTransitionProps) => {
  return (
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
  );
};

export default PageTransition;
