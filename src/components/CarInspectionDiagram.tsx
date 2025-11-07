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
  { korean: '프론트 패널 / 인사이드 패널', english: 'Front panel / inside panel', partIds: ['front_panel', 'inside_panel'] },
  { korean: '앞/뒤 휠하우스', english: 'Front/rear wheelhouse', partIds: ['fl_wheel', 'fr_wheel', 'rl_wheel', 'rr_wheel'] },
  { korean: 'A,B필러패널 / 대시패널 / 플로어패널', english: 'A,B filler panel / dash panel / floor panel', partIds: ['a_pillar', 'b_pillar', 'dash_panel', 'floor_panel'] },
  { korean: '사이드실 패널 / 쿼터패널', english: 'Sideroom panel / quarter panel', partIds: ['side_sill_left', 'side_sill_right', 'left_quarter', 'right_quarter'] },
  { korean: '리어패널 / 트렁크 플로어', english: 'Rear panel / trunk floor', partIds: ['rear_panel', 'trunk'] },
  { korean: '사이드멤버 / 후프패탈 / 패키지트레이', english: 'Side member / hoop pattal / package tray', partIds: ['side_member', 'package_tray'] },
];

const EXTERNAL_PANEL_PARTS = [
  { korean: '후드', english: 'Hood', partIds: ['hood'] },
  { korean: '프론트 휀더', english: 'Front fender', partIds: ['left_fender', 'right_fender'] },
  { korean: '프론트 도어', english: 'Front door', partIds: ['front_left_door', 'front_right_door'] },
  { korean: '리어 도어', english: 'Rear door', partIds: ['rear_left_door', 'rear_right_door'] },
  { korean: '트렁크 리드', english: 'Trunk lid', partIds: ['trunk'] },
  { korean: '루프', english: 'Roof', partIds: ['roof'] },
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
      return <span className="text-destructive font-semibold">교환</span>;
    }
    if (status === 'repair') {
      return <span className="text-primary font-semibold">교환</span>;
    }
    return <span className="text-muted-foreground">정상</span>;
  };

  return (
    <div className={`w-full ${className}`}>
      {/* Header with Title and Print Button */}
      <div className="mb-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-foreground">프레임 및 외부패널 진단</h2>
          <Dialog open={showPrintDialog} onOpenChange={setShowPrintDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
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
                affectedParts={affectedParts as any}
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

        {/* Subtitle with result */}
        <div className="text-center py-3 bg-muted/30 rounded-lg">
          <p className="text-lg">
            {carInfo.year || '46무0511'} 차량의 진단 결과{' '}
            <span className="font-bold text-primary">무사고 차량입니다</span>
          </p>
        </div>
      </div>

      {/* Car Diagram - 4 views */}
      <div className="mb-6 border border-border rounded-lg overflow-hidden bg-background">
        <div className="grid grid-cols-4 gap-0">
          {/* Left Side */}
          <div className="border-r border-border">
            <div className="relative aspect-square bg-muted/10 p-4">
              <img 
                src={carDiagramTop} 
                alt="Left side view" 
                className="w-full h-full object-contain"
              />
              {/* Badge overlay for left side if needed */}
            </div>
          </div>

          {/* Top View */}
          <div className="border-r border-border">
            <div className="relative aspect-square bg-muted/10 p-4">
              <img 
                src={carDiagramTop} 
                alt="Top view" 
                className="w-full h-full object-contain"
              />
              {/* Hood badge */}
              {getPartStatus('hood') !== 'normal' && (
                <div 
                  className="absolute top-[20%] left-1/2 transform -translate-x-1/2 -translate-y-1/2"
                  onMouseEnter={() => setHoveredPart('hood')}
                  onMouseLeave={() => setHoveredPart(null)}
                >
                  <div className={`flex items-center justify-center w-8 h-8 rounded-full font-bold text-white text-sm shadow-lg border-2 border-white ${
                    getPartStatus('hood') === 'exchange' ? 'bg-destructive' : 'bg-primary'
                  }`}>
                    X
                  </div>
                </div>
              )}
              {/* Front fender badge */}
              {getPartStatus('left_fender') !== 'normal' && (
                <div 
                  className="absolute top-[15%] left-[15%] transform -translate-x-1/2 -translate-y-1/2"
                  onMouseEnter={() => setHoveredPart('left_fender')}
                  onMouseLeave={() => setHoveredPart(null)}
                >
                  <div className={`flex items-center justify-center w-8 h-8 rounded-full font-bold text-white text-sm shadow-lg border-2 border-white ${
                    getPartStatus('left_fender') === 'exchange' ? 'bg-destructive' : 'bg-primary'
                  }`}>
                    X
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Rear View */}
          <div className="border-r border-border">
            <div className="relative aspect-square bg-muted/10 p-4">
              <img 
                src={carDiagramBottom} 
                alt="Rear view" 
                className="w-full h-full object-contain"
              />
            </div>
          </div>

          {/* Right Side */}
          <div>
            <div className="relative aspect-square bg-muted/10 p-4">
              <img 
                src={carDiagramTop} 
                alt="Right side view" 
                className="w-full h-full object-contain transform scale-x-[-1]"
              />
            </div>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="border-t border-border bg-background px-6 py-4">
          <div className="flex items-center justify-center gap-8 text-sm">
            <div>
              <span className="text-muted-foreground">판금/용접</span>{' '}
              <span className="font-bold text-foreground">{repairCount}회</span>
            </div>
            <div>
              <span className="text-muted-foreground">교환</span>{' '}
              <span className="font-bold text-primary">{exchangeCount}회</span>
            </div>
          </div>
        </div>

        {/* Tab Buttons */}
        <div className="border-t border-border flex">
          <Tabs defaultValue="frame" className="w-full">
            <TabsList className="w-full grid grid-cols-2 rounded-none h-auto">
              <TabsTrigger value="frame" className="rounded-none border-r border-border py-3 data-[state=active]:bg-muted">
                프레임 <span className="text-primary font-semibold ml-1">정상</span>
              </TabsTrigger>
              <TabsTrigger value="external" className="rounded-none py-3 data-[state=active]:bg-muted">
                외부패널 <span className="text-destructive font-semibold ml-1">교환</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="frame" className="mt-0 border-t border-border">
              <div className="p-6">
                <div className="grid grid-cols-2 gap-6">
                  {/* External Panel Column */}
                  <div>
                    <h3 className="font-semibold mb-4 text-lg">외부패널</h3>
                    <div className="space-y-3">
                      {EXTERNAL_PANEL_PARTS.map((part, index) => (
                        <div 
                          key={index}
                          className="flex items-center justify-between py-2 border-b border-border last:border-b-0"
                        >
                          <span className="text-muted-foreground text-sm">{part.korean}</span>
                          {renderStatusBadge(getPartCategoryStatus(part.partIds))}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Frame Column */}
                  <div>
                    <h3 className="font-semibold mb-4 text-lg">프레임</h3>
                    <div className="space-y-3">
                      {FRAME_PARTS.map((part, index) => (
                        <div 
                          key={index}
                          className="flex items-center justify-between py-2 border-b border-border last:border-b-0"
                        >
                          <span className="text-muted-foreground text-sm">{part.korean}</span>
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
                <div className="grid grid-cols-2 gap-6">
                  {/* External Panel Column */}
                  <div>
                    <h3 className="font-semibold mb-4 text-lg">외부패널</h3>
                    <div className="space-y-3">
                      {EXTERNAL_PANEL_PARTS.map((part, index) => (
                        <div 
                          key={index}
                          className="flex items-center justify-between py-2 border-b border-border last:border-b-0"
                        >
                          <span className="text-muted-foreground text-sm">{part.korean}</span>
                          {renderStatusBadge(getPartCategoryStatus(part.partIds))}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Frame Column */}
                  <div>
                    <h3 className="font-semibold mb-4 text-lg">프레임</h3>
                    <div className="space-y-3">
                      {FRAME_PARTS.map((part, index) => (
                        <div 
                          key={index}
                          className="flex items-center justify-between py-2 border-b border-border last:border-b-0"
                        >
                          <span className="text-muted-foreground text-sm">{part.korean}</span>
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
