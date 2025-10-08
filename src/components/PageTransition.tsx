import { ReactNode } from "react";

interface PageTransitionProps {
  children: ReactNode;
}

const PageTransition = ({ children }: PageTransitionProps) => {
  return (
    <div 
      className="animate-fade-in-up"
      style={{
        willChange: 'opacity, transform',
        transform: 'translateZ(0)',
        perspective: '1000px'
      }}
    >
      {children}
    </div>
  );
};

export default PageTransition;
