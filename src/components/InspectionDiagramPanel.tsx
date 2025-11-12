import React, { useState, useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Edit3, Save, X } from "lucide-react";
import { useAdminCheck } from "@/hooks/useAdminCheck";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import carDiagramFront from "@/assets/car-diagram-front-korean.png";
import carDiagramBack from "@/assets/car-diagram-back-korean.png";

interface DiagramMarker {
  x: number;
  y: number;
  type: "N" | "R"; // N = shift (replacement), R = Repair
  label: string;
  size?: number;
  originalLabel?: string;
}

interface InspectionDiagramPanelProps {
  outerInspectionData?: any[];
  className?: string;
}

const BASE_CANVAS_WIDTH = 640;
const BASE_CANVAS_HEIGHT = 600;
const DEFAULT_MARKER_SIZE = 8;
const MIN_MARKER_DIAMETER = 4;
const MAX_MARKER_DIAMETER = 10;
const MARKER_FONT_MIN = 3.5;
const MARKER_FONT_MAX = 5.5;
const MIN_MARKER_SCALE = 0.45;
const MAX_MARKER_SCALE = 1.1;
const COLLISION_SPACING_MULTIPLIER = 1.05;
const DIAGRAM_EDGE_PADDING = 16;

const clampValue = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

const replacementStatusCodes = new Set(["X", "N", "E", "T", "P", "Z", "B"]);
const repairStatusCodes = new Set([
  "A",
  "R",
  "W",
  "C",
  "D",
  "S",
  "U",
  "M",
  "L",
  "F",
  "P",
]);
const neutralStatusCodes = new Set(["", "0", "G", "GOOD"]);

const replacementKeywords = [
  "exchange",
  "replacement",
  "replaced",
  "swap",
  "교환",
  "교체",
  "대체",
];

const repairKeywords = [
  "repair",
  "repaired",
  "weld",
  "welding",
  "수리",
  "판금",
  "도색",
  "스크래치",
  "찌그러짐",
  "dent",
  "scratch",
  "paint",
  "refinish",
  "부식",
  "corrosion",
  "damage",
  "용접",
];

const neutralKeywords = [
  "normal",
  "good",
  "ok",
  "okay",
  "fine",
  "양호",
  "정상",
  "무사고",
  "goodness",
  "양호함",
  "정상임",
];

const diagramPartLabelMap: Record<string, string> = {};

const registerPartLabels = (keys: string[], label: string) => {
  keys.forEach((key) => {
    const normalized = key.trim();
    if (!normalized) return;
    diagramPartLabelMap[normalized] = label;
    diagramPartLabelMap[normalized.toLowerCase()] = label;
  });
};

registerPartLabels(["hood", "bonnet"], "Kapaku i motorit");
registerPartLabels(["front_panel"], "Paneli i përparmë");
registerPartLabels(["front_bumper"], "Parakolpi i përparmë");
registerPartLabels(["radiator_support"], "Mbajtësi i radiatorit");
registerPartLabels(["cowl_panel"], "Paneli i bazës së xhamit");

registerPartLabels(
  ["front_left_fender", "front_fender_left", "left_fender", "fender_left"],
  "Parafango i përparmë majtas",
);
registerPartLabels(
  ["front_left_door", "front_door_left", "door_front_left"],
  "Dera e përparme majtas",
);
registerPartLabels(
  ["rear_left_door", "rear_door_left", "door_rear_left"],
  "Dera e pasme majtas",
);
registerPartLabels(
  [
    "left_quarter_panel",
    "quarter_panel_left",
    "left_quarter",
    "quarter_left",
    "rear_fender_left",
    "left_rear_fender",
  ],
  "Paneli anësor i pasëm majtas",
);
registerPartLabels(
  ["side_sill_panel_left", "side_sill_left", "rocker_panel_left"],
  "Pragu anësor majtas",
);
registerPartLabels(
  ["side_room_panel_left", "side_panel_left"],
  "Paneli anësor i kabinës majtas",
);

registerPartLabels(
  ["front_right_fender", "front_fender_right", "right_fender", "fender_right"],
  "Parafango i përparmë djathtas",
);
registerPartLabels(
  ["front_right_door", "front_door_right"],
  "Dera e përparme djathtas",
);
registerPartLabels(
  ["rear_right_door", "rear_door_right", "rear_door_(right)_-_replacement"],
  "Dera e pasme djathtas",
);
registerPartLabels(
  [
    "right_quarter_panel",
    "quarter_panel_right",
    "right_quarter",
    "quarter_right",
  ],
  "Paneli anësor i pasëm djathtas",
);
registerPartLabels(
  ["side_sill_panel_right", "side_sill_right", "rocker_panel_right"],
  "Pragu anësor djathtas",
);

registerPartLabels(["roof", "roof_panel"], "Çatia");
registerPartLabels(["sunroof"], "Tavan panoramik");

registerPartLabels(["trunk", "trunk_lid", "deck_lid"], "Kapaku i bagazhit");
registerPartLabels(
  ["trunk_floor", "luggage_floor", "floor_trunk"],
  "Dyshemeja e bagazhit",
);
registerPartLabels(["rear_panel", "back_panel"], "Paneli i pasëm");
registerPartLabels(["rear_bumper", "back_bumper"], "Parakolpi i pasëm");

registerPartLabels(
  [
    "rear_wheel_house_left",
    "rear_wheelhouse_left",
    "wheel_house_rear_left",
    "wheelhouse_rear_left",
  ],
  "Hapësira e rrotës së pasme majtas",
);
registerPartLabels(
  [
    "rear_wheel_house_right",
    "rear_wheelhouse_right",
    "wheel_house_rear_right",
    "wheelhouse_rear_right",
  ],
  "Hapësira e rrotës së pasme djathtas",
);
registerPartLabels(
  ["front_wheel_house_left", "front_wheelhouse_left"],
  "Hapësira e rrotës së përparme majtas",
);
registerPartLabels(
  ["front_wheel_house_right", "front_wheelhouse_right"],
  "Hapësira e rrotës së përparme djathtas",
);

registerPartLabels(["front_cross_member"], "Traversa e përparme");
registerPartLabels(["rear_cross_member"], "Traversa e pasme");
registerPartLabels(["front_rail"], "Shina gjatësore e përparme");
registerPartLabels(["rear_rail"], "Shina gjatësore e pasme");

const diagramPartTokenTranslations: Record<string, string> = {
  front: "përparme",
  rear: "pasmë",
  left: "majtas",
  right: "djathtas",
  door: "derë",
  doors: "derë",
  fender: "parafango",
  quarter: "panel anësor",
  panel: "panel",
  side: "anësor",
  sill: "prag",
  rocker: "prag",
  roof: "çati",
  trunk: "bagazh",
  floor: "dysheme",
  luggage: "bagazh",
  wheel: "rrotës",
  house: "hapësirë",
  member: "traversë",
  cross: "traversë",
  rail: "shinë",
  support: "mbajtës",
  radiator: "radiator",
  cowl: "panel cowl",
  sunroof: "tavan panoramik",
  deck: "kapak bagazhi",
  back: "pasmë",
  hood: "kapak motori",
  bonnet: "kapak motori",
};

const buildLabelFromKey = (input?: string | null) => {
  if (!input) return "";
  const normalized = input
    .toString()
    .toLowerCase()
    .replace(/[()]/g, " ")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!normalized) return "";
  const tokens = normalized.split(" ").filter(Boolean);
  if (tokens.length === 0) return "";

  const translatedTokens = tokens
    .map((token) => diagramPartTokenTranslations[token] ?? token)
    .filter(Boolean);

  if (translatedTokens.length === 0) return "";

  const label = translatedTokens.join(" ").replace(/\s+/g, " ").trim();
  if (!label) return "";
  return label.charAt(0).toUpperCase() + label.slice(1);
};

const getDiagramPartLabel = (
  key: string | null | undefined,
  fallback?: string,
) => {
  if (key) {
    const direct =
      diagramPartLabelMap[key] || diagramPartLabelMap[key.toLowerCase()];
    if (direct) return direct;
    const built = buildLabelFromKey(key);
    if (built) return built;
  }

  if (fallback) {
    const directFallback =
      diagramPartLabelMap[fallback] ||
      diagramPartLabelMap[fallback.toLowerCase()];
    if (directFallback) return directFallback;
    const builtFallback = buildLabelFromKey(fallback);
    if (builtFallback) return builtFallback;
    return fallback;
  }

  return key ?? "";
};

const aliasMatchers: Array<{ pattern: RegExp; key: string }> = [
  { pattern: /(front\s*)?door.*(left|\blh\b)/i, key: "front_left_door" },
  { pattern: /(front\s*)?door.*(right|\brh\b)/i, key: "front_right_door" },
  { pattern: /rear\s*door.*(left|\blh\b)/i, key: "rear_left_door" },
  { pattern: /rear\s*door.*(right|\brh\b)/i, key: "rear_right_door" },
  {
    pattern: /(quarter\s*panel|quarter).*\b(left|lh)\b/i,
    key: "left_quarter_panel",
  },
  {
    pattern: /(quarter\s*panel|quarter).*\b(right|rh)\b/i,
    key: "right_quarter_panel",
  },
  { pattern: /(front\s*)?fender.*(left|\blh\b)/i, key: "front_left_fender" },
  { pattern: /(front\s*)?fender.*(right|\brh\b)/i, key: "front_right_fender" },
  { pattern: /(좌|왼).*(앞|전).*(도어)/, key: "front_left_door" },
  { pattern: /(우|오).*(앞|전).*(도어)/, key: "front_right_door" },
  { pattern: /(좌|왼).*(뒤|후).*(도어)/, key: "rear_left_door" },
  { pattern: /(우|오).*(뒤|후).*(도어)/, key: "rear_right_door" },
  { pattern: /(좌|왼).*(쿼터|휀다|펜더)/, key: "left_quarter_panel" },
  { pattern: /(우|오).*(쿼터|휀다|펜더)/, key: "right_quarter_panel" },
  { pattern: /(앞|전).*(범퍼)/, key: "front_bumper" },
  { pattern: /(뒤|후).*(범퍼)/, key: "rear_bumper" },
  { pattern: /(루프|지붕)/, key: "roof" },
  { pattern: /(트렁크)/, key: "trunk" },
  { pattern: /(사이드\s*실|사이드실).*(좌|왼)/, key: "side_sill_panel_left" },
  { pattern: /(사이드\s*실|사이드실).*(우|오)/, key: "side_sill_panel_right" },
  { pattern: /(휠하우스).*(뒤|후).*(좌|왼)/, key: "rear_wheel_house_left" },
  { pattern: /(휠하우스).*(뒤|후).*(우|오)/, key: "rear_wheel_house_right" },
  { pattern: /(휠하우스).*(앞|전).*(좌|왼)/, key: "front_wheel_house_left" },
  { pattern: /(휠하우스).*(앞|전).*(우|오)/, key: "front_wheel_house_right" },
  { pattern: /(앞|전).*(보닛|본넷|후드)/, key: "hood" },
  { pattern: /(radiator|support)/i, key: "radiator_support" },
  { pattern: /(cowl|카울)/i, key: "cowl_panel" },
];

const normalizeForMatching = (input: string) => {
  if (!input) return "";
  let normalized = input.toString().toLowerCase();

  const replacements = [
    { pattern: /좌|왼/g, value: " left " },
    { pattern: /우|오/g, value: " right " },
    { pattern: /앞|전/g, value: " front " },
    { pattern: /뒤|후/g, value: " rear " },
    { pattern: /도어/g, value: " door " },
    { pattern: /휀다|펜더/g, value: " fender " },
    { pattern: /쿼터/g, value: " quarter " },
    { pattern: /범퍼/g, value: " bumper " },
    { pattern: /트렁크/g, value: " trunk " },
    { pattern: /보닛|본넷|후드/g, value: " hood " },
    { pattern: /루프|지붕/g, value: " roof " },
    { pattern: /휠하우스/g, value: " wheel house " },
    { pattern: /사이드\s*실|사이드실/g, value: " side sill " },
    { pattern: /라디에이터/g, value: " radiator " },
    { pattern: /서포트/g, value: " support " },
    { pattern: /\bfl\b/g, value: " front left " },
    { pattern: /\bfr\b/g, value: " front right " },
    { pattern: /\brl\b/g, value: " rear left " },
    { pattern: /\brr\b/g, value: " rear right " },
    { pattern: /\blh\b/g, value: " left " },
    { pattern: /\brh\b/g, value: " right " },
    { pattern: /\bqtr\b/g, value: " quarter " },
    { pattern: /\bfrm\b/g, value: " front member " },
    { pattern: /\brrm\b/g, value: " rear member " },
    { pattern: /panl/g, value: " panel " },
  ];

  replacements.forEach(({ pattern, value }) => {
    normalized = normalized.replace(pattern, value);
  });

  normalized = normalized
    .replace(/(front|rear)(door|fender|quarter|bumper|panel|floor)/g, "$1 $2")
    .replace(/(left|right)(door|fender|quarter|sill|panel)/g, "$1 $2")
    .replace(
      /(door|fender|quarter|bumper|panel|sill|wheel)(left|right)/g,
      "$1 $2",
    );

  normalized = normalized
    .replace(/[_-]/g, " ")
    .replace(/\(.*?\)/g, " ")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return normalized;
};

const computeTokenScore = (a: string, b: string) => {
  if (!a || !b) return 0;
  if (a === b) return 1000;
  const tokensA = Array.from(new Set(a.split(" ").filter(Boolean)));
  const tokensB = Array.from(new Set(b.split(" ").filter(Boolean)));
  if (tokensA.length === 0 || tokensB.length === 0) return 0;

  let score = 0;
  tokensA.forEach((token) => {
    if (tokensB.includes(token)) {
      score += token.length * 20;
    }
  });

  if (
    tokensA.every((token) => tokensB.includes(token)) ||
    tokensB.every((token) => tokensA.includes(token))
  ) {
    score += 150;
  }

  return score;
};

const findAliasMatch = (value: string | undefined | null) => {
  if (!value) return null;
  for (const { pattern, key } of aliasMatchers) {
    if (pattern.test(value)) {
      return key;
    }
  }
  return null;
};

const containsKeyword = (
  value: string | undefined | null,
  keywords: string[],
) => {
  if (value === undefined || value === null) return false;
  const normalizedValue = value.toString().toLowerCase();
  return keywords.some((keyword) =>
    normalizedValue.includes(keyword.toLowerCase()),
  );
};

const collectStatusEntries = (item: any) => {
  const statuses: Array<{ code?: string; title?: string }> = [];

  const pushStatus = (status: any) => {
    if (!status) return;
    if (typeof status === "string" || typeof status === "number") {
      statuses.push({ title: String(status) });
      return;
    }
    if (typeof status === "object") {
      const code =
        status.code ??
        status.status ??
        status.value ??
        status.type ??
        status.result;
      const title =
        status.title ??
        status.name ??
        status.label ??
        status.description ??
        status.desc ??
        status.statusTitle;
      if (code !== undefined || title !== undefined) {
        statuses.push({
          code: code !== undefined ? String(code) : undefined,
          title: title !== undefined ? String(title) : undefined,
        });
      }
    }
  };

  const candidates = [
    item?.statusTypes,
    item?.statusType,
    (item as any)?.status_types,
    (item as any)?.status_type,
    item?.status,
    (item as any)?.status_detail,
    (item as any)?.statusDetails,
  ];

  candidates.forEach((candidate) => {
    if (!candidate) return;
    if (Array.isArray(candidate)) {
      candidate.forEach(pushStatus);
    } else {
      pushStatus(candidate);
    }
  });

  return statuses;
};

const extractAttributeStrings = (attributes: any[]): string[] => {
  if (!Array.isArray(attributes)) return [];
  const collected: string[] = [];
  attributes.forEach((attr) => {
    if (!attr) return;
    if (typeof attr === "string") {
      collected.push(attr);
    } else if (typeof attr === "object") {
      const candidates = [
        attr.title,
        attr.name,
        attr.label,
        attr.code,
        attr.value,
        attr.description,
        (attr as any)?.desc,
      ];
      candidates.forEach((candidate) => {
        if (candidate !== undefined && candidate !== null && candidate !== "") {
          collected.push(String(candidate));
        }
      });
    } else {
      collected.push(String(attr));
    }
  });
  return collected;
};

// Map inspection items to diagram positions
const mapInspectionToMarkers = (
  inspectionData: any[],
): { within: DiagramMarker[]; out: DiagramMarker[] } => {
  const withinMarkers: DiagramMarker[] = [];
  const outMarkers: DiagramMarker[] = [];

  if (!inspectionData || inspectionData.length === 0) {
    return { within: withinMarkers, out: outMarkers };
  }

  // Enhanced position mapping with accurate coordinates and aliases
  const positionMap: Record<
    string,
    { panel: "within" | "out"; x: number; y: number; size?: number }
  > = {
    // ===== WITHIN PANEL (Top/Side View) =====

    // Front section
    hood: { panel: "within", x: 320, y: 168 },
    bonnet: { panel: "within", x: 320, y: 168 },
    front_panel: { panel: "within", x: 320, y: 104 },
    front_bumper: { panel: "within", x: 320, y: 48 },
    radiator_support: { panel: "within", x: 320, y: 170 },
    cowl_panel: { panel: "within", x: 320, y: 200 },

    // Left side (driver side in Korean cars) - EXACT POSITIONS FROM REFERENCE IMAGE
    front_left_fender: { panel: "within", x: 186, y: 205 },
    front_fender_left: { panel: "within", x: 186, y: 205 },
    left_fender: { panel: "within", x: 186, y: 205 },
    fender_left: { panel: "within", x: 186, y: 205 },

    front_left_door: { panel: "within", x: 214, y: 292, size: 12 },
    front_door_left: { panel: "within", x: 214, y: 292, size: 12 },
    door_front_left: { panel: "within", x: 214, y: 292, size: 12 },

    rear_left_door: { panel: "within", x: 178, y: 357 },
    rear_door_left: { panel: "within", x: 178, y: 357 },
    door_rear_left: { panel: "within", x: 178, y: 357 },

    left_quarter_panel: { panel: "within", x: 173, y: 429 },
    quarter_panel_left: { panel: "within", x: 173, y: 429 },
    left_quarter: { panel: "within", x: 173, y: 429 },
    quarter_left: { panel: "within", x: 173, y: 429 },
    rear_fender_left: { panel: "within", x: 173, y: 429 },
    left_rear_fender: { panel: "within", x: 173, y: 429 },

    side_sill_panel_left: { panel: "within", x: 290, y: 510 },
    side_sill_left: { panel: "within", x: 290, y: 510 },
    rocker_panel_left: { panel: "within", x: 290, y: 510 },
    side_room_panel_left: { panel: "within", x: 176, y: 317 },
    side_panel_left: { panel: "within", x: 176, y: 317 },

    // Right side (passenger side)
    front_right_fender: { panel: "within", x: 454, y: 205 },
    front_fender_right: { panel: "within", x: 454, y: 205 },
    right_fender: { panel: "within", x: 454, y: 205 },
    fender_right: { panel: "within", x: 454, y: 205 },

    front_right_door: { panel: "within", x: 426, y: 292, size: 12 },
    front_door_right: { panel: "within", x: 426, y: 292, size: 12 },

    rear_right_door: { panel: "within", x: 410, y: 343 },
    rear_door_right: { panel: "within", x: 410, y: 343 },
    "rear_door_(right)_-_replacement": { panel: "within", x: 410, y: 343 },

    right_quarter_panel: { panel: "within", x: 466, y: 429 },
    quarter_panel_right: { panel: "within", x: 466, y: 429 },
    right_quarter: { panel: "within", x: 466, y: 429 },
    quarter_right: { panel: "within", x: 466, y: 429 },

    side_sill_panel_right: { panel: "within", x: 349, y: 510 },
    side_sill_right: { panel: "within", x: 349, y: 510 },
    rocker_panel_right: { panel: "within", x: 349, y: 510 },

    // Top/Roof
    roof: { panel: "within", x: 320, y: 295 },
    roof_panel: { panel: "within", x: 320, y: 295 },
    sunroof: { panel: "within", x: 320, y: 275 },

    // ===== OUT PANEL (Rear/Bottom View) =====

    // Rear section - EXACT POSITIONS FROM REFERENCE IMAGE
    trunk: { panel: "out", x: 320, y: 415 },
    trunk_lid: { panel: "out", x: 320, y: 405 },
    deck_lid: { panel: "out", x: 320, y: 405 },
    trunk_floor: { panel: "out", x: 320, y: 415 },
    luggage_floor: { panel: "out", x: 320, y: 415 },
    floor_trunk: { panel: "out", x: 320, y: 415 },

    rear_panel: { panel: "out", x: 320, y: 425 },
    back_panel: { panel: "out", x: 320, y: 425 },

    rear_bumper: { panel: "out", x: 320, y: 450 },
    back_bumper: { panel: "out", x: 320, y: 450 },

    // Wheel houses - EXACT POSITIONS FROM REFERENCE IMAGE
    rear_wheel_house_left: { panel: "out", x: 285, y: 565 },
    rear_wheelhouse_left: { panel: "out", x: 285, y: 565 },
    wheel_house_rear_left: { panel: "out", x: 285, y: 565 },
    wheelhouse_rear_left: { panel: "out", x: 285, y: 565 },

    rear_wheel_house_right: { panel: "out", x: 355, y: 565 },
    rear_wheelhouse_right: { panel: "out", x: 355, y: 565 },
    wheel_house_rear_right: { panel: "out", x: 355, y: 565 },
    wheelhouse_rear_right: { panel: "out", x: 355, y: 565 },

    front_wheel_house_left: { panel: "out", x: 215, y: 175 },
    front_wheelhouse_left: { panel: "out", x: 215, y: 175 },

    front_wheel_house_right: { panel: "out", x: 425, y: 175 },
    front_wheelhouse_right: { panel: "out", x: 425, y: 175 },

    // Cross members and structural
    front_cross_member: { panel: "out", x: 320, y: 145 },
    rear_cross_member: { panel: "out", x: 320, y: 395 },
    front_rail: { panel: "out", x: 320, y: 130 },
    rear_rail: { panel: "out", x: 320, y: 410 },
  };

  console.log("🔍 Po përpunohen të dhënat e inspektimit për diagramin:", {
    totalItems: inspectionData.length,
    items: inspectionData.map((item) => ({
      title: item?.type?.title,
      code: item?.type?.code,
      statusTypes: item?.statusTypes,
      attributes: item?.attributes,
    })),
  });

  inspectionData.forEach((item, idx) => {
    const typeTitleRaw = (item?.type?.title || "").toString();
    const typeCodeRaw = (item?.type?.code || "").toString();
    const statuses = collectStatusEntries(item);
    const rawAttributes = (item as any)?.attributes;
    const attributes = Array.isArray(rawAttributes)
      ? rawAttributes
      : rawAttributes !== undefined && rawAttributes !== null
        ? [rawAttributes]
        : [];
    const attributeStrings = extractAttributeStrings(attributes);
    const attributeVariants = attributeStrings.map((attr) => ({
      raw: attr,
      normalized: normalizeForMatching(attr),
    }));
    const normalizedAttributesForMatch = attributeVariants
      .map(({ normalized }) => normalized)
      .filter(Boolean);
    const normalizedTitle = normalizeForMatching(typeTitleRaw);
    const normalizedCode = normalizeForMatching(typeCodeRaw);

    console.log(`📋 Po përpunohet elementi ${idx + 1}:`, {
      title: typeTitleRaw,
      code: typeCodeRaw,
      statuses,
      attributes,
    });

    let markerType: "N" | "R" = "R";
    let hasIssue = false;
    let hasNonNeutralStatus = false;

    statuses.forEach((status) => {
      const statusCode = (status.code || "").toString().trim().toUpperCase();
      const rawStatusTitle = (status.title || status.code || "")
        .toString()
        .toLowerCase();
      const normalizedStatusTitle = normalizeForMatching(
        status.title || status.code || "",
      );
      const hasReplacementKeyword =
        containsKeyword(rawStatusTitle, replacementKeywords) ||
        containsKeyword(normalizedStatusTitle, replacementKeywords);
      const hasRepairKeyword =
        containsKeyword(rawStatusTitle, repairKeywords) ||
        containsKeyword(normalizedStatusTitle, repairKeywords);
      const hasNeutralKeyword =
        containsKeyword(rawStatusTitle, neutralKeywords) ||
        containsKeyword(normalizedStatusTitle, neutralKeywords);

      if (replacementStatusCodes.has(statusCode) || hasReplacementKeyword) {
        markerType = "N";
        hasIssue = true;
      } else if (repairStatusCodes.has(statusCode) || hasRepairKeyword) {
        if (markerType !== "N") markerType = "R";
        hasIssue = true;
      } else if (
        (statusCode && !neutralStatusCodes.has(statusCode)) ||
        ((!statusCode || statusCode === "") &&
          (rawStatusTitle || normalizedStatusTitle) &&
          !hasNeutralKeyword)
      ) {
        hasNonNeutralStatus = true;
      }
    });

    if (!hasIssue && hasNonNeutralStatus) {
      markerType = "R";
      hasIssue = true;
    }

    if (!hasIssue && attributeStrings.length > 0) {
      const attributeHasReplacement = attributeVariants.some(
        ({ raw, normalized }) =>
          containsKeyword(raw, replacementKeywords) ||
          containsKeyword(normalized, replacementKeywords),
      );
      const attributeHasRepair = attributeVariants.some(
        ({ raw, normalized }) =>
          containsKeyword(raw, repairKeywords) ||
          containsKeyword(normalized, repairKeywords),
      );

      if (attributeHasReplacement) {
        markerType = "N";
        hasIssue = true;
      } else if (attributeHasRepair) {
        if (!markerType) markerType = "R";
        hasIssue = true;
      }
    }

    const textualCandidates = [
      typeTitleRaw,
      typeCodeRaw,
      (item as any)?.title,
      (item as any)?.name,
      (item as any)?.description,
      (item as any)?.result,
      (item as any)?.status,
    ];

    for (const candidate of textualCandidates) {
      if (!candidate || typeof candidate !== "string") continue;
      const normalizedCandidate = normalizeForMatching(candidate);
      const rawCandidate = candidate.toString();
      if (!normalizedCandidate && !rawCandidate) continue;

      if (
        containsKeyword(rawCandidate, replacementKeywords) ||
        containsKeyword(normalizedCandidate, replacementKeywords)
      ) {
        markerType = "N";
        hasIssue = true;
        break;
      }

      if (
        containsKeyword(rawCandidate, repairKeywords) ||
        containsKeyword(normalizedCandidate, repairKeywords)
      ) {
        if (markerType !== "N") markerType = "R";
        hasIssue = true;
      }
    }

    const hasHighRank = attributes.some(
      (attr: any) =>
        typeof attr === "string" &&
        (attr.includes("RANK_ONE") ||
          attr.includes("RANK_TWO") ||
          attr.includes("RANK_A") ||
          attr.includes("RANK_B")),
    );

    if (hasHighRank) {
      hasIssue = true;
      if (statuses.length === 0) {
        markerType = "N";
      }
    }

    if (!hasIssue) {
      console.log(
        `⚠️ Skipping item ${idx + 1}: nuk u identifikua problem i raportuar`,
      );
      return;
    }

    let bestMatch: string | null = null;
    let bestScore = 0;

    const aliasMatch =
      findAliasMatch(typeTitleRaw) ||
      findAliasMatch(typeCodeRaw) ||
      findAliasMatch(normalizedTitle) ||
      findAliasMatch(normalizedCode);

    if (aliasMatch && positionMap[aliasMatch]) {
      bestMatch = aliasMatch;
      bestScore = 950;
    }

    if (!bestMatch) {
      for (const partKey of Object.keys(positionMap)) {
        const normalizedPartKey = normalizeForMatching(partKey);
        const scoreFromTitle = computeTokenScore(
          normalizedTitle,
          normalizedPartKey,
        );
        if (scoreFromTitle > bestScore) {
          bestScore = scoreFromTitle;
          bestMatch = partKey;
        }

        const scoreFromCode = computeTokenScore(
          normalizedCode,
          normalizedPartKey,
        );
        if (scoreFromCode > bestScore) {
          bestScore = scoreFromCode;
          bestMatch = partKey;
        }

        if (normalizedAttributesForMatch.length > 0) {
          normalizedAttributesForMatch.forEach((attribute) => {
            const scoreFromAttr = computeTokenScore(
              attribute,
              normalizedPartKey,
            );
            if (scoreFromAttr > bestScore) {
              bestScore = scoreFromAttr;
              bestMatch = partKey;
            }
          });
        }
      }
    }

    if (bestMatch) {
      const pos = positionMap[bestMatch];
      const rawSize =
        typeof pos.size === "number" ? pos.size : DEFAULT_MARKER_SIZE;
      const nominalSize = Math.min(
        Math.max(rawSize, MIN_MARKER_DIAMETER),
        MAX_MARKER_DIAMETER,
      );

      // Check for collision with existing markers and offset if needed
      let finalX = pos.x;
      let finalY = pos.y;
      const collisionRadius = nominalSize * COLLISION_SPACING_MULTIPLIER;

      const markersToCheck =
        pos.panel === "within" ? withinMarkers : outMarkers;
      let hasCollision = true;
      let attempts = 0;
      const maxAttempts = 10; // Try additional positions around the original

      while (hasCollision && attempts < maxAttempts) {
        hasCollision = false;

        for (const existingMarker of markersToCheck) {
          const distance = Math.sqrt(
            Math.pow(existingMarker.x - finalX, 2) +
              Math.pow(existingMarker.y - finalY, 2),
          );

          if (distance < collisionRadius) {
            hasCollision = true;
            // Offset in a circular pattern
            const angle = (attempts * Math.PI * 2) / maxAttempts;
            finalX = pos.x + Math.cos(angle) * collisionRadius;
            finalY = pos.y + Math.sin(angle) * collisionRadius;
            break;
          }
        }

        attempts++;
      }

      const fallbackLabel =
        (typeTitleRaw && typeTitleRaw.trim()) ||
        (typeCodeRaw && typeCodeRaw.trim()) ||
        bestMatch;

      let translatedLabel = getDiagramPartLabel(bestMatch, fallbackLabel);

      if (translatedLabel === fallbackLabel && attributeStrings.length > 0) {
        translatedLabel = getDiagramPartLabel(
          attributeStrings[0],
          fallbackLabel,
        );
      }

      const normalizedOriginal =
        typeTitleRaw && typeTitleRaw.trim() ? typeTitleRaw.trim() : undefined;

      const marker: DiagramMarker = {
        x: finalX,
        y: finalY,
        type: markerType,
        label: translatedLabel,
        size: nominalSize,
        originalLabel:
          normalizedOriginal && normalizedOriginal !== translatedLabel
            ? normalizedOriginal
            : undefined,
      };

      console.log(
        `✅ U vendos "${marker.label}" (nga "${typeTitleRaw || bestMatch}") → ${bestMatch} (${pos.panel}), tip: ${markerType}, pozicioni: (${finalX}, ${finalY})${finalX !== pos.x || finalY !== pos.y ? " [ripozicionuar për të shmangur mbivendosjen]" : ""}`,
      );

      if (pos.panel === "within") {
        withinMarkers.push(marker);
      } else {
        outMarkers.push(marker);
      }
    } else {
      console.warn(
        `❌ Nuk u gjet pozicion i hartuar për: "${item?.type?.title}" (u kërkua sipas: ${normalizedTitle}, ${normalizedCode})`,
      );
    }
  });

  console.log(`\n🎯 Shënimet përfundimtare të diagramit:`, {
    within: withinMarkers.length,
    out: outMarkers.length,
    withinItems: withinMarkers.map((m) => m.label),
    outItems: outMarkers.map((m) => m.label),
  });

  return { within: withinMarkers, out: outMarkers };
};

const DiagramMarkerWithTooltip: React.FC<{
  marker: DiagramMarker;
  index: number;
  editMode: boolean;
  diagramScale: number;
  onDrag?: (x: number, y: number) => void;
}> = ({ marker, index, editMode, diagramScale, onDrag }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const buttonRef = useRef<HTMLButtonElement | null>(null);

  const leftPercent = (marker.x / BASE_CANVAS_WIDTH) * 100;
  const topPercent = (marker.y / BASE_CANVAS_HEIGHT) * 100;
  const markerBaseSize = marker.size ?? DEFAULT_MARKER_SIZE;
  const normalizedMarkerSize = clampValue(
    markerBaseSize,
    MIN_MARKER_DIAMETER,
    MAX_MARKER_DIAMETER,
  );

  const clampedScale = clampValue(
    Number.isFinite(diagramScale) ? diagramScale : 1,
    MIN_MARKER_SCALE,
    MAX_MARKER_SCALE,
  );

  const scaledSize = normalizedMarkerSize * clampedScale;
  const scaledMin = Math.max(MIN_MARKER_DIAMETER * clampedScale, 4);
  const scaledMax = Math.max(MAX_MARKER_DIAMETER * clampedScale, scaledMin);
  const markerSizePx = clampValue(scaledSize, scaledMin, scaledMax);

  const fontMin = Math.max(MARKER_FONT_MIN * clampedScale, 3.2);
  const fontMax = Math.max(MARKER_FONT_MAX * clampedScale, fontMin);
  const markerFontSizePx = clampValue(markerSizePx * 0.55, fontMin, fontMax);

  const baseClasses =
    "absolute rounded-full flex items-center justify-center font-bold shadow-sm border pointer-events-auto transition-transform duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary";
  const variantClasses =
    marker.type === "N"
      ? "bg-[#E53935] text-white border-white/80"
      : "bg-[#D84315] text-white border-white/80";
  const editModeClasses = editMode
    ? "cursor-move ring-2 ring-yellow-400"
    : "cursor-pointer";

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!editMode) return;
    e.preventDefault();
    setIsDragging(true);
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    const parentRect = (
      e.target as HTMLElement
    ).parentElement?.getBoundingClientRect();
    if (parentRect) {
      setDragOffset({
        x: e.clientX - rect.left - rect.width / 2,
        y: e.clientY - rect.top - rect.height / 2,
      });
    }
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging || !editMode || !onDrag) return;
    const parentElement =
      buttonRef.current?.closest<HTMLDivElement>(".diagram-container");
    if (!parentElement) return;

    const rect = parentElement.getBoundingClientRect();
    const x =
      ((e.clientX - rect.left - dragOffset.x) / rect.width) * BASE_CANVAS_WIDTH;
    const y =
      ((e.clientY - rect.top - dragOffset.y) / rect.height) *
      BASE_CANVAS_HEIGHT;

    const clampedX = Math.max(
      DIAGRAM_EDGE_PADDING,
      Math.min(BASE_CANVAS_WIDTH - DIAGRAM_EDGE_PADDING, x),
    );
    const clampedY = Math.max(
      DIAGRAM_EDGE_PADDING,
      Math.min(BASE_CANVAS_HEIGHT - DIAGRAM_EDGE_PADDING, y),
    );

    onDrag(clampedX, clampedY);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [isDragging, dragOffset, editMode, onDrag]);

  return (
    <Tooltip delayDuration={editMode ? 999999 : 0}>
      <TooltipTrigger asChild>
        <button
          type="button"
          aria-label={`${marker.label} - ${marker.type === "N" ? "Zëvendësim" : "Riparim"}`}
          ref={buttonRef}
          className={`${baseClasses} ${variantClasses} ${editModeClasses}`}
          style={{
            left: `${leftPercent}%`,
            top: `${topPercent}%`,
            width: `${markerSizePx}px`,
            height: `${markerSizePx}px`,
            fontSize: `${markerFontSizePx}px`,
            transform: "translate(-50%, -50%)",
          }}
          onMouseDown={handleMouseDown}
        >
          {marker.type}
        </button>
      </TooltipTrigger>
      <TooltipContent
        side="top"
        sideOffset={5}
        className="bg-popover text-popover-foreground border-border shadow-lg max-w-xs z-50"
      >
        <div className="font-semibold text-sm">{marker.label}</div>
        <div className="text-xs text-muted-foreground mt-1">
          {marker.type === "N" ? "Ndërrim / zëvendësim" : "Riparim"}
        </div>
        {marker.originalLabel && marker.originalLabel !== marker.label && (
          <div className="text-[10px] text-muted-foreground/80 mt-1">
            {marker.originalLabel}
          </div>
        )}
      </TooltipContent>
    </Tooltip>
  );
};

export const InspectionDiagramPanel: React.FC<InspectionDiagramPanelProps> = ({
  outerInspectionData = [],
  className = "",
}) => {
  const { isAdmin } = useAdminCheck();
  const { toast } = useToast();
  const [editMode, setEditMode] = useState(false);
  const [customPositions, setCustomPositions] = useState<
    Record<string, { x: number; y: number; panel: string }>
  >({});
  const [editedMarkers, setEditedMarkers] = useState<
    Record<string, { x: number; y: number }>
  >({});
  const withinDiagramRef = useRef<HTMLDivElement | null>(null);
  const outDiagramRef = useRef<HTMLDivElement | null>(null);
  const [withinScale, setWithinScale] = useState(1);
  const [outScale, setOutScale] = useState(1);

  const { within, out } = mapInspectionToMarkers(outerInspectionData);

  useEffect(() => {
    if (
      typeof window === "undefined" ||
      typeof ResizeObserver === "undefined"
    ) {
      return;
    }

    const observers: ResizeObserver[] = [];

    const registerObserver = (
      element: HTMLDivElement | null,
      setter: React.Dispatch<React.SetStateAction<number>>,
    ) => {
      if (!element) return;

      const updateScale = () => {
        const width = element.offsetWidth || BASE_CANVAS_WIDTH;
        const rawScale = width / BASE_CANVAS_WIDTH;
        setter((prev) => (Math.abs(prev - rawScale) < 0.01 ? prev : rawScale));
      };

      updateScale();

      const observer = new ResizeObserver(() => {
        updateScale();
      });

      observer.observe(element);
      observers.push(observer);
    };

    registerObserver(withinDiagramRef.current, setWithinScale);
    registerObserver(outDiagramRef.current, setOutScale);

    return () => {
      observers.forEach((observer) => observer.disconnect());
    };
  }, []);

  // Load custom positions from database
  useEffect(() => {
    const loadCustomPositions = async () => {
      const { data, error } = await supabase
        .from("inspection_marker_positions")
        .select("*");

      if (error) {
        console.error(
          "Gabim gjatë ngarkimit të pozicioneve të personalizuara:",
          error,
        );
        return;
      }

      if (data) {
        const positions: Record<
          string,
          { x: number; y: number; panel: string }
        > = {};
        data.forEach((pos) => {
          positions[pos.part_key] = {
            x: Number(pos.x),
            y: Number(pos.y),
            panel: pos.panel,
          };
        });
        setCustomPositions(positions);
      }
    };

    loadCustomPositions();
  }, []);

  // Apply custom positions to markers
  const applyCustomPositions = (
    markers: DiagramMarker[],
    panel: "within" | "out",
  ) => {
    return markers.map((marker) => {
      const key = `${panel}_${marker.label.toLowerCase().replace(/\s+/g, "_")}`;
      const customPos = customPositions[key];
      const editedPos = editedMarkers[key];

      if (editedPos) {
        return { ...marker, x: editedPos.x, y: editedPos.y };
      }

      if (customPos && customPos.panel === panel) {
        return { ...marker, x: customPos.x, y: customPos.y };
      }

      return marker;
    });
  };

  const withinWithCustomPos = applyCustomPositions(within, "within");
  const outWithCustomPos = applyCustomPositions(out, "out");

  const handleMarkerDrag = (
    marker: DiagramMarker,
    panel: "within" | "out",
    x: number,
    y: number,
  ) => {
    const key = `${panel}_${marker.label.toLowerCase().replace(/\s+/g, "_")}`;
    setEditedMarkers((prev) => ({
      ...prev,
      [key]: { x, y },
    }));
  };

  const handleSavePositions = async () => {
    try {
      const updates = Object.entries(editedMarkers).map(([key, pos]) => {
        const [panel] = key.split("_");
        return {
          part_key: key,
          panel,
          x: pos.x,
          y: pos.y,
        };
      });

      for (const update of updates) {
        const { error } = await supabase
          .from("inspection_marker_positions")
          .upsert(update, { onConflict: "part_key" });

        if (error) throw error;
      }

      toast({
        title: "Pozicionet u ruajtën",
        description: `U përditësuan ${updates.length} pozicione shenjash`,
      });

      setEditedMarkers({});
      setEditMode(false);

      // Reload positions
      const { data } = await supabase
        .from("inspection_marker_positions")
        .select("*");

      if (data) {
        const positions: Record<
          string,
          { x: number; y: number; panel: string }
        > = {};
        data.forEach((pos) => {
          positions[pos.part_key] = {
            x: Number(pos.x),
            y: Number(pos.y),
            panel: pos.panel,
          };
        });
        setCustomPositions(positions);
      }
    } catch (error) {
      console.error("Gabim gjatë ruajtjes së pozicioneve:", error);
      toast({
        title: "Gabim",
        description: "Pozicionet e shenjave nuk u ruajtën",
        variant: "destructive",
      });
    }
  };

  const handleCancelEdit = () => {
    setEditedMarkers({});
    setEditMode(false);
  };

  const hasAnyMarkers =
    withinWithCustomPos.length > 0 || outWithCustomPos.length > 0;
  const hasData = outerInspectionData && outerInspectionData.length > 0;

  return (
    <Card className={`overflow-hidden ${className}`}>
      {/* Admin Edit Controls */}
      {isAdmin && hasAnyMarkers && (
        <div className="bg-muted/50 border-b border-border px-4 py-3 flex items-center justify-between">
          <div className="text-sm font-medium">
            {editMode ? (
              <span className="text-yellow-600 dark:text-yellow-500">
                🖱️ Mënyra e redaktimit: zhvendosni shenjat për t’i ripozicionuar
              </span>
            ) : (
              <span>Redaktori i diagramit</span>
            )}
          </div>
          <div className="flex gap-2">
            {!editMode ? (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setEditMode(true)}
              >
                <Edit3 className="w-4 h-4 mr-2" />
                Modifiko pozicionet
              </Button>
            ) : (
              <>
                <Button size="sm" variant="outline" onClick={handleCancelEdit}>
                  <X className="w-4 h-4 mr-2" />
                  Anulo
                </Button>
                <Button
                  size="sm"
                  onClick={handleSavePositions}
                  disabled={Object.keys(editedMarkers).length === 0}
                >
                  <Save className="w-4 h-4 mr-2" />
                  Ruaj{" "}
                  {Object.keys(editedMarkers).length > 0 &&
                    `(${Object.keys(editedMarkers).length})`}
                </Button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Debug info banner */}
      {hasData && !hasAnyMarkers && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border-b border-yellow-200 dark:border-yellow-800 px-4 py-2 text-sm">
          <p className="text-yellow-800 dark:text-yellow-200">
            ℹ️ U morën {outerInspectionData.length} elemente, por nuk u gjet
            asnjë shenjë për t’u vizualizuar. Kontrolloni konzolën për detaje.
          </p>
        </div>
      )}
      {!hasData && (
        <div className="bg-muted/50 border-b border-border px-4 py-2 text-sm">
          <p className="text-muted-foreground">
            Nuk ka të dhëna inspektimi për këtë automjet.
          </p>
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 border-b border-border divide-y divide-border sm:divide-y-0">
        <div className="text-center py-3 sm:border-r border-border bg-muted/30 font-semibold text-xs sm:text-sm uppercase tracking-wide">
          Pamje e brendshme
        </div>
        <div className="text-center py-3 bg-muted/30 font-semibold text-xs sm:text-sm uppercase tracking-wide">
          Pamje e jashtme
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Within panel - interior/side view */}
        <div className="relative p-4 lg:border-r border-border bg-white dark:bg-muted/5">
          <div
            ref={withinDiagramRef}
            className="relative mx-auto max-w-[640px]"
          >
            <img
              src={carDiagramFront}
              alt="Pamje anësore dhe e brendshme e makinës"
              className="w-full h-auto"
            />
            <div className="diagram-container absolute inset-0 w-full h-full pointer-events-none">
              <TooltipProvider delayDuration={0}>
                {withinWithCustomPos.map((marker, idx) => (
                  <DiagramMarkerWithTooltip
                    key={idx}
                    marker={marker}
                    index={idx}
                    editMode={editMode}
                    diagramScale={withinScale}
                    onDrag={(x, y) => handleMarkerDrag(marker, "within", x, y)}
                  />
                ))}
              </TooltipProvider>
            </div>
          </div>
        </div>

        {/* Out panel - exterior/bottom view */}
        <div className="relative p-4 bg-white dark:bg-muted/5">
          <div ref={outDiagramRef} className="relative mx-auto max-w-[640px]">
            <img
              src={carDiagramBack}
              alt="Pamje e jashtme dhe e poshtme e makinës"
              className="w-full h-auto"
            />
            <div className="diagram-container absolute inset-0 w-full h-full pointer-events-none">
              <TooltipProvider delayDuration={0}>
                {outWithCustomPos.map((marker, idx) => (
                  <DiagramMarkerWithTooltip
                    key={idx}
                    marker={marker}
                    index={idx}
                    editMode={editMode}
                    diagramScale={outScale}
                    onDrag={(x, y) => handleMarkerDrag(marker, "out", x, y)}
                  />
                ))}
              </TooltipProvider>
            </div>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="px-4 py-3 border-t border-border bg-muted/10 flex flex-wrap items-center justify-center gap-4 sm:gap-6">
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <div className="w-6 h-6 rounded-full bg-[#E53935] flex items-center justify-center text-white text-xs font-bold shadow-sm">
            N
          </div>
          Ndërrim (zëvendësim)
        </div>
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <div className="w-6 h-6 rounded-full bg-[#D84315] flex items-center justify-center text-white text-xs font-bold shadow-sm">
            R
          </div>
          Riparim
        </div>
      </div>
    </Card>
  );
};
