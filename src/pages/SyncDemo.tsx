import React from 'react';
import { FullCarsSyncTrigger } from '@/components/FullCarsSyncTrigger';
import { ResumeSyncTrigger } from '@/components/ResumeSyncTrigger';
import { AutoResumeScheduler } from '@/components/AutoResumeScheduler';
import { AISyncCoordinator } from '@/components/AISyncCoordinator';

const SyncDemo = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Background Services */}
      <AutoResumeScheduler enabled={true} checkIntervalMinutes={1} />
      <AISyncCoordinator enabled={true} maxRetries={5} retryDelayMs={2000} />
      
      <div className="container max-w-4xl mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">🚀 Enhanced Sync System Demo</h1>
          <p className="text-muted-foreground">
            Resume or start sync operations with intelligent error handling and progress tracking.
          </p>
        </div>

        <div className="space-y-6">
          {/* Resume Sync Control */}
          <ResumeSyncTrigger />

          {/* Original Sync Trigger */}
          <FullCarsSyncTrigger />

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h2 className="text-lg font-semibold text-blue-800 mb-2">📋 How Resume Works</h2>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• <strong>Automatic Resume:</strong> Failed syncs auto-resume after 2 minutes</li>
              <li>• <strong>Stuck Detection:</strong> Running syncs that are inactive for 5+ minutes are auto-healed</li>
              <li>• <strong>Progress Tracking:</strong> Sync continues from the last successful page</li>
              <li>• <strong>Real-time Updates:</strong> Status updates automatically as sync progresses</li>
              <li>• <strong>Error Recovery:</strong> Intelligent retry with exponential backoff</li>
              <li>• <strong>Manual Control:</strong> Resume button available for failed/paused syncs</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SyncDemo;