import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { runComprehensiveAudit, ComprehensiveAuditResults } from '@/utils/comprehensiveAudit';
import { AlertTriangle, CheckCircle, Zap, Eye, Accessibility } from 'lucide-react';

const PerformanceAuditWidget: React.FC = () => {
  const [results, setResults] = useState<ComprehensiveAuditResults | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runAudit = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const auditResults = await runComprehensiveAudit();
      setResults(auditResults);
    } catch (err) {
      setError('Failed to run audit');
      console.error('Audit error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Auto-run audit on component mount
    runAudit();
  }, []);

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getSeverityBadge = (severity: 'low' | 'medium' | 'high') => {
    const variants = {
      low: 'default',
      medium: 'secondary',
      high: 'destructive'
    } as const;
    
    return <Badge variant={variants[severity]}>{severity}</Badge>;
  };

  if (error) {
    return (
      <Card className="w-full max-w-2xl">
        <CardContent className="p-6">
          <div className="text-center text-red-600">
            <AlertTriangle className="h-8 w-8 mx-auto mb-2" />
            <p>{error}</p>
            <Button onClick={runAudit} className="mt-2">
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-4xl">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Website Performance & Alignment Audit
          </span>
          <Button 
            onClick={runAudit} 
            disabled={isLoading}
            size="sm"
          >
            {isLoading ? 'Running...' : 'Run Audit'}
          </Button>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {isLoading && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Analyzing website...</p>
          </div>
        )}
        
        {results && (
          <>
            {/* Overall Score */}
            <div className="text-center">
              <div className={`text-4xl font-bold ${getScoreColor(results.overallScore)}`}>
                {results.overallScore.toFixed(1)}/100
              </div>
              <p className="text-muted-foreground">Overall Score</p>
            </div>

            {/* Performance Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4 text-center">
                  <div className={`text-2xl font-semibold ${getScoreColor(results.performance.overallScore)}`}>
                    {results.performance.overallScore.toFixed(1)}
                  </div>
                  <p className="text-sm text-muted-foreground">Performance</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-semibold text-blue-600">
                    {results.layoutIssues.length}
                  </div>
                  <p className="text-sm text-muted-foreground">Layout Issues</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-semibold text-purple-600">
                    {results.accessibilityIssues.length}
                  </div>
                  <p className="text-sm text-muted-foreground">A11y Issues</p>
                </CardContent>
              </Card>
            </div>

            {/* Layout Issues */}
            {results.layoutIssues.length > 0 && (
              <div>
                <h3 className="flex items-center gap-2 font-semibold mb-3">
                  <Eye className="h-4 w-4" />
                  Layout & Alignment Issues ({results.layoutIssues.length})
                </h3>
                <div className="space-y-2">
                  {results.layoutIssues.slice(0, 5).map((issue, index) => (
                    <div key={index} className="flex items-start gap-2 p-3 bg-muted rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <code className="text-xs bg-background px-1 py-0.5 rounded">
                            {issue.element}
                          </code>
                          {getSeverityBadge(issue.severity)}
                        </div>
                        <p className="text-sm text-muted-foreground mb-1">{issue.issue}</p>
                        <p className="text-xs text-green-600">💡 {issue.fix}</p>
                      </div>
                    </div>
                  ))}
                  {results.layoutIssues.length > 5 && (
                    <p className="text-sm text-muted-foreground text-center">
                      ... and {results.layoutIssues.length - 5} more issues
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Accessibility Issues */}
            {results.accessibilityIssues.length > 0 && (
              <div>
                <h3 className="flex items-center gap-2 font-semibold mb-3">
                  <Accessibility className="h-4 w-4" />
                  Accessibility Issues ({results.accessibilityIssues.length})
                </h3>
                <div className="space-y-2">
                  {results.accessibilityIssues.slice(0, 5).map((issue, index) => (
                    <div key={index} className="flex items-start gap-2 p-3 bg-muted rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <code className="text-xs bg-background px-1 py-0.5 rounded">
                            {issue.element}
                          </code>
                          {getSeverityBadge(issue.severity)}
                        </div>
                        <p className="text-sm text-muted-foreground mb-1">{issue.issue}</p>
                        <p className="text-xs text-green-600">💡 {issue.suggested_fix}</p>
                      </div>
                    </div>
                  ))}
                  {results.accessibilityIssues.length > 5 && (
                    <p className="text-sm text-muted-foreground text-center">
                      ... and {results.accessibilityIssues.length - 5} more issues
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Recommendations */}
            {results.recommendations.length > 0 && (
              <div>
                <h3 className="flex items-center gap-2 font-semibold mb-3">
                  <CheckCircle className="h-4 w-4" />
                  Recommendations
                </h3>
                <ul className="space-y-1">
                  {results.recommendations.map((recommendation, index) => (
                    <li key={index} className="text-sm text-muted-foreground">
                      • {recommendation}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Perfect Score */}
            {results.layoutIssues.length === 0 && results.accessibilityIssues.length === 0 && (
              <div className="text-center py-8">
                <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-2" />
                <h3 className="text-lg font-semibold text-green-600">Perfect Alignment!</h3>
                <p className="text-muted-foreground">
                  No layout or accessibility issues detected.
                </p>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default PerformanceAuditWidget;