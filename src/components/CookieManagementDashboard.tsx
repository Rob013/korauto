/**
 * Cookie Management Dashboard Component
 * 
 * Provides a UI for monitoring and managing cookies with size limits
 */

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  useCookieMonitor, 
  useSessionId, 
  usePreferences,
  useCookie 
} from '@/hooks/useCookieManagement';
import { CookieManager } from '@/utils/cookieManager';
import { AlertCircle, Cookie, Shield, Settings, Trash2, RefreshCw } from 'lucide-react';

interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  language: string;
  notifications: boolean;
  autoSave: boolean;
}

export const CookieManagementDashboard: React.FC = () => {
  const { stats, refreshStats, optimize, clearAll } = useCookieMonitor();
  const { sessionId, generateSession, clearSession } = useSessionId();
  const { preferences, updatePreferences } = usePreferences<UserPreferences>({
    theme: 'system',
    language: 'en',
    notifications: true,
    autoSave: true
  });

  const [newCookieName, setNewCookieName] = React.useState('');
  const [newCookieValue, setNewCookieValue] = React.useState('');

  const handleSetCookie = () => {
    if (newCookieName && newCookieValue) {
      const success = CookieManager.setCookie(newCookieName, newCookieValue, {
        path: '/',
        secure: window.location.protocol === 'https:',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 // 7 days
      });
      
      if (success) {
        setNewCookieName('');
        setNewCookieValue('');
        refreshStats();
      }
    }
  };

  const handleDeleteCookie = (name: string) => {
    CookieManager.deleteCookie(name);
    refreshStats();
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getUsageColor = (current: number, max: number) => {
    const percentage = (current / max) * 100;
    if (percentage > 90) return 'bg-red-500';
    if (percentage > 70) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getSizeWarningLevel = (size: number, maxSize: number) => {
    const percentage = (size / maxSize) * 100;
    if (percentage > 90) return 'destructive';
    if (percentage > 70) return 'default';
    return 'secondary';
  };

  if (!stats) return <div>Loading cookie stats...</div>;

  const totalUsagePercentage = (stats.totalSize / 4096) * 100;
  const maxCookieUsagePercentage = stats.largestCookie.size > 0 ? (stats.largestCookie.size / 1024) * 100 : 0;

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Cookie Management Dashboard</h1>
          <p className="text-muted-foreground">Monitor and manage application cookies with size limits</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={refreshStats} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={optimize} variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-2" />
            Optimize
          </Button>
        </div>
      </div>

      {/* Usage Overview */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Cookie Usage</CardTitle>
            <Cookie className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatBytes(stats.totalSize)}</div>
            <p className="text-xs text-muted-foreground">of 4KB limit</p>
            <Progress 
              value={totalUsagePercentage} 
              className={`mt-2 ${getUsageColor(stats.totalSize, 4096)}`}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cookie Count</CardTitle>
            <Badge variant="secondary">{stats.cookieCount}</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.cookieCount}</div>
            <p className="text-xs text-muted-foreground">active cookies</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Largest Cookie</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatBytes(stats.largestCookie.size)}</div>
            <p className="text-xs text-muted-foreground">{stats.largestCookie.name || 'None'}</p>
            <Progress 
              value={maxCookieUsagePercentage} 
              className={`mt-2 ${getUsageColor(stats.largestCookie.size, 1024)}`}
            />
          </CardContent>
        </Card>
      </div>

      {/* Alerts */}
      {totalUsagePercentage > 80 && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Cookie storage is approaching the 4KB limit ({Math.round(totalUsagePercentage)}% used). 
            Consider removing unnecessary cookies.
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="cookies" className="space-y-4">
        <TabsList>
          <TabsTrigger value="cookies">All Cookies</TabsTrigger>
          <TabsTrigger value="session">Session Management</TabsTrigger>
          <TabsTrigger value="preferences">User Preferences</TabsTrigger>
          <TabsTrigger value="add">Add Cookie</TabsTrigger>
        </TabsList>

        {/* Cookie List */}
        <TabsContent value="cookies">
          <Card>
            <CardHeader>
              <CardTitle>All Cookies</CardTitle>
              <CardDescription>View and manage all active cookies</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Size</TableHead>
                    <TableHead>Value Preview</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stats.cookies.map((cookie) => (
                    <TableRow key={cookie.name}>
                      <TableCell className="font-medium">{cookie.name}</TableCell>
                      <TableCell>
                        <Badge variant={getSizeWarningLevel(cookie.size, 1024)}>
                          {formatBytes(cookie.size)}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        {cookie.value.length > 50 ? `${cookie.value.substring(0, 50)}...` : cookie.value}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteCookie(cookie.name)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              
              {stats.cookies.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No cookies found
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Session Management */}
        <TabsContent value="session">
          <Card>
            <CardHeader>
              <CardTitle>Session Management</CardTitle>
              <CardDescription>Manage user session with secure cookies</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Current Session ID</Label>
                <div className="flex gap-2 mt-2">
                  <Input 
                    value={sessionId || 'No session'} 
                    readOnly 
                    className="font-mono text-sm"
                  />
                  <Button onClick={generateSession} variant="outline">
                    Generate New
                  </Button>
                  <Button onClick={clearSession} variant="destructive">
                    Clear Session
                  </Button>
                </div>
              </div>
              
              <Alert>
                <Shield className="h-4 w-4" />
                <AlertDescription>
                  Session cookies are automatically configured with Secure and SameSite attributes 
                  for enhanced security.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        {/* User Preferences */}
        <TabsContent value="preferences">
          <Card>
            <CardHeader>
              <CardTitle>User Preferences</CardTitle>
              <CardDescription>Manage application preferences stored in cookies</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="theme">Theme</Label>
                  <select
                    id="theme"
                    value={preferences?.theme || 'system'}
                    onChange={(e) => updatePreferences({ theme: e.target.value as 'light' | 'dark' | 'system' })}
                    className="w-full mt-1 p-2 border rounded-md"
                  >
                    <option value="light">Light</option>
                    <option value="dark">Dark</option>
                    <option value="system">System</option>
                  </select>
                </div>
                
                <div>
                  <Label htmlFor="language">Language</Label>
                  <select
                    id="language"
                    value={preferences?.language || 'en'}
                    onChange={(e) => updatePreferences({ language: e.target.value })}
                    className="w-full mt-1 p-2 border rounded-md"
                  >
                    <option value="en">English</option>
                    <option value="ko">Korean</option>
                    <option value="ja">Japanese</option>
                  </select>
                </div>
                
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="notifications"
                    checked={preferences?.notifications || false}
                    onChange={(e) => updatePreferences({ notifications: e.target.checked })}
                  />
                  <Label htmlFor="notifications">Enable Notifications</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="autoSave"
                    checked={preferences?.autoSave || false}
                    onChange={(e) => updatePreferences({ autoSave: e.target.checked })}
                  />
                  <Label htmlFor="autoSave">Auto Save</Label>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Add Cookie */}
        <TabsContent value="add">
          <Card>
            <CardHeader>
              <CardTitle>Add New Cookie</CardTitle>
              <CardDescription>Create a new cookie with automatic size validation</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="cookieName">Cookie Name</Label>
                <Input
                  id="cookieName"
                  value={newCookieName}
                  onChange={(e) => setNewCookieName(e.target.value)}
                  placeholder="Enter cookie name"
                />
              </div>
              
              <div>
                <Label htmlFor="cookieValue">Cookie Value</Label>
                <Input
                  id="cookieValue"
                  value={newCookieValue}
                  onChange={(e) => setNewCookieValue(e.target.value)}
                  placeholder="Enter cookie value"
                />
              </div>
              
              <Button onClick={handleSetCookie} disabled={!newCookieName || !newCookieValue}>
                Add Cookie
              </Button>
              
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Cookies are automatically validated for size limits (max 1KB per cookie, 4KB total).
                  Secure and SameSite attributes are applied automatically.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common cookie management operations</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Button onClick={clearAll} variant="destructive">
              Clear All Cookies
            </Button>
            <Button onClick={() => CookieManager.monitorUsage()} variant="outline">
              Monitor Usage
            </Button>
            <Button onClick={optimize} variant="outline">
              Optimize Storage
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};