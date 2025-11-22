import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { trackPageView } from "@/utils/analytics";
import { useCurrencyAPI } from "@/hooks/useCurrencyAPI";
import { useKoreaOptions } from "@/hooks/useKoreaOptions";
import { formatMileage } from "@/utils/mileageFormatter";
import CarInspectionDiagram from "@/components/CarInspectionDiagram";
import { InspectionItemList } from "@/components/InspectionItemList";
import InspectionRequestForm from "@/components/InspectionRequestForm";
import { DrivingInformationPanel } from "@/components/DrivingInformationPanel";
import { VehicleHistoryPanel } from "@/components/VehicleHistoryPanel";
import { AttentionHistoryPanel } from "@/components/AttentionHistoryPanel";
import { InsuranceMaintenancePanel } from "@/components/InsuranceMaintenancePanel";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { openCarDetailsInNewTab } from "@/utils/navigation";
import {
  ENCAR_IMAGE_BASE_URL,
  fetchEncarsInspection,
  fetchEncarsRecordOpen,
  fetchEncarsRecordSummary,
  fetchEncarsVehicle,
} from "@/services/encarApi";
import {
  buildUsageHistoryList,
  decodePrimaryUsage,
  decodeSecondaryUsage,
  isUsageDetailHidden,
  translateUsageText,
  type UsageHistoryEntry,
} from "@/utils/encarUsage";
import { translateKoreanText } from "@/utils/koreanTranslation";
import type {
  EncarsInspectionResponse,
  EncarsRecordOpenResponse,
  EncarsRecordSummaryResponse,
  EncarsVehicleResponse,
} from "@/services/encarApi";
import {
  AlertTriangle,
  MessageCircle,
  ArrowLeft,
  Car,
  CheckCircle,
  Clock,
  Cog,
  FileText,
  Gauge,
  Loader2,
  MapPin,
  Shield,
  Users,
  Wrench,
  type LucideIcon,
} from "lucide-react";

interface InspectionReportCar {
  id: string;
  lot?: string;
  make?: string;
  model?: string;
  year?: number;
  title?: string;
  image?: string;
  priceEUR?: number;
  mileageKm?: number;
  odometer?: {
    km?: number;
    mi?: number;
    status?: {
      name?: string;
    };
  };
  vin?: string;
  fuel?: string;
  firstRegistration?: string;
  postedAt?: string;
  engineDisplacement?: number | string;
  damage?: {
    main?: string | null;
    second?: string | null;
  } | null;
  insurance?: any;
  insurance_v2?: any;
  details?: any;
  inspect?: any;
  ownerChanges?: any[];
  maintenanceHistory?: any[];
  location?: any;
  grade?: string;
  sourceLabel?: string;
  images?: string[];
  encarVehicle?: EncarsVehicleResponse;
  encarInspection?: EncarsInspectionResponse;
  encarRecord?: EncarsRecordOpenResponse;
  encarRecordSummary?: EncarsRecordSummaryResponse;
}

type InsuranceSummaryInfo = {
  accident_history?: unknown;
  repair_count?: unknown;
  total_loss?: unknown;
  flood_damage?: unknown;
  [key: string]: unknown;
};

type OwnerChangeEntry = {
  date?: string;
  change_type?: string;
  previous_number?: string;
  usage_type?: string;
};

type SpecialAccidentEntry = { type?: string; value?: string };

const positiveStatusValues = new Set([
  "goodness",
  "proper",
  "doesn't exist",
  "good",
  "ok",
  "okay",
  "normal",
  "excellent",
  "perfect",
  "fine",
  "good condition",
  "none",
  "no leak",
  "no issue",
  "no issues",
  "no problem",
  "pass",
  "양호",
  "정상",
  "없음",
  "적정",
]);

const negativeStatusValues = new Set([
  "bad",
  "poor",
  "replace",
  "replacement",
  "repair",
  "warning",
  "caution",
  "leak",
  "minor leak",
  "abnormal",
  "fail",
  "failure",
  "defect",
  "damaged",
  "damage",
  "broken",
  "worn",
  "noise",
  "crack",
  "contamination",
]);

const negativeStatusKeywords = [
  "leak",
  "replacement",
  "replace",
  "repair",
  "abnormal",
  "warning",
  "caution",
  "fail",
  "failure",
  "defect",
  "damage",
  "damaged",
  "broken",
  "crack",
  "worn",
  "wear",
  "noise",
  "contamination",
  "contaminated",
  "stain",
  "issue",
  "problem",
  "loose",
  "vibration",
  "rough",
  "irregular",
  "not good",
  "not ok",
  "not normal",
];

const mechanicalKeyPhraseTranslations: Record<string, string> = {
  "engine oil": "Vaji i Motorit",
  "engine oil leak": "Rrjedhja e Vajit të Motorit",
  "engine check": "Kontrolli i Motorit",
  "transmission oil": "Vaji i Transmisionit",
  "power steering": "Drejtimi Hidraulik",
  "coolant leak": "Rrjedhja e Ftohësit",
  "fuel leak": "Rrjedhja e Karburantit",
  "brake fluid": "Lëngu i Frenave",
  "air conditioner": "Kondicioneri",
  "air conditioning": "Kondicioneri",
  "spark plug": "Qirinj të Ndezjes",
  "timing belt": "Rripi i Kohës",
  "timing chain": "Zinxhiri i Kohës",
  "drive belt": "Rripi i Aksesorëve",
  "drive shaft": "Boshti Lëvizës",
  "stabilizer bar": "Shtylla Stabilizuese",
  "upper arm": "Krahu i Sipërm",
  "lower arm": "Krahu i Poshtëm",
  "tie rod": "Shtylla Drejtuese",
  "wheel bearing": "Kushineta e Rrotës",
  "shock absorber": "Amortizatori",
  "fuel pump": "Pompa e Karburantit",
  "water pump": "Pompa e Ujit",
  "starter motor": "Motorri i Ndezjes",
  alternator: "Alternatori",
  "brake pad": "Jastëkët e Frenave",
  "brake disc": "Disqet e Frenave",
  "brake caliper": "Kaliperi i Frenave",
  "engine mount": "Mbajtësi i Motorit",
  "engine noise": "Zhurma e Motorit",
  "gear shift": "Leva e Marsheve",
  "gear box": "Kutia e Marsheve",
  "clutch pedal": "Pedali i Kllaxhës",
  "coolant reservoir": "Depoja e Ftohësit",
};

const mechanicalKeyExactTranslations: Record<string, string> = {
  "자기진단 - 원동기": "Vetë-diagnostikim - Motor",
  "자기진단 - 변속기": "Vetë-diagnostikim - Transmision",
  "원동기 - 작동상태(공회전)": "Motor - Gjendja e funksionimit (ralant)",
  "원동기 - 오일누유 - 실린더 커버(로커암 커버)": "Motor - Rrjedhje vaji - Kapaku i cilindrit (kapaku i rocker arm-it)",
  "원동기 - 오일누유 - 실린더 헤드 / 개스킷": "Motor - Rrjedhje vaji - Koka e cilindrit / garnitura",
  "원동기 - 오일누유 - 실린더 블록 / 오일팬": "Motor - Rrjedhje vaji - Blloku i cilindrit / kartteri i vajit",
  "원동기 - 오일 유량": "Motor - Sasia e vajit",
  "원동기 - 냉각수누수 - 실린더 헤드 / 개스킷": "Motor - Rrjedhje ftohësi - Koka e cilindrit / garnitura",
  "원동기 - 냉각수누수 - 워터펌프": "Motor - Rrjedhje ftohësi - Pompa e ujit",
  "원동기 - 냉각수누수 - 라디에이터": "Motor - Rrjedhje ftohësi - Radiatori",
  "원동기 - 냉각수누수 - 냉각수 수량": "Motor - Sasia e lëngut ftohës",
  "변속기 - 자동변속기(a/t) - 오일누유": "Transmision - Transmision automatik (A/T) - Rrjedhje vaji",
  "변속기 - 자동변속기(a/t) - 작동상태(공회전)": "Transmision - Transmision automatik (A/T) - Gjendja e funksionimit (ralant)",
  "동력전달 - 등속조인트": "Transmetimi i fuqisë - Nyja me shpejtësi konstante",
  "동력전달 - 디피렌셜 기어": "Transmetimi i fuqisë - Diferenciali",
  "조향 - 동력조향 작동 오일 누유": "Drejtimi - Rrjedhje e vajit të servo-drejtimit",
  "조향 - 작동상태 - 스티어링 기어(mdps포함)": "Drejtimi - Gjendja e funksionimit - Kutia e drejtimit (përfshirë MDPS)",
  "조향 - 작동상태 - 스티어링 조인트": "Drejtimi - Gjendja e funksionimit - Nyja e drejtimit",
  "조향 - 작동상태 - 타이로드엔드 및 볼 조인트": "Drejtimi - Gjendja e funksionimit - Fundi i shufrës së drejtimit dhe nyjat sferike",
  "제동 - 브레이크 마스터 실린더오일 누유": "Frenimi - Rrjedhje nga cilindri kryesor i frenave",
  "제동 - 브레이크 오일 누유": "Frenimi - Rrjedhje e vajit të frenave",
  "제동 - 배력장치 상태": "Frenimi - Gjendja e servofrenit",
  "전기 - 발전기 출력": "Elektrika - Dalja e alternatorit",
  "전기 - 시동 모터": "Elektrika - Motori i ndezjes",
  "전기 - 와이퍼 모터 기능": "Elektrika - Funksioni i motorit të pastruesit të xhamit",
  "전기 - 실내송풍 모터": "Elektrika - Motori i ventilimit të brendshëm",
  "전기 - 라디에이터 팬 모터": "Elektrika - Motori i ventilatorit të radiatorit",
  "전기 - 윈도우 모터": "Elektrika - Motorët e dritareve",
  "연료 - 연료누출(lp가스포함)": "Karburanti - Rrjedhje karburanti (përfshirë LPG)",
};

const mechanicalKeyWordTranslations: Record<string, string> = {
  engine: "Motori",
  motor: "Motori",
  system: "Sistemi",
  mechanical: "Mekanik",
  oil: "Vaji",
  coolant: "Ftohësi",
  leak: "Rrjedhja",
  leakage: "Rrjedhja",
  condition: "Gjendja",
  level: "Niveli",
  status: "Statusi",
  pump: "Pompa",
  fuel: "Karburanti",
  filter: "Filtri",
  belt: "Rripi",
  chain: "Zinxhiri",
  clutch: "Kllaxha",
  transmission: "Transmisioni",
  gear: "Marshet",
  gearbox: "Kutia e Marsheve",
  brake: "Frenat",
  pad: "Jastëkët",
  disc: "Disqet",
  rotor: "Rotori",
  front: "Përpara",
  rear: "Prapa",
  left: "Majtas",
  right: "Djathtas",
  upper: "Sipër",
  lower: "Poshtë",
  arm: "Krahu",
  steering: "Drejtimi",
  rack: "Sistemi i drejtimit",
  power: "Fuqia",
  battery: "Bateria",
  alternator: "Alternatori",
  starter: "Starteri",
  spark: "Qiriu",
  plug: "Shkëndija",
  compressor: "Kompresori",
  fan: "Ventilatori",
  hose: "Zorra",
  radiator: "Radiatori",
  reservoir: "Depoja",
  wheel: "Rrota",
  bearing: "Kushineta",
  suspension: "Pezullimi",
  shock: "Amortizatori",
  absorber: "Amortizatori",
  joint: "Nyja",
  boot: "Mbrojtësja",
  differential: "Diferenciali",
  exhaust: "Shkarkimi",
  pipe: "Tubi",
  catalytic: "Katalizatori",
  converter: "Katalizatori",
  turbo: "Turbina",
  injector: "Injektori",
  air: "Ajri",
  pressure: "Presioni",
  temperature: "Temperatura",
  vacuum: "Vakumi",
  sensor: "Sensori",
  mount: "Mbajtësi",
  bushing: "Bushi",
  fluid: "Lëngu",
  cover: "Kapaku",
  gasket: "Guarnicioni",
  valve: "Valvula",
  indicator: "Treguesi",
  warning: "Paralajmërimi",
  noise: "Zhurma",
  smoke: "Tymi",
  emission: "Emisioni",
  throttle: "Gazpedali",
  body: "Trupi",
  idle: "Xhiro boshe",
  timing: "Kohëzimi",
  support: "Mbështetja",
  stabilizer: "Stabilizatori",
  link: "Lidhja",
  hub: "Qendra",
  lamp: "Drita",
  light: "Drita",
  wiring: "Instalimi",
  connector: "Lidhësi",
  window: "Dritarja",
  mirror: "Pasqyra",
  seat: "Sedilja",
  heater: "Ngrohësi",
  ac: "Kondicioneri",
  line: "Linja",
  switch: "Ndërprerësi",
  relay: "Relè",
  fuse: "Siguresa",
  horn: "Boria",
  washer: "Larësi",
  blade: "Fleta",
};

const statusValueExactTranslations: Record<string, string> = {
  goodness: "Në gjendje shumë të mirë",
  good: "Mirë",
  fine: "Mirë",
  ok: "Në rregull",
  okay: "Në rregull",
  proper: "Saktë",
  "doesn't exist": "Nuk ekziston",
  normal: "Normal",
  excellent: "Shkëlqyeshëm",
  perfect: "Perfekt",
  none: "Asgjë",
  "no leak": "Pa rrjedhje",
  "good condition": "Në gjendje të mirë",
  pass: "Në rregull",
  fail: "Dështoi",
  caution: "Kujdes",
  warning: "Paralajmërim",
  "양호": "Në gjendje të mirë",
  "정상": "Normal",
  "없음": "Nuk ka",
  "적정": "Në nivel të duhur",
};

const statusValueKeywordTranslations: Record<string, string> = {
  normal: "Normal",
  abnormal: "Jo normal",
  good: "Mirë",
  great: "Shkëlqyeshëm",
  excellent: "Shkëlqyeshëm",
  fine: "Mirë",
  ok: "Në rregull",
  okay: "Në rregull",
  perfect: "Perfekt",
  pass: "Në rregull",
  passed: "Në rregull",
  fail: "Dështoi",
  failed: "Dështoi",
  caution: "Kujdes",
  warning: "Paralajmërim",
  replace: "Zëvendësim",
  replacement: "Zëvendësim",
  replaced: "I zëvendësuar",
  repair: "Riparim",
  repaired: "I riparuar",
  welding: "Saldim",
  weld: "Saldim",
  corrosion: "Korrozion",
  corroded: "I korroduar",
  scratch: "Gërvishje",
  scratches: "Gërvishtje",
  dent: "Gropë",
  dents: "Gropa",
  leak: "Rrjedhje",
  leaks: "Rrjedhje",
  detected: "Zbuluar",
  found: "Gjetur",
  present: "Prezent",
  absent: "Mungon",
  available: "Në dispozicion",
  unavailable: "I padisponueshëm",
  none: "Asnjë",
  unknown: "Panjohet",
  pending: "Në pritje",
  damaged: "Dëmtuar",
  damage: "Dëmtim",
  broken: "Thyer",
  worn: "I konsumuar",
  loose: "I liruar",
  vibration: "Dridhje",
};

const statusValueRegexTranslations: Array<{
  pattern: RegExp;
  translation: string;
}> = [
    { pattern: /minor leak/i, translation: "Rrjedhje e vogël" },
    { pattern: /leak/i, translation: "Rrjedhje" },
    { pattern: /replace|replacement/i, translation: "Kërkon zëvendësim" },
    { pattern: /repair/i, translation: "Kërkon riparim" },
    { pattern: /abnormal/i, translation: "Jo normale" },
    { pattern: /noise/i, translation: "Zhurmë" },
    { pattern: /stain/i, translation: "Njollë" },
    { pattern: /contamin/i, translation: "Kontaminim" },
    { pattern: /damage|damaged/i, translation: "Dëmtuar" },
    { pattern: /broken/i, translation: "Thyer" },
    { pattern: /crack/i, translation: "Çarje" },
    { pattern: /worn/i, translation: "I konsumuar" },
    { pattern: /vibration/i, translation: "Vibrim" },
    { pattern: /no\s+(issue|issues|problem|problems)/i, translation: "Pa probleme" },
  ];

const meaninglessStatusStrings = new Set([
  "",
  "-",
  "--",
  "unknown",
  "undefined",
  "n/a",
  "na",
  "null",
  "not available",
]);

const accidentSummaryKeyTranslations: Record<string, string> = {
  accident: "Aksidente",
  accidents: "Aksidente",
  "simple repair": "Riparime të thjeshta",
  simple_repair: "Riparime të thjeshta",
  engine_check: "Kontrolli i motorit",
  "engine check": "Kontrolli i motorit",
  enginecheck: "Kontrolli i motorit",
  "main framework": "Struktura kryesore",
  main_framework: "Struktura kryesore",
  exterior1rank: "Vlerësimi i jashtëm 1",
  exterior2rank: "Vlerësimi i jashtëm 2",
  accident_history: "Historia e aksidenteve",
  repair_count: "Numri i riparimeve",
  total_loss: "Humbje totale",
  flood_damage: "Dëmtime nga përmbytja",
  fire_damage: "Dëmtime nga zjarri",
  theft_history: "Historia e vjedhjes",
  airbag_deploy: "Shpërthimi i airbag",
  airbag: "Airbag",
  special_accident: "Aksident i veçantë",
  specialaccident: "Aksident i veçantë",
  my_accident_cnt: "Aksidentet personale",
  other_accident_cnt: "Aksidentet e tjera",
  my_accident_cost: "Kostoja e aksidenteve personale",
  other_accident_cost: "Kostoja e aksidenteve të tjera",
  accident_count: "Numri i aksidenteve",
  accidentcnt: "Numri i aksidenteve",
  ownerchange_cnt: "Ndërrimet e pronarëve",
  exterior_grade: "Vlerësimi i jashtëm",
  frame: "Korniza",
  waterlog: "Dëmtime nga përmbytja",
  water_log: "Dëmtime nga përmbytja",
  "water log": "Dëmtime nga përmbytja",
  recall: "Rikthim i prodhuesit",
};

const accidentKeyWordTranslations: Record<string, string> = {
  accident: "Aksident",
  accidents: "Aksidente",
  history: "Historia",
  simple: "Të thjeshta",
  repair: "Riparime",
  repairs: "Riparime",
  main: "Kryesore",
  framework: "Struktura",
  exterior: "I jashtëm",
  rank: "Vlerësimi",
  count: "Numri",
  cost: "Kostoja",
  total: "Totale",
  loss: "Humbje",
  flood: "Përmbytje",
  fire: "Zjarr",
  theft: "Vjedhje",
  airbag: "Airbag",
  deploy: "Shpërthim",
  my: "Personale",
  other: "Të tjera",
  owner: "Pronar",
  change: "Ndryshim",
  changes: "Ndryshime",
  number: "Numri",
  frame: "Korniza",
  special: "I veçantë",
  summary: "Përmbledhje",
  status: "Statusi",
};

const ACCIDENT_SUMMARY_HIDDEN_KEYS = new Set([
  "transmissioncheck",
  "comments",
  "enginecheck",
  "recall",
]);

const accidentValueExactTranslations: Record<string, string> = {
  yes: "Po",
  y: "Po",
  true: "Po",
  no: "Jo",
  n: "Jo",
  false: "Jo",
  none: "Asnjë",
  exist: "Ekziston",
  exists: "Ekziston",
  "doesn't exist": "Nuk ekziston",
  "does not exist": "Nuk ekziston",
  "not applicable": "Jo e aplikueshme",
  pending: "Në pritje",
};

const accidentValueRegexTranslations: Array<{
  pattern: RegExp;
  translation: string;
}> = [
    { pattern: /exist/i, translation: "Ekziston" },
    { pattern: /not exist/i, translation: "Nuk ekziston" },
    { pattern: /available/i, translation: "E disponueshme" },
    { pattern: /unavailable/i, translation: "E padisponueshme" },
  ];

const meaninglessAccidentStrings = new Set([
  "",
  "-",
  "--",
  "unknown",
  "undefined",
  "n/a",
  "na",
  "null",
  "not available",
]);

const translateMechanicalKey = (rawKey: string) => {
  const normalized = rawKey.replace(/_/g, " ").replace(/\s+/g, " ").trim();
  if (!normalized) return "-";
  const canonical = normalized.replace(/\s*-\s*/g, " - ");
  const exactTranslation = mechanicalKeyExactTranslations[canonical];
  if (exactTranslation) {
    return exactTranslation;
  }
  const lower = canonical.toLowerCase();
  if (mechanicalKeyPhraseTranslations[lower]) {
    return mechanicalKeyPhraseTranslations[lower];
  }
  const words = canonical.split(/\s+/).map((word) => {
    const cleaned = word.toLowerCase();
    const translation = mechanicalKeyWordTranslations[cleaned];
    if (translation) return translation;
    if (/^\d+$/.test(cleaned)) return word;
    return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
  });
  return words.join(" ");
};

const translateAccidentSummaryKey = (rawKey: string) => {
  const normalized = rawKey.replace(/_/g, " ").replace(/\s+/g, " ").trim();
  if (!normalized) return "-";
  const lower = normalized.toLowerCase();
  if (accidentSummaryKeyTranslations[lower]) {
    return accidentSummaryKeyTranslations[lower];
  }
  const words = normalized.split(/\s+/).map((word) => {
    const cleaned = word.toLowerCase();
    const translation = accidentKeyWordTranslations[cleaned];
    if (translation) return translation;
    if (/^\d+$/.test(cleaned)) return word;
    return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
  });
  return words.join(" ");
};

const translateStatusValue = (value: unknown) => {
  if (value === null || value === undefined) return "-";
  if (typeof value === "boolean") return value ? "Po" : "Jo";
  if (typeof value === "number") return value.toString();
  if (typeof value !== "string") return String(value ?? "") || "-";
  const normalizedRaw = value.trim();
  if (!normalizedRaw) return "-";
  const normalized = normalizedRaw.toLowerCase();
  if (statusValueExactTranslations[normalized]) {
    return statusValueExactTranslations[normalized];
  }

  const sanitized = normalized
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (sanitized && statusValueExactTranslations[sanitized]) {
    return statusValueExactTranslations[sanitized];
  }

  for (const { pattern, translation } of statusValueRegexTranslations) {
    if (pattern.test(normalized)) return translation;
    if (sanitized && pattern.test(sanitized)) return translation;
  }

  if (sanitized) {
    const tokens = sanitized.split(/\s+/);
    let translated = false;
    const translatedTokens = tokens.map((token) => {
      const direct =
        statusValueExactTranslations[token] || statusValueKeywordTranslations[token];
      if (direct) {
        translated = true;
        return direct;
      }
      return token;
    });
    if (translated) {
      return translatedTokens.join(" ");
    }
  }

  const usageTranslation = translateUsageText(normalizedRaw).trim();
  if (usageTranslation && usageTranslation !== normalizedRaw) {
    return usageTranslation;
  }

  const koreanTranslation = translateKoreanText(normalizedRaw).trim();
  if (koreanTranslation && koreanTranslation !== normalizedRaw) {
    return koreanTranslation;
  }

  return normalizedRaw;
};

const translateAccidentSummaryValue = (value: unknown) => {
  if (value === null || value === undefined) return "-";
  if (typeof value === "boolean") return value ? "Po" : "Jo";
  if (typeof value === "number") return value.toString();
  if (typeof value !== "string") return String(value ?? "") || "-";
  const normalized = value.trim().toLowerCase();
  if (!normalized) return "-";
  if (accidentValueExactTranslations[normalized]) {
    return accidentValueExactTranslations[normalized];
  }
  for (const { pattern, translation } of accidentValueRegexTranslations) {
    if (pattern.test(normalized)) return translation;
  }
  const usageTranslation = translateUsageText(normalized).trim();
  if (usageTranslation && usageTranslation !== normalized) {
    return usageTranslation;
  }

  const koreanTranslation = translateKoreanText(normalized).trim();
  if (koreanTranslation && koreanTranslation !== normalized) {
    return koreanTranslation;
  }

  return normalized;
};

const translateGeneralText = (input?: string | null) => {
  if (input === null || input === undefined) {
    return "";
  }

  const text = input.toString().trim();
  if (!text) {
    return "";
  }

  const usageTranslation = translateUsageText(text).trim();
  if (usageTranslation && usageTranslation !== text) {
    return usageTranslation;
  }

  const koreanTranslation = translateKoreanText(text).trim();
  if (koreanTranslation && koreanTranslation !== text) {
    return koreanTranslation;
  }

  return text;
};

const hasMeaningfulStatusValue = (value: unknown) => {
  if (value === null || value === undefined) return false;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (!normalized) return false;
    if (meaninglessStatusStrings.has(normalized)) return false;
  }
  return true;
};

const hasMeaningfulAccidentValue = (value: unknown) => {
  if (value === null || value === undefined) return false;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (!normalized) return false;
    if (meaninglessAccidentStrings.has(normalized)) return false;
  }
  return true;
};

const isPositiveStatus = (value: unknown) => {
  if (value === undefined || value === null) return true;
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value <= 0;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (!normalized) return true;
    if (positiveStatusValues.has(normalized)) return true;
    if (negativeStatusValues.has(normalized)) return false;
    if (negativeStatusKeywords.some((keyword) => normalized.includes(keyword))) {
      return false;
    }
    return true;
  }
  return true;
};

const isAccidentNegative = (value: unknown) => {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value > 0;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (!normalized) return false;
    if (["yes", "y", "po", "present"].includes(normalized)) return true;
    if (["no", "n", "jo"].includes(normalized)) return false;
    if (/^\d+$/.test(normalized)) return Number.parseInt(normalized, 10) > 0;
    if (
      normalized.includes("exist") ||
      normalized.includes("damage") ||
      normalized.includes("replace") ||
      normalized.includes("repair")
    ) {
      return true;
    }
    if (normalized.includes("none") || normalized.includes("nuk")) {
      return false;
    }
  }
  return false;
};

const formatKeyLabel = (key: string) => translateMechanicalKey(key);

const formatDisplayDate = (
  value?: unknown,
  { monthYear = false }: { monthYear?: boolean } = {},
) => {
  if (value === undefined || value === null) return null;
  // If object, try common date-carrying fields
  if (typeof value === "object") {
    const obj = value as Record<string, unknown>;
    const candidate =
      obj.first_registration ||
      obj.firstDate ||
      obj.date ||
      obj.value ||
      obj.regDate ||
      obj.created_at ||
      obj.updated_at;
    return formatDisplayDate(candidate, { monthYear });
  }
  const raw = typeof value === "number" ? value.toString() : `${value}`.trim();
  if (!raw) return null;

  const normalized = raw.replace(/\s+/g, "");

  const monthYearMatch = normalized.match(/^(\d{2})[./](\d{4})$/);
  if (monthYearMatch) {
    return `${monthYearMatch[1]}.${monthYearMatch[2]}`;
  }

  const dayMonthYearMatch = normalized.match(
    /^(\d{2})[./-](\d{2})[./-](\d{4})$/,
  );
  if (dayMonthYearMatch) {
    const [, dd, mm, yyyy] = dayMonthYearMatch;
    return monthYear ? `${mm}.${yyyy}` : `${dd}.${mm}.${yyyy}`;
  }

  const yearMonthDayMatch = normalized.match(
    /^(\d{4})[./-](\d{2})[./-](\d{2})$/,
  );
  if (yearMonthDayMatch) {
    const [, yyyy, mm, dd] = yearMonthDayMatch;
    return monthYear ? `${mm}.${yyyy}` : `${dd}.${mm}.${yyyy}`;
  }

  const digitsOnly = normalized.replace(/[^0-9]/g, "");
  if (digitsOnly.length === 8) {
    const yyyy = digitsOnly.slice(0, 4);
    const mm = digitsOnly.slice(4, 6);
    const dd = digitsOnly.slice(6, 8);
    return monthYear ? `${mm}.${yyyy}` : `${dd}.${mm}.${yyyy}`;
  }

  if (digitsOnly.length === 6) {
    const yyyy = digitsOnly.slice(0, 4);
    const mm = digitsOnly.slice(4, 6);
    return `${mm}.${yyyy}`;
  }

  const parsed = new Date(raw);
  if (!Number.isNaN(parsed.getTime())) {
    if (monthYear) {
      return parsed.toLocaleDateString("sq-AL", {
        month: "2-digit",
        year: "numeric",
      });
    }
    return parsed.toLocaleDateString("sq-AL", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  }

  return raw.replace(/-/g, ".").replace(/T.*/, "");
};

const ENCARS_PRICE_UNIT_KRW = 10000;

const buildEncarsImageUrl = (path?: string | null) => {
  if (!path) return undefined;
  return `${ENCAR_IMAGE_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;
};

const flattenEncarsInners = (
  inners?: EncarsInspectionResponse["inners"],
): Record<string, string> => {
  const result: Record<string, string> = {};

  const walk = (items: EncarsInspectionResponse["inners"], prefix = "") => {
    if (!items) return;
    items.forEach((item) => {
      if (!item) return;
      const title = item.type?.title?.trim();
      const label = title
        ? prefix
          ? `${prefix} - ${title}`
          : title
        : prefix;

      const candidates: string[] = [];
      if (item.statusType?.title) {
        candidates.push(item.statusType.title);
      }
      if (item.statusTypes && item.statusTypes.length > 0) {
        const joined = item.statusTypes
          .map((status) => status?.title)
          .filter(Boolean)
          .join(", ");
        if (joined) candidates.push(joined);
      }
      if (item.description) {
        candidates.push(String(item.description));
      }

      const value = candidates.find(
        (candidate) => candidate && candidate.trim().length > 0,
      );

      if (value && label) {
        result[label] = value;
      }

      if (item.children && item.children.length > 0) {
        walk(item.children, label || prefix);
      }
    });
  };

  walk(inners);
  return result;
};

const ENCARS_REPORT_UNAVAILABLE_MESSAGE =
  "Raporti Encars nuk është i disponueshëm për këtë makinë.";
const ENCARS_GENERIC_FAILURE_MESSAGE =
  "Nuk u arrit të ngarkohej raporti i inspektimit.";

const ENCARS_NOT_FOUND_REGEX = /\(404\b/;

const isEncarsNotFoundError = (error: unknown): boolean => {
  if (error instanceof Error) {
    if (error.name === "AbortError") {
      return false;
    }
    return ENCARS_NOT_FOUND_REGEX.test(error.message);
  }
  if (typeof error === "string") {
    return ENCARS_NOT_FOUND_REGEX.test(error);
  }
  return false;
};

const mapEncarsRequiredError = (reason: unknown): Error => {
  if (isEncarsNotFoundError(reason)) {
    return new Error(ENCARS_REPORT_UNAVAILABLE_MESSAGE);
  }
  if (reason instanceof Error) {
    return reason;
  }
  return new Error(ENCARS_GENERIC_FAILURE_MESSAGE);
};

const getEncarsDisplayErrorMessage = (error: unknown): string => {
  if (isEncarsNotFoundError(error)) {
    return ENCARS_REPORT_UNAVAILABLE_MESSAGE;
  }
  if (error instanceof Error) {
    if (error.name === "AbortError") {
      return "Kërkesa u ndërpre. Ju lutem provoni përsëri.";
    }
    return error.message;
  }
  return ENCARS_GENERIC_FAILURE_MESSAGE;
};

const logEncarsOptionalFailure = (label: string, reason: unknown) => {
  if (isEncarsNotFoundError(reason)) {
    console.warn(`Encars ${label} nuk u gjet (404).`, reason);
  } else if (reason instanceof Error && reason.name === "AbortError") {
    console.warn(`Kërkesa Encars për ${label} u anulua.`, reason);
  } else {
    console.error(`Dështoi marrja e të dhënave Encars për ${label}:`, reason);
  }
};

const buildAccidentSummaryFromEncars = (
  master: EncarsInspectionResponse["master"],
) => {
  if (!master) return undefined;

  const summary: Record<string, unknown> = {};

  if (typeof master.accdient === "boolean") {
    summary.accident = master.accdient ? "yes" : "no";
  }

  if (typeof master.simpleRepair === "boolean") {
    summary.simple_repair = master.simpleRepair ? "yes" : "no";
  }

  const detail = master.detail as Record<string, unknown> | undefined;
  if (detail) {
    const engineCheck = detail.engineCheck as string | undefined;
    const waterlog = detail.waterlog as boolean | undefined;
    const recall = detail.recall as boolean | undefined;
    const seriousTypes = detail.seriousTypes as unknown;
    const tuningStateTypes = detail.tuningStateTypes as unknown;

    if (engineCheck) summary.engine_check = engineCheck;
    if (typeof waterlog === "boolean")
      summary.waterlog = waterlog ? "yes" : "no";
    if (typeof recall === "boolean") summary.recall = recall ? "yes" : "no";
    if (seriousTypes) summary.serious_types = seriousTypes;
    if (tuningStateTypes) summary.tuning = tuningStateTypes;
  }

  return summary;
};

const CarInspectionReport = () => {
  const { id: lot } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { processFloodDamageText, convertKRWtoEUR } = useCurrencyAPI();
  const {
    getOptionName,
    getOptionDescription,
    loading: optionsLoading,
  } = useKoreaOptions();
  const [car, setCar] = useState<InspectionReportCar | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAllStandard, setShowAllStandard] = useState(true);
  const [showAllChoice, setShowAllChoice] = useState(true);
  const cacheHydratedRef = useRef(false);

  const persistReportToSession = useCallback((targetLot: string, payload: unknown) => {
    if (typeof window === "undefined") {
      return;
    }

    try {
      const serialized = JSON.stringify(payload);
      sessionStorage.setItem(`car_report_${targetLot}`, serialized);
      sessionStorage.setItem(`car_report_prefetch_${targetLot}`, serialized);
    } catch (storageError) {
      console.warn("Failed to persist inspection report in sessionStorage", storageError);
    }
  }, []);

  const hydrateReportFromSession = useCallback((): InspectionReportCar | null => {
    if (!lot || typeof window === "undefined") {
      return null;
    }

    const keys = [`car_report_${lot}`, `car_report_prefetch_${lot}`];
    for (const key of keys) {
      try {
        const raw = sessionStorage.getItem(key);
        if (!raw) {
          continue;
        }
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === "object") {
          return parsed as InspectionReportCar;
        }
      } catch (sessionError) {
        console.warn(`Failed to restore inspection report from ${key}`, sessionError);
      }
    }

    return null;
  }, [lot]);

  const fetchInspectionReport = useCallback(async ({ background = false }: { background?: boolean } = {}) => {
    if (!lot) return;

    if (!background) {
      setLoading(true);
    }
    setError(null);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    try {
      const [
        vehicleResult,
        inspectionResult,
        recordSummaryResult,
      ] = await Promise.allSettled([
        fetchEncarsVehicle(lot, undefined, { signal: controller.signal }),
        fetchEncarsInspection(lot, { signal: controller.signal }),
        fetchEncarsRecordSummary(lot, { signal: controller.signal }),
      ]);

      if (vehicleResult.status !== "fulfilled") {
        throw mapEncarsRequiredError(vehicleResult.reason);
      }

      const encarVehicle = vehicleResult.value;

      const encarInspection =
        inspectionResult.status === "fulfilled"
          ? inspectionResult.value
          : undefined;
      if (inspectionResult.status === "rejected") {
        logEncarsOptionalFailure("inspection", inspectionResult.reason);
      }

      const encarRecordSummary =
        recordSummaryResult.status === "fulfilled"
          ? recordSummaryResult.value
          : undefined;
      if (recordSummaryResult.status === "rejected") {
        logEncarsOptionalFailure(
          "record summary",
          recordSummaryResult.reason,
        );
      }

      let encarRecord: EncarsRecordOpenResponse | undefined;
      try {
        if (encarVehicle?.vehicleNo) {
          encarRecord = await fetchEncarsRecordOpen(
            lot,
            encarVehicle.vehicleNo,
            { signal: controller.signal },
          );
        }
      } catch (recordError) {
        logEncarsOptionalFailure("record open", recordError);
      }

      const priceKRW =
        encarVehicle?.advertisement?.price !== undefined
          ? encarVehicle.advertisement.price * ENCARS_PRICE_UNIT_KRW
          : undefined;
      const priceEUR =
        priceKRW && priceKRW > 0 ? convertKRWtoEUR(priceKRW) : undefined;

      const mainPhoto =
        encarVehicle?.photos?.find((photo) => photo.type === "OUTER") ??
        encarVehicle?.photos?.[0];
      const image = buildEncarsImageUrl(mainPhoto?.path);
      const images =
        encarVehicle?.photos
          ?.map((photo) => buildEncarsImageUrl(photo.path))
          .filter((url): url is string => Boolean(url)) ?? [];

      const ownerChanges: OwnerChangeEntry[] =
        encarRecord?.ownerChanges?.map((date, idx) => ({
          date,
          change_type: `Ndryshimi #${idx + 1}`,
        })) ?? [];

      const usageHistoryEntries: UsageHistoryEntry[] = [];
      if (encarRecordSummary?.use) {
        usageHistoryEntries.push({
          description: "Përdorimi aktual",
          value: decodePrimaryUsage(encarRecordSummary.use),
        });
      }
      if (encarRecord?.carInfoUse1s?.length) {
        encarRecord.carInfoUse1s.forEach((code, idx) =>
          usageHistoryEntries.push({
            description: `Përdorimi kryesor ${idx + 1}`,
            value: decodePrimaryUsage(code),
          }),
        );
      }
      if (encarRecord?.carInfoUse2s?.length) {
        encarRecord.carInfoUse2s.forEach((code, idx) =>
          usageHistoryEntries.push({
            description: `Përdorimi i detajuar ${idx + 1}`,
            value: decodeSecondaryUsage(code),
          }),
        );
      }
      if (encarRecord?.carInfoChanges?.length) {
        encarRecord.carInfoChanges.forEach((change, idx) =>
          usageHistoryEntries.push({
            description: `Ndryshim targash ${idx + 1}`,
            value: `${change.carNo ?? "-"}${change.date
              ? ` (${formatDisplayDate(change.date) ?? change.date})`
              : ""
              }`,
          }),
        );
      }
      if (encarRecordSummary?.carNoChangeCnt !== undefined) {
        usageHistoryEntries.push({
          description: "Numri i ndërrimeve të targës",
          value: `${encarRecordSummary.carNoChangeCnt}`,
        });
      }
      const notJoinDates = [
        encarRecord?.notJoinDate1,
        encarRecord?.notJoinDate2,
        encarRecord?.notJoinDate3,
        encarRecord?.notJoinDate4,
        encarRecord?.notJoinDate5,
      ].filter(Boolean);
      if (notJoinDates.length > 0) {
        usageHistoryEntries.push({
          description: "Periudhat pa sigurim",
          value: notJoinDates.join(", "),
        });
      }

      const insuranceDetails = {
        usage_history: usageHistoryEntries,
        owner_changes: ownerChanges,
        car_info: {
          car_no: encarRecordSummary?.carNo ?? encarRecord?.carNo,
          first_registration:
            encarRecordSummary?.firstDate ?? encarRecord?.firstDate,
          fuel: encarRecordSummary?.fuel ?? encarRecord?.fuel,
          displacement:
            encarRecordSummary?.displacement ?? encarRecord?.displacement,
          use: encarRecordSummary?.use,
        },
      };

      const insuranceV2 = {
        accidentCnt: encarRecordSummary?.accidentCnt,
        myAccidentCnt: encarRecordSummary?.myAccidentCnt,
        otherAccidentCnt: encarRecordSummary?.otherAccidentCnt,
        ownerChangeCnt: encarRecordSummary?.ownerChangeCnt,
        totalLossCnt: encarRecordSummary?.totalLossCnt,
        floodTotalLossCnt: encarRecordSummary?.floodTotalLossCnt,
        accidents: encarRecord?.accidents,
        carInfoChanges: encarRecord?.carInfoChanges,
        carInfoUse1s: encarRecord?.carInfoUse1s,
        carInfoUse2s: encarRecord?.carInfoUse2s,
      };

      const inspectInner = flattenEncarsInners(encarInspection?.inners);
      const accidentSummary = buildAccidentSummaryFromEncars(
        encarInspection?.master,
      );

      const transformed: InspectionReportCar = {
        id: (encarVehicle?.vehicleId ?? lot).toString(),
        lot,
        make: encarVehicle?.category?.manufacturerName,
        model:
          encarVehicle?.category?.modelName ??
          encarVehicle?.category?.modelGroupName,
        year: encarVehicle?.category?.formYear
          ? Number.parseInt(encarVehicle.category.formYear, 10)
          : undefined,
        title:
          encarVehicle?.category?.gradeName ??
          `${encarVehicle?.category?.manufacturerName ?? ""} ${encarVehicle?.category?.modelName ?? ""
            }`.trim(),
        image,
        priceEUR,
        mileageKm: encarVehicle?.spec?.mileage,
        odometer: encarVehicle?.spec?.mileage
          ? { km: encarVehicle.spec.mileage }
          : undefined,
        vin: encarVehicle?.vin,
        fuel: encarVehicle?.spec?.fuelName,
        firstRegistration:
          encarRecordSummary?.firstDate ??
          (typeof (encarInspection?.master?.detail as any)
            ?.firstRegistrationDate === "string"
            ? (encarInspection?.master?.detail as any).firstRegistrationDate
            : encarVehicle?.category?.yearMonth),
        postedAt:
          encarVehicle?.manage?.registDateTime ??
          encarVehicle?.manage?.firstAdvertisedDateTime,
        engineDisplacement: encarVehicle?.spec?.displacement,
        damage:
          encarInspection?.outers && encarInspection.outers.length > 0
            ? {
              main: encarInspection.outers
                .filter((outer) =>
                  outer.statusTypes?.some(
                    (status) => status.code?.toUpperCase() === "X",
                  ),
                )
                .map((outer) => outer.type?.title)
                .filter(Boolean)
                .join(", "),
            }
            : null,
        insurance: insuranceDetails,
        insurance_v2: insuranceV2,
        details: {
          inspect_outer: encarInspection?.outers ?? [],
          inspect: {
            outer: encarInspection?.outers ?? [],
            inner: inspectInner,
            accident_summary: accidentSummary ?? {},
          },
          options: {
            standard: encarVehicle?.options?.standard ?? [],
            choice: encarVehicle?.options?.choice ?? [],
          },
          options_extra: encarVehicle?.options?.etc ?? [],
          insurance: insuranceDetails,
        },
        inspect: {
          outer: encarInspection?.outers ?? [],
          inner: inspectInner,
          accident_summary: accidentSummary ?? {},
        },
        ownerChanges,
        maintenanceHistory: [],
        location: encarVehicle?.contact?.address,
        grade: encarVehicle?.category?.gradeName,
        sourceLabel: encarVehicle?.category?.manufacturerName
          ? `Encars • ${encarVehicle.category.manufacturerName}`
          : "Encars",
        images,
        encarVehicle: encarVehicle ?? undefined,
        encarInspection: encarInspection ?? undefined,
        encarRecord: encarRecord ?? undefined,
        encarRecordSummary: encarRecordSummary ?? undefined,
      };

      setCar(transformed);
      cacheHydratedRef.current = true;
      persistReportToSession(String(lot), transformed);
      setLoading(false);
    } catch (error) {
      console.error("Nuk u arrit të ngarkohej raporti i inspektimit:", error);
      if (!background) {
        setError(getEncarsDisplayErrorMessage(error));
        setCar(null);
        setLoading(false);
      } else {
        console.warn(
          "Background inspection report refresh failed",
          error,
        );
      }
    } finally {
      clearTimeout(timeoutId);
    }
  }, [convertKRWtoEUR, lot, persistReportToSession]);

  useEffect(() => {
    cacheHydratedRef.current = false;
    setCar(null);
    setError(null);
    setLoading(true);
  }, [lot]);

  useEffect(() => {
    const cached = hydrateReportFromSession();
    if (cached) {
      setCar(cached);
      setLoading(false);
      cacheHydratedRef.current = true;
    }
  }, [hydrateReportFromSession]);

  useEffect(() => {
    trackPageView(`/car/${lot}/report`, {
      page_type: "inspection_report",
    });
  }, [lot]);

  useEffect(() => {
    fetchInspectionReport({ background: cacheHydratedRef.current });
  }, [fetchInspectionReport]);

  const inspectionOuterData = useMemo(() => {
    const collected: any[] = [];
    const visited = new Set<unknown>();

    const collectItems = (value: unknown) => {
      if (!value || visited.has(value)) {
        return;
      }

      if (Array.isArray(value)) {
        visited.add(value);
        value.forEach(collectItems);
        return;
      }

      if (typeof value === "object") {
        visited.add(value);
        const typedValue = value as Record<string, unknown>;
        const potentialItem =
          "type" in typedValue ||
          "statusTypes" in typedValue ||
          "status_types" in typedValue ||
          "attributes" in typedValue;

        if (potentialItem) {
          collected.push(value);
        }

        Object.values(typedValue).forEach(collectItems);
      }
    };

    [
      car?.details?.inspect_outer,
      car?.inspect?.outer,
      car?.inspect?.inspect_outer,
      (car as any)?.details?.inspect?.outer,
      (car as any)?.details?.outer,
      car?.encarInspection?.outers,
    ].forEach(collectItems);

    const plainOuterSources: Array<Record<string, unknown> | undefined> = [
      (car?.inspect?.outer as Record<string, unknown> | undefined),
      (car?.inspect?.inspect_outer as Record<string, unknown> | undefined),
      (car as any)?.details?.inspect_outer as Record<string, unknown> | undefined,
      (car as any)?.details?.inspect?.outer as Record<string, unknown> | undefined,
    ];

    plainOuterSources.forEach((source) => {
      if (!source || typeof source !== "object" || Array.isArray(source)) {
        return;
      }

      Object.entries(source).forEach(([partKey, rawValue]) => {
        if (rawValue === undefined || rawValue === null) {
          return;
        }

        const entries = Array.isArray(rawValue)
          ? rawValue
          : [rawValue];
        if (entries.length === 0) return;

        const statusTypes = entries
          .map((entry) => {
            if (entry && typeof entry === "object") {
              const candidate = entry as Record<string, unknown>;
              const codeCandidate =
                candidate.code ??
                candidate.status ??
                candidate.value ??
                candidate.result ??
                candidate.type;
              const titleCandidate =
                candidate.title ??
                candidate.name ??
                candidate.description ??
                candidate.label ??
                candidate.text;

              if (codeCandidate === undefined && titleCandidate === undefined) {
                return null;
              }

              return {
                code:
                  codeCandidate !== undefined
                    ? String(codeCandidate)
                    : undefined,
                title:
                  titleCandidate !== undefined
                    ? String(titleCandidate)
                    : undefined,
              };
            }

            const value = String(entry ?? "").trim();
            if (!value) {
              return null;
            }

            return {
              code: value.length <= 4 ? value.toUpperCase() : undefined,
              title: value,
            };
          })
          .filter(Boolean);

        if (statusTypes.length === 0) return;

        collected.push({
          type: { code: partKey, title: partKey },
          statusTypes,
          attributes: [],
        });
      });
    });

    const keyed = new Map<string, any>();
    for (const item of collected) {
      const key =
        (item as any)?.type?.code ||
        (item as any)?.code ||
        (item as any)?.type?.title ||
        JSON.stringify(item);
      if (!keyed.has(key)) {
        keyed.set(key, {
          ...item,
          statusTypes: Array.isArray((item as any)?.statusTypes)
            ? [...(item as any).statusTypes]
            : [],
          attributes: Array.isArray((item as any)?.attributes)
            ? [...(item as any).attributes]
            : [],
        });
      } else {
        const existing = keyed.get(key);
        if (Array.isArray((item as any)?.statusTypes) && (item as any).statusTypes.length > 0) {
          existing.statusTypes.push(...(item as any).statusTypes);
        }
        if (Array.isArray((item as any)?.attributes) && (item as any).attributes.length > 0) {
          existing.attributes.push(...(item as any).attributes);
        }
        if (!existing.type?.title && item?.type?.title) {
          existing.type = existing.type ?? {};
          existing.type.title = item.type.title;
        }
      }
    }

    return Array.from(keyed.values()).map((entry) => {
      if (Array.isArray(entry.statusTypes) && entry.statusTypes.length > 1) {
        const seen = new Set<string>();
        entry.statusTypes = entry.statusTypes.filter((status: any) => {
          const statusKey = `${status?.code ?? ""}|${status?.title ?? ""}`.toLowerCase();
          if (seen.has(statusKey)) {
            return false;
          }
          seen.add(statusKey);
          return true;
        });
      }
      return entry;
    });
  }, [car]);

  const inspectionInnerData = useMemo(() => {
    const raw =
      car?.details?.inspect?.inner ||
      car?.inspect?.inner ||
      (car as any)?.details?.inspect_inner ||
      null;

    if (!raw || typeof raw !== "object") return null;

    const result: Record<string, unknown> = {};

    const walk = (obj: any, prefix = "") => {
      if (!obj || typeof obj !== "object") return;
      for (const [k, v] of Object.entries(obj)) {
        const key = prefix ? `${prefix} ${k}` : k;
        if (v !== null && typeof v === "object" && !Array.isArray(v)) {
          walk(v, key);
        } else if (Array.isArray(v)) {
          // Join simple arrays, or recurse elements
          const simple = v.every((el) => typeof el !== "object");
          if (simple) {
            result[key] = v.join(", ");
          } else {
            v.forEach((el, idx) => walk(el, `${key} ${idx + 1}`));
          }
        } else {
          result[key] = v as unknown;
        }
      }
    };

    walk(raw);
    return result;
  }, [car]);

  const mechanicalStatusEntries = useMemo(
    () =>
      inspectionInnerData
        ? Object.entries(inspectionInnerData).filter(([, value]) =>
          hasMeaningfulStatusValue(value),
        )
        : [],
    [inspectionInnerData],
  );

  const accidentSummaryData = car?.inspect?.accident_summary;

  const accidentSummaryEntries = useMemo(
    () =>
      accidentSummaryData && typeof accidentSummaryData === "object"
        ? Object.entries(accidentSummaryData).filter(([key, value]) => {
          const normalizedKey =
            typeof key === "string"
              ? key.replace(/[\s_]/g, "").toLowerCase()
              : "";
          if (ACCIDENT_SUMMARY_HIDDEN_KEYS.has(normalizedKey)) {
            return false;
          }
          return hasMeaningfulAccidentValue(value);
        })
        : [],
    [accidentSummaryData],
  );

  const inspectionIssueSummary = useMemo(() => {
    if (!inspectionOuterData || inspectionOuterData.length === 0) {
      return { replacements: 0, repairs: 0, total: 0, unaffected: 0 };
    }

    let replacements = 0;
    let repairs = 0;

    inspectionOuterData.forEach((item: any) => {
      const rawStatuses =
        item?.statusTypes ?? (item as any)?.status_types ?? [];
      const statuses = Array.isArray(rawStatuses)
        ? rawStatuses
        : rawStatuses
          ? [rawStatuses]
          : [];
      const rawAttributes = item?.attributes ?? (item as any)?.attribute;
      const attributes = Array.isArray(rawAttributes)
        ? rawAttributes
        : rawAttributes
          ? [rawAttributes]
          : [];

      let markerType: "N" | "R" | null = null;

      statuses.forEach((status: any) => {
        const code = (status?.code || status?.status || "")
          .toString()
          .toUpperCase();
        const title = (status?.title || status?.name || "")
          .toString()
          .toLowerCase();

        if (
          code === "X" ||
          code === "N" ||
          title.includes("exchange") ||
          title.includes("replacement") ||
          title.includes("교환")
        ) {
          markerType = "N";
        } else if (
          code === "A" ||
          code === "R" ||
          code === "W" ||
          title.includes("repair") ||
          title.includes("수리") ||
          title.includes("weld") ||
          title.includes("용접")
        ) {
          markerType = markerType === "N" ? markerType : "R";
        }
      });

      if (!markerType) {
        const hasRankIndicator = attributes.some((attr: any) => {
          const value =
            typeof attr === "string"
              ? attr
              : typeof attr?.code === "string"
                ? attr.code
                : typeof attr?.title === "string"
                  ? attr.title
                  : "";
          const normalized = value.toUpperCase();
          return normalized.includes("RANK") || normalized.includes("GRADE");
        });

        if (hasRankIndicator) {
          markerType = "R";
        }
      }

      if (markerType === "N") {
        replacements += 1;
      } else if (markerType === "R") {
        repairs += 1;
      }
    });

    const total = inspectionOuterData.length;
    const affected = replacements + repairs;
    const unaffected = Math.max(total - affected, 0);

    return { replacements, repairs, total, unaffected };
  }, [inspectionOuterData]);

  const insuranceCarInfo = useMemo<InsuranceSummaryInfo | undefined>(() => {
    const baseInfo =
      car?.details?.insurance?.car_info &&
        typeof car.details.insurance.car_info === "object"
        ? { ...(car.details.insurance.car_info as Record<string, unknown>) }
        : {};

    const insuranceV2 = car?.insurance_v2 as
      | Record<string, unknown>
      | undefined;
    if (insuranceV2) {
      const assignIfMissing = (
        key: keyof InsuranceSummaryInfo,
        value: unknown,
      ) => {
        if (value === undefined || value === null || value === "") return;
        if (!(key in baseInfo)) {
          baseInfo[key] = value;
        }
      };

      const accidentCount =
        typeof insuranceV2.accidentCnt === "number"
          ? insuranceV2.accidentCnt
          : ((insuranceV2.myAccidentCnt as number | undefined) ?? 0) +
          ((insuranceV2.otherAccidentCnt as number | undefined) ?? 0);
      if (accidentCount) {
        assignIfMissing("accident_history", accidentCount);
      }

      const repairCount =
        typeof insuranceV2.myAccidentCnt === "number" &&
          typeof insuranceV2.otherAccidentCnt === "number"
          ? insuranceV2.myAccidentCnt + insuranceV2.otherAccidentCnt
          : (insuranceV2.myAccidentCnt ?? insuranceV2.otherAccidentCnt);
      if (repairCount !== undefined) {
        assignIfMissing("repair_count", repairCount);
      }

      if (typeof insuranceV2.totalLossCnt === "number") {
        assignIfMissing("total_loss", insuranceV2.totalLossCnt);
      }

      if (typeof insuranceV2.floodTotalLossCnt === "number") {
        assignIfMissing("flood_damage", insuranceV2.floodTotalLossCnt);
      }
    }

    return Object.keys(baseInfo).length > 0
      ? (baseInfo as InsuranceSummaryInfo)
      : undefined;
  }, [car]);

  const accidents = useMemo(() => {
    if (!car?.insurance_v2?.accidents) return [];
    if (Array.isArray(car.insurance_v2.accidents)) {
      return car.insurance_v2.accidents;
    }
    return [];
  }, [car]);

  const usageHistoryList = useMemo<UsageHistoryEntry[]>(
    () => buildUsageHistoryList(car, formatDisplayDate),
    [car],
  );

  const toYesNo = useCallback((value?: string | number | boolean | null) => {
    const evaluate = (input: unknown): "Po" | "Jo" | null => {
      if (input === undefined || input === null) return null;

      if (Array.isArray(input)) {
        for (const item of input) {
          const result = evaluate(item);
          if (result) return result;
        }
        return null;
      }

      if (typeof input === "boolean") return input ? "Po" : "Jo";
      if (typeof input === "number") return input > 0 ? "Po" : "Jo";

      const rawString = input.toString().trim();
      if (!rawString) return null;

      const normalized = rawString.toLowerCase();
      const compact = normalized.replace(/\s+/g, "");
      const asciiOnly = normalized.replace(/[^a-z0-9]/g, "");
      const tokens = normalized
        .replace(/[\u3000]/g, " ")
        .split(/[\s,.;:!?()<>|/\\\-]+/)
        .filter(Boolean);
      const tokenSet = new Set(tokens);

      const containsIndicator = (text: string, indicators: string[]) =>
        indicators.some((indicator) => text.includes(indicator));

      const unknownIndicators = [
        "unknown",
        "n/a",
        "n\\a",
        "not available",
        "no data",
        "not provided",
        "unavailable",
        "undefined",
        "정보없",
        "미확인",
        "확인불가",
        "미제공",
        "알수없",
        "확인 안됨",
        "정보 없음",
      ];
      if (
        containsIndicator(normalized, unknownIndicators) ||
        containsIndicator(compact, unknownIndicators)
      ) {
        return null;
      }

      const directYesTokens = [
        "po",
        "yes",
        "true",
        "y",
        "present",
        "exists",
        "available",
        "positive",
      ];
      const directYesAscii = ["1"];
      if (
        directYesTokens.some((token) => tokenSet.has(token)) ||
        directYesAscii.includes(asciiOnly)
      ) {
        return "Po";
      }

      const directNoTokens = [
        "jo",
        "no",
        "false",
        "n",
        "never",
        "none",
        "without",
        "absent",
        "missing",
        "lack",
        "zero",
        "negative",
      ];
      const directNoAscii = ["0"];
      if (
        directNoTokens.some((token) => tokenSet.has(token)) ||
        directNoAscii.includes(asciiOnly)
      ) {
        return "Jo";
      }

      const negativeIndicators = [
        "없음",
        "없다",
        "無",
        "무사",
        "무이력",
        "미사용",
        "미이용",
        "미보유",
        "미등록",
        "미발견",
        "미이력",
        "미취급",
        "미진행",
        "미해당",
        "해당없",
        "해당 없음",
        "해당사항없",
        "해당 사항 없음",
        "아님",
        "아니",
        "불가",
        "비영업",
        "비사업",
        "자가용",
        "private",
        "non-commercial",
        "non commercial",
        "noncommercial",
        "no history",
        "no histories",
        "no record",
        "no records",
        "no rental",
        "no rent",
        "no commercial",
        "no usage",
        "no usage history",
        "no history of use",
        "no business history",
        "no rental history",
        "without usage",
        "without usage history",
        "without history of use",
        "usage history not found",
        "history of use none",
        "nuk ka histori",
        "nuk ka perdorim",
        "nuk ka përdorim",
        "not found",
        "norent",
        "norental",
        "norecord",
        "미렌트",
        "렌트이력없음",
        "영업이력없음",
      ];
      if (
        containsIndicator(normalized, negativeIndicators) ||
        containsIndicator(compact, negativeIndicators)
      ) {
        return "Jo";
      }

      const historyContextTerms = [
        "history",
        "record",
        "histori",
        "perdorim",
        "përdorim",
        "이력",
        "기록",
      ];
      const usageContextTerms = [
        "use",
        "usage",
        "perdorim",
        "perdorimi",
        "përdorim",
        "përdorimi",
        "rental",
        "rent",
        "lease",
        "leasing",
        "business",
        "commercial",
        "fleet",
        "operation",
        "biznes",
        "taxi",
      ];
      const positiveHistoryPresenceTerms = [
        "has",
        "have",
        "having",
        "with",
        "exists",
        "exist",
        "present",
        "available",
        "recorded",
        "ka ",
        "ka-",
        "ka histori",
        "ka perdorim",
        "ka përdorim",
      ];
      const negativeHistoryPresenceTerms = [
        "no",
        "without",
        "none",
        "never",
        "lack",
        "absent",
        "nuk",
        "pa ",
        "pa-",
      ];

      const hasHistoryContext =
        containsIndicator(normalized, historyContextTerms) ||
        containsIndicator(compact, historyContextTerms);
      const hasUsageContext =
        containsIndicator(normalized, usageContextTerms) ||
        containsIndicator(compact, usageContextTerms);
      const hasPositiveHistoryPresence =
        containsIndicator(normalized, positiveHistoryPresenceTerms) ||
        /있다|있음|보유|유|존재/.test(normalized);
      const hasNegativeHistoryPresence =
        containsIndicator(normalized, negativeHistoryPresenceTerms) ||
        /없|無|미사용|비사용|무이력/.test(normalized);

      if (
        hasHistoryContext &&
        hasUsageContext &&
        hasPositiveHistoryPresence &&
        !hasNegativeHistoryPresence
      ) {
        return "Po";
      }

      if (
        (tokenSet.has("non") &&
          (tokenSet.has("commercial") ||
            tokenSet.has("business") ||
            tokenSet.has("rental") ||
            tokenSet.has("rent"))) ||
        (tokenSet.has("no") &&
          (tokenSet.has("commercial") ||
            tokenSet.has("business") ||
            tokenSet.has("rental") ||
            tokenSet.has("rent")))
      ) {
        return "Jo";
      }

      const positiveIndicators = [
        "있음",
        "있다",
        "유",
        "보유",
        "사용",
        "사용중",
        "임대",
        "렌트",
        "렌터카",
        "임차",
        "대여",
        "영업",
        "영업용",
        "사업",
        "사업용",
        "업무용",
        "상업",
        "komerc",
        "komercial",
        "commercial",
        "corporate",
        "taxi",
        "fleet",
        "lease",
        "leasing",
        "법인",
        "biz",
        "biznes",
      ];
      if (
        containsIndicator(normalized, positiveIndicators) ||
        containsIndicator(compact, positiveIndicators)
      ) {
        return "Po";
      }

      const numeric = parseFloat(asciiOnly || normalized);
      if (!isNaN(numeric)) {
        return numeric > 0 ? "Po" : "Jo";
      }

      return null;
    };

    return evaluate(value);
  }, []);

  const ownerChangesList = useMemo<OwnerChangeEntry[]>(() => {
    const entries: OwnerChangeEntry[] = [];
    const addEntry = (entry: any) => {
      if (!entry) return;
      entries.push({
        date:
          entry?.date ||
          entry?.change_date ||
          entry?.changeDate ||
          entry?.changed_at ||
          entry?.created_at ||
          entry?.updated_at,
        change_type:
          entry?.change_type ||
          entry?.type ||
          entry?.description ||
          entry?.label,
        previous_number:
          entry?.previous_number ||
          entry?.previousNumber ||
          entry?.carNo ||
          entry?.number,
        usage_type: entry?.usage_type || entry?.usageType || entry?.useType,
      });
    };

    const insuranceOwnerChanges = car?.details?.insurance?.owner_changes;
    if (Array.isArray(insuranceOwnerChanges)) {
      insuranceOwnerChanges.forEach(addEntry);
    }

    if (Array.isArray(car?.ownerChanges)) {
      car.ownerChanges.forEach(addEntry);
    }

    const ownerChangesV2 = (car?.insurance_v2 as any)?.ownerChanges;
    if (Array.isArray(ownerChangesV2)) {
      ownerChangesV2.forEach(addEntry);
    }

    const seen = new Set<string>();
    return entries.filter((entry) => {
      const key = `${entry.date ?? ""}-${entry.change_type ?? ""}-${entry.previous_number ?? ""}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [car]);

  const accidentEntries = useMemo(() => {
    return accidents.map((accident: any) => {
      const dateValue =
        accident?.date ||
        accident?.accidentDate ||
        accident?.accident_date ||
        accident?.created_at ||
        accident?.updated_at;

      const normalizeValue = (value: unknown) => {
        if (value === undefined || value === null || value === "") return "-";
        if (typeof value === "number") {
          const eurValue = Math.round(convertKRWtoEUR(value));
          return eurValue > 0 ? `${eurValue}€` : "-";
        }
        if (typeof value === "string") {
          const trimmed = value.trim();
          if (!trimmed) return "-";
          return trimmed;
        }
        return String(value) || "-";
      };

      return {
        date: dateValue ? (formatDisplayDate(dateValue) ?? dateValue) : "-",
        type:
          accident?.type === "2"
            ? "Dëmtimi i vet"
            : accident?.type === "3"
              ? "Dëmtim nga tjeri"
              : accident?.type
                ? `Tipi ${accident.type}`
                : "-",
        part: normalizeValue(
          accident?.part ||
          accident?.partCost ||
          accident?.parts ||
          accident?.component ||
          accident?.position,
        ),
        paint: normalizeValue(
          accident?.paintingCost || accident?.paint || accident?.painting,
        ),
        labor: normalizeValue(
          accident?.laborCost || accident?.labor || accident?.workCost,
        ),
        total: normalizeValue(
          accident?.insuranceBenefit ||
          accident?.total ||
          accident?.totalCost ||
          accident?.sum,
        ),
      };
    });
  }, [accidents, convertKRWtoEUR]);

  const hasAccidentDetails = useMemo(
    () =>
      accidentEntries.some((entry) =>
        Object.values(entry).some(
          (value) =>
            value !== "-" &&
            value !== "" &&
            value !== null &&
            value !== undefined,
        ),
      ),
    [accidentEntries],
  );

  const ownerChangeCount =
    typeof car?.insurance_v2?.ownerChangeCnt === "number"
      ? car.insurance_v2.ownerChangeCnt
      : ownerChangesList.length > 0
        ? ownerChangesList.length
        : car?.ownerChanges?.length;

  const ownerChangesDisplay =
    ownerChangeCount === undefined
      ? "-"
      : ownerChangeCount === 0
        ? "Asnjë"
        : ownerChangeCount === 1
          ? "1 herë"
          : `${ownerChangeCount} herë`;

  const usageHighlights = useMemo<
    Array<{ label: string; value: string; details?: string[] }>
  >(() => {
    const primaryCodeSet = new Set<string>();
    const secondaryCodeSet = new Set<string>();
    const textSourceSet = new Set<string>();

    const addPrimaryCode = (value: unknown) => {
      if (Array.isArray(value)) {
        value.forEach(addPrimaryCode);
        return;
      }
      if (value === null || value === undefined) return;
      const code = String(value).trim();
      if (!code) return;
      primaryCodeSet.add(code);
    };

    const addSecondaryCode = (value: unknown) => {
      if (Array.isArray(value)) {
        value.forEach(addSecondaryCode);
        return;
      }
      if (value === null || value === undefined) return;
      const code = String(value).trim();
      if (!code) return;
      secondaryCodeSet.add(code);
    };

    const addTextSource = (value: unknown) => {
      if (Array.isArray(value)) {
        value.forEach(addTextSource);
        return;
      }
      if (typeof value === "string") {
        const trimmed = value.trim();
        if (!trimmed || trimmed === "-" || trimmed === "--") return;
        const normalized = trimmed.toLowerCase();
        if (
          normalized === "informacion i padisponueshëm" ||
          normalized === "informacion i padisponueshem" ||
          normalized === "pa të dhëna" ||
          normalized === "pa te dhena" ||
          normalized === "n/a" ||
          normalized === "na" ||
          normalized === "none"
        ) {
          return;
        }
        textSourceSet.add(trimmed);
      }
    };

    addTextSource(car?.details?.insurance?.general_info?.usage_type);
    addTextSource((car?.details?.insurance?.car_info as any)?.usage_type);
    addTextSource((car?.details as any)?.usage_type);
    addTextSource((car?.insurance_v2 as any)?.usageType);
    addTextSource((car?.insurance_v2 as any)?.useType);
    addTextSource((car?.insurance_v2 as any)?.usage_type);

    addPrimaryCode((car?.details?.insurance?.car_info as any)?.use);
    addPrimaryCode(car?.encarRecordSummary?.use);
    addPrimaryCode(car?.encarRecord?.use);
    addPrimaryCode((car?.insurance_v2 as any)?.useType);
    addPrimaryCode((car?.insurance_v2 as any)?.usageType);
    addPrimaryCode(car?.insurance_v2?.carInfoUse1s);

    addSecondaryCode(car?.insurance_v2?.carInfoUse2s);
    addSecondaryCode((car?.encarRecord as any)?.carInfoUse2s);

    usageHistoryList.forEach((entry) => {
      addTextSource(entry.description);
      addTextSource(entry.value);
    });

    const primaryCodes = Array.from(primaryCodeSet);
    const secondaryCodes = Array.from(secondaryCodeSet);
    const textSources = Array.from(textSourceSet);

    const rentalDetails = new Set<string>();
    const commercialDetails = new Set<string>();
    const generalDetails = new Set<string>();

    const addDetail = (set: Set<string>, detail?: string) => {
      if (!detail) return;
      const trimmed = detail.trim();
      if (
        !trimmed ||
        trimmed === "-" ||
        trimmed === "--" ||
        trimmed === "Informacion i padisponueshëm" ||
        trimmed.toLowerCase().includes("pa të dhëna") ||
        trimmed.toLowerCase().includes("pa te dhena")
      ) {
        return;
      }
      const translated = translateUsageText(trimmed).trim();
      if (!translated || isUsageDetailHidden(translated)) {
        return;
      }
      set.add(translated);
    };

    let codeIndicatesRental = false;
    let codeIndicatesCommercial = false;
    let codeIndicatesGeneral = false;

    primaryCodes.forEach((code) => {
      if (!code) return;
      if (["2", "3", "4"].includes(code)) {
        codeIndicatesCommercial = true;
        addDetail(commercialDetails, decodePrimaryUsage(code));
      } else if (code === "1") {
        codeIndicatesGeneral = true;
        addDetail(generalDetails, decodePrimaryUsage(code));
      }
    });

    secondaryCodes.forEach((code) => {
      if (!code) return;
      if (["4", "5"].includes(code)) {
        codeIndicatesRental = true;
        addDetail(rentalDetails, decodeSecondaryUsage(code));
      } else if (["2", "3", "6", "7", "8"].includes(code)) {
        codeIndicatesCommercial = true;
        addDetail(commercialDetails, decodeSecondaryUsage(code));
      } else if (code === "1") {
        codeIndicatesGeneral = true;
        addDetail(generalDetails, decodeSecondaryUsage(code));
      }
    });

    const rentalKeywords = [
      "rent",
      "rental",
      "rentcar",
      "rent car",
      "lease",
      "leasing",
      "qira",
      "qiraja",
      "rentë",
      "rentim",
      "임대",
      "임차",
      "렌트",
      "렌터카",
      "대여",
    ];
    const commercialKeywords = [
      "komerc",
      "komercial",
      "commercial",
      "business",
      "biznes",
      "corporate",
      "company",
      "fleet",
      "taxi",
      "transport",
      "delivery",
      "cargo",
      "logistics",
      "영업",
      "영업용",
      "사업",
      "사업용",
      "법인",
      "업무",
    ];
    const generalKeywords = [
      "general",
      "i përgjithshëm",
      "i pergjithshem",
      "përdorim i përgjithshëm",
      "perdorim i pergjithshem",
      "private",
      "personal",
      "individual",
      "vetjak",
      "non-commercial",
      "non commercial",
      "noncommercial",
      "비영업",
      "자가용",
    ];

    const negativeRentalPatterns = [
      /no\s+rent/i,
      /no\s+rental/i,
      /without\s+rent/i,
      /without\s+rental/i,
      /no\s+rentcar/i,
      /norent/i,
      /norental/i,
      /nuk\s+ka\s+rent/i,
      /nuk\s+ka\s+qira/i,
      /pa\s+qira/i,
      /미렌트/,
      /렌트이력없음/,
    ];
    const negativeCommercialPatterns = [
      /no\s+commercial/i,
      /without\s+commercial/i,
      /non[-\s]?commercial/i,
      /no\s+business/i,
      /without\s+business/i,
      /nuk\s+ka\s+biznes/i,
      /pa\s+biznes/i,
      /비영업/,
      /영업이력없음/,
    ];

    let textIndicatesRental = false;
    let textIndicatesCommercial = false;
    let textIndicatesGeneral = false;

    const includesAny = (normalized: string, keywords: string[]) =>
      keywords.some((keyword) => normalized.includes(keyword));

    textSources.forEach((text) => {
      if (!text) return;
      if (/^-?\d+(\.\d+)?$/.test(text)) {
        return;
      }
      const normalized = text.toLowerCase();
      const yesNo = toYesNo(text as any);
      const rentKeyword = includesAny(normalized, rentalKeywords);
      const commercialKeyword = includesAny(normalized, commercialKeywords);
      const generalKeyword = includesAny(normalized, generalKeywords);

      const rentNeg = negativeRentalPatterns.some((pattern) =>
        pattern.test(text),
      );
      const commercialNeg = negativeCommercialPatterns.some((pattern) =>
        pattern.test(text),
      );

      if (rentKeyword) {
        if (yesNo === "Jo" || rentNeg) {
          textIndicatesGeneral = true;
          addDetail(generalDetails, text);
        } else {
          textIndicatesRental = true;
          addDetail(rentalDetails, text);
        }
      }

      if (commercialKeyword) {
        if (yesNo === "Jo" || commercialNeg) {
          textIndicatesGeneral = true;
          addDetail(generalDetails, text);
        } else {
          textIndicatesCommercial = true;
          addDetail(commercialDetails, text);
        }
      }

      if (
        generalKeyword ||
        (!rentKeyword && !commercialKeyword && yesNo === "Jo")
      ) {
        textIndicatesGeneral = true;
        addDetail(generalDetails, text);
      }
    });

    const hasRent =
      codeIndicatesRental || textIndicatesRental || rentalDetails.size > 0;
    const hasCommercial =
      codeIndicatesCommercial ||
      textIndicatesCommercial ||
      commercialDetails.size > 0;
    const hasGeneral =
      codeIndicatesGeneral || textIndicatesGeneral || generalDetails.size > 0;

    const hasNonZeroPrimaryCode = primaryCodes.some(
      (code) => code && code !== "0",
    );
    const hasNonZeroSecondaryCode = secondaryCodes.some(
      (code) => code && code !== "0",
    );
    const hasMeaningfulEvidence =
      hasRent ||
      hasCommercial ||
      hasGeneral ||
      hasNonZeroPrimaryCode ||
      hasNonZeroSecondaryCode ||
      textSources.length > 0;

    const rentalValue = hasRent
      ? "Po"
      : hasGeneral || hasMeaningfulEvidence
        ? "Jo"
        : "Nuk ka informata";

    const generalDetailsList = Array.from(generalDetails);
    if (hasGeneral) {
      generalDetailsList.unshift(
        "Raporti përmend përdorim të përgjithshëm (informativ)",
      );
    }

    const generalValue = hasMeaningfulEvidence ? "Jo" : "Nuk ka informata";

    const sanitizeDetails = (details: Iterable<string>) => {
      const seen = new Set<string>();
      const result: string[] = [];
      for (const detail of details) {
        const translated = translateUsageText(detail).trim();
        if (!translated || isUsageDetailHidden(translated) || seen.has(translated)) {
          continue;
        }
        seen.add(translated);
        result.push(translated);
      }
      return result;
    };

    const rentalDetailsList = sanitizeDetails(rentalDetails);
    const generalDetailsSanitized = sanitizeDetails(generalDetailsList);

    const highlightItems = [
      {
        label: "Përdorur si veturë me qira",
        value: rentalValue,
        details: rentalDetailsList,
      },
      {
        label: "Përdorim i përgjithshëm",
        value: generalValue,
        details: generalDetailsSanitized,
      },
    ];

    return highlightItems.filter(
      (item) =>
        item.value !== "Nuk ka informata" ||
        (item.details && item.details.length > 0),
    );
  }, [car, toYesNo, usageHistoryList]);

  const specialAccidentHistory = useMemo<SpecialAccidentEntry[]>(() => {
    const entries: SpecialAccidentEntry[] = [];

    const rawHistory = car?.details?.insurance?.special_accident_history;
    if (Array.isArray(rawHistory)) {
      rawHistory.forEach((item: any) => {
        if (!item) return;
        entries.push({
          type: item.type,
          value:
            typeof item.value === "string"
              ? item.value
              : item.value !== undefined && item.value !== null
                ? String(item.value)
                : undefined,
        });
      });
    }

    accidentEntries.forEach((entry) => {
      const valueParts = [
        entry.date && entry.date !== "-" ? `Data: ${entry.date}` : null,
        entry.part && entry.part !== "-" ? `Pjesë: ${entry.part}` : null,
        entry.paint && entry.paint !== "-" ? `Bojë: ${entry.paint}` : null,
        entry.labor && entry.labor !== "-" ? `Punë: ${entry.labor}` : null,
        entry.total && entry.total !== "-" ? `Total: ${entry.total}` : null,
      ].filter(Boolean);

      if (valueParts.length > 0) {
        entries.push({
          type: entry.type || "Ngjarje",
          value: valueParts.join(" • "),
        });
      }
    });

    const seen = new Set<string>();
    return entries.filter((entry) => {
      const key = `${entry.type ?? ""}-${entry.value ?? ""}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [accidentEntries, car]);

  const specialAccidentStats = useMemo(() => {
    const floodSource =
      typeof car?.insurance_v2?.floodTotalLossCnt === "number"
        ? car.insurance_v2.floodTotalLossCnt
        : insuranceCarInfo?.flood_damage;

    const totalLossSource =
      typeof car?.insurance_v2?.totalLossCnt === "number"
        ? car.insurance_v2.totalLossCnt
        : insuranceCarInfo?.total_loss;

    const accidentCountSource =
      typeof car?.insurance_v2?.accidentCnt === "number"
        ? car.insurance_v2.accidentCnt
        : insuranceCarInfo?.accident_history;

    const floodValue =
      typeof floodSource === "number"
        ? floodSource > 0
          ? "Po"
          : "Jo"
        : floodSource
          ? (toYesNo(floodSource as any) ??
            processFloodDamageText(String(floodSource)))
          : "Nuk ka informata";

    const totalLossValue =
      typeof totalLossSource === "number"
        ? totalLossSource > 0
          ? "Po"
          : "Jo"
        : totalLossSource !== undefined
          ? (toYesNo(totalLossSource as any) ?? `${totalLossSource}`)
          : "Nuk ka informata";

    const accidentCountValue =
      accidentCountSource !== undefined &&
        accidentCountSource !== null &&
        accidentCountSource !== ""
        ? `${accidentCountSource}`
        : "Nuk ka informata";

    return [
      {
        label: "Vërshuar?",
        value: floodValue,
      },
      {
        label: "Humbje totale?",
        value: totalLossValue,
      },
      {
        label: "Aksidente të raportuara",
        value: accidentCountValue,
      },
      {
        label: "Pronaret e ndërruar",
        value: ownerChangesDisplay,
      },
    ];
  }, [
    car,
    insuranceCarInfo,
    ownerChangesDisplay,
    processFloodDamageText,
    toYesNo,
  ]);

  const handleContactWhatsApp = useCallback(() => {
    if (!car) return;
    const messageParts = [
      "Përshëndetje! Jam i interesuar për raportin e inspektimit",
      car.year ? `${car.year}` : "",
      car.make ?? "",
      car.model ?? "",
      car.lot ? `(Kodi ${car.lot})` : "",
      "- a mund të më dërgoni më shumë informacione?",
    ]
      .filter(Boolean)
      .join(" ");
    const whatsappUrl = `https://wa.me/38348181116?text=${encodeURIComponent(messageParts)}`;
    window.open(whatsappUrl, "_blank");
  }, [car]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex items-center gap-3 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Po ngarkohet raporti i inspektimit...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-lg shadow-lg">
          <CardHeader className="flex flex-col items-center text-center gap-2">
            <AlertTriangle className="h-10 w-10 text-destructive" />
            <CardTitle className="text-xl font-semibold text-foreground">
              Nuk u arrit të ngarkohej raporti
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-center text-muted-foreground">
            <p>{error}</p>
            <Button variant="outline" onClick={() => navigate(-1)}>
              Kthehu mbrapa
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!car) {
    return null;
  }

  const carName =
    `${car.year || ""} ${car.make || ""} ${car.model || ""}`.trim();
  const formattedPrice = car.priceEUR
    ? `${car.priceEUR.toLocaleString("de-DE")} €`
    : undefined;
  const formattedMileage = car.mileageKm
    ? formatMileage(car.mileageKm)
    : car.odometer?.km
      ? formatMileage(car.odometer.km)
      : undefined;

  // Removed Posted At display per request

  const firstRegistrationDisplay = formatDisplayDate(
    car.firstRegistration ||
    car.details?.first_registration ||
    car.details?.registration_date ||
    car.insurance_v2?.firstDate,
    { monthYear: true },
  );

  const engineSource =
    car.engineDisplacement ||
    car.details?.engine_volume ||
    car.details?.engine?.displacement ||
    car.details?.engine_capacity ||
    car.insurance_v2?.displacement;

  let engineDisplay: string | null = null;
  if (typeof engineSource === "number") {
    engineDisplay = `${engineSource.toLocaleString("de-DE")} cc`;
  } else if (typeof engineSource === "string") {
    const trimmedEngine = engineSource.trim();
    if (trimmedEngine) {
      engineDisplay = trimmedEngine.toLowerCase().includes("cc")
        ? trimmedEngine
        : `${trimmedEngine} cc`;
    }
  }

  const fuelSource =
    car.fuel ||
    car.details?.fuel_type ||
    car.details?.fuel?.name ||
    car.insurance_v2?.fuel ||
    car.details?.specs?.fuel;

  const fuelDisplay =
    typeof fuelSource === "string" && fuelSource.trim()
      ? fuelSource.charAt(0).toUpperCase() + fuelSource.slice(1)
      : (fuelSource ?? null);

  const mileageDisplay = formattedMileage || "-";

  const topVehicleInfo = [
    { label: "Vetura", value: carName || car.title || "-" },
    { label: "Regjistrimi i parë", value: firstRegistrationDisplay ?? "-" },
    { label: "Numri i shasisë", value: car.vin || "-" },
    { label: "Karburanti", value: fuelDisplay || "-" },
    { label: "Kilometra", value: mileageDisplay },
  ];

  const generalVehicleInfo = [
    { label: "Prodhuesi", value: car.make || "-" },
    { label: "Modeli", value: car.model || "-" },
    { label: "Regjistrimi i parë", value: firstRegistrationDisplay ?? "-" },
    { label: "Karburanti", value: fuelDisplay || "-" },
    { label: "Motorri", value: engineDisplay || "-" },
    { label: "Pronaret e ndërruar", value: ownerChangesDisplay },
  ];

  const accidentBadgeCount =
    typeof car.insurance_v2?.accidentCnt === "number"
      ? car.insurance_v2.accidentCnt
      : accidentEntries.length;

  const heroImageSrc = car.image || "/placeholder.svg";

  const quickStats: Array<{
    label: string;
    value: string;
    icon: LucideIcon;
    highlight?: boolean;
  }> = [
      {
        label: "Kilometrazhi",
        value: mileageDisplay,
        icon: Gauge,
      },
      {
        label: "Aksidente",
        value: `${accidentBadgeCount}`,
        icon: AlertTriangle,
        highlight: accidentBadgeCount > 0,
      },
      {
        label: "Ndërrime pronari",
        value: ownerChangesDisplay,
        icon: Users,
      },
      {
        label: "Regjistrimi i parë",
        value: firstRegistrationDisplay ?? "-",
        icon: Clock,
      },
    ];

  const vehicleSubtitle =
    car.title &&
      carName &&
      car.title.trim().toLowerCase() !== carName.toLowerCase()
      ? car.title
      : undefined;

  const locationDisplay =
    car.location?.name ??
    (typeof car.details?.location === "string"
      ? car.details.location
      : car.details?.location?.name) ??
    (typeof car.details?.dealer === "string"
      ? car.details.dealer
      : (car.details?.dealer as { name?: string } | undefined)?.name) ??
    null;

  const overviewInfo = [
    { label: "Prodhuesi", value: car.make || "-" },
    { label: "Modeli", value: car.model || "-" },
    { label: "Regjistrimi i parë", value: firstRegistrationDisplay ?? "-" },
    { label: "Kilometra", value: mileageDisplay },
    { label: "Karburanti", value: fuelDisplay || "-" },
    { label: "Motorri", value: engineDisplay || "-" },
    { label: "Numri i shasisë", value: car.vin || "-" },
    { label: "Pronaret e ndërruar", value: ownerChangesDisplay },
    {
      label: "Burimi i të dhënave",
      value: car.sourceLabel || "Encars Korea",
    },
    { label: "Lokacioni", value: locationDisplay || "-" },
  ];

  const galleryImages = Array.from(
    new Set(
      (
        car.images && car.images.length > 0
          ? car.images
          : heroImageSrc
            ? [heroImageSrc]
            : []
      ).filter((image): image is string => Boolean(image)),
    ),
  ).slice(0, 12);

  const sectionNavItems: Array<{
    id: string;
    label: string;
    icon: LucideIcon;
  }> = [
      { id: "permbledhje", label: "Përmbledhje", icon: FileText },
      { id: "inspektimi", label: "Inspektimi", icon: Wrench },
      { id: "sigurimi", label: "Sigurimi", icon: Shield },
      { id: "perdorimi", label: "Pronësia", icon: Users },
      { id: "opsionet", label: "Opsionet", icon: Cog },
      { id: "garancia", label: "Garancia", icon: CheckCircle },
    ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container-responsive py-4 md:py-6">
        <Button
          variant="outline"
          size="sm"
          onClick={() => openCarDetailsInNewTab(car.lot || lot)}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Kthehu te makinat
        </Button>
        <Tabs defaultValue="diagram" className="space-y-4">
          <TabsList className="w-full grid grid-cols-2 md:grid-cols-4 gap-1.5 bg-muted/60 p-1.5 rounded-xl h-auto">
            <TabsTrigger
              value="inspection"
              className="flex items-center justify-start gap-2 rounded-lg px-3 py-2.5 text-xs font-medium"
            >
              <FileText className="h-4 w-4 text-primary" />
              <span>Inspektimi & Mjeti</span>
            </TabsTrigger>
            <TabsTrigger
              value="history"
              className="flex items-center justify-start gap-2 rounded-lg px-3 py-2.5 text-xs font-medium"
            >
              <Clock className="h-4 w-4 text-primary" />
              <span>Historia e Përdorimit</span>
            </TabsTrigger>
            <TabsTrigger
              value="insurance"
              className="flex items-center justify-start gap-2 rounded-lg px-3 py-2.5 text-xs font-medium"
            >
              <AlertTriangle className="h-4 w-4 text-primary" />
              <span>Aksidentet & Sigurimi</span>
            </TabsTrigger>
            <TabsTrigger
              value="options"
              className="flex items-center justify-start gap-2 rounded-lg px-3 py-2.5 text-xs font-medium"
            >
              <Cog className="h-4 w-4 text-primary" />
              <span>Pajisjet & Opsionet</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="inspection" className="space-y-4">
            {/* Redesigned Inspection Diagram matching Korean format */}
            <div className="space-y-4">
              <Card className="border border-primary/20 bg-primary/5 backdrop-blur-sm">
                <CardContent className="px-4 py-4 sm:px-6">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div className="space-y-1">
                      <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-primary">
                        <Wrench className="h-3.5 w-3.5" />
                        Përmbledhja e kontrollit
                      </div>
                      <p className="text-xs md:text-sm text-muted-foreground leading-relaxed">
                        {inspectionIssueSummary.total > 0
                          ? `${inspectionIssueSummary.total} zona të kontrolluara në raportin zyrtar korean të inspektimit.`
                          : "Të dhënat e jashtme të inspektimit nuk janë të disponueshme për këtë automjet."}
                      </p>
                    </div>
                    {inspectionIssueSummary.total > 0 && (
                      <div className="grid w-full grid-cols-3 gap-2 sm:gap-3 lg:w-auto lg:auto-cols-max lg:grid-flow-col">
                        <div className="rounded-xl border border-primary/30 bg-background/80 px-3 py-2 sm:px-4">
                          <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                            Ndërrime (N)
                          </span>
                          <p className="text-lg font-bold text-[#E53935]">
                            {inspectionIssueSummary.replacements}
                          </p>
                        </div>
                        <div className="rounded-xl border border-primary/30 bg-background/80 px-3 py-2 sm:px-4">
                          <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                            Riparime (R)
                          </span>
                          <p className="text-lg font-bold text-[#D84315]">
                            {inspectionIssueSummary.repairs}
                          </p>
                        </div>
                        <div className="rounded-xl border border-emerald-200/60 bg-emerald-50/60 dark:bg-emerald-500/10 px-3 py-2 sm:px-4">
                          <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                            Zona pa shenja
                          </span>
                          <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                            {inspectionIssueSummary.unaffected}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Encar-style Car Inspection Diagram */}
              <CarInspectionDiagram
                inspectionData={(car?.encarInspection?.outers || [])
                  .filter((item) => item.type?.code && item.type?.title)
                  .map((item) => ({
                    type: {
                      code: item.type!.code!,
                      title: item.type!.title!
                    },
                    statusTypes: (item.statusTypes || []).map((st) => ({
                      code: st.code || '',
                      title: st.title || ''
                    })),
                    attributes: item.attributes || []
                  }))}
                className="my-6"
              />
              <div className="mt-8">
                <InspectionItemList inspectionData={car.encarInspection} />
              </div>
              {/* Mechanical System Section */}
              {mechanicalStatusEntries.length > 0 && (
                <Card className="shadow-md border-border/80">
                  <CardHeader className="pb-3 md:pb-4">
                    <div className="flex items-center gap-2 md:gap-3">
                      <Cog className="h-4 w-4 md:h-5 md:w-5 text-primary" />
                      <CardTitle className="text-base md:text-xl">
                        Motori dhe Sistemi Mekanik
                      </CardTitle>
                    </div>
                    <p className="text-xs md:text-sm text-muted-foreground mt-1">
                      Kontrolli teknik i komponentëve kryesorë të automjetit
                    </p>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-1.5 md:gap-2 grid-cols-2 lg:grid-cols-3">
                      {mechanicalStatusEntries.map(([key, value]) => {
                        const positive = isPositiveStatus(value);
                        return (
                          <div
                            key={key}
                            className={`p-1.5 md:p-2.5 rounded-lg border text-[11px] md:text-sm ${positive
                              ? "border-emerald-400/40 bg-emerald-50/60 dark:bg-emerald-500/10"
                              : "border-red-400/40 bg-red-50/60 dark:bg-red-500/10"
                              }`}
                          >
                            <span className="font-semibold text-foreground block mb-0.5 truncate leading-tight">
                              {formatKeyLabel(key)}
                            </span>
                            <p
                              className={`font-medium leading-tight ${positive ? "text-emerald-700" : "text-red-700"}`}
                            >
                              {translateStatusValue(value)}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Accident Summary Section */}
              {accidentSummaryEntries.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">
                      Përmbledhje e Aksidenteve
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-2 md:gap-4 grid-cols-2 lg:grid-cols-3">
                      {accidentSummaryEntries.map(([key, value]) => {
                        const isNegative = isAccidentNegative(value);

                        return (
                          <div
                            key={key}
                            className={`flex flex-col gap-1.5 md:gap-2 rounded-lg border p-2.5 md:p-4 ${isNegative
                              ? "border-destructive/50 bg-destructive/5"
                              : "border-border bg-muted/40"
                              }`}
                          >
                            <div className="flex items-center gap-1.5 md:gap-2">
                              {isNegative ? (
                                <AlertTriangle className="h-3.5 w-3.5 md:h-4 md:w-4 text-destructive flex-shrink-0" />
                              ) : (
                                <CheckCircle className="h-3.5 w-3.5 md:h-4 md:w-4 text-green-600 flex-shrink-0" />
                              )}
                              <span className="text-[10px] md:text-xs font-medium uppercase tracking-wide text-muted-foreground leading-tight">
                                {translateAccidentSummaryKey(key)}
                              </span>
                            </div>
                            <span
                              className={`text-base md:text-lg font-bold ${isNegative ? "text-destructive" : "text-green-600"}`}
                            >
                              {translateAccidentSummaryValue(value)}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Vehicle History Panel (Consolidated) */}
            <VehicleHistoryPanel
              manufacturer={car?.encarVehicle?.category?.manufacturerName || car?.make}
              model={car?.encarVehicle?.category?.modelName || car?.model}
              rating={car?.encarVehicle?.category?.gradeName}
              yearOfManufacture={car?.year || (car?.encarVehicle?.category?.formYear ? parseInt(car.encarVehicle.category.formYear) : undefined)}
              mileage={car?.encarVehicle?.spec?.mileage || car?.mileageKm || car?.odometer?.km}
              productionDate={car?.encarRecord?.firstDate || car?.firstRegistration}
              countryOfOrigin={car?.encarVehicle?.category?.domestic ? 'Korea' : 'E importuar'}
              use={car?.encarRecord?.use || car?.encarRecordSummary?.use || 'Personale'}
              newCarPrice={car?.encarVehicle?.category?.originPrice}
              newCarReleasePrice={car?.encarVehicle?.category?.originPrice}
              fuel={car?.encarVehicle?.spec?.fuelName || car?.fuel}
              cityFuelConsumption="Nuk ka informacion"
              highwayFuelConsumption="Nuk ka informacion"
            />

            {/* Warranty Card (Consolidated) */}
            <Card className="shadow-md border-border/80">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Shield className="h-5 w-5 text-primary" />
                  <CardTitle className="text-xl">Garancioni KORAUTO</CardTitle>
                </div>
                <p className="text-sm text-muted-foreground">
                  Përmbledhje e mbulimit të garancionit për automjetet tona
                </p>
              </CardHeader>
              <CardContent className="space-y-4 text-sm leading-6 text-muted-foreground">
                <p>
                  Nëse pas inspektimit në Kosovë automjeti rezulton me defekte
                  në aksident ne pjesen e jashtme dhe brendshme motor,
                  transmision apo manipulim kilometrazhi , shitësi mban
                  përgjegjësi. Për pjesët harxhueshme nuk ofrohet garanci dhe
                  nuk mbahet përgjegjësi.
                </p>

                <p>Pjesët e Mbulueshme dhe të Përjashtuara nga Garancia</p>

                <h3 className="font-semibold text-foreground">
                  I. Pjesë të Pa-Konsumueshme (të mbuluara nga garancia)
                </h3>
                <p>
                  Këto pjesë mbulohen vetëm në rast defekti të brendshëm teknik,
                  jo konsum normal:
                </p>
                <p>- Motori (blloku, koka e cilindrit, pistonët, boshtet)</p>
                <p>
                  - Transmisioni (manual ose automatik, përjashtuar kuplungu dhe
                  volanti)
                </p>
                <p>- Diferenciali dhe boshtet e fuqisë</p>
                <p>- ECU, alternatori, starteri</p>
                <p>- Kompresori i AC, kondensatori, avulluesi</p>
                <p>- Airbagët, rripat e sigurimit</p>
                <p>- Struktura e karrocerisë dhe shasia</p>

                <h3 className="font-semibold text-foreground">
                  II. Pjesë të Konsumueshme (të përjashtuara nga garancia)
                </h3>
                <p>
                  Të gjitha pjesët e mëposhtme janë konsumueshme dhe
                  përjashtohen nga garancia:
                </p>

                <p>• Kuplungu dhe pjesët përreth:</p>
                <p> - Disku i kuplungut</p>
                <p> - Pllaka e presionit</p>
                <p> - Rulja e lirimit (lageri i lirimit)</p>
                <p> - Volanti (rrota e masës, DMF)</p>
                <p> - Rrotulla amortizuese / amortizues torsional</p>

                <p>• Sistemi i Frenimit:</p>
                <p> - Diskat e frenave, blloqet (pads), këpucët e frenimit</p>
                <p> - Lëngu i frenave</p>

                <p>• Filtrat & Lëngjet:</p>
                <p> - Filtri i vajit, ajrit, kabinës, karburantit</p>
                <p> - Vaji i motorit, antifrizi, vaji i transmisionit</p>
                <p> - Lëngu i larjes së xhamave</p>

                <p>• Suspensioni & Drejtimi:</p>
                <p> - Amortizatorët (vaj, vula, konsumim)</p>
                <p> - Bushingët, nyjet e topit, lidhëset stabilizuese</p>

                <p>• Rrotat & Energjia:</p>
                <p> - Velgjat (fellnet), gomat, balancimi, rregullimi i drejtimit</p>
                <p> - Bateria 12V, llambat, siguresat</p>

                <p>• Të tjera Konsumueshme:</p>
                <p> - Fshirëset e xhamave, spërkatësit</p>
                <p> - Buzhitë e ndezjes dhe buzhitë inkandeshente</p>
                <p>
                  {" "}
                  - Rripat (serpentine, timing sipas intervalit të prodhuesit)
                </p>
                <p> - Tubat gome, vulat, garniturat</p>

                <h3 className="font-semibold text-foreground">III. Kushtet</h3>
                <p>
                  - Garancia mbulon vetëm defekte teknike jo të lidhura me
                  konsumim normal.
                </p>
                <p>
                  - Për makinat e përdorura, të gjitha pjesët konsumueshme janë
                  të përjashtuara pa përjashtim.
                </p>
                <p>- Mirëmbajtja e rregullt është përgjegjësi e klientit.</p>

                <div className="pt-1">
                  <Button
                    variant="outline"
                    onClick={() => navigate("/garancioni")}
                  >
                    Shiko faqen e plotë të garancionit
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Insurance History & Mechanical System Tab */}
          <TabsContent value="insurance" className="space-y-4">
            {/* New Encar-style Insurance/Maintenance Panel */}
            <InsuranceMaintenancePanel
              insuranceClaims={car?.encarRecord?.accidents?.map((acc: any) => ({
                date: acc.date || '',
                type: acc.type === '1' ? 'my_damage' : acc.type === '2' ? 'other_damage' : 'estimate',
                costParts: acc.partCost,
                costService: acc.laborCost,
                costCoating: acc.paintingCost,
                description: `Insurance benefit: ${acc.insuranceBenefit || 0} KRW`
              })) || []}
              maintenanceRecords={[]}
            />

            {/* Separator */}
            <Separator className="my-6" />

            {/* Original insurance content below */}
            <Card className="shadow-md border-border/80">
              <CardHeader className="pb-3 md:pb-4">
                <div className="flex items-center gap-2 md:gap-3">
                  <Shield className="h-4 w-4 md:h-5 md:w-5 text-primary" />
                  <CardTitle className="text-base md:text-xl">
                    Historia e Sigurimit dhe Aksidenteve
                  </CardTitle>
                </div>
                <p className="text-xs md:text-sm text-muted-foreground mt-1">
                  Të dhëna të plota nga kompania e sigurimit dhe historia e
                  aksidenteve
                </p>
              </CardHeader>
              <CardContent className="space-y-3 md:space-y-6">
                {/* Insurance Summary Stats */}
                {car.insurance_v2 &&
                  Object.keys(car.insurance_v2).length > 0 ? (
                  <div className="grid gap-2 grid-cols-2 md:gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <div className="flex flex-col gap-0.5 md:gap-1 rounded-lg border border-border/60 bg-muted/40 p-2 md:p-3">
                      <span className="text-[10px] md:text-xs uppercase tracking-wide text-muted-foreground">
                        Aksidente
                      </span>
                      <span className="text-xl md:text-2xl font-bold text-destructive">
                        {car.insurance_v2.accidentCnt || 0}
                      </span>
                    </div>
                    <div className="flex flex-col gap-0.5 md:gap-1 rounded-lg border border-border/60 bg-muted/40 p-2 md:p-3">
                      <span className="text-[10px] md:text-xs uppercase tracking-wide text-muted-foreground">
                        Ndërrimi i Pronarëve
                      </span>
                      <span className="text-xl md:text-2xl font-bold text-foreground">
                        {car.insurance_v2.ownerChangeCnt || 0}
                      </span>
                    </div>
                    <div className="flex flex-col gap-0.5 md:gap-1 rounded-lg border border-border/60 bg-muted/40 p-2 md:p-3">
                      <span className="text-[10px] md:text-xs uppercase tracking-wide text-muted-foreground">
                        Humbje Totale
                      </span>
                      <span className="text-xl md:text-2xl font-bold text-foreground">
                        {car.insurance_v2.totalLossCnt || 0}
                      </span>
                    </div>
                    <div className="flex flex-col gap-0.5 md:gap-1 rounded-lg border border-border/60 bg-muted/40 p-2 md:p-3">
                      <span className="text-[10px] md:text-xs uppercase tracking-wide text-muted-foreground">
                        Vjedhje
                      </span>
                      <span className="text-xl md:text-2xl font-bold text-foreground">
                        {car.insurance_v2.robberCnt || 0}
                      </span>
                    </div>
                  </div>
                ) : null}

                {/* Detailed Accident History */}
                {car.insurance_v2?.accidents &&
                  car.insurance_v2.accidents.length > 0 && (
                    <div className="space-y-2 md:space-y-3">
                      <h3 className="text-base md:text-lg font-semibold text-foreground">
                        Detajet e Aksidenteve
                      </h3>
                      <div className="space-y-2 md:space-y-3">
                        {car.insurance_v2.accidents.map(
                          (accident: any, idx: number) => (
                            <Card
                              key={idx}
                              className="border-l-4 border-l-destructive"
                            >
                              <CardContent className="p-2.5 md:p-4">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 md:gap-3 mb-2 md:mb-3">
                                  <div className="flex items-center gap-2">
                                    <Clock className="h-3.5 w-3.5 md:h-4 md:w-4 text-muted-foreground" />
                                    <span className="text-sm md:text-base font-semibold">
                                      {accident.date || "Data e panjohur"}
                                    </span>
                                  </div>
                                  <Badge
                                    variant="outline"
                                    className="w-fit text-xs"
                                  >
                                    Lloji:{" "}
                                    {accident.type === "2"
                                      ? "Dëmtimi i vet"
                                      : accident.type === "3"
                                        ? "Dëmtim nga tjeri"
                                        : `Lloji ${accident.type}`}
                                  </Badge>
                                </div>
                                <div className="grid gap-1.5 md:gap-2 grid-cols-2 md:grid-cols-2 lg:grid-cols-4">
                                  <div className="flex flex-col gap-0.5 md:gap-1">
                                    <span className="text-[10px] md:text-xs text-muted-foreground">
                                      Shpenzimet totale
                                    </span>
                                    <span className="text-sm md:text-base font-bold text-destructive">
                                      {Math.round(
                                        convertKRWtoEUR(
                                          accident.insuranceBenefit || 0,
                                        ),
                                      ).toLocaleString()}
                                      €
                                    </span>
                                  </div>
                                  <div className="flex flex-col gap-0.5 md:gap-1">
                                    <span className="text-[10px] md:text-xs text-muted-foreground">
                                      Punë
                                    </span>
                                    <span className="text-sm md:text-base font-semibold">
                                      {Math.round(
                                        convertKRWtoEUR(
                                          accident.laborCost || 0,
                                        ),
                                      ).toLocaleString()}
                                      €
                                    </span>
                                  </div>
                                  <div className="flex flex-col gap-0.5 md:gap-1">
                                    <span className="text-[10px] md:text-xs text-muted-foreground">
                                      Lyerje
                                    </span>
                                    <span className="text-sm md:text-base font-semibold">
                                      {Math.round(
                                        convertKRWtoEUR(
                                          accident.paintingCost || 0,
                                        ),
                                      ).toLocaleString()}
                                      €
                                    </span>
                                  </div>
                                  <div className="flex flex-col gap-0.5 md:gap-1">
                                    <span className="text-[10px] md:text-xs text-muted-foreground">
                                      Pjesë
                                    </span>
                                    <span className="text-sm md:text-base font-semibold">
                                      {Math.round(
                                        convertKRWtoEUR(accident.partCost || 0),
                                      ).toLocaleString()}
                                      €
                                    </span>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ),
                        )}
                      </div>
                    </div>
                  )}

                {/* Car Info Changes (License Plate Changes) */}
                {car.insurance_v2?.carInfoChanges &&
                  car.insurance_v2.carInfoChanges.length > 0 && (
                    <div className="space-y-2 md:space-y-3">
                      <h3 className="text-base md:text-lg font-semibold text-foreground">
                        Ndryshimet e Informacionit të Makinës
                      </h3>
                      <div className="space-y-1.5 md:space-y-2">
                        {car.insurance_v2.carInfoChanges.map(
                          (change: any, idx: number) => (
                            <div
                              key={idx}
                              className="flex items-center justify-between p-2 md:p-3 rounded-lg border border-border/60 bg-muted/30"
                            >
                              <span className="text-sm md:text-base font-mono font-semibold">
                                {change.carNo || "Pa të dhëna"}
                              </span>
                              <span className="text-xs md:text-sm text-muted-foreground">
                                {change.date || "Data e panjohur"}
                              </span>
                            </div>
                          ),
                        )}
                      </div>
                    </div>
                  )}

                {(!car.insurance_v2 ||
                  Object.keys(car.insurance_v2).length === 0) && (
                    <div className="text-center py-8 text-muted-foreground">
                      <Shield className="h-12 w-12 mx-auto mb-3 opacity-20" />
                      <p>Nuk ka informata për historinë e sigurimit</p>
                    </div>
                  )}
              </CardContent>
            </Card>

            {/* Maintenance History */}
            {car.maintenanceHistory && car.maintenanceHistory.length > 0 && (
              <Card className="shadow-md border-border/80">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <Clock className="h-5 w-5 text-primary" />
                    <CardTitle className="text-xl">
                      Historia e Mirëmbajtjes
                    </CardTitle>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Shërbimet dhe mirëmbajtjet e regjistruara për automjetin
                  </p>
                </CardHeader>
                <CardContent className="space-y-3">
                  {car.maintenanceHistory.map((record: any, index: number) => {
                    const serviceType =
                      translateGeneralText(record.service_type) ||
                      translateGeneralText(record.type) ||
                      "Shërbim i përgjithshëm";
                    const description = translateGeneralText(record.description);

                    return (
                      <Card
                        key={index}
                        className="border border-border/60 bg-muted/40"
                      >
                        <CardContent className="pt-4 space-y-2 text-sm text-muted-foreground">
                          <div className="flex flex-wrap justify-between gap-2">
                            <div className="font-semibold text-foreground">
                              {serviceType}
                            </div>
                            {record.date && (
                              <Badge variant="outline" className="text-xs">
                                {record.date}
                              </Badge>
                            )}
                          </div>
                          {description && <p>{description}</p>}
                          {record.mileage && (
                            <p className="text-xs">
                              Kilometrazh:{" "}
                              <span className="font-medium">
                                {record.mileage}
                              </span>
                            </p>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </CardContent>
              </Card>
            )}

            {/* Special Accident History - Moved from Exterior Tab */}
            {(specialAccidentStats.length > 0 || insuranceCarInfo) && (
              <Card className="shadow-md border-border/80">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="h-5 w-5 text-primary" />
                    <CardTitle className="text-xl">
                      Detajet e Aksidenteve dhe Dëmtimeve
                    </CardTitle>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Informacion i detajuar për aksidentet dhe dëmtimet e
                    regjistruara
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  {specialAccidentStats.length > 0 && (
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                      {specialAccidentStats.map((item) => (
                        <div
                          key={item.label}
                          className="flex flex-col gap-1.5 rounded-lg border border-border/60 bg-gradient-to-br from-muted/50 to-muted/30 p-3"
                        >
                          <span className="text-xs uppercase tracking-wide text-muted-foreground font-medium">
                            {item.label}
                          </span>
                          <span className="text-base font-bold text-foreground">
                            {item.value}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {specialAccidentHistory.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-semibold text-foreground">
                        Kronologjia e Aksidenteve
                      </h4>
                      {specialAccidentHistory.map((entry, index) => (
                        <div
                          key={`${entry?.type || "event"}-${index}`}
                          className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border/40 bg-background/60 px-4 py-3 text-sm hover:bg-muted/30 transition-colors"
                        >
                          <span className="font-medium text-foreground">
                            {entry?.type || "Ngjarje"}
                          </span>
                          <span className="text-muted-foreground font-medium">
                            {entry?.value || "-"}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {insuranceCarInfo && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-semibold text-foreground">
                        Përmbledhje Sigurimi
                      </h4>
                      {[
                        {
                          label: "Historia e aksidenteve",
                          value: insuranceCarInfo.accident_history,
                        },
                        {
                          label: "Riparime të regjistruara",
                          value: insuranceCarInfo.repair_count,
                        },
                        {
                          label: "Humbje totale",
                          value: insuranceCarInfo.total_loss,
                        },
                        {
                          label: "Dëmtime nga uji",
                          value: insuranceCarInfo.flood_damage
                            ? processFloodDamageText(
                              String(insuranceCarInfo.flood_damage),
                            )
                            : undefined,
                        },
                      ]
                        .filter((item) => item.value)
                        .map((item) => (
                          <div
                            key={item.label}
                            className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border/40 bg-gradient-to-r from-background/80 to-background/60 px-4 py-3 text-sm"
                          >
                            <span className="font-semibold text-foreground">
                              {item.label}
                            </span>
                            <span className="text-muted-foreground font-medium">
                              {String(item.value)}
                            </span>
                          </div>
                        ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Options & Equipment Tab */}
          <TabsContent value="options" className="space-y-4">
            <Card className="shadow-md border-border/80">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Cog className="h-5 w-5 text-primary" />
                  <CardTitle className="text-xl">
                    Pajisjet dhe Opsionet
                  </CardTitle>
                </div>
                <p className="text-sm text-muted-foreground">
                  Lista e plotë e pajisjeve standarde dhe opsionale
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Extra Options with Details */}
                {car.details?.options_extra &&
                  car.details.options_extra.length > 0 && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-accent"></div>
                        <h3 className="text-base font-semibold text-foreground">
                          Opsione Shtesë me Çmim
                        </h3>
                        <div className="flex-1 h-px bg-border"></div>
                        <span className="text-xs text-muted-foreground font-medium">
                          {car.details.options_extra.length} opsione
                        </span>
                      </div>
                      <div className="grid gap-4 sm:grid-cols-1 lg:grid-cols-2">
                        {car.details.options_extra.map(
                          (option: any, idx: number) => {
                            const translatedName =
                              getOptionName(option.code) !== option.code
                                ? getOptionName(option.code)
                                : option.name || option.name_original;
                            const priceKRW = option.price || 0;
                            const priceInEur = Math.round(
                              convertKRWtoEUR(priceKRW),
                            );

                            return (
                              <Card key={idx} className="border-primary/20">
                                <CardContent className="p-4 space-y-2">
                                  <div className="flex items-start justify-between gap-2">
                                    <div className="flex-1">
                                      <h4 className="font-semibold text-base">
                                        {translatedName}
                                      </h4>
                                      {option.name_original &&
                                        translatedName !==
                                        option.name_original && (
                                          <p className="text-xs text-muted-foreground">
                                            {option.name_original}
                                          </p>
                                        )}
                                    </div>
                                    {priceInEur > 0 && (
                                      <Badge
                                        variant="secondary"
                                        className="text-sm font-bold"
                                      >
                                        {priceInEur.toLocaleString()}€
                                      </Badge>
                                    )}
                                  </div>
                                  {(getOptionDescription(option.code) ||
                                    option.description) && (
                                      <p className="text-sm text-muted-foreground leading-relaxed">
                                        {getOptionDescription(option.code) ||
                                          option.description}
                                      </p>
                                    )}
                                </CardContent>
                              </Card>
                            );
                          },
                        )}
                      </div>
                    </div>
                  )}

                {/* Standard Options */}
                {car.details?.options?.standard &&
                  Array.isArray(car.details.options.standard) &&
                  car.details.options.standard.length > 0 && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-primary"></div>
                        <h3 className="text-base font-semibold text-foreground">
                          Pajisje Standarde
                        </h3>
                        <div className="flex-1 h-px bg-border"></div>
                        <span className="text-xs text-muted-foreground font-medium">
                          {car.details.options.standard.length} pajisje
                        </span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2">
                        {(showAllStandard
                          ? car.details.options.standard
                          : car.details.options.standard.slice(0, 6)
                        ).map((optionCode: string, idx: number) => {
                          const displayName = getOptionName(optionCode);
                          return (
                            <div
                              key={idx}
                              className="flex items-center gap-2 p-2 bg-primary/5 border border-primary/20 rounded-md hover:bg-primary/10 hover:border-primary/30 transition-all duration-200 group"
                            >
                              <CheckCircle className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                              <span className="text-xs text-foreground group-hover:text-primary transition-colors leading-tight line-clamp-1">
                                {displayName}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                      {car.details.options.standard.length > 6 && (
                        <div className="flex justify-center pt-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowAllStandard(!showAllStandard)}
                            className="h-9 px-4 text-sm text-primary hover:bg-primary/10 font-medium border-primary/30"
                          >
                            {showAllStandard
                              ? `Më pak`
                              : `Shfaq të gjitha (${car.details.options.standard.length - 6} më shumë)`}
                          </Button>
                        </div>
                      )}
                    </div>
                  )}

                {/* Choice Options */}
                {car.details?.options?.choice &&
                  Array.isArray(car.details.options.choice) &&
                  car.details.options.choice.length > 0 && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-accent"></div>
                        <h3 className="text-base font-semibold text-foreground">
                          Opsione të Zgjedhura
                        </h3>
                        <div className="flex-1 h-px bg-border"></div>
                        <span className="text-xs text-muted-foreground font-medium">
                          {car.details.options.choice.length} opsione
                        </span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2">
                        {(showAllChoice
                          ? car.details.options.choice
                          : car.details.options.choice.slice(0, 6)
                        ).map((optionCode: string, idx: number) => {
                          const displayName = getOptionName(optionCode);
                          return (
                            <div
                              key={idx}
                              className="flex items-center gap-2 p-2 bg-accent/5 border border-accent/20 rounded-md hover:bg-accent/10 hover:border-accent/30 transition-all duration-200 group"
                            >
                              <Cog className="h-3.5 w-3.5 text-accent flex-shrink-0" />
                              <span className="text-xs text-foreground group-hover:text-accent transition-colors leading-tight line-clamp-1">
                                {displayName}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                      {car.details.options.choice.length > 6 && (
                        <div className="flex justify-center pt-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowAllChoice(!showAllChoice)}
                            className="h-9 px-4 text-sm text-accent hover:bg-accent/10 font-medium border-accent/30"
                          >
                            {showAllChoice
                              ? `Më pak`
                              : `Shfaq të gjitha (${car.details.options.choice.length - 6} më shumë)`}
                          </Button>
                        </div>
                      )}
                    </div>
                  )}

                {(!car.details?.options_extra ||
                  car.details.options_extra.length === 0) &&
                  (!car.details?.options?.standard ||
                    car.details.options.standard.length === 0) &&
                  (!car.details?.options?.choice ||
                    car.details.options.choice.length === 0) && (
                    <div className="text-center py-8 text-muted-foreground">
                      <Cog className="h-12 w-12 mx-auto mb-3 opacity-20" />
                      <p>Nuk ka informata për pajisjet dhe opsionet</p>
                    </div>
                  )}
              </CardContent>
            </Card>
          </TabsContent>



          <TabsContent value="history" className="space-y-4">
            <DrivingInformationPanel
              ownershipHistory={
                car?.encarRecord?.ownerChanges?.map((change: any, index: number) => ({
                  fromDate: change || '',
                  toDate: index < (car?.encarRecord?.ownerChanges?.length || 0) - 1 ? car?.encarRecord?.ownerChanges?.[index + 1] : undefined,
                  location: car?.encarVehicle?.contact?.address || 'E panjohur',
                  ownerType: index === 0 ? 'individual' : 'individual',
                  distanceKm: Math.floor((car?.mileageKm || 0) / (car?.encarRecord?.ownerChangeCnt || 1))
                })) || []
              }
            />
            <Card className="shadow-md border-border/80">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Car className="h-5 w-5 text-primary" />
                  <CardTitle className="text-xl">
                    Historia e Përdorimit të Automjetit
                  </CardTitle>
                </div>
                <p className="text-sm text-muted-foreground">
                  Informacion i detajuar nga API për historinë e përdorimit, pronësisë dhe ndërrimeve
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Usage Type Highlights */}
                {usageHighlights.length > 0 && (
                  <section className="space-y-3">
                    <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
                      <div className="w-1 h-5 bg-primary rounded-full"></div>
                      Lloji i Përdorimit
                    </h3>
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {usageHighlights.map((item) => (
                        <div
                          key={item.label}
                          className="flex flex-col gap-1.5 rounded-lg border border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10 p-4 hover:shadow-md transition-shadow"
                        >
                          <span className="text-xs uppercase tracking-wide text-muted-foreground font-medium">
                            {item.label}
                          </span>
                          <span
                            className={`text-lg font-semibold ${item.value === "Po"
                              ? "text-destructive"
                              : item.value === "Jo"
                                ? "text-emerald-600"
                                : "text-muted-foreground"
                              }`}
                          >
                            {item.value}
                          </span>
                          {item.details && item.details.length > 0 && (
                            <span className="text-xs text-muted-foreground leading-relaxed">
                              {item.details.join(" • ")}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {/* Detailed Usage History */}
                {usageHistoryList.length > 0 && (
                  <section className="space-y-3">
                    <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
                      <div className="w-1 h-5 bg-primary rounded-full"></div>
                      Detajet e Historisë së Përdorimit
                    </h3>
                    <div className="space-y-2">
                      {usageHistoryList
                        .filter(
                          (entry) =>
                            !isUsageDetailHidden(entry.description) &&
                            !isUsageDetailHidden(entry.value),
                        )
                        .map((entry, index) => {
                          const description =
                            translateUsageText(entry.description ?? "").trim() ||
                            "Përdorim";
                          const valueDisplay =
                            translateUsageText(entry.value ?? "").trim() || "-";
                          return (
                            <div
                              key={`${entry.description || "usage"}-${index}`}
                              className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border/40 bg-background/80 px-4 py-3 text-sm hover:bg-muted/30 transition-colors"
                            >
                              <span className="font-semibold text-foreground">
                                {description}
                              </span>
                              <span className="text-muted-foreground font-medium">
                                {valueDisplay}
                              </span>
                            </div>
                          );
                        })}
                    </div>
                  </section>
                )}

                {/* Owner Changes History */}
                <section className="space-y-3">
                  <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
                    <div className="w-1 h-5 bg-primary rounded-full"></div>
                    Historia e Ndërrimit të Pronarëve
                  </h3>
                  {ownerChangesList.length > 0 ? (
                    <div className="space-y-3">
                      {ownerChangesList.map((change, index) => {
                        const changeType =
                          translateGeneralText(change?.change_type) ||
                          "Ndryshim pronari";
                        const usageType = translateGeneralText(change?.usage_type);

                        return (
                          <Card
                            key={`${change?.change_type || "owner"}-${index}`}
                            className="border-l-4 border-l-primary/50"
                          >
                            <CardContent className="p-4 space-y-2">
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <span className="font-semibold text-foreground text-base">
                                  {changeType}
                                </span>
                                {change?.date && (
                                  <Badge variant="outline" className="text-xs font-medium">
                                    <Clock className="h-3 w-3 mr-1" />
                                    {formatDisplayDate(change.date) ?? change.date}
                                  </Badge>
                                )}
                              </div>
                              {usageType && (
                                <div className="flex items-start gap-2">
                                  <span className="text-xs text-muted-foreground">Lloji i përdorimit:</span>
                                  <span className="text-xs font-medium text-foreground">{usageType}</span>
                                </div>
                              )}
                              {change?.previous_number && (
                                <div className="flex items-start gap-2">
                                  <span className="text-xs text-muted-foreground">Numri paraprak:</span>
                                  <span className="text-xs font-mono font-medium text-foreground">{change.previous_number}</span>
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground bg-muted/20 rounded-lg">
                      <Users className="h-12 w-12 mx-auto mb-3 opacity-20" />
                      <p className="font-medium">Nuk ka informata për ndërrimin e pronarëve</p>
                    </div>
                  )}
                </section>

                {/* Reported Damages */}
                {car.damage && (car.damage.main || car.damage.second) && (
                  <section className="space-y-3">
                    <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
                      <div className="w-1 h-5 bg-destructive rounded-full"></div>
                      Dëmtimet e Raportuara
                    </h3>
                    <div className="grid gap-3 md:grid-cols-2">
                      {car.damage?.main && (
                        <div className="p-4 rounded-lg border border-destructive/30 bg-destructive/5">
                          <h4 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4 text-destructive" />
                            Dëmtimi Kryesor
                          </h4>
                          <p className="text-sm text-muted-foreground capitalize">
                            {translateGeneralText(car.damage.main)}
                          </p>
                        </div>
                      )}
                      {car.damage?.second && (
                        <div className="p-4 rounded-lg border border-orange-400/30 bg-orange-50/50 dark:bg-orange-500/5">
                          <h4 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4 text-orange-500" />
                            Dëmtimi Dytësor
                          </h4>
                          <p className="text-sm text-muted-foreground capitalize">
                            {translateGeneralText(car.damage.second)}
                          </p>
                        </div>
                      )}
                    </div>
                  </section>
                )}
              </CardContent>
            </Card>
            {/* Attention History Panel (Consolidated) */}
            <AttentionHistoryPanel
              recalls={[]}
              insuranceGap={{
                exists: !!(car?.encarRecord?.notJoinDate1 || car?.encarRecord?.notJoinDate2 || car?.encarRecord?.notJoinDate3),
                periods: [
                  car?.encarRecord?.notJoinDate1,
                  car?.encarRecord?.notJoinDate2,
                  car?.encarRecord?.notJoinDate3,
                  car?.encarRecord?.notJoinDate4,
                  car?.encarRecord?.notJoinDate5
                ].filter(Boolean) as string[]
              }}
              specialUsage={{
                totalLoss: (car?.encarRecordSummary?.totalLossCnt || 0) > 0,
                flooding: (car?.encarRecordSummary?.floodTotalLossCnt || 0) > 0,
                theft: (car?.encarRecordSummary?.robberCnt || 0) > 0,
                commercial: car?.encarRecord?.use?.toLowerCase().includes('business') || false,
                taxi: car?.encarRecord?.use?.toLowerCase().includes('taxi') || false,
                police: false,
                rental: car?.encarRecord?.use?.toLowerCase().includes('rental') || false
              }}
            />
          </TabsContent>






        </Tabs>

        <Separator />

        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2 text-sm text-muted-foreground md:max-w-xl">
            <p>
              Për informacione shtesë ose pyetje rreth raportit, kontaktoni
              ekipin tonë të inspektimit — jemi këtu për t’ju udhëzuar në çdo
              hap.
            </p>
            <p className="font-medium text-foreground">
              Ndiqni inspektimin, kërkoni sqarime shtesë ose ktheni te detajet e
              makinës me butonat më poshtë.
            </p>
          </div>
          <div className="flex w-full flex-col gap-2 sm:flex-row md:w-auto">
            <Button
              onClick={handleContactWhatsApp}
              variant="outline"
              className="h-10 flex-1 rounded-lg border border-green-500/50 bg-green-500/10 text-sm text-green-700 hover:border-green-500 hover:bg-green-500 hover:text-white transition-all"
            >
              <MessageCircle className="h-4 w-4 mr-2" />
              WhatsApp
            </Button>
            <InspectionRequestForm
              trigger={
                <Button className="h-10 flex-1 rounded-lg bg-primary text-sm text-primary-foreground shadow-sm hover:bg-primary/90 transition-all">
                  <FileText className="h-4 w-4 mr-2" />
                  Kërko Inspektim
                </Button>
              }
              carId={car.id}
              carMake={car.make}
              carModel={car.model}
              carYear={car.year}
            />
            <Button
              variant="outline"
              className="h-10 flex-1 rounded-lg border border-border/60 text-sm hover:bg-muted/40 transition-all"
              onClick={() => openCarDetailsInNewTab(car.lot || lot)}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Kthehu te makina
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CarInspectionReport;
