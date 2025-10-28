import React from 'react';
import { useScreenshotDetection } from '@/hooks/useScreenshotDetection';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

/**
 * Demo component to test screenshot mode functionality
 * This component shows how elements are hidden/shown during screenshot mode
 */
export const ScreenshotModeDemo: React.FC = () => {
  const { isScreenshotMode, isMobile, toggleScreenshotMode } = useScreenshotDetection();

  return (
    <div className={`p-6 space-y-4 ${isScreenshotMode ? 'screenshot-mode' : ''}`}>
      <h2 className="text-2xl font-bold">Screenshot Mode Demo</h2>
      
      {/* This will be hidden in screenshot mode */}
      <Card className={`p-4 screenshot-hide ${isScreenshotMode ? 'screenshot-hide' : ''}`}>
        <CardContent>
          <h3 className="text-lg font-semibold mb-2">Hidden Content</h3>
          <p>This content will be hidden when taking a screenshot on mobile.</p>
          <p>Mobile device: {isMobile ? 'Yes' : 'No'}</p>
          <p>Screenshot mode: {isScreenshotMode ? 'Active' : 'Inactive'}</p>
        </CardContent>
      </Card>

      {/* This will be visible in screenshot mode */}
      <Card className={`p-4 technical-specs-container ${isScreenshotMode ? 'screenshot-show' : ''}`}>
        <CardContent>
          <h3 className="text-lg font-semibold mb-2">Main Image & Technical Specs</h3>
          <p>This content will remain visible when taking a screenshot.</p>
          <div className="mt-4 p-4 bg-gray-100 rounded">
            <h4 className="font-semibold">Technical Specifications:</h4>
            <ul className="mt-2 space-y-1">
              <li>• Brand: Example Brand</li>
              <li>• Model: Example Model</li>
              <li>• Year: 2023</li>
              <li>• Mileage: 50,000 km</li>
              <li>• Fuel Type: Gasoline</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Control buttons */}
      <div className="flex gap-2">
        <Button onClick={toggleScreenshotMode} variant="outline">
          {isScreenshotMode ? 'Exit Screenshot Mode' : 'Enter Screenshot Mode'}
        </Button>
        <Button onClick={() => window.location.reload()} variant="outline">
          Reload Page
        </Button>
      </div>

      {/* Additional content that will be hidden */}
      <Card className={`p-4 screenshot-hide ${isScreenshotMode ? 'screenshot-hide' : ''}`}>
        <CardContent>
          <h3 className="text-lg font-semibold mb-2">More Hidden Content</h3>
          <p>This is additional content that will be hidden during screenshots.</p>
          <p>It includes navigation buttons, contact information, and other UI elements.</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default ScreenshotModeDemo;