import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Car, Search, Mail, Phone } from "lucide-react";

// Demo component to showcase the enhanced lot number functionality
const LotNumberDemo = () => {
  const mockInspectionRequests = [
    {
      id: "1",
      customer_name: "John Doe",
      customer_email: "john@example.com",
      customer_phone: "+383 44 123 456",
      car_id: "12345678",
      status: "pending",
      created_at: new Date().toISOString(),
      carDetails: {
        id: "12345678",
        make: "Hyundai",
        model: "Sonata",
        year: 2022,
        image: "https://via.placeholder.com/150x100/007bff/ffffff?text=Car",
        lot_number: "LOT-2024-001"
      }
    },
    {
      id: "2", 
      customer_name: "Jane Smith",
      customer_email: "jane@example.com",
      customer_phone: "+383 44 567 890",
      car_id: "87654321",
      status: "pending",
      created_at: new Date().toISOString(),
      carDetails: null // No cached car details - will show "Need to search"
    },
    {
      id: "3",
      customer_name: "Mike Johnson", 
      customer_email: "mike@example.com",
      customer_phone: "+383 44 111 222",
      car_id: null,
      status: "pending",
      created_at: new Date().toISOString(),
      carDetails: null
    },
    {
      id: "4",
      customer_name: "Sarah Wilson",
      customer_email: "sarah@example.com", 
      customer_phone: "+383 44 333 444",
      car_id: "11223344",
      status: "completed",
      created_at: new Date().toISOString(),
      carDetails: {
        id: "11223344",
        make: "Kia",
        model: "Optima", 
        year: 2021,
        image: "https://via.placeholder.com/150x100/28a745/ffffff?text=Car",
        lot_number: "LOT-2023-156"
      }
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "completed":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-6">
      <Card className="border-2 border-blue-200 bg-blue-50/50">
        <CardHeader>
          <CardTitle className="text-xl text-blue-900 flex items-center gap-2">
            🚗 Enhanced Lot Number Display Demo
          </CardTitle>
          <p className="text-sm text-blue-700">
            This demo shows how lot numbers are now prominently displayed for every inspection request.
          </p>
        </CardHeader>
      </Card>

      {/* Desktop Table View Demo */}
      <Card className="p-4">
        <CardHeader className="p-0 pb-4">
          <CardTitle className="text-lg">Desktop View - Inspection Requests with Lot Numbers</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-border text-sm">
              <thead>
                <tr className="bg-muted/50">
                  <th className="border border-border px-3 py-2 text-left text-xs font-medium">Customer</th>
                  <th className="border border-border px-3 py-2 text-left text-xs font-medium">Contact</th>
                  <th className="border border-border px-3 py-2 text-left text-xs font-medium">Car Details & Lot #</th>
                  <th className="border border-border px-3 py-2 text-left text-xs font-medium">Status</th>
                  <th className="border border-border px-3 py-2 text-left text-xs font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {mockInspectionRequests.map((request) => (
                  <tr key={request.id} className="hover:bg-muted/30 transition-colors">
                    <td className="border border-border px-3 py-2">
                      <div>
                        <div className="font-medium text-foreground">{request.customer_name}</div>
                        <div className="text-xs text-muted-foreground truncate">{request.customer_email}</div>
                      </div>
                    </td>
                    <td className="border border-border px-3 py-2">
                      <span className="text-green-600 text-sm font-medium">
                        {request.customer_phone}
                      </span>
                    </td>
                    <td className="border border-border px-3 py-2">
                      {request.car_id && request.carDetails ? (
                        <div className="flex items-center gap-2">
                          {request.carDetails.image && (
                            <img
                              src={request.carDetails.image}
                              alt="Car"
                              className="w-10 h-8 object-cover rounded"
                            />
                          )}
                          <div className="flex-1">
                            <div className="text-sm font-medium">
                              {request.carDetails.year} {request.carDetails.make} {request.carDetails.model}
                            </div>
                            <div className="text-xs text-muted-foreground">ID: {request.car_id}</div>
                            {/* Always show lot number section with fallback */}
                            <div className="mt-1">
                              {request.carDetails.lot_number ? (
                                <div className="lot-number-highlight">
                                  Lot: {request.carDetails.lot_number}
                                </div>
                              ) : (
                                <div className="text-xs text-amber-600 font-medium">
                                  Lot: Searching...
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ) : request.car_id ? (
                        <div className="space-y-1">
                          <div className="text-sm text-muted-foreground">Car ID: {request.car_id}</div>
                          <div className="text-xs text-amber-600 font-medium">
                            Lot: Need to search
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-1">
                          <div className="text-sm text-muted-foreground">General request</div>
                          <div className="text-xs text-gray-500">
                            No specific car ID
                          </div>
                        </div>
                      )}
                    </td>
                    <td className="border border-border px-3 py-2">
                      <Badge className={getStatusColor(request.status)}>
                        {request.status}
                      </Badge>
                    </td>
                    <td className="border border-border px-3 py-2">
                      <div className="flex gap-1">
                        <Button size="sm" variant="outline" className="h-7 w-7 p-0">
                          <Mail className="h-3 w-3" />
                        </Button>
                        <Button size="sm" variant="outline" className="h-7 w-7 p-0">
                          <Phone className="h-3 w-3" />
                        </Button>
                        {request.car_id && request.carDetails ? (
                          <Button
                            size="sm"
                            variant="default"
                            className="h-7 px-2 text-xs"
                            title={`View car details (Lot: ${request.carDetails.lot_number})`}
                          >
                            <Car className="h-3 w-3 mr-1" />
                            Lot {request.carDetails.lot_number}
                          </Button>
                        ) : request.car_id ? (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 px-2 text-xs"
                            title="Find car and lot number from API"
                          >
                            <Search className="h-3 w-3 mr-1" />
                            Find Lot #
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="secondary"
                            className="h-7 px-2 text-xs"
                            title="Search for car information"
                          >
                            <Search className="h-3 w-3 mr-1" />
                            Search Car
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Mobile Card View Demo */}
      <Card className="p-4">
        <CardHeader className="p-0 pb-4">
          <CardTitle className="text-lg">Mobile View - Enhanced Lot Number Display</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="space-y-3">
            {mockInspectionRequests.map((request) => (
              <div
                key={request.id}
                className="group relative p-4 rounded-lg border border-border/50 hover:border-primary/30 hover:shadow-sm transition-all duration-200 bg-card/50 hover:bg-card"
              >
                <div className="flex items-start gap-3">
                  {/* Car Image or Fallback */}
                  <div className="shrink-0 w-12 h-9 rounded-md overflow-hidden bg-muted flex items-center justify-center">
                    {request.carDetails?.image ? (
                      <img
                        src={request.carDetails.image}
                        alt={`${request.carDetails.year} ${request.carDetails.make} ${request.carDetails.model}`}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Car className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="min-w-0 flex-1">
                        <h4 className="font-medium text-sm text-foreground truncate">
                          {request.customer_name}
                        </h4>
                        <p className="text-xs text-muted-foreground truncate">
                          {request.customer_email}
                        </p>
                      </div>
                      <Badge className={getStatusColor(request.status)}>
                        {request.status}
                      </Badge>
                    </div>

                    {/* Car Info */}
                    {request.carDetails ? (
                      <div className="mb-2 space-y-1">
                        <div className="inline-flex items-center gap-1.5 px-2 py-1 bg-primary/10 text-primary rounded-full text-xs font-medium">
                          <span>{request.carDetails.year} {request.carDetails.make} {request.carDetails.model}</span>
                        </div>
                        {/* Always show lot number section */}
                        <div>
                          {request.carDetails.lot_number ? (
                            <span className="lot-number-highlight">
                              Lot: {request.carDetails.lot_number}
                            </span>
                          ) : (
                            <span className="text-xs text-amber-600 font-medium px-2 py-1 bg-amber-50 rounded">
                              Lot: Searching...
                            </span>
                          )}
                        </div>
                      </div>
                    ) : request.car_id ? (
                      <div className="mb-2">
                        <div className="text-xs text-muted-foreground mb-1">Car ID: {request.car_id}</div>
                        <span className="text-xs text-amber-600 font-medium px-2 py-1 bg-amber-50 rounded">
                          Lot: Need to search
                        </span>
                      </div>
                    ) : (
                      <div className="mb-2">
                        <span className="text-xs text-gray-500 px-2 py-1 bg-gray-50 rounded">
                          No specific car ID
                        </span>
                      </div>
                    )}

                    {/* Footer */}
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{new Date(request.created_at).toLocaleDateString()}</span>
                      <div className="flex items-center gap-2">
                        <Button size="sm" variant="outline" className="h-6 w-6 p-0">
                          <Mail className="h-3 w-3" />
                        </Button>
                        {request.carDetails ? (
                          <Button
                            size="sm"
                            variant="default"
                            className="h-6 px-2 text-xs"
                            title={`View car details (Lot: ${request.carDetails.lot_number})`}
                          >
                            <Car className="h-3 w-3 mr-1" />
                            Lot {request.carDetails.lot_number}
                          </Button>
                        ) : request.car_id ? (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-6 px-2 text-xs"
                            title="Find car and lot number from API"
                          >
                            <Search className="h-3 w-3 mr-1" />
                            Find Lot
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="secondary"
                            className="h-6 px-2 text-xs"
                            title="Search for car information"
                          >
                            <Search className="h-3 w-3 mr-1" />
                            Search
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="border-2 border-green-200 bg-green-50/50">
        <CardHeader>
          <CardTitle className="text-lg text-green-900">✅ Key Improvements Demonstrated</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-green-800">
            <li>• <strong>Always visible lot numbers:</strong> Every inspection request now shows lot number status</li>
            <li>• <strong>Enhanced visual design:</strong> Lot numbers use prominent highlighting with gradient styling</li>
            <li>• <strong>Clear status indicators:</strong> Shows "Searching...", "Need to search", or actual lot number</li>
            <li>• <strong>Improved button labels:</strong> Actions now specifically mention lot number search</li>
            <li>• <strong>Responsive design:</strong> Works seamlessly on both desktop and mobile views</li>
            <li>• <strong>Better UX:</strong> Tooltips and clear visual cues guide admin users</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

export default LotNumberDemo;