import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import CarInspectionDiagram from "@/components/CarInspectionDiagram";

const DiagramDemo = () => {
  // Mock inspection data to demonstrate the diagram
  const mockInspectionData = [
    {
      type: { code: 'front_bumper', title: '앞범퍼' },
      statusTypes: [{ code: 'A', title: '수리' }],
      attributes: []
    },
    {
      type: { code: 'hood', title: '후드' },
      statusTypes: [{ code: 'W', title: '용접' }],
      attributes: []
    },
    {
      type: { code: 'front_left_door', title: '좌앞도어' },
      statusTypes: [],
      attributes: []
    },
    {
      type: { code: 'front_right_door', title: '우앞도어' },
      statusTypes: [{ code: 'C', title: '판금' }],
      attributes: []
    },
    {
      type: { code: 'rear_left_door', title: '좌뒤도어' },
      statusTypes: [{ code: 'X', title: '교환' }],
      attributes: []
    },
    {
      type: { code: 'rear_bumper', title: '뒤범퍼' },
      statusTypes: [{ code: 'A', title: '수리' }],
      attributes: []
    },
    {
      type: { code: 'roof', title: '지붕' },
      statusTypes: [],
      attributes: []
    },
    {
      type: { code: 'front_left_wheel', title: '좌앞바퀴' },
      statusTypes: [],
      attributes: []
    },
    {
      type: { code: 'front_right_wheel', title: '우앞바퀴' },
      statusTypes: [],
      attributes: []
    },
    {
      type: { code: 'rear_left_wheel', title: '좌뒤바퀴' },
      statusTypes: [],
      attributes: []
    },
    {
      type: { code: 'rear_right_wheel', title: '우뒤바퀴' },
      statusTypes: [],
      attributes: []
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      <div className="container mx-auto py-8 px-4 max-w-7xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-4">
            Demo: Diagrami i Përmirësuar i Inspektimit të Makinës
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Ky është demonstrim i diagramit të ri interaktiv që tregon gjendjen e pjesëve të makinës
            në mënyrë vizuale dhe të qartë.
          </p>
        </div>

        <div className="grid gap-8">
          {/* Original vs New Comparison */}
          <Card className="border-2 border-blue-200">
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold mb-4 text-center">
                Diagrami i Ri Interaktiv
              </h2>
              <p className="text-sm text-muted-foreground mb-6 text-center">
                Kliko mbi pjesët e makinës për të parë detajet. Ngjyrat tregojnë gjendjen e secilit pjesë.
              </p>
              
              {/* New improved diagram */}
              <CarInspectionDiagram 
                inspectionData={mockInspectionData}
                className="border-2 border-blue-100"
              />
            </CardContent>
          </Card>

          {/* Empty state demo */}
          <Card className="border-2 border-gray-200">
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold mb-4 text-center">
                Pamja kur nuk ka të dhëna inspektimi
              </h2>
              <p className="text-sm text-muted-foreground mb-6 text-center">
                Kështu do të duket diagrami kur nuk ka të dhëna inspektimi disponibla.
              </p>
              
              {/* Empty state diagram */}
              <CarInspectionDiagram 
                inspectionData={[]}
                className="border-2 border-gray-100"
              />
            </CardContent>
          </Card>

          {/* Instructions */}
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4">Udhëzime për përdorim:</h3>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="text-blue-600">•</span>
                  <span><strong>Kliko</strong> mbi pjesët e makinës për të parë detaje të plota</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600">•</span>
                  <span><strong>Hoveri</strong> mbi pjesët për të parë emrin dhe gjendjen shpejt</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600">•</span>
                  <span><strong>Ngjyrat</strong> tregojnë gjendjen: E gjelbër (mirë), E verdhë (riparime të vogla), Portokalli (riparime të mëdha), E kuqe (kritike)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600">•</span>
                  <span><strong>Statistikat</strong> në anën e majtë japin përmbledhje të përgjithshme</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default DiagramDemo;