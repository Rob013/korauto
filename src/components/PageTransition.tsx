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
        transform: 'translateZ(0)'
      }}
    >
      {children}
    </div>
  );
};

export default PageTransition;
