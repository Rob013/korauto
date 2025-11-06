import React, { useState } from 'react';
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle, CheckCircle, Info } from "lucide-react";
import carDiagramTop from '@/assets/car-diagram-top.jpeg';
import carDiagramBottom from '@/assets/car-diagram-bottom.webp';
import { mapInspectionTypeToPartId } from '@/utils/inspectionMapping';

export interface InspectionItem {
  type: { code: string; title: string };
  statusTypes: Array<{ code: string; title: string }>;
  attributes: string[];
  mappedPartId?: string | null;
}

interface CarInspectionDiagramProps {
  inspectionData?: InspectionItem[];
  className?: string;
}

interface CarPart {
  id: string;
  name: string;
  nameEn: string;
  path: string;
  labelPos: { x: number; y: number };
  markerPos?: { x: number; y: number };
}

export const CarInspectionDiagram: React.FC<CarInspectionDiagramProps> = ({ 
  inspectionData = [], 
  className = "" 
}) => {
  const [hoveredPart, setHoveredPart] = useState<string | null>(null);
  const [selectedPart, setSelectedPart] = useState<string | null>(null);

  // Enhanced car parts mapped to the actual diagram image positions
  const carParts: CarPart[] = [
    // Hood (top center of car)
    {
      id: 'hood',
      name: 'Kapak',
      nameEn: 'Hood',
      path: 'M 240 60 L 400 60 Q 410 60 410 70 L 410 180 Q 410 190 400 190 L 240 190 Q 230 190 230 180 L 230 70 Q 230 60 240 60 Z',
      labelPos: { x: 320, y: 120 },
      markerPos: { x: 320, y: 125 }
    },
    // Front Bumper
    {
      id: 'front_bumper',
      name: 'Bamper Para',
      nameEn: 'F. Bumper',
      path: 'M 220 20 L 420 20 Q 435 20 435 35 L 435 55 Q 435 60 420 60 L 220 60 Q 205 60 205 55 L 205 35 Q 205 20 220 20 Z',
      labelPos: { x: 320, y: 40 },
      markerPos: { x: 320, y: 40 }
    },
    // Windshield
    {
      id: 'windshield',
      name: 'Xham Para',
      nameEn: 'Windshield',
      path: 'M 250 195 L 390 195 Q 400 195 400 205 L 400 235 L 250 235 Q 240 235 240 225 L 240 205 Q 240 195 250 195 Z',
      labelPos: { x: 320, y: 215 },
      markerPos: { x: 320, y: 215 }
    },
    // Left Front Door
    {
      id: 'front_left_door',
      name: 'Derë Para Majtas',
      nameEn: 'L Front',
      path: 'M 150 195 L 235 195 L 235 310 L 150 310 Q 140 310 140 300 L 140 205 Q 140 195 150 195 Z',
      labelPos: { x: 185, y: 250 },
      markerPos: { x: 170, y: 250 }
    },
    // Right Front Door
    {
      id: 'front_right_door',
      name: 'Derë Para Djathtas',
      nameEn: 'R Front',
      path: 'M 405 195 L 495 195 Q 505 195 505 205 L 505 300 Q 505 310 495 310 L 405 310 L 405 195 Z',
      labelPos: { x: 450, y: 250 },
      markerPos: { x: 470, y: 250 }
    },
    // Roof
    {
      id: 'roof',
      name: 'Çati',
      nameEn: 'Roof',
      path: 'M 245 240 L 395 240 L 395 370 L 245 370 L 245 240 Z',
      labelPos: { x: 320, y: 305 },
      markerPos: { x: 320, y: 305 }
    },
    // Left Rear Door
    {
      id: 'rear_left_door',
      name: 'Derë Prapa Majtas',
      nameEn: 'L Rear',
      path: 'M 140 315 L 235 315 L 235 430 L 140 430 Q 130 430 130 420 L 130 325 Q 130 315 140 315 Z',
      labelPos: { x: 185, y: 370 },
      markerPos: { x: 170, y: 370 }
    },
    // Right Rear Door
    {
      id: 'rear_right_door',
      name: 'Derë Prapa Djathtas',
      nameEn: 'R Rear',
      path: 'M 405 315 L 510 315 Q 520 315 520 325 L 520 420 Q 520 430 510 430 L 405 430 L 405 315 Z',
      labelPos: { x: 455, y: 370 },
      markerPos: { x: 470, y: 370 }
    },
    // Rear Glass
    {
      id: 'rear_glass',
      name: 'Xham Prapa',
      nameEn: 'R. Glass',
      path: 'M 245 375 L 395 375 L 395 415 Q 395 425 385 425 L 255 425 Q 245 425 245 415 L 245 375 Z',
      labelPos: { x: 320, y: 400 },
      markerPos: { x: 320, y: 400 }
    },
    // Trunk
    {
      id: 'trunk',
      name: 'Bagazh',
      nameEn: 'Trunk',
      path: 'M 240 430 L 400 430 Q 410 430 410 440 L 410 540 Q 410 550 400 550 L 240 550 Q 230 550 230 540 L 230 440 Q 230 430 240 430 Z',
      labelPos: { x: 320, y: 485 },
      markerPos: { x: 320, y: 490 }
    },
    // Rear Bumper
    {
      id: 'rear_bumper',
      name: 'Bamper Prapa',
      nameEn: 'R. Bumper',
      path: 'M 220 555 L 420 555 Q 435 555 435 570 L 435 590 Q 435 605 420 605 L 220 605 Q 205 605 205 590 L 205 570 Q 205 555 220 555 Z',
      labelPos: { x: 320, y: 580 },
      markerPos: { x: 320, y: 580 }
    },
      // Side Sill Panels (approximate positions under doors)
      {
        id: 'side_sill_left',
        name: 'Panel Anësor (Majtas)',
        nameEn: 'Side Sill L',
        path: 'M 135 310 L 235 310 L 235 330 L 135 330 Z',
        labelPos: { x: 185, y: 320 },
        markerPos: { x: 165, y: 323 }
      },
      {
        id: 'side_sill_right',
        name: 'Panel Anësor (Djathtas)',
        nameEn: 'Side Sill R',
        path: 'M 405 310 L 505 310 L 505 330 L 405 330 Z',
        labelPos: { x: 455, y: 320 },
        markerPos: { x: 475, y: 323 }
      },
    // Left Front Fender
    {
      id: 'left_fender',
      name: 'Paranicë Majtas',
      nameEn: 'L Fender',
      path: 'M 140 70 L 225 70 L 225 185 L 140 185 Q 130 185 130 175 L 130 80 Q 130 70 140 70 Z',
      labelPos: { x: 175, y: 125 },
      markerPos: { x: 165, y: 135 }
    },
    // Right Front Fender
    {
      id: 'right_fender',
      name: 'Paranicë Djathtas',
      nameEn: 'R Fender',
      path: 'M 415 70 L 510 70 Q 520 70 520 80 L 520 175 Q 520 185 510 185 L 415 185 L 415 70 Z',
      labelPos: { x: 465, y: 125 },
      markerPos: { x: 475, y: 135 }
    },
    // Left Quarter Panel
    {
      id: 'left_quarter',
      name: 'Panel Prapa Majtas',
      nameEn: 'L Quarter',
      path: 'M 130 435 L 225 435 L 225 545 L 130 545 Q 120 545 120 535 L 120 445 Q 120 435 130 435 Z',
      labelPos: { x: 170, y: 490 },
      markerPos: { x: 165, y: 485 }
    },
    // Right Quarter Panel
    {
      id: 'right_quarter',
      name: 'Panel Prapa Djathtas',
      nameEn: 'R Quarter',
      path: 'M 415 435 L 520 435 Q 530 435 530 445 L 530 535 Q 530 545 520 545 L 415 545 L 415 435 Z',
      labelPos: { x: 470, y: 490 },
      markerPos: { x: 475, y: 485 }
    },
    // Front Left Wheel
    {
      id: 'fl_wheel',
      name: 'Rrota Para Majtas',
      nameEn: 'FL Wheel',
      path: 'M 30 90 m -25, 0 a 25,25 0 1,0 50,0 a 25,25 0 1,0 -50,0',
      labelPos: { x: 30, y: 90 },
      markerPos: { x: 30, y: 90 }
    },
    // Front Right Wheel
    {
      id: 'fr_wheel',
      name: 'Rrota Para Djathtas',
      nameEn: 'FR Wheel',
      path: 'M 610 90 m -25, 0 a 25,25 0 1,0 50,0 a 25,25 0 1,0 -50,0',
      labelPos: { x: 610, y: 90 },
      markerPos: { x: 610, y: 90 }
    },
    // Rear Left Wheel
    {
      id: 'rl_wheel',
      name: 'Rrota Prapa Majtas',
      nameEn: 'RL Wheel',
      path: 'M 30 510 m -25, 0 a 25,25 0 1,0 50,0 a 25,25 0 1,0 -50,0',
      labelPos: { x: 30, y: 510 },
      markerPos: { x: 30, y: 510 }
    },
    // Rear Right Wheel
    {
      id: 'rr_wheel',
      name: 'Rrota Prapa Djathtas',
      nameEn: 'RR Wheel',
      path: 'M 610 510 m -25, 0 a 25,25 0 1,0 50,0 a 25,25 0 1,0 -50,0',
      labelPos: { x: 610, y: 510 },
      markerPos: { x: 610, y: 510 }
    },
  ];

  // Helper: evaluate if an item's title targets a given part id
  const legacyTitleMatchesPart = (title: string, partId: string) => {
    const t = title.toLowerCase().replace(/[_-]/g, ' ').replace(/\s+/g, ' ').trim();

    const patterns: Array<{ re: RegExp; id: string }> = [
      { re: /(front\s*)?door.*(left|\blh\b)/i, id: 'front_left_door' },
      { re: /(front\s*)?door.*(right|\brh\b)/i, id: 'front_right_door' },
      { re: /rear\s*door.*(left|\blh\b)/i, id: 'rear_left_door' },
      { re: /rear\s*door.*(right|\brh\b)/i, id: 'rear_right_door' },
      { re: /(quarter\s*panel|quarter).*\b(left|lh)\b/i, id: 'left_quarter' },
      { re: /(quarter\s*panel|quarter).*\b(right|rh)\b/i, id: 'right_quarter' },
      { re: /(rear).*(wheel\s*house|wheelhouse|wheel\s*arch).*\b(left|lh)\b/i, id: 'left_quarter' },
      { re: /(rear).*(wheel\s*house|wheelhouse|wheel\s*arch).*\b(right|rh)\b/i, id: 'right_quarter' },
      { re: /(side\s*sill|sill|rocker).*\b(left|lh)\b/i, id: 'side_sill_left' },
      { re: /(side\s*sill|sill|rocker).*\b(right|rh)\b/i, id: 'side_sill_right' },
      { re: /front\s*bumper/i, id: 'front_bumper' },
      { re: /rear\s*bumper/i, id: 'rear_bumper' },
      { re: /(trunk|decklid|tailgate|boot)/i, id: 'trunk' },
      { re: /(front\s*)?fender.*\b(left|lh)\b/i, id: 'left_fender' },
      { re: /(front\s*)?fender.*\b(right|rh)\b/i, id: 'right_fender' },
      { re: /(roof|top|ceiling)/i, id: 'roof' },
      { re: /(hood|bonnet)/i, id: 'hood' },
    ];

    const matched = patterns.find((m) => m.re.test(t));
    if (!matched) return false;
    return matched.id === partId;
  };

  const textMatchesPartId = (text: string | null | undefined, partId: string) => {
    if (!text) return false;
    const mapped = mapInspectionTypeToPartId({ title: text });
    if (mapped) {
      return mapped === partId;
    }
    return legacyTitleMatchesPart(text, partId);
  };

  const itemMatchesPart = (item: InspectionItem, partId: string) => {
    if (!item) return false;
    if (item.mappedPartId && item.mappedPartId === partId) return true;

    const mappedFromType = mapInspectionTypeToPartId(item.type);
    if (mappedFromType && mappedFromType === partId) return true;

    if (textMatchesPartId(item.type?.code, partId)) return true;
    if (textMatchesPartId(item.type?.title, partId)) return true;

    return item.attributes?.some((attr) => textMatchesPartId(attr, partId)) ?? false;
  };

  // Get part status from inspection data (aggregate across matching items)
  const getPartStatus = (partId: string) => {
    const statuses: Array<{ code: string; title: string }> = [];
    for (const item of inspectionData) {
      const matches = itemMatchesPart(item, partId);
      if (!matches) continue;

      const st = Array.isArray(item.statusTypes) ? item.statusTypes : [];
      if (st.length > 0) {
        statuses.push(...st);
      } else {
        // Derive from title if codes missing
        const typeText = (item?.type?.title || item?.type?.code || '').toString();
        const low = typeText.toLowerCase();
        if (low.includes('exchange') || low.includes('replacement') || low.includes('교환')) statuses.push({ code: 'X', title: 'Exchange (replacement)' });
        if (low.includes('weld') || low.includes('sheet metal') || low.includes('용접')) statuses.push({ code: 'W', title: 'Welding' });
        if (low.includes('repair') || low.includes('simple') || low.includes('수리')) statuses.push({ code: 'A', title: 'Repair' });
        if (low.includes('scratch') || low.includes('흠집')) statuses.push({ code: 'S', title: 'Scratch' });
        if (low.includes('corr') || low.includes('부식')) statuses.push({ code: 'U', title: 'Corrosion' });
      }

      // Derive from attributes too (if present)
      const attrsText = item.attributes.join(' ').toLowerCase();
      if (attrsText) {
        if (attrsText.includes('exchange') || attrsText.includes('replacement') || attrsText.includes('교환')) statuses.push({ code: 'X', title: 'Exchange (replacement)' });
        if (attrsText.includes('weld') || attrsText.includes('sheet metal') || attrsText.includes('용접')) statuses.push({ code: 'W', title: 'Welding' });
        if (attrsText.includes('repair') || attrsText.includes('simple') || attrsText.includes('수리')) statuses.push({ code: 'A', title: 'Repair' });
        if (attrsText.includes('scratch') || attrsText.includes('흠집')) statuses.push({ code: 'S', title: 'Scratch' });
        if (attrsText.includes('corr') || attrsText.includes('부식')) statuses.push({ code: 'U', title: 'Corrosion' });
      }
    }
    return statuses;
  };

const getStatusColor = (statuses: Array<{ code: string; title: string }>) => {
  if (statuses.length === 0) return 'hsl(142 76% 36%)'; // Green

  const normalizedCodes = statuses.map(s => String(s.code || '').toUpperCase().trim());
  const normalizedTitles = statuses.map(s => String(s.title || '').toLowerCase());

  // Check for replacement/exchange codes: X, 2
  const hasExchange = normalizedCodes.some(code => code === 'X' || code === '2') ||
    normalizedTitles.some(t => t.includes('exchange') || t.includes('replacement') || t.includes('교환') || t.includes('nderrim'));

  // Check for sheet metal/welding codes: W, 3
  const hasWelding = normalizedCodes.some(code => code === 'W' || code === '3') ||
    normalizedTitles.some(t => t.includes('weld') || t.includes('sheet metal') || t.includes('용접') || t.includes('saldim'));

  // Check for simple repair codes: A, 1
  const hasRepair = normalizedCodes.some(code => code === 'A' || code === '1') ||
    normalizedTitles.some(t => t.includes('repair') || t.includes('simple') || t.includes('수리') || t.includes('riparim'));

  // Red for replacement/exchange/welding (Nderrim - N badge)
  if (hasExchange || hasWelding) return '#dc2626';
  // Blue for simple repair (Riparim - R badge)
  if (hasRepair) return '#2563eb';

  return 'hsl(142 76% 36%)'; // Green for normal
};

const getStatusText = (statuses: Array<{ code: string; title: string }>) => {
  if (statuses.length === 0) return 'Pjesë normale';

  const hasExchange = statuses.some((s) => s.code === 'X');
  const hasWelding = statuses.some((s) => s.code === 'W');
  const hasRepair = statuses.some((s) => s.code === 'A');
  const hasCorrosion = statuses.some((s) => s.code === 'U');
  const hasScratch = statuses.some((s) => s.code === 'S');

  if (hasExchange || hasWelding) return 'Pjesë e zëvendësuar (N - i kuq)';
  if (hasRepair) return 'Pjesë e riparuar (R - blu)';

  return 'Pjesë normale';
};

  // Count all types of issues from API data
  const issueCount = {
    replacements: inspectionData.filter(item => {
      const t = (item?.type?.title || '').toString().toLowerCase();
      const codes = item.statusTypes?.map(s => String(s.code || '').toUpperCase()) || [];
      return (
        codes.includes('X') || codes.includes('2') ||
        t.includes('exchange') || t.includes('replacement') || t.includes('교환') || t.includes('nderrim')
      );
    }).length,
    welds: inspectionData.filter(item => {
      const t = (item?.type?.title || '').toString().toLowerCase();
      const codes = item.statusTypes?.map(s => String(s.code || '').toUpperCase()) || [];
      return (
        codes.includes('W') || codes.includes('3') ||
        t.includes('weld') || t.includes('sheet metal') || t.includes('용접') || t.includes('saldim')
      );
    }).length,
    repairs: inspectionData.filter(item => {
      const t = (item?.type?.title || '').toString().toLowerCase();
      const codes = item.statusTypes?.map(s => String(s.code || '').toUpperCase()) || [];
      return (
        codes.includes('A') || codes.includes('1') ||
        t.includes('repair') || t.includes('simple') || t.includes('수리') || t.includes('riparim')
      );
    }).length,
    corrosion: inspectionData.filter(item => {
      const t = (item?.type?.title || '').toString().toLowerCase();
      const codes = item.statusTypes?.map(s => String(s.code || '').toUpperCase()) || [];
      return (
        codes.includes('U') ||
        t.includes('corr') || t.includes('부식')
      );
    }).length,
    scratches: inspectionData.filter(item => {
      const t = (item?.type?.title || '').toString().toLowerCase();
      const codes = item.statusTypes?.map(s => String(s.code || '').toUpperCase()) || [];
      return (
        codes.includes('S') ||
        t.includes('scratch') || t.includes('흠집')
      );
    }).length,
  };

  return (
    <div className={`w-full ${className}`}>
      {/* Main Diagram Section - Split View */}
      <div className="w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 border border-border rounded-lg overflow-hidden bg-background">
          {/* Left Side - Front View (Brenda) */}
          <div className="border-r border-border">
            <div className="bg-muted/30 px-4 py-3 border-b border-border">
              <h3 className="font-semibold text-center text-foreground">Brenda</h3>
            </div>
            <div className="relative p-8 bg-muted/10 min-h-[400px] flex items-center justify-center">
              <img src={carDiagramTop} alt="Car Front View" className="w-full h-auto max-w-lg mx-auto" />
              
              {/* Overlay markers on front view */}
              {carParts.map((part) => {
                const statuses = getPartStatus(part.id);
                if (statuses.length === 0 || !part.markerPos) return null;
                
                const normalizedCodes = statuses.map(s => String(s.code || '').toUpperCase().trim());
                const normalizedTitles = statuses.map(s => String(s.title || '').toLowerCase());

                // N badge: replacement (code 2, X) or sheet metal/welding (code 3, W)
                const hasExchange = normalizedCodes.some(code => code === 'X' || code === '2') ||
                  normalizedTitles.some(t => t.includes('exchange') || t.includes('replacement') || t.includes('교환') || t.includes('nderrim'));
                
                const hasWelding = normalizedCodes.some(code => code === 'W' || code === '3') ||
                  normalizedTitles.some(t => t.includes('weld') || t.includes('sheet metal') || t.includes('용접') || t.includes('saldim'));

                // R badge: simple repair (code 1, A)
                const hasRepair = normalizedCodes.some(code => code === 'A' || code === '1') ||
                  normalizedTitles.some(t => t.includes('repair') || t.includes('simple') || t.includes('수리') || t.includes('riparim'));
                
                const markers: Array<{ char: string; color: string }> = [];
                // Red N badge for replacement or sheet metal
                if (hasExchange || hasWelding) markers.push({ char: 'N', color: '#dc2626' });
                // Blue R badge for simple repair
                if (hasRepair) markers.push({ char: 'R', color: '#2563eb' });
                
                if (markers.length === 0) return null;
                
                // Convert SVG coordinates to percentage
                const leftPercent = (part.markerPos.x / 640) * 100;
                const topPercent = (part.markerPos.y / 630) * 100;
                
                return markers.map((m, idx) => {
                  const offset = (idx - (markers.length - 1) / 2) * 2.5;
                  return (
                    <div
                      key={`front-${part.id}-${idx}`}
                      className="absolute flex items-center justify-center w-8 h-8 rounded-full text-white text-sm font-bold shadow-lg border-2 border-white transform -translate-x-1/2 -translate-y-1/2 z-10 cursor-pointer hover:scale-110 transition-transform"
                      style={{
                        left: `${leftPercent + offset}%`,
                        top: `${topPercent}%`,
                        backgroundColor: m.color,
                      }}
                      title={`${part.name} - ${getStatusText(statuses)}`}
                      onClick={() => setSelectedPart(part.id)}
                    >
                      {m.char}
                    </div>
                  );
                });
              })}
            </div>
          </div>

          {/* Right Side - Back View (Jashte) */}
          <div>
            <div className="bg-muted/30 px-4 py-3 border-b border-border">
              <h3 className="font-semibold text-center text-foreground">Jashte</h3>
            </div>
            <div className="relative p-8 bg-muted/10 min-h-[400px] flex items-center justify-center">
              <img src={carDiagramBottom} alt="Car Back View" className="w-full h-auto max-w-lg mx-auto" />
            </div>
          </div>
        </div>

        {/* Legend at Bottom */}
        <div className="flex items-center justify-center gap-6 py-4 border-t border-border bg-background">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-[#dc2626] text-white text-xs font-bold shadow-sm border-2 border-white">N</span>
            <span className="text-sm font-medium text-foreground">Nderrim</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-[#2563eb] text-white text-xs font-bold shadow-sm border-2 border-white">R</span>
            <span className="text-sm font-medium text-foreground">Riparim</span>
          </div>
        </div>
      </div>

      {/* Statistics and Details Section Below */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6 mt-6">
        {/* Left - Statistics */}
        <div className="space-y-3">
          <Card className="border border-border">
            <CardContent className="p-3 lg:p-4">
              <h4 className="font-semibold mb-3 text-foreground flex items-center gap-2 text-sm lg:text-base">
                <AlertTriangle className="h-4 w-4" />
                Statistika
              </h4>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between p-1.5 rounded-lg bg-destructive/10">
                  <span className="text-xs flex items-center gap-1">
                    <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-[#dc2626] text-white text-[9px] font-bold shadow-sm">N</span>
                    Nderrime
                  </span>
                  <Badge variant="destructive" className="font-mono text-xs">{issueCount.replacements + issueCount.welds}</Badge>
                </div>
                <div className="flex items-center justify-between p-1.5 rounded-lg bg-blue-600/10">
                  <span className="text-xs flex items-center gap-1">
                    <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-[#2563eb] text-white text-[9px] font-bold shadow-sm">R</span>
                    Riparime
                  </span>
                  <Badge className="font-mono text-xs bg-[#2563eb] text-white">{issueCount.repairs}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Center - Empty or additional info */}
        <div className="space-y-3"></div>

        {/* Right - Details */}
        <div className="space-y-3">
          {selectedPart ? (
            <Card className="border border-primary/50 bg-primary/5 animate-in slide-in-from-right-2 duration-200">
              <CardContent className="p-3 lg:p-4">
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-semibold text-foreground text-sm lg:text-base">
                    {carParts.find(p => p.id === selectedPart)?.name}
                  </h4>
                  <button
                    onClick={() => setSelectedPart(null)}
                    className="text-muted-foreground hover:text-foreground transition-colors text-lg leading-none"
                  >
                    ×
                  </button>
                </div>
                {(() => {
                  const statuses = getPartStatus(selectedPart);
                  if (statuses.length === 0) {
                    return (
                      <div className="flex items-center gap-2 text-sm">
                        <CheckCircle className="h-4 w-4" style={{color: 'hsl(142 76% 36%)'}} />
                        <span className="text-muted-foreground">Pjesë normale</span>
                      </div>
                    );
                  }
                  return (
                    <div className="space-y-3">
                      <div className="space-y-2">
                        {statuses.map((s, i) => (
                          <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
                            <Badge variant="outline" className="font-mono text-xs">{s.code}</Badge>
                            <span className="text-xs text-muted-foreground">{s.title}</span>
                          </div>
                        ))}
                      </div>
                      <div className="pt-2 border-t text-xs text-muted-foreground flex items-start gap-2">
                        <Info className="h-3 w-3 mt-0.5 flex-shrink-0" />
                        <span>{getStatusText(statuses)}</span>
                      </div>
                    </div>
                  );
                })()}
              </CardContent>
            </Card>
          ) : (
            <Card className="border border-border">
              <CardContent className="p-4 text-center">
                <p className="text-xs lg:text-sm text-muted-foreground">
                  Kliko një pjesë për detaje
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default CarInspectionDiagram;
