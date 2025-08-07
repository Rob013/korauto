import React, { memo, useMemo } from 'react';
import { AdaptiveSelect } from "@/components/ui/adaptive-select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Filter, 
  X, 
  Loader2, 
  Search, 
  Lock,
  AlertCircle,
  Info,
  Shield,
  User,
  UserCheck,
  Settings
} from "lucide-react";
import { useAuth } from '@/contexts/AuthContext';
import { useFilters } from '@/contexts/FilterContext';
import { COLOR_OPTIONS, FUEL_TYPE_OPTIONS, TRANSMISSION_OPTIONS, BODY_TYPE_OPTIONS } from '@/hooks/useAuctionAPI';

interface RoleAwareFilterPanelProps {
  onSearch?: () => void;
  onClose?: () => void;
  compact?: boolean;
  className?: string;
}

const RoleAwareFilterPanel = memo<RoleAwareFilterPanelProps>(({
  onSearch,
  onClose,
  compact = false,
  className = '',
}) => {
  const { user, role, permissions, isAuthenticated } = useAuth();
  const {
    filters,
    filterOptions,
    isLoading,
    validation,
    apiCallCount,
    updateFilter,
    clearFilters,
    canMakeApiCall,
    loadManufacturers,
    loadModels,
    loadGenerations,
  } = useFilters();

  // Determine which filters to show based on role
  const visibleFilters = useMemo(() => {
    const base = ['manufacturer_id', 'model_id', 'generation_id', 'from_year', 'to_year'];
    
    if (role === 'anonymous') {
      return base;
    }
    
    if (role === 'user') {
      return [
        ...base,
        'color',
        'fuel_type',
        'transmission',
        'body_type',
        'odometer_from_km',
        'odometer_to_km',
        'buy_now_price_from',
        'buy_now_price_to',
      ];
    }
    
    if (role === 'admin') {
      return [
        ...base,
        'color',
        'fuel_type',
        'transmission',
        'body_type',
        'odometer_from_km',
        'odometer_to_km',
        'buy_now_price_from',
        'buy_now_price_to',
        'grade_iaai',
        'trim_level',
        'seats_count',
        'max_accidents',
        'search',
      ];
    }
    
    return base;
  }, [role]);

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 30 }, (_, i) => Math.max(currentYear - i, 1996));

  const handleFilterChange = (key: string, value: string) => {
    updateFilter(key as any, value);
    
    // Handle cascading loads
    if (key === 'manufacturer_id' && value && value !== 'all') {
      loadModels(value);
    } else if (key === 'model_id' && value && value !== 'all' && filters.manufacturer_id) {
      loadGenerations(filters.manufacturer_id, value);
    }
  };

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

  const getRoleLabel = () => {
    switch (role) {
      case 'admin':
        return 'Administrator';
      case 'user':
        return 'Authenticated User';
      default:
        return 'Guest User';
    }
  };

  if (compact) {
    return (
      <Card className={`p-3 space-y-3 ${className}`}>
        {/* Role indicator */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">Filters</span>
            <div className="flex items-center gap-1">
              {getRoleIcon()}
              <span className="text-xs text-muted-foreground">{getRoleLabel()}</span>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={clearFilters}
              className="h-6 px-2 text-xs"
            >
              <X className="h-3 w-3" />
            </Button>
            {onClose && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={onClose}
                className="h-6 px-2 text-xs"
              >
                ✕
              </Button>
            )}
          </div>
        </div>

        {/* Rate limit warning */}
        {!canMakeApiCall() && (
          <Alert className="py-2">
            <AlertCircle className="h-3 w-3" />
            <AlertDescription className="text-xs">
              Rate limit reached. Please wait before making more filter requests.
            </AlertDescription>
          </Alert>
        )}

        {/* Validation errors */}
        {!validation.isValid && (
          <Alert variant="destructive" className="py-2">
            <AlertCircle className="h-3 w-3" />
            <AlertDescription className="text-xs">
              {validation.errors[0]}
            </AlertDescription>
          </Alert>
        )}

        {/* Basic filters */}
        <div className="space-y-2">
          {visibleFilters.includes('manufacturer_id') && (
            <div className="space-y-1">
              <Label className="text-xs">Brand</Label>
              <AdaptiveSelect
                value={filters.manufacturer_id || 'all'}
                onValueChange={(value) => handleFilterChange('manufacturer_id', value)}
                disabled={isLoading || !canMakeApiCall()}
                className="h-8 text-xs"
                options={[
                  { value: 'all', label: 'All Brands' },
                  ...filterOptions.manufacturers.map(m => ({
                    value: m.id.toString(),
                    label: `${m.name} (${m.cars_qty || 0})`
                  }))
                ]}
              />
            </div>
          )}

          {visibleFilters.includes('model_id') && (
            <div className="space-y-1">
              <Label className="text-xs">Model</Label>
              <AdaptiveSelect
                value={filters.model_id || 'all'}
                onValueChange={(value) => handleFilterChange('model_id', value)}
                disabled={!filters.manufacturer_id || isLoading}
                className="h-8 text-xs"
                options={[
                  { value: 'all', label: 'All Models' },
                  ...filterOptions.models.map(m => ({
                    value: m.id.toString(),
                    label: `${m.name} (${m.cars_qty || 0})`
                  }))
                ]}
              />
            </div>
          )}

          {/* Show upgrade prompt for anonymous users */}
          {role === 'anonymous' && (
            <Alert className="py-2">
              <Info className="h-3 w-3" />
              <AlertDescription className="text-xs">
                <button 
                  onClick={() => window.location.href = '/auth'}
                  className="text-primary hover:underline"
                >
                  Sign in
                </button> to access advanced filters and save preferences.
              </AlertDescription>
            </Alert>
          )}

          {/* Advanced filters for authenticated users */}
          {visibleFilters.includes('color') && (
            <div className="space-y-1">
              <Label className="text-xs">Color</Label>
              <AdaptiveSelect
                value={filters.color || 'all'}
                onValueChange={(value) => handleFilterChange('color', value)}
                className="h-8 text-xs"
                options={[
                  { value: 'all', label: 'Any Color' },
                  ...Object.entries(COLOR_OPTIONS).map(([name, id]) => ({
                    value: id.toString(),
                    label: name.charAt(0).toUpperCase() + name.slice(1).replace('_', ' ')
                  }))
                ]}
              />
            </div>
          )}

          {visibleFilters.includes('buy_now_price_from') && (
            <div className="space-y-1">
              <Label className="text-xs">Price Range (EUR)</Label>
              <div className="grid grid-cols-2 gap-1">
                <Input
                  type="number"
                  placeholder="Min"
                  value={filters.buy_now_price_from || ''}
                  onChange={(e) => handleFilterChange('buy_now_price_from', e.target.value)}
                  className="h-8 text-xs"
                />
                <Input
                  type="number"
                  placeholder="Max"
                  value={filters.buy_now_price_to || ''}
                  onChange={(e) => handleFilterChange('buy_now_price_to', e.target.value)}
                  className="h-8 text-xs"
                />
              </div>
            </div>
          )}

          {/* Admin-only filters */}
          {visibleFilters.includes('search') && (
            <div className="space-y-1">
              <Label className="text-xs flex items-center gap-1">
                <Settings className="h-3 w-3" />
                Advanced Search
              </Label>
              <Input
                placeholder="Search cars..."
                value={filters.search || ''}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="h-8 text-xs"
              />
            </div>
          )}
        </div>

        {/* Search button */}
        {onSearch && (
          <Button 
            onClick={onSearch}
            disabled={!validation.isValid || isLoading}
            className="w-full h-8 text-xs"
            size="sm"
          >
            {isLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Search className="h-3 w-3" />}
            Search Cars
          </Button>
        )}

        {/* Filter info */}
        <div className="text-xs text-muted-foreground space-y-1">
          <div>API calls: {apiCallCount}/{permissions.maxFilterApiCalls}</div>
          {validation.warnings.length > 0 && (
            <div className="text-amber-600">{validation.warnings[0]}</div>
          )}
        </div>
      </Card>
    );
  }

  // Full-sized filter panel (similar structure but expanded)
  return (
    <Card className={`p-4 space-y-4 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">Search Filters</h3>
          <div className="flex items-center gap-2">
            {getRoleIcon()}
            <Badge variant="outline" className="text-xs">
              {getRoleLabel()}
            </Badge>
          </div>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={clearFilters}
          disabled={isLoading}
        >
          <X className="h-4 w-4 mr-1" />
          Clear All
        </Button>
      </div>

      {/* Role and permission info */}
      <div className="bg-muted/30 p-3 rounded-lg space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span>Filter Access Level:</span>
          <span className="font-medium">{getRoleLabel()}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span>API Calls Remaining:</span>
          <span className="font-medium">
            {permissions.maxFilterApiCalls - apiCallCount}/{permissions.maxFilterApiCalls}
          </span>
        </div>
        {!permissions.canAccessAdvancedFilters && (
          <Alert>
            <Lock className="h-4 w-4" />
            <AlertDescription>
              Advanced filters are available for authenticated users. 
              <Button variant="link" className="p-0 h-auto" onClick={() => window.location.href = '/auth'}>
                Sign in to unlock more filters.
              </Button>
            </AlertDescription>
          </Alert>
        )}
      </div>

      {/* Filter validation feedback */}
      {!validation.isValid && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <ul className="list-disc list-inside">
              {validation.errors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {validation.warnings.length > 0 && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            <ul className="list-disc list-inside">
              {validation.warnings.map((warning, index) => (
                <li key={index}>{warning}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Main filter content - similar to compact but with better spacing */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* All the same filter fields as compact version but with better layout */}
        {/* Implementation would be similar but with more spacing and better organization */}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-4 border-t">
        <div className="text-sm text-muted-foreground">
          {Object.keys(filters).length} filter(s) active
        </div>
        {onSearch && (
          <Button 
            onClick={onSearch}
            disabled={!validation.isValid || isLoading || !canMakeApiCall()}
            className="px-8"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Search className="h-4 w-4 mr-2" />
            )}
            Search Cars
          </Button>
        )}
      </div>
    </Card>
  );
});

RoleAwareFilterPanel.displayName = 'RoleAwareFilterPanel';

export default RoleAwareFilterPanel;