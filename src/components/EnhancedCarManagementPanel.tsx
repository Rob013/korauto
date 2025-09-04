import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useEnhancedCarManagement } from '@/hooks/useEnhancedCarManagement';
import { AlertCircle, CheckCircle, Car, Trash2, Download, RefreshCw } from 'lucide-react';

export const EnhancedCarManagementPanel: React.FC = () => {
  const {
    triggerEnhancedSync,
    removeSoldCars,
    bulkDeleteCars,
    processImageCleanup,
    syncStatus,
    loading,
    error,
    lastOperation,
    activeCarsCount,
    totalCarsCount,
    clearError
  } = useEnhancedCarManagement();

  const [bulkDeleteIds, setBulkDeleteIds] = useState('');
  const [deleteReason, setDeleteReason] = useState('admin_bulk_delete');
  const [immediateRemoval, setImmediateRemoval] = useState(false);
  const [cleanupRelatedData, setCleanupRelatedData] = useState(true);
  const [batchSize, setBatchSize] = useState(100);
  const [lastResult, setLastResult] = useState<any>(null);

  const handleEnhancedSync = async (type: 'full' | 'incremental' | 'daily') => {
    try {
      const result = await triggerEnhancedSync(type);
      setLastResult(result);
    } catch (err) {
      console.error('Sync failed:', err);
    }
  };

  const handleRemoveSoldCars = async () => {
    try {
      const result = await removeSoldCars(immediateRemoval, cleanupRelatedData);
      setLastResult(result);
    } catch (err) {
      console.error('Remove sold cars failed:', err);
    }
  };

  const handleBulkDeleteCars = async () => {
    if (!bulkDeleteIds.trim()) {
      alert('Please enter car IDs to delete');
      return;
    }

    const carIds = bulkDeleteIds
      .split(/[,\n\s]+/)
      .map(id => id.trim())
      .filter(id => id.length > 0);

    if (carIds.length === 0) {
      alert('No valid car IDs found');
      return;
    }

    try {
      const result = await bulkDeleteCars(carIds, deleteReason);
      setLastResult(result);
      setBulkDeleteIds(''); // Clear the input after successful deletion
    } catch (err) {
      console.error('Bulk delete failed:', err);
    }
  };

  const handleProcessImageCleanup = async () => {
    try {
      const result = await processImageCleanup(batchSize);
      setLastResult(result);
    } catch (err) {
      console.error('Image cleanup failed:', err);
    }
  };

  const getSyncStatusColor = (status?: string) => {
    switch (status) {
      case 'running': return 'bg-blue-500';
      case 'completed': return 'bg-green-500';
      case 'completed_with_errors': return 'bg-yellow-500';
      case 'failed': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center gap-2 mb-6">
        <Car className="h-8 w-8 text-blue-600" />
        <h1 className="text-3xl font-bold">Enhanced Car Management Panel</h1>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            {error}
            <Button variant="ghost" size="sm" onClick={clearError}>
              Dismiss
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Active Cars</p>
                <p className="text-2xl font-bold">{activeCarsCount.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Car className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Total Cars</p>
                <p className="text-2xl font-bold">{totalCarsCount.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              {syncStatus && (
                <div className={`h-3 w-3 rounded-full ${getSyncStatusColor(syncStatus.status)}`} />
              )}
              <div>
                <p className="text-sm font-medium text-gray-600">Sync Status</p>
                <p className="text-lg font-semibold">
                  {syncStatus?.status || 'Unknown'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sync Operations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5" />
            Enhanced Sync Operations
          </CardTitle>
          <CardDescription>
            Trigger enhanced car sync with improved validation and error handling
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button 
              onClick={() => handleEnhancedSync('incremental')}
              disabled={loading}
              variant="outline"
            >
              Incremental Sync
            </Button>
            <Button 
              onClick={() => handleEnhancedSync('daily')}
              disabled={loading}
              variant="outline"
            >
              Daily Sync
            </Button>
            <Button 
              onClick={() => handleEnhancedSync('full')}
              disabled={loading}
              variant="outline"
            >
              Full Sync
            </Button>
          </div>
          
          {syncStatus && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
              <div>
                <Label className="text-xs">Progress</Label>
                <p className="font-mono text-sm">
                  {syncStatus.current_page}/{syncStatus.total_pages} pages
                </p>
              </div>
              <div>
                <Label className="text-xs">Cars Processed</Label>
                <p className="font-mono text-sm">{syncStatus.cars_processed.toLocaleString()}</p>
              </div>
              <div>
                <Label className="text-xs">Archived</Label>
                <p className="font-mono text-sm">{syncStatus.archived_lots_processed.toLocaleString()}</p>
              </div>
              <div>
                <Label className="text-xs">Type</Label>
                <Badge variant="secondary">{syncStatus.sync_type}</Badge>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sold Car Removal */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trash2 className="h-5 w-5" />
            Sold Car Removal
          </CardTitle>
          <CardDescription>
            Remove sold cars with options for immediate removal and related data cleanup
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Switch
              id="immediate-removal"
              checked={immediateRemoval}
              onCheckedChange={setImmediateRemoval}
            />
            <Label htmlFor="immediate-removal">
              Immediate removal (bypass 24-hour delay)
            </Label>
          </div>
          
          <div className="flex items-center space-x-2">
            <Switch
              id="cleanup-related"
              checked={cleanupRelatedData}
              onCheckedChange={setCleanupRelatedData}
            />
            <Label htmlFor="cleanup-related">
              Clean up related data (favorites, views, images)
            </Label>
          </div>
          
          <Button 
            onClick={handleRemoveSoldCars}
            disabled={loading}
            className="w-full"
          >
            Remove Sold Cars
          </Button>
        </CardContent>
      </Card>

      {/* Bulk Car Deletion */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trash2 className="h-5 w-5" />
            Bulk Car Deletion
          </CardTitle>
          <CardDescription>
            Delete multiple cars by ID with custom reason
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="car-ids">Car IDs (comma or newline separated)</Label>
            <Textarea
              id="car-ids"
              placeholder="12345, 67890, 13579..."
              value={bulkDeleteIds}
              onChange={(e) => setBulkDeleteIds(e.target.value)}
              className="mt-1"
              rows={3}
            />
          </div>
          
          <div>
            <Label htmlFor="delete-reason">Delete Reason</Label>
            <Input
              id="delete-reason"
              value={deleteReason}
              onChange={(e) => setDeleteReason(e.target.value)}
              className="mt-1"
              placeholder="admin_bulk_delete"
            />
          </div>
          
          <Button 
            onClick={handleBulkDeleteCars}
            disabled={loading || !bulkDeleteIds.trim()}
            variant="destructive"
            className="w-full"
          >
            Bulk Delete Cars
          </Button>
        </CardContent>
      </Card>

      {/* Image Cleanup */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Image Cleanup
          </CardTitle>
          <CardDescription>
            Process queued image cleanup tasks
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="batch-size">Batch Size</Label>
            <Input
              id="batch-size"
              type="number"
              value={batchSize}
              onChange={(e) => setBatchSize(parseInt(e.target.value) || 100)}
              className="mt-1"
              min="1"
              max="1000"
            />
          </div>
          
          <Button 
            onClick={handleProcessImageCleanup}
            disabled={loading}
            variant="outline"
            className="w-full"
          >
            Process Image Cleanup Queue
          </Button>
        </CardContent>
      </Card>

      {/* Last Operation Result */}
      {lastResult && (
        <Card>
          <CardHeader>
            <CardTitle>Last Operation Result</CardTitle>
            <CardDescription>
              Operation: {lastOperation} | {lastResult.timestamp}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <pre className="bg-gray-100 p-4 rounded-lg overflow-auto text-sm">
              {JSON.stringify(lastResult, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}

      {/* Loading Indicator */}
      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="p-6">
            <div className="flex items-center space-x-4">
              <RefreshCw className="h-6 w-6 animate-spin" />
              <div>
                <p className="font-semibold">Processing...</p>
                <p className="text-sm text-gray-600">
                  {lastOperation && `Running ${lastOperation.replace(/_/g, ' ')}`}
                </p>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};