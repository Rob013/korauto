import React from 'react';
import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface ConditionItem {
  part: string;
  condition: string;
  isPositive: boolean;
}

interface ConditionGroup {
  group: string;
  items: ConditionItem[];
}

interface InspectionConditionTableProps {
  innerInspectionData?: Record<string, any>;
  className?: string;
}

const groupInspectionData = (data: Record<string, any>): ConditionGroup[] => {
  if (!data || Object.keys(data).length === 0) {
    return [];
  }

  const groups: Record<string, ConditionItem[]> = {
    motor: [],
    Transmission: [],
    Direction: [],
    inhibition: [],
    Electricity: [],
    Other: []
  };

  // Map inspection data to groups
  Object.entries(data).forEach(([key, value]) => {
    const normalizedKey = key.toLowerCase();
    const valueStr = String(value || '').toLowerCase();
    
    const isPositive = 
      valueStr.includes('okay') || 
      valueStr.includes('good') || 
      valueStr.includes('proper') ||
      valueStr.includes('no leak') ||
      valueStr === 'ok' ||
      valueStr === 'normal';

    const condition = isPositive ? 
      (valueStr.includes('leak') ? 'There is no leak.' : 'Okay.') :
      String(value);

    const item: ConditionItem = {
      part: key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
      condition,
      isPositive
    };

    // Categorize by key
    if (normalizedKey.includes('engine') || normalizedKey.includes('oil') || normalizedKey.includes('coolant') || normalizedKey.includes('cylinder')) {
      groups.motor.push(item);
    } else if (normalizedKey.includes('transmission') || normalizedKey.includes('gear')) {
      groups.Transmission.push(item);
    } else if (normalizedKey.includes('steering') || normalizedKey.includes('direction') || normalizedKey.includes('tie rod')) {
      groups.Direction.push(item);
    } else if (normalizedKey.includes('brake') || normalizedKey.includes('inhibit')) {
      groups.inhibition.push(item);
    } else if (normalizedKey.includes('electric') || normalizedKey.includes('alternator') || normalizedKey.includes('starter') || normalizedKey.includes('wiper') || normalizedKey.includes('fan')) {
      groups.Electricity.push(item);
    } else {
      groups.Other.push(item);
    }
  });

  // Convert to array and filter out empty groups
  return Object.entries(groups)
    .filter(([_, items]) => items.length > 0)
    .map(([group, items]) => ({ group, items }));
};

export const InspectionConditionTable: React.FC<InspectionConditionTableProps> = ({
  innerInspectionData,
  className = ""
}) => {
  const groups = groupInspectionData(innerInspectionData || {});

  if (groups.length === 0) {
    return (
      <Card className={className}>
        <div className="p-8 text-center text-muted-foreground">
          No internal inspection data available
        </div>
      </Card>
    );
  }

    return (
      <Card className={className}>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-32 bg-muted/50 text-left text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Group
              </TableHead>
              <TableHead className="bg-muted/50 text-left text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Part
              </TableHead>
              <TableHead className="w-48 bg-muted/50 text-left text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Condition
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {groups.map((group, groupIdx) => (
              <React.Fragment key={groupIdx}>
                {group.items.map((item, itemIdx) => (
                  <TableRow key={`${groupIdx}-${itemIdx}`}>
                    {itemIdx === 0 && (
                      <TableCell
                        rowSpan={group.items.length}
                        className="align-top bg-muted/20 text-left text-sm font-medium"
                      >
                        {group.group}
                      </TableCell>
                    )}
                    <TableCell className="py-2 text-left text-sm">
                      {item.part}
                    </TableCell>
                    <TableCell
                      className={`py-2 text-left font-medium ${
                        item.isPositive ? "text-green-600" : "text-orange-600"
                      }`}
                    >
                      {item.condition}
                    </TableCell>
                  </TableRow>
                ))}
              </React.Fragment>
            ))}
          </TableBody>
        </Table>
      </Card>
    );
};
