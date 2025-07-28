import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { RefreshCw, Car, BarChart3, TrendingUp } from "lucide-react";
import { useCarStatistics } from "@/hooks/useCarStatistics";

const CarStatistics = () => {
  const { totalCars, manufacturers, loading, error, refreshStatistics } = useCarStatistics();

  const maxManufacturerCars = Math.max(...manufacturers.map(m => m.totalCars), 1);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BarChart3 className="h-8 w-8 text-primary" />
          <div>
            <h2 className="text-3xl font-bold">Car Statistics</h2>
            <p className="text-muted-foreground">
              Cars available per manufacturer and model
            </p>
          </div>
        </div>
        <Button 
          onClick={refreshStatistics} 
          disabled={loading}
          variant="outline"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Error State */}
      {error && (
        <Card className="border-destructive/20 bg-destructive/5">
          <CardContent className="pt-6">
            <p className="text-destructive font-medium">Error: {error}</p>
          </CardContent>
        </Card>
      )}

      {/* Loading State */}
      {loading && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-8 w-8 animate-spin mr-2" />
              <span>Loading statistics...</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Statistics Content */}
      {!loading && !error && (
        <>
          {/* Total Cars Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Car className="h-5 w-5" />
                Total Cars Available
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-primary mb-2">
                {totalCars.toLocaleString()}
              </div>
              <p className="text-muted-foreground">
                Across {manufacturers.length} manufacturers
              </p>
            </CardContent>
          </Card>

          {/* Manufacturer Statistics */}
          <div className="grid gap-6">
            <h3 className="text-2xl font-semibold flex items-center gap-2">
              <TrendingUp className="h-6 w-6" />
              Cars per Manufacturer
            </h3>
            
            {manufacturers.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <p className="text-center text-muted-foreground">
                    No manufacturer data available
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {manufacturers.map((manufacturer) => (
                  <Card key={manufacturer.id} className="overflow-hidden">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-xl">{manufacturer.name}</CardTitle>
                        <Badge variant="secondary" className="text-lg px-3 py-1">
                          {manufacturer.totalCars} cars
                        </Badge>
                      </div>
                      <Progress 
                        value={(manufacturer.totalCars / maxManufacturerCars) * 100} 
                        className="h-2"
                      />
                    </CardHeader>
                    
                    {manufacturer.models.length > 0 && (
                      <CardContent>
                        <h4 className="font-semibold mb-3 text-sm text-muted-foreground uppercase tracking-wide">
                          Top Models
                        </h4>
                        <div className="grid gap-2">
                          {manufacturer.models.slice(0, 8).map((model) => (
                            <div 
                              key={model.id} 
                              className="flex items-center justify-between py-2 px-3 bg-secondary/30 rounded-md"
                            >
                              <span className="font-medium">{model.name}</span>
                              <Badge variant="outline">
                                {model.count} cars
                              </Badge>
                            </div>
                          ))}
                          
                          {manufacturer.models.length > 8 && (
                            <div className="text-center py-2">
                              <Badge variant="secondary">
                                +{manufacturer.models.length - 8} more models
                              </Badge>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    )}
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">
                  {manufacturers.length}
                </div>
                <p className="text-sm text-muted-foreground">
                  Manufacturers
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">
                  {manufacturers.reduce((acc, m) => acc + m.models.length, 0)}
                </div>
                <p className="text-sm text-muted-foreground">
                  Total Models
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">
                  {manufacturers.length > 0 ? Math.round(totalCars / manufacturers.length) : 0}
                </div>
                <p className="text-sm text-muted-foreground">
                  Avg Cars per Brand
                </p>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
};

export default CarStatistics;