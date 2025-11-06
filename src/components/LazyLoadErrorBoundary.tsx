import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from './ui/button';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';
import { Card, CardContent } from './ui/card';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onRetry?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  retryCount: number;
  isRetrying: boolean;
}

const MAX_RETRY_ATTEMPTS = 3;
const RETRY_DELAY = 1000; // 1 second

/**
 * Error Boundary specifically designed for lazy-loaded components
 * Provides automatic retry functionality for module import failures
 */
export class LazyLoadErrorBoundary extends Component<Props, State> {
  private retryTimeout?: NodeJS.Timeout;

  public state: State = {
    hasError: false,
    error: null,
    retryCount: 0,
    isRetrying: false,
  };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    // Check if it's a module import error
    const isImportError = 
      error.message.includes('Failed to fetch') ||
      error.message.includes('Importing a module script failed') ||
      error.message.includes('dynamically imported module') ||
      error.name === 'ChunkLoadError';

    return { 
      hasError: true, 
      error,
      // Only auto-retry for import errors
      isRetrying: isImportError
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('LazyLoadErrorBoundary caught an error:', error, errorInfo);
    
    // Check if it's an import error and we haven't exceeded retry attempts
    const isImportError = 
      error.message.includes('Failed to fetch') ||
      error.message.includes('Importing a module script failed') ||
      error.message.includes('dynamically imported module') ||
      error.name === 'ChunkLoadError';

    if (isImportError && this.state.retryCount < MAX_RETRY_ATTEMPTS) {
      console.log(`🔄 Retrying module load (attempt ${this.state.retryCount + 1}/${MAX_RETRY_ATTEMPTS})...`);
      
      // Attempt automatic retry after a delay
      this.retryTimeout = setTimeout(() => {
        this.handleRetry();
      }, RETRY_DELAY * (this.state.retryCount + 1)); // Exponential backoff
    }
  }

  public componentWillUnmount() {
    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout);
    }
  }

  private handleRetry = () => {
    console.log('🔄 Retrying to load component...');
    
    this.setState(
      (prevState) => ({
        hasError: false,
        error: null,
        retryCount: prevState.retryCount + 1,
        isRetrying: false,
      })
    );

    // Call optional retry callback
    this.props.onRetry?.();
  };

  private handleManualRetry = () => {
    console.log('🔄 Manual retry triggered');
    this.setState({
      hasError: false,
      error: null,
      retryCount: 0,
      isRetrying: false,
    });
    this.props.onRetry?.();
  };

  private handleGoHome = () => {
    // Clear error state and navigate home
    this.setState({
      hasError: false,
      error: null,
      retryCount: 0,
      isRetrying: false,
    });
    window.location.href = '/';
  };

  private handleReload = () => {
    // Force reload to get fresh assets
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const isImportError = 
        this.state.error?.message.includes('Failed to fetch') ||
        this.state.error?.message.includes('Importing a module script failed') ||
        this.state.error?.message.includes('dynamically imported module') ||
        this.state.error?.name === 'ChunkLoadError';

      return (
        <div className="min-h-[400px] flex items-center justify-center p-4 bg-background">
          <Card className="max-w-md w-full border-border shadow-lg">
            <CardContent className="pt-6 space-y-4 text-center">
              {this.state.isRetrying ? (
                <>
                  <RefreshCw className="h-12 w-12 text-primary mx-auto animate-spin" />
                  <h2 className="text-xl font-semibold text-foreground">
                    Duke rifilluar...
                  </h2>
                  <p className="text-muted-foreground text-sm">
                    Tentativa {this.state.retryCount + 1} nga {MAX_RETRY_ATTEMPTS}
                  </p>
                </>
              ) : (
                <>
                  <AlertCircle className="h-12 w-12 text-destructive mx-auto" />
                  <h2 className="text-xl font-semibold text-foreground">
                    {isImportError ? 'Problem në ngarkimin e faqes' : 'Diçka shkoi keq'}
                  </h2>
                  <p className="text-muted-foreground text-sm">
                    {isImportError
                      ? 'Faqja nuk mund të ngarkohet. Kjo mund të ndodhë për shkak të lidhjes së dobët të internetit ose përditësimit të aplikacionit.'
                      : 'Aplikacioni has ndeshur një problem të papritur.'}
                  </p>

                  {this.state.retryCount >= MAX_RETRY_ATTEMPTS && isImportError && (
                    <div className="bg-muted/50 p-3 rounded-lg text-xs text-muted-foreground">
                      💡 Nëse problemi vazhdon, provoni të rifreskoni të gjithë faqen.
                    </div>
                  )}

                  {this.state.error && (
                    <details className="text-left bg-muted p-3 rounded-lg text-xs">
                      <summary className="cursor-pointer font-medium text-muted-foreground mb-2">
                        Detajet teknike
                      </summary>
                      <pre className="text-xs overflow-auto whitespace-pre-wrap text-muted-foreground">
                        {this.state.error.toString()}
                      </pre>
                    </details>
                  )}

                  <div className="flex flex-col gap-2 pt-2">
                    <Button 
                      onClick={this.handleManualRetry} 
                      className="w-full"
                      size="lg"
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Provo Përsëri
                    </Button>
                    
                    <div className="flex gap-2">
                      <Button 
                        onClick={this.handleGoHome}
                        variant="outline"
                        className="flex-1"
                      >
                        <Home className="h-4 w-4 mr-2" />
                        Faqja Kryesore
                      </Button>
                      
                      <Button 
                        onClick={this.handleReload}
                        variant="outline"
                        className="flex-1"
                      >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Rifresko
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}
