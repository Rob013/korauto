import { AlertTriangle, RefreshCw, WifiOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  type?: 'network' | 'api' | 'general';
}

export const ErrorState = ({ 
  title = 'Failed to Load Data',
  message = 'Unable to fetch data. Please try again.',
  onRetry,
  type = 'general'
}: ErrorStateProps) => {
  const Icon = type === 'network' ? WifiOff : AlertTriangle;

  return (
    <div className="flex items-center justify-center min-h-[400px] p-4">
      <Card className="w-full max-w-md border-destructive/50">
        <CardHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 rounded-full bg-destructive/10">
              <Icon className="h-6 w-6 text-destructive" />
            </div>
            <CardTitle className="text-xl">{title}</CardTitle>
          </div>
          <CardDescription className="text-base">
            {message}
          </CardDescription>
        </CardHeader>
        {onRetry && (
          <CardContent>
            <Button 
              onClick={onRetry} 
              variant="default"
              className="w-full"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Try Again
            </Button>
          </CardContent>
        )}
      </Card>
    </div>
  );
};

export const CarListErrorState = ({ onRetry }: { onRetry?: () => void }) => (
  <ErrorState
    title="Cars Not Available"
    message="Unable to load cars at this time. Our service may be temporarily unavailable. Please try again in a few moments."
    onRetry={onRetry}
    type="network"
  />
);

export const NetworkErrorState = ({ onRetry }: { onRetry?: () => void }) => (
  <ErrorState
    title="Connection Error"
    message="Unable to connect to the server. Please check your internet connection and try again."
    onRetry={onRetry}
    type="network"
  />
);

export const APIErrorState = ({ onRetry }: { onRetry?: () => void }) => (
  <ErrorState
    title="Service Unavailable"
    message="Our car listing service is temporarily unavailable. We're working to restore it. Please try again shortly."
    onRetry={onRetry}
    type="api"
  />
);
