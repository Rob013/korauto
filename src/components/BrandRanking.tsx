import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Crown, TrendingUp, Star } from "lucide-react";

const BrandRanking = () => {
  const topBrands = [
    {
      rank: 1,
      name: "Audi",
      logo: "🅰️",
      avgPrice: "€42,300",
      popularity: 95,
      color: "from-red-500 to-red-600"
    },
    {
      rank: 2,
      name: "Volkswagen", 
      logo: "🚗",
      avgPrice: "€28,300",
      popularity: 88,
      color: "from-blue-500 to-blue-600"
    },
    {
      rank: 3,
      name: "BMW",
      logo: "🔷",
      avgPrice: "€48,300",
      popularity: 92,
      color: "from-amber-500 to-amber-600"
    },
    {
      rank: 4,
      name: "Mercedes-Benz",
      logo: "⭐",
      avgPrice: "€55,300",
      popularity: 90,
      color: "from-slate-500 to-slate-600"
    }
  ];

  return (
    <section className="py-12 bg-gradient-to-b from-background to-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold mb-4 text-foreground flex items-center justify-center gap-3">
            <Crown className="h-8 w-8 text-amber-500" />
            Rangimi i Markave më të Preferuara
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Markat më të kërkuara në platformën tonë, me çmime të përditësuara në euro
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {topBrands.map((brand) => (
            <Card key={brand.rank} className="relative overflow-hidden hover:shadow-lg transition-all duration-300 hover:scale-105 border-0 bg-gradient-to-br from-card to-card/50">
              <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${brand.color}`} />
              
              <CardContent className="p-6 text-center">
                {/* Rank Badge */}
                <div className="absolute -top-2 -right-2">
                  <Badge className={`h-8 w-8 rounded-full flex items-center justify-center bg-gradient-to-r ${brand.color} text-white font-bold`}>
                    {brand.rank}
                  </Badge>
                </div>

                {/* Brand Logo/Icon */}
                <div className="text-4xl mb-3">{brand.logo}</div>

                {/* Brand Name */}
                <h3 className="text-xl font-bold text-foreground mb-2">
                  {brand.name}
                </h3>

                {/* Average Price */}
                <div className="mb-4">
                  <div className="text-2xl font-bold text-primary">
                    {brand.avgPrice}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Çmimi mesatar
                  </div>
                </div>

                {/* Popularity Score */}
                <div className="flex items-center justify-center gap-2 mb-3">
                  <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                  <span className="text-sm font-medium text-foreground">
                    {brand.popularity}% Popularitet
                  </span>
                </div>

                {/* Trend Indicator */}
                <div className="flex items-center justify-center gap-1 text-emerald-600">
                  <TrendingUp className="h-4 w-4" />
                  <span className="text-xs font-medium">Në rritje</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center mt-8">
          <p className="text-sm text-muted-foreground">
            * Çmimet përfshijnë 2,300€ tarifë shërbimi dhe janë të përditësuara çdo ditë
          </p>
        </div>
      </div>
    </section>
  );
};

export default BrandRanking;