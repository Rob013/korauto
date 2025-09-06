import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Ship, Package, Calendar, MapPin } from "lucide-react";

interface TrackingResult {
  id: string;
  query: string;
  result?: {
    chassis?: string;
    vessel?: string;
    pol?: string;
    port?: string;
    on_board?: string;
    eta?: string;
    shipper?: string;
    model_year?: string;
  };
  shipping_status?: {
    overall: string;
  };
  rows?: any[];
  source?: string;
  last_updated?: string;
}

interface ResultSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  results: TrackingResult[];
  query: string;
  onSelectResult: (result: TrackingResult) => void;
}

const ResultSelectionModal: React.FC<ResultSelectionModalProps> = ({
  isOpen,
  onClose,
  results,
  query,
  onSelectResult,
}) => {
  const handleSelectResult = (result: TrackingResult) => {
    onSelectResult(result);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Ship className="h-5 w-5" />
            Multiple Results Found
          </DialogTitle>
          <DialogDescription>
            We found multiple shipments for VIN: <strong>{query}</strong>. 
            Please select the shipment you want to track.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 mt-4">
          {results.map((result, index) => (
            <Card 
              key={result.id || index} 
              className="cursor-pointer hover:shadow-md transition-shadow border-2 hover:border-primary/50"
              onClick={() => handleSelectResult(result)}
            >
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center justify-between text-base">
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4" />
                    <span>Shipment {index + 1}</span>
                  </div>
                  {result.shipping_status?.overall && (
                    <Badge variant="outline">
                      {result.shipping_status.overall}
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                  {result.result?.vessel && (
                    <div className="flex items-center gap-2">
                      <Ship className="h-3 w-3 text-muted-foreground" />
                      <span className="text-muted-foreground">Vessel:</span>
                      <span className="font-medium">{result.result.vessel}</span>
                    </div>
                  )}
                  
                  {result.result?.pol && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-3 w-3 text-muted-foreground" />
                      <span className="text-muted-foreground">From:</span>
                      <span className="font-medium">{result.result.pol}</span>
                    </div>
                  )}
                  
                  {result.result?.port && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-3 w-3 text-muted-foreground" />
                      <span className="text-muted-foreground">To:</span>
                      <span className="font-medium">{result.result.port}</span>
                    </div>
                  )}
                  
                  {result.result?.on_board && (
                    <div className="flex items-center gap-2">
                      <Calendar className="h-3 w-3 text-muted-foreground" />
                      <span className="text-muted-foreground">On Board:</span>
                      <span className="font-medium">{result.result.on_board}</span>
                    </div>
                  )}
                  
                  {result.result?.eta && (
                    <div className="flex items-center gap-2">
                      <Calendar className="h-3 w-3 text-muted-foreground" />
                      <span className="text-muted-foreground">ETA:</span>
                      <span className="font-medium">{result.result.eta}</span>
                    </div>
                  )}
                  
                  {result.result?.shipper && (
                    <div className="flex items-center gap-2 sm:col-span-2">
                      <span className="text-muted-foreground">Shipper:</span>
                      <span className="font-medium">{result.result.shipper}</span>
                    </div>
                  )}
                </div>
                
                {result.source && (
                  <div className="text-xs text-muted-foreground pt-1 border-t">
                    Source: {result.source}
                    {result.last_updated && (
                      <span className="ml-2">
                        | Updated: {new Date(result.last_updated).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="flex justify-end gap-2 mt-4 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ResultSelectionModal;