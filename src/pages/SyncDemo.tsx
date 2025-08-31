import React from 'react';
import { EnhancedSyncDashboard } from '@/components/EnhancedSyncDashboard';
import { FullCarsSyncTrigger } from '@/components/FullCarsSyncTrigger';
import { AutoResumeScheduler } from '@/components/AutoResumeScheduler';
import { AISyncCoordinator } from '@/components/AISyncCoordinator';

const SyncDemo = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Background Services */}
      <AutoResumeScheduler enabled={true} checkIntervalMinutes={1} />
      <AISyncCoordinator enabled={true} maxRetries={5} retryDelayMs={2000} />
      
      <div className="container max-w-6xl mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-4xl font-bold mb-2">🚀 Enhanced Maximum Speed Sync System</h1>
          <p className="text-muted-foreground text-lg">
            Resume from 116,193 records and complete 100% sync with full API data mapping.
          </p>
        </div>

        <div className="space-y-8">
          {/* Enhanced Sync Dashboard */}
          <EnhancedSyncDashboard />

          {/* Original Sync Trigger (Legacy) */}
          <div className="border-t pt-8">
            <h2 className="text-2xl font-semibold mb-4">Legacy Sync System</h2>
            <FullCarsSyncTrigger />
          </div>

          <div className="bg-gradient-to-r from-blue-50 to-green-50 border border-blue-200 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-blue-800 mb-3">🎯 Enhanced Sync Features v2.0</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-medium text-blue-700 mb-2">🚀 Maximum Speed</h3>
                <ul className="text-sm text-blue-600 space-y-1">
                  <li>• Resume from exactly 116,193 records</li>
                  <li>• 15 concurrent API requests</li>
                  <li>• 1,000 record batches</li>
                  <li>• 100ms minimal delays</li>
                  <li>• Never stalls or pauses</li>
                </ul>
              </div>
              <div>
                <h3 className="font-medium text-green-700 mb-2">🗄️ Complete API Mapping</h3>
                <ul className="text-sm text-green-600 space-y-1">
                  <li>• 30+ new database fields added</li>
                  <li>• Engine/performance data</li>
                  <li>• Complete image processing</li>
                  <li>• Vehicle history & documentation</li>
                  <li>• Auction metadata & features</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SyncDemo;