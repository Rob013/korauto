import { ReactNode } from "react";

interface PageTransitionProps {
  children: ReactNode;
}

const PageTransition = ({ children }: PageTransitionProps) => {
  return (
    <div 
      className="animate-fade-in"
      style={{
        willChange: 'opacity, transform',
        transform: 'translate3d(0, 0, 0)',
        backfaceVisibility: 'hidden',
        perspective: 1000
      }}
    >
      {children}
    </div>
  );
};

export default PageTransition;
