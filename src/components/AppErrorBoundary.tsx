import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class AppErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('App Error Boundary caught an error:', error, errorInfo);
    this.setState({
      error,
      errorInfo,
    });
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.href = '/';
  };

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-background">
          <Card className="max-w-2xl w-full">
            <CardHeader>
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-6 w-6 text-destructive" />
                <CardTitle>Ndodhi një gabim</CardTitle>
              </div>
              <CardDescription>
                Aplikacioni ka hasur një problem. Ju lutemi provoni një nga zgjidhjet e mëposhtme.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {this.state.error && (
                <div className="bg-muted p-4 rounded-lg">
                  <p className="font-mono text-sm text-muted-foreground">
                    {this.state.error.toString()}
                  </p>
                </div>
              )}
              <div className="space-y-2">
                <h3 className="font-semibold">Çfarë mund të bëni:</h3>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                  <li>Rifilloni aplikacionin</li>
                  <li>Pastroni cache-in e shfletuesit</li>
                  <li>Provoni përsëri më vonë</li>
                  <li>Kontaktoni mbështetjen nëse problemi vazhdon</li>
                </ul>
              </div>
            </CardContent>
            <CardFooter className="flex gap-2">
              <Button onClick={this.handleReload} variant="default">
                Rifreskoni faqen
              </Button>
              <Button onClick={this.handleReset} variant="outline">
                Kthehu në fillim
              </Button>
            </CardFooter>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}
