import { Button } from '@/components/ui/button';
import { ArrowLeft, Grid, List } from 'lucide-react';

interface CatalogHeaderProps {
  totalCount: number;
  viewMode: 'grid' | 'list';
  onViewModeChange: (mode: 'grid' | 'list') => void;
}

const CatalogHeader = ({ totalCount, viewMode, onViewModeChange }: CatalogHeaderProps) => {
  return (
    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-8">
      <div className="flex items-center gap-4">
        <Button 
          variant="outline" 
          onClick={() => window.location.href = '/'} 
          className="flex items-center gap-2 hover:bg-primary hover:text-primary-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="hidden sm:inline">Back</span>
        </Button>
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Car Catalog
          </h1>
          <p className="text-muted-foreground mt-2">
            {totalCount.toLocaleString()} cars available
          </p>
        </div>
      </div>
      
      {/* View Mode Toggle */}
      <div className="flex gap-2">
        <Button
          variant={viewMode === 'grid' ? 'default' : 'outline'}
          size="sm"
          onClick={() => onViewModeChange('grid')}
        >
          <Grid className="h-4 w-4" />
        </Button>
        <Button
          variant={viewMode === 'list' ? 'default' : 'outline'}
          size="sm"
          onClick={() => onViewModeChange('list')}
        >
          <List className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default CatalogHeader;