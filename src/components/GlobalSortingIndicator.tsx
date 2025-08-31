import React from 'react';
import { Badge } from '@/components/ui/badge';
import { ArrowUpDown, Globe } from 'lucide-react';

interface GlobalSortingIndicatorProps {
  isActive: boolean;
  sortBy: string;
  totalCount: number;
  currentCount: number;
}

export const GlobalSortingIndicator: React.FC<GlobalSortingIndicatorProps> = ({
  isActive,
  sortBy,
  totalCount,
  currentCount
}) => {
  if (!isActive) return null;

  const sortLabel = sortBy
    .replace('_', ' ')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-primary/10 border border-primary/20 rounded-lg">
      <Globe className="h-4 w-4 text-primary" />
      <span className="text-sm font-medium text-primary">
        Global Sorting Active
      </span>
      <Badge variant="secondary" className="text-xs">
        {sortLabel}
      </Badge>
      <span className="text-xs text-muted-foreground">
        Showing {currentCount.toLocaleString()} of {totalCount.toLocaleString()} cars
      </span>
    </div>
  );
};