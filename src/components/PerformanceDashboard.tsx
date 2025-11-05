import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { usePerformanceAudit } from "@/hooks/usePerformanceAudit";
import { useAdminCheck } from "@/hooks/useAdminCheck";
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  Gauge, 
  Image, 
  Layout, 
  Monitor,
  Zap,
  Settings,
  Play,
  RefreshCw,
  Download
} from "lucide-react";

const PerformanceDashboard = () => {
  const { metrics, isAuditing, runAudit, generateReport, applyFixes, error } = usePerformanceAudit();
  const { isAdmin, isLoading } = useAdminCheck();
  const [showReport, setShowReport] = useState(false);

  if (isLoading) {
    return (
      <div className="container-responsive py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="container-responsive py-8">
        <div className="text-center max-w-md mx-auto">
          <h1 className="text-2xl font-bold mb-4">Access Restricted</h1>
          <p className="text-muted-foreground">
            Performance monitoring tools are only available to administrators.
          </p>
        </div>
      </div>
    );
  }

  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-green-600";
    if (score >= 70) return "text-yellow-600";
    return "text-red-600";
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'default';
    }
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

  return (
    <div className="container-responsive p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Performance Dashboard</h1>
          <p className="text-muted-foreground">Monitor and optimize website alignment and smoothness</p>
        </div>
        
        <div className="flex gap-2">
          <Button 
            onClick={runAudit} 
            disabled={isAuditing}
            className="flex items-center gap-2"
          >
            {isAuditing ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Play className="h-4 w-4" />
            )}
            {isAuditing ? 'Auditing...' : 'Run Audit'}
          </Button>
          
          {metrics && (
            <Button 
              onClick={downloadReport}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Download Report
            </Button>
          )}
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {metrics && (
        <>
          {/* Overall Score */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Gauge className="h-5 w-5" />
                Overall Performance Score
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <div className={`text-4xl font-bold ${getScoreColor(metrics.overallScore)}`}>
                    {metrics.overallScore.toFixed(1)}
                  </div>
                  <div className="text-sm text-muted-foreground">out of 100</div>
                </div>
                <div className="flex-1 mx-8">
                  <Progress value={metrics.overallScore} className="h-3" />
                </div>
                <div className="text-right">
                  {metrics.overallScore >= 90 ? (
                    <Badge variant="default" className="bg-green-500">Excellent</Badge>
                  ) : metrics.overallScore >= 70 ? (
                    <Badge variant="default" className="bg-yellow-500">Good</Badge>
                  ) : (
                    <Badge variant="destructive">Needs Improvement</Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Layout Shifts</CardTitle>
                <Layout className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.layoutShifts.toFixed(3)}</div>
                <p className="text-xs text-muted-foreground">
                  {metrics.layoutShifts < 0.1 ? '✅ Good' : '⚠️ High'}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Animation Smoothness</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.animationFrameRate.toFixed(1)}%</div>
                <p className="text-xs text-muted-foreground">
                  {metrics.animationFrameRate >= 90 ? '✅ Smooth' : '⚠️ Choppy'}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Image Load Time</CardTitle>
                <Image className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.imageLoadTime.toFixed(0)}ms</div>
                <p className="text-xs text-muted-foreground">
                  {metrics.imageLoadTime < 1000 ? '✅ Fast' : '⚠️ Slow'}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Scroll Performance</CardTitle>
                <Monitor className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.scrollPerformance.toFixed(0)}</div>
                <p className="text-xs text-muted-foreground">
                  {metrics.scrollPerformance >= 90 ? '✅ Smooth' : '⚠️ Janky'}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Issues and Fixes */}
          <Tabs defaultValue="issues" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="issues" className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Issues ({metrics.alignmentIssues.length})
              </TabsTrigger>
              <TabsTrigger value="report" className="flex items-center gap-2">
                <Monitor className="h-4 w-4" />
                Detailed Report
              </TabsTrigger>
            </TabsList>

            <TabsContent value="issues" className="space-y-4">
              {metrics.alignmentIssues.length === 0 ? (
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center py-8">
                      <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-green-700">No Issues Found!</h3>
                      <p className="text-muted-foreground">Your website alignment and smoothness look great.</p>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <>
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold">Alignment Issues</h3>
                    <Button 
                      onClick={applyFixes}
                      className="flex items-center gap-2"
                      size="sm"
                    >
                      <Zap className="h-4 w-4" />
                      Auto-Fix Issues
                    </Button>
                  </div>
                  
                  <div className="space-y-3">
                    {metrics.alignmentIssues.map((issue, index) => (
                      <Card key={index}>
                        <CardContent className="pt-6">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <Badge variant={getSeverityColor(issue.severity)}>
                                  {issue.severity}
                                </Badge>
                                <code className="text-sm bg-muted px-2 py-1 rounded">
                                  {issue.element}
                                </code>
                              </div>
                              <h4 className="font-medium mb-1">{issue.issue}</h4>
                              <p className="text-sm text-muted-foreground mb-2">
                                💡 <strong>Suggested fix:</strong> {issue.suggested_fix}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Position: {issue.position.top.toFixed(0)}px, {issue.position.left.toFixed(0)}px
                                ({issue.position.width.toFixed(0)}×{issue.position.height.toFixed(0)})
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </>
              )}
            </TabsContent>

            <TabsContent value="report">
              <Card>
                <CardHeader>
                  <CardTitle>Detailed Performance Report</CardTitle>
                  <CardDescription>Complete analysis of your website's performance</CardDescription>
                </CardHeader>
                <CardContent>
                  <pre className="whitespace-pre-wrap text-sm bg-muted p-4 rounded-lg overflow-auto max-h-96">
                    {generateReport()}
                  </pre>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}

      {!metrics && !isAuditing && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <Settings className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Ready to Audit</h3>
              <p className="text-muted-foreground mb-6">
                Click "Run Audit" to analyze your website's performance, alignment, and smoothness.
              </p>
              <Button onClick={runAudit} size="lg" className="flex items-center gap-2">
                <Play className="h-5 w-5" />
                Start Performance Audit
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default PerformanceDashboard;