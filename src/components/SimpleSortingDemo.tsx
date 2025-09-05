/**
 * Simple Sorting Demo Component
 * Simplified version without complex dependencies
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const SimpleSortingDemo: React.FC = () => {
  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span>🔄</span>
          Simple Sorting Demo
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <h3 className="font-semibold">Sort Options</h3>
            <div className="space-y-1">
              <Button variant="outline" size="sm" className="w-full justify-start">
                Price: Low to High
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start">
                Price: High to Low
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start">
                Year: Newest First
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start">
                Year: Oldest First
              </Button>
            </div>
          </div>
          
          <div className="space-y-2">
            <h3 className="font-semibold">Status</h3>
            <div className="space-y-1">
              <Badge variant="secondary">Ready</Badge>
              <div className="text-sm text-muted-foreground">
                Sorting functionality simplified
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SimpleSortingDemo;