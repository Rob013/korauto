import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import LotNumberDemo from "@/components/LotNumberDemo";

const LotNumberDemoPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button variant="outline" onClick={() => navigate('/')} className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Lot Number Enhancement Demo</h1>
            <p className="text-muted-foreground">
              Demonstration of enhanced lot number display for admin dashboard inspection requests
            </p>
          </div>
        </div>

        <LotNumberDemo />
      </div>
    </div>
  );
};

export default LotNumberDemoPage;