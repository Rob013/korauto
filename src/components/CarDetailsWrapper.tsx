import React, { Component, ReactNode } from 'react';
import CarDetails from '@/pages/CarDetails';
import DemoCarDetails from '@/components/DemoCarDetails';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

// Error boundary component that catches React errors and shows demo fallback
class CarDetailsErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    console.error('CarDetails component error:', error);
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('CarDetails component error details:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      console.log('Falling back to demo car details due to error');
      return <DemoCarDetails />;
    }

    return this.props.children;
  }
}

// Wrapper component that provides error boundary for CarDetails
const CarDetailsWrapper = () => {
  return (
    <CarDetailsErrorBoundary>
      <CarDetails />
    </CarDetailsErrorBoundary>
  );
};

export default CarDetailsWrapper;