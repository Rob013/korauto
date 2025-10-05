import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Grid3X3, List, Filter, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { useSupabaseCars } from '@/hooks/useSupabaseCars';
import LazyCarCard from '@/components/LazyCarCard';
import { useToast } from '@/hooks/use-toast';

export default function CatalogSupabase() {
  const { toast } = useToast();
  const {
    cars,
    loading,
    error,
    totalCount,
    totalPages,
    currentPage,
    fetchCars,
    setFilters,
    filters,
    manufacturers,
    models,
    fuelTypes,
    transmissions,
    colors,
  } = useSupabaseCars();

  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const handleFilterChange = (key: string, value: string) => {
    const newFilters = { ...filters, [key]: value || undefined };
    setFilters(newFilters);
    fetchCars(1, newFilters);
  };

  const handleSearch = () => {
    const newFilters = { ...filters, search: searchTerm || undefined };
    setFilters(newFilters);
    fetchCars(1, newFilters);
  };

  const handleClearFilters = () => {
    setFilters({});
    setSearchTerm('');
    fetchCars(1, {});
  };

  const handlePageChange = (page: number) => {
    fetchCars(page, filters);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    if (error) {
      toast({
        title: 'Error',
        description: error,
        variant: 'destructive',
      });
    }
  }, [error, toast]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Makina nga Koreja e Jugut</h1>
              <p className="text-sm text-muted-foreground mt-1">
                {loading ? 'Loading...' : `${totalCount.toLocaleString()} makina në dispozicion`}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="icon"
                onClick={() => setViewMode('grid')}
              >
                <Grid3X3 className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="icon"
                onClick={() => setViewMode('list')}
              >
                <List className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="h-4 w-4 mr-2" />
                {showFilters ? 'Fshih Filtrat' : 'Shfaq Filtrat'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="flex gap-6">
          {/* Filters Sidebar */}
          {showFilters && (
            <div className="w-80 shrink-0">
              <div className="sticky top-6 space-y-4 bg-card p-4 rounded-lg border">
                <div className="flex items-center justify-between">
                  <h2 className="font-semibold">Filtrat</h2>
                  <Button variant="ghost" size="sm" onClick={handleClearFilters}>
                    <X className="h-4 w-4 mr-1" />
                    Pastro
                  </Button>
                </div>

                {/* Search */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Kërko</label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Kërko..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    />
                    <Button onClick={handleSearch} size="sm">
                      Kërko
                    </Button>
                  </div>
                </div>

                {/* Make Filter */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Marka</label>
                  <Select value={filters.make || ''} onValueChange={(value) => handleFilterChange('make', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Të gjitha markat" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Të gjitha markat</SelectItem>
                      {manufacturers.map((make) => (
                        <SelectItem key={make.id} value={make.name}>
                          {make.name} ({make.count})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Model Filter */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Modeli</label>
                  <Select value={filters.model || ''} onValueChange={(value) => handleFilterChange('model', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Të gjitha modelet" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Të gjitha modelet</SelectItem>
                      {models.map((model) => (
                        <SelectItem key={model.id} value={model.name}>
                          {model.name} ({model.count})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Fuel Filter */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Karburanti</label>
                  <Select value={filters.fuel || ''} onValueChange={(value) => handleFilterChange('fuel', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Të gjitha llojet" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Të gjitha llojet</SelectItem>
                      {fuelTypes.map((fuel) => (
                        <SelectItem key={fuel} value={fuel}>
                          {fuel}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Transmission Filter */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Transmisioni</label>
                  <Select value={filters.transmission || ''} onValueChange={(value) => handleFilterChange('transmission', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Të gjitha llojet" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Të gjitha llojet</SelectItem>
                      {transmissions.map((trans) => (
                        <SelectItem key={trans} value={trans}>
                          {trans}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Year Range */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Viti</label>
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      type="number"
                      placeholder="Nga"
                      value={filters.yearMin || ''}
                      onChange={(e) => handleFilterChange('yearMin', e.target.value)}
                    />
                    <Input
                      type="number"
                      placeholder="Deri"
                      value={filters.yearMax || ''}
                      onChange={(e) => handleFilterChange('yearMax', e.target.value)}
                    />
                  </div>
                </div>

                {/* Price Range */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Çmimi (€)</label>
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      type="number"
                      placeholder="Nga"
                      value={filters.priceMin || ''}
                      onChange={(e) => handleFilterChange('priceMin', e.target.value)}
                    />
                    <Input
                      type="number"
                      placeholder="Deri"
                      value={filters.priceMax || ''}
                      onChange={(e) => handleFilterChange('priceMax', e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Cars Grid/List */}
          <div className="flex-1">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : cars.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-lg text-muted-foreground">Nuk u gjetën makina me këto filtra.</p>
                <Button className="mt-4" onClick={handleClearFilters}>
                  Pastro Filtrat
                </Button>
              </div>
            ) : (
              <>
                <div
                  className={
                    viewMode === 'grid'
                      ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'
                      : 'space-y-4'
                  }
                >
                  {cars.map((car) => (
                    <LazyCarCard
                      key={car.id}
                      id={car.id}
                      make={car.make}
                      model={car.model}
                      year={car.year}
                      price={car.price}
                      mileage={car.mileage}
                      vin={car.vin}
                      fuel={car.fuel}
                      transmission={car.transmission}
                      condition={car.condition}
                      lot={car.lot_number}
                      color={car.color}
                      title={`${car.make} ${car.model} ${car.year}`}
                      images={typeof car.images === 'string' ? JSON.parse(car.images || '[]') : car.images}
                      viewMode={viewMode}
                    />
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-8">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>

                    {[...Array(Math.min(5, totalPages))].map((_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }

                      return (
                        <Button
                          key={pageNum}
                          variant={currentPage === pageNum ? 'default' : 'outline'}
                          onClick={() => handlePageChange(pageNum)}
                        >
                          {pageNum}
                        </Button>
                      );
                    })}

                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>

                    <span className="text-sm text-muted-foreground ml-4">
                      Faqja {currentPage} nga {totalPages}
                    </span>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
