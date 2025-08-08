import React from 'react';
import { ModernCatalogFilters } from '@/components/filters/ModernCatalogFilters';
import { CarsGrid } from '@/components/results/CarsGrid';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Clock, AlertCircle, Filter } from 'lucide-react';

// Mock data for demo
const mockCars = [
  {
    id: '1',
    make: 'BMW',
    model: '3 Series',
    trim: '320i M Sport',
    year: 2022,
    price_eur: 45000,
    mileage_km: 25000,
    engine_cc: 2000,
    fuel: 'Petrol',
    transmission: 'Automatic',
    body: 'Sedan',
    exterior_color: 'Alpine White',
    region: 'Bavaria',
    seats: 5,
    owners: 1,
    accident: 'none' as const,
    listed_at: '2024-01-15T10:30:00Z',
    thumbnail: 'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=400&h=300&fit=crop',
    lot_number: 'BMW001'
  },
  {
    id: '2',
    make: 'Mercedes-Benz',
    model: 'C-Class',
    trim: 'C200 AMG Line',
    year: 2021,
    price_eur: 42000,
    mileage_km: 35000,
    engine_cc: 1500,
    fuel: 'Petrol',
    transmission: 'Automatic',
    body: 'Sedan',
    exterior_color: 'Obsidian Black',
    region: 'Stuttgart',
    seats: 5,
    owners: 1,
    accident: 'none' as const,
    listed_at: '2024-01-14T14:20:00Z',
    thumbnail: 'https://images.unsplash.com/photo-1563720360172-67b8f3dce741?w=400&h=300&fit=crop',
    lot_number: 'MB002'
  },
  {
    id: '3',
    make: 'Audi',
    model: 'A4',
    trim: '2.0 TFSI Quattro',
    year: 2023,
    price_eur: 52000,
    mileage_km: 15000,
    engine_cc: 2000,
    fuel: 'Petrol',
    transmission: 'Automatic',
    body: 'Sedan',
    exterior_color: 'Ibis White',
    region: 'Ingolstadt',
    seats: 5,
    owners: 1,
    accident: 'none' as const,
    listed_at: '2024-01-16T09:15:00Z',
    thumbnail: 'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=400&h=300&fit=crop',
    lot_number: 'AUD003'
  }
];

const CatalogFilterDemo = () => {
  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Catalog Filter System Demo</h1>
          <p className="text-muted-foreground">
            Demonstration of the new advanced catalog filter system with faceted search,
            URL state management, and modern UI components.
          </p>
        </div>

        {/* Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <div>
                <p className="font-medium">Filter System</p>
                <p className="text-sm text-muted-foreground">Implemented</p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <div>
                <p className="font-medium">URL State</p>
                <p className="text-sm text-muted-foreground">Synced</p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <div>
                <p className="font-medium">Virtualization</p>
                <p className="text-sm text-muted-foreground">Ready</p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <Clock className="h-5 w-5 text-yellow-500" />
              <div>
                <p className="font-medium">Backend</p>
                <p className="text-sm text-muted-foreground">Demo Mode</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Features Overview */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Implemented Features
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-2">
                <h4 className="font-medium">Filter Features</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>✅ Faceted search with counts</li>
                  <li>✅ AND between facets, OR within facets</li>
                  <li>✅ Dependent facets (Make → Model → Trim)</li>
                  <li>✅ Range filters (Year, Price, Mileage)</li>
                  <li>✅ Active filter chips</li>
                </ul>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-medium">Performance</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>✅ 300ms debounced updates</li>
                  <li>✅ Request cancellation</li>
                  <li>✅ 60s response caching</li>
                  <li>✅ Virtualized results grid</li>
                  <li>✅ Lazy image loading</li>
                </ul>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-medium">State Management</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>✅ URL synchronization</li>
                  <li>✅ Browser back/forward</li>
                  <li>✅ Page restoration</li>
                  <li>✅ Sort persistence</li>
                  <li>✅ Filter validation</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Demo Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Filters */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Filter Panel (Demo)</CardTitle>
              </CardHeader>
              <CardContent>
                <ModernCatalogFilters compact />
              </CardContent>
            </Card>
          </div>

          {/* Results */}
          <div className="lg:col-span-3">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="text-sm">Results Grid (Demo)</span>
                  <Badge variant="secondary">{mockCars.length} cars</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CarsGrid
                  cars={mockCars}
                  onCarClick={(car) => console.log('Clicked car:', car)}
                  itemsPerRow={{
                    mobile: 1,
                    tablet: 2,
                    desktop: 2
                  }}
                />
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Implementation Notes */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Implementation Notes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg">
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-blue-500" />
                Architecture Adaptation
              </h4>
              <p className="text-sm text-muted-foreground">
                Since this is a React+Vite project (not Next.js), the API route requirements were adapted to use
                a search service that integrates with the existing Supabase backend. All filtering, faceting,
                and performance requirements are maintained.
              </p>
            </div>
            
            <div className="bg-green-50 dark:bg-green-950/20 p-4 rounded-lg">
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                Ready for Integration
              </h4>
              <p className="text-sm text-muted-foreground">
                The system is ready to replace the existing EncarCatalog component. The search service
                can be connected to your live car API by updating the searchService.ts file.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CatalogFilterDemo;