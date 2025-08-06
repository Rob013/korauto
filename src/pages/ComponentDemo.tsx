import EngineSystemDemo from "@/components/EngineSystemDemo";

const ComponentDemo = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-bold text-foreground">
            Demo: Expandable Engine & Mechanical System Section
          </h1>
          <p className="text-muted-foreground">
            This demonstrates the new collapsible "Motori dhe Sistemi Mekanik" section that is:
          </p>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Automatically hidden by default</li>
            <li>• Expandable with a toggle button</li>
            <li>• Mobile-friendly and compact</li>
            <li>• Shows visual indicators when collapsed</li>
          </ul>
        </div>

        <div className="space-y-6">
          <h2 className="text-xl font-semibold text-foreground">Desktop View:</h2>
          <EngineSystemDemo />
          
          <h2 className="text-xl font-semibold text-foreground mt-8">Mobile View (Responsive):</h2>
          <div className="max-w-sm mx-auto">
            <EngineSystemDemo />
          </div>
        </div>

        <div className="mt-8 p-4 bg-muted/50 rounded-lg">
          <h3 className="font-semibold text-foreground mb-2">Features Implemented:</h3>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>✅ Section is collapsed by default (automatically hidden)</li>
            <li>✅ Click the header to expand/collapse the section</li>
            <li>✅ Visual indicators (colored dots) show component status when collapsed</li>
            <li>✅ Responsive design - adapts to mobile and desktop screens</li>
            <li>✅ Smooth animations for expand/collapse</li>
            <li>✅ Compact spacing and mobile-optimized layout</li>
            <li>✅ Icon rotates to indicate expanded/collapsed state</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ComponentDemo;