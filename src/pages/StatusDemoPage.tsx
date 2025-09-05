import React from 'react';
import Header from '@/components/Header';
import StatusShowcase from '@/components/StatusShowcase';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const StatusDemoPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Button
            variant="outline"
            onClick={() => navigate('/catalog')}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Catalog
          </Button>
          
          <h1 className="text-3xl font-bold">Car Status System Demo</h1>
          <p className="text-muted-foreground mt-2">
            Enhanced car status display system with proper color coding and 24-hour auto-cleanup for sold cars.
          </p>
        </div>

        <StatusShowcase />
      </div>
    </div>
  );
};

export default StatusDemoPage;