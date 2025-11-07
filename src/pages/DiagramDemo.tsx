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
      <div className="container-responsive py-4 max-w-6xl mx-auto">
        <div className="text-center mb-4">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Diagrami i Inspektimit të Automjetit
          </h1>
          <p className="text-muted-foreground text-sm md:text-base max-w-2xl mx-auto">
            Diagram interaktiv që tregon gjendjen e pjesëve të automjetit me ngjyra specifike:
            <br />
            <span className="font-semibold text-red-600">E kuqe</span> për pjesë të zëvendësuara dhe 
            <span className="font-semibold text-orange-600"> portokalli</span> për pjesë të ripariara.
          </p>
        </div>

        <div className="grid gap-4">
          {/* Original vs New Comparison */}
          <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30">
            <CardContent className="p-4">
              <h2 className="text-xl font-semibold mb-3 text-center text-blue-800 dark:text-blue-300">
                Diagrami Interaktiv i Inspektimit
              </h2>
              <p className="text-xs md:text-sm text-muted-foreground mb-4 text-center">
                Kliko mbi pjesët e automjetit për të parë detajet. Ngjyrat tregojnë gjendjen e secilit pjesë.
                <br />
                <span className="font-semibold text-red-600">E kuqe = E zëvendësuar</span> | 
                <span className="font-semibold text-orange-600"> Portokalli = E riparuar</span>
              </p>
              
              {/* New improved diagram */}
              <CarInspectionDiagram 
                inspectionData={mockInspectionData}
                className="border-2 border-blue-100"
              />
            </CardContent>
          </Card>

          {/* Empty state demo */}
          <Card className="border-2 border-gray-200 bg-gradient-to-br from-gray-50 to-slate-50 dark:from-gray-900 dark:to-slate-900">
            <CardContent className="p-4">
              <h2 className="text-lg font-semibold mb-3 text-center">
                Pamja pa të dhëna inspektimi
              </h2>
              <p className="text-xs md:text-sm text-muted-foreground mb-4 text-center">
                Kështu shfaqet diagrami kur nuk ka të dhëna inspektimi disponibla.
              </p>
              
              {/* Empty state diagram */}
              <CarInspectionDiagram 
                inspectionData={[]}
                className="border-2 border-gray-100"
              />
            </CardContent>
          </Card>

          {/* Instructions */}
          <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 dark:from-blue-950/30 dark:to-indigo-950/30">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4 text-blue-800 dark:text-blue-300">Udhëzime për përdorim:</h3>
              <ul className="space-y-3 text-sm text-gray-700 dark:text-gray-300">
                <li className="flex items-start gap-3">
                  <span className="text-blue-600 text-lg">🖱️</span>
                  <span><strong>Kliko</strong> mbi pjesët e automjetit për të parë detaje të plota për çdo pjesë</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-blue-600 text-lg">👆</span>
                  <span><strong>Kalo</strong> me kursorin mbi pjesët për të parë emrin dhe gjendjen shpejt</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-blue-600 text-lg">🎨</span>
                  <span><strong>Ngjyrat</strong> tregojnë gjendjen: 
                    <span className="text-green-600 font-semibold"> E gjelbër</span> (në gjendje të mirë), 
                    <span className="text-orange-600 font-semibold"> Portokalli</span> (e riparuar), 
                    <span className="text-red-600 font-semibold"> E kuqe</span> (e zëvendësuar)
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-blue-600 text-lg">📊</span>
                  <span><strong>Përmbledhja</strong> në anën e majtë jep statistika të përgjithshme të gjendjes</span>
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