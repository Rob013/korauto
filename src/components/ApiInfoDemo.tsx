import React from 'react';
import ApiInfoDashboard from '@/components/ApiInfoDashboard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const ApiInfoDemo = () => {
  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">API Information Dashboard Demo</CardTitle>
            <CardDescription>
              This demonstrates the new API Info section that has been added to the Admin Dashboard.
              It provides comprehensive information about all available APIs, data sources, and mappings.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border bg-card">
              <ApiInfoDashboard />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ApiInfoDemo;