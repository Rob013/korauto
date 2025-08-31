import { memo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Car,
  Settings,
  Fuel, 
  Palette,
  Hash,
  Calendar,
  Shield,
  FileText,
  Wrench,
  Award,
  Info,
  CheckCircle,
  XCircle,
  DollarSign,
  MapPin,
  Clock,
  AlertTriangle,
  Key,
  Gauge,
  Cog,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

interface EnhancedCarDetailsProps {
  car: any; // The complete car object with all synced data
}

export const EnhancedCarDetails = memo(({ car }: EnhancedCarDetailsProps) => {
  const [showFullDetails, setShowFullDetails] = useState(false);
  const [showInsurance, setShowInsurance] = useState(false);
  const [showInspection, setShowInspection] = useState(false);

  if (!car) return null;

  const details = car.details || {};
  const carData = car.lots?.[0] || {};

  return (
    <div className="space-y-6">
      {/* Enhanced Pricing Information */}
      <Card className="overflow-hidden bg-gradient-to-br from-background to-muted/20">
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-primary" />
            Pricing & Auction Details
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {car.price && (
              <div className="text-center">
                <p className="text-2xl font-bold text-primary">€{car.price.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">Current Price</p>
              </div>
            )}
            {car.bid && (
              <div className="text-center">
                <p className="text-xl font-semibold text-blue-600">€{car.bid.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">Current Bid</p>
              </div>
            )}
            {car.buy_now && (
              <div className="text-center">
                <p className="text-xl font-semibold text-green-600">€{car.buy_now.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">Buy Now Price</p>
              </div>
            )}
            {car.final_bid && (
              <div className="text-center">
                <p className="text-xl font-semibold text-orange-600">€{car.final_bid.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">Final Sale Price</p>
              </div>
            )}
          </div>

          {/* Additional Pricing Info */}
          {(details.estimate_repair_price || details.pre_accident_price) && (
            <>
              <Separator className="my-4" />
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {details.estimate_repair_price && (
                  <div className="text-center">
                    <p className="text-lg font-medium text-red-600">
                      €{details.estimate_repair_price.toLocaleString()}
                    </p>
                    <p className="text-sm text-muted-foreground">Est. Repair Cost</p>
                  </div>
                )}
                {details.pre_accident_price && (
                  <div className="text-center">
                    <p className="text-lg font-medium text-green-600">
                      €{details.pre_accident_price.toLocaleString()}
                    </p>
                    <p className="text-sm text-muted-foreground">Pre-Accident Value</p>
                  </div>
                )}
                {details.clean_wholesale_price && (
                  <div className="text-center">
                    <p className="text-lg font-medium text-blue-600">
                      €{details.clean_wholesale_price.toLocaleString()}
                    </p>
                    <p className="text-sm text-muted-foreground">Wholesale Value</p>
                  </div>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Enhanced Vehicle Information */}
      <Card className="overflow-hidden bg-gradient-to-br from-background to-muted/20">
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Car className="h-5 w-5 text-primary" />
            Vehicle Information
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            <div className="flex items-center gap-2">
              <Hash className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">VIN</p>
                <p className="font-medium">{car.vin || "Not Available"}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Gauge className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Mileage</p>
                <p className="font-medium">{car.mileage || "Unknown"}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Settings className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Transmission</p>
                <p className="font-medium capitalize">{car.transmission || "Unknown"}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Fuel className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Fuel Type</p>
                <p className="font-medium capitalize">{car.fuel || "Unknown"}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Palette className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Color</p>
                <p className="font-medium capitalize">{car.color || "Unknown"}</p>
              </div>
            </div>

            {car.engine && (
              <div className="flex items-center gap-2">
                <Cog className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Engine</p>
                  <p className="font-medium">{car.engine.name}</p>
                </div>
              </div>
            )}

            {car.cylinders && (
              <div className="flex items-center gap-2">
                <Settings className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Cylinders</p>
                  <p className="font-medium">{car.cylinders}</p>
                </div>
              </div>
            )}

            {car.drive_wheel && (
              <div className="flex items-center gap-2">
                <Car className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Drive</p>
                  <p className="font-medium">{car.drive_wheel.name}</p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Auction & Sale Information */}
      <Card className="overflow-hidden bg-gradient-to-br from-background to-muted/20">
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Award className="h-5 w-5 text-primary" />
            Auction & Sale Details
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {car.lot && (
              <div className="flex items-center gap-2">
                <Hash className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Lot Number</p>
                  <p className="font-medium">{car.lot}</p>
                </div>
              </div>
            )}

            {car.grade_iaai && (
              <div className="flex items-center gap-2">
                <Award className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Grade</p>
                  <Badge variant="outline">{car.grade_iaai}</Badge>
                </div>
              </div>
            )}

            <div className="flex items-center gap-2">
              <Key className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Keys Available</p>
                <Badge variant={car.keys_available ? "default" : "secondary"}>
                  {car.keys_available ? "Yes" : "No"}
                </Badge>
              </div>
            </div>

            {car.seller && (
              <div className="flex items-center gap-2">
                <Info className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Seller</p>
                  <p className="font-medium">{car.seller}</p>
                </div>
              </div>
            )}

            {car.sale_date && (
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Sale Date</p>
                  <p className="font-medium">{new Date(car.sale_date).toLocaleDateString()}</p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Damage & Condition */}
      {(car.damage?.main || car.damage?.second || car.condition) && (
        <Card className="overflow-hidden bg-gradient-to-br from-background to-muted/20">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Condition & Damage Report
            </h3>
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Info className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Overall Condition</p>
                  <Badge variant="outline" className="mt-1">
                    {car.condition || "Unknown"}
                  </Badge>
                </div>
              </div>

              {car.damage?.main && (
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                  <div>
                    <p className="text-sm text-muted-foreground">Primary Damage</p>
                    <Badge variant="destructive" className="mt-1">
                      {car.damage.main}
                    </Badge>
                  </div>
                </div>
              )}

              {car.damage?.second && (
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-orange-500" />
                  <div>
                    <p className="text-sm text-muted-foreground">Secondary Damage</p>
                    <Badge variant="secondary" className="mt-1">
                      {car.damage.second}
                    </Badge>
                  </div>
                </div>
              )}

              {car.airbags && (
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Airbag Status</p>
                    <p className="font-medium">{car.airbags}</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Location Information */}
      {car.location && (
        <Card className="overflow-hidden bg-gradient-to-br from-background to-muted/20">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" />
              Location
            </h3>
            <div className="space-y-2">
              {car.location.country && (
                <p className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Country:</span>
                  <span className="font-medium">{car.location.country.name}</span>
                </p>
              )}
              {car.location.city && (
                <p className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">City:</span>
                  <span className="font-medium">{car.location.city.name}</span>
                </p>
              )}
              {car.location.state && (
                <p className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">State:</span>
                  <span className="font-medium">{car.location.state}</span>
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Insurance Information - Expandable */}
      {(car.insurance || car.insurance_v2) && (
        <Card className="overflow-hidden bg-gradient-to-br from-background to-muted/20">
          <Button
            onClick={() => setShowInsurance(!showInsurance)}
            variant="ghost"
            className="w-full justify-between p-6 h-auto group hover:bg-gradient-to-r hover:from-muted/20 hover:to-muted/10 transition-all duration-300"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                <FileText className="h-4 w-4 text-primary" />
              </div>
              <span className="font-semibold text-foreground">Insurance History</span>
            </div>
            <ChevronDown
              className={`h-5 w-5 text-muted-foreground transition-all duration-300 ${
                showInsurance ? "rotate-180 text-primary" : ""
              }`}
            />
          </Button>

          {showInsurance && (
            <CardContent className="px-6 pb-6 space-y-4 animate-fade-in">
              {car.insurance_v2 && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {car.insurance_v2.myAccidentCnt !== undefined && (
                      <div>
                        <p className="text-sm text-muted-foreground">My Accidents</p>
                        <p className="font-semibold text-red-600">{car.insurance_v2.myAccidentCnt}</p>
                      </div>
                    )}
                    {car.insurance_v2.otherAccidentCnt !== undefined && (
                      <div>
                        <p className="text-sm text-muted-foreground">Other Accidents</p>
                        <p className="font-semibold text-orange-600">{car.insurance_v2.otherAccidentCnt}</p>
                      </div>
                    )}
                    {car.insurance_v2.ownerChangeCnt !== undefined && (
                      <div>
                        <p className="text-sm text-muted-foreground">Owner Changes</p>
                        <p className="font-semibold text-blue-600">{car.insurance_v2.ownerChangeCnt}</p>
                      </div>
                    )}
                    {car.insurance_v2.totalLossCnt !== undefined && (
                      <div>
                        <p className="text-sm text-muted-foreground">Total Loss Count</p>
                        <p className="font-semibold text-red-600">{car.insurance_v2.totalLossCnt}</p>
                      </div>
                    )}
                    {car.insurance_v2.floodTotalLossCnt !== undefined && (
                      <div>
                        <p className="text-sm text-muted-foreground">Flood Loss Count</p>
                        <p className="font-semibold text-purple-600">{car.insurance_v2.floodTotalLossCnt}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          )}
        </Card>
      )}

      {/* Inspection Details - Expandable */}
      {car.inspect && (
        <Card className="overflow-hidden bg-gradient-to-br from-background to-muted/20">
          <Button
            onClick={() => setShowInspection(!showInspection)}
            variant="ghost"
            className="w-full justify-between p-6 h-auto group hover:bg-gradient-to-r hover:from-muted/20 hover:to-muted/10 transition-all duration-300"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                <Wrench className="h-4 w-4 text-primary" />
              </div>
              <span className="font-semibold text-foreground">Inspection Report</span>
            </div>
            <ChevronDown
              className={`h-5 w-5 text-muted-foreground transition-all duration-300 ${
                showInspection ? "rotate-180 text-primary" : ""
              }`}
            />
          </Button>

          {showInspection && (
            <CardContent className="px-6 pb-6 space-y-4 animate-fade-in">
              {car.inspect.accident_summary && (
                <div className="space-y-2">
                  <h4 className="font-medium">Accident Summary</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(car.inspect.accident_summary).map(([key, value]) => (
                      <div key={key} className="text-sm">
                        <span className="text-muted-foreground">{key.replace(/_/g, " ")}:</span>
                        <span className="ml-2 font-medium">{value as string}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          )}
        </Card>
      )}
    </div>
  );
});

EnhancedCarDetails.displayName = "EnhancedCarDetails";