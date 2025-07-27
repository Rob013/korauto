import CarCard from "./CarCard";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

const FeaturedAuctions = () => {
  // Mock data - this will be replaced with API data
  const featuredCars = [
    {
      id: "1",
      make: "BMW",
      model: "M3 Competition",
      year: 2022,
      price: 65000,
      currentBid: 72000,
      imageUrl: "https://images.unsplash.com/photo-1555215695-3004980ad54e?w=800",
      mileage: 15000,
      location: "Munich, Germany",
      endTime: "2 hours 15 min",
      isLive: true,
      watchers: 24
    },
    {
      id: "2",
      make: "Mercedes-Benz",
      model: "AMG GT 63 S",
      year: 2021,
      price: 85000,
      currentBid: 89500,
      imageUrl: "https://images.unsplash.com/photo-1563720360172-67b8f3dce741?w=800",
      mileage: 8500,
      location: "Stuttgart, Germany",
      endTime: "5 hours 42 min",
      isLive: true,
      watchers: 31
    },
    {
      id: "3",
      make: "Audi",
      model: "RS6 Avant",
      year: 2023,
      price: 95000,
      imageUrl: "https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=800",
      mileage: 2100,
      location: "Ingolstadt, Germany",
      endTime: "1 day 3 hours",
      isLive: false,
      watchers: 18
    },
    {
      id: "4",
      make: "Porsche",
      model: "911 Turbo S",
      year: 2022,
      price: 180000,
      currentBid: 185000,
      imageUrl: "https://images.unsplash.com/photo-1503736334956-4c8f8e92946d?w=800",
      mileage: 12000,
      location: "Stuttgart, Germany",
      endTime: "6 hours 28 min",
      isLive: true,
      watchers: 45
    },
    {
      id: "5",
      make: "Ferrari",
      model: "F8 Tributo",
      year: 2021,
      price: 250000,
      currentBid: 258000,
      imageUrl: "https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=800",
      mileage: 5800,
      location: "Maranello, Italy",
      endTime: "12 hours 55 min",
      isLive: true,
      watchers: 67
    },
    {
      id: "6",
      make: "Lamborghini",
      model: "Huracán EVO",
      year: 2022,
      price: 220000,
      imageUrl: "https://images.unsplash.com/photo-1544829099-b9a0c5303bea?w=800",
      mileage: 3200,
      location: "Sant'Agata, Italy",
      endTime: "2 days 14 hours",
      isLive: false,
      watchers: 52
    }
  ];

  return (
    <section className="py-16 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4">Featured Auctions</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Discover premium vehicles from trusted sellers across Europe. Each car includes detailed inspection reports and comprehensive documentation.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {featuredCars.map((car) => (
            <CarCard key={car.id} {...car} />
          ))}
        </div>

        <div className="text-center">
          <Button size="lg" variant="outline" className="px-8">
            View All Auctions
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </div>
    </section>
  );
};

export default FeaturedAuctions;