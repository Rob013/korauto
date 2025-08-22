import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { useComprehensiveAudit } from '@/hooks/useComprehensiveAudit';
import { 
  Smartphone,
  Monitor,
  Eye,
  Search,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  Download,
  TrendingUp,
  Zap,
  Image,
  Clock,
  ShieldCheck
} from 'lucide-react';

const ComprehensivePerformanceDashboard: React.FC = () => {
  const { 
    metrics, 
    isLoading, 
    error, 
    runAudit, 
    generateReport, 
    getScore, 
    isPassingThresholds,
    getRecommendations,
    isEnabled 
  } = useComprehensiveAudit({ enabled: true });

  const [reportVisible, setReportVisible] = useState(false);

  useEffect(() => {
    // Auto-run audit on component mount
    if (isEnabled) {
      const timer = setTimeout(() => {
        runAudit();
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [isEnabled, runAudit]);

  const getScoreColor = (score: number | null) => {
    if (score === null) return 'bg-gray-500';
    if (score >= 90) return 'bg-green-500';
    if (score >= 70) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getScoreIcon = (score: number | null) => {
    if (score === null) return <Clock className="h-4 w-4" />;
    if (score >= 90) return <CheckCircle className="h-4 w-4 text-green-500" />;
    return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
  };

  const downloadReport = () => {
    const report = generateReport();
    const blob = new Blob([report], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `korauto-performance-report-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (!isEnabled) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-6 text-center">
            <h2 className="text-xl font-semibold mb-2">Performance Dashboard</h2>
            <p className="text-muted-foreground">Performance monitoring is not available in this environment.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Performance Dashboard</h1>
          <p className="text-muted-foreground">Comprehensive performance, accessibility, and mobile optimization metrics</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={runAudit} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            {isLoading ? 'Auditing...' : 'Run Audit'}
          </Button>
          {metrics && (
            <Button variant="outline" onClick={downloadReport}>
              <Download className="h-4 w-4 mr-2" />
              Download Report
            </Button>
          )}
        </div>
      </div>

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-red-700">
              <AlertTriangle className="h-4 w-4" />
              <span>Error: {error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Scores */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Mobile Score */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Smartphone className="h-4 w-4 text-blue-500" />
              <CardTitle className="text-sm">Mobile</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              {getScoreIcon(getScore('mobile'))}
              <Badge className={`${getScoreColor(getScore('mobile'))} text-white`}>
                {getScore('mobile') || 'N/A'}
              </Badge>
            </div>
            {metrics && (
              <Progress 
                value={metrics.mobileScore} 
                className="mt-2" 
                aria-label={`Mobile score: ${metrics.mobileScore}%`}
              />
            )}
          </CardContent>
        </Card>

        {/* Desktop Score */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Monitor className="h-4 w-4 text-purple-500" />
              <CardTitle className="text-sm">Desktop</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              {getScoreIcon(getScore('desktop'))}
              <Badge className={`${getScoreColor(getScore('desktop'))} text-white`}>
                {getScore('desktop') || 'N/A'}
              </Badge>
            </div>
            {metrics && (
              <Progress 
                value={metrics.desktopScore} 
                className="mt-2"
                aria-label={`Desktop score: ${metrics.desktopScore}%`}
              />
            )}
          </CardContent>
        </Card>

        {/* Accessibility Score */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4 text-green-500" />
              <CardTitle className="text-sm">Accessibility</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              {getScoreIcon(getScore('accessibility'))}
              <Badge className={`${getScoreColor(getScore('accessibility'))} text-white`}>
                {getScore('accessibility') || 'N/A'}
              </Badge>
            </div>
            {metrics && (
              <Progress 
                value={metrics.accessibilityScore} 
                className="mt-2"
                aria-label={`Accessibility score: ${metrics.accessibilityScore}%`}
              />
            )}
          </CardContent>
        </Card>

        {/* SEO Score */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-orange-500" />
              <CardTitle className="text-sm">SEO</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              {getScoreIcon(getScore('seo'))}
              <Badge className={`${getScoreColor(getScore('seo'))} text-white`}>
                {getScore('seo') || 'N/A'}
              </Badge>
            </div>
            {metrics && (
              <Progress 
                value={metrics.seoScore} 
                className="mt-2"
                aria-label={`SEO score: ${metrics.seoScore}%`}
              />
            )}
          </CardContent>
        </Card>

        {/* Best Practices */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-indigo-500" />
              <CardTitle className="text-sm">Best Practices</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              {getScoreIcon(getScore('bestPractices'))}
              <Badge className={`${getScoreColor(getScore('bestPractices'))} text-white`}>
                {getScore('bestPractices') || 'N/A'}
              </Badge>
            </div>
            {metrics && (
              <Progress 
                value={metrics.bestPracticesScore} 
                className="mt-2"
                aria-label={`Best practices score: ${metrics.bestPracticesScore}%`}
              />
            )}
          </CardContent>
        </Card>
      </div>

      {metrics && (
        <>
          {/* Core Web Vitals */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-yellow-500" />
                Core Web Vitals
              </CardTitle>
              <CardDescription>
                Essential metrics for user experience
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {metrics.coreWebVitals.lcp.toFixed(0)}ms
                  </div>
                  <div className="text-sm text-muted-foreground">LCP</div>
                  <div className="text-xs">Largest Contentful Paint</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {metrics.coreWebVitals.fid.toFixed(0)}ms
                  </div>
                  <div className="text-sm text-muted-foreground">FID</div>
                  <div className="text-xs">First Input Delay</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {metrics.coreWebVitals.cls.toFixed(3)}
                  </div>
                  <div className="text-sm text-muted-foreground">CLS</div>
                  <div className="text-xs">Cumulative Layout Shift</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">
                    {metrics.coreWebVitals.fcp.toFixed(0)}ms
                  </div>
                  <div className="text-sm text-muted-foreground">FCP</div>
                  <div className="text-xs">First Contentful Paint</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">
                    {metrics.coreWebVitals.ttfb.toFixed(0)}ms
                  </div>
                  <div className="text-sm text-muted-foreground">TTFB</div>
                  <div className="text-xs">Time to First Byte</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Mobile Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Smartphone className="h-5 w-5 text-blue-500" />
                  Mobile Optimization
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Touch Target Compliance</span>
                  <Badge variant="secondary">
                    {metrics.mobileMetrics.touchTargetScore.toFixed(1)}%
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Viewport Optimization</span>
                  <Badge variant="secondary">
                    {metrics.mobileMetrics.viewportOptimization}%
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Network Efficiency</span>
                  <Badge variant="secondary">
                    {metrics.mobileMetrics.networkEfficiency}%
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Battery Impact</span>
                  <Badge variant="secondary">
                    {metrics.mobileMetrics.batteryImpact}%
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Image className="h-5 w-5 text-green-500" />
                  Image Performance
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Total Images</span>
                  <Badge variant="secondary">
                    {metrics.imageMetrics.totalImages}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Successfully Loaded</span>
                  <Badge variant="secondary">
                    {metrics.imageMetrics.loadedImages}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Failed to Load</span>
                  <Badge variant={metrics.imageMetrics.errorImages > 0 ? "destructive" : "secondary"}>
                    {metrics.imageMetrics.errorImages}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Average Load Time</span>
                  <Badge variant="secondary">
                    {metrics.imageMetrics.averageLoadTime.toFixed(0)}ms
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recommendations */}
          {getRecommendations().length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-orange-500" />
                  Recommendations
                </CardTitle>
                <CardDescription>
                  Suggested improvements to reach 100% scores
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {getRecommendations().map((recommendation, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{recommendation}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Detailed Report */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Detailed Report</CardTitle>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setReportVisible(!reportVisible)}
                >
                  {reportVisible ? 'Hide' : 'Show'} Details
                </Button>
              </div>
            </CardHeader>
            {reportVisible && (
              <CardContent>
                <pre className="text-xs bg-muted p-4 rounded-md overflow-auto max-h-96">
                  {generateReport()}
                </pre>
              </CardContent>
            )}
          </Card>
        </>
      )}

      {isLoading && !metrics && (
        <Card>
          <CardContent className="p-8 text-center">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-500" />
            <h3 className="text-lg font-semibold mb-2">Running Comprehensive Audit</h3>
            <p className="text-muted-foreground">
              Analyzing performance, accessibility, and mobile optimization...
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ComprehensivePerformanceDashboard;