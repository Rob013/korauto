import React, { useState, useEffect } from 'react';
import { navigationErrorLogger, NavigationErrorLog } from '@/utils/navigationErrorLogger';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const NavigationErrorViewer: React.FC = () => {
  const [errorLog, setErrorLog] = useState<NavigationErrorLog | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Load errors from localStorage on component mount
    navigationErrorLogger.loadFromLocalStorage();
    loadErrors();
  }, []);

  const loadErrors = () => {
    const log = navigationErrorLogger.getErrorLog();
    setErrorLog(log);
  };

  const clearErrors = () => {
    navigationErrorLogger.clearErrors();
    loadErrors();
  };

  const exportErrors = () => {
    const json = navigationErrorLogger.exportAsJSON();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `navigation-errors-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (!isVisible) {
    return (
      <div className="fixed bottom-4 right-4">
        <Button
          onClick={() => setIsVisible(true)}
          className="bg-red-500 hover:bg-red-600 text-white"
          size="sm"
        >
          Debug: View Navigation Errors ({errorLog?.errors.length || 0})
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl max-h-[80vh] overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Navigation Error Log</CardTitle>
          <div className="flex gap-2">
            <Button onClick={loadErrors} size="sm" variant="outline">
              Refresh
            </Button>
            <Button onClick={clearErrors} size="sm" variant="outline">
              Clear
            </Button>
            <Button onClick={exportErrors} size="sm" variant="outline">
              Export
            </Button>
            <Button onClick={() => setIsVisible(false)} size="sm" variant="outline">
              Close
            </Button>
          </div>
        </CardHeader>
        <CardContent className="overflow-auto max-h-[60vh]">
          {errorLog && errorLog.errors.length > 0 ? (
            <div className="space-y-4">
              <div className="text-sm text-gray-600">
                Last Updated: {errorLog.lastUpdated ? new Date(errorLog.lastUpdated).toLocaleString() : 'Never'}
              </div>
              {errorLog.errors.map((error, index) => (
                <div key={error.id} className="border rounded p-3 bg-red-50">
                  <div className="flex justify-between items-start mb-2">
                    <div className="font-semibold text-red-800">
                      Error #{index + 1} - {error.errorType}
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(error.timestamp).toLocaleString()}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                    <div><strong>Path:</strong> {error.path}</div>
                    <div><strong>Referrer:</strong> {error.referrer || 'None'}</div>
                    {error.message && (
                      <div className="md:col-span-2">
                        <strong>Message:</strong> {error.message}
                      </div>
                    )}
                    <div className="md:col-span-2 text-xs text-gray-600">
                      <strong>User Agent:</strong> {error.userAgent}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-gray-500 py-8">
              No navigation errors logged yet.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default NavigationErrorViewer;