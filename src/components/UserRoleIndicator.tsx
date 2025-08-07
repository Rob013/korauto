import React, { memo } from 'react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Shield, 
  UserCheck, 
  User, 
  Lock, 
  Settings,
  AlertCircle,
  Info
} from "lucide-react";
import { useAuth } from '@/contexts/AuthContext';

interface UserRoleIndicatorProps {
  className?: string;
  showFullDetails?: boolean;
}

const UserRoleIndicator = memo<UserRoleIndicatorProps>(({ 
  className = '', 
  showFullDetails = false 
}) => {
  const { user, role, permissions, isAuthenticated } = useAuth();

  const getRoleIcon = () => {
    switch (role) {
      case 'admin':
        return <Shield className="h-4 w-4 text-red-500" />;
      case 'user':
        return <UserCheck className="h-4 w-4 text-blue-500" />;
      default:
        return <User className="h-4 w-4 text-gray-500" />;
    }
  };

  const getRoleColor = () => {
    switch (role) {
      case 'admin':
        return 'destructive';
      case 'user':
        return 'default';
      default:
        return 'secondary';
    }
  };

  const getRoleLabel = () => {
    switch (role) {
      case 'admin':
        return 'Administrator';
      case 'user':
        return 'Authenticated User';
      default:
        return 'Guest';
    }
  };

  if (!showFullDetails) {
    // Compact role indicator
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        {getRoleIcon()}
        <Badge variant={getRoleColor() as any} className="text-xs">
          {getRoleLabel()}
        </Badge>
      </div>
    );
  }

  // Full role details card
  return (
    <Card className={`p-4 ${className}`}>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getRoleIcon()}
            <span className="font-medium">Access Level</span>
          </div>
          <Badge variant={getRoleColor() as any}>
            {getRoleLabel()}
          </Badge>
        </div>

        {!isAuthenticated && (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription className="text-sm">
              <Button 
                variant="link" 
                className="p-0 h-auto text-primary" 
                onClick={() => window.location.href = '/auth'}
              >
                Sign in
              </Button>{' '}
              to access advanced features and personalized filters.
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          <div className="flex items-center gap-2">
            {permissions.canAccessAdvancedFilters ? (
              <div className="h-2 w-2 bg-green-500 rounded-full" />
            ) : (
              <Lock className="h-3 w-3 text-gray-400" />
            )}
            <span className={permissions.canAccessAdvancedFilters ? '' : 'text-muted-foreground'}>
              Advanced Filters
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            {permissions.canViewAllCars ? (
              <div className="h-2 w-2 bg-green-500 rounded-full" />
            ) : (
              <Lock className="h-3 w-3 text-gray-400" />
            )}
            <span className={permissions.canViewAllCars ? '' : 'text-muted-foreground'}>
              Full Catalog Access
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            {permissions.canExportData ? (
              <div className="h-2 w-2 bg-green-500 rounded-full" />
            ) : (
              <Lock className="h-3 w-3 text-gray-400" />
            )}
            <span className={permissions.canExportData ? '' : 'text-muted-foreground'}>
              Data Export
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 bg-blue-500 rounded-full" />
            <span>{permissions.maxFilterApiCalls} API calls/hour</span>
          </div>
        </div>

        {role === 'admin' && (
          <div className="pt-2 border-t">
            <div className="flex items-center gap-2 text-sm text-amber-600">
              <Settings className="h-3 w-3" />
              <span>Administrator privileges active</span>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
});

UserRoleIndicator.displayName = 'UserRoleIndicator';

export default UserRoleIndicator;