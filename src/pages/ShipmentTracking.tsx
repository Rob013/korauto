import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Search } from "lucide-react";
import Header from "@/components/Header";
import { useToast } from "@/hooks/use-toast";

// Mock data - replace with real API when Edge Function is deployed
const MOCK_DATA: Record<string, TrackingData> = {
  "WVGZZZ5NZGW071443": {
    shipper: "주식회사 싼카",
    modelYear: "TIGUAN",
    chassis: "WVGZZZ5NZGW071443",
    vessel: "MV AH SHIN V.2511",
    pol: "INCHEON, KOREA",
    onBoard: "2025-11-13",
    port: "DURRES, ALBANIA",
    eta: "2025-12-13"
  }
};

interface TrackingData {
  shipper: string;
  modelYear: string;
  chassis: string;
  vessel: string;
  pol: string;
  onBoard: string;
  port: string;
  eta: string;
}

const ShipmentTracking = () => {
  const { toast } = useToast();
  const [chassisInput, setChassisInput] = useState("");
  const [searchResult, setSearchResult] = useState<TrackingData | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chassisInput.trim()) {
      toast({
        title: "Input Required",
        description: "Please enter a Chassis number.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    setHasSearched(true);
    setSearchResult(null);

    try {
      // Call our local proxy server instead of ShipGo directly
      const response = await fetch(
        `http://localhost:3001/api/tracking?chassis=${encodeURIComponent(chassisInput.trim())}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`API returned ${response.status}`);
      }

      const data = await response.json();
      console.log('Proxy Response:', data);

      // Handle scraper response
      if (data && data.success && data.data) {
        setSearchResult({
          shipper: data.data.shipper || 'N/A',
          modelYear: data.data.modelYear || 'N/A',
          chassis: data.data.chassis || chassisInput.trim(),
          vessel: data.data.vessel || 'N/A',
          pol: data.data.pol || 'N/A',
          onBoard: data.data.onBoard || 'N/A',
          port: data.data.port || 'N/A',
          eta: data.data.eta || 'N/A',
        });
      } else {
        // Fallback to mock data
        const mockData = MOCK_DATA[chassisInput.trim()];
        if (mockData) {
          setSearchResult(mockData);
        } else {
          toast({
            title: "No Results Found",
            description: "No shipment found. Try: WVGZZZ5NZGW071443",
            variant: "destructive"
          });
        }
      }
    } catch (error) {
      console.error('API Error:', error);

      // Fallback to mock data on error
      const mockData = MOCK_DATA[chassisInput.trim()];
      if (mockData) {
        setSearchResult(mockData);
        toast({
          title: "Using Demo Data",
          description: "Live tracking temporarily unavailable. Showing sample data.",
        });
      } else {
        toast({
          title: "Search Failed",
          description: "Unable to fetch tracking data. Please try again. Demo VIN: WVGZZZ5NZGW071443",
          variant: "destructive"
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white font-sans">
      <Header />

      {/* Breadcrumb Section */}
      <section className="relative h-[200px] md:h-[250px] bg-[#0c2b4b] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-blue-900/80 z-0"></div>
        <div className="absolute inset-0 bg-[url('https://cigshipping.com/Home/img/breadcrumb.png')] bg-cover bg-center opacity-40 z-0"></div>

        <div className="container relative z-10 text-center">
          <div className="text-white">
            <h2 className="text-3xl md:text-5xl font-bold mb-4 tracking-wide">CARGO TRACKING</h2>
            <div className="flex items-center justify-center gap-2 text-sm md:text-base opacity-80">
              <span className="hover:text-blue-300 cursor-pointer" onClick={() => window.location.href = '/'}>Home</span>
              <span>/</span>
              <span>Cargo Tracking</span>
            </div>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-12 md:py-16">
        <div className="max-w-5xl mx-auto">

          {/* Search Section - Matches CIG Design */}
          <div className="mb-10">
            <div className="flex items-center gap-3 mb-6 pb-3 border-b-2 border-gray-200">
              <Search className="h-6 w-6 text-[#0c2b4b]" />
              <h3 className="text-2xl font-bold text-gray-800 uppercase">Search</h3>
            </div>

            <Card className="bg-gray-50/50 border-gray-200 shadow-sm">
              <CardContent className="p-6 md:p-8">
                <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                    <label className="block text-sm font-bold text-gray-700 mb-2 uppercase">Chassis Number</label>
                    <Input
                      placeholder="Enter Chassis Number"
                      value={chassisInput}
                      onChange={(e) => setChassisInput(e.target.value)}
                      className="h-12 text-base bg-white border-gray-300 focus:border-[#0c2b4b] focus:ring-[#0c2b4b]"
                      disabled={isLoading}
                    />
                  </div>
                  <div className="md:pt-7">
                    <Button
                      type="submit"
                      className="h-12 px-10 bg-[#0c2b4b] hover:bg-[#1a4d7a] text-white font-bold text-base min-w-[140px] uppercase tracking-wide"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <div className="flex items-center gap-2">
                          <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                          Searching...
                        </div>
                      ) : (
                        'Search'
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Results Section - Exact CIG Table Style */}
          {hasSearched && searchResult && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center gap-3 mb-6 pb-3 border-b-2 border-[#0c2b4b]">
                <h3 className="text-xl font-bold text-gray-800 uppercase">Search Result</h3>
              </div>

              <div className="overflow-hidden border border-gray-200 shadow-md">
                <table className="w-full text-sm md:text-base border-collapse bg-white">
                  <tbody>
                    {/* Row 1 */}
                    <tr className="border-b border-gray-200">
                      <th className="bg-gray-100 text-gray-700 font-bold p-4 text-left w-1/4 border-r border-gray-200 uppercase text-sm">Shipper</th>
                      <td className="p-4 text-gray-900 w-1/4 border-r border-gray-200">{searchResult.shipper}</td>
                      <th className="bg-gray-100 text-gray-700 font-bold p-4 text-left w-1/4 border-r border-gray-200 uppercase text-sm">Model(Year)</th>
                      <td className="p-4 text-gray-900 w-1/4">{searchResult.modelYear}</td>
                    </tr>

                    {/* Row 2 */}
                    <tr className="border-b border-gray-200">
                      <th className="bg-gray-100 text-gray-700 font-bold p-4 text-left border-r border-gray-200 uppercase text-sm">Chassis</th>
                      <td className="p-4 text-[#0c2b4b] font-bold border-r border-gray-200">{searchResult.chassis}</td>
                      <th className="bg-gray-100 text-gray-700 font-bold p-4 text-left border-r border-gray-200 uppercase text-sm">Vessel</th>
                      <td className="p-4 text-gray-900">{searchResult.vessel}</td>
                    </tr>

                    {/* Row 3 */}
                    <tr className="border-b border-gray-200">
                      <th className="bg-gray-100 text-gray-700 font-bold p-4 text-left border-r border-gray-200 uppercase text-sm">POL</th>
                      <td className="p-4 text-gray-900 border-r border-gray-200">{searchResult.pol}</td>
                      <th className="bg-gray-100 text-gray-700 font-bold p-4 text-left border-r border-gray-200 uppercase text-sm">On Board</th>
                      <td className="p-4 text-gray-900">{searchResult.onBoard}</td>
                    </tr>

                    {/* Row 4 */}
                    <tr>
                      <th className="bg-gray-100 text-gray-700 font-bold p-4 text-left border-r border-gray-200 uppercase text-sm">Port</th>
                      <td className="p-4 text-gray-900 border-r border-gray-200">{searchResult.port}</td>
                      <th className="bg-gray-100 text-gray-700 font-bold p-4 text-left border-r border-gray-200 uppercase text-sm">ETA</th>
                      <td className="p-4 text-[#0c2b4b] font-bold text-lg">{searchResult.eta}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {hasSearched && !searchResult && !isLoading && (
            <div className="text-center py-16 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
              <p className="text-gray-500 text-lg">No results found for this chassis number.</p>
              <p className="text-gray-400 text-sm mt-2">Try: <code className="bg-gray-200 px-2 py-1 rounded">WVGZZZ5NZGW071443</code></p>
            </div>
          )}

        </div>
      </div>

      {/* Footer */}
      <footer className="bg-[#0a1e33] text-white py-8 border-t border-gray-800 mt-auto">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <p className="text-gray-500 text-sm">
              Cargo Tracking System • Copyright © {new Date().getFullYear()}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default ShipmentTracking;