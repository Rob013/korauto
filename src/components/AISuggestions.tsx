import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Sparkles, TrendingUp, Clock, Star } from 'lucide-react';
import EncarCarCard from '@/components/EncarCarCard';

interface AISuggestionsProps {
  userBehavior?: any[];
  onApplyFilter?: (filters: any) => void;
  cars?: any[];
}

const AISuggestions: React.FC<AISuggestionsProps> = ({ 
  userBehavior = [], 
  onApplyFilter,
  cars = []
}) => {
  const [suggestedFilters, setSuggestedFilters] = useState<any[]>([]);
  const [recommendedCars, setRecommendedCars] = useState<any[]>([]);

  // Generate AI suggestions based on user behavior
  useEffect(() => {
    const filters = [
      {
        label: "Makinat më të shitura",
        icon: TrendingUp,
        filters: { manufacturer_id: "9" }, // BMW
        description: "Bazuar në tendencat e tregut"
      },
      {
        label: "Çmim të arsyeshëm",
        icon: Star,
        filters: { buy_now_price_to: "25000" },
        description: "Për buxhetin tuaj"
      },
      {
        label: "Kilometrazh i ulët",
        icon: Clock,
        filters: { odometer_to_km: "100000" },
        description: "Makinat më të freskëta"
      },
      {
        label: "Pa aksidente",
        icon: Star,
        filters: { max_accidents: "0" },
        description: "Të sigurta dhe të besueshme"
      }
    ];

    setSuggestedFilters(filters);
    
    // Set recommended cars (first 3 cars for demo)
    setRecommendedCars(cars.slice(0, 3));
  }, [cars, userBehavior]);

  const applyFilter = (filterData: any) => {
    if (onApplyFilter) {
      onApplyFilter(filterData.filters);
    }
  };

  if (suggestedFilters.length === 0 && recommendedCars.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      {/* AI Filter Suggestions */}
      {suggestedFilters.length > 0 && (
        <Card className="p-4 bg-gradient-to-r from-primary/5 to-secondary/5 border-primary/20">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <h3 className="font-semibold text-base">Sugjerime të Mençura</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Bazuar në preferencat dhe tendencat e tregut
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {suggestedFilters.map((suggestion, index) => {
                const IconComponent = suggestion.icon;
                return (
                  <Button
                    key={index}
                    variant="outline"
                    className="h-auto p-3 justify-start hover:bg-primary/10 border-primary/20"
                    onClick={() => applyFilter(suggestion)}
                  >
                    <div className="flex items-start gap-3">
                      <IconComponent className="h-4 w-4 text-primary mt-1 flex-shrink-0" />
                      <div className="text-left">
                        <div className="font-medium text-sm">{suggestion.label}</div>
                        <div className="text-xs text-muted-foreground">
                          {suggestion.description}
                        </div>
                      </div>
                    </div>
                  </Button>
                );
              })}
            </div>
          </div>
        </Card>
      )}

      {/* Recommended Cars */}
      {recommendedCars.length > 0 && (
        <Card className="p-4">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Star className="h-5 w-5 text-secondary" />
              <h3 className="font-semibold text-base">Të Rekomanduara për Ju</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Makinat që AI mendon se mund t'ju pëlqejnë
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {recommendedCars.map((car) => (
                <div key={car.id} className="relative">
                  <Badge className="absolute top-2 left-2 z-10 bg-secondary text-secondary-foreground">
                    <Sparkles className="h-3 w-3 mr-1" />
                    AI Pick
                  </Badge>
                  <EncarCarCard {...car} />
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

export default AISuggestions;