import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Ship, Package, Search, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";

const ShipmentTracking = () => {
  const [trackingNumber, setTrackingNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Helper function to get appropriate icon for status
  const getStatusIcon = (status: string) => {
    const statusLower = status.toLowerCase();
    
    if (statusLower.includes('arrived') || statusLower.includes('arrival') || statusLower.includes('mbërr')) {
      return '🚢';
    } else if (statusLower.includes('departed') || statusLower.includes('departure') || statusLower.includes('nisi')) {
      return '⚓';
    } else if (statusLower.includes('loaded') || statusLower.includes('loading') || statusLower.includes('ngarko')) {
      return '📦';
    } else if (statusLower.includes('discharged') || statusLower.includes('discharge') || statusLower.includes('shkarko')) {
      return '🏗️';
    } else if (statusLower.includes('customs') || statusLower.includes('cleared') || statusLower.includes('doganë')) {
      return '✅';
    } else if (statusLower.includes('gate') || statusLower.includes('portë')) {
      return '🚪';
    } else {
      return '📍';
    }
  };

  const handleTrackingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackingNumber.trim()) {
      toast({
        title: "Gabim",
        description: "Ju lutem shkruani numrin e gjurmimit",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    setHasSearched(true);

    try {
      // Simulate API call - replace with actual tracking service
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Mock results for demonstration
      const mockResults = [
        {
          id: "1",
          status: "In Transit",
          location: "Port of Hamburg, Germany",
          date: "2024-01-15",
          description: "Shipment departed from origin port",
          estimatedDelivery: "2024-01-25",
        },
        {
          id: "2", 
          status: "Processing",
          location: "Corauto Processing Center",
          date: "2024-01-10",
          description: "Vehicle inspection completed",
          estimatedDelivery: "2024-01-25",
        },
      ];

      setResults(mockResults);
      
      toast({
        title: "Sukses",
        description: `U gjetën ${mockResults.length} rezultate për ${trackingNumber}`,
      });
    } catch (error) {
      toast({
        title: "Gabim",
        description: "Nuk u arrit të gjurmojmë ngarkesën. Provoni përsëri.",
        variant: "destructive",
      });
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Page Header */}
          <div className="flex items-center gap-4 mb-8">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(-1)}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Kthehu
            </Button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <Ship className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Gjurmimi i Ngarkesave</h1>
                <p className="text-muted-foreground">
                  Gjurmoni statusin e makinës tuaj gjatë transportit
                </p>
              </div>
            </div>
          </div>

          {/* Tracking Form */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Gjurmimi i Ngarkesës
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleTrackingSubmit} className="space-y-4">
                <div>
                  <label htmlFor="tracking-input" className="block text-sm font-medium mb-2">
                    Shkruani VIN ose numrin e Bill of Lading (B/L):
                  </label>
                  <Input
                    id="tracking-input"
                    type="text"
                    placeholder="P.sh. WBABC123456789 ose BL-2024-001"
                    value={trackingNumber}
                    onChange={(e) => setTrackingNumber(e.target.value)}
                    className="w-full"
                    disabled={loading}
                  />
                </div>
                <Button type="submit" disabled={loading} className="w-full sm:w-auto">
                  {loading ? (
                    <>
                      <Search className="h-4 w-4 mr-2 animate-spin" />
                      Duke gjurmuar...
                    </>
                  ) : (
                    <>
                      <Search className="h-4 w-4 mr-2" />
                      Gjurmo Ngarkesën
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Results */}
          {hasSearched && (
            <div className="space-y-6">
              {results.length > 0 ? (
                <>
                  <h2 className="text-xl font-semibold text-foreground">
                    Rezultatet e Gjurmimit për: {trackingNumber}
                  </h2>
                  <div className="space-y-4">
                    {/* Shipment Metadata Card */}
                    {results.some(r => r.type === 'metadata') && (
                      <Card className="border-l-4 border-l-blue-500">
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            📋 Informacionet e Ngarkesës
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {results.filter(r => r.type === 'metadata').map((metadata) => (
                              <div key="metadata" className="space-y-3">
                                {metadata.containerNumber && (
                                  <div className="p-3 bg-muted/50 rounded-lg border-l-2 border-l-blue-500">
                                    <strong>Numri i Kontejnerit:</strong> {metadata.containerNumber}
                                  </div>
                                )}
                                {metadata.billOfLading && (
                                  <div className="p-3 bg-muted/50 rounded-lg border-l-2 border-l-blue-500">
                                    <strong>Bill of Lading:</strong> {metadata.billOfLading}
                                  </div>
                                )}
                                {metadata.vesselName && (
                                  <div className="p-3 bg-muted/50 rounded-lg border-l-2 border-l-blue-500">
                                    <strong>Anija:</strong> {metadata.vesselName}
                                  </div>
                                )}
                                {metadata.voyageNumber && (
                                  <div className="p-3 bg-muted/50 rounded-lg border-l-2 border-l-blue-500">
                                    <strong>Udhëtimi:</strong> {metadata.voyageNumber}
                                  </div>
                                )}
                                {metadata.shippingLine && (
                                  <div className="p-3 bg-muted/50 rounded-lg border-l-2 border-l-blue-500">
                                    <strong>Linja Detare:</strong> {metadata.shippingLine}
                                  </div>
                                )}
                                {metadata.portOfLoading && (
                                  <div className="p-3 bg-muted/50 rounded-lg border-l-2 border-l-blue-500">
                                    <strong>Porti i Ngarkimit:</strong> {metadata.portOfLoading}
                                  </div>
                                )}
                                {metadata.portOfDischarge && (
                                  <div className="p-3 bg-muted/50 rounded-lg border-l-2 border-l-blue-500">
                                    <strong>Porti i Shkarkimit:</strong> {metadata.portOfDischarge}
                                  </div>
                                )}
                                {metadata.estimatedArrival && (
                                  <div className="p-3 bg-muted/50 rounded-lg border-l-2 border-l-blue-500">
                                    <strong>Mbërritja e Pritshme:</strong> {metadata.estimatedArrival}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}
                    
                    {/* Tracking Events */}
                    {results.filter(r => r.type !== 'metadata').map((result) => (
                      <Card key={result.id} className="border-l-4 border-l-green-500">
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            {getStatusIcon(result.status)} {result.status}
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            {result.date && (
                              <div className="p-3 bg-muted/50 rounded-lg">
                                <strong>Data:</strong> {result.date}
                              </div>
                            )}
                            {result.location && (
                              <div className="p-3 bg-muted/50 rounded-lg">
                                <strong>Vendndodhja:</strong> {result.location}
                              </div>
                            )}
                            {result.vessel && (
                              <div className="p-3 bg-muted/50 rounded-lg">
                                <strong>Anija:</strong> {result.vessel}
                              </div>
                            )}
                            {result.containerNumber && (
                              <div className="p-3 bg-muted/50 rounded-lg">
                                <strong>Kontejneri:</strong> {result.containerNumber}
                              </div>
                            )}
                          </div>
                          {result.description && (
                            <div className="mt-4 p-3 bg-muted/30 rounded-lg">
                              <p className="text-sm text-muted-foreground">
                                {result.description}
                              </p>
                            </div>
                          )}
                          {result.estimatedDelivery && (
                            <div className="mt-4 bg-blue-50 rounded-lg p-3">
                              <p className="text-sm text-foreground">
                                <strong>Data e pritshme e dorëzimit:</strong> {result.estimatedDelivery}
                              </p>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </>
              ) : (
                <Card>
                  <CardContent className="py-8 text-center">
                    <div className="space-y-4">
                      <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto">
                        <Package className="h-8 w-8 text-muted-foreground" />
                      </div>
                      <div>
                        <h3 className="font-medium text-foreground mb-2">
                          Nuk u gjetën rezultate
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          Nuk u gjetën informacione për numrin e gjurmimit: {trackingNumber}
                        </p>
                        <p className="text-sm text-muted-foreground mt-2">
                          Sigurohuni që numri i gjurmimit është i saktë ose kontaktoni ekipin tonë.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Alternative CIG Shipping Section */}
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>Alternativë: CIG Shipping e Drejtpërdrejtë</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Mund të përdorni gjithashtu faqen e CIG Shipping për gjurmim të detajuar:
              </p>
              <Button
                variant="outline"
                onClick={() => window.open('https://cigshipping.com/Home/en/cargo.html', '_blank')}
                className="w-full sm:w-auto"
              >
                Hap CIG Shipping
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ShipmentTracking;