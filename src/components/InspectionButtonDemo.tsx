import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Car, Search, Mail, Phone } from "lucide-react";

// Mock data to demonstrate the enhanced inspection car redirect buttons
const mockInspectionRequests = [
  {
    id: "1",
    customer_name: "John Doe",
    customer_email: "john@example.com",
    customer_phone: "+383 48 123 456",
    car_id: "12345678",
    status: "pending",
    created_at: "2024-01-15T10:30:00Z",
    notes: "Interested in 2020 Audi A6",
    // This one has car details cached
    carDetails: {
      year: 2020,
      make: "Audi",
      model: "A6",
      lot_number: "LOT123456",
      image: "https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=400"
    }
  },
  {
    id: "2", 
    customer_name: "Jane Smith",
    customer_email: "jane@example.com",
    customer_phone: "+383 48 987 654",
    car_id: "87654321",
    status: "in_progress",
    created_at: "2024-01-14T14:20:00Z",
    notes: "Looking for BMW X5",
    // This one has car_id but no cached details - will show "Find Car" button
    carDetails: null
  },
  {
    id: "3",
    customer_name: "Mike Johnson", 
    customer_email: "mike@example.com",
    customer_phone: "+383 48 555 123",
    car_id: null,
    status: "pending",
    created_at: "2024-01-13T09:15:00Z",
    notes: "Car: 2019 Mercedes C-Class, interested in general inspection",
    // This one has no car_id - will show "Search Car" button
    carDetails: null
  }
];

const InspectionButtonDemo = () => {
  const [searchingCars, setSearchingCars] = useState<{ [key: string]: boolean }>({});

  const mockFindCarByLotNumber = async (requestId: string, searchTerm: string) => {
    setSearchingCars(prev => ({ ...prev, [requestId]: true }));
    
    // Simulate API call
    setTimeout(() => {
      setSearchingCars(prev => ({ ...prev, [requestId]: false }));
      // Mock opening car page
      const carId = `found-car-${requestId}`;
      window.open(`/car/${carId}`, "_blank");
    }, 2000);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "bg-yellow-100 text-yellow-800";
      case "in_progress": return "bg-blue-100 text-blue-800";
      case "completed": return "bg-green-100 text-green-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Enhanced Inspection Car Redirect Buttons - Demo</CardTitle>
          <p className="text-muted-foreground">
            This demo shows how every inspection request now has a car redirect button, regardless of whether car details are cached.
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {mockInspectionRequests.map((request) => (
              <div
                key={request.id}
                className="p-4 border rounded-lg bg-card hover:bg-muted/30 transition-colors"
              >
                <div className="flex items-start gap-4">
                  {/* Car Image or Fallback */}
                  <div className="shrink-0 w-16 h-12 rounded-md overflow-hidden bg-muted flex items-center justify-center">
                    {request.carDetails?.image ? (
                      <img
                        src={request.carDetails.image}
                        alt={`${request.carDetails.year} ${request.carDetails.make} ${request.carDetails.model}`}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Car className="h-6 w-6 text-muted-foreground" />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <div>
                        <h3 className="font-semibold text-lg">{request.customer_name}</h3>
                        <p className="text-sm text-muted-foreground">{request.customer_email}</p>
                        <p className="text-sm text-muted-foreground">{request.customer_phone}</p>
                      </div>
                      <Badge className={getStatusColor(request.status)}>
                        {request.status}
                      </Badge>
                    </div>

                    {/* Car Info */}
                    {request.carDetails && (
                      <div className="mb-2">
                        <div className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium">
                          <span>{request.carDetails.year} {request.carDetails.make} {request.carDetails.model}</span>
                        </div>
                      </div>
                    )}

                    {/* Notes */}
                    {request.notes && (
                      <p className="text-sm text-muted-foreground mb-3">{request.notes}</p>
                    )}

                    {/* Action Buttons */}
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        {formatDate(request.created_at)}
                      </span>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => window.open(`mailto:${request.customer_email}`, "_blank")}
                          className="h-8 w-8 p-0"
                        >
                          <Mail className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => window.open(`https://wa.me/${request.customer_phone.replace(/[^0-9]/g, "")}`, "_blank")}
                          className="h-8 w-8 p-0"
                        >
                          <Phone className="h-4 w-4" />
                        </Button>
                        
                        {/* Enhanced Car Redirect Button - Always Present! */}
                        {request.car_id && request.carDetails ? (
                          // Car details are available - direct view
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() => window.open(`/car/${request.carDetails?.lot_number || request.car_id}`, "_blank")}
                            className="h-8 px-3 text-xs"
                          >
                            <Car className="h-4 w-4 mr-1" />
                            View Car
                          </Button>
                        ) : request.car_id ? (
                          // Car ID exists but details not cached - search and redirect
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => mockFindCarByLotNumber(request.id, request.car_id)}
                            disabled={searchingCars[request.id]}
                            className="h-8 px-3 text-xs"
                          >
                            {searchingCars[request.id] ? (
                              <div className="h-4 w-4 mr-1 animate-spin rounded-full border border-current border-t-transparent" />
                            ) : (
                              <Search className="h-4 w-4 mr-1" />
                            )}
                            {searchingCars[request.id] ? "Finding..." : "Find Car"}
                          </Button>
                        ) : (
                          // No car ID - search based on notes or general search
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => mockFindCarByLotNumber(request.id, request.notes || "general inspection")}
                            disabled={searchingCars[request.id]}
                            className="h-8 px-3 text-xs"
                          >
                            {searchingCars[request.id] ? (
                              <div className="h-4 w-4 mr-1 animate-spin rounded-full border border-current border-t-transparent" />
                            ) : (
                              <Search className="h-4 w-4 mr-1" />
                            )}
                            {searchingCars[request.id] ? "Searching..." : "Search Car"}
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
            <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">Enhancement Summary:</h4>
            <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
              <li>✅ <strong>Every inspection now has a car button</strong> - no more missing buttons!</li>
              <li>🚗 <strong>Direct View:</strong> When car details are cached, shows "View Car" button</li>
              <li>🔍 <strong>Smart Search:</strong> When car_id exists but details missing, shows "Find Car" button</li>
              <li>🔎 <strong>Intelligent Search:</strong> For general inspections, shows "Search Car" button that searches based on notes</li>
              <li>⏳ <strong>Loading States:</strong> Shows spinner and "Finding..." or "Searching..." text during searches</li>
              <li>🎯 <strong>Automatic Redirect:</strong> Found cars automatically open in new tab</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default InspectionButtonDemo;