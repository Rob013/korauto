import React from 'react';
import { formatMileage, formatMileageNumber } from '@/utils/mileageFormatter';

/**
 * Demo component to showcase mileage formatting
 * This addresses the issue described in the problem statement:
 * "2016 Ford Mondeo Grand Chic 16/16 type • 100798 • diesel   Do it instead like this 100,798km"
 */
const MileageFormattingDemo: React.FC = () => {
  const exampleMileage = 100798;
  const problemCases = [
    { label: "Raw number", value: 100798 },
    { label: "String number", value: "100798" },
    { label: "Already formatted", value: "100,798" },
    { label: "Zero value", value: 0 },
    { label: "Large number", value: 1234567 },
    { label: "Null value", value: null },
    { label: "Undefined value", value: undefined },
  ];

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-2xl font-bold">Mileage Formatting Demo</h2>
      
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Problem Statement Example</h3>
        <div className="p-4 border rounded-lg bg-muted/50">
          <p className="text-sm text-muted-foreground mb-2">Before (problematic):</p>
          <p className="font-mono">2016 Ford Mondeo Grand Chic • 16/16 type • {exampleMileage} • diesel</p>
          
          <p className="text-sm text-muted-foreground mb-2 mt-4">After (fixed):</p>
          <p className="font-mono">2016 Ford Mondeo Grand Chic • 16/16 type • {formatMileage(exampleMileage)} • diesel</p>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Formatter Test Cases</h3>
        <div className="grid gap-4">
          {problemCases.map((testCase, index) => (
            <div key={index} className="p-3 border rounded-lg">
              <div className="flex justify-between items-center">
                <span className="font-medium">{testCase.label}:</span>
                <span className="text-muted-foreground">
                  {typeof testCase.value} - {JSON.stringify(testCase.value)}
                </span>
              </div>
              <div className="mt-2 space-y-1">
                <div>
                  <span className="text-sm text-muted-foreground">formatMileage(): </span>
                  <span className="font-mono bg-muted px-2 py-1 rounded">
                    {formatMileage(testCase.value as any) || 'undefined'}
                  </span>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">formatMileageNumber(): </span>
                  <span className="font-mono bg-muted px-2 py-1 rounded">
                    {formatMileageNumber(testCase.value as any) || 'undefined'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MileageFormattingDemo;