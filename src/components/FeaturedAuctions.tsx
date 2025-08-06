import CarCard from "./CarCard";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

const FeaturedAuctions = () => {
  const featuredCars = [
    {
      id: "1",
      make: "BMW",
      model: "M3 Competition",
      year: 2022,
      price: 87500,
      image: "https://images.unsplash.com/photo-1555215695-3004980ad54e?w=500&h=300&fit=crop&auto=format",
      mileage: "15,000 km",
      transmission: "automatic",
      fuel: "gasoline",
      color: "white",
      condition: "excellent"
    },
    {
      id: "2", 
      make: "Mercedes-Benz",
      model: "AMG GT",
      year: 2021,
      price: 165000,
      image: "https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=500&h=300&fit=crop&auto=format",
      mileage: "8,500 km",
      transmission: "automatic", 
      fuel: "gasoline",
      color: "black",
      condition: "excellent"
    },
    {
      id: "3",
      make: "Porsche",
      model: "911 Turbo S",
      year: 2023,
      price: 245000,
      image: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=500&h=300&fit=crop&auto=format",
      mileage: "3,200 km",
      transmission: "automatic",
      fuel: "gasoline", 
      color: "silver",
      condition: "like_new"
    },
    {
      id: "4",
      make: "Audi",
      model: "RS6 Avant",
      year: 2022,
      price: 95000,
      image: "https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=500&h=300&fit=crop&auto=format",
      mileage: "12,800 km",
      transmission: "automatic",
      fuel: "gasoline",
      color: "blue", 
      condition: "excellent"
    },
    {
      id: "5",
      make: "Tesla", 
      model: "Model S Plaid",
      year: 2023,
      price: 125000,
      image: "https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=500&h=300&fit=crop&auto=format",
      mileage: "5,600 km",
      transmission: "automatic",
      fuel: "electric",
      color: "red",
      condition: "like_new"
    },
    {
      id: "6",
      make: "Ferrari",
      model: "F8 Tributo", 
      year: 2021,
      price: 325000,
      image: "https://images.unsplash.com/photo-1592198084033-aade902d1aae?w=500&h=300&fit=crop&auto=format",
      mileage: "6,900 km",
      transmission: "automatic",
      fuel: "gasoline",
      color: "red",
      condition: "excellent"
    }
  ];

  return (
    <section className="py-16 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4">Featured Auctions</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Discover quality vehicles from trusted sellers. Each car includes detailed inspection reports and comprehensive documentation.
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