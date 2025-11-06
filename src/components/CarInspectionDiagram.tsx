import React, { useState } from 'react';
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle, CheckCircle, XCircle, AlertCircle, Info } from "lucide-react";

interface InspectionItem {
  type: { code: string; title: string };
  statusTypes: Array<{ code: string; title: string }>;
  attributes: string[];
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
      labelPos: { x: 320, y: 120 }
    },
    // Front Bumper
    {
      id: 'front_bumper',
      name: 'Bamper Para',
      nameEn: 'F. Bumper',
      path: 'M 220 20 L 420 20 Q 435 20 435 35 L 435 55 Q 435 60 420 60 L 220 60 Q 205 60 205 55 L 205 35 Q 205 20 220 20 Z',
      labelPos: { x: 320, y: 40 }
    },
    // Windshield
    {
      id: 'windshield',
      name: 'Xham Para',
      nameEn: 'Windshield',
      path: 'M 250 195 L 390 195 Q 400 195 400 205 L 400 235 L 250 235 Q 240 235 240 225 L 240 205 Q 240 195 250 195 Z',
      labelPos: { x: 320, y: 215 }
    },
    // Left Front Door
    {
      id: 'front_left_door',
      name: 'Derë Para Majtas',
      nameEn: 'L Front',
      path: 'M 150 195 L 235 195 L 235 310 L 150 310 Q 140 310 140 300 L 140 205 Q 140 195 150 195 Z',
      labelPos: { x: 185, y: 250 },
      markerPos: { x: 185, y: 255 }
    },
    // Right Front Door
    {
      id: 'front_right_door',
      name: 'Derë Para Djathtas',
      nameEn: 'R Front',
      path: 'M 405 195 L 495 195 Q 505 195 505 205 L 505 300 Q 505 310 495 310 L 405 310 L 405 195 Z',
      labelPos: { x: 450, y: 250 },
      markerPos: { x: 450, y: 255 }
    },
    // Roof
    {
      id: 'roof',
      name: 'Çati',
      nameEn: 'Roof',
      path: 'M 245 240 L 395 240 L 395 370 L 245 370 L 245 240 Z',
      labelPos: { x: 320, y: 305 }
    },
    // Left Rear Door
    {
      id: 'rear_left_door',
      name: 'Derë Prapa Majtas',
      nameEn: 'L Rear',
      path: 'M 140 315 L 235 315 L 235 430 L 140 430 Q 130 430 130 420 L 130 325 Q 130 315 140 315 Z',
      labelPos: { x: 185, y: 370 },
      markerPos: { x: 185, y: 375 }
    },
    // Right Rear Door
    {
      id: 'rear_right_door',
      name: 'Derë Prapa Djathtas',
      nameEn: 'R Rear',
      path: 'M 405 315 L 510 315 Q 520 315 520 325 L 520 420 Q 520 430 510 430 L 405 430 L 405 315 Z',
      labelPos: { x: 455, y: 370 },
      markerPos: { x: 455, y: 375 }
    },
    // Rear Glass
    {
      id: 'rear_glass',
      name: 'Xham Prapa',
      nameEn: 'R. Glass',
      path: 'M 245 375 L 395 375 L 395 415 Q 395 425 385 425 L 255 425 Q 245 425 245 415 L 245 375 Z',
      labelPos: { x: 320, y: 400 }
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
      labelPos: { x: 320, y: 580 }
    },
      // Side Sill Panels (approximate positions under doors)
      {
        id: 'side_sill_left',
        name: 'Panel Anësor (Majtas)',
        nameEn: 'Side Sill L',
        path: 'M 135 310 L 235 310 L 235 330 L 135 330 Z',
        labelPos: { x: 185, y: 320 },
        markerPos: { x: 185, y: 323 }
      },
      {
        id: 'side_sill_right',
        name: 'Panel Anësor (Djathtas)',
        nameEn: 'Side Sill R',
        path: 'M 405 310 L 505 310 L 505 330 L 405 330 Z',
        labelPos: { x: 455, y: 320 },
        markerPos: { x: 455, y: 323 }
      },
    // Left Front Fender
    {
      id: 'left_fender',
      name: 'Paranicë Majtas',
      nameEn: 'L Fender',
      path: 'M 140 70 L 225 70 L 225 185 L 140 185 Q 130 185 130 175 L 130 80 Q 130 70 140 70 Z',
      labelPos: { x: 175, y: 125 }
    },
    // Right Front Fender
    {
      id: 'right_fender',
      name: 'Paranicë Djathtas',
      nameEn: 'R Fender',
      path: 'M 415 70 L 510 70 Q 520 70 520 80 L 520 175 Q 520 185 510 185 L 415 185 L 415 70 Z',
      labelPos: { x: 465, y: 125 }
    },
    // Left Quarter Panel
    {
      id: 'left_quarter',
      name: 'Panel Prapa Majtas',
      nameEn: 'L Quarter',
      path: 'M 130 435 L 225 435 L 225 545 L 130 545 Q 120 545 120 535 L 120 445 Q 120 435 130 435 Z',
      labelPos: { x: 170, y: 490 },
      markerPos: { x: 170, y: 495 }
    },
    // Right Quarter Panel
    {
      id: 'right_quarter',
      name: 'Panel Prapa Djathtas',
      nameEn: 'R Quarter',
      path: 'M 415 435 L 520 435 Q 530 435 530 445 L 530 535 Q 530 545 520 545 L 415 545 L 415 435 Z',
      labelPos: { x: 470, y: 490 },
      markerPos: { x: 470, y: 495 }
    },
    // Front Left Wheel
    {
      id: 'fl_wheel',
      name: 'Rrota Para Majtas',
      nameEn: 'FL Wheel',
      path: 'M 30 90 m -25, 0 a 25,25 0 1,0 50,0 a 25,25 0 1,0 -50,0',
      labelPos: { x: 30, y: 90 }
    },
    // Front Right Wheel
    {
      id: 'fr_wheel',
      name: 'Rrota Para Djathtas',
      nameEn: 'FR Wheel',
      path: 'M 610 90 m -25, 0 a 25,25 0 1,0 50,0 a 25,25 0 1,0 -50,0',
      labelPos: { x: 610, y: 90 }
    },
    // Rear Left Wheel
    {
      id: 'rl_wheel',
      name: 'Rrota Prapa Majtas',
      nameEn: 'RL Wheel',
      path: 'M 30 510 m -25, 0 a 25,25 0 1,0 50,0 a 25,25 0 1,0 -50,0',
      labelPos: { x: 30, y: 510 }
    },
    // Rear Right Wheel
    {
      id: 'rr_wheel',
      name: 'Rrota Prapa Djathtas',
      nameEn: 'RR Wheel',
      path: 'M 610 510 m -25, 0 a 25,25 0 1,0 50,0 a 25,25 0 1,0 -50,0',
      labelPos: { x: 610, y: 510 }
    },
  ];

  // Helper: evaluate if an item's title targets a given part id
  const titleMatchesPart = (title: string, partId: string) => {
    const t = title.toLowerCase().replace(/\s+/g, ' ').trim();

    // Strict regex-based mappings to avoid false positives
    const patterns: Array<{ re: RegExp; id: string }> = [
      // Doors
      { re: /(front\s*)?door.*(left|\blh\b)/i, id: 'front_left_door' },
      { re: /(front\s*)?door.*(right|\brh\b)/i, id: 'front_right_door' },
      { re: /rear\s*door.*(left|\blh\b)/i, id: 'rear_left_door' },
      { re: /rear\s*door.*(right|\brh\b)/i, id: 'rear_right_door' },
      // Quarters and wheel house
      { re: /(quarter\s*panel|quarter).*\b(left|lh)\b/i, id: 'left_quarter' },
      { re: /(quarter\s*panel|quarter).*\b(right|rh)\b/i, id: 'right_quarter' },
      { re: /(rear).*(wheel\s*house|wheelhouse|wheel\s*arch).*\b(left|lh)\b/i, id: 'left_quarter' },
      { re: /(rear).*(wheel\s*house|wheelhouse|wheel\s*arch).*\b(right|rh)\b/i, id: 'right_quarter' },
      // Side sills
      { re: /(side\s*sill|sill).*\b(left|lh)\b/i, id: 'side_sill_left' },
      { re: /(side\s*sill|sill).*\b(right|rh)\b/i, id: 'side_sill_right' },
      // Bumpers
      { re: /front\s*bumper/i, id: 'front_bumper' },
      { re: /rear\s*bumper/i, id: 'rear_bumper' },
      // Trunk floor
      { re: /trunk\s*floor/i, id: 'trunk' },
      // Fenders
      { re: /(front\s*)?fender.*\b(left|lh)\b/i, id: 'left_fender' },
      { re: /(front\s*)?fender.*\b(right|rh)\b/i, id: 'right_fender' },
    ];

    const matched = patterns.find((m) => m.re.test(t));
    if (!matched) return false;
    return matched.id === partId;
  };

  // Get part status from inspection data (aggregate across matching items)
  const getPartStatus = (partId: string) => {
    const statuses: Array<{ code: string; title: string }> = [];
    for (const item of inspectionData) {
      const typeTitle = (item?.type?.title || '').toString();
      const matches =
        item?.type?.code === partId ||
        titleMatchesPart(typeTitle, partId);
      if (!matches) continue;

      const st = Array.isArray(item.statusTypes) ? item.statusTypes : [];
      if (st.length > 0) {
        statuses.push(...st);
      } else {
        // Derive from title if codes missing
        const low = typeTitle.toLowerCase();
        if (low.includes('exchange') || low.includes('replacement')) statuses.push({ code: 'X', title: 'Exchange (replacement)' });
        if (low.includes('weld') || low.includes('sheet metal')) statuses.push({ code: 'W', title: 'Welding' });
        if (low.includes('repair')) statuses.push({ code: 'A', title: 'Repair' });
        if (low.includes('scratch')) statuses.push({ code: 'S', title: 'Scratch' });
        if (low.includes('corr')) statuses.push({ code: 'U', title: 'Corrosion' });
      }

      // Derive from attributes too (if present)
      const attrs = Array.isArray((item as any).attributes) ? ((item as any).attributes as string[]) : [];
      const attrsText = attrs.join(' ').toLowerCase();
      if (attrsText) {
        if (attrsText.includes('exchange') || attrsText.includes('replacement')) statuses.push({ code: 'X', title: 'Exchange (replacement)' });
        if (attrsText.includes('weld') || attrsText.includes('sheet metal')) statuses.push({ code: 'W', title: 'Welding' });
        if (attrsText.includes('repair')) statuses.push({ code: 'A', title: 'Repair' });
        if (attrsText.includes('scratch')) statuses.push({ code: 'S', title: 'Scratch' });
        if (attrsText.includes('corr')) statuses.push({ code: 'U', title: 'Corrosion' });
      }
    }
    return statuses;
  };

const getStatusColor = (statuses: Array<{ code: string; title: string }>) => {
  if (statuses.length === 0) return 'hsl(142 76% 36%)'; // Green

  const hasExchange = statuses.some(
    (s) => s.code === 'X' || s.title.includes('교환') || s.title.includes('exchange')
  );
  const hasWelding = statuses.some(
    (s) => s.code === 'W' || s.title.includes('용접') || s.title.includes('weld')
  );
  const hasRepair = statuses.some(
    (s) => s.code === 'A' || s.title.includes('수리') || s.title.includes('repair')
  );
  const hasCorrosion = statuses.some(
    (s) => s.code === 'U' || s.title.includes('부식') || s.title.includes('corr')
  );
  const hasScratch = statuses.some(
    (s) => s.code === 'S' || s.title.includes('흠집') || s.title.includes('scratch')
  );

  if (hasExchange) return 'hsl(0 84% 60%)'; // Red for replaced parts
  if (hasWelding) return 'hsl(217 91% 60%)'; // Blue for welded parts
  if (hasRepair) return 'hsl(25 95% 53%)'; // Orange
  if (hasCorrosion) return 'hsl(25 95% 53%)'; // Orange
  if (hasScratch) return 'hsl(48 96% 53%)'; // Yellow

  return 'hsl(142 76% 36%)'; // Green
};

const getStatusText = (statuses: Array<{ code: string; title: string }>) => {
  if (statuses.length === 0) return 'Pjesë normale';

  const hasExchange = statuses.some((s) => s.code === 'X');
  const hasWelding = statuses.some((s) => s.code === 'W');
  const hasRepair = statuses.some((s) => s.code === 'A');
  const hasCorrosion = statuses.some((s) => s.code === 'U');
  const hasScratch = statuses.some((s) => s.code === 'S');

  if (hasExchange) return 'Pjesë e zëvendësuar (Rreth i kuq)';
  if (hasWelding) return 'Saldim i kryer (Rreth blu)';
  if (hasRepair) return 'Pjesë e riparuar (Rreth portokalli)';
  if (hasCorrosion) return 'Ndryshk i vogël (Rreth portokalli)';
  if (hasScratch) return 'Gërvishje (Rreth i verdhë)';

  return 'Pjesë normale';
};

  // Count all types of issues from API data
  const issueCount = {
    replacements: inspectionData.filter(item => {
      const t = (item?.type?.title || '').toString().toLowerCase();
      const codes = item.statusTypes?.map(s => s.code) || [];
      return (
        codes.includes('X') ||
        t.includes('exchange') || t.includes('replacement') || t.includes('교환')
      );
    }).length,
    welds: inspectionData.filter(item => {
      const t = (item?.type?.title || '').toString().toLowerCase();
      const codes = item.statusTypes?.map(s => s.code) || [];
      return (
        codes.includes('W') ||
        t.includes('weld') || t.includes('sheet metal') || t.includes('용접')
      );
    }).length,
    repairs: inspectionData.filter(item => {
      const t = (item?.type?.title || '').toString().toLowerCase();
      const codes = item.statusTypes?.map(s => s.code) || [];
      return (
        codes.includes('A') ||
        t.includes('repair') || t.includes('수리')
      );
    }).length,
    corrosion: inspectionData.filter(item => {
      const t = (item?.type?.title || '').toString().toLowerCase();
      const codes = item.statusTypes?.map(s => s.code) || [];
      return (
        codes.includes('U') ||
        t.includes('corr') || t.includes('부식')
      );
    }).length,
    scratches: inspectionData.filter(item => {
      const t = (item?.type?.title || '').toString().toLowerCase();
      const codes = item.statusTypes?.map(s => s.code) || [];
      return (
        codes.includes('S') ||
        t.includes('scratch') || t.includes('흠집')
      );
    }).length,
  };

  return (
    <div className={`w-full ${className}`}>
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 lg:gap-6">
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
                    <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-red-600 text-white text-[9px] font-bold shadow-sm">N</span>
                    Nderrime
                  </span>
                  <Badge variant="destructive" className="font-mono text-xs">{issueCount.replacements}</Badge>
                </div>
                <div className="flex items-center justify-between p-1.5 rounded-lg bg-blue-600/10">
                  <span className="text-xs flex items-center gap-1">
                    <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-blue-600 text-white text-[9px] font-bold shadow-sm">S</span>
                    Saldime
                  </span>
                  <Badge className="font-mono text-xs" style={{backgroundColor: 'hsl(217 91% 60%)', color: 'white'}}>{issueCount.welds}</Badge>
                </div>
                <div className="flex items-center justify-between p-1.5 rounded-lg" style={{backgroundColor: 'hsl(25 95% 53% / 0.1)'}}>
                  <span className="text-xs flex items-center gap-1">
                    <span className="inline-flex items-center justify-center w-4 h-4 rounded-full text-white text-[9px] font-bold shadow-sm" style={{backgroundColor: 'hsl(25 95% 53%)'}}>R</span>
                    Riparime
                  </span>
                  <Badge className="font-mono text-xs" style={{backgroundColor: 'hsl(25 95% 53%)', color: 'white'}}>{issueCount.repairs}</Badge>
                </div>
                {issueCount.corrosion > 0 && (
                  <div className="flex items-center justify-between p-1.5 rounded-lg" style={{backgroundColor: 'hsl(25 95% 53% / 0.1)'}}>
                    <span className="text-xs flex items-center gap-1">
                      <span className="inline-flex items-center justify-center w-4 h-4 rounded-full text-white text-[9px] font-bold shadow-sm" style={{backgroundColor: 'hsl(25 95% 53%)'}}>K</span>
                      Korrozion
                    </span>
                    <Badge className="font-mono text-xs" style={{backgroundColor: 'hsl(25 95% 53%)', color: 'white'}}>{issueCount.corrosion}</Badge>
                  </div>
                )}
                {issueCount.scratches > 0 && (
                  <div className="flex items-center justify-between p-1.5 rounded-lg" style={{backgroundColor: 'hsl(48 96% 53% / 0.1)'}}>
                    <span className="text-xs flex items-center gap-1">
                      <span className="inline-flex items-center justify-center w-4 h-4 rounded-full text-white text-[9px] font-bold shadow-sm" style={{backgroundColor: 'hsl(48 96% 53%)'}}>G</span>
                      Gërvishje
                    </span>
                    <Badge className="font-mono text-xs" style={{backgroundColor: 'hsl(48 96% 53%)', color: 'white'}}>{issueCount.scratches}</Badge>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Legend - Updated with all API status codes */}
          <Card className="border border-border">
            <CardContent className="p-3 lg:p-4">
              <h4 className="font-semibold mb-3 text-foreground text-sm lg:text-base">Kodet nga API</h4>
              <div className="space-y-2 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-semibold bg-red-600 text-white shadow-sm">N</div>
                  <span>Nderrim (pjesë e re)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-semibold bg-blue-600 text-white shadow-sm">S</div>
                  <span>Saldim</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-semibold text-white shadow-sm" style={{backgroundColor: 'hsl(25 95% 53%)'}}>R</div>
                  <span>Riparim</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-semibold text-white shadow-sm" style={{backgroundColor: 'hsl(25 95% 53%)'}}>K</div>
                  <span>Korrozion</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-semibold text-white shadow-sm" style={{backgroundColor: 'hsl(48 96% 53%)'}}>G</div>
                  <span>Gërvishje</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Center - Car Diagram */}
        <div className="lg:col-span-2 flex flex-col items-center justify-center gap-4 p-4">
          <div className="relative w-full max-w-md">
            <svg viewBox="0 0 640 630" className="w-full h-auto rounded-lg bg-muted/30 border border-border">
              <defs>
                <filter id="glow">
                  <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                  <feMerge>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>
                <linearGradient id="carBodyGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" style={{stopColor: 'hsl(var(--muted))', stopOpacity: 0.8}} />
                  <stop offset="100%" style={{stopColor: 'hsl(var(--muted))', stopOpacity: 0.4}} />
                </linearGradient>
              </defs>
              
              {/* Render car body parts with fills */}
              {carParts.map((part) => {
                const statuses = getPartStatus(part.id);
                const color = getStatusColor(statuses);
                const isHovered = hoveredPart === part.id;
                const isSelected = selectedPart === part.id;
                
                return (
                  <g key={`body-${part.id}`}>
                    <path
                      d={part.path}
                      fill={statuses.length > 0 ? `${color}20` : 'url(#carBodyGradient)'}
                      stroke={isSelected ? "hsl(var(--primary))" : "hsl(var(--border))"}
                      strokeWidth={isSelected ? 3 : 1}
                      className="cursor-pointer transition-all duration-200"
                      onMouseEnter={() => setHoveredPart(part.id)}
                      onMouseLeave={() => setHoveredPart(null)}
                      onClick={() => setSelectedPart(selectedPart === part.id ? null : part.id)}
                    />
                  </g>
                );
              })}
              
              {/* Render status markers on top */}
              {carParts.map((part) => {
                const statuses = getPartStatus(part.id);
                const color = getStatusColor(statuses);
                const isHovered = hoveredPart === part.id;
                const isSelected = selectedPart === part.id;
                
                return (
                  <g key={`marker-${part.id}`}>
                    {/* Status markers with detailed codes from API */}
                    {statuses.length > 0 && (
                      <>
                        {(() => {
                          const lowTitles = statuses.map((s) => (s.title || '').toString().toLowerCase());
                          const codes = statuses.map((s) => (s.code || '').toUpperCase());

                          // Check for different types of repairs/replacements from API
                          const hasExchange =
                            codes.includes('X') ||
                            lowTitles.some((t) => t.includes('exchange') || t.includes('replacement') || t.includes('교환'));
                          const hasWeld =
                            codes.includes('W') ||
                            lowTitles.some((t) => t.includes('weld') || t.includes('sheet metal') || t.includes('용접'));
                          const hasRepair =
                            codes.includes('A') ||
                            lowTitles.some((t) => t.includes('repair') || t.includes('수리'));
                          const hasCorrosion =
                            codes.includes('U') ||
                            lowTitles.some((t) => t.includes('corr') || t.includes('부식'));
                          const hasScratch =
                            codes.includes('S') ||
                            lowTitles.some((t) => t.includes('scratch') || t.includes('흠집'));

                          // Collect all markers to display
                          const markers: Array<{ char: string; color: string }> = [];
                          
                          if (hasExchange) markers.push({ char: 'N', color: 'hsl(0 84% 60%)' });
                          if (hasWeld) markers.push({ char: 'S', color: 'hsl(217 91% 60%)' });
                          if (hasRepair) markers.push({ char: 'R', color: 'hsl(25 95% 53%)' });
                          if (hasCorrosion) markers.push({ char: 'K', color: 'hsl(25 95% 53%)' });
                          if (hasScratch) markers.push({ char: 'G', color: 'hsl(48 96% 53%)' });

                          const n = markers.length;
                          const base = part.markerPos || part.labelPos;
                          const spacing = 16;
                          
                          return markers.map((m, idx) => {
                            const offset = (idx - (n - 1) / 2) * spacing;
                            const cx = base.x + offset;
                            const cy = base.y;
                            return (
                              <g key={`${part.id}-mrk-${idx}`}>
                                <circle 
                                  cx={cx} 
                                  cy={cy} 
                                  r={11} 
                                  fill={m.color} 
                                  stroke="white" 
                                  strokeWidth={2}
                                  filter={isHovered || isSelected ? 'url(#glow)' : undefined}
                                  className="transition-all duration-200"
                                />
                                <text 
                                  x={cx} 
                                  y={cy} 
                                  textAnchor="middle" 
                                  dominantBaseline="central" 
                                  fontSize={9} 
                                  fontWeight={700} 
                                  fill="white"
                                  className="pointer-events-none select-none"
                                  style={{ textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}
                                >
                                  {m.char}
                                </text>
                              </g>
                            );
                          });
                        })()}
                      </>
                    )}
                    {(isHovered || isSelected) && (
                      <text
                        x={part.labelPos.x}
                        y={part.labelPos.y}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        className="text-[9px] font-semibold pointer-events-none"
                        fill="hsl(var(--background))"
                        stroke="hsl(var(--foreground))"
                        strokeWidth="0.5"
                      >
                        {part.nameEn}
                      </text>
                    )}
                  </g>
                );
              })}
            </svg>
            
            {hoveredPart && !selectedPart && (
              <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 bg-foreground/90 text-background px-3 py-1.5 rounded-lg text-xs shadow-lg backdrop-blur-sm z-10">
                {carParts.find(p => p.id === hoveredPart)?.name} - Kliko për detaje
              </div>
            )}
          </div>
          
          {/* Bottom view - simplified representation */}
          <div className="relative w-full max-w-md">
            <svg viewBox="0 0 640 400" className="w-full h-auto rounded-lg bg-muted/30 border border-border">
              <defs>
                <linearGradient id="undercarriageGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" style={{stopColor: 'hsl(var(--muted))', stopOpacity: 0.6}} />
                  <stop offset="100%" style={{stopColor: 'hsl(var(--muted))', stopOpacity: 0.3}} />
                </linearGradient>
              </defs>
              
              {/* Main undercarriage frame */}
              <rect x="200" y="50" width="240" height="300" rx="10" fill="url(#undercarriageGradient)" stroke="hsl(var(--border))" strokeWidth="2"/>
              
              {/* Wheel wells */}
              <circle cx="230" cy="100" r="35" fill="hsl(var(--muted))" stroke="hsl(var(--border))" strokeWidth="2"/>
              <circle cx="410" cy="100" r="35" fill="hsl(var(--muted))" stroke="hsl(var(--border))" strokeWidth="2"/>
              <circle cx="230" cy="300" r="35" fill="hsl(var(--muted))" stroke="hsl(var(--border))" strokeWidth="2"/>
              <circle cx="410" cy="300" r="35" fill="hsl(var(--muted))" stroke="hsl(var(--border))" strokeWidth="2"/>
              
              {/* Center line elements */}
              <rect x="300" y="120" width="40" height="160" rx="5" fill="hsl(var(--muted))" stroke="hsl(var(--border))" strokeWidth="1.5"/>
              
              <text x="320" y="30" textAnchor="middle" className="text-xs font-medium" fill="hsl(var(--foreground))">
                Pamja nga poshtë
              </text>
            </svg>
          </div>
        </div>

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
