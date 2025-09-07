import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Ship, Package, Search, ArrowLeft, CheckCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";

const ShipmentTracking = () => {
  const [trackingNumber, setTrackingNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [multipleResults, setMultipleResults] = useState<any[]>([]);
  const [showMultiResultDialog, setShowMultiResultDialog] = useState(false);
  const [widgetData, setWidgetData] = useState<any>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Function to generate multiple realistic results for the same VIN
  const createMultipleResults = (query: string) => {
    const chassis = query.length >= 17 ? query.substring(0, 17) : query;
    const results = [];
    
    // Simulate different shipments with same chassis but different destinations/vessels
    const destinations = [
      { port: "Durres Port, Albania", vessel: "MV SANG SHIN V.2508", eta: "2025-09-11" },
      { port: "Rotterdam Port, Netherlands", vessel: "MV CIG EXPRESS", eta: "2025-09-15" },
      { port: "Hamburg Port, Germany", vessel: "MV KOREA STAR", eta: "2025-09-20" }
    ];
    
    const shippers = ['주식회사 싼카', '현대자동차', '기아자동차'];
    const models = ['C200', 'Sonata', 'K5'];
    
    destinations.forEach((dest, index) => {
      results.push({
        id: `result_${index}`,
        query: { chassis, year: "2024" },
        result: {
          shipper: shippers[index % shippers.length],
          model_year: models[index % models.length],
          chassis: chassis,
          vessel: dest.vessel,
          pol: "INCHEON, KOREA",
          on_board: "2025-08-06",
          port: dest.port,
          eta: dest.eta
        },
        shipping_status: {
          overall: "Loaded",
          steps: [
            { name: "In Port", active: true },
            { name: "Vessel Fixed", active: true },
            { name: "Shipment Ready", active: true },
            { name: "Loaded", active: true },
            { name: "Arrival", active: false }
          ]
        },
        source: "cigshipping.com",
        last_updated: new Date().toISOString(),
        rows: [
          {
            type: "metadata",
            shipper: shippers[index % shippers.length],
            model: models[index % models.length],
            chassis: chassis,
            vesselName: dest.vessel,
            portOfLoading: "INCHEON, KOREA",
            portOfDischarge: dest.port,
            onBoard: "2025-08-06",
            estimatedArrival: dest.eta,
            shippingLine: "CIG Shipping Line",
            billOfLading: "CIG" + chassis.substring(9, 17) + index,
            containerNumber: "CGMU" + Math.random().toString().substring(2, 9)
          },
          {
            type: "event",
            date: "2025-08-06",
            event: "Container loaded on vessel",
            location: "INCHEON, KOREA",
            vessel: dest.vessel,
            status: "Loaded"
          },
          {
            type: "event", 
            date: "2025-08-07",
            event: "Vessel departure",
            location: "INCHEON, KOREA",
            vessel: dest.vessel,
            status: "Departed"
          },
          {
            type: "event",
            date: dest.eta,
            event: "Expected arrival",
            location: dest.port,
            vessel: dest.vessel,
            status: "In Transit"
          }
        ]
      });
    });
    
    return results;
  };

  // Helper function to create enhanced mock data that simulates real CIG responses
  const createEnhancedMockData = (query: string) => {
    const chassis = query.length >= 17 ? query.substring(0, 17) : query;
    const currentYear = new Date().getFullYear().toString();
    
    // Simulate different shipping statuses based on query characteristics
    const statusOptions = ['In Port', 'Loaded', 'In Transit', 'Arrived'];
    const selectedStatus = statusOptions[Math.floor(Math.random() * statusOptions.length)];
    
    // Korean car manufacturers for realistic shipper names
    const shippers = ['주식회사 싼카', '현대자동차', '기아자동차', '쌍용자동차'];
    const selectedShipper = shippers[Math.floor(Math.random() * shippers.length)];
    
    // Common vessel names from CIG Shipping
    const vessels = ['MV SANG SHIN V.2508', 'MV CIG EXPRESS', 'MV KOREA STAR', 'MV BUSAN LINE'];
    const selectedVessel = vessels[Math.floor(Math.random() * vessels.length)];
    
    // Generate realistic dates
    const onBoardDate = new Date();
    onBoardDate.setDate(onBoardDate.getDate() - Math.floor(Math.random() * 30));
    const etaDate = new Date();
    etaDate.setDate(etaDate.getDate() + Math.floor(Math.random() * 45) + 10);
    
    return {
      query: {
        chassis: chassis,
        year: currentYear
      },
      result: {
        shipper: selectedShipper,
        model_year: "Unknown Model",
        chassis: chassis,
        vessel: selectedVessel,
        pol: "INCHEON, KOREA",
        on_board: onBoardDate.toISOString().split('T')[0],
        port: "Durres Port, Albania", 
        eta: etaDate.toISOString().split('T')[0]
      },
      shipping_status: {
        overall: selectedStatus,
        steps: [
          { name: "In Port", active: true },
          { name: "Vessel Fixed", active: true },
          { name: "Shipment Ready", active: selectedStatus !== 'In Port' },
          { name: "Loaded", active: ['Loaded', 'In Transit', 'Arrived'].includes(selectedStatus) },
          { name: "Arrival", active: selectedStatus === 'Arrived' }
        ]
      },
      source: "cigshipping.com (simulated)",
      last_updated: new Date().toISOString(),
      rows: [
        {
          type: "metadata",
          shipper: selectedShipper,
          model: "Unknown Model",
          chassis: chassis,
          vesselName: selectedVessel,
          portOfLoading: "INCHEON, KOREA",
          portOfDischarge: "Durres Port, Albania",
          onBoard: onBoardDate.toISOString().split('T')[0],
          estimatedArrival: etaDate.toISOString().split('T')[0],
          shippingLine: "CIG Shipping Line",
          billOfLading: "CIG" + chassis.substring(Math.max(0, chassis.length - 8)),
          containerNumber: "CGMU" + Math.random().toString().substring(2, 9)
        },
        {
          type: "event",
          date: onBoardDate.toISOString().split('T')[0],
          event: "Container loaded on vessel",
          location: "INCHEON, KOREA",
          vessel: selectedVessel,
          status: "Loaded"
        },
        {
          type: "event", 
          date: new Date(onBoardDate.getTime() + 86400000).toISOString().split('T')[0],
          event: "Vessel departure",
          location: "INCHEON, KOREA",
          vessel: selectedVessel,
          status: "Departed"
        },
        {
          type: "event",
          date: etaDate.toISOString().split('T')[0],
          event: "Expected arrival",
          location: "Durres Port, Albania",
          vessel: selectedVessel, 
          status: "In Transit"
        }
      ]
    };
  };

  // Helper function to create mock widget data for development demo
  const createMockWidgetData = (query: string) => {
    const chassis = query.substring(0, 17);
    const year = query.includes('2024') ? '2024' : '2021';
    
    return {
      query: {
        chassis: chassis,
        year: year
      },
      result: {
        shipper: "주식회사 싼카",
        model_year: "C200",
        chassis: chassis,
        vessel: "MV SANG SHIN V.2508",
        pol: "INCHEON, KOREA",
        on_board: "2025-08-06",
        port: "Durres Port, Albania", 
        eta: "2025-09-11"
      },
      shipping_status: {
        overall: "Loaded",
        steps: [
          { name: "In Port", active: true },
          { name: "Vessel Fixed", active: true },
          { name: "Shipment Ready", active: true },
          { name: "Loaded", active: true },
          { name: "Arrival", active: false }
        ]
      },
      source: "cigshipping.com",
      last_updated: new Date().toISOString(),
      rows: [
        {
          type: "metadata",
          shipper: "주식회사 싼카",
          model: "C200",
          chassis: chassis,
          vesselName: "MV SANG SHIN V.2508",
          portOfLoading: "INCHEON, KOREA",
          portOfDischarge: "Durres Port, Albania",
          onBoard: "2025-08-06",
          estimatedArrival: "2025-09-11",
          shippingLine: "CIG Shipping Line",
          billOfLading: "CIG" + chassis.substring(9, 17),
          containerNumber: "CGMU" + Math.random().toString().substring(2, 9)
        },
        {
          type: "event",
          date: "2025-08-06",
          event: "Container loaded on vessel",
          location: "INCHEON, KOREA",
          vessel: "MV SANG SHIN V.2508",
          status: "Loaded"
        },
        {
          type: "event", 
          date: "2025-08-07",
          event: "Vessel departure",
          location: "INCHEON, KOREA",
          vessel: "MV SANG SHIN V.2508",
          status: "Departed"
        },
        {
          type: "event",
          date: "2025-09-11",
          event: "Expected arrival",
          location: "Durres Port, Albania",
          vessel: "MV SANG SHIN V.2508", 
          status: "In Transit"
        }
      ]
    };
  };

  // Helper function to get appropriate icon for status
  const getStatusIcon = (status: string) => {
    const statusLower = status.toLowerCase();
    
    if (statusLower.includes('arrived') || statusLower.includes('arrival')) {
      return '🚢';
    } else if (statusLower.includes('departed') || statusLower.includes('departure')) {
      return '⚓';
    } else if (statusLower.includes('loaded') || statusLower.includes('loading')) {
      return '📦';
    } else if (statusLower.includes('discharged') || statusLower.includes('discharge')) {
      return '🏗️';
    } else if (statusLower.includes('customs') || statusLower.includes('cleared')) {
      return '✅';
    } else if (statusLower.includes('gate')) {
      return '🚪';
    } else {
      return '📍';
    }
  };

  const handleTrackingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackingNumber.trim()) {
      toast({
        title: "Error",
        description: "Please enter a chassis/VIN number",
        variant: "destructive",
      });
      return;
    }

    const trimmedQuery = trackingNumber.trim();
    
    // Validate VIN format if it looks like a VIN (17 characters)
    if (trimmedQuery.length === 17 && !/^[A-HJ-NPR-Z0-9]{17}$/i.test(trimmedQuery)) {
      toast({
        title: "Error",
        description: "Invalid VIN format. VIN must be 17 characters (A-Z, 0-9, no I, O, Q)",
        variant: "destructive",
      });
      return;
    } else if (trimmedQuery.length < 5) {
      toast({
        title: "Error", 
        description: "Tracking number too short. Enter a valid chassis/VIN number (at least 5 characters)",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    setHasSearched(true);

    try {
      // Note: Direct fetching from cigshipping.com is blocked by CORS policy
      // We'll use our mock data to demonstrate the expected format
      console.log('Simulating CIG Shipping lookup for:', trimmedQuery);
      
      let data;
      
      // Try our worker API first (if available)
      try {
        const response = await fetch(`/api/cig-track?q=${encodeURIComponent(trimmedQuery)}`);
        
        if (response.ok) {
          data = await response.json();
          
          if (data.error) {
            console.warn('CIG Worker API returned error:', data.error);
            throw new Error(data.error);
          }
          
          // Mark data as real data from CIG Shipping
          data.isRealData = true;
          data.source = "CIG Shipping (Live Data)";
          
        } else if (response.status === 404) {
          throw new Error('Worker API endpoint not deployed');
        } else if (response.status === 429) {
          throw new Error('Rate limit exceeded. Please try again in a moment.');
        } else {
          throw new Error(`Worker API error: ${response.status}`);
        }
      } catch (workerError) {
        console.log('Worker API not available or failed, using enhanced mock data:', workerError.message);
        
        // Show user that we're using demo data
        toast({
          title: "Using Demo Data",
          description: `CIG Shipping API unavailable (${workerError.message}). Showing enhanced demo data.`,
          variant: "default",
        });
        
        // Simulate multiple results for demonstration (30% chance for VINs)
        const hasMultipleResults = trimmedQuery.length === 17 && Math.random() < 0.3;
        
        if (hasMultipleResults) {
          // Generate multiple results for selection
          const multiResults = createMultipleResults(trimmedQuery);
          setMultipleResults(multiResults);
          setShowMultiResultDialog(true);
          setLoading(false);
          return; // Don't proceed with setting results yet
        } else {
          // Enhanced mock data that simulates real CIG Shipping responses
          data = createEnhancedMockData(trimmedQuery);
          data.isRealData = false;
          data.source = "Demo Data (CIG API unavailable)";
        }
      }
      
      // Store widget data if available
      setWidgetData(data);
      
      // Convert the API response to our expected format (backwards compatibility)
      const rowsData = data.rows || [];
      const convertedResults = rowsData.map((row: any, index: number) => ({
        id: index.toString(),
        type: row.type,
        status: row.status || row.event || 'Update',
        location: row.location,
        date: row.date,
        vessel: row.vessel,
        containerNumber: row.containerNumber,
        description: row.event || row.status,
        estimatedDelivery: row.estimatedArrival,
        // Include all metadata fields
        ...row
      }));

      setResults(convertedResults);
      
      if (convertedResults.length > 0) {
        const dataSourceText = data.isRealData ? "real-time CIG Shipping data" : "demo data for development";
        toast({
          title: "Tracking Information Found",
          description: `Displaying ${dataSourceText} for chassis ${trackingNumber}${data.isRealData ? "" : " (Deploy Cloudflare Worker for live data)"}`,
        });
      } else {
        toast({
          title: "No Results",
          description: data.isRealData ? "No tracking information found for this chassis number in CIG Shipping system" : "No tracking information found for this chassis number",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Tracking error:', error);
      
      // Provide specific error messages based on the error type
      let errorMessage = "Failed to track shipment. Please check the chassis number and try again.";
      let errorTitle = "Error";
      
      if (error.message.includes('Rate limit')) {
        errorTitle = "Rate Limited";
        errorMessage = "Too many requests. Please wait a moment and try again.";
      } else if (error.message.includes('network') || error.message.includes('fetch')) {
        errorTitle = "Network Error";
        errorMessage = "Unable to connect to tracking service. Please check your internet connection and try again.";
      } else if (error.message.includes('Worker API')) {
        errorTitle = "Service Configuration";
        errorMessage = "Tracking service is not properly configured. Contact support if this issue persists.";
      }
      
      toast({
        title: errorTitle,
        description: errorMessage,
        variant: "destructive",
      });
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  // Handle selection of a specific result from multiple options
  const handleResultSelection = (selectedResult: any) => {
    setWidgetData(selectedResult);
    
    // Convert the selected result to our expected format
    const rowsData = selectedResult.rows || [];
    const convertedResults = rowsData.map((row: any, index: number) => ({
      id: index.toString(),
      type: row.type,
      status: row.status || row.event || 'Update',
      location: row.location,
      date: row.date,
      vessel: row.vessel,
      containerNumber: row.containerNumber,
      description: row.event || row.status,
      estimatedDelivery: row.estimatedArrival,
      // Include all metadata fields
      ...row
    }));

    setResults(convertedResults);
    setShowMultiResultDialog(false);
    setMultipleResults([]);
    
    toast({
      title: "Result Selected",
      description: `Displaying tracking information for vessel ${selectedResult.result.vessel}`,
    });
  };

  // Parse real CIG Shipping data from HTML response
  const parseRealCIGData = (html: string, query: string) => {
    // Extract shipping information from the actual CIG website HTML
    const data = {
      query: { chassis: query, year: "2024" },
      result: {},
      shipping_status: {
        overall: "Unknown",
        steps: [
          { name: "In Port", active: false },
          { name: "Vessel Fixed", active: false },
          { name: "Shipment Ready", active: false },
          { name: "Loaded", active: false },
          { name: "Arrival", active: false }
        ]
      },
      source: "cigshipping.com",
      last_updated: new Date().toISOString(),
      rows: []
    };

    // Parse search results table - looking for SHIPPER, MODEL(YEAR), CHASSIS, VESSEL, POL, On Board, PORT, ETA
    const tableRegex = /<table[^>]*>(.*?)<\/table>/gis;
    const tableMatch = html.match(tableRegex);
    
    if (tableMatch) {
      const tableHtml = tableMatch[0];
      
      // Extract table rows
      const rowRegex = /<tr[^>]*>(.*?)<\/tr>/gis;
      let rowMatch;
      let shipmentData: any = {};
      
      while ((rowMatch = rowRegex.exec(tableHtml)) !== null) {
        const rowHtml = rowMatch[1];
        const cellRegex = /<td[^>]*>(.*?)<\/td>/gis;
        const cells = [];
        let cellMatch;
        
        while ((cellMatch = cellRegex.exec(rowHtml)) !== null) {
          const cellText = cellMatch[1].replace(/<[^>]*>/g, '').trim();
          if (cellText) cells.push(cellText);
        }
        
        // Map cells to expected structure based on CIG website format
        if (cells.length >= 2) {
          if (cells[0].includes('SHIPPER') && cells[1]) {
            shipmentData.shipper = cells[1];
          }
          if (cells[0].includes('MODEL') && cells[1]) {
            shipmentData.model = cells[1];
          }
          if (cells[0].includes('CHASSIS') && cells[1]) {
            shipmentData.chassis = cells[1];
          }
          if (cells[0].includes('VESSEL') && cells[1]) {
            shipmentData.vessel = cells[1];
          }
          if (cells[0].includes('POL') && cells[1]) {
            shipmentData.pol = cells[1];
          }
          if (cells[0].includes('On Board') && cells[1]) {
            shipmentData.onBoard = cells[1];
          }
          if (cells[0].includes('PORT') && cells[1]) {
            shipmentData.port = cells[1];
          }
          if (cells[0].includes('ETA') && cells[1]) {
            shipmentData.eta = cells[1];
          }
        }
      }
      
      // If we found data, structure it properly
      if (Object.keys(shipmentData).length > 0) {
        data.result = shipmentData;
        
        // Add metadata row
        data.rows.push({
          type: "metadata",
          shipper: shipmentData.shipper,
          model: shipmentData.model,
          chassis: shipmentData.chassis,
          vesselName: shipmentData.vessel,
          portOfLoading: shipmentData.pol,
          portOfDischarge: shipmentData.port,
          onBoard: shipmentData.onBoard,
          estimatedArrival: shipmentData.eta,
          shippingLine: "CIG Shipping Line",
          billOfLading: shipmentData.chassis ? "CIG" + shipmentData.chassis.substring(9, 17) : undefined,
          containerNumber: "CGMU" + Math.random().toString().substring(2, 9)
        });

        // Determine shipping status based on available data
        if (shipmentData.onBoard) {
          data.shipping_status.overall = "Loaded";
          data.shipping_status.steps = [
            { name: "In Port", active: true },
            { name: "Vessel Fixed", active: true },
            { name: "Shipment Ready", active: true },
            { name: "Loaded", active: true },
            { name: "Arrival", active: false }
          ];
        }

        // Add event rows
        if (shipmentData.onBoard) {
          data.rows.push({
            type: "event",
            date: shipmentData.onBoard,
            event: "Container loaded on vessel",
            location: shipmentData.pol,
            vessel: shipmentData.vessel,
            status: "Loaded"
          });
        }

        if (shipmentData.eta) {
          data.rows.push({
            type: "event",
            date: shipmentData.eta,
            event: "Expected arrival",
            location: shipmentData.port,
            vessel: shipmentData.vessel,
            status: "In Transit"
          });
        }
      }
    }

    // If no real data found, fallback to demo data
    if (data.rows.length === 0) {
      return createMockWidgetData(query);
    }

    return data;
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* CIG Shipping inspired header */}
      <div className="bg-gradient-to-r from-blue-800 to-blue-600 text-white py-6">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-3">
            <Ship className="h-8 w-8" />
            <div>
              <h1 className="text-2xl font-bold">CIG Shipping Cargo Tracking</h1>
              <p className="text-blue-100">Track your vehicle shipment in real-time</p>
            </div>
          </div>
        </div>
      </div>
      
      <div className="container mx-auto container-responsive px-2 sm:px-4 py-4 sm:py-8">
        <div className="max-w-4xl mx-auto">
          {/* Page Header - Ultra Compact for mobile */}
          <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-6 tracking-page-header">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(-1)}
              className="flex items-center gap-1 min-w-0 tracking-button-compact"
            >
              <ArrowLeft className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Back</span>
            </Button>
          </div>

          {/* Tracking Form - CIG Shipping Style */}
          <Card className="mb-3 sm:mb-6 tracking-card-ultra-compact border-l-4 border-l-blue-600">
            <CardHeader className="pb-2 sm:pb-4 bg-blue-50">
              <CardTitle className="flex items-center gap-2 text-sm sm:text-lg text-blue-800">
                <Package className="h-4 w-4 sm:h-5 sm:w-5" />
                CARGO TRACKING SEARCH
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 bg-white">
              <form onSubmit={handleTrackingSubmit} className="space-y-2 sm:space-y-4">
                <div>
                  <label htmlFor="tracking-input" className="block text-xs sm:text-sm font-bold mb-1 mobile-text-optimize text-blue-800">
                    CHASSIS (VIN) Number:
                  </label>
                  <Input
                    id="tracking-input"
                    type="text"
                    placeholder="Enter 17-digit chassis/VIN number (e.g. WBABC123456789ABC)"
                    value={trackingNumber}
                    onChange={(e) => setTrackingNumber(e.target.value)}
                    className="w-full text-sm mobile-text-optimize tracking-input-compact border-2 border-blue-200 focus:border-blue-500"
                    disabled={loading}
                  />
                  <p className="text-xs text-gray-600 mt-1">
                    * Enter the 17-character vehicle identification number (VIN/Chassis)
                  </p>
                </div>
                <Button 
                  type="submit" 
                  disabled={loading} 
                  className="w-full sm:w-auto mobile-text-optimize tracking-button-compact bg-blue-600 hover:bg-blue-700"
                >
                  {loading ? (
                    <>
                      <Search className="h-3 w-3 sm:h-4 sm:w-4 mr-2 animate-spin" />
                      SEARCHING...
                    </>
                  ) : (
                    <>
                      <Search className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                      SEARCH CARGO
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Multi-Result Selection Dialog */}
          <Dialog open={showMultiResultDialog} onOpenChange={setShowMultiResultDialog}>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Ship className="h-5 w-5" />
                  Multiple Shipments Found
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <p className="text-muted-foreground">
                  Multiple shipments were found for chassis <strong>{trackingNumber}</strong>. 
                  Please select the shipment you want to track:
                </p>
                <div className="grid gap-4">
                  {multipleResults.map((result, index) => (
                    <Card 
                      key={result.id} 
                      className="cursor-pointer hover:shadow-md transition-shadow border-2 hover:border-primary/50"
                      onClick={() => handleResultSelection(result)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <Ship className="h-4 w-4 text-blue-600" />
                            <h3 className="font-semibold text-lg">
                              {result.result.vessel}
                            </h3>
                            <Badge variant="outline" className="text-xs">
                              {result.shipping_status.overall}
                            </Badge>
                          </div>
                          <Button variant="outline" size="sm">
                            Select <CheckCircle className="h-4 w-4 ml-1" />
                          </Button>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="font-medium text-blue-700">SHIPPER:</span>
                            <div className="text-gray-700">{result.result.shipper}</div>
                          </div>
                          <div>
                            <span className="font-medium text-blue-700">MODEL:</span>
                            <div className="text-gray-700">{result.result.model_year}</div>
                          </div>
                          <div>
                            <span className="font-medium text-blue-700">POL:</span>
                            <div className="text-gray-700">{result.result.pol}</div>
                          </div>
                          <div>
                            <span className="font-medium text-blue-700">PORT:</span>
                            <div className="text-gray-700">{result.result.port}</div>
                          </div>
                          <div>
                            <span className="font-medium text-blue-700">On Board:</span>
                            <div className="text-gray-700">{result.result.on_board}</div>
                          </div>
                          <div>
                            <span className="font-medium text-blue-700">ETA:</span>
                            <div className="text-gray-700">{result.result.eta}</div>
                          </div>
                          <div className="col-span-2">
                            <span className="font-medium text-blue-700">CHASSIS:</span>
                            <div className="text-gray-700 font-mono text-xs">{result.result.chassis}</div>
                          </div>
                        </div>
                        
                        {/* Shipping Status Progress */}
                        <div className="mt-3 pt-3 border-t">
                          <div className="flex flex-wrap gap-2">
                            {result.shipping_status.steps.map((step: any, stepIndex: number) => (
                              <div 
                                key={stepIndex}
                                className={`flex items-center gap-1 px-2 py-1 rounded text-xs ${
                                  step.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-500'
                                }`}
                              >
                                <div className={`w-2 h-2 rounded-full ${
                                  step.active ? 'bg-green-500' : 'bg-gray-300'
                                }`} />
                                <span>{step.name}</span>
                                {step.active && <span>✓</span>}
                              </div>
                            ))}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Results - Compact layout for mobile */}
          {hasSearched && (
            <div className="space-y-2 sm:space-y-4">
              {results.length > 0 ? (
                <>
                  <h2 className="text-base sm:text-xl font-semibold text-foreground mobile-text-optimize">
                    Tracking Results for: {trackingNumber}
                  </h2>
                  <div className="space-y-2 sm:space-y-3">
                    {/* Shipment Metadata Card - Ultra Compact */}
                    {results.some(r => r.type === 'metadata') && (
                <Card className="border-l-4 border-l-blue-500 tracking-card-ultra-compact">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-sm sm:text-lg mobile-text-optimize">
                      📋 Cargo Information (CIG Shipping)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="tracking-metadata-two-col">
                      {results.filter(r => r.type === 'metadata').map((metadata) => (
                        <div key="metadata" className="col-span-2 space-y-1">
                          {metadata.shipper && (
                            <div className="tracking-metadata-horizontal text-blue-700">
                              <strong>SHIPPER:</strong> <span>{metadata.shipper}</span>
                            </div>
                          )}
                          {metadata.model && (
                            <div className="tracking-metadata-horizontal text-blue-700">
                              <strong>MODEL (YEAR):</strong> <span>{metadata.model}</span>
                            </div>
                          )}
                          {metadata.chassis && (
                            <div className="tracking-metadata-horizontal text-blue-700">
                              <strong>CHASSIS:</strong> <span>{metadata.chassis}</span>
                            </div>
                          )}
                          {metadata.vesselName && (
                            <div className="tracking-metadata-horizontal text-blue-700">
                              <strong>VESSEL:</strong> <span>{metadata.vesselName}</span>
                            </div>
                          )}
                          {metadata.portOfLoading && (
                            <div className="tracking-metadata-horizontal text-blue-700">
                              <strong>POL:</strong> <span>{metadata.portOfLoading}</span>
                            </div>
                          )}
                          {metadata.onBoard && (
                            <div className="tracking-metadata-horizontal text-blue-700">
                              <strong>On Board:</strong> <span>{metadata.onBoard}</span>
                            </div>
                          )}
                          {metadata.portOfDischarge && (
                            <div className="tracking-metadata-horizontal text-blue-700">
                              <strong>PORT:</strong> <span>{metadata.portOfDischarge}</span>
                            </div>
                          )}
                          {metadata.estimatedArrival && (
                            <div className="tracking-metadata-horizontal text-blue-700">
                              <strong>ETA:</strong> <span>{metadata.estimatedArrival}</span>
                            </div>
                          )}
                          {metadata.containerNumber && (
                            <div className="tracking-metadata-horizontal text-blue-700">
                              <strong>Container:</strong> <span>{metadata.containerNumber}</span>
                            </div>
                          )}
                          {metadata.billOfLading && (
                            <div className="tracking-metadata-horizontal text-blue-700">
                              <strong>B/L:</strong> <span>{metadata.billOfLading}</span>
                            </div>
                          )}
                          {metadata.shippingLine && (
                            <div className="tracking-metadata-horizontal text-blue-700">
                              <strong>Shipping Line:</strong> <span>{metadata.shippingLine}</span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
                    )}
                    
                    {/* Shipping Status Progress - Ultra Compact */}
                    {widgetData?.shipping_status && (
                      <Card className="border-l-4 border-l-purple-500 tracking-card-ultra-compact">
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2 text-sm sm:text-lg mobile-text-optimize">
                            🚢 Transport Status
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            <div className="tracking-metadata-horizontal text-purple-700">
                              <strong>Current Status:</strong> <span>{widgetData.shipping_status.overall}</span>
                            </div>
                            
                            <div className="space-y-1">
                              <strong className="text-xs mobile-text-optimize">Transport Progress:</strong>
                              <div className="space-y-1">
                                {widgetData.shipping_status.steps.map((step: any, index: number) => (
                                  <div 
                                    key={index} 
                                    className={`tracking-status-step-compact flex items-center gap-2 p-1 rounded text-xs ${
                                      step.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-500'
                                    }`}
                                  >
                                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                                      step.active ? 'bg-green-500' : 'bg-gray-300'
                                    }`} />
                                    <span className={step.active ? 'font-medium' : ''}>{step.name}</span>
                                    {step.active && <span className="text-xs">✓</span>}
                                  </div>
                                ))}
                              </div>
                            </div>
                            
                            {widgetData.result && (
                              <div className="tracking-event-horizontal pt-2 border-t">
                                {widgetData.result.pol && (
                                  <div className="text-blue-700">
                                    <strong>Loading:</strong> {widgetData.result.pol}
                                  </div>
                                )}
                                {widgetData.result.port && (
                                  <div className="text-blue-700">
                                    <strong>Destination:</strong> {widgetData.result.port}
                                  </div>
                                )}
                                {widgetData.result.vessel && (
                                  <div className="text-blue-700">
                                    <strong>Vessel:</strong> {widgetData.result.vessel}
                                  </div>
                                )}
                                {widgetData.result.eta && (
                                  <div className="text-blue-700">
                                    <strong>ETA:</strong> {widgetData.result.eta}
                                  </div>
                                )}
                              </div>
                            )}
                            
                            <div className="text-xs text-muted-foreground pt-2 border-t mobile-text-optimize">
                              Source: {widgetData.source} | Updated: {new Date(widgetData.last_updated).toLocaleString()}
                              {!widgetData.isRealData && (
                                <div className="mt-1 text-orange-600 font-medium">
                                  ⚠️ Demo Data - Deploy Cloudflare Worker for live CIG Shipping integration
                                </div>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                    
                    {/* Tracking Events - Ultra Compact */}
                    {results.filter(r => r.type !== 'metadata').map((result) => (
                      <Card key={result.id} className="border-l-4 border-l-green-500 tracking-card-ultra-compact">
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2 text-sm sm:text-lg mobile-text-optimize">
                            {getStatusIcon(result.status)} {result.status}
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="tracking-event-horizontal">
                            {result.date && (
                              <div className="text-green-700">
                                <strong>Date:</strong> {result.date}
                              </div>
                            )}
                            {result.location && (
                              <div className="text-green-700">
                                <strong>Location:</strong> {result.location}
                              </div>
                            )}
                            {result.vessel && (
                              <div className="text-green-700">
                                <strong>Vessel:</strong> {result.vessel}
                              </div>
                            )}
                            {result.containerNumber && (
                              <div className="text-green-700">
                                <strong>Container:</strong> {result.containerNumber}
                              </div>
                            )}
                          </div>
                          {result.description && (
                            <div className="mt-2 p-2 bg-muted/30 rounded text-xs text-muted-foreground mobile-text-optimize">
                              {result.description}
                            </div>
                          )}
                          {result.estimatedDelivery && (
                            <div className="mt-2 bg-blue-50 rounded p-2 text-xs text-foreground mobile-text-optimize">
                              <strong>Expected Delivery:</strong> {result.estimatedDelivery}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </>
              ) : (
                <Card className="tracking-card-ultra-compact">
                  <CardContent className="py-4 sm:py-6 text-center">
                    <div className="space-y-2 sm:space-y-3">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-muted rounded-full flex items-center justify-center mx-auto">
                        <Package className="h-5 w-5 sm:h-6 sm:w-6 text-muted-foreground" />
                      </div>
                      <div>
                        <h3 className="font-medium text-foreground mb-1 text-sm mobile-text-optimize">
                          No results found
                        </h3>
                        <p className="text-xs text-muted-foreground mobile-text-optimize">
                          No tracking information found for: {trackingNumber}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1 mobile-text-optimize">
                          Please verify the tracking number or contact our team.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Alternative CIG Shipping Section - Ultra Compact */}
          <Card className="mt-4 sm:mt-6 tracking-card-ultra-compact">
            <CardHeader>
              <CardTitle className="text-sm sm:text-lg mobile-text-optimize">Alternative: CIG Shipping Direct</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-2 sm:mb-3 text-xs mobile-text-optimize">
                You can also use the CIG Shipping website for detailed tracking:
              </p>
              <Button
                variant="outline"
                onClick={() => window.open('https://cigshipping.com/Home/en/cargo.html', '_blank')}
                className="w-full sm:w-auto mobile-text-optimize tracking-button-compact"
              >
                Open CIG Shipping
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ShipmentTracking;