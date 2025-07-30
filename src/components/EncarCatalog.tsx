import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useOptimizedCatalog } from '@/hooks/useOptimizedCatalog';
import CatalogHeader from '@/components/catalog/CatalogHeader';
import CatalogFilters from '@/components/catalog/CatalogFilters';
import CatalogGrid from '@/components/catalog/CatalogGrid';
import CatalogLoadMore from '@/components/catalog/CatalogLoadMore';

interface EncarCatalogProps {
  highlightCarId?: string | null;
}

const EncarCatalog = ({ highlightCarId }: EncarCatalogProps = {}) => {
  const {
    cars,
    loading,
    error,
    totalCount,
    hasMorePages,
    viewMode,
    setViewMode,
    sortBy,
    setSortBy,
    filters,
    showAdvancedFilters,
    setShowAdvancedFilters,
    manufacturers,
    models,
    generations,
    filterCounts,
    loadingCounts,
    handleFiltersChange,
    handleClearFilters,
    handleManufacturerChange,
    handleModelChange,
    handleLoadMore
  } = useOptimizedCatalog(highlightCarId);

  return (
    <div className="container-responsive py-6 sm:py-8">
      <CatalogHeader 
        totalCount={totalCount}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
      />

      <CatalogFilters
        filters={filters}
        manufacturers={manufacturers}
        models={models}
        generations={generations}
        filterCounts={filterCounts}
        loadingCounts={loadingCounts}
        showAdvancedFilters={showAdvancedFilters}
        sortBy={sortBy}
        onFiltersChange={handleFiltersChange}
        onClearFilters={handleClearFilters}
        onManufacturerChange={handleManufacturerChange}
        onModelChange={handleModelChange}
        onToggleAdvanced={() => setShowAdvancedFilters(!showAdvancedFilters)}
        onSortChange={setSortBy}
      />

      {/* Error State */}
      {error && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 mb-8">
          <p className="text-destructive font-medium">Error: {error}</p>
        </div>
      )}

      {/* Loading State */}
      {loading && cars.length === 0 && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin mr-2" />
          <span>Loading cars...</span>
        </div>
      )}

      {/* No Results State */}
      {!loading && cars.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No cars found matching your filters.</p>
          <Button
            variant="outline"
            onClick={handleClearFilters}
            className="mt-4"
          >
            Clear Filters
          </Button>
        </div>
      )}

      {/* Cars Grid/List */}
      {cars.length > 0 && (
        <>
          <CatalogGrid 
            cars={cars}
            viewMode={viewMode}
            highlightCarId={highlightCarId}
          />
          
          <CatalogLoadMore 
            hasMorePages={hasMorePages}
            loading={loading}
            onLoadMore={handleLoadMore}
          />
        </>
      )}
    </div>
  );
};

export default EncarCatalog;