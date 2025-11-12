import React, { useState, useMemo, useCallback } from 'react';
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle, CheckCircle, XCircle, AlertCircle, Info } from "lucide-react";
import carDiagramTop from '@/assets/car-diagram-top.jpeg';
import carDiagramBottom from '@/assets/car-diagram-bottom.webp';
import { useIsMobile } from "@/hooks/use-mobile";
import { useViewportSize } from "@/hooks/use-viewport";

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

const BASE_MARKER_RADIUS = 4.5;
const BASE_MARKER_OUTER_RADIUS = 7;
const BASE_MARKER_STROKE_WIDTH = 1;
const BASE_MARKER_SPACING = 9;
const BASE_MARKER_FONT_SIZE = 7.5;

const POSITIVE_STATUS_CODES = new Set([
  "",
  "0",
  "G",
  "GOOD",
  "GOODNESS",
  "OK",
  "PASS",
  "NORMAL",
  "NONE",
  "◎",
  "◯",
]);

const POSITIVE_STATUS_KEYWORDS = [
  "good",
  "goodness",
  "ok",
  "okay",
  "normal",
  "fine",
  "pass",
  "none",
  "clear",
  "no issue",
  "no problem",
  "양호",
  "정상",
  "없음",
  "적정",
  "이상없음",
  "무사고",
];

// Precise marker positions aligned to actual diagram parts
const PRECISE_MARKER_POSITIONS: Record<string, { x: number; y: number }> = {
  hood: { x: 320, y: 125 },
  front_bumper: { x: 320, y: 40 },
  windshield: { x: 320, y: 215 },
  front_left_door: { x: 185, y: 252 },
  front_right_door: { x: 455, y: 252 },
  roof: { x: 320, y: 305 },
  rear_left_door: { x: 185, y: 372 },
  rear_right_door: { x: 455, y: 372 },
  rear_glass: { x: 320, y: 400 },
  trunk: { x: 320, y: 490 },
  rear_bumper: { x: 320, y: 580 },
  side_sill_left: { x: 185, y: 320 },
  side_sill_right: { x: 455, y: 320 },
  left_fender: { x: 175, y: 127 },
  right_fender: { x: 465, y: 127 },
  left_quarter: { x: 170, y: 490 },
  right_quarter: { x: 470, y: 490 },
  fl_wheel: { x: 30, y: 90 },
  fr_wheel: { x: 610, y: 90 },
  rl_wheel: { x: 30, y: 510 },
  rr_wheel: { x: 610, y: 510 }
};

export const CarInspectionDiagram: React.FC<CarInspectionDiagramProps> = ({ 
  inspectionData = [], 
  className = "" 
}) => {
  const [hoveredPart, setHoveredPart] = useState<string | null>(null);
  const [selectedPart, setSelectedPart] = useState<string | null>(null);
  const isMobile = useIsMobile();
  const { width: rawViewportWidth } = useViewportSize();
  const viewportWidth = Math.max(rawViewportWidth, 320);

  const markerScale = useMemo(() => {
    if (isMobile) {
      return 0.45;
    }
    if (viewportWidth < 1024) {
      return 0.68;
    }
    if (viewportWidth < 1440) {
      return 0.82;
    }
    return 0.9;
  }, [isMobile, viewportWidth]);

  const markerSizing = useMemo(() => {
    const spacing = Math.max(6, BASE_MARKER_SPACING * markerScale);

    return {
      radius: Math.max(2.6, BASE_MARKER_RADIUS * markerScale),
      outerRadius: Math.max(
        3.6,
        BASE_MARKER_OUTER_RADIUS * markerScale * (isMobile ? 0.85 : 1),
      ),
      strokeWidth: Math.max(0.7, BASE_MARKER_STROKE_WIDTH * markerScale),
      spacing,
      verticalOffset: spacing / 2.6,
      fontSize: Math.max(
        5.5,
        BASE_MARKER_FONT_SIZE * (isMobile ? 0.7 : markerScale),
      ),
    };
  }, [isMobile, markerScale]);

  // Enhanced car parts mapped to the actual diagram image positions
  const carParts = useMemo<CarPart[]>(() => {
    const parts: CarPart[] = [
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
    return parts.map((part) => {
      const precise = PRECISE_MARKER_POSITIONS[part.id];
      if (precise) {
        return { ...part, markerPos: precise };
      }
      if (!part.markerPos) {
        return { ...part, markerPos: part.labelPos };
      }
      return part;
    });
  }, []);

  // Helper: evaluate if an item's title targets a given part id
  const titleMatchesPart = useCallback((title: string, partId: string) => {
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
  }, []);

  const partStatusMap = useMemo(() => {
    const map = new Map<string, Array<{ code: string; title: string }>>();
    carParts.forEach((part) => map.set(part.id, []));

    if (!inspectionData || inspectionData.length === 0) {
      return map;
    }

    const deriveStatuses = (item: InspectionItem): Array<{ code: string; title: string }> => {
      const statuses: Array<{ code: string; title: string }> = Array.isArray(item?.statusTypes)
        ? [...item.statusTypes]
        : [];
      const attrs = Array.isArray((item as any)?.attributes)
        ? ((item as any).attributes as string[])
        : [];

      const hasHighRank = attrs.some(
        (attr) =>
          typeof attr === "string" &&
          (attr.includes("RANK_ONE") ||
            attr.includes("RANK_TWO") ||
            attr.includes("RANK_A") ||
            attr.includes("RANK_B") ||
            attr.includes("RANK_C"))
      );

      if (statuses.length === 0 && hasHighRank) {
        const low = (item?.type?.title || "").toString().toLowerCase();
        if (low.includes("exchange") || low.includes("replacement") || low.includes("교환")) {
          statuses.push({ code: "X", title: "Exchange (replacement)" });
        }
        if (low.includes("weld") || low.includes("sheet metal") || low.includes("용접")) {
          statuses.push({ code: "W", title: "Welding" });
        }
        if (low.includes("repair") || low.includes("수리")) {
          statuses.push({ code: "A", title: "Repair" });
        }
        if (low.includes("scratch") || low.includes("흠집")) {
          statuses.push({ code: "S", title: "Scratch" });
        }
        if (low.includes("corr") || low.includes("부식")) {
          statuses.push({ code: "U", title: "Corrosion" });
        }
      }

      return statuses;
    };

    inspectionData.forEach((item) => {
      const statuses = deriveStatuses(item);
      if (statuses.length === 0) {
        return;
      }

      const matchedIds = new Set<string>();
      const typeCode = (item?.type?.code || "").toString();
      if (typeCode && map.has(typeCode)) {
        matchedIds.add(typeCode);
      }

      const typeTitle = (item?.type?.title || "").toString();
      if (typeTitle) {
        carParts.forEach((part) => {
          if (titleMatchesPart(typeTitle, part.id)) {
            matchedIds.add(part.id);
          }
        });
      }

      matchedIds.forEach((id) => {
        const existing = map.get(id);
        if (existing) {
          existing.push(...statuses);
        }
      });
    });

    return map;
  }, [carParts, inspectionData, titleMatchesPart]);

  const getPartStatus = useCallback(
    (partId: string) => partStatusMap.get(partId) ?? [],
    [partStatusMap]
  );

const getStatusColor = (statuses: Array<{ code: string; title: string }>) => {
  if (statuses.length === 0) return 'hsl(142 76% 36%)'; // Green

  // Check status codes and titles (Korean and English)
  const hasExchange = statuses.some(
    (s) => s.code === 'X' || 
           s.code === 'N' || // N = Nderruar (Albanian for exchanged)
           s.title?.toLowerCase().includes('교환') || 
           s.title?.toLowerCase().includes('exchange') ||
           s.title?.toLowerCase().includes('replacement') ||
           s.title?.toLowerCase().includes('replaced')
  );
  const hasWelding = statuses.some(
    (s) => s.code === 'W' || 
           s.code === 'S' || // S = Saldim (Albanian for welding)
           s.title?.toLowerCase().includes('용접') || 
           s.title?.toLowerCase().includes('weld') ||
           s.title?.toLowerCase().includes('sheet metal')
  );
  const hasRepair = statuses.some(
    (s) => s.code === 'A' || 
           s.code === 'R' || // R = Riparuar (Albanian for repaired)
           s.title?.toLowerCase().includes('수리') || 
           s.title?.toLowerCase().includes('repair')
  );
  const hasCorrosion = statuses.some(
    (s) => s.code === 'U' || 
           s.code === 'K' || // K = Korrozion (Albanian for corrosion)
           s.title?.toLowerCase().includes('부식') || 
           s.title?.toLowerCase().includes('corr')
  );
  const hasScratch = statuses.some(
    (s) => s.code === 'S' || 
           s.title?.toLowerCase().includes('흠집') || 
           s.title?.toLowerCase().includes('scratch')
  );

  // RED for critical replacements/exchanges
  if (hasExchange) return 'hsl(0 84% 60%)';
  // BLUE for welding
  if (hasWelding) return 'hsl(217 91% 60%)';
  // ORANGE for repairs and corrosion
  if (hasRepair || hasCorrosion) return 'hsl(25 95% 53%)';
  // YELLOW for scratches
  if (hasScratch) return 'hsl(48 96% 53%)';

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

  const issueCount = useMemo(() => {
    if (!inspectionData || inspectionData.length === 0) {
      return {
        replacements: 0,
        welds: 0,
        repairs: 0,
        corrosion: 0,
        scratches: 0,
        good: 0,
      };
    }

    return inspectionData.reduce(
      (acc, item) => {
        const title = (item?.type?.title || "").toString().toLowerCase();
        const rawStatuses = Array.isArray(item?.statusTypes)
          ? item.statusTypes
          : [];
        const normalizedStatuses = rawStatuses
          .map((status: any) => {
            const codeValue =
              status?.code ??
              status?.value ??
              status?.status ??
              status?.type ??
              "";
            const code =
              codeValue !== null && codeValue !== undefined
                ? String(codeValue).toUpperCase()
                : "";
            const titleValue =
              status?.title ??
              status?.name ??
              status?.description ??
              status?.label ??
              status?.text ??
              "";
            const normalizedTitle =
              titleValue !== null && titleValue !== undefined
                ? String(titleValue).toLowerCase()
                : "";
            return { code, title: normalizedTitle };
          })
          .filter((status) => status.code || status.title);

        const codes = normalizedStatuses.map((status) => status.code);
        const textPool = [
          title,
          ...normalizedStatuses.map((status) => status.title),
        ].filter(Boolean);

        const attrs = Array.isArray((item as any)?.attributes)
          ? ((item as any).attributes as string[])
          : [];
        const hasRank = attrs.some(
          (attr) => typeof attr === "string" && attr.includes("RANK"),
        );

        const containsKeyword = (keywords: string[]) =>
          textPool.some((value) =>
            keywords.some((keyword) => value.includes(keyword)),
          );

        const hasExchange =
          codes.includes("X") ||
          codes.includes("N") ||
          containsKeyword(["exchange", "replacement", "replaced", "교환"]) ||
          (hasRank && title.includes("exchange"));

        const hasWeld =
          codes.includes("W") ||
          codes.includes("S") ||
          containsKeyword(["weld", "sheet metal", "용접"]);

        const hasRepair =
          codes.includes("A") ||
          codes.includes("R") ||
          containsKeyword(["repair", "수리"]);

        const hasCorrosion =
          codes.includes("U") ||
          codes.includes("K") ||
          containsKeyword(["corr", "corrosion", "부식"]);

        const hasScratch =
          codes.includes("S") ||
          containsKeyword(["scratch", "흠집", "찌그러짐", "dent"]);

        if (hasExchange) acc.replacements += 1;
        if (hasWeld) acc.welds += 1;
        if (hasRepair) acc.repairs += 1;
        if (hasCorrosion) acc.corrosion += 1;
        if (hasScratch) acc.scratches += 1;

        const hasPositive =
          normalizedStatuses.some((status) => {
            if (status.code && POSITIVE_STATUS_CODES.has(status.code)) {
              return true;
            }
            return POSITIVE_STATUS_KEYWORDS.some((keyword) =>
              status.title.includes(keyword),
            );
          }) ||
          POSITIVE_STATUS_KEYWORDS.some((keyword) => title.includes(keyword));

        if (
          hasPositive &&
          !hasExchange &&
          !hasWeld &&
          !hasRepair &&
          !hasCorrosion &&
          !hasScratch
        ) {
          acc.good += 1;
        }

        return acc;
      },
      {
        replacements: 0,
        welds: 0,
        repairs: 0,
        corrosion: 0,
        scratches: 0,
        good: 0,
      },
    );
  }, [inspectionData]);

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
                <div className="flex items-center justify-between p-1.5 rounded-lg" style={{backgroundColor: 'hsl(25 95% 53% / 0.1)'}}>
                  <span className="text-xs flex items-center gap-1">
                    <span className="inline-flex items-center justify-center w-4 h-4 rounded-full text-white text-[9px] font-bold shadow-sm" style={{backgroundColor: 'hsl(25 95% 53%)'}}>K</span>
                    Korrozion
                  </span>
                  <Badge className="font-mono text-xs" style={{backgroundColor: 'hsl(25 95% 53%)', color: 'white'}}>{issueCount.corrosion}</Badge>
                </div>
                <div className="flex items-center justify-between p-1.5 rounded-lg" style={{backgroundColor: 'hsl(142 76% 36% / 0.12)'}}>
                  <span className="text-xs flex items-center gap-1">
                    <span className="inline-flex items-center justify-center w-4 h-4 rounded-full text-white text-[9px] font-bold shadow-sm" style={{backgroundColor: 'hsl(142 76% 36%)'}}>O</span>
                    Zona të paprekura
                  </span>
                  <Badge className="font-mono text-xs" style={{backgroundColor: 'hsl(142 76% 36%)', color: 'white'}}>{issueCount.good}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

        </div>

        {/* Center - Car Diagram */}
        <div className="lg:col-span-2 flex flex-col items-center justify-center gap-4 p-4">
          <div className="relative w-full max-w-md">
            <img src={carDiagramTop} alt="Car Top View" className="w-full h-auto rounded-lg" />
            <svg viewBox="0 0 640 630" className="absolute inset-0 w-full h-full"  style={{pointerEvents: 'none'}}>
              <defs>
                <filter id="glow">
                  <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                  <feMerge>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>
              </defs>
              {/* Render clickable overlay parts with circular code markers */}
              {carParts.map((part) => {
                const statuses = getPartStatus(part.id);
                const color = getStatusColor(statuses);
                const isHovered = hoveredPart === part.id;
                const isSelected = selectedPart === part.id;
                
                return (
                  <g key={part.id}>
                    <path
                      d={part.path}
                      fill="transparent"
                      stroke={isSelected ? "hsl(var(--primary))" : "transparent"}
                      strokeWidth={isSelected ? 4 : 0}
                      className="cursor-pointer transition-all duration-200"
                      onMouseEnter={() => setHoveredPart(part.id)}
                      onMouseLeave={() => setHoveredPart(null)}
                      onClick={() => setSelectedPart(selectedPart === part.id ? null : part.id)}
                      style={{ pointerEvents: 'auto' }}
                    />

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

                            const hasPositive = statuses.some((status) => {
                              const code = (status.code || "").toString().toUpperCase();
                              if (POSITIVE_STATUS_CODES.has(code)) {
                                return true;
                              }
                              const title = (status.title || "").toString().toLowerCase();
                              return POSITIVE_STATUS_KEYWORDS.some((keyword) =>
                                title.includes(keyword),
                              );
                            });

                            const shouldShowOnlyPositive =
                              hasPositive &&
                              !hasExchange &&
                              !hasWeld &&
                              !hasRepair &&
                              !hasCorrosion &&
                              !hasScratch;

                            // Collect all markers to display
                            const markers: Array<{ char: string; color: string }> = [];
                            
                            if (hasExchange) markers.push({ char: 'N', color: 'hsl(0 84% 60%)' });
                            if (hasWeld) markers.push({ char: 'S', color: 'hsl(217 91% 60%)' });
                            if (hasRepair) markers.push({ char: 'R', color: 'hsl(25 95% 53%)' });
                            if (hasCorrosion) markers.push({ char: 'K', color: 'hsl(25 95% 53%)' });
                            if (hasScratch) markers.push({ char: 'G', color: 'hsl(48 96% 53%)' });
                            if (shouldShowOnlyPositive) {
                              markers.push({ char: 'O', color: 'hsl(142 76% 36%)' });
                            }

                            const n = markers.length;
                            const base = PRECISE_MARKER_POSITIONS[part.id] ?? part.markerPos ?? part.labelPos;
                            const spacing = markerSizing.spacing;

                            return markers.map((m, idx) => {
                              const offset = (idx - (n - 1) / 2) * spacing;
                              const cx = base.x + offset;
                              const cy =
                                base.y +
                                (n > 2 ? (idx % 2 === 0 ? -markerSizing.verticalOffset : markerSizing.verticalOffset) : 0);

                              return (
                                <g key={`${part.id}-mrk-${idx}`}>
                                  {/* Outer glow for better visibility */}
                                  <circle
                                    cx={cx}
                                    cy={cy}
                                    r={markerSizing.outerRadius}
                                    fill={m.color}
                                    fillOpacity={0.2}
                                    filter="url(#glow)"
                                  />
                                  {/* Main marker */}
                                  <circle
                                    cx={cx}
                                    cy={cy}
                                    r={markerSizing.radius}
                                    fill={m.color}
                                    fillOpacity={0.45}
                                    stroke={m.color}
                                    strokeWidth={markerSizing.strokeWidth}
                                    filter={isHovered || isSelected ? "url(#glow)" : undefined}
                                    className="transition-all duration-200"
                                  />
                                  <text
                                    x={cx}
                                    y={cy}
                                    textAnchor="middle"
                                    dominantBaseline="central"
                                    fontSize={markerSizing.fontSize}
                                    fontWeight={800}
                                    fill="white"
                                    className="pointer-events-none select-none"
                                    style={{
                                      textShadow: "1px 1px 3px rgba(0,0,0,0.6), 0 0 4px rgba(0,0,0,0.4)",
                                      paintOrder: "stroke fill",
                                    }}
                                    stroke={m.color}
                                    strokeWidth="0.75"
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
                        {part.name}
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
          
          {/* Bottom view diagram */}
          <div className="relative w-full max-w-md">
            <img src={carDiagramBottom} alt="Pamja poshtë e makinës" className="w-full h-auto rounded-lg" />
            <div className="absolute top-2 left-2 bg-background/80 backdrop-blur-sm px-2 py-1 rounded text-xs font-medium">
              Pamja nga poshtë
            </div>
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
