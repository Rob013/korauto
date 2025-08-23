import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Phone, Car, Gauge, Settings, Fuel, Palette, Calendar } from "lucide-react";

// Simple demo car details component for when APIs are unavailable
const createDemoCarForId = (carId: string) => {
  const demoMakeModels = [
    { make: 'Toyota', model: 'Camry' },
    { make: 'Honda', model: 'Civic' },
    { make: 'BMW', model: '3 Series' },
    { make: 'Mercedes-Benz', model: 'C-Class' },
    { make: 'Audi', model: 'A4' },
    { make: 'Hyundai', model: 'Elantra' },
    { make: 'Kia', model: 'Forte' },
    { make: 'Volkswagen', model: 'Golf' }
  ];
  
  const idHash = parseInt(carId) || carId.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
  const selectedCar = demoMakeModels[idHash % demoMakeModels.length];
  const year = 2018 + (idHash % 7);
  const basePrice = 25000 + (idHash % 45000);
  
  return {
    id: carId,
    make: selectedCar.make,
    model: selectedCar.model,
    year,
    price: basePrice,
    image: `https://picsum.photos/800/600?random=${idHash}`,
    mileage: `${(25000 + (idHash % 75000)).toLocaleString()} km`,
    transmission: idHash % 3 === 0 ? 'Automatic' : 'Manual',
    fuel: ['Petrol', 'Diesel', 'Hybrid'][idHash % 3],
    color: ['Black', 'White', 'Silver', 'Blue', 'Red'][idHash % 5],
    condition: 'Good Condition',
    lot: carId,
    title: `${year} ${selectedCar.make} ${selectedCar.model}`,
  };
};

const DemoCarDetails = () => {
  const { id: lot } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  if (!lot) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container-responsive py-8">
          <Button variant="outline" onClick={() => navigate("/")} className="mb-6">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Kryefaqja
          </Button>
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold text-foreground mb-2">Invalid Car ID</h1>
            <p className="text-muted-foreground">No car ID provided in the URL.</p>
          </div>
        </div>
      </div>
    );
  }
  
  const car = createDemoCarForId(lot);
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      <div className="container-responsive py-6 max-w-7xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Button
            variant="outline"
            onClick={() => navigate("/")}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Kryefaqja
          </Button>
          
          <Badge variant="secondary" className="bg-amber-100 text-amber-800 border-amber-200">
            Demo Mode - APIs Unavailable
          </Badge>
        </div>

        {/* Car Details */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Image Section */}
          <div className="space-y-4">
            <div className="aspect-video overflow-hidden rounded-lg bg-muted">
              <img
                src={car.image}
                alt={car.title}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/placeholder.svg';
                }}
              />
            </div>
          </div>

          {/* Info Section */}
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">
                {car.title}
              </h1>
              <p className="text-2xl font-semibold text-primary mb-4">
                €{car.price.toLocaleString()}
              </p>
              <p className="text-muted-foreground">
                This is demo data shown because external APIs are not available in this environment.
              </p>
            </div>

            {/* Specifications */}
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <Car className="h-5 w-5 mr-2 text-primary" />
                  Specifikimet
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Viti:</span>
                    <span className="ml-2 font-medium">{car.year}</span>
                  </div>
                  <div className="flex items-center">
                    <Gauge className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Kilometrazhi:</span>
                    <span className="ml-2 font-medium">{car.mileage}</span>
                  </div>
                  <div className="flex items-center">
                    <Settings className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Transmisioni:</span>
                    <span className="ml-2 font-medium">{car.transmission}</span>
                  </div>
                  <div className="flex items-center">
                    <Fuel className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Karburanti:</span>
                    <span className="ml-2 font-medium">{car.fuel}</span>
                  </div>
                  <div className="flex items-center">
                    <Palette className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Ngjyra:</span>
                    <span className="ml-2 font-medium">{car.color}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Contact */}
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <Phone className="h-5 w-5 mr-2 text-primary" />
                  Kontakti
                </h3>
                <p className="text-muted-foreground mb-4">
                  Për më shumë informacion rreth kësaj makine, na kontaktoni:
                </p>
                <Button className="w-full" onClick={() => {
                  const message = `Përshëndetje! Jam i interesuar për ${car.year} ${car.make} ${car.model} (€${car.price.toLocaleString()}) - Kodi #${car.lot}. A mund të më jepni më shumë informacion?`;
                  const whatsappUrl = `https://wa.me/38348181116?text=${encodeURIComponent(message)}`;
                  window.open(whatsappUrl, "_blank");
                }}>
                  <Phone className="h-4 w-4 mr-2" />
                  Kontakto në WhatsApp
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DemoCarDetails;