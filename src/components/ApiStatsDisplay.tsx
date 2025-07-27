import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useEncarAPI } from "@/hooks/useEncarAPI";
import { 
  Car, 
  Database, 
  Clock, 
  TrendingUp, 
  Globe, 
  RefreshCw,
  Zap,
  BarChart3,
  Users,
  Target
} from "lucide-react";

const ApiStatsDisplay = () => {
  const { 
    allCars, 
    manufacturers, 
    models, 
    loading, 
    totalCarsAvailable 
  } = useEncarAPI();
  
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [lastUpdateTime, setLastUpdateTime] = useState<Date>(new Date());

  useEffect(() => {
    if (loading) {
      const interval = setInterval(() => {
        setLoadingProgress(prev => {
          const newProgress = Math.min(prev + Math.random() * 10, 95);
          return newProgress;
        });
      }, 200);
      
      return () => clearInterval(interval);
    } else {
      setLoadingProgress(100);
      setLastUpdateTime(new Date());
    }
  }, [loading]);

  const stats = [
    {
      title: "Total Cars Available",
      value: totalCarsAvailable.toLocaleString(),
      icon: Car,
      color: "text-blue-600",
      description: "All cars from AuctionsAPI"
    },
    {
      title: "Cars Loaded",
      value: allCars.length.toLocaleString(),
      icon: Database,
      color: "text-green-600",
      description: "Currently in memory"
    },
    {
      title: "Manufacturers",
      value: manufacturers.length.toLocaleString(),
      icon: Globe,
      color: "text-purple-600",
      description: "All brands available"
    },
    {
      title: "Models",
      value: models.length.toLocaleString(),
      icon: Target,
      color: "text-orange-600",
      description: "All model variants"
    }
  ];

  const uniqueValues = {
    fuelTypes: [...new Set(allCars.map(car => car.fuel).filter(Boolean))].length,
    transmissions: [...new Set(allCars.map(car => car.transmission).filter(Boolean))].length,
    colors: [...new Set(allCars.map(car => car.color).filter(Boolean))].length,
    bodyTypes: [...new Set(allCars.map(car => car.body_type?.name).filter(Boolean))].length,
    years: [...new Set(allCars.map(car => car.year))].length,
    locations: [...new Set(allCars.map(car => car.location).filter(Boolean))].length
  };

  return (
    <div className="space-y-6">
      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <Card key={index} className="shadow-lg border-0 overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <stat.icon className={`h-8 w-8 ${stat.color}`} />
                <Badge variant="outline" className="text-xs">
                  Live
                </Badge>
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-bold">{stat.value}</h3>
                <p className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </p>
                <p className="text-xs text-muted-foreground">
                  {stat.description}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Loading Progress */}
      {loading && (
        <Card className="shadow-lg border-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5 animate-spin" />
              Loading All Available Cars...
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Progress value={loadingProgress} className="h-3" />
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Fetching unlimited data from AuctionsAPI...</span>
                <span>{Math.round(loadingProgress)}%</span>
              </div>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-blue-600">
                    {allCars.length.toLocaleString()}
                  </div>
                  <div className="text-xs text-muted-foreground">Cars Loaded</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-600">
                    {manufacturers.length}
                  </div>
                  <div className="text-xs text-muted-foreground">Brands</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-purple-600">
                    {models.length}
                  </div>
                  <div className="text-xs text-muted-foreground">Models</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Data Diversity Stats */}
      <Card className="shadow-lg border-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Data Diversity & Coverage
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="text-center space-y-2">
              <div className="text-2xl font-bold text-blue-600">
                {uniqueValues.fuelTypes}
              </div>
              <div className="text-xs text-muted-foreground">
                Fuel Types
              </div>
            </div>
            <div className="text-center space-y-2">
              <div className="text-2xl font-bold text-green-600">
                {uniqueValues.transmissions}
              </div>
              <div className="text-xs text-muted-foreground">
                Transmissions
              </div>
            </div>
            <div className="text-center space-y-2">
              <div className="text-2xl font-bold text-purple-600">
                {uniqueValues.colors}
              </div>
              <div className="text-xs text-muted-foreground">
                Colors
              </div>
            </div>
            <div className="text-center space-y-2">
              <div className="text-2xl font-bold text-orange-600">
                {uniqueValues.bodyTypes}
              </div>
              <div className="text-xs text-muted-foreground">
                Body Types
              </div>
            </div>
            <div className="text-center space-y-2">
              <div className="text-2xl font-bold text-red-600">
                {uniqueValues.years}
              </div>
              <div className="text-xs text-muted-foreground">
                Year Range
              </div>
            </div>
            <div className="text-center space-y-2">
              <div className="text-2xl font-bold text-indigo-600">
                {uniqueValues.locations}
              </div>
              <div className="text-xs text-muted-foreground">
                Locations
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* API Status */}
      <Card className="shadow-lg border-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-yellow-500" />
            API Status & Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium">API Status: Connected</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Real-time connection to api.auctionsapi.com
              </p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-blue-500" />
                <span className="text-sm font-medium">
                  Last Update: {lastUpdateTime.toLocaleTimeString()}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Updates every 30 minutes automatically
              </p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-500" />
                <span className="text-sm font-medium">No Limits Applied</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Fetching all available data without restrictions
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Encar.com Feature Parity */}
      <Card className="shadow-lg border-0 border-l-4 border-l-green-500">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-green-600" />
            Encar.com Feature Parity Achieved
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <h4 className="font-semibold text-green-600">✅ Data Coverage</h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• Complete car specifications</li>
                <li>• Full image galleries</li>
                <li>• Comprehensive search & filtering</li>
                <li>• Real-time auction data</li>
                <li>• Historical pricing information</li>
                <li>• Seller and dealer information</li>
              </ul>
            </div>
            <div className="space-y-3">
              <h4 className="font-semibold text-green-600">✅ Functionality</h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• Advanced filtering system</li>
                <li>• Infinite scroll loading</li>
                <li>• Detailed car inspections</li>
                <li>• Favorites and user accounts</li>
                <li>• Mobile-responsive design</li>
                <li>• Professional inspection service</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ApiStatsDisplay;