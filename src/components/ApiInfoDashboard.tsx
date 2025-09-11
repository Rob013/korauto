import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Database, 
  Globe, 
  Activity, 
  RefreshCw, 
  CheckCircle, 
  AlertCircle,
  Map,
  Settings,
  BarChart3,
  FileText,
  Filter,
  Calendar,
  Hash
} from 'lucide-react';
import { useApiInfo, ApiEndpoint, ApiDataInfo } from '@/hooks/useApiInfo';

const ApiInfoDashboard = () => {
  const { apiInfo, loading, error, refresh } = useApiInfo();

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-10 w-24" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center space-x-2 text-red-600">
            <AlertCircle className="h-5 w-5" />
            <span>Error loading API information: {error}</span>
          </div>
          <Button onClick={refresh} className="mt-4">
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!apiInfo) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'inactive': return 'bg-red-500';
      case 'deprecated': return 'bg-orange-500';
      default: return 'bg-gray-500';
    }
  };

  const formatNumber = (num: number) => {
    return num.toLocaleString();
  };

  const EndpointCard = ({ endpoint }: { endpoint: ApiEndpoint }) => (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{endpoint.name}</CardTitle>
          <Badge className={getStatusColor(endpoint.status)}>
            {endpoint.status}
          </Badge>
        </div>
        <CardDescription>{endpoint.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div>
            <div className="flex items-center space-x-2 text-sm">
              <span className="font-medium">{endpoint.method}</span>
              <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-xs">
                {endpoint.url}
              </code>
            </div>
          </div>
          
          <div>
            <h4 className="font-medium text-sm mb-2">Parameters:</h4>
            <div className="space-y-1">
              {Object.entries(endpoint.parameters).map(([key, type]) => (
                <div key={key} className="flex justify-between text-xs">
                  <code className="text-blue-600 dark:text-blue-400">{key}</code>
                  <span className="text-gray-500">{String(type)}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h4 className="font-medium text-sm mb-2">Response Schema:</h4>
            <div className="space-y-1">
              {Object.entries(endpoint.responseSchema).map(([key, type]) => (
                <div key={key} className="flex justify-between text-xs">
                  <code className="text-green-600 dark:text-green-400">{key}</code>
                  <span className="text-gray-500">{String(type)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const DataInfoCard = ({ dataInfo }: { dataInfo: ApiDataInfo }) => (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center space-x-2">
          <Database className="h-5 w-5" />
          <span>{dataInfo.tableName}</span>
        </CardTitle>
        <CardDescription>{dataInfo.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Records:</span>
            <Badge variant="outline">{formatNumber(dataInfo.recordCount)}</Badge>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Last Updated:</span>
            <span className="text-xs text-gray-500">
              {new Date(dataInfo.lastUpdated).toLocaleString()}
            </span>
          </div>
          
          <div>
            <h4 className="font-medium text-sm mb-2">Columns:</h4>
            <div className="flex flex-wrap gap-1">
              {dataInfo.columns.slice(0, 8).map((column) => (
                <Badge key={column} variant="secondary" className="text-xs">
                  {column}
                </Badge>
              ))}
              {dataInfo.columns.length > 8 && (
                <Badge variant="outline" className="text-xs">
                  +{dataInfo.columns.length - 8} more
                </Badge>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">API Information Dashboard</h1>
          <p className="text-muted-foreground">
            Comprehensive overview of all available APIs, data sources, and mappings
          </p>
        </div>
        <Button onClick={refresh} size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </header>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Endpoints</CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{apiInfo.stats.totalEndpoints}</div>
            <p className="text-xs text-muted-foreground">
              {apiInfo.stats.activeEndpoints} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Records</CardTitle>
            <Hash className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(apiInfo.stats.totalRecords)}</div>
            <p className="text-xs text-muted-foreground">
              Across {apiInfo.stats.totalTables} tables
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sync Status</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              {apiInfo.stats.syncStatus === 'completed' ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <AlertCircle className="h-5 w-5 text-yellow-500" />
              )}
              <span className="text-sm font-medium capitalize">
                {apiInfo.stats.syncStatus || 'Unknown'}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              {apiInfo.stats.lastSyncTime && 
                new Date(apiInfo.stats.lastSyncTime).toLocaleString()
              }
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Last Updated</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-sm font-bold">
              {new Date().toLocaleDateString()}
            </div>
            <p className="text-xs text-muted-foreground">
              {new Date().toLocaleTimeString()}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabbed Content */}
      <Tabs defaultValue="endpoints" className="space-y-4">
        <TabsList>
          <TabsTrigger value="endpoints" className="flex items-center space-x-2">
            <Globe className="h-4 w-4" />
            <span>Endpoints</span>
          </TabsTrigger>
          <TabsTrigger value="data" className="flex items-center space-x-2">
            <Database className="h-4 w-4" />
            <span>Data Sources</span>
          </TabsTrigger>
          <TabsTrigger value="mappings" className="flex items-center space-x-2">
            <Map className="h-4 w-4" />
            <span>Mappings</span>
          </TabsTrigger>
          <TabsTrigger value="filters" className="flex items-center space-x-2">
            <Filter className="h-4 w-4" />
            <span>Filters</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="endpoints" className="space-y-4">
          <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
            {apiInfo.endpoints.map((endpoint, index) => (
              <EndpointCard key={index} endpoint={endpoint} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="data" className="space-y-4">
          <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
            {apiInfo.dataInfo.map((dataInfo, index) => (
              <DataInfoCard key={index} dataInfo={dataInfo} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="mappings" className="space-y-4">
          <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
            {Object.entries(apiInfo.mappings).map(([key, values]) => (
              <Card key={key}>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Settings className="h-5 w-5" />
                    <span className="capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {Array.isArray(values) ? 
                      values.map((value) => (
                        <Badge key={value} variant="outline" className="text-xs">
                          {value}
                        </Badge>
                      )) :
                      Object.entries(values).map(([k, v]) => (
                        <Badge key={k} variant="outline" className="text-xs">
                          {k}: {String(v)}
                        </Badge>
                      ))
                    }
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="filters" className="space-y-4">
          <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
            {Object.entries(apiInfo.filters).map(([filterType, filterValues]) => (
              <Card key={filterType}>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Filter className="h-5 w-5" />
                    <span className="capitalize">{filterType.replace(/([A-Z])/g, ' $1')}</span>
                  </CardTitle>
                  <CardDescription>
                    Available filter values and their corresponding IDs
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {Object.entries(filterValues).map(([key, value]) => (
                      <div key={key} className="flex justify-between items-center text-sm">
                        <span className="capitalize">{key}</span>
                        <Badge variant="secondary">{String(value)}</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ApiInfoDashboard;