import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Printer } from "lucide-react";
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

// Define part categories for Frame and External Panel
const FRAME_PARTS = [
  { albanian: 'Paneli përparmë / Paneli i brendshëm', english: 'Front panel / inside panel', partIds: ['front_panel', 'inside_panel'] },
  { albanian: 'Shtëpia e rrotës përparmë/mbrapa', english: 'Front/rear wheelhouse', partIds: ['fl_wheel', 'fr_wheel', 'rl_wheel', 'rr_wheel'] },
  { albanian: 'Paneli A,B / Paneli i pultit / Paneli i dyshemesë', english: 'A,B pillar panel / dash panel / floor panel', partIds: ['a_pillar', 'b_pillar', 'dash_panel', 'floor_panel'] },
  { albanian: 'Paneli anësor / Paneli çerek', english: 'Side sill panel / quarter panel', partIds: ['side_sill_left', 'side_sill_right', 'left_quarter', 'right_quarter'] },
  { albanian: 'Paneli mbrapa / Dyshemeja e bagazhit', english: 'Rear panel / trunk floor', partIds: ['rear_panel', 'trunk'] },
  { albanian: 'Anëtari anësor / Tavani / Tavani i paketës', english: 'Side member / roof rail / package tray', partIds: ['side_member', 'package_tray'] },
];

const EXTERNAL_PANEL_PARTS = [
  { albanian: 'Kapaku', english: 'Hood', partIds: ['hood'] },
  { albanian: 'Krahori përparmë', english: 'Front fender', partIds: ['left_fender', 'right_fender'] },
  { albanian: 'Dera përparmë', english: 'Front door', partIds: ['front_left_door', 'front_right_door'] },
  { albanian: 'Dera mbrapa', english: 'Rear door', partIds: ['rear_left_door', 'rear_right_door'] },
  { albanian: 'Kapaku i bagazhit', english: 'Trunk lid', partIds: ['trunk'] },
  { albanian: 'Çatia', english: 'Roof', partIds: ['roof'] },
];

export const CarInspectionDiagram: React.FC<CarInspectionDiagramProps> = ({
  inspectionData = [],
  className = "",
  carInfo = {}
}) => {
  const [hoveredPart, setHoveredPart] = useState<string | null>(null);
  const [showPrintDialog, setShowPrintDialog] = useState(false);

  // Helper: Check if text matches a part ID
  const textMatchesPartId = (text: string | null | undefined, partId: string) => {
    if (!text) return false;
    const t = text.toLowerCase();

    const mapped = mapInspectionTypeToPartId({ title: text });
    if (mapped && mapped === partId) return true;

    const partKeywords: Record<string, string[]> = {
      'hood': ['hood', 'bonnet', '후드', '본네트'],
      'front_bumper': ['front bumper', 'f bumper', '프론트 범퍼', '앞범퍼'],
      'rear_bumper': ['rear bumper', 'r bumper', '리어 범퍼', '뒷범퍼'],
      'trunk': ['trunk', 'boot', 'tailgate', 'decklid', '트렁크', '트렁크리드'],
      'front_left_door': ['front left door', 'fl door', 'lh front door', '운전석 앞문', '좌측전면도어', '프론트 좌도어'],
      'front_right_door': ['front right door', 'fr door', 'rh front door', '조수석 앞문', '우측전면도어', '프론트 우도어'],
      'rear_left_door': ['rear left door', 'rl door', 'lh rear door', '운전석 뒷문', '좌측후면도어', '리어 좌도어'],
      'rear_right_door': ['rear right door', 'rr door', 'rh rear door', '조수석 뒷문', '우측후면도어', '리어 우도어'],
      'left_fender': ['left fender', 'lh fender', '좌측 펜더', '좌측전면휀더', '프론트 좌휀더'],
      'right_fender': ['right fender', 'rh fender', '우측 펜더', '우측전면휀더', '프론트 우휀더'],
      'left_quarter': ['left quarter', 'lh quarter', '좌측 쿼터', '좌측후면휀더'],
      'right_quarter': ['right quarter', 'rh quarter', '우측 쿼터', '우측후면휀더'],
      'roof': ['roof', 'top', '루프', '천장'],
      'windshield': ['windshield', 'front glass', '앞유리', '전면유리'],
      'rear_glass': ['rear glass', 'back glass', '뒷유리', '후면유리'],
      'side_sill_left': ['left sill', 'lh sill', 'left rocker', '좌측 사이드실'],
      'side_sill_right': ['right sill', 'rh sill', 'right rocker', '우측 사이드실'],
      'fl_wheel': ['front left wheel', 'fl wheel', '좌측전륜', '앞휠하우스'],
      'fr_wheel': ['front right wheel', 'fr wheel', '우측전륜', '앞휠하우스'],
      'rl_wheel': ['rear left wheel', 'rl wheel', '좌측후륜', '뒤휠하우스'],
      'rr_wheel': ['rear right wheel', 'rr wheel', '우측후륜', '뒤휠하우스'],
    };

    const keywords = partKeywords[partId] || [];
    return keywords.some(kw => t.includes(kw));
  };

  // Check if an inspection item matches a part ID
  const itemMatchesPart = (item: InspectionItem, partId: string) => {
    if (!item) return false;
    if (item.mappedPartId && item.mappedPartId === partId) return true;

    const mappedFromType = mapInspectionTypeToPartId(item.type);
    if (mappedFromType && mappedFromType === partId) return true;

    if (textMatchesPartId(item.type?.code, partId)) return true;
    if (textMatchesPartId(item.type?.title, partId)) return true;

    return item.attributes?.some((attr) => textMatchesPartId(attr, partId)) ?? false;
  };

  // Get status for a specific part
  const getPartStatus = (partId: string): 'normal' | 'repair' | 'exchange' => {
    for (const item of inspectionData) {
      const matches = itemMatchesPart(item, partId);
      if (!matches) continue;

      const codes = item.statusTypes?.map(s => String(s.code || '').toUpperCase().trim()) || [];
      const titles = item.statusTypes?.map(s => String(s.title || '').toLowerCase()) || [];

      // Check for replacement/exchange
      if (codes.some(c => c === 'X' || c === '2') || 
          titles.some(t => t.includes('exchange') || t.includes('replacement') || t.includes('교환'))) {
        return 'exchange';
      }

      // Check for welding/repair
      if (codes.some(c => c === 'W' || c === '3' || c === 'A' || c === '1') ||
          titles.some(t => t.includes('weld') || t.includes('repair') || t.includes('용접') || t.includes('수리'))) {
        return 'repair';
      }
    }
    return 'normal';
  };

  // Get status for a part category (checks all partIds in the category)
  const getPartCategoryStatus = (partIds: string[]): 'normal' | 'repair' | 'exchange' => {
    let hasExchange = false;
    let hasRepair = false;

    for (const partId of partIds) {
      const status = getPartStatus(partId);
      if (status === 'exchange') hasExchange = true;
      if (status === 'repair') hasRepair = true;
    }

    if (hasExchange) return 'exchange';
    if (hasRepair) return 'repair';
    return 'normal';
  };

  // Calculate counts
  const exchangeCount = inspectionData.filter(item => {
    const codes = item.statusTypes?.map(s => String(s.code || '').toUpperCase()) || [];
    const titles = item.statusTypes?.map(s => String(s.title || '').toLowerCase()) || [];
    return codes.some(c => c === 'X' || c === '2') ||
      titles.some(t => t.includes('exchange') || t.includes('replacement') || t.includes('교환'));
  }).length;

  const repairCount = inspectionData.filter(item => {
    const codes = item.statusTypes?.map(s => String(s.code || '').toUpperCase()) || [];
    const titles = item.statusTypes?.map(s => String(s.title || '').toLowerCase()) || [];
    return (codes.some(c => c === 'W' || c === '3' || c === 'A' || c === '1') ||
      titles.some(t => t.includes('weld') || t.includes('repair') || t.includes('용접') || t.includes('수리'))) &&
      !codes.some(c => c === 'X' || c === '2');
  }).length;

  // Get all affected parts for print report
  const affectedParts = inspectionData
    .filter(item => {
      const codes = item.statusTypes?.map(s => String(s.code || '').toUpperCase()) || [];
      return codes.some(c => c === 'X' || c === '2' || c === 'W' || c === '3' || c === 'A' || c === '1');
    })
    .map(item => ({
      name: item.type?.title || '',
      status: getPartStatus(item.mappedPartId || ''),
    }));

  const renderStatusBadge = (status: 'normal' | 'repair' | 'exchange') => {
    if (status === 'exchange') {
      return <span className="text-destructive font-semibold">Zëvendësuar</span>;
    }
    if (status === 'repair') {
      return <span className="text-primary font-semibold">Riparuar</span>;
    }
    return <span className="text-muted-foreground">Normal</span>;
  };

  // Render damage indicators on diagram
  const renderDamageIndicators = (view: 'top' | 'bottom' | 'left' | 'right') => {
    const indicators: JSX.Element[] = [];
    
    // Define positions for each part on each view
    const partPositions: Record<string, { top?: string; left?: string; bottom?: string; right?: string }> = {
      // Top view positions
      hood: { top: '15%', left: '50%' },
      left_fender: { top: '20%', left: '20%' },
      right_fender: { top: '20%', right: '20%' },
      roof: { top: '50%', left: '50%' },
      trunk: { top: '85%', left: '50%' },
      front_left_door: { top: '40%', left: '15%' },
      front_right_door: { top: '40%', right: '15%' },
      rear_left_door: { top: '60%', left: '15%' },
      rear_right_door: { top: '60%', right: '15%' },
    };

    // Only show indicators for top view for now
    if (view !== 'top') return null;

    Object.entries(partPositions).forEach(([partId, position]) => {
      const status = getPartStatus(partId);
      if (status === 'normal') return;

      const color = status === 'exchange' ? 'rgb(239, 68, 68)' : 'rgb(59, 130, 246)';
      
      indicators.push(
        <div
          key={partId}
          className="absolute transform -translate-x-1/2 -translate-y-1/2 pointer-events-none"
          style={{
            top: position.top,
            left: position.left,
            right: position.right,
            bottom: position.bottom,
          }}
        >
          <svg width="60" height="60" className="animate-pulse">
            <circle
              cx="30"
              cy="30"
              r="25"
              fill={color}
              fillOpacity="0.2"
              stroke={color}
              strokeWidth="3"
              strokeDasharray="5,5"
            />
            <text
              x="30"
              y="35"
              textAnchor="middle"
              fill={color}
              fontSize="20"
              fontWeight="bold"
            >
              {status === 'exchange' ? 'X' : 'W'}
            </text>
          </svg>
        </div>
      );
    });

    return indicators;
  };

  return (
    <div className={`w-full ${className}`}>
      {/* Header with Title and Print Button */}
      <div className="mb-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-foreground">Diagnostikimi i kornizës dhe panelit të jashtëm</h2>
          <Dialog open={showPrintDialog} onOpenChange={setShowPrintDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <Printer className="h-4 w-4" />
                Printo raportin
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Raport inspektimi për printim</DialogTitle>
              </DialogHeader>
              <PrintableInspectionReport
                inspectionData={inspectionData}
                carInfo={carInfo}
                affectedParts={affectedParts as any}
              />
              <div className="mt-4 flex justify-end gap-2 no-print">
                <Button variant="outline" onClick={() => setShowPrintDialog(false)}>
                  Mbyll
                </Button>
                <Button onClick={() => window.print()}>
                  <Printer className="h-4 w-4 mr-2" />
                  Printo
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Accident Summary - Permbledhja e Aksidentit */}
        <div className="space-y-3">
          <div className="bg-muted/30 rounded-lg p-4 border border-border">
            <h3 className="font-semibold text-lg mb-3 text-center">Permbledhja e Aksidentit</h3>
            
            {/* Main Status */}
            <div className="text-center py-3 bg-background rounded-lg mb-4 border border-border">
              <p className="text-lg">
                Rezultati për veturën {carInfo.year || carInfo.vin || 'N/A'}{' '}
                <span className={`font-bold ${
                  exchangeCount === 0 && repairCount === 0 ? 'text-success' : 'text-destructive'
                }`}>
                  {exchangeCount === 0 && repairCount === 0 ? 'Pa aksident' : 'Me aksident të regjistruar'}
                </span>
              </p>
            </div>

            {/* Detailed Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {/* Total Parts Checked */}
              <div className="bg-background rounded-lg p-3 text-center border border-border">
                <div className="text-2xl font-bold text-foreground">
                  {FRAME_PARTS.length + EXTERNAL_PANEL_PARTS.length}
                </div>
                <div className="text-xs text-muted-foreground mt-1">Pjesë të kontrolluara</div>
              </div>

              {/* Normal Parts */}
              <div className="bg-background rounded-lg p-3 text-center border border-border">
                <div className="text-2xl font-bold text-success">
                  {(FRAME_PARTS.length + EXTERNAL_PANEL_PARTS.length) - exchangeCount - repairCount}
                </div>
                <div className="text-xs text-muted-foreground mt-1">Normale</div>
              </div>

              {/* Repaired Parts */}
              <div className="bg-background rounded-lg p-3 text-center border border-primary/50">
                <div className="text-2xl font-bold text-primary flex items-center justify-center gap-1">
                  {repairCount}
                  <div className="w-3 h-3 rounded-full bg-primary"></div>
                </div>
                <div className="text-xs text-muted-foreground mt-1">Riparuar/Salduar</div>
              </div>

              {/* Replaced Parts */}
              <div className="bg-background rounded-lg p-3 text-center border border-destructive/50">
                <div className="text-2xl font-bold text-destructive flex items-center justify-center gap-1">
                  {exchangeCount}
                  <div className="w-3 h-3 rounded-full bg-destructive"></div>
                </div>
                <div className="text-xs text-muted-foreground mt-1">Zëvendësuar</div>
              </div>
            </div>

            {/* Category Breakdown */}
            <div className="grid grid-cols-2 gap-4 mt-4">
              {/* Frame Status */}
              <div className="bg-background rounded-lg p-3 border border-border">
                <div className="font-semibold text-sm mb-2">Korniza</div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Gjendja:</span>
                  <span className={`text-sm font-semibold ${
                    FRAME_PARTS.every(p => getPartCategoryStatus(p.partIds) === 'normal') 
                      ? 'text-success' 
                      : 'text-destructive'
                  }`}>
                    {FRAME_PARTS.every(p => getPartCategoryStatus(p.partIds) === 'normal') 
                      ? 'Normale' 
                      : 'Me dëmtime'}
                  </span>
                </div>
              </div>

              {/* External Panel Status */}
              <div className="bg-background rounded-lg p-3 border border-border">
                <div className="font-semibold text-sm mb-2">Paneli i Jashtëm</div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Gjendja:</span>
                  <span className={`text-sm font-semibold ${
                    EXTERNAL_PANEL_PARTS.every(p => getPartCategoryStatus(p.partIds) === 'normal') 
                      ? 'text-success' 
                      : 'text-destructive'
                  }`}>
                    {EXTERNAL_PANEL_PARTS.every(p => getPartCategoryStatus(p.partIds) === 'normal') 
                      ? 'Normale' 
                      : 'Me dëmtime'}
                  </span>
                </div>
              </div>
            </div>

            {/* Legend */}
            <div className="mt-4 pt-3 border-t border-border">
              <div className="flex items-center justify-center gap-6 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-primary border-2 border-primary"></div>
                  <span className="text-muted-foreground">Riparuar (W)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-destructive border-2 border-destructive"></div>
                  <span className="text-muted-foreground">Zëvendësuar (X)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Car Diagram - 2 views - LARGER */}
      <div className="mb-6 border border-border rounded-lg overflow-hidden bg-background">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
          {/* Outside View (Jasht) */}
          <div className="border-b md:border-b-0 md:border-r border-border">
            <div className="relative w-full bg-muted/10 p-8" style={{ minHeight: '400px' }}>
              <img 
                src={carDiagramTop} 
                alt="Pamja nga jashtë" 
                className="w-full h-full object-contain"
              />
              <div className="absolute top-4 left-4 bg-background/90 px-3 py-2 rounded text-sm font-semibold border border-border">
                Jashtë
              </div>
              {renderDamageIndicators('top')}
            </div>
          </div>

          {/* Inside View (Mbrenda) */}
          <div>
            <div className="relative w-full bg-muted/10 p-8" style={{ minHeight: '400px' }}>
              <img 
                src={carDiagramBottom} 
                alt="Pamja nga brenda" 
                className="w-full h-full object-contain"
              />
              <div className="absolute top-4 left-4 bg-background/90 px-3 py-2 rounded text-sm font-semibold border border-border">
                Brenda
              </div>
              {renderDamageIndicators('bottom')}
            </div>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="border-t border-border bg-background px-6 py-4">
          <div className="flex items-center justify-center gap-8 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-primary"></div>
              <span className="text-muted-foreground">Riparime/Saldim</span>{' '}
              <span className="font-bold text-foreground">{repairCount}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-destructive"></div>
              <span className="text-muted-foreground">Zëvendësime</span>{' '}
              <span className="font-bold text-destructive">{exchangeCount}</span>
            </div>
          </div>
        </div>

        {/* Tab Buttons */}
        <div className="border-t border-border flex">
          <Tabs defaultValue="frame" className="w-full">
            <TabsList className="w-full grid grid-cols-2 rounded-none h-auto">
              <TabsTrigger value="frame" className="rounded-none border-r border-border py-3 data-[state=active]:bg-muted">
                Korniza{' '}
                <span className={`font-semibold ml-1 ${
                  FRAME_PARTS.some(p => getPartCategoryStatus(p.partIds) !== 'normal') 
                    ? 'text-destructive' 
                    : 'text-primary'
                }`}>
                  {FRAME_PARTS.some(p => getPartCategoryStatus(p.partIds) !== 'normal') ? 'Me dëmtime' : 'Normal'}
                </span>
              </TabsTrigger>
              <TabsTrigger value="external" className="rounded-none py-3 data-[state=active]:bg-muted">
                Paneli i jashtëm{' '}
                <span className={`font-semibold ml-1 ${
                  EXTERNAL_PANEL_PARTS.some(p => getPartCategoryStatus(p.partIds) !== 'normal') 
                    ? 'text-destructive' 
                    : 'text-primary'
                }`}>
                  {EXTERNAL_PANEL_PARTS.some(p => getPartCategoryStatus(p.partIds) !== 'normal') ? 'Me dëmtime' : 'Normal'}
                </span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="frame" className="mt-0 border-t border-border">
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Frame Column */}
                  <div>
                    <h3 className="font-semibold mb-4 text-lg">Korniza</h3>
                    <div className="space-y-3">
                      {FRAME_PARTS.map((part, index) => (
                        <div 
                          key={index}
                          className="flex items-center justify-between py-2 border-b border-border last:border-b-0"
                        >
                          <span className="text-muted-foreground text-sm">{part.albanian}</span>
                          {renderStatusBadge(getPartCategoryStatus(part.partIds))}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* External Panel Column */}
                  <div>
                    <h3 className="font-semibold mb-4 text-lg">Paneli i jashtëm</h3>
                    <div className="space-y-3">
                      {EXTERNAL_PANEL_PARTS.map((part, index) => (
                        <div 
                          key={index}
                          className="flex items-center justify-between py-2 border-b border-border last:border-b-0"
                        >
                          <span className="text-muted-foreground text-sm">{part.albanian}</span>
                          {renderStatusBadge(getPartCategoryStatus(part.partIds))}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="external" className="mt-0 border-t border-border">
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* External Panel Column */}
                  <div>
                    <h3 className="font-semibold mb-4 text-lg">Paneli i jashtëm</h3>
                    <div className="space-y-3">
                      {EXTERNAL_PANEL_PARTS.map((part, index) => (
                        <div 
                          key={index}
                          className="flex items-center justify-between py-2 border-b border-border last:border-b-0"
                        >
                          <span className="text-muted-foreground text-sm">{part.albanian}</span>
                          {renderStatusBadge(getPartCategoryStatus(part.partIds))}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Frame Column */}
                  <div>
                    <h3 className="font-semibold mb-4 text-lg">Korniza</h3>
                    <div className="space-y-3">
                      {FRAME_PARTS.map((part, index) => (
                        <div 
                          key={index}
                          className="flex items-center justify-between py-2 border-b border-border last:border-b-0"
                        >
                          <span className="text-muted-foreground text-sm">{part.albanian}</span>
                          {renderStatusBadge(getPartCategoryStatus(part.partIds))}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default CarInspectionDiagram;
