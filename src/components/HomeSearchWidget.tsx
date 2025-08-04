import React, { useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { 
  Search, 
  Car,
  Calendar,
  DollarSign,
  ArrowRight,
  Sparkles
} from "lucide-react";
import { useSecureAuctionAPI } from "@/hooks/useSecureAuctionAPI";

interface Manufacturer {
  id: number;
  name: string;
  car_count?: number;
  cars_qty?: number;
  image?: string;
}

interface Model {
  id: number;
  name: string;
  car_count?: number;
  cars_qty?: number;
}

const HomeSearchWidget = () => {
  const navigate = useNavigate();
  const {
    fetchManufacturers,
    fetchModels,
  } = useSecureAuctionAPI();

  const [searchFilters, setSearchFilters] = useState({
    manufacturer_id: '',
    model_id: '',
    from_year: '',
    to_year: '',
    buy_now_price_from: '',
    buy_now_price_to: '',
    search: ''
  });

  const [manufacturers, setManufacturers] = useState<Manufacturer[]>([]);
  const [models, setModels] = useState<Model[]>([]);
  const [isLoadingManufacturers, setIsLoadingManufacturers] = useState(false);
  const [isLoadingModels, setIsLoadingModels] = useState(false);

  // Load manufacturers on component mount
  React.useEffect(() => {
    const loadManufacturers = async () => {
      setIsLoadingManufacturers(true);
      try {
        const data = await fetchManufacturers();
        if (Array.isArray(data)) {
          setManufacturers(data.filter(m => m.cars_qty && m.cars_qty > 0));
        }
      } catch (error) {
        console.error('Error loading manufacturers:', error);
      } finally {
        setIsLoadingManufacturers(false);
      }
    };
    loadManufacturers();
  }, [fetchManufacturers]);

  // Load models when manufacturer changes
  React.useEffect(() => {
    if (searchFilters.manufacturer_id) {
      const loadModels = async () => {
        setIsLoadingModels(true);
        try {
          const data = await fetchModels(searchFilters.manufacturer_id);
          if (Array.isArray(data)) {
            setModels(data.filter(m => m.cars_qty && m.cars_qty > 0));
          }
        } catch (error) {
          console.error('Error loading models:', error);
        } finally {
          setIsLoadingModels(false);
        }
      };
      loadModels();
    } else {
      setModels([]);
    }
  }, [searchFilters.manufacturer_id, fetchModels]);

  const currentYear = useMemo(() => new Date().getFullYear(), []);
  const years = useMemo(() => Array.from({ length: 25 }, (_, i) => currentYear - i), [currentYear]);

  // Prioritized manufacturer sorting (German, Korean, Popular)
  const sortedManufacturers = useMemo(() => {
    return manufacturers
      .sort((a, b) => {
        const germanBrands = ['BMW', 'Mercedes-Benz', 'Audi', 'Volkswagen', 'Porsche', 'Opel'];
        const koreanBrands = ['Hyundai', 'Kia', 'Genesis'];
        const popularBrands = ['Toyota', 'Honda', 'Nissan', 'Ford', 'Chevrolet', 'Mazda', 'Subaru', 'Lexus'];
        
        const aIsGerman = germanBrands.includes(a.name);
        const bIsGerman = germanBrands.includes(b.name);
        const aIsKorean = koreanBrands.includes(a.name);
        const bIsKorean = koreanBrands.includes(b.name);
        const aIsPopular = popularBrands.includes(a.name);
        const bIsPopular = popularBrands.includes(b.name);
        
        if (aIsGerman && !bIsGerman) return -1;
        if (!aIsGerman && bIsGerman) return 1;
        if (aIsKorean && !bIsKorean && !bIsGerman) return -1;
        if (!aIsKorean && bIsKorean && !aIsGerman) return 1;
        if (aIsPopular && !bIsPopular && !bIsGerman && !bIsKorean) return -1;
        if (!aIsPopular && bIsPopular && !aIsGerman && !aIsKorean) return 1;
        
        return a.name.localeCompare(b.name);
      });
  }, [manufacturers]);

  const updateFilter = useCallback((key: string, value: string) => {
    setSearchFilters(prev => {
      const newFilters = { ...prev, [key]: value === 'all' ? '' : value };
      
      // Reset dependent filters
      if (key === 'manufacturer_id') {
        newFilters.model_id = '';
      }
      
      return newFilters;
    });
  }, []);

  const handleSearch = useCallback(() => {
    // Build query parameters for navigation to catalog
    const queryParams = new URLSearchParams();
    
    Object.entries(searchFilters).forEach(([key, value]) => {
      if (value && value !== 'all') {
        queryParams.set(key, value);
      }
    });

    navigate(`/catalog?${queryParams.toString()}`);
  }, [searchFilters, navigate]);

  const hasActiveFilters = useMemo(() => {
    return Object.values(searchFilters).some(value => value && value !== 'all');
  }, [searchFilters]);

  return (
    <div className="w-full max-w-6xl mx-auto">
      <Card className="p-6 bg-gradient-to-br from-card via-card/95 to-background border-border/50 shadow-lg backdrop-blur-sm">
        <div className="space-y-6">
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Sparkles className="h-6 w-6 text-primary" />
              <h2 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                Gjej Makinën e Perfekt
              </h2>
              <Sparkles className="h-6 w-6 text-primary" />
            </div>
            <p className="text-muted-foreground">
              Përdor filtrat për të gjetur makinën që të përshtatet më së miri
            </p>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Kërko sipas markës, modelit ose fjalëve kyçe..."
              value={searchFilters.search}
              onChange={(e) => updateFilter('search', e.target.value)}
              className="pl-10 h-12 text-base border-border/50 focus:border-primary"
            />
          </div>

          {/* Main Filters - Desktop Layout */}
          <div className="hidden md:grid md:grid-cols-4 gap-4">
            {/* Brand */}
            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center gap-2">
                <Car className="h-4 w-4 text-primary" />
                Marka
              </Label>
              <Select 
                value={searchFilters.manufacturer_id || 'all'} 
                onValueChange={(value) => updateFilter('manufacturer_id', value)}
                disabled={isLoadingManufacturers}
              >
                <SelectTrigger className="h-11">
                  <SelectValue placeholder={isLoadingManufacturers ? "Loading..." : "Zgjidhni markën"} />
                </SelectTrigger>
                <SelectContent className="max-h-60 overflow-y-auto">
                  <SelectItem value="all">Të gjitha Markat</SelectItem>
                  {sortedManufacturers.map((manufacturer) => (
                    <SelectItem key={manufacturer.id} value={manufacturer.id.toString()}>
                      <div className="flex items-center gap-2">
                        {manufacturer.image && (
                          <img src={manufacturer.image} alt={manufacturer.name} className="w-5 h-5 object-contain" />
                        )}
                        <span>{manufacturer.name}</span>
                        {manufacturer.cars_qty && <span className="text-muted-foreground">({manufacturer.cars_qty})</span>}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Model */}
            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center gap-2">
                <Car className="h-4 w-4 text-primary" />
                Modeli
              </Label>
              <Select 
                value={searchFilters.model_id || 'all'} 
                onValueChange={(value) => updateFilter('model_id', value)}
                disabled={!searchFilters.manufacturer_id || isLoadingModels}
              >
                <SelectTrigger className="h-11">
                  <SelectValue placeholder={
                    !searchFilters.manufacturer_id 
                      ? "Zgjidhni markën së pari" 
                      : isLoadingModels 
                        ? "Loading..." 
                        : "Zgjidhni modelin"
                  } />
                </SelectTrigger>
                <SelectContent className="max-h-60 overflow-y-auto">
                  <SelectItem value="all">Të gjithë Modelet</SelectItem>
                  {models.map((model) => (
                    <SelectItem key={model.id} value={model.id.toString()}>
                      {model.name} {model.cars_qty && `(${model.cars_qty})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Year Range */}
            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center gap-2">
                <Calendar className="h-4 w-4 text-primary" />
                Viti
              </Label>
              <div className="grid grid-cols-2 gap-1">
                <Select value={searchFilters.from_year || 'all'} onValueChange={(value) => updateFilter('from_year', value)}>
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder="Nga" />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    <SelectItem value="all">Çdo</SelectItem>
                    {years.map(year => (
                      <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={searchFilters.to_year || 'all'} onValueChange={(value) => updateFilter('to_year', value)}>
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder="Deri" />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    <SelectItem value="all">Çdo</SelectItem>
                    {years.map(year => (
                      <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Price Range */}
            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-primary" />
                Çmimi (EUR)
              </Label>
              <div className="grid grid-cols-2 gap-1">
                <Input
                  type="number"
                  placeholder="Nga"
                  value={searchFilters.buy_now_price_from}
                  onChange={(e) => updateFilter('buy_now_price_from', e.target.value)}
                  className="h-11"
                />
                <Input
                  type="number"
                  placeholder="Deri"
                  value={searchFilters.buy_now_price_to}
                  onChange={(e) => updateFilter('buy_now_price_to', e.target.value)}
                  className="h-11"
                />
              </div>
            </div>
          </div>

          {/* Mobile Layout */}
          <div className="md:hidden space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Marka</Label>
                <Select 
                  value={searchFilters.manufacturer_id || 'all'} 
                  onValueChange={(value) => updateFilter('manufacturer_id', value)}
                  disabled={isLoadingManufacturers}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={isLoadingManufacturers ? "Loading..." : "Marka"} />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    <SelectItem value="all">Të gjitha</SelectItem>
                    {sortedManufacturers.map((manufacturer) => (
                      <SelectItem key={manufacturer.id} value={manufacturer.id.toString()}>
                        {manufacturer.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Modeli</Label>
                <Select 
                  value={searchFilters.model_id || 'all'} 
                  onValueChange={(value) => updateFilter('model_id', value)}
                  disabled={!searchFilters.manufacturer_id || isLoadingModels}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={!searchFilters.manufacturer_id ? "Marka së pari" : "Modeli"} />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    <SelectItem value="all">Të gjithë</SelectItem>
                    {models.map((model) => (
                      <SelectItem key={model.id} value={model.id.toString()}>
                        {model.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Viti Nga-Deri</Label>
                <div className="grid grid-cols-2 gap-1">
                  <Select value={searchFilters.from_year || 'all'} onValueChange={(value) => updateFilter('from_year', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Nga" />
                    </SelectTrigger>
                    <SelectContent className="max-h-60">
                      <SelectItem value="all">Çdo</SelectItem>
                      {years.slice(0, 15).map(year => (
                        <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={searchFilters.to_year || 'all'} onValueChange={(value) => updateFilter('to_year', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Deri" />
                    </SelectTrigger>
                    <SelectContent className="max-h-60">
                      <SelectItem value="all">Çdo</SelectItem>
                      {years.slice(0, 15).map(year => (
                        <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Çmimi (EUR)</Label>
                <div className="grid grid-cols-2 gap-1">
                  <Input
                    type="number"
                    placeholder="Nga"
                    value={searchFilters.buy_now_price_from}
                    onChange={(e) => updateFilter('buy_now_price_from', e.target.value)}
                  />
                  <Input
                    type="number"
                    placeholder="Deri"
                    value={searchFilters.buy_now_price_to}
                    onChange={(e) => updateFilter('buy_now_price_to', e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Search Button */}
          <div className="flex justify-center pt-2">
            <Button 
              onClick={handleSearch} 
              size="lg" 
              className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-3 text-base font-medium transition-all duration-200 hover:scale-105 shadow-md"
            >
              <Search className="h-5 w-5 mr-2" />
              Kërko Makina
              <ArrowRight className="h-5 w-5 ml-2" />
            </Button>
          </div>

          {/* Active Filters Indicator */}
          {hasActiveFilters && (
            <div className="text-center">
              <div className="inline-flex items-center gap-2 text-sm text-primary bg-primary/10 px-3 py-1 rounded-full">
                <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                Filtrat janë aktiv
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default HomeSearchWidget;