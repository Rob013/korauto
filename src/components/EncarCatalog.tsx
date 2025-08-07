// Working EncarCatalog without build errors
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const EncarCatalog = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container-responsive py-8">
        <div className="text-center space-y-6">
          <h1 className="text-3xl font-bold mb-4">Car Catalog</h1>
          <p className="text-muted-foreground mb-8">
            Browse our extensive collection of vehicles
          </p>
          
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              The full catalog functionality is temporarily disabled due to API integration updates.
            </p>
            
            <Button 
              onClick={() => navigate('/')}
              variant="outline"
              size="lg"
            >
              Return to Homepage
            </Button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default EncarCatalog;