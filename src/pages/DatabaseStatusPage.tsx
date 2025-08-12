import { useEffect } from "react";
import { trackPageView } from "@/utils/analytics";
import Header from "@/components/Header";
import DatabaseStatus from "@/components/DatabaseStatus";

const DatabaseStatusPage = () => {
  useEffect(() => {
    trackPageView(undefined, { 
      page_type: 'admin_database_status'
    });
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto py-8 px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Database Status & Verification
          </h1>
          <p className="text-muted-foreground">
            Monitor car database status, sync progress, and verify that all 190,000+ cars are properly loaded.
          </p>
        </div>
        
        <DatabaseStatus />
      </div>
    </div>
  );
};

export default DatabaseStatusPage;