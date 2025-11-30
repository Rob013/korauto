/**
 * Encar Cache Status Component
 * 
 * Displays cache health and allows manual refresh trigger
 * Shows in catalog header to inform users about data source
 */

import { useEncarCacheHealth, useEncarSyncStatus } from '@/hooks/useEncarCache';
import { useAdminCheck } from '@/hooks/useAdminCheck';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Database, RefreshCw, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface EncarCacheStatusProps {
    source?: 'cache' | 'api' | 'none';
    compact?: boolean;
}

export function EncarCacheStatus({ source, compact = false }: EncarCacheStatusProps) {
    const { isAdmin, isLoading: adminLoading } = useAdminCheck();
    const { data: cacheHealth, isLoading: healthLoading } = useEncarCacheHealth();
    const { data: syncStatus, isLoading: syncLoading } = useEncarSyncStatus();

    // Only show to admins
    if (!isAdmin && !adminLoading) {
        return null;
    }

    if (healthLoading || syncLoading) {
        return (
            <Badge variant="outline" className="gap-1">
                <RefreshCw className="h-3 w-3 animate-spin" />
                Loading...
            </Badge>
        );
    }

    const isUsingCache = source === 'cache';
    const isHealthy = cacheHealth?.available && !cacheHealth?.isStale;

    if (compact) {
        return (
            <Badge
                variant={isUsingCache ? "default" : "outline"}
                className="gap-1"
            >
                <Database className="h-3 w-3" />
                {isUsingCache ? 'Cached' : 'Live'}
            </Badge>
        );
    }

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-2">
                    {isHealthy ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                        <AlertCircle className="h-4 w-4 text-yellow-500" />
                    )}
                    <span className="hidden sm:inline">
                        {isUsingCache ? 'Using Cache' : 'Using Live API'}
                    </span>
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80">
                <div className="space-y-4">
                    <div>
                        <h4 className="font-semibold mb-2">Data Source Status</h4>
                        <div className="space-y-2 text-sm">
                            <div className="flex items-center justify-between">
                                <span className="text-muted-foreground">Current Source:</span>
                                <Badge variant={isUsingCache ? "default" : "outline"}>
                                    {isUsingCache ? 'Supabase Cache' : 'Encar API'}
                                </Badge>
                            </div>

                            {cacheHealth?.available && (
                                <>
                                    <div className="flex items-center justify-between">
                                        <span className="text-muted-foreground">Cached Cars:</span>
                                        <span className="font-medium">{cacheHealth.carCount.toLocaleString()}</span>
                                    </div>

                                    {cacheHealth.lastSyncTime && (
                                        <div className="flex items-center justify-between">
                                            <span className="text-muted-foreground">Last Sync:</span>
                                            <span className="font-medium text-xs">
                                                {formatDistanceToNow(new Date(cacheHealth.lastSyncTime), { addSuffix: true })}
                                            </span>
                                        </div>
                                    )}

                                    {cacheHealth.isStale && (
                                        <div className="flex items-center gap-2 p-2 bg-yellow-50 dark:bg-yellow-950 rounded text-yellow-800 dark:text-yellow-200">
                                            <Clock className="h-4 w-4" />
                                            <span className="text-xs">Cache data is stale (30+ min old)</span>
                                        </div>
                                    )}
                                </>
                            )}

                            {!cacheHealth?.available && (
                                <div className="flex items-center gap-2 p-2 bg-muted rounded">
                                    <AlertCircle className="h-4 w-4" />
                                    <span className="text-xs">Cache not available - using live API</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {syncStatus && (
                        <div className="pt-4 border-t">
                            <h4 className="font-semibold mb-2 text-sm">Last Sync Job</h4>
                            <div className="space-y-1 text-xs">
                                <div className="flex items-center justify-between">
                                    <span className="text-muted-foreground">Status:</span>
                                    <Badge
                                        variant={syncStatus.status === 'completed' ? 'default' : 'destructive'}
                                        className="text-xs"
                                    >
                                        {syncStatus.status}
                                    </Badge>
                                </div>
                                {syncStatus.cars_processed > 0 && (
                                    <>
                                        <div className="flex items-center justify-between">
                                            <span className="text-muted-foreground">Processed:</span>
                                            <span>{syncStatus.cars_processed}</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-muted-foreground">Added:</span>
                                            <span className="text-green-600">{syncStatus.cars_added}</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-muted-foreground">Updated:</span>
                                            <span className="text-blue-600">{syncStatus.cars_updated}</span>
                                        </div>
                                    </>
                                )}
                                {syncStatus.error_message && (
                                    <div className="p-2 bg-destructive/10 rounded text-destructive">
                                        {syncStatus.error_message}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    <div className="pt-2 border-t">
                        <p className="text-xs text-muted-foreground">
                            Cache updates automatically every 15 minutes for optimal performance.
                        </p>
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    );
}
