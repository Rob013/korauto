import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Search,
  Car,
  AlertCircle,
  CheckCircle,
  Loader2,
  Calendar,
  Palette,
  Settings,
  Fuel,
  Hash,
} from "lucide-react";

interface VinData {
  vin: string;
  year?: string;
  make?: string;
  model?: string;
  trim?: string;
  body_type?: string;
  engine?: string;
  transmission?: string;
  drivetrain?: string;
  fuel_type?: string;
  color?: string;
  country_of_origin?: string;
  manufacturer?: string;
  plant?: string;
  [key: string]: any;
}

export const VinCheckup = () => {
  const [vin, setVin] = useState("");
  const [loading, setLoading] = useState(false);
  const [vinData, setVinData] = useState<VinData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const validateVin = (vinInput: string): boolean => {
    // Basic VIN validation: 17 characters, alphanumeric, no I, O, Q
    const vinPattern = /^[A-HJ-NPR-Z0-9]{17}$/i;
    return vinPattern.test(vinInput.replace(/\s/g, ""));
  };

  const lookupVin = async () => {
    if (!vin.trim()) {
      toast({
        title: "Error",
        description: "Please enter a VIN number",
        variant: "destructive",
      });
      return;
    }

    const cleanVin = vin.trim().toUpperCase().replace(/\s/g, "");

    if (!validateVin(cleanVin)) {
      setError("Invalid VIN format. VIN must be 17 characters long and contain only letters (except I, O, Q) and numbers.");
      toast({
        title: "Invalid VIN",
        description: "Please enter a valid 17-character VIN",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    setError(null);
    setVinData(null);

    try {
      // Using the provided API endpoint and key
      const response = await fetch(
        `https://api.vehicledatabases.com/vin-decode/${cleanVin}?api_key=65fdaccc8bfa11f0bdf80242ac120002`
      );

      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }

      setVinData(data);
      toast({
        title: "VIN Lookup Successful",
        description: `Found vehicle information for VIN: ${cleanVin}`,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to lookup VIN";
      setError(errorMessage);
      toast({
        title: "VIN Lookup Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      lookupVin();
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Car className="h-5 w-5" />
            VIN Checkup
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Enter a 17-character VIN to lookup vehicle information using the Vehicle Databases API
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Enter VIN (17 characters)"
              value={vin}
              onChange={(e) => setVin(e.target.value.toUpperCase())}
              onKeyPress={handleKeyPress}
              maxLength={17}
              className="font-mono"
            />
            <Button 
              onClick={lookupVin} 
              disabled={loading}
              className="min-w-[100px]"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
              {loading ? "Searching..." : "Lookup"}
            </Button>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
              <AlertCircle className="h-4 w-4 text-destructive" />
              <span className="text-sm text-destructive">{error}</span>
            </div>
          )}

          {vinData && (
            <Card className="border-green-200 bg-green-50 dark:bg-green-950/20 dark:border-green-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-800 dark:text-green-200">
                  <CheckCircle className="h-5 w-5" />
                  Vehicle Information Found
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-3 md:grid-cols-2">
                  {vinData.vin && (
                    <div className="flex items-center justify-between p-3 bg-card border border-border rounded-lg">
                      <div className="flex items-center gap-2">
                        <Hash className="h-4 w-4 text-primary" />
                        <span className="font-medium">VIN</span>
                      </div>
                      <span className="font-mono text-sm">{vinData.vin}</span>
                    </div>
                  )}

                  {vinData.year && (
                    <div className="flex items-center justify-between p-3 bg-card border border-border rounded-lg">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-primary" />
                        <span className="font-medium">Year</span>
                      </div>
                      <Badge variant="outline">{vinData.year}</Badge>
                    </div>
                  )}

                  {vinData.make && (
                    <div className="flex items-center justify-between p-3 bg-card border border-border rounded-lg">
                      <div className="flex items-center gap-2">
                        <Car className="h-4 w-4 text-primary" />
                        <span className="font-medium">Make</span>
                      </div>
                      <span className="font-medium">{vinData.make}</span>
                    </div>
                  )}

                  {vinData.model && (
                    <div className="flex items-center justify-between p-3 bg-card border border-border rounded-lg">
                      <div className="flex items-center gap-2">
                        <Car className="h-4 w-4 text-primary" />
                        <span className="font-medium">Model</span>
                      </div>
                      <span className="font-medium">{vinData.model}</span>
                    </div>
                  )}

                  {vinData.trim && (
                    <div className="flex items-center justify-between p-3 bg-card border border-border rounded-lg">
                      <div className="flex items-center gap-2">
                        <Settings className="h-4 w-4 text-primary" />
                        <span className="font-medium">Trim</span>
                      </div>
                      <span className="font-medium">{vinData.trim}</span>
                    </div>
                  )}

                  {vinData.body_type && (
                    <div className="flex items-center justify-between p-3 bg-card border border-border rounded-lg">
                      <div className="flex items-center gap-2">
                        <Car className="h-4 w-4 text-primary" />
                        <span className="font-medium">Body Type</span>
                      </div>
                      <span className="font-medium">{vinData.body_type}</span>
                    </div>
                  )}

                  {vinData.engine && (
                    <div className="flex items-center justify-between p-3 bg-card border border-border rounded-lg">
                      <div className="flex items-center gap-2">
                        <Settings className="h-4 w-4 text-primary" />
                        <span className="font-medium">Engine</span>
                      </div>
                      <span className="font-medium text-sm">{vinData.engine}</span>
                    </div>
                  )}

                  {vinData.transmission && (
                    <div className="flex items-center justify-between p-3 bg-card border border-border rounded-lg">
                      <div className="flex items-center gap-2">
                        <Settings className="h-4 w-4 text-primary" />
                        <span className="font-medium">Transmission</span>
                      </div>
                      <span className="font-medium">{vinData.transmission}</span>
                    </div>
                  )}

                  {vinData.drivetrain && (
                    <div className="flex items-center justify-between p-3 bg-card border border-border rounded-lg">
                      <div className="flex items-center gap-2">
                        <Settings className="h-4 w-4 text-primary" />
                        <span className="font-medium">Drivetrain</span>
                      </div>
                      <span className="font-medium">{vinData.drivetrain}</span>
                    </div>
                  )}

                  {vinData.fuel_type && (
                    <div className="flex items-center justify-between p-3 bg-card border border-border rounded-lg">
                      <div className="flex items-center gap-2">
                        <Fuel className="h-4 w-4 text-primary" />
                        <span className="font-medium">Fuel Type</span>
                      </div>
                      <span className="font-medium">{vinData.fuel_type}</span>
                    </div>
                  )}

                  {vinData.color && (
                    <div className="flex items-center justify-between p-3 bg-card border border-border rounded-lg">
                      <div className="flex items-center gap-2">
                        <Palette className="h-4 w-4 text-primary" />
                        <span className="font-medium">Color</span>
                      </div>
                      <span className="font-medium capitalize">{vinData.color}</span>
                    </div>
                  )}

                  {vinData.country_of_origin && (
                    <div className="flex items-center justify-between p-3 bg-card border border-border rounded-lg">
                      <div className="flex items-center gap-2">
                        <Car className="h-4 w-4 text-primary" />
                        <span className="font-medium">Country of Origin</span>
                      </div>
                      <span className="font-medium">{vinData.country_of_origin}</span>
                    </div>
                  )}

                  {vinData.manufacturer && (
                    <div className="flex items-center justify-between p-3 bg-card border border-border rounded-lg">
                      <div className="flex items-center gap-2">
                        <Car className="h-4 w-4 text-primary" />
                        <span className="font-medium">Manufacturer</span>
                      </div>
                      <span className="font-medium">{vinData.manufacturer}</span>
                    </div>
                  )}

                  {vinData.plant && (
                    <div className="flex items-center justify-between p-3 bg-card border border-border rounded-lg">
                      <div className="flex items-center gap-2">
                        <Car className="h-4 w-4 text-primary" />
                        <span className="font-medium">Plant</span>
                      </div>
                      <span className="font-medium">{vinData.plant}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default VinCheckup;