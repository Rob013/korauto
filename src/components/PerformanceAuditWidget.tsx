import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { runComprehensiveAudit, ComprehensiveAuditResults } from '@/utils/comprehensiveAudit';
import { EnhancedAutoRepair, RepairResult } from '@/utils/enhancedAutoRepair';
import { AlertTriangle, CheckCircle, Zap, Eye, Accessibility, RefreshCw, Download, Settings, Wrench } from 'lucide-react';

const PerformanceAuditWidget: React.FC = () => {
  const [results, setResults] = useState<ComprehensiveAuditResults | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRepairing, setIsRepairing] = useState(false);
  const [repairResult, setRepairResult] = useState<RepairResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [autoRepair] = useState(() => new EnhancedAutoRepair());

  const runAudit = async () => {
    setIsLoading(true);
    setError(null);
    setRepairResult(null);
    
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

  const runAutoRepair = async () => {
    if (!results) return;
    
    setIsRepairing(true);
    try {
      const repairResults = await autoRepair.applyComprehensiveFixes(
        results.layoutIssues,
        results.accessibilityIssues
      );
      setRepairResult(repairResults);
      
      // Re-run audit to show improvements
      setTimeout(() => {
        runAudit();
      }, 1000);
      
    } catch (err) {
      console.error('Auto-repair error:', err);
      setError('Failed to apply automatic repairs');
    } finally {
      setIsRepairing(false);
    }
  };

  const downloadReport = () => {
    if (!results) return;
    
    let report = `
🚀 KORAUTO Performance & Accessibility Audit Report
===================================================

📈 Overall Score: ${results.overallScore.toFixed(1)}/100

📊 Performance Metrics:
- Overall Performance: ${results.performance.overallScore.toFixed(1)}/100
- Layout Shifts: ${results.performance.layoutShifts.toFixed(3)} (Lower is better)
- Animation Smoothness: ${results.performance.smoothnessScore.toFixed(1)}/100
- Image Load Time: ${results.performance.imageLoadTime.toFixed(0)}ms
- Scroll Performance: ${results.performance.scrollPerformance.toFixed(1)}/100

🎯 Layout Issues Found: ${results.layoutIssues.length}
♿ Accessibility Issues Found: ${results.accessibilityIssues.length}

🔧 Auto-Repair Capability: ${results.autoRepairEstimate}%
`;

    if (results.layoutIssues.length > 0) {
      report += '\n⚠️  Layout Issues:\n';
      results.layoutIssues.forEach((issue, index) => {
        report += `${index + 1}. ${issue.element}: ${issue.issue} (${issue.severity})\n`;
        report += `   💡 Fix: ${issue.fix}\n\n`;
      });
    }

    if (results.accessibilityIssues.length > 0) {
      report += '\n♿ Accessibility Issues:\n';
      results.accessibilityIssues.forEach((issue, index) => {
        report += `${index + 1}. ${issue.element}: ${issue.issue} (${issue.severity})\n`;
        report += `   💡 Fix: ${issue.suggested_fix}\n\n`;
      });
    }

    if (repairResult) {
      report += '\n🔧 Auto-Repair Results:\n';
      report += autoRepair.generateRepairReport(repairResult);
    }

    report += '\n🎯 Recommendations:\n';
    results.recommendations.forEach((recommendation, index) => {
      report += `${index + 1}. ${recommendation}\n`;
    });

    const blob = new Blob([report], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `korauto-audit-report-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
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
    <Card className="w-full max-w-6xl mx-auto">
      <CardHeader className="pb-4">
        <CardTitle className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <span className="flex items-center gap-2 text-lg sm:text-xl">
            <Zap className="h-5 w-5 sm:h-6 sm:w-6" />
            Website Performance & Accessibility Audit
          </span>
          <div className="flex flex-col sm:flex-row gap-2">
            <Button 
              onClick={runAudit} 
              disabled={isLoading || isRepairing}
              size="sm"
              className="flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              {isLoading ? 'Running...' : 'Run Audit'}
            </Button>
            
            {results && results.canAutoRepair && (
              <Button 
                onClick={runAutoRepair} 
                disabled={isLoading || isRepairing}
                size="sm"
                variant="secondary"
                className="flex items-center gap-2"
              >
                <Wrench className={`h-4 w-4 ${isRepairing ? 'animate-spin' : ''}`} />
                {isRepairing ? 'Repairing...' : `Auto-Fix (${results.autoRepairEstimate}%)`}
              </Button>
            )}
            
            {results && (
              <Button 
                onClick={downloadReport}
                size="sm"
                variant="outline"
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                <span className="hidden sm:inline">Download Report</span>
                <span className="sm:hidden">Report</span>
              </Button>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {isLoading && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Analyzing website performance and accessibility...</p>
          </div>
        )}

        {repairResult && (
          <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <h3 className="font-semibold text-green-800 dark:text-green-200">Auto-Repair Complete!</h3>
            </div>
            <div className="text-sm text-green-700 dark:text-green-300 space-y-1">
              <p>✅ Successfully fixed: {repairResult.fixed} issues</p>
              {repairResult.failed > 0 && <p>⚠️ Failed to fix: {repairResult.failed} issues</p>}
              <p>📊 Success rate: {repairResult.fixed + repairResult.failed > 0 ? 
                ((repairResult.fixed / (repairResult.fixed + repairResult.failed)) * 100).toFixed(1) : '100'}%</p>
            </div>
          </div>
        )}
        
        {results && (
          <>
            {/* Overall Score - Enhanced Mobile Layout */}
            <div className="text-center bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950 rounded-lg p-6">
              <div className={`text-4xl sm:text-5xl font-bold ${getScoreColor(results.overallScore)} mb-2`}>
                {results.overallScore.toFixed(1)}/100
              </div>
              <p className="text-muted-foreground text-sm sm:text-base">Overall Score</p>
              <Progress value={results.overallScore} className="mt-4 h-3" />
            </div>

            {/* Performance Metrics - Improved Mobile Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border-blue-200 dark:border-blue-800">
                <CardContent className="p-4 text-center">
                  <div className={`text-2xl sm:text-3xl font-semibold ${getScoreColor(results.performance.overallScore)} mb-1`}>
                    {results.performance.overallScore.toFixed(1)}
                  </div>
                  <p className="text-xs sm:text-sm text-blue-700 dark:text-blue-300">Performance Score</p>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950 dark:to-red-900 border-red-200 dark:border-red-800">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl sm:text-3xl font-semibold text-red-600 dark:text-red-400 mb-1">
                    {results.layoutIssues.length}
                  </div>
                  <p className="text-xs sm:text-sm text-red-700 dark:text-red-300">Layout Issues</p>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 border-purple-200 dark:border-purple-800">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl sm:text-3xl font-semibold text-purple-600 dark:text-purple-400 mb-1">
                    {results.accessibilityIssues.length}
                  </div>
                  <p className="text-xs sm:text-sm text-purple-700 dark:text-purple-300">A11y Issues</p>
                </CardContent>
              </Card>
            </div>

            {/* Auto-Repair Status */}
            {results.canAutoRepair && (
              <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Settings className="h-5 w-5 text-blue-600" />
                  <h3 className="font-semibold text-blue-800 dark:text-blue-200">Auto-Repair Available</h3>
                </div>
                <p className="text-sm text-blue-700 dark:text-blue-300 mb-3">
                  {results.autoRepairEstimate}% of detected issues can be automatically fixed.
                </p>
                <Button 
                  onClick={runAutoRepair} 
                  disabled={isRepairing}
                  className="w-full sm:w-auto"
                  variant="default"
                >
                  <Wrench className={`h-4 w-4 mr-2 ${isRepairing ? 'animate-spin' : ''}`} />
                  {isRepairing ? 'Applying Fixes...' : `Fix ${results.autoRepairEstimate}% Issues Automatically`}
                </Button>
              </div>
            )}

            {/* Layout Issues - Enhanced Mobile Layout */}
            {results.layoutIssues.length > 0 && (
              <div>
                <h3 className="flex items-center gap-2 font-semibold mb-3 text-base sm:text-lg">
                  <Eye className="h-4 w-4 sm:h-5 sm:w-5" />
                  Layout & Alignment Issues ({results.layoutIssues.length})
                </h3>
                <div className="space-y-3">
                  {results.layoutIssues.slice(0, 6).map((issue, index) => (
                    <div key={index} className="flex items-start gap-3 p-4 bg-muted/50 rounded-lg">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                          <code className="text-xs bg-background px-2 py-1 rounded break-all">
                            {issue.element}
                          </code>
                          {getSeverityBadge(issue.severity)}
                        </div>
                        <p className="text-sm text-muted-foreground mb-2 leading-relaxed">{issue.issue}</p>
                        <p className="text-xs text-green-600 leading-relaxed">💡 {issue.fix}</p>
                      </div>
                    </div>
                  ))}
                  {results.layoutIssues.length > 6 && (
                    <p className="text-sm text-muted-foreground text-center py-2 bg-muted/30 rounded">
                      ... and {results.layoutIssues.length - 6} more issues
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Accessibility Issues - Enhanced Mobile Layout */}
            {results.accessibilityIssues.length > 0 && (
              <div>
                <h3 className="flex items-center gap-2 font-semibold mb-3 text-base sm:text-lg">
                  <Accessibility className="h-4 w-4 sm:h-5 sm:w-5" />
                  Accessibility Issues ({results.accessibilityIssues.length})
                </h3>
                <div className="space-y-3">
                  {results.accessibilityIssues.slice(0, 6).map((issue, index) => (
                    <div key={index} className="flex items-start gap-3 p-4 bg-muted/50 rounded-lg">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                          <code className="text-xs bg-background px-2 py-1 rounded break-all">
                            {issue.element}
                          </code>
                          {getSeverityBadge(issue.severity)}
                        </div>
                        <p className="text-sm text-muted-foreground mb-2 leading-relaxed">{issue.issue}</p>
                        <p className="text-xs text-green-600 leading-relaxed">💡 {issue.suggested_fix}</p>
                      </div>
                    </div>
                  ))}
                  {results.accessibilityIssues.length > 6 && (
                    <p className="text-sm text-muted-foreground text-center py-2 bg-muted/30 rounded">
                      ... and {results.accessibilityIssues.length - 6} more issues
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Recommendations - Enhanced Layout */}
            {results.recommendations.length > 0 && (
              <div>
                <h3 className="flex items-center gap-2 font-semibold mb-3 text-base sm:text-lg">
                  <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5" />
                  Recommendations
                </h3>
                <div className="space-y-2">
                  {results.recommendations.map((recommendation, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                      <span className="text-blue-600 font-medium text-sm">{index + 1}.</span>
                      <p className="text-sm text-blue-800 dark:text-blue-200 leading-relaxed">
                        {recommendation}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Perfect Score - Enhanced */}
            {results.layoutIssues.length === 0 && results.accessibilityIssues.length === 0 && (
              <div className="text-center py-8 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 rounded-lg">
                <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-green-600 mb-2">Perfect Score! 🎉</h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  Excellent! No layout or accessibility issues detected. Your website meets high standards for performance and user experience.
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