import React from 'react';
import MockCarCards from '@/components/MockCarCards';
import CarInspectionDiagram from '@/components/CarInspectionDiagram';
import { Card, CardContent } from '@/components/ui/card';

// Mock inspection data to demonstrate the improved diagram
const mockInspectionData = [
  {
    type: { code: 'P001', title: 'Front Bumper' },
    statusTypes: [{ code: 'X', title: 'Exchanged' }],
    attributes: ['replaced', 'new_part']
  },
  {
    type: { code: 'P002', title: 'Hood' },
    statusTypes: [{ code: 'W', title: 'Welded' }],
    attributes: ['welding', 'repair']
  },
  {
    type: { code: 'P011', title: 'Left Front Door' },
    statusTypes: [{ code: 'A', title: 'Repaired' }],
    attributes: ['sheet_metal', 'paint']
  },
  {
    type: { code: 'P012', title: 'Right Front Door' },
    statusTypes: [{ code: 'N', title: 'Normal' }],
    attributes: ['good_condition']
  },
  {
    type: { code: 'P021', title: 'Left Front Fender' },
    statusTypes: [{ code: 'X', title: 'Replaced' }],
    attributes: ['exchange', 'aftermarket']
  },
  {
    type: { code: 'P031', title: 'Roof' },
    statusTypes: [{ code: 'N', title: 'Normal' }],
    attributes: ['original']
  },
  {
    type: { code: 'P041', title: 'A-Pillar' },
    statusTypes: [{ code: 'W', title: 'Welding Work' }],
    attributes: ['structural_repair']
  },
  {
    type: { code: 'P005', title: 'Rear Bumper' },
    statusTypes: [{ code: 'C', title: 'Sheet Metal Work' }],
    attributes: ['dent_repair', 'refinished']
  }
];

const ComponentDemo: React.FC = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6 space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-2">KORAUTO Component Improvements Demo</h1>
          <p className="text-muted-foreground">Demonstrating the improved car card layout and professional inspection diagram</p>
        </div>

        {/* Improved Car Cards Section */}
        <Card>
          <CardContent className="p-6">
            <h2 className="text-2xl font-bold mb-4">✅ Improved Car Cards - More Compact & Clean</h2>
            <ul className="text-sm text-muted-foreground mb-6 space-y-1">
              <li>• Reduced height from 52 to 40 for more compact display</li>
              <li>• Simplified grid layout for vehicle info (2 columns instead of stacked)</li>
              <li>• Combined price and favorite button in single row</li>
              <li>• Smaller text and icon sizes for better space utilization</li>
              <li>• Removed redundant sections and duplicate information</li>
            </ul>
            <MockCarCards />
          </CardContent>
        </Card>

        {/* Professional Inspection Diagram Section */}
        <Card>
          <CardContent className="p-6">
            <h2 className="text-2xl font-bold mb-4">✅ Professional Inspection Diagram with Red Hints</h2>
            <ul className="text-sm text-muted-foreground mb-6 space-y-1">
              <li>• Enhanced professional look with gradients and shadows</li>
              <li>• Red color coding for exchanged/replaced parts (highest priority)</li>
              <li>• Orange for welding/major repairs</li>
              <li>• Yellow for sheet metal work</li>
              <li>• Real data visualization with part labels</li>
              <li>• Professional legend and summary statistics</li>
              <li>• Better car diagram proportions and realistic representation</li>
            </ul>
            <CarInspectionDiagram 
              inspectionData={mockInspectionData}
              className="mt-4"
            />
          </CardContent>
        </Card>

        {/* Summary of Improvements */}
        <Card>
          <CardContent className="p-6">
            <h2 className="text-2xl font-bold mb-4">📋 Summary of Improvements</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold mb-3 text-green-600">Car Card Improvements</h3>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 mt-1">✓</span>
                    <span>Made layout more compact by reducing image height and padding</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 mt-1">✓</span>
                    <span>Simplified vehicle info display with 2-column grid layout</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 mt-1">✓</span>
                    <span>Combined price and favorite action in single compact row</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 mt-1">✓</span>
                    <span>Removed duplicate and redundant information sections</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 mt-1">✓</span>
                    <span>Optimized text sizes and icon spacing</span>
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-3 text-blue-600">Inspection Diagram Improvements</h3>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <span className="text-blue-500 mt-1">✓</span>
                    <span>Professional gradient backgrounds and drop shadows</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-500 mt-1">✓</span>
                    <span>Red hints for replaced/exchanged parts (critical priority)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-500 mt-1">✓</span>
                    <span>Enhanced color coding system for different damage types</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-500 mt-1">✓</span>
                    <span>Real data visualization with part labels and codes</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-500 mt-1">✓</span>
                    <span>Professional legend and statistics summary</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-500 mt-1">✓</span>
                    <span>Improved car diagram proportions and realistic look</span>
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ComponentDemo;