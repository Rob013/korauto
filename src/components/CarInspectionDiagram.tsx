import React, { useState } from 'react';
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertTriangle, CheckCircle, Info, Printer } from "lucide-react";
import carDiagramTop from '@/assets/car-diagram-top.jpeg';
import carDiagramBottom from '@/assets/car-diagram-bottom.webp';
import { mapInspectionTypeToPartId } from '@/utils/inspectionMapping';
import { PrintableInspectionReport } from './PrintableInspectionReport';

export interface InspectionItem {
  type: { code: string; title: string };
  statusTypes: Array<{ code: string; title: string }>;
  attributes: string[];
  mappedPartId?: string | null;
}

interface CarInspectionDiagramProps {
  inspectionData?: InspectionItem[];
  className?: string;
  carInfo?: {
    make?: string;
    model?: string;
    year?: string;
    vin?: string;
    mileage?: string;
  };
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
  className = "",
  carInfo = {}
}) => {
  const [hoveredPart, setHoveredPart] = useState<string | null>(null);
  const [selectedPart, setSelectedPart] = useState<string | null>(null);
  const [highlightedPart, setHighlightedPart] = useState<string | null>(null);
  const [showPrintDialog, setShowPrintDialog] = useState(false);

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
    const t = text.toLowerCase();
    
    // Direct part ID matching
    const mapped = mapInspectionTypeToPartId({ title: text });
    if (mapped) {
      return mapped === partId;
    }
    
    // Enhanced keyword matching for better coverage
    const partKeywords: Record<string, string[]> = {
      'hood': ['hood', 'bonnet', 'kapak', '후드', '본네트'],
      'front_bumper': ['front bumper', 'f bumper', 'bamper para', '프론트 범퍼', '앞범퍼'],
      'rear_bumper': ['rear bumper', 'r bumper', 'bamper prapa', '리어 범퍼', '뒷범퍼'],
      'trunk': ['trunk', 'boot', 'tailgate', 'decklid', 'bagazh', '트렁크', '트렁크리드'],
      'front_left_door': ['front left door', 'fl door', 'lh front door', 'derë para majtas', '운전석 앞문', '좌측전면도어'],
      'front_right_door': ['front right door', 'fr door', 'rh front door', 'derë para djathtas', '조수석 앞문', '우측전면도어'],
      'rear_left_door': ['rear left door', 'rl door', 'lh rear door', 'derë prapa majtas', '운전석 뒷문', '좌측후면도어'],
      'rear_right_door': ['rear right door', 'rr door', 'rh rear door', 'derë prapa djathtas', '조수석 뒷문', '우측후면도어'],
      'left_fender': ['left fender', 'lh fender', 'paranicë majtas', '좌측 펜더', '좌측전면휀더'],
      'right_fender': ['right fender', 'rh fender', 'paranicë djathtas', '우측 펜더', '우측전면휀더'],
      'left_quarter': ['left quarter', 'lh quarter', 'panel prapa majtas', '좌측 쿼터', '좌측후면휀더'],
      'right_quarter': ['right quarter', 'rh quarter', 'panel prapa djathtas', '우측 쿼터', '우측후면휀더'],
      'roof': ['roof', 'top', 'ceiling', 'çati', '루프', '천장'],
      'windshield': ['windshield', 'front glass', 'xham para', '앞유리', '전면유리'],
      'rear_glass': ['rear glass', 'back glass', 'xham prapa', '뒷유리', '후면유리'],
      'side_sill_left': ['left sill', 'lh sill', 'left rocker', 'panel anësor majtas', '좌측 사이드실'],
      'side_sill_right': ['right sill', 'rh sill', 'right rocker', 'panel anësor djathtas', '우측 사이드실'],
      'fl_wheel': ['front left wheel', 'fl wheel', 'rrota para majtas', '좌측전륜'],
      'fr_wheel': ['front right wheel', 'fr wheel', 'rrota para djathtas', '우측전륜'],
      'rl_wheel': ['rear left wheel', 'rl wheel', 'rrota prapa majtas', '좌측후륜'],
      'rr_wheel': ['rear right wheel', 'rr wheel', 'rrota prapa djathtas', '우측후륜'],
    };
    
    const keywords = partKeywords[partId] || [];
    if (keywords.some(kw => t.includes(kw))) {
      return true;
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

  if (hasExchange) return 'Pjesë e zëvendësuar (X - red)';
  if (hasWelding || hasRepair) return 'Pjesë e riparuar (W - blue)';

  return 'Pjesë normale';
};

  // Get all affected parts with their details
  const affectedParts = carParts
    .map(part => {
      const statuses = getPartStatus(part.id);
      if (statuses.length === 0) return null;
      
      const normalizedCodes = statuses.map(s => String(s.code || '').toUpperCase().trim());
      const normalizedTitles = statuses.map(s => String(s.title || '').toLowerCase());
      
      const hasExchange = normalizedCodes.some(code => code === 'X' || code === '2') ||
        normalizedTitles.some(t => t.includes('exchange') || t.includes('replacement') || t.includes('교환') || t.includes('nderrim'));
      
      const hasWelding = normalizedCodes.some(code => code === 'W' || code === '3' || code === 'A' || code === '1') ||
        normalizedTitles.some(t => t.includes('weld') || t.includes('sheet metal') || t.includes('용접') || t.includes('saldim') || 
          t.includes('repair') || t.includes('simple') || t.includes('수리') || t.includes('riparim'));
      
      const badgeType = hasExchange ? 'X' : hasWelding ? 'W' : null;
      if (!badgeType) return null;
      
      return {
        ...part,
        badgeType,
        statuses,
        isReplacement: hasExchange,
        isRepair: hasWelding && !hasExchange
      };
    })
    .filter(Boolean) as Array<CarPart & { badgeType: string; statuses: Array<{ code: string; title: string }>; isReplacement: boolean; isRepair: boolean }>;

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
      {/* Print Button */}
      <div className="mb-4 flex justify-end">
        <Dialog open={showPrintDialog} onOpenChange={setShowPrintDialog}>
          <DialogTrigger asChild>
            <Button variant="outline" className="gap-2">
              <Printer className="h-4 w-4" />
              Print Report
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Printable Inspection Report</DialogTitle>
            </DialogHeader>
            <PrintableInspectionReport 
              inspectionData={inspectionData}
              carInfo={carInfo}
              affectedParts={affectedParts}
            />
            <div className="mt-4 flex justify-end gap-2 no-print">
              <Button variant="outline" onClick={() => setShowPrintDialog(false)}>
                Close
              </Button>
              <Button onClick={() => window.print()}>
                <Printer className="h-4 w-4 mr-2" />
                Print
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Main Diagram Section - Split View */}
      <div className="w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 border border-border rounded-lg overflow-hidden bg-background">
          {/* Left Side - Outside View (Jashte) */}
          <div className="border-b lg:border-b-0 lg:border-r border-border">
            <div className="bg-muted/30 px-4 py-2 md:py-3 border-b border-border">
              <h3 className="font-semibold text-center text-foreground text-sm md:text-base">Jashte</h3>
            </div>
            <div className="relative p-4 md:p-8 bg-muted/10 min-h-[300px] md:min-h-[400px]">
              <div className="relative w-full max-w-lg mx-auto">
                <img src={carDiagramTop} alt="Car Outside View" className="w-full h-auto" />
                
                {/* Overlay markers on outside/top view */}
                {carParts.map((part) => {
                  const statuses = getPartStatus(part.id);
                  if (statuses.length === 0) return null;
                  
                  const normalizedCodes = statuses.map(s => String(s.code || '').toUpperCase().trim());
                  const normalizedTitles = statuses.map(s => String(s.title || '').toLowerCase());

                  // X badge: replacement (code 2, X) - red
                  const hasExchange = normalizedCodes.some(code => code === 'X' || code === '2') ||
                    normalizedTitles.some(t => t.includes('exchange') || t.includes('replacement') || t.includes('교환') || t.includes('nderrim'));

                  // W badge: sheet metal/welding (code 3, W) or simple repair (code 1, A) - blue
                  const hasWelding = normalizedCodes.some(code => code === 'W' || code === '3' || code === 'A' || code === '1') ||
                    normalizedTitles.some(t => t.includes('weld') || t.includes('sheet metal') || t.includes('용접') || t.includes('saldim') || 
                      t.includes('repair') || t.includes('simple') || t.includes('수리') || t.includes('riparim'));

                  const showXBadge = hasExchange;
                  const showWBadge = hasWelding && !showXBadge;

                  if (!showXBadge && !showWBadge) return null;

                  // Position badges on the diagram - relative to image dimensions
                  let position = {};
                  if (part.id === 'hood') position = { top: '20%', left: '50%' };
                  else if (part.id === 'front_bumper') position = { top: '8%', left: '50%' };
                  else if (part.id === 'windshield') position = { top: '32%', left: '50%' };
                  else if (part.id === 'front_left_door') position = { top: '42%', left: '25%' };
                  else if (part.id === 'front_right_door') position = { top: '42%', left: '75%' };
                  else if (part.id === 'roof') position = { top: '54%', left: '50%' };
                  else if (part.id === 'rear_left_door') position = { top: '66%', left: '25%' };
                  else if (part.id === 'rear_right_door') position = { top: '66%', left: '75%' };
                  else if (part.id === 'rear_glass') position = { top: '78%', left: '50%' };
                  else if (part.id === 'trunk') position = { top: '88%', left: '50%' };
                  else if (part.id === 'rear_bumper') position = { top: '96%', left: '50%' };
                  else if (part.id === 'left_fender') position = { top: '22%', left: '18%' };
                  else if (part.id === 'right_fender') position = { top: '22%', left: '82%' };
                  else if (part.id === 'left_quarter') position = { top: '82%', left: '18%' };
                  else if (part.id === 'right_quarter') position = { top: '82%', left: '82%' };
                  else if (part.id === 'side_sill_left') position = { top: '53%', left: '15%' };
                  else if (part.id === 'side_sill_right') position = { top: '53%', left: '85%' };
                  else if (part.id === 'fl_wheel') position = { top: '20%', left: '8%' };
                  else if (part.id === 'fr_wheel') position = { top: '20%', left: '92%' };
                  else if (part.id === 'rl_wheel') position = { top: '84%', left: '8%' };
                  else if (part.id === 'rr_wheel') position = { top: '84%', left: '92%' };

                  return (
                    <button
                      key={`outside-${part.id}`}
                      className="absolute z-10 transition-transform hover:scale-110 active:scale-95"
                      style={{
                        ...position,
                        transform: 'translate(-50%, -50%)'
                      }}
                      onClick={() => {
                        setHighlightedPart(part.id);
                        setTimeout(() => setHighlightedPart(null), 2000);
                      }}
                      onMouseEnter={() => setHoveredPart(part.id)}
                      onMouseLeave={() => setHoveredPart(null)}
                    >
                      <div 
                        className={`flex items-center justify-center w-7 h-7 md:w-9 md:h-9 rounded-full font-bold text-white text-xs md:text-base shadow-lg border-2 ${
                          hoveredPart === part.id || highlightedPart === part.id ? 'border-yellow-400 ring-2 ring-yellow-400/50' : 'border-white'
                        }`}
                        style={{ backgroundColor: showXBadge ? '#dc2626' : '#2563eb' }}
                      >
                        {showXBadge ? 'X' : 'W'}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Side - Inside View (Brenda) */}
          <div>
            <div className="bg-muted/30 px-4 py-2 md:py-3 border-b border-border">
              <h3 className="font-semibold text-center text-foreground text-sm md:text-base">Brenda</h3>
            </div>
            <div className="relative p-4 md:p-8 bg-muted/10 min-h-[300px] md:min-h-[400px]">
              <div className="relative w-full max-w-lg mx-auto">
                <img src={carDiagramBottom} alt="Car Inside View" className="w-full h-auto" />
                
                {/* Overlay markers on inside/bottom view */}
                {carParts.map((part) => {
                  const statuses = getPartStatus(part.id);
                  if (statuses.length === 0) return null;
                  
                  const normalizedCodes = statuses.map(s => String(s.code || '').toUpperCase().trim());
                  const normalizedTitles = statuses.map(s => String(s.title || '').toLowerCase());

                  // X badge: replacement (code 2, X) - red
                  const hasExchange = normalizedCodes.some(code => code === 'X' || code === '2') ||
                    normalizedTitles.some(t => t.includes('exchange') || t.includes('replacement') || t.includes('교환') || t.includes('nderrim'));

                  // W badge: sheet metal/welding (code 3, W) or simple repair (code 1, A) - blue
                  const hasWelding = normalizedCodes.some(code => code === 'W' || code === '3' || code === 'A' || code === '1') ||
                    normalizedTitles.some(t => t.includes('weld') || t.includes('sheet metal') || t.includes('용접') || t.includes('saldim') || 
                      t.includes('repair') || t.includes('simple') || t.includes('수리') || t.includes('riparim'));

                  const showXBadge = hasExchange;
                  const showWBadge = hasWelding && !showXBadge;

                  if (!showXBadge && !showWBadge) return null;

                  // Position badges on the diagram - relative to image dimensions
                  let position = {};
                  if (part.id === 'hood') position = { top: '20%', left: '50%' };
                  else if (part.id === 'front_bumper') position = { top: '8%', left: '50%' };
                  else if (part.id === 'windshield') position = { top: '32%', left: '50%' };
                  else if (part.id === 'front_left_door') position = { top: '42%', left: '25%' };
                  else if (part.id === 'front_right_door') position = { top: '42%', left: '75%' };
                  else if (part.id === 'roof') position = { top: '54%', left: '50%' };
                  else if (part.id === 'rear_left_door') position = { top: '66%', left: '25%' };
                  else if (part.id === 'rear_right_door') position = { top: '66%', left: '75%' };
                  else if (part.id === 'rear_glass') position = { top: '78%', left: '50%' };
                  else if (part.id === 'trunk') position = { top: '88%', left: '50%' };
                  else if (part.id === 'rear_bumper') position = { top: '96%', left: '50%' };
                  else if (part.id === 'left_fender') position = { top: '22%', left: '18%' };
                  else if (part.id === 'right_fender') position = { top: '22%', left: '82%' };
                  else if (part.id === 'left_quarter') position = { top: '82%', left: '18%' };
                  else if (part.id === 'right_quarter') position = { top: '82%', left: '82%' };
                  else if (part.id === 'side_sill_left') position = { top: '53%', left: '15%' };
                  else if (part.id === 'side_sill_right') position = { top: '53%', left: '85%' };
                  else if (part.id === 'fl_wheel') position = { top: '20%', left: '8%' };
                  else if (part.id === 'fr_wheel') position = { top: '20%', left: '92%' };
                  else if (part.id === 'rl_wheel') position = { top: '84%', left: '8%' };
                  else if (part.id === 'rr_wheel') position = { top: '84%', left: '92%' };

                  return (
                    <button
                      key={`inside-${part.id}`}
                      className="absolute z-10 transition-transform hover:scale-110 active:scale-95"
                      style={{
                        ...position,
                        transform: 'translate(-50%, -50%)'
                      }}
                      onClick={() => {
                        setHighlightedPart(part.id);
                        setTimeout(() => setHighlightedPart(null), 2000);
                      }}
                      onMouseEnter={() => setHoveredPart(part.id)}
                      onMouseLeave={() => setHoveredPart(null)}
                    >
                      <div 
                        className={`flex items-center justify-center w-7 h-7 md:w-9 md:h-9 rounded-full font-bold text-white text-xs md:text-base shadow-lg border-2 ${
                          hoveredPart === part.id || highlightedPart === part.id ? 'border-yellow-400 ring-2 ring-yellow-400/50' : 'border-white'
                        }`}
                        style={{ backgroundColor: showXBadge ? '#dc2626' : '#2563eb' }}
                      >
                        {showXBadge ? 'X' : 'W'}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Legend at Bottom - Mobile Responsive */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-6 py-3 md:py-4 border-t border-border bg-background">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center justify-center w-5 h-5 md:w-6 md:h-6 rounded-full bg-[#dc2626] text-white text-xs font-bold shadow-sm border-2 border-white">X</span>
            <span className="text-xs md:text-sm font-medium text-foreground">교환 (Exchange/Replacement)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center justify-center w-5 h-5 md:w-6 md:h-6 rounded-full bg-[#2563eb] text-white text-xs font-bold shadow-sm border-2 border-white">W</span>
            <span className="text-xs md:text-sm font-medium text-foreground">용접/수리 (Welding/Repair)</span>
          </div>
        </div>
      </div>

      {/* Comprehensive Parts List Section */}
      <div className="mt-6 space-y-4">
        {affectedParts.length > 0 && (
          <Card className="border border-border">
            <CardContent className="p-4 md:p-6">
              <h4 className="font-semibold mb-4 text-foreground flex items-center gap-2 text-base md:text-lg">
                <AlertTriangle className="h-4 w-4 md:h-5 md:w-5" />
                Pjesët e Dëmtuara / 손상된 부품
              </h4>
              
              {/* Replacements Section */}
              {affectedParts.some(p => p.isReplacement) && (
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-[#dc2626] text-white text-sm font-bold shadow-sm border-2 border-white">X</span>
                    <h5 className="font-semibold text-sm">교환 (Replacement) - {affectedParts.filter(p => p.isReplacement).length} pjesë</h5>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                    {affectedParts
                      .filter(p => p.isReplacement)
                      .map((part) => (
                        <button
                          key={`list-x-${part.id}`}
                          className={`text-left p-3 rounded-lg border transition-all ${
                            highlightedPart === part.id 
                              ? 'border-yellow-400 bg-yellow-50 dark:bg-yellow-900/20 ring-2 ring-yellow-400/50' 
                              : 'border-border bg-muted/30 hover:bg-muted/50'
                          }`}
                          onClick={() => {
                            setHighlightedPart(part.id);
                            setTimeout(() => setHighlightedPart(null), 2000);
                          }}
                          onMouseEnter={() => setHoveredPart(part.id)}
                          onMouseLeave={() => setHoveredPart(null)}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                              <p className="font-medium text-sm text-foreground">{part.name}</p>
                              <p className="text-xs text-muted-foreground mt-0.5">{part.nameEn}</p>
                            </div>
                            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#dc2626] text-white text-xs font-bold flex-shrink-0">X</span>
                          </div>
                          <div className="mt-2 flex flex-wrap gap-1">
                            {part.statuses.map((s, i) => (
                              <Badge key={i} variant="outline" className="text-[10px] h-5">{s.code}</Badge>
                            ))}
                          </div>
                        </button>
                      ))}
                  </div>
                </div>
              )}
              
              {/* Repairs Section */}
              {affectedParts.some(p => p.isRepair) && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-[#2563eb] text-white text-sm font-bold shadow-sm border-2 border-white">W</span>
                    <h5 className="font-semibold text-sm">용접/수리 (Welding/Repair) - {affectedParts.filter(p => p.isRepair).length} pjesë</h5>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                    {affectedParts
                      .filter(p => p.isRepair)
                      .map((part) => (
                        <button
                          key={`list-w-${part.id}`}
                          className={`text-left p-3 rounded-lg border transition-all ${
                            highlightedPart === part.id 
                              ? 'border-yellow-400 bg-yellow-50 dark:bg-yellow-900/20 ring-2 ring-yellow-400/50' 
                              : 'border-border bg-muted/30 hover:bg-muted/50'
                          }`}
                          onClick={() => {
                            setHighlightedPart(part.id);
                            setTimeout(() => setHighlightedPart(null), 2000);
                          }}
                          onMouseEnter={() => setHoveredPart(part.id)}
                          onMouseLeave={() => setHoveredPart(null)}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                              <p className="font-medium text-sm text-foreground">{part.name}</p>
                              <p className="text-xs text-muted-foreground mt-0.5">{part.nameEn}</p>
                            </div>
                            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#2563eb] text-white text-xs font-bold flex-shrink-0">W</span>
                          </div>
                          <div className="mt-2 flex flex-wrap gap-1">
                            {part.statuses.map((s, i) => (
                              <Badge key={i} variant="outline" className="text-[10px] h-5">{s.code}</Badge>
                            ))}
                          </div>
                        </button>
                      ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
        
        {/* Statistics Summary */}
        <Card className="border border-border">
          <CardContent className="p-4 md:p-6">
            <h4 className="font-semibold mb-4 text-foreground flex items-center gap-2 text-base">
              <Info className="h-4 w-4" />
              Përmbledhje / 요약
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                <div className="flex items-center gap-2 mb-1">
                  <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#dc2626] text-white text-xs font-bold">X</span>
                  <span className="text-xs font-medium">교환</span>
                </div>
                <p className="text-2xl font-bold text-destructive">{issueCount.replacements}</p>
              </div>
              <div className="p-3 rounded-lg bg-blue-600/10 border border-blue-600/20">
                <div className="flex items-center gap-2 mb-1">
                  <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#2563eb] text-white text-xs font-bold">W</span>
                  <span className="text-xs font-medium">용접</span>
                </div>
                <p className="text-2xl font-bold text-[#2563eb]">{issueCount.welds}</p>
              </div>
              <div className="p-3 rounded-lg bg-blue-600/10 border border-blue-600/20">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-medium">수리</span>
                </div>
                <p className="text-2xl font-bold text-[#2563eb]">{issueCount.repairs}</p>
              </div>
              <div className="p-3 rounded-lg bg-muted border border-border">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-medium">총계</span>
                </div>
                <p className="text-2xl font-bold text-foreground">{affectedParts.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CarInspectionDiagram;
