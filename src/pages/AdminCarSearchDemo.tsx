import AdminCarSearch from "@/components/AdminCarSearch";
import Header from "@/components/Header";

const AdminCarSearchDemo = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container max-w-4xl mx-auto p-6">
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Admin Car Search Demo</h1>
            <p className="text-muted-foreground mt-2">
              This is a demonstration of the admin car search functionality that has been added to the admin dashboard.
            </p>
          </div>
          
          <div className="grid gap-6">
            <AdminCarSearch />
            
            <div className="bg-muted/50 rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Features</h2>
              <ul className="space-y-2 text-sm">
                <li>• Search by Car ID, Lot Number, or VIN</li>
                <li>• Real-time search with debouncing (500ms delay)</li>
                <li>• Search both cached cars in database and live API data</li>
                <li>• Visual results with car images, prices, and specifications</li>
                <li>• Click to open car details in new tab</li>
                <li>• Responsive design for mobile and desktop</li>
              </ul>
            </div>
            
            <div className="bg-blue-50 dark:bg-blue-950/30 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-2">How to Test</h3>
              <p className="text-sm text-muted-foreground mb-3">
                Try searching for these example terms:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm">
                <div className="bg-background rounded p-2">
                  <strong>Car IDs:</strong> 123456, 789012
                </div>
                <div className="bg-background rounded p-2">
                  <strong>Lot Numbers:</strong> A1234, B5678
                </div>
                <div className="bg-background rounded p-2">
                  <strong>VINs:</strong> WVWZZZ, KMHCT
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminCarSearchDemo;