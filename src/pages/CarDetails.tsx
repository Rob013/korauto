import {
  useEffect,
  useState,
  useCallback,
  memo,
  useMemo,
  lazy,
  Suspense,
  useRef,
  type CSSProperties,
} from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useNavigation } from "@/contexts/NavigationContext";
import { trackPageView, trackCarView, trackFavorite } from "@/utils/analytics";
import { calculateFinalPriceEUR } from "@/utils/carPricing";
import { resolveFuelFromSources, localizeFuel } from "@/utils/fuel";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useHaptics } from "@/hooks/useHaptics";
import type { LucideIcon } from "lucide-react";
import {
  ArrowLeft,
  Phone,
  Mail,
  MapPin,
  Car,
  Gauge,
  Settings,
  Fuel,
  Palette,
  Hash,
  Shield,
  Search,
  Info,
  Eye,
  CheckCircle,
  AlertTriangle,
  Star,
  Clock,
  Users,
  MessageCircle,
  Share2,
  Heart,
  ChevronLeft,
  ChevronRight,
  Expand,
  Copy,
  ChevronDown,
  DollarSign,
  Cog,
  Lightbulb,
  Camera,
  Wind,
  Radar,
  Armchair,
  DoorClosed,
  Cylinder,
  CircleDot,
  Disc3,
  Instagram,
  Facebook,
  Bluetooth,
  Usb,
  Cable,
  Navigation,
  Wifi,
  Smartphone,
  Speaker,
  Music,
  Fan,
  Snowflake,
  Flame,
  Sun,
  KeyRound,
  ShieldCheck,
  Power,
} from "lucide-react";

import { useCurrencyAPI } from "@/hooks/useCurrencyAPI";
import { useKoreaOptions } from "@/hooks/useKoreaOptions";

import { useImagePreload } from "@/hooks/useImagePreload";
import { useImageSwipe, type ImageSwipeChangeMeta } from "@/hooks/useImageSwipe";
import { useAdminCheck } from "@/hooks/useAdminCheck";
import { fallbackCars } from "@/data/fallbackData";
import { getBrandLogo, getBrandLogoVariants } from "@/data/brandLogos";
import { formatMileage } from "@/utils/mileageFormatter";

import {
  fetchEncarsVehicle,
  type EncarsVehicleResponse,
} from "@/services/encarApi";
import { createPortal } from "react-dom";
import {
  buildUsageHighlights,
  buildUsageHistoryList,
  type UsageHighlight,
  type UsageHistoryEntry,
} from "@/utils/encarUsage";
import { getFallbackOptionName } from "@/data/koreaOptionFallbacks";
import { CarDetailsSkeleton } from "@/components/CarDetailsSkeleton";
import { OptimizedCarImage } from "@/components/OptimizedCarImage";
import "@/styles/carDetailsOptimizations.css";
import { useTheme } from "@/components/ThemeProvider";

const ImageZoom = lazy(() =>
  import("@/components/ImageZoom").then((module) => ({
    default: module.ImageZoom,
  })),
);

const DealerInfoSection = lazy(() =>
  import("@/components/DealerInfoSection").then((module) => ({
    default: module.DealerInfoSection,
  })),
);

const CarInspectionDiagram = lazy(() =>
  import("@/components/CarInspectionDiagram").then((module) => ({
    default: module.CarInspectionDiagram,
  })),
);


// Fallback mapping moved to data/koreaOptionFallbacks.ts

const normalizeText = (value: string) =>
  value.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

const containsKoreanNone = (value: string) => {
  const normalized = value.replace(/\s+/g, "").toLowerCase();
  return (
    normalized.includes("없음") ||
    normalized.includes("해당없음") ||
    normalized === "무"
  );
};

const parseHistoryNumber = (value: unknown): number | null => {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) {
      return null;
    }
    if (containsKoreanNone(trimmed)) {
      return 0;
    }

    const normalized = trimmed.replace(/[,]/g, "");
    const numericMatch = normalized.match(/-?\d+(?:\.\d+)?/);
    if (numericMatch) {
      const parsed = Number(numericMatch[0]);
      if (!Number.isNaN(parsed)) {
        return parsed;
      }
    }
  }

  return null;
};

const formatHistoryCount = (value: unknown, fallbackLabel = "E panjohur") => {
  const numeric = parseHistoryNumber(value);
  if (numeric === 0) {
    return "Asnjë";
  }
  if (typeof numeric === "number") {
    return numeric.toString();
  }
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) {
      return fallbackLabel;
    }
    if (containsKoreanNone(trimmed)) {
      return "Asnjë";
    }
    return trimmed;
  }
  if (typeof value === "boolean") {
    return value ? "Po" : "Asnjë";
  }
  return fallbackLabel;
};

const formatHistoryOwnerText = (value: unknown): string => {
  const numeric = parseHistoryNumber(value);
  if (numeric === null) {
    return "E panjohur";
  }
  if (numeric === 0) {
    return "Asnjë ndryshim pronësie";
  }
  if (numeric === 1) {
    return "1 ndryshim pronësie";
  }
  return `${numeric} ndryshime pronësie`;
};

const formatHistoryDamage = (amount: unknown, count?: unknown): string => {
  const numericAmount = parseHistoryNumber(amount);
  const numericCount = parseHistoryNumber(count);

  const hasAmount = typeof numericAmount === "number" && numericAmount > 0;
  const hasCount = typeof numericCount === "number" && numericCount > 0;

  if (!hasAmount && !hasCount) {
    if (typeof amount === "string" && containsKoreanNone(amount.trim())) {
      return "Asnjë";
    }
    if (typeof count === "string" && containsKoreanNone(count.trim())) {
      return "Asnjë";
    }
    if (numericAmount === 0 || numericCount === 0) {
      return "Asnjë";
    }
  }

  const amountText = hasAmount && typeof numericAmount === "number"
    ? `${numericAmount.toLocaleString()} KRW`
    : null;
  const countText = hasCount ? `${numericCount} herë` : null;

  if (amountText && countText) {
    return `${amountText} (${countText})`;
  }
  if (amountText) {
    return amountText;
  }
  if (countText) {
    return countText;
  }

  if (typeof amount === "string" && amount.trim()) {
    const trimmed = amount.trim();
    if (containsKoreanNone(trimmed)) {
      return "Asnjë";
    }
    return trimmed;
  }

  return "E panjohur";
};

const formatHistorySpecialNote = (note: unknown): string => {
  if (!note) {
    return "Asnjë";
  }
  if (typeof note === "string") {
    const trimmed = note.trim();
    if (!trimmed) {
      return "Asnjë";
    }
    if (containsKoreanNone(trimmed)) {
      return "Asnjë";
    }
    return trimmed;
  }
  return String(note);
};

const formatDisplayDate = (
  value: unknown,
  { monthYear = false }: { monthYear?: boolean } = {},
) => {
  if (!value) return undefined;
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return undefined;
    const parsed = new Date(trimmed);
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
    return trimmed.replace(/-/g, ".").replace(/T.*/, "");
  }
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    if (monthYear) {
      return value.toLocaleDateString("sq-AL", {
        month: "2-digit",
        year: "numeric",
      });
    }
    return value.toLocaleDateString("sq-AL", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  }
  return undefined;
};

type EquipmentIconMapping = {
  icon: LucideIcon;
  keywords: string[];
};

const EQUIPMENT_ICON_MAPPINGS: EquipmentIconMapping[] = [
  {
    icon: Bluetooth,
    keywords: ["bluetooth", "handsfree", "hands-free", "hands free"],
  },
  { icon: Usb, keywords: ["usb"] },
  { icon: Cable, keywords: ["aux", "auxiliar", "auxiliary"] },
  {
    icon: Smartphone,
    keywords: [
      "carplay",
      "android auto",
      "androidauto",
      "apple carplay",
      "smartphone",
      "smart phone",
      "smartlink",
      "smart link",
      "mirrorlink",
      "mirror link",
      "wireless charging",
    ],
  },
  {
    icon: Wifi,
    keywords: ["wifi", "wi-fi", "wireless", "hotspot", "hot spot"],
  },
  {
    icon: Navigation,
    keywords: [
      "navigation",
      "navigacion",
      "navigator",
      "navi",
      "gps",
      "map",
      "maps",
    ],
  },
  {
    icon: Speaker,
    keywords: [
      "audio",
      "sound",
      "speaker",
      "stereo",
      "subwoofer",
      "woofer",
      "surround",
      "hi-fi",
      "hifi",
    ],
  },
  {
    icon: Music,
    keywords: ["cd", "dvd", "mp3", "media", "entertainment", "multimedia"],
  },
  {
    icon: Radar,
    keywords: [
      "sensor",
      "radar",
      "parkimi",
      "parkim",
      "parking",
      "park assist",
      "park distance",
      "park pilot",
      "parktronic",
      "lane assist",
      "lane keep",
      "lane keeping",
      "blind spot",
      "distance control",
    ],
  },
  {
    icon: Camera,
    keywords: [
      "camera",
      "kamera",
      "rear view",
      "rearview",
      "360",
      "surround view",
      "dashcam",
      "reverse camera",
    ],
  },
  {
    icon: Gauge,
    keywords: [
      "cruise",
      "speed control",
      "kontroll i shpejtesise",
      "limiter",
      "adaptive cruise",
      "pilot assist",
    ],
  },
  {
    icon: Power,
    keywords: [
      "start stop",
      "start/stop",
      "start-stop",
      "startstop",
      "start stop system",
      "push start",
      "push-button start",
      "push button start",
      "start button",
      "keyless go",
      "remote start",
    ],
  },
  {
    icon: KeyRound,
    keywords: [
      "keyless",
      "key",
      "kyce",
      "remote",
      "bllokim",
      "locking",
      "lock",
      "central locking",
      "immobilizer",
    ],
  },
  {
    icon: ShieldCheck,
    keywords: [
      "airbag",
      "abs",
      "esp",
      "esc",
      "asr",
      "tcs",
      "tpms",
      "safety",
      "sistemi sigurie",
      "alarm",
      "security",
      "anti theft",
      "anti-theft",
      "emergency braking",
      "collision",
      "lane departure",
      "stability control",
      "kontroll stabiliteti",
      "monitoring",
    ],
  },
  {
    icon: Wind,
    keywords: [
      "climat",
      "clima",
      "klima",
      "klime",
      "climate",
      "air condition",
      "aircondition",
      "a/c",
      "hvac",
      "aircon",
    ],
  },
  {
    icon: Snowflake,
    keywords: [
      "cooling",
      "cooled",
      "cooler",
      "ventilated",
      "climatizim",
      "climatization",
    ],
  },
  {
    icon: Flame,
    keywords: [
      "heated",
      "ngroh",
      "heat",
      "defrost",
      "defog",
      "heated seat",
      "heated steering",
    ],
  },
  {
    icon: Fan,
    keywords: [
      "ventilated seat",
      "ventilated seats",
      "ventilim",
      "ventiluar",
      "ventiluara",
    ],
  },
  {
    icon: Armchair,
    keywords: [
      "seat",
      "seats",
      "ulese",
      "sedilje",
      "sedile",
      "chair",
      "armchair",
      "leather",
      "lekure",
      "lekur",
      "alcantara",
    ],
  },
  {
    icon: Users,
    keywords: [
      "pasagjer",
      "passenger",
      "family",
      "rear seats",
      "row",
      "isofix",
      "child",
    ],
  },
  {
    icon: Disc3,
    keywords: [
      "wheel",
      "rrota",
      "rim",
      "alloy",
      "tire",
      "tyre",
      "gom",
      "goma",
      "pneumatic",
    ],
  },
  {
    icon: Eye,
    keywords: ["window", "dritare", "glass", "windshield", "sunshade", "xham"],
  },
  {
    icon: Sun,
    keywords: [
      "sunroof",
      "moonroof",
      "panoram",
      "panoramik",
      "panoramic",
      "tavan",
    ],
  },
  {
    icon: Lightbulb,
    keywords: [
      "light",
      "drite",
      "drita",
      "headlight",
      "xenon",
      "led",
      "fog",
      "daylight",
      "ndricim",
    ],
  },
  {
    icon: Fuel,
    keywords: [
      "fuel",
      "diesel",
      "gasoline",
      "benzin",
      "nafte",
      "battery",
      "electric",
      "hybrid",
      "plug in",
      "plug-in",
    ],
  },
  {
    icon: Cog,
    keywords: [
      "engine",
      "motor",
      "transmission",
      "gearbox",
      "gear",
      "powertrain",
      "drivetrain",
    ],
  },
  {
    icon: Settings,
    keywords: [
      "suspension",
      "tuning",
      "mode",
      "drive mode",
      "setup",
      "adjustable",
    ],
  },
  {
    icon: DoorClosed,
    keywords: ["door", "dyer", "mirror", "pasqyre", "pasqyra", "pasqyr"],
  },
];

const matchesKeyword = (normalizedItem: string, keyword: string) => {
  const normalizedKeyword = normalizeText(keyword.toLowerCase());

  if (/^[a-z0-9]+$/.test(normalizedKeyword)) {
    const keywordRegex = new RegExp(`\\b${normalizedKeyword}\\b`, "i");
    return keywordRegex.test(normalizedItem);
  }

  return normalizedItem.includes(normalizedKeyword);
};

const getEquipmentIcon = (itemName: string): LucideIcon => {
  const normalizedItem = normalizeText(itemName.toLowerCase());

  for (const { icon, keywords } of EQUIPMENT_ICON_MAPPINGS) {
    if (keywords.some((keyword) => matchesKeyword(normalizedItem, keyword))) {
      return icon;
    }
  }

  return CheckCircle;
};

interface CarDetails {
  id: string;
  make: string;
  model: string;
  year: number;
  price: number;
  image?: string;
  source_label?: string;
  vin?: string;
  mileage?: number;
  transmission?: string;
  fuel?: string;
  color?: string;
  condition?: string;
  lot?: string;
  title?: string;
  images?: string[];
  odometer?: {
    km: number;
    mi: number;
    status: {
      name: string;
    };
  };
  engine?: {
    name: string;
  };
  cylinders?: number;
  drive_wheel?: {
    name: string;
  };
  body_type?: {
    name: string;
  };
  damage?: {
    main: string | null;
    second: string | null;
  };
  keys_available?: boolean;
  airbags?: string;
  grade_iaai?: string;
  seller?: string;
  seller_type?: string;
  sale_date?: string;
  bid?: number;
  buy_now?: number;
  final_bid?: number;
  features?: string[];
  safety_features?: string[];
  comfort_features?: string[];
  performance_rating?: number;
  popularity_score?: number;
  // Enhanced API data
  insurance?: any;
  insurance_v2?: any;
  location?: any;
  inspect?: any;
  details?: any;
  lots?: any[];
}

interface PrefetchedCarSummary {
  id?: string;
  lot?: string;
  make?: string;
  model?: string;
  year?: number;
  price?: number;
  image?: string;
  images?: string[];
  mileageLabel?: string;
  transmission?: string;
  fuel?: string;
  color?: string;
  condition?: string;
  title?: string;
  vin?: string;
  engineVolume?: number;
  driveType?: string;
  seats?: number;
  status?: number;
  sale_status?: string;
  final_price?: number;
  insurance_v2?: any;
  source?: string;
  cachedAt?: string;
}

const extractPrefetchedCarSummary = (
  raw: unknown,
): PrefetchedCarSummary | null => {
  if (!raw || typeof raw !== "object") {
    return null;
  }

  const data = raw as Record<string, any>;
  const rawLot =
    data.lot ??
    data.lot_number ??
    data.lotNumber ??
    data.lotNo ??
    data.details?.lot ??
    data.details?.lot_number;

  const imagesCandidate = (() => {
    if (Array.isArray(data.images)) {
      return data.images;
    }
    if (Array.isArray(data.images?.normal)) {
      return data.images.normal;
    }
    if (Array.isArray(data.images?.big)) {
      return data.images.big;
    }
    return undefined;
  })();

  const normalizeString = (value: unknown): string | undefined => {
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
    return undefined;
  };

  const normalizeNumber = (value: unknown): number | undefined => {
    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }
    if (typeof value === "string") {
      const parsed = Number(value);
      if (!Number.isNaN(parsed)) {
        return parsed;
      }
    }
    return undefined;
  };

  const normalizeYear = (value: unknown): number | undefined => {
    const numeric = normalizeNumber(value);
    if (typeof numeric === "number" && numeric > 1900 && numeric < 2100) {
      return Math.round(numeric);
    }
    return undefined;
  };

  const normalizeMileageLabel = (): string | undefined => {
    if (typeof data.mileageLabel === "string") {
      return data.mileageLabel;
    }
    if (typeof data.mileage === "number") {
      return `${data.mileage.toLocaleString()} km`;
    }
    const odometerKm = data.odometer?.km ?? data.lots?.[0]?.odometer?.km;
    if (typeof odometerKm === "number") {
      return `${odometerKm.toLocaleString()} km`;
    }
    return undefined;
  };

  const image =
    normalizeString(data.image) ||
    (Array.isArray(imagesCandidate) && imagesCandidate[0]
      ? normalizeString(imagesCandidate[0])
      : undefined);

  const normalizeDriveType = (): string | undefined => {
    const candidates: Array<unknown> = [
      data.drive_type?.name,
      data.drive_type,
      data.drive,
      data.drivetrain,
      data.details?.drive_type,
      data.details?.drive,
      data.details?.drivetrain,
      data.lots?.[0]?.drive_type?.name,
      data.lots?.[0]?.drive_type,
      data.lots?.[0]?.drivetrain,
      data.lots?.[0]?.details?.drive_type,
      data.lots?.[0]?.details?.drive,
      data.lots?.[0]?.details?.drivetrain,
    ];

    for (const candidate of candidates) {
      const normalized = normalizeString(candidate);
      if (normalized) {
        return normalized;
      }
    }

    return undefined;
  };

  const normalizeSeats = (): number | undefined => {
    const candidates: Array<unknown> = [
      data.seats,
      data.seats_count,
      data.seat_count,
      data.details?.seats,
      data.details?.seats_count,
      data.details?.seat_count,
      data.lots?.[0]?.seats,
      data.lots?.[0]?.seats_count,
      data.lots?.[0]?.details?.seats,
      data.lots?.[0]?.details?.seats_count,
    ];

    for (const candidate of candidates) {
      const numeric = normalizeNumber(candidate);
      if (typeof numeric === "number") {
        return Math.round(numeric);
      }
    }

    return undefined;
  };

  const normalizeEngineVolume = (): number | undefined => {
    const candidates: Array<unknown> = [
      data.engine_volume,
      data.engineVolume,
      data.engine_capacity,
      data.engineCapacity,
      data.engine_size,
      data.engine?.volume,
      data.engine?.capacity,
      data.engine?.size,
      data.details?.engine_volume,
      data.details?.engineVolume,
      data.details?.engine_capacity,
      data.details?.engineCapacity,
      data.details?.displacement,
      data.details?.specs?.engine_volume,
      data.details?.specs?.displacement,
      data.lots?.[0]?.engine_volume,
      data.lots?.[0]?.engineVolume,
      data.lots?.[0]?.details?.engine_volume,
      data.lots?.[0]?.details?.engineVolume,
      data.lots?.[0]?.details?.displacement,
    ];

    for (const candidate of candidates) {
      const numeric = normalizeNumber(candidate);
      if (typeof numeric === "number") {
        return Math.round(numeric);
      }
    }

    return undefined;
  };

  return {
    id: normalizeString(data.id) ?? (rawLot ? String(rawLot) : undefined),
    lot: rawLot ? String(rawLot) : undefined,
    make:
      normalizeString(data.make) ??
      normalizeString(data.manufacturer?.name) ??
      normalizeString(data.details?.make),
    model:
      normalizeString(data.model) ??
      normalizeString(data.model_name) ??
      normalizeString(data.model?.name) ??
      normalizeString(data.details?.model),
    year:
      normalizeYear(data.year) ??
      normalizeYear(data.model_year) ??
      normalizeYear(data.details?.year),
    price:
      normalizeNumber(data.price) ??
      normalizeNumber(data.final_price) ??
      normalizeNumber(data.buy_now),
    image,
    images: Array.isArray(imagesCandidate)
      ? imagesCandidate
        .map((item) => normalizeString(item))
        .filter((item): item is string => Boolean(item))
      : undefined,
    mileageLabel: normalizeMileageLabel(),
    transmission:
      normalizeString(data.transmission) ??
      normalizeString(data.transmission?.name),
    fuel:
      normalizeString(data.fuel) ??
      normalizeString(data.fuel?.name) ??
      normalizeString(data.fuel_type),
    color:
      normalizeString(data.color) ??
      normalizeString(data.color?.name) ??
      normalizeString(data.exterior_color),
    condition:
      normalizeString(data.condition) ??
      normalizeString(data.condition?.name),
    title: normalizeString(data.title),
    vin: normalizeString(data.vin),
    engineVolume: normalizeEngineVolume(),
    driveType: normalizeDriveType(),
    seats: normalizeSeats(),
    status: normalizeNumber(data.status),
    sale_status: normalizeString(data.sale_status),
    final_price: normalizeNumber(data.final_price),
    insurance_v2: data.insurance_v2,
    source:
      normalizeString(data.source) ??
      normalizeString(data.source_label) ??
      normalizeString(data.domain?.name) ??
      normalizeString(data.domain_name),
    cachedAt: normalizeString(data.cachedAt),
  };
};

// Equipment Options Section Component with Show More functionality
interface EquipmentOptionsProps {
  options: {
    standard?: string[];
    choice?: string[];
    tuning?: string[];
  };
  features?: string[];
  safetyFeatures?: string[];
  comfortFeatures?: string[];
}
const EquipmentOptionsSection = memo(
  ({
    options,
    features,
    safetyFeatures,
    comfortFeatures,
  }: EquipmentOptionsProps) => {
    const [showAllStandard, setShowAllStandard] = useState(false);
    const [showAllChoice, setShowAllChoice] = useState(false);
    const [showAllFeatures, setShowAllFeatures] = useState(false);
    const [showAllSafety, setShowAllSafety] = useState(false);
    const [showAllComfort, setShowAllComfort] = useState(false);
    const [showOptions, setShowOptions] = useState(false);
    const INITIAL_SHOW_COUNT = 6;
    const PREVIEW_SHOW_COUNT = 10;

    // Get specific equipment preview items (up to 10 items from real API data)
    const getSpecificPreviewItems = () => {
      if (!options.standard || options.standard.length === 0) {
        return [];
      }

      // Get the first 10 most useful equipment items from the API
      const previewItems = options.standard.slice(0, 10);

      return previewItems.map((item) => {
        const itemName = typeof item === "string" ? item : String(item);
        const IconComponent = getEquipmentIcon(itemName);

        return {
          name: itemName,
          hasFeature: true, // All items from options.standard are available features
          icon: IconComponent,
        };
      });
    };

    // Get preview items for display (standard equipment items)
    const getPreviewItems = () => {
      if (options.standard && options.standard.length > 0) {
        return options.standard.slice(0, PREVIEW_SHOW_COUNT);
      }
      return [];
    };

    const previewItems = getPreviewItems();
    const specificFeatures = getSpecificPreviewItems();

    return (
      <div className="overflow-hidden bg-gradient-to-br from-background to-muted/20 rounded-xl border border-border/40 backdrop-blur-sm shadow-lg">
        {/* Equipment Preview - Shows up to 10 real equipment items from API */}
        {!showOptions && specificFeatures.length > 0 && (
          <div className="p-4 border-b border-border/20">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2 h-2 rounded-full bg-primary"></div>
              <h5 className="text-sm font-medium text-foreground">
                Pajisje Standarde
              </h5>
            </div>
            <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-4 sm:gap-2 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8">
              {specificFeatures.map((feature, index) => {
                const IconComponent = feature.icon;
                return (
                  <div
                    key={index}
                    className={`flex flex-col items-center gap-1 p-2 rounded-md transition-colors ${feature.hasFeature
                      ? "bg-primary/10 border border-primary/30"
                      : "bg-gray-100 border border-gray-200"
                      }`}
                  >
                    <IconComponent
                      className={`h-4 w-4 flex-shrink-0 ${feature.hasFeature ? "text-primary" : "text-gray-400"
                        }`}
                    />
                    <span
                      className={`text-[10px] leading-tight text-center line-clamp-2 ${feature.hasFeature ? "text-foreground" : "text-gray-400"
                        }`}
                    >
                      {feature.name}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <Button
          onClick={() => setShowOptions(!showOptions)}
          variant="ghost"
          className="w-full justify-between p-4 h-auto group hover:bg-gradient-to-r hover:from-muted/20 hover:to-muted/10 transition-all duration-300"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
              <Cog className="h-4 w-4 text-primary" />
            </div>
            <span className="font-semibold text-foreground">
              {showOptions
                ? "Fsheh Pajisjet dhe Opsionet"
                : "Shfaq të Gjitha Pajisjet dhe Opsionet"}
            </span>
          </div>
          <ChevronDown
            className={`h-5 w-5 text-muted-foreground transition-all duration-300 ${showOptions ? "rotate-180 text-primary" : ""}`}
          />
        </Button>

        {showOptions && (
          <div className="px-4 pb-4 space-y-6 animate-fade-in-up">
            {/* Standard Equipment */}
            {options.standard && options.standard.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-primary"></div>
                  <h5 className="text-base font-semibold text-foreground">
                    Pajisje Standarde
                  </h5>
                  <div className="flex-1 h-px bg-border"></div>
                  <span className="text-xs text-muted-foreground font-medium">
                    {options.standard.length} pajisje
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2">
                  {(showAllStandard
                    ? options.standard
                    : options.standard.slice(0, INITIAL_SHOW_COUNT)
                  ).map((option, index) => {
                    const OptionIcon = getEquipmentIcon(option.toString());
                    return (
                      <div
                        key={index}
                        className="flex items-center gap-2 p-2 bg-primary/5 border border-primary/20 rounded-md hover:bg-primary/10 hover:border-primary/30 transition-all duration-200 group"
                      >
                        <div className="flex-shrink-0">
                          <OptionIcon className="h-3.5 w-3.5 text-primary" />
                        </div>
                        <span className="text-xs text-foreground group-hover:text-primary transition-colors leading-tight line-clamp-1">
                          {option}
                        </span>
                      </div>
                    );
                  })}
                </div>
                {options.standard.length > INITIAL_SHOW_COUNT && (
                  <div className="flex justify-center pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowAllStandard(!showAllStandard)}
                      className="h-9 px-4 text-sm text-primary hover:bg-primary/10 font-medium border-primary/30"
                    >
                      {showAllStandard
                        ? `Më pak`
                        : `Shiko të gjitha (${options.standard.length - INITIAL_SHOW_COUNT} më shumë)`}
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* Optional Equipment */}
            {options.choice && options.choice.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-accent"></div>
                  <h5 className="text-base font-semibold text-foreground">
                    Pajisje Opsionale
                  </h5>
                  <div className="flex-1 h-px bg-border"></div>
                  <span className="text-xs text-muted-foreground font-medium">
                    {options.choice.length} opsione
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
                  {(showAllChoice
                    ? options.choice
                    : options.choice.slice(0, INITIAL_SHOW_COUNT)
                  ).map((option, index) => {
                    const OptionIcon = getEquipmentIcon(option.toString());
                    return (
                      <div
                        key={index}
                        className="group relative overflow-hidden h-16 sm:h-20"
                      >
                        <div className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 h-full bg-gradient-to-r from-accent/5 to-accent/10 border border-accent/20 rounded-lg sm:rounded-xl hover:bg-gradient-to-r hover:from-accent/10 hover:to-accent/15 hover:border-accent/30 transition-all duration-200 group-hover:shadow-lg group-hover:shadow-accent/10 group-hover:-translate-y-0.5">
                          <div className="flex-shrink-0">
                            <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-md sm:rounded-lg bg-gradient-to-br from-accent to-accent/80 flex items-center justify-center shadow-sm group-hover:shadow-md group-hover:shadow-accent/25 transition-all duration-300">
                              <OptionIcon className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <span className="text-xs sm:text-sm font-semibold text-foreground group-hover:text-accent transition-colors duration-300 leading-tight line-clamp-2">
                              {option}
                            </span>
                          </div>
                          <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-accent"></div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                {options.choice.length > INITIAL_SHOW_COUNT && (
                  <div className="flex justify-center pt-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowAllChoice(!showAllChoice)}
                      className="h-10 px-6 text-sm font-semibold text-accent hover:bg-gradient-to-r hover:from-accent/50 hover:to-accent/100 dark:hover:from-accent/900/20 dark:hover:to-accent/800/20 border-accent/30 dark:border-accent/600/60 hover:border-accent/40/80 dark:hover:border-accent/500/80 transition-all duration-300 hover:shadow-md hover:shadow-accent/10"
                    >
                      {showAllChoice ? (
                        <div className="flex items-center gap-2">
                          <span>Më pak</span>
                          <div className="w-1 h-1 rounded-full bg-accent"></div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span>
                            Shiko të gjitha (
                            {options.choice.length - INITIAL_SHOW_COUNT} më
                            shumë)
                          </span>
                          <div className="w-1 h-1 rounded-full bg-accent"></div>
                        </div>
                      )}
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* Tuning Modifications */}
            {options.tuning && options.tuning.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-destructive"></div>
                  <h5 className="text-base font-semibold text-foreground">
                    Modifikimet
                  </h5>
                  <div className="flex-1 h-px bg-border"></div>
                  <span className="text-xs text-muted-foreground font-medium">
                    {options.tuning.length} modifikime
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                  {options.tuning.map((option, index) => {
                    const itemLower = option.toString().toLowerCase();
                    let OptionIcon = Settings;
                    if (
                      itemLower.includes("sport") ||
                      itemLower.includes("performance")
                    )
                      OptionIcon = Gauge;
                    else if (
                      itemLower.includes("exhaust") ||
                      itemLower.includes("marmit")
                    )
                      OptionIcon = Cog;
                    return (
                      <div
                        key={index}
                        className="flex items-center gap-3 p-3 bg-gradient-to-r from-destructive/5 to-destructive/10 border border-destructive/20 rounded-lg hover:bg-gradient-to-r hover:from-destructive/10 hover:to-destructive/15 hover:border-destructive/30 transition-all duration-200 group"
                      >
                        <div className="flex-shrink-0">
                          <OptionIcon className="h-4 w-4 text-destructive" />
                        </div>
                        <span className="text-sm font-medium text-foreground group-hover:text-destructive transition-colors">
                          {option}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* General Features */}
            {features && features.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 shadow-sm"></div>
                    <h5 className="text-lg font-bold text-foreground bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent">
                      Karakteristika të Përgjithshme
                    </h5>
                  </div>
                  <div className="flex-1 h-px bg-gradient-to-r from-border via-border/50 to-transparent"></div>
                  <div className="flex items-center gap-2">
                    <div className="px-3 py-1 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-full">
                      <span className="text-xs font-semibold text-blue-700 dark:text-blue-300">
                        {features.length} karakteristika
                      </span>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
                  {(showAllFeatures
                    ? features
                    : features.slice(0, INITIAL_SHOW_COUNT)
                  ).map((feature, index) => (
                    <div
                      key={index}
                      className="group relative overflow-hidden h-16 sm:h-20"
                    >
                      <div className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 h-full bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800/50 dark:to-slate-700/50 border border-slate-200/60 dark:border-slate-700/60 rounded-lg sm:rounded-xl hover:bg-gradient-to-br hover:from-blue-50 hover:to-blue-100 dark:hover:from-blue-900/20 dark:hover:to-blue-800/20 hover:border-blue-300/60 dark:hover:border-blue-600/60 transition-all duration-300 group-hover:shadow-lg group-hover:shadow-blue-500/10 group-hover:-translate-y-0.5">
                        <div className="flex-shrink-0">
                          <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-md sm:rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-sm group-hover:shadow-md group-hover:shadow-blue-500/25 transition-all duration-300">
                            <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200 group-hover:text-blue-700 dark:group-hover:text-blue-300 transition-colors duration-300 leading-tight line-clamp-2">
                            {feature}
                          </span>
                        </div>
                        <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-blue-500"></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                {features.length > INITIAL_SHOW_COUNT && (
                  <div className="flex justify-center pt-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowAllFeatures(!showAllFeatures)}
                      className="h-10 px-6 text-sm font-semibold text-blue-700 dark:text-blue-300 hover:bg-gradient-to-r hover:from-blue-50 hover:to-blue-100 dark:hover:from-blue-900/20 dark:hover:to-blue-800/20 border-blue-300/60 dark:border-blue-600/60 hover:border-blue-400/80 dark:hover:border-blue-500/80 transition-all duration-300 hover:shadow-md hover:shadow-blue-500/10"
                    >
                      {showAllFeatures ? (
                        <div className="flex items-center gap-2">
                          <span>Më pak</span>
                          <div className="w-1 h-1 rounded-full bg-blue-500"></div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span>
                            Shiko të gjitha (
                            {features.length - INITIAL_SHOW_COUNT} më shumë)
                          </span>
                          <div className="w-1 h-1 rounded-full bg-blue-500"></div>
                        </div>
                      )}
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* Safety Features */}
            {safetyFeatures && safetyFeatures.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-gradient-to-r from-red-500 to-red-600 shadow-sm"></div>
                    <h5 className="text-lg font-bold text-foreground bg-gradient-to-r from-red-600 to-red-700 bg-clip-text text-transparent">
                      Karakteristika të Sigurisë
                    </h5>
                  </div>
                  <div className="flex-1 h-px bg-gradient-to-r from-border via-border/50 to-transparent"></div>
                  <div className="flex items-center gap-2">
                    <div className="px-3 py-1 bg-gradient-to-r from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 rounded-full">
                      <span className="text-xs font-semibold text-red-700 dark:text-red-300">
                        {safetyFeatures.length} siguri
                      </span>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
                  {(showAllSafety
                    ? safetyFeatures
                    : safetyFeatures.slice(0, INITIAL_SHOW_COUNT)
                  ).map((feature, index) => (
                    <div
                      key={index}
                      className="group relative overflow-hidden h-16 sm:h-20"
                    >
                      <div className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 h-full bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 border border-red-200/60 dark:border-red-700/60 rounded-lg sm:rounded-xl hover:bg-gradient-to-br hover:from-red-100 hover:to-red-200 dark:hover:from-red-800/30 dark:hover:to-red-700/30 hover:border-red-300/60 dark:hover:border-red-600/60 transition-all duration-300 group-hover:shadow-lg group-hover:shadow-red-500/10 group-hover:-translate-y-0.5">
                        <div className="flex-shrink-0">
                          <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-md sm:rounded-lg bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-sm group-hover:shadow-md group-hover:shadow-red-500/25 transition-all duration-300">
                            <Shield className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="text-xs sm:text-sm font-semibold text-red-700 dark:text-red-200 group-hover:text-red-800 dark:group-hover:text-red-100 transition-colors duration-300 leading-tight line-clamp-2">
                            {feature}
                          </span>
                        </div>
                        <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-red-500"></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                {safetyFeatures.length > INITIAL_SHOW_COUNT && (
                  <div className="flex justify-center pt-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowAllSafety(!showAllSafety)}
                      className="h-10 px-6 text-sm font-semibold text-red-700 dark:text-red-300 hover:bg-gradient-to-r hover:from-red-50 hover:to-red-100 dark:hover:from-red-900/20 dark:hover:to-red-800/20 border-red-300/60 dark:border-red-600/60 hover:border-red-400/80 dark:hover:border-red-500/80 transition-all duration-300 hover:shadow-md hover:shadow-red-500/10"
                    >
                      {showAllSafety ? (
                        <div className="flex items-center gap-2">
                          <span>Më pak</span>
                          <div className="w-1 h-1 rounded-full bg-red-500"></div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span>
                            Shiko të gjitha (
                            {safetyFeatures.length - INITIAL_SHOW_COUNT} më
                            shumë)
                          </span>
                          <div className="w-1 h-1 rounded-full bg-red-500"></div>
                        </div>
                      )}
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* Comfort Features */}
            {comfortFeatures && comfortFeatures.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-gradient-to-r from-emerald-500 to-emerald-600 shadow-sm"></div>
                    <h5 className="text-lg font-bold text-foreground bg-gradient-to-r from-emerald-600 to-emerald-700 bg-clip-text text-transparent">
                      Karakteristika të Rehatisë
                    </h5>
                  </div>
                  <div className="flex-1 h-px bg-gradient-to-r from-border via-border/50 to-transparent"></div>
                  <div className="flex items-center gap-2">
                    <div className="px-3 py-1 bg-gradient-to-r from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/20 rounded-full">
                      <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                        {comfortFeatures.length} rehati
                      </span>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
                  {(showAllComfort
                    ? comfortFeatures
                    : comfortFeatures.slice(0, INITIAL_SHOW_COUNT)
                  ).map((feature, index) => (
                    <div
                      key={index}
                      className="group relative overflow-hidden h-16 sm:h-20"
                    >
                      <div className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 h-full bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/20 border border-emerald-200/60 dark:border-emerald-700/60 rounded-lg sm:rounded-xl hover:bg-gradient-to-br hover:from-emerald-100 hover:to-emerald-200 dark:hover:from-emerald-800/30 dark:hover:to-emerald-700/30 hover:border-emerald-300/60 dark:hover:border-emerald-600/60 transition-all duration-300 group-hover:shadow-lg group-hover:shadow-emerald-500/10 group-hover:-translate-y-0.5">
                        <div className="flex-shrink-0">
                          <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-md sm:rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-sm group-hover:shadow-md group-hover:shadow-emerald-500/25 transition-all duration-300">
                            <Users className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="text-xs sm:text-sm font-semibold text-emerald-700 dark:text-emerald-200 group-hover:text-emerald-800 dark:group-hover:text-emerald-100 transition-colors duration-300 leading-tight line-clamp-2">
                            {feature}
                          </span>
                        </div>
                        <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-emerald-500"></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                {comfortFeatures.length > INITIAL_SHOW_COUNT && (
                  <div className="flex justify-center pt-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowAllComfort(!showAllComfort)}
                      className="h-10 px-6 text-sm font-semibold text-emerald-700 dark:text-emerald-300 hover:bg-gradient-to-r hover:from-emerald-50 hover:to-emerald-100 dark:hover:from-emerald-900/20 dark:hover:to-emerald-800/20 border-emerald-300/60 dark:border-emerald-600/60 hover:border-emerald-400/80 dark:hover:border-emerald-500/80 transition-all duration-300 hover:shadow-md hover:shadow-emerald-500/10"
                    >
                      {showAllComfort ? (
                        <div className="flex items-center gap-2">
                          <span>Më pak</span>
                          <div className="w-1 h-1 rounded-full bg-emerald-500"></div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span>
                            Shiko të gjitha (
                            {comfortFeatures.length - INITIAL_SHOW_COUNT} më
                            shumë)
                          </span>
                          <div className="w-1 h-1 rounded-full bg-emerald-500"></div>
                        </div>
                      )}
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    );
  },
);
EquipmentOptionsSection.displayName = "EquipmentOptionsSection";
const CarDetails = memo(() => {
  // Translation functions for Albanian
  const translateTransmission = (transmission: string | null | undefined): string => {
    if (!transmission) return '';

    const transmissionMap: Record<string, string> = {
      automatic: "automatik",
      manual: "manual",
      cvt: "CVT",
      semiautomatic: "gjysëm automatik",
      "automated manual": "manual i automatizuar",
    };

    const key = typeof transmission === 'string' ? transmission.toLowerCase() : '';
    return transmissionMap[key] || transmission;
  };
  const translateColor = (color: string | null | undefined): string => {
    if (!color) return '';

    const colorMap: Record<string, string> = {
      black: "zi",
      white: "bardhë",
      grey: "gri",
      gray: "gri",
      red: "kuq",
      blue: "blu",
      green: "jeshil",
      yellow: "verdhë",
      orange: "portokalli",
      brown: "kafe",
      silver: "argjend",
      gold: "ar",
      beige: "bezhë",
      "dark blue": "blu i errët",
      "light blue": "blu i çelët",
      "dark green": "jeshil i errët",
      "light green": "jeshil i çelët",
    };

    const key = typeof color === 'string' ? color.toLowerCase() : '';
    return colorMap[key] || color;
  };
  const { id: lot } = useParams<{
    id: string;
  }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { impact, notification } = useHaptics();
  const { goBack, restorePageState, pageState } = useNavigation();
  const { exchangeRate } = useCurrencyAPI();
  const { getOptionName } = useKoreaOptions();
  const { isAdmin, isLoading: adminLoading } = useAdminCheck();
  const { theme } = useTheme();
  const [car, setCar] = useState<CarDetails | null>(null);
  const [prefetchedSummary, setPrefetchedSummary] =
    useState<PrefetchedCarSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isImageZoomOpen, setIsImageZoomOpen] = useState(false);
  const [shouldRenderMap, setShouldRenderMap] = useState(false);
  const mapTargets = useRef<HTMLDivElement[]>([]);
  const cacheHydratedRef = useRef(false);
  const historySectionRef = useRef<HTMLDivElement | null>(null);
  const [showDetailedInfo, setShowDetailedInfo] = useState(false);
  const [hasAutoExpanded, setHasAutoExpanded] = useState(false);
  const [showEngineSection, setShowEngineSection] = useState(false);
  const [isPlaceholderImage, setIsPlaceholderImage] = useState(false);
  const [isPortalReady, setIsPortalReady] = useState(false);
  const [allowImageZoom, setAllowImageZoom] = useState(false);
  const [imageSwipeDirection, setImageSwipeDirection] = useState<
    "next" | "previous" | null
  >(null);
  const [liveDealerContact, setLiveDealerContact] =
    useState<EncarsVehicleResponse["contact"] | null>(null);
  const [liveDealerLoading, setLiveDealerLoading] = useState(false);
  const [liveDealerError, setLiveDealerError] = useState<string | null>(null);
  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">(
    theme === "dark" ? "dark" : "light",
  );

  // Dialog states
  const [isSpecsDialogOpen, setIsSpecsDialogOpen] = useState(false);
  const [isServicesDialogOpen, setIsServicesDialogOpen] = useState(false);

  useEffect(() => {
    if (typeof document === "undefined") {
      return;
    }

    document.body.classList.add("car-details-page");
    return () => {
      document.body.classList.remove("car-details-page");
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const resolveTheme = () => {
      if (theme === "system") {
        return mediaQuery.matches ? "dark" : "light";
      }
      return theme;
    };

    const updateResolvedTheme = () => {
      setResolvedTheme(resolveTheme());
    };

    updateResolvedTheme();

    if (theme === "system") {
      const handleChange = () => updateResolvedTheme();
      mediaQuery.addEventListener("change", handleChange);

      return () => {
        mediaQuery.removeEventListener("change", handleChange);
      };
    }

    return undefined;
  }, [theme]);



  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const updateZoomAvailability = () => {
      setAllowImageZoom(window.innerWidth < 1024);
    };

    updateZoomAvailability();
    window.addEventListener("resize", updateZoomAvailability);

    return () => {
      window.removeEventListener("resize", updateZoomAvailability);
    };
  }, []);

  useEffect(() => {
    if (!allowImageZoom && isImageZoomOpen) {
      setIsImageZoomOpen(false);
    }
  }, [allowImageZoom, isImageZoomOpen]);
  const lastFetchedLotRef = useRef<string | null>(null);
  const liveDealerAbortRef = useRef<AbortController | null>(null);
  useEffect(() => {
    if (typeof window === "undefined" || !lot) {
      setPrefetchedSummary(null);
      return;
    }

    const normalizedLot = String(lot);
    const encodedLot = encodeURIComponent(normalizedLot);
    const keys = [
      `car_prefetch_${encodedLot}`,
      encodedLot !== normalizedLot ? `car_prefetch_${normalizedLot}` : null,
    ].filter(Boolean) as string[];

    for (const key of keys) {
      try {
        const raw = sessionStorage.getItem(key);
        if (!raw) {
          continue;
        }
        const parsed = JSON.parse(raw);
        const summary = extractPrefetchedCarSummary(parsed);
        if (summary) {
          setPrefetchedSummary(summary);
          return;
        }
      } catch (parseError) {
        console.warn("Failed to parse prefetched car summary", parseError);
      }
    }

    setPrefetchedSummary(null);
  }, [lot]);
  useEffect(() => {
    setIsPortalReady(true);
    return () => setIsPortalReady(false);
  }, []);

  useEffect(() => {
    const cachedContact = (car as any)?.encarVehicle?.contact;
    if (!cachedContact) {
      return;
    }
    setLiveDealerContact((prev) =>
      prev ? { ...cachedContact, ...prev } : cachedContact,
    );
  }, [car]);

  useEffect(() => {
    liveDealerAbortRef.current?.abort();
    liveDealerAbortRef.current = null;
    lastFetchedLotRef.current = null;
    setLiveDealerError(null);
    setLiveDealerContact(null);
    cacheHydratedRef.current = false;
  }, [lot]);

  useEffect(() => {
    if (adminLoading || !isAdmin || !lot) {
      return;
    }

    if (lastFetchedLotRef.current === lot && liveDealerContact) {
      return;
    }

    const controller = new AbortController();
    liveDealerAbortRef.current?.abort();
    liveDealerAbortRef.current = controller;
    setLiveDealerLoading(true);
    setLiveDealerError(null);

    fetchEncarsVehicle(lot, ["CONTACT", "PARTNERSHIP"], {
      signal: controller.signal,
    })
      .then((vehicle) => {
        if (controller.signal.aborted) {
          return;
        }
        const contact = vehicle?.contact ?? null;
        setLiveDealerContact(contact);
        lastFetchedLotRef.current = lot;
        setLiveDealerError(null);
      })
      .catch((error) => {
        if (controller.signal.aborted) {
          return;
        }
        console.warn("Failed to fetch live dealer contact", error);
        setLiveDealerError(
          error instanceof Error
            ? error.message
            : "Dështoi marrja e adresës nga Encars API.",
        );
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLiveDealerLoading(false);
          liveDealerAbortRef.current = null;
        }
      });

    return () => {
      controller.abort();
      liveDealerAbortRef.current = null;
    };
  }, [adminLoading, isAdmin, lot, liveDealerContact]);

  const usageHistoryList = useMemo<UsageHistoryEntry[]>(
    () => buildUsageHistoryList(car, formatDisplayDate),
    [car],
  );

  const usageHighlights = useMemo<UsageHighlight[]>(
    () => buildUsageHighlights(car, usageHistoryList),
    [car, usageHistoryList],
  );

  const accidentCount = useMemo(() => {
    if (!car) {
      return 0;
    }

    const candidateCounts: number[] = [];
    const seenArrays = new Set<unknown>();

    const parseNumericValue = (raw: unknown): number | null => {
      if (raw === null || raw === undefined) {
        return null;
      }

      if (typeof raw === "number") {
        return Number.isFinite(raw) ? raw : null;
      }

      if (typeof raw === "string") {
        const trimmed = raw.trim();
        if (!trimmed) {
          return null;
        }

        const normalized = trimmed.replace(/[,]/g, "");
        const direct = Number(normalized);
        if (Number.isFinite(direct)) {
          return direct;
        }

        const intMatch = normalized.match(/^-?\d+/);
        if (intMatch) {
          const digitsOnly = intMatch[0].replace(/^-/, "");
          if (digitsOnly.length > 0 && digitsOnly.length <= 3) {
            return Number(intMatch[0]);
          }
        }

        return null;
      }

      if (Array.isArray(raw)) {
        return raw.length;
      }

      if (typeof raw === "object") {
        const obj = raw as Record<string, unknown>;
        const valueKeys = [
          "count",
          "total",
          "totalCount",
          "value",
          "number",
          "qty",
          "quantity",
          "cnt",
          "accidentCnt",
          "accidentCount",
          "totalAccidentCnt",
          "totalAccidentCount",
        ];

        for (const key of valueKeys) {
          if (key in obj) {
            const parsed = parseNumericValue(obj[key]);
            if (parsed !== null) {
              return parsed;
            }
          }
        }

        const accidentRelated = Object.entries(obj)
          .filter(([key]) => /accident/i.test(key))
          .map(([, value]) => parseNumericValue(value))
          .filter((value): value is number => value !== null);

        if (accidentRelated.length > 0) {
          return accidentRelated.reduce((sum, value) => sum + value, 0);
        }
      }

      return null;
    };

    const addCandidate = (value: unknown) => {
      const parsed = parseNumericValue(value);
      if (parsed !== null && Number.isFinite(parsed)) {
        candidateCounts.push(parsed);
      }
    };

    const extractFromObject = (source?: Record<string, unknown>) => {
      if (!source) {
        return;
      }

      const numericFields = [
        "accidentCnt",
        "accidentCount",
        "totalAccidentCnt",
        "totalAccidentCount",
        "accident_history_count",
        "accidentHistoryCount",
        "accidentHistoryCnt",
        "accident_history_total",
        "accidentHistoryTotal",
        "count",
        "total",
      ];

      numericFields.forEach((field) => {
        if (field in source) {
          addCandidate(source[field]);
        }
      });

      if ("myAccidentCnt" in source || "otherAccidentCnt" in source) {
        const my = parseNumericValue(source["myAccidentCnt"]) ?? 0;
        const other = parseNumericValue(source["otherAccidentCnt"]) ?? 0;
        const combined = my + other;
        if (combined >= 0) {
          candidateCounts.push(combined);
        }
      }

      const arrayFields = [
        "accidents",
        "accidentList",
        "accidentHistory",
        "accidentHistories",
        "accident_records",
        "accidentRecords",
        "accidentRecord",
        "special_accident_history",
        "accident_history",
        "accident_history_detail",
        "accident_history_details",
        "accident_history_list",
      ];

      let aggregatedArrayCount = 0;
      arrayFields.forEach((field) => {
        const value = source[field];
        if (
          Array.isArray(value) &&
          value.length > 0 &&
          !seenArrays.has(value)
        ) {
          seenArrays.add(value);
          candidateCounts.push(value.length);
          aggregatedArrayCount += value.length;
        } else if (Array.isArray(value) && !seenArrays.has(value)) {
          seenArrays.add(value);
        }
      });
      if (aggregatedArrayCount > 0) {
        candidateCounts.push(aggregatedArrayCount);
      }

      const summaryFields = ["accident_summary", "accidentSummary"];
      summaryFields.forEach((field) => {
        const summary = source[field];
        if (summary && typeof summary === "object" && !Array.isArray(summary)) {
          const total = Object.values(summary).reduce((sum, entry) => {
            const parsed = parseNumericValue(entry);
            return parsed !== null ? sum + parsed : sum;
          }, 0);
          if (total > 0) {
            candidateCounts.push(total);
          }
        }
      });

      Object.entries(source)
        .filter(
          ([key, value]) =>
            /accident/i.test(key) &&
            value &&
            typeof value === "object" &&
            !Array.isArray(value),
        )
        .forEach(([, value]) => addCandidate(value));
    };

    const potentialSources: Array<Record<string, unknown> | undefined> = [
      car.insurance_v2 as Record<string, unknown> | undefined,
      car.details?.insurance_v2 as Record<string, unknown> | undefined,
      car.details?.insurance as Record<string, unknown> | undefined,
      (car.details?.insurance as Record<string, unknown> | undefined)
        ?.car_info as Record<string, unknown> | undefined,
      (car.details?.insurance as Record<string, unknown> | undefined)
        ?.summary as Record<string, unknown> | undefined,
      car.inspect as Record<string, unknown> | undefined,
      car.details?.inspect as Record<string, unknown> | undefined,
    ];

    potentialSources.forEach((source) => {
      if (source) {
        extractFromObject(source);
      }
    });

    const summarySources = [
      car.inspect?.accident_summary,
      car.details?.inspect?.accident_summary,
      (car.details?.insurance as Record<string, unknown> | undefined)
        ?.accident_summary,
    ];

    summarySources.forEach((summary) => {
      if (summary && typeof summary === "object" && !Array.isArray(summary)) {
        const total: number = (Object.values(summary) as any[]).reduce(
          (sum: number, entry) => {
            const parsed = parseNumericValue(entry);
            return parsed !== null ? sum + parsed : sum;
          },
          0,
        );
        if (total > 0) {
          candidateCounts.push(total);
        }
      }
    });

    addCandidate(car.details?.insurance?.accident_history);

    if (candidateCounts.length === 0) {
      return 0;
    }

    return Math.max(...candidateCounts);
  }, [car]);

  const hasMainFrameworkAccident = useMemo(() => {
    if (!car) {
      return false;
    }

    const interpretAsPositive = (value: unknown) => {
      if (value === null || value === undefined) return false;
      if (typeof value === "boolean") return value;
      if (typeof value === "number") return value > 0;

      const normalized = `${value}`.trim().toLowerCase();
      if (!normalized) return false;

      const negativeIndicators = [
        "no",
        "jo",
        "none",
        "nuk",
        "n/a",
        "not available",
        "doesn't exist",
        "does not exist",
        "없음",
        "무",
        "0",
      ];
      if (negativeIndicators.some((indicator) => normalized.includes(indicator))) {
        return false;
      }

      const positiveIndicators = [
        "yes",
        "po",
        "exist",
        "exists",
        "damage",
        "damaged",
        "replacement",
        "replaced",
        "exchange",
        "repair",
        "repaired",
        "weld",
        "welded",
        "교환",
        "용접",
        "수리",
        "있음",
        "사고",
      ];
      if (positiveIndicators.some((indicator) => normalized.includes(indicator))) {
        return true;
      }

      const exactPositiveValues = ["r", "1"];
      if (exactPositiveValues.includes(normalized)) {
        return true;
      }

      const exactNegativeValues = ["n"];
      if (exactNegativeValues.includes(normalized)) {
        return false;
      }

      return false;
    };

    const summarySources: Array<Record<string, unknown> | undefined> = [
      car.inspect?.accident_summary as Record<string, unknown> | undefined,
      car.details?.inspect?.accident_summary as Record<string, unknown> | undefined,
      (car.details?.insurance as Record<string, unknown> | undefined)?.accident_summary as
      | Record<string, unknown>
      | undefined,
      ((car.details?.insurance as Record<string, unknown> | undefined)?.car_info as
        | Record<string, unknown>
        | undefined)?.accident_summary as Record<string, unknown> | undefined,
      (car.insurance_v2 as Record<string, unknown> | undefined)?.accidentSummary as
      | Record<string, unknown>
      | undefined,
    ];

    const isMainFrameworkKey = (key: string) => {
      const normalizedKey = key.toLowerCase().replace(/[\s-]+/g, "_");
      return normalizedKey.includes("main") && normalizedKey.includes("frame");
    };

    for (const summary of summarySources) {
      if (!summary || typeof summary !== "object" || Array.isArray(summary)) {
        continue;
      }

      for (const [key, value] of Object.entries(summary)) {
        if (isMainFrameworkKey(key) && interpretAsPositive(value)) {
          return true;
        }
      }
    }

    return false;
  }, [car]);

  const carLot = car?.lot;

  const historySummary = useMemo(() => {
    if (!car) {
      return {
        hasHistoryData: false,
        replacementValue: null,
        sheetMetalValue: null,
        corrosionValue: null,
        ownerHistoryValue: null,
        myCarDamageAmount: null,
        myCarDamageCount: null,
        otherCarDamageValue: null,
        specialNoteValue: null,
        replacementText: "E panjohur",
        sheetMetalText: "E panjohur",
        corrosionText: "E panjohur",
        ownerHistoryText: "E panjohur",
        myCarDamageText: "E panjohur",
        otherCarDamageText: "E panjohur",
        specialNoteText: "Asnjë",
      } as const;
    }

    const insurance = car.insurance_v2 as Record<string, unknown> | undefined;
    const inspect = car.inspect as Record<string, unknown> | undefined;

    const replacementValue =
      (inspect as any)?.exchange ??
      (inspect as any)?.replacement ??
      (insurance as any)?.replacementCnt ??
      (insurance as any)?.replacement_cnt;

    const sheetMetalValue =
      (inspect as any)?.sheetMetal ??
      (inspect as any)?.sheetMetalCnt ??
      (inspect as any)?.panelRepairCnt ??
      (insurance as any)?.sheetMetalCnt ??
      (insurance as any)?.panelRepairCnt;

    const corrosionValue =
      (inspect as any)?.corrosion ??
      (insurance as any)?.corrosionCnt ??
      (insurance as any)?.rustCnt;

    const ownerHistoryValue =
      (insurance as any)?.ownerChangeCnt ??
      (insurance as any)?.owner_cnt ??
      (insurance as any)?.ownerHistoryCnt;

    const myCarDamageAmount =
      (insurance as any)?.myCarDmgAmt ??
      (insurance as any)?.myCarDamageAmt ??
      (inspect as any)?.myCarDamageAmt;

    const myCarDamageCount =
      (insurance as any)?.myCarDmgCnt ??
      (insurance as any)?.myCarDamageCnt ??
      (insurance as any)?.myCarDmgHistoryCnt ??
      (inspect as any)?.myCarDamageCnt;

    const otherCarDamageValue =
      (insurance as any)?.otherCarDmgCnt ??
      (insurance as any)?.otherCarDamageCnt ??
      (inspect as any)?.otherCarDamageCnt;

    const specialNoteValue =
      (insurance as any)?.specialNote ??
      (inspect as any)?.specialNotes ??
      (insurance as any)?.remark;

    const hasHistoryData = Boolean(insurance || inspect);

    return {
      hasHistoryData,
      replacementValue,
      sheetMetalValue,
      corrosionValue,
      ownerHistoryValue,
      myCarDamageAmount,
      myCarDamageCount,
      otherCarDamageValue,
      specialNoteValue,
      replacementText: formatHistoryCount(replacementValue),
      sheetMetalText: formatHistoryCount(sheetMetalValue),
      corrosionText: formatHistoryCount(corrosionValue),
      ownerHistoryText: formatHistoryOwnerText(ownerHistoryValue),
      myCarDamageText: formatHistoryDamage(myCarDamageAmount, myCarDamageCount),
      otherCarDamageText: formatHistoryCount(otherCarDamageValue),
      specialNoteText: formatHistorySpecialNote(specialNoteValue),
    } as const;
  }, [car]);

  const {
    hasHistoryData,
    replacementText,
    sheetMetalText,
    corrosionText,
    ownerHistoryText,
    myCarDamageText,
    otherCarDamageText,
    specialNoteText,
    replacementValue,
    sheetMetalValue,
    corrosionValue,
    ownerHistoryValue,
    myCarDamageAmount,
    myCarDamageCount,
    otherCarDamageValue,
    specialNoteValue,
  } = historySummary;

  const showSpecsDialogTrigger = Boolean(car);

  const resolvedFuel = useMemo(() => {
    if (!car) return null;

    if (car.fuel) return car.fuel;

    return (
      resolveFuelFromSources(
        car,
        car.details,
        car.details?.specs,
        car.details?.specifications,
        car.details?.specification,
        car.details?.technical,
        (car.details as any)?.technicalSpecifications,
        (car.details as any)?.technicalSpecification,
        car.details?.summary,
        (car.details?.summary as any)?.specs,
        (car.details?.summary as any)?.specifications,
        car.insurance_v2,
        (car.insurance_v2 as any)?.vehicle,
        car.inspect,
        car.insurance,
      ) ?? null
    );
  }, [car]);

  const summaryYear = car?.year ?? prefetchedSummary?.year ?? null;
  const summaryMileage = car?.mileage
    ? formatMileage(car.mileage)
    : prefetchedSummary?.mileageLabel ?? undefined;
  const summaryFuel = (() => {
    if (resolvedFuel) {
      return localizeFuel(resolvedFuel) ?? resolvedFuel;
    }
    if (prefetchedSummary?.fuel) {
      return localizeFuel(prefetchedSummary.fuel) ?? prefetchedSummary.fuel;
    }
    return undefined;
  })();
  const summaryTransmission = (() => {
    if (car?.transmission) {
      return translateTransmission(car.transmission);
    }
    if (prefetchedSummary?.transmission) {
      return translateTransmission(prefetchedSummary.transmission);
    }
    return undefined;
  })();
  const summaryEngineVolumeValue = parseHistoryNumber(
    car?.details?.engine_volume ?? prefetchedSummary?.engineVolume,
  );
  const summaryEngineVolume =
    typeof summaryEngineVolumeValue === "number" && summaryEngineVolumeValue > 0
      ? `${summaryEngineVolumeValue.toLocaleString()} cc`
      : undefined;
  const summaryDriveRaw = car?.drive_wheel?.name ?? prefetchedSummary?.driveType;
  const summaryDrive =
    typeof summaryDriveRaw === "string" && summaryDriveRaw.trim()
      ? summaryDriveRaw.trim().length <= 4
        ? summaryDriveRaw.trim().toUpperCase()
        : summaryDriveRaw.trim()
      : undefined;
  const summarySeatsValue = parseHistoryNumber(
    car?.details?.seats_count ?? prefetchedSummary?.seats,
  );
  const summarySeats =
    typeof summarySeatsValue === "number" && summarySeatsValue > 0
      ? summarySeatsValue.toString()
      : undefined;
  const summaryVin = car?.vin ?? prefetchedSummary?.vin;
  const summaryMake = car?.make ?? prefetchedSummary?.make;
  const summaryModel = (() => {
    if (car?.model) {
      return car.model;
    }
    if (prefetchedSummary?.model) {
      return prefetchedSummary.model;
    }
    return prefetchedSummary?.title;
  })();
  const summaryExteriorColorRaw =
    car?.color ?? car?.details?.exterior_color ?? prefetchedSummary?.color;
  const summaryExteriorColor =
    typeof summaryExteriorColorRaw === "string" && summaryExteriorColorRaw.trim()
      ? translateColor(summaryExteriorColorRaw)
      : undefined;
  const summaryInteriorColorRaw = car?.details?.interior_color;
  const summaryInteriorColor =
    typeof summaryInteriorColorRaw === "string" && summaryInteriorColorRaw.trim()
      ? translateColor(summaryInteriorColorRaw)
      : undefined;
  const primarySpecs = [
    { label: "Prodhuesi", value: summaryMake },
    { label: "Modeli", value: summaryModel },
    {
      label: "Viti",
      value:
        typeof summaryYear === "number"
          ? summaryYear.toString()
          : undefined,
    },
    { label: "Kilometrazh", value: summaryMileage },
    { label: "Karburanti", value: summaryFuel },
    { label: "Kapaciteti i Motorit", value: summaryEngineVolume },
    { label: "Transmisioni", value: summaryTransmission },
    { label: "Drejtimi", value: summaryDrive },
    { label: "Ulëset", value: summarySeats },
    { label: "VIN", value: summaryVin },
    { label: "Ngjyra e Jashtme", value: summaryExteriorColor },
    { label: "Ngjyra e Brendshme", value: summaryInteriorColor },
  ].filter((item) => Boolean(item.value));

  const handleOpenHistoryReport = useCallback(() => {
    const targetLot = carLot ?? lot;
    if (!targetLot) {
      return;
    }
    navigate(`/car/${encodeURIComponent(String(targetLot))}/report`);
  }, [carLot, lot, navigate]);

  // Reset placeholder state when image selection changes
  useEffect(() => {
    setIsPlaceholderImage(false);
  }, [selectedImageIndex]);

  // Auto-expand detailed info if car has rich data (only once)
  useEffect(() => {
    if (car && !hasAutoExpanded) {
      const hasRichData =
        car.details?.options ||
        car.insurance_v2 ||
        car.details?.inspect_outer ||
        car.details?.inspect?.inner ||
        car.details?.insurance;
      if (hasRichData) {
        setShowDetailedInfo(true);
        setHasAutoExpanded(true);
      }
    }
  }, [car, hasAutoExpanded]);
  const API_BASE_URL = "https://auctionsapi.com/api";
  const API_KEY = "d00985c77981fe8d26be16735f932ed1";
  const KBC_DOMAINS = [
    "kbchachacha",
    "kbchacha",
    "kb_chachacha",
    "kbc",
    "kbcchachacha",
  ];

  const buildCarDetails = useCallback(
    (
      carData: any,
      lotData: any,
      additionalSources: any[] = [],
    ): CarDetails | null => {
      if (!carData || !lotData) {
        return null;
      }

      const buyNow = Number(
        lotData?.buy_now || carData?.buy_now || carData?.price,
      );
      if (!buyNow || Number.isNaN(buyNow) || buyNow <= 0) {
        return null;
      }

      const price = calculateFinalPriceEUR(buyNow, exchangeRate.rate);
      const domainRaw = String(
        lotData?.domain?.name ||
        carData?.domain_name ||
        carData?.provider ||
        carData?.source_api ||
        "",
      ).toLowerCase();
      const isKbc = domainRaw
        ? KBC_DOMAINS.some((k) => domainRaw.includes(k))
        : false;
      const sourceLabel = domainRaw
        ? isKbc
          ? "KB Chachacha"
          : "Encar"
        : undefined;

      const manufacturerName =
        carData?.manufacturer?.name || carData?.make || "Unknown";
      const modelName = carData?.model?.name || carData?.model || "Unknown";

      // Extract year from multiple possible sources
      const year =
        carData?.year ||
        lotData?.year ||
        carData?.model_year ||
        lotData?.model_year ||
        carData?.production_year ||
        lotData?.production_year ||
        (carData?.registration_date
          ? new Date(carData.registration_date).getFullYear()
          : null) ||
        (lotData?.registration_date
          ? new Date(lotData.registration_date).getFullYear()
          : null) ||
        null;

      if (!year) {
        console.warn("⚠️ No year found in car data, using fallback");
      }

      const odometer =
        lotData?.odometer ||
        carData?.odometer ||
        (lotData?.odometer_km
          ? {
            km: lotData.odometer_km,
            mi: Math.round(Number(lotData.odometer_km) * 0.621371),
          }
          : null) ||
        (carData?.odometer_km
          ? {
            km: carData.odometer_km,
            mi: Math.round(Number(carData.odometer_km) * 0.621371),
          }
          : null) ||
        (lotData?.mileage
          ? {
            km: lotData.mileage,
            mi: Math.round(Number(lotData.mileage) * 0.621371),
          }
          : null) ||
        (carData?.mileage
          ? {
            km: carData.mileage,
            mi: Math.round(Number(carData.mileage) * 0.621371),
          }
          : null);

      const images =
        lotData?.images?.normal ||
        lotData?.images?.big ||
        carData?.images?.normal ||
        carData?.images?.big ||
        lotData?.images ||
        carData?.images ||
        [];

      const normalizedFuelSources = Array.isArray(additionalSources)
        ? additionalSources.filter(Boolean)
        : [];
      const resolvedFuel = resolveFuelFromSources(
        carData,
        lotData,
        ...normalizedFuelSources,
      );

      return {
        id: carData?.id?.toString() || lotData?.lot,
        make: manufacturerName,
        model: modelName,
        year: year || 2020, // Use extracted year or fallback to 2020
        price,
        image: images?.[0],
        images,
        source_label: sourceLabel,
        vin: carData?.vin,
        mileage: odometer?.km,
        transmission:
          carData?.transmission?.name ||
          carData?.transmission ||
          lotData?.transmission?.name ||
          lotData?.transmission,
        fuel: resolvedFuel || undefined,
        color:
          carData?.color?.name ||
          carData?.color ||
          lotData?.color?.name ||
          lotData?.color,
        condition:
          lotData?.condition?.name?.replace(
            "run_and_drives",
            "Good Condition",
          ) || carData?.condition,
        lot: lotData?.lot || carData?.lot_number,
        title: carData?.title || lotData?.title,
        odometer: odometer
          ? {
            km: odometer.km,
            mi:
              odometer.mi || Math.round(Number(odometer.km || 0) * 0.621371),
            status:
              lotData?.odometer?.status ||
              carData?.odometer?.status || { name: "Verified" },
          }
          : undefined,
        engine: carData?.engine || lotData?.engine,
        cylinders: carData?.cylinders || lotData?.cylinders,
        drive_wheel: carData?.drive_wheel || lotData?.drive_wheel,
        body_type: carData?.body_type || lotData?.body_type,
        damage: lotData?.damage || carData?.damage,
        keys_available: lotData?.keys_available ?? carData?.keys_available,
        airbags: lotData?.airbags || carData?.airbags,
        grade_iaai:
          lotData?.grade_iaai ||
          carData?.grade?.name ||
          carData?.grade ||
          lotData?.grade?.name ||
          lotData?.grade,
        seller: lotData?.seller || carData?.seller,
        seller_type: lotData?.seller_type || carData?.seller_type,
        sale_date: lotData?.sale_date || carData?.sale_date,
        bid: lotData?.bid || carData?.bid,
        buy_now: lotData?.buy_now || carData?.buy_now,
        final_bid: lotData?.final_bid || carData?.final_bid,
        features: getCarFeatures(carData, lotData, normalizedFuelSources),
        safety_features: getSafetyFeatures(carData, lotData),
        comfort_features: getComfortFeatures(carData, lotData),
        performance_rating: 4.5,
        popularity_score: 85,
        insurance: lotData?.insurance,
        insurance_v2: lotData?.insurance_v2 || carData?.insurance_v2,
        location: lotData?.location,
        inspect: lotData?.inspect || carData?.inspect,
        // Merge details from both sources to get all variant info + inspect data
        details: {
          ...(carData?.details || {}),
          ...(lotData?.details || {}),
          grade:
            carData?.grade ||
            lotData?.grade ||
            carData?.details?.grade ||
            lotData?.details?.grade,
          variant:
            carData?.variant ||
            lotData?.variant ||
            carData?.details?.variant ||
            lotData?.details?.variant,
          trim:
            carData?.trim ||
            lotData?.trim ||
            carData?.details?.trim ||
            lotData?.details?.trim,
          // Include inspect data from lotData.inspect as per API support
          inspect:
            lotData?.inspect ||
            lotData?.details?.inspect || {
              accident_summary:
                lotData?.inspect?.accident_summary ||
                lotData?.details?.inspect?.accident_summary,
              outer:
                lotData?.inspect?.outer ||
                lotData?.details?.inspect?.outer ||
                lotData?.inspect_outer,
              inner:
                lotData?.inspect?.inner || lotData?.details?.inspect?.inner,
            },
          inspect_outer:
            lotData?.inspect?.outer ||
            lotData?.details?.inspect_outer ||
            lotData?.inspect_outer,
          // Include options data
          options: lotData?.details?.options || carData?.details?.options,
          options_extra:
            lotData?.details?.options_extra || carData?.details?.options_extra,
        },
      };
    },
    [KBC_DOMAINS, exchangeRate.rate],
  );

  // Convert option numbers to human-friendly names using the Korea options API
  const convertOptionsToNames = useCallback(
    (options: any): { standard: string[]; choice: string[]; tuning: string[] } => {
      if (!options) {
        return {
          standard: [],
          choice: [],
          tuning: [],
        };
      }

      const resolveOptionName = (option: any): string => {
        if (option === null || option === undefined) {
          return "";
        }

        if (typeof option === "object") {
          const nameCandidate =
            (typeof option.name === "string" && option.name.trim()) ||
            (typeof option.name_original === "string" &&
              option.name_original.trim());

          if (nameCandidate) {
            return nameCandidate;
          }

          if (option.code) {
            option = option.code;
          } else if (option.id) {
            option = option.id;
          } else if (option.value) {
            option = option.value;
          }
        }

        const optionStr = option.toString().trim();
        if (!optionStr) {
          return "";
        }

        const apiName = getOptionName(optionStr);
        if (apiName && apiName.trim() && apiName.trim() !== optionStr) {
          return apiName.trim();
        }

        const fallbackName = getFallbackOptionName(optionStr);
        if (fallbackName) {
          return fallbackName;
        }

        return optionStr;
      };

      const normalizeList = (list?: any[]): string[] =>
        Array.isArray(list)
          ? list
            .map(resolveOptionName)
            .map((name) => (typeof name === "string" ? name.trim() : ""))
            .filter((name): name is string => Boolean(name))
          : [];

      return {
        standard: normalizeList(options.standard),
        choice: normalizeList(options.choice),
        tuning: normalizeList(options.tuning),
      };
    },
    [getOptionName],
  );

  const persistCarToSession = useCallback(
    (targetLot: string, payload: unknown) => {
      if (typeof window === "undefined") {
        return;
      }

      const normalizedLot = String(targetLot);
      const encodedLot = encodeURIComponent(normalizedLot);

      try {
        const serialized = JSON.stringify(payload);
        sessionStorage.setItem(`car_${encodedLot}`, serialized);
        if (encodedLot !== normalizedLot) {
          sessionStorage.setItem(`car_${normalizedLot}`, serialized);
        }
      } catch (storageError) {
        console.warn("Failed to persist car data in sessionStorage", storageError);
      }

      try {
        const summary = extractPrefetchedCarSummary(payload);
        if (summary) {
          const summarySerialized = JSON.stringify(summary);
          sessionStorage.setItem(
            `car_prefetch_${encodedLot}`,
            summarySerialized,
          );
          if (encodedLot !== normalizedLot) {
            sessionStorage.setItem(
              `car_prefetch_${normalizedLot}`,
              summarySerialized,
            );
          }
          setPrefetchedSummary(summary);
        }
      } catch (summaryError) {
        console.warn(
          "Failed to persist car summary in sessionStorage",
          summaryError,
        );
      }
    },
    [setPrefetchedSummary],
  );

  const restoreCarFromSession = useCallback((): CarDetails | null => {
    if (typeof window === "undefined" || !lot) {
      return null;
    }

    const normalizedLot = String(lot);
    const encodedLot = encodeURIComponent(normalizedLot);
    const keys = [
      `car_${encodedLot}`,
      encodedLot !== normalizedLot ? `car_${normalizedLot}` : null,
    ].filter(Boolean) as string[];

    for (const key of keys) {
      try {
        const raw = sessionStorage.getItem(key);
        if (!raw) {
          continue;
        }
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === "object") {
          const summary = extractPrefetchedCarSummary(parsed);
          if (summary) {
            setPrefetchedSummary(summary);
          }
          return parsed as CarDetails;
        }
      } catch (sessionError) {
        console.warn(`Failed to restore car data from ${key}`, sessionError);
      }
    }

    return null;
  }, [lot, setPrefetchedSummary]);

  const hydrateFromCache = useCallback(async () => {
    if (!lot) {
      return null;
    }

    const sessionCar = restoreCarFromSession();
    if (sessionCar) {
      setCar(sessionCar);
      setLoading(false);
      cacheHydratedRef.current = true;
      return sessionCar;
    }

    return null;

    return null;
  }, [buildCarDetails, lot, persistCarToSession, restoreCarFromSession]);

  const getFirstNonEmptyString = (...values: unknown[]): string | null => {
    for (const value of values) {
      if (value === null || value === undefined) {
        continue;
      }
      const candidate = String(value).trim();
      if (candidate) {
        return candidate;
      }
    }
    return null;
  };

  const selectLotForSource = (source: any, lotNumber?: string) => {
    if (!source) {
      return null;
    }

    const lots = Array.isArray(source?.lots) ? source.lots : [];
    if (!lots.length) {
      return null;
    }

    if (lotNumber) {
      const normalizedLot = String(lotNumber).trim();
      const matchedLot = lots.find((candidate: any) => {
        const candidateValue =
          candidate?.lot ??
          candidate?.lot_number ??
          candidate?.lotNumber ??
          candidate?.lotNo;
        if (candidateValue === null || candidateValue === undefined) {
          return false;
        }
        return String(candidateValue).trim() === normalizedLot;
      });
      if (matchedLot) {
        return matchedLot;
      }
    }

    return lots[0];
  };

  // Extract features from car data
  const getCarFeatures = (
    carData: any,
    lot: any,
    extraSources: any[] = [],
  ): string[] => {
    const features = [];
    if (carData.transmission?.name) {
      features.push(`Transmisioni: ${carData.transmission.name}`);
    }

    const resolvedFuel = resolveFuelFromSources(carData, lot, ...extraSources);
    if (resolvedFuel) {
      features.push(
        `Karburanti: ${localizeFuel(resolvedFuel, "sq") || resolvedFuel}`,
      );
    } else if (carData.fuel?.name) {
      features.push(`Karburanti: ${carData.fuel.name}`);
    }

    if (carData.color?.name) {
      features.push(`Ngjyra: ${carData.color.name}`);
    }
    if (carData.engine?.name) {
      features.push(`Motori: ${carData.engine.name}`);
    }
    if (carData.cylinders) {
      features.push(`${carData.cylinders} Cilindra`);
    }
    if (carData.drive_wheel?.name) {
      features.push(`Tërheqje: ${carData.drive_wheel.name}`);
    }
    if (lot?.keys_available) {
      features.push("Çelësat të Disponueshëm");
    }

    // Add basic features if list is empty
    if (features.length === 0) {
      return [
        "Klimatizimi",
        "Dritaret Elektrike",
        "Mbyllja Qendrore",
        "Frena ABS",
      ];
    }
    return features;
  };
  const getSafetyFeatures = (carData: any, lot: any): string[] => {
    const safety = [];
    if (lot?.airbags) safety.push(`Sistemi i Airbag-ëve: ${lot.airbags}`);
    if (carData.transmission?.name === "automatic")
      safety.push("ABS Sistemi i Frënimit");
    safety.push("Sistemi i Stabilitetit Elektronik");
    if (lot?.keys_available) safety.push("Sistemi i Sigurisë");

    // Add default safety features
    return safety.length > 0
      ? safety
      : ["ABS Sistemi i Frënimit", "Airbag Sistemi", "Mbyllja Qendrore"];
  };
  const getComfortFeatures = (carData: any, lot: any): string[] => {
    const comfort = [];
    if (carData.transmission?.name === "automatic")
      comfort.push("Transmisioni Automatik");
    comfort.push("Klimatizimi");
    comfort.push("Dritaret Elektrike");
    comfort.push("Pasqyrat Elektrike");
    return comfort;
  };

  // Admin status is now handled by useAdminCheck hook
  useEffect(() => {
    let isMounted = true;

    const fetchFromApi = async ({ background = false }: { background?: boolean } = {}) => {
      if (!lot) return;

      // Check if car is already loaded (from cache restoration)
      if (car && !background) {
        return;
      }

      if (!background) {
        setLoading(true);
        setError(null);
      }
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 6000); // 6s timeout for better reliability

        let response: Response;
        try {
          response = await fetch(`${API_BASE_URL}/search-lot/${lot}/iaai`, {
            headers: {
              accept: "*/*",
              "x-api-key": API_KEY,
            },
            signal: controller.signal,
          });
        } catch (firstAttemptError) {
          response = await fetch(`${API_BASE_URL}/search?lot_number=${lot}`, {
            headers: {
              accept: "*/*",
              "x-api-key": API_KEY,
            },
            signal: controller.signal,
          });
        }

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(
            `API returned ${response.status}: ${response.statusText}`,
          );
        }

        const data = await response.json();
        if (!isMounted) return;

        const apiPayload = data?.data ?? data;
        const initialLotData = selectLotForSource(apiPayload, lot);

        let appliedDetails: CarDetails | null = null;
        let hasTrackedView = false;

        const applyDetails = (
          nextDetails: CarDetails,
          shouldTrackView: boolean,
        ) => {
          appliedDetails = nextDetails;
          setCar(nextDetails);
          cacheHydratedRef.current = true;
          persistCarToSession(String(lot), nextDetails);
          if (!background && shouldTrackView && !hasTrackedView) {
            trackCarView(lot, nextDetails);
            hasTrackedView = true;
          }
        };

        const baselineDetails = buildCarDetails(apiPayload, initialLotData);
        if (baselineDetails) {
          applyDetails(baselineDetails, true);
          if (!background) {
            setLoading(false);
          }
        }

        let detailedCarData: any = null;
        let detailedLotData: any = null;

        const candidateCarId = getFirstNonEmptyString(
          apiPayload?.id,
          apiPayload?.car_id,
          apiPayload?.api_id,
          apiPayload?.carId,
          initialLotData?.car_id,
          initialLotData?.carId,
          initialLotData?.car?.id,
        );

        if (candidateCarId) {
          const detailController = new AbortController();
          const detailTimeoutId = setTimeout(
            () => detailController.abort(),
            6000, // Reduced to 6s for faster detail fetch
          );
          try {
            const detailResponse = await fetch(
              `${API_BASE_URL}/cars/${encodeURIComponent(candidateCarId)}`,
              {
                headers: {
                  accept: "*/*",
                  "x-api-key": API_KEY,
                },
                signal: detailController.signal,
              },
            );
            clearTimeout(detailTimeoutId);

            if (detailResponse.ok) {
              const detailPayload = await detailResponse.json();
              detailedCarData = detailPayload?.data || detailPayload || null;
              detailedLotData =
                selectLotForSource(detailedCarData, lot) ?? initialLotData;
            } else {
              console.warn(
                `Detailed car request failed: ${detailResponse.status} ${detailResponse.statusText}`,
              );
            }
          } catch (detailError) {
            clearTimeout(detailTimeoutId);
            console.warn("Failed to fetch detailed car data:", detailError);
          }
        }

        const primaryCarData = detailedCarData || apiPayload;
        const primaryLotData = detailedLotData || initialLotData;

        const additionalFuelSources: any[] = [];
        if (detailedCarData && apiPayload && detailedCarData !== apiPayload) {
          additionalFuelSources.push(apiPayload);
        }
        if (initialLotData && primaryLotData && primaryLotData !== initialLotData) {
          additionalFuelSources.push(initialLotData);
        }

        const enhancedDetails = buildCarDetails(
          primaryCarData,
          primaryLotData,
          additionalFuelSources,
        );

        if (enhancedDetails) {
          if (enhancedDetails !== appliedDetails) {
            applyDetails(enhancedDetails, !hasTrackedView);
          }
          if (!baselineDetails && !background) {
            setLoading(false);
          }
        } else if (!baselineDetails) {
          if (!background) {
            setError("Car not found in API response");
            setLoading(false);
          }
          return;
        }
      } catch (apiError) {
        console.error("Failed to fetch car data:", apiError);
        if (!isMounted) return;

        const fallbackCar = fallbackCars.find(
          (fallback) => fallback.id === lot || fallback.lot_number === lot,
        );
        if (fallbackCar && fallbackCar.lots?.[0]) {
          const details = buildCarDetails(fallbackCar, fallbackCar.lots[0]);
          if (details) {
            setCar(details);
            cacheHydratedRef.current = true;
            if (!background) {
              setLoading(false);
            }
            persistCarToSession(String(lot), details);
            return;
          }
        }

        const errorMessage =
          apiError instanceof Error
            ? apiError.message.includes("Failed to fetch")
              ? "Unable to connect to the server. Please check your internet connection and try again."
              : apiError.message.includes("404")
                ? `Car with ID ${lot} is not available. This car may have been sold or removed.`
                : "Car not found"
            : "Car not found";
        if (!background) {
          setError(errorMessage);
          setLoading(false);
        } else {
          console.warn("Background refresh failed:", apiError);
        }
      }
    };

    const loadCar = async () => {
      // Show prefetched data immediately if available
      const sessionData = restoreCarFromSession();
      if (sessionData) {
        setCar(sessionData);
        setLoading(false);
        cacheHydratedRef.current = true;
        fetchFromApi({ background: true }).catch((error) => {
          console.warn("Background refresh failed", error);
        });
        return;
      }

      const cachePromise = hydrateFromCache();

      let shouldBackgroundRefresh = false;

      // Reduced timeout from 200ms to 100ms for faster display
      const quickCacheResult = await Promise.race([
        cachePromise
          .then((data) => {
            if (data) {
              shouldBackgroundRefresh = true;
            }
            return data;
          })
          .catch(() => null),
        new Promise<null>((resolve) => setTimeout(() => resolve(null), 100)),
      ]);

      const apiPromise = fetchFromApi({
        background: shouldBackgroundRefresh,
      });

      cachePromise.catch((error) => {
        console.warn("Cache hydration failed", error);
      });

      if (!quickCacheResult) {
        await apiPromise;
      } else {
        apiPromise.catch((error) => {
          console.warn("Background refresh failed", error);
        });
      }
    };

    loadCar();

    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    API_BASE_URL,
    API_KEY,
    buildCarDetails,
    fallbackCars,
    hydrateFromCache,
    lot,
    navigate,
    persistCarToSession,
    restoreCarFromSession,
    trackCarView,
  ]);
  const handleContactWhatsApp = useCallback(() => {
    impact("light");
    const currentUrl = window.location.href;
    const message = `Përshëndetje! Jam i interesuar për ${car?.year} ${car?.make} ${car?.model} (€${car?.price.toLocaleString()}) - Kodi #${car?.lot || lot}. A mund të më jepni më shumë informacion? ${currentUrl}`;
    const whatsappUrl = `https://wa.me/38348181116?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, "_blank");
  }, [car, lot, impact]);
  const handlePhoneCall = useCallback(() => {
    impact("light");
    window.open("tel:+38348181116", "_self");
  }, [impact]);
  const handleShare = useCallback(() => {
    impact("light");
    navigator.clipboard.writeText(window.location.href);
    toast({
      title: "Link-u u kopjua",
      description: "Link-u i makinës u kopjua në clipboard",
      duration: 3000,
    });
  }, [toast, impact]);

  const prepareInspectionReportPrefetch = useCallback(
    (reportLot: string | number) => {
      if (typeof window === "undefined") {
        return;
      }

      try {
        const primaryImage =
          (Array.isArray(car?.images) && car?.images.length > 0
            ? car?.images[0]
            : undefined) ?? car?.image;
        const inferredTitle = [car?.year, car?.make, car?.model]
          .filter((value) => value !== null && value !== undefined && value !== "")
          .join(" ")
          .trim();
        const reportSummary = {
          id: car?.id ?? String(reportLot),
          lot: String(reportLot),
          make: car?.make,
          model: car?.model,
          year: car?.year,
          title:
            typeof car?.title === "string" && car.title.trim()
              ? car.title.trim()
              : inferredTitle || undefined,
          image: primaryImage,
          priceEUR: car?.price,
          mileageKm:
            car?.odometer?.km ??
            (typeof car?.mileage === "number" ? car.mileage : undefined),
          vin: car?.vin,
          fuel: car?.fuel,
          insurance: car?.insurance_v2,
          cachedAt: new Date().toISOString(),
        };
        sessionStorage.setItem(
          `car_report_prefetch_${encodeURIComponent(String(reportLot))}`,
          JSON.stringify(reportSummary),
        );
      } catch (storageError) {
        console.warn(
          "Failed to persist inspection report prefetch payload",
          storageError,
        );
      }
    },
    [car],
  );

  // Memoize images array for performance - compute before early returns (limit to 20 for gallery)
  const images = useMemo(() => {
    if (car?.images?.length) {
      return car.images.slice(0, 20); // Limit to 20 images as per API specification
    }
    if (car?.image) {
      return [car.image];
    }
    return [];
  }, [car?.images, car?.image]);

  const mainTitle = useMemo(() => {
    if (!car) {
      return "";
    }
    return [car.year, car.make, car.model]
      .filter((value) => value !== null && value !== undefined && value !== "")
      .join(" ")
      .trim();
  }, [car]);

  const secondaryTitle = useMemo(() => {
    const sanitizePart = (value: string) =>
      value
        .replace(/\s*•\s*$/u, "")
        .replace(/\s+/g, " ")
        .trim();

    if (!car) {
      return "";
    }

    const rawParts = [
      typeof car.title === "string" ? car.title.trim() : "",
      typeof car.details?.variant === "string" ? car.details.variant.trim() : "",
      typeof car.details?.trim === "string" ? car.details.trim.trim() : "",
      typeof car.details?.grade === "string" ? car.details.grade.trim() : "",
    ]
      .map((part) => (part ? sanitizePart(part) : ""))
      .filter(Boolean);

    const uniqueParts: string[] = [];

    rawParts.forEach((part) => {
      const normalized = part.toLowerCase();
      if (!normalized) {
        return;
      }

      let shouldAdd = true;

      for (let index = 0; index < uniqueParts.length; index += 1) {
        const existing = uniqueParts[index];
        const existingNormalized = existing.toLowerCase();

        if (existingNormalized === normalized) {
          shouldAdd = false;
          break;
        }

        if (existingNormalized.includes(normalized)) {
          shouldAdd = false;
          break;
        }

        if (normalized.includes(existingNormalized)) {
          uniqueParts[index] = part;
          shouldAdd = false;
          break;
        }
      }

      if (shouldAdd) {
        uniqueParts.push(part);
      }
    });

    if (uniqueParts.length > 0) {
      return sanitizePart(uniqueParts.join(" • "));
    }

    return sanitizePart(mainTitle);
  }, [car, mainTitle]);

  const summaryTitleFallback = useMemo(() => {
    if (!prefetchedSummary) {
      return "";
    }
    const parts = [
      prefetchedSummary.year,
      prefetchedSummary.make,
      prefetchedSummary.model,
    ].filter(Boolean);
    if (parts.length > 0) {
      return parts.join(" ").trim();
    }
    return prefetchedSummary.title ?? "";
  }, [prefetchedSummary]);

  const resolvedMainTitle = useMemo(() => {
    if (mainTitle) {
      return mainTitle;
    }
    return summaryTitleFallback;
  }, [mainTitle, summaryTitleFallback]);

  const resolvedSecondaryTitle = useMemo(() => {
    if (secondaryTitle && secondaryTitle !== resolvedMainTitle) {
      return secondaryTitle;
    }
    const summaryTitle = prefetchedSummary?.title?.trim() ?? "";
    if (summaryTitle && summaryTitle !== resolvedMainTitle) {
      return summaryTitle;
    }
    return "";
  }, [prefetchedSummary?.title, resolvedMainTitle, secondaryTitle]);

  const displayTitle = useMemo(() => {
    if (resolvedSecondaryTitle) {
      return resolvedSecondaryTitle;
    }
    return resolvedMainTitle;
  }, [resolvedMainTitle, resolvedSecondaryTitle]);

  const detailsMake = (car?.details as any)?.make;
  const detailsManufacturer = (car?.details as any)?.manufacturer;

  const resolvedBrandName = useMemo(() => {
    const potentialBrands = [
      car?.make,
      detailsMake,
      detailsManufacturer,
      prefetchedSummary?.make,
    ];

    for (const value of potentialBrands) {
      if (typeof value === "string" && value.trim()) {
        return value.trim();
      }
    }

    if (resolvedMainTitle) {
      const firstWord = resolvedMainTitle.split(" ")[0]?.trim();
      if (firstWord) {
        return firstWord;
      }
    }

    return "";
  }, [car?.make, detailsMake, detailsManufacturer, prefetchedSummary?.make, resolvedMainTitle]);

  const brandLogoVariants = useMemo(() => {
    if (!resolvedBrandName) {
      return undefined;
    }
    return getBrandLogoVariants(resolvedBrandName);
  }, [resolvedBrandName]);

  const brandLogo = useMemo(() => {
    if (!resolvedBrandName) {
      return undefined;
    }
    return getBrandLogo(resolvedBrandName, resolvedTheme);
  }, [resolvedBrandName, resolvedTheme]);

  const normalizedOptions = useMemo(
    () => convertOptionsToNames(car?.details?.options),
    [car?.details?.options, convertOptionsToNames],
  );

  const sanitizedOptions = useMemo(() => {
    const baseOptions = normalizedOptions || {
      standard: [],
      choice: [],
      tuning: [],
    };

    const exclusionValues = new Set<string>();
    [
      mainTitle,
      resolvedMainTitle,
      resolvedSecondaryTitle,
      typeof car?.title === "string" ? car.title : "",
      typeof car?.details?.variant === "string" ? car.details.variant : "",
      typeof car?.details?.trim === "string" ? car.details.trim : "",
    ].forEach((value) => {
      if (typeof value === "string" && value.trim()) {
        exclusionValues.add(value.trim().toLowerCase());
      }
    });

    const sanitizeList = (list: string[]): string[] => {
      const seen = new Set<string>();
      return list.filter((item) => {
        const normalized = item.trim().toLowerCase();
        if (!normalized || exclusionValues.has(normalized)) {
          return false;
        }
        if (seen.has(normalized)) {
          return false;
        }
        seen.add(normalized);
        return true;
      });
    };

    return {
      standard: sanitizeList(baseOptions.standard),
      choice: sanitizeList(baseOptions.choice),
      tuning: sanitizeList(baseOptions.tuning),
    };
  }, [
    normalizedOptions,
    mainTitle,
    resolvedMainTitle,
    resolvedSecondaryTitle,
    car?.title,
    car?.details?.variant,
    car?.details?.trim,
  ]);

  const hasAnySanitizedOptions =
    sanitizedOptions.standard.length > 0 ||
    sanitizedOptions.choice.length > 0 ||
    sanitizedOptions.tuning.length > 0;

  const fuelDisplay = useMemo(() => {
    if (!car) {
      return "-";
    }

    if (car.fuel) {
      const localizedFromState = localizeFuel(car.fuel, "sq");
      return localizedFromState || car.fuel;
    }

    const resolvedFuel =
      resolveFuelFromSources(
        car,
        car.details,
        car.details?.specs,
        car.details?.specifications,
        car.details?.specification,
        car.details?.technical,
        (car.details as any)?.technicalSpecifications,
        (car.details as any)?.technicalSpecification,
        car.details?.summary,
        (car.details?.summary as any)?.specs,
        (car.details?.summary as any)?.specifications,
        car.insurance_v2,
        (car.insurance_v2 as any)?.vehicle,
        car.inspect,
        car.insurance,
      ) ?? undefined;

    if (resolvedFuel) {
      const localized = localizeFuel(resolvedFuel, "sq");
      return localized || resolvedFuel;
    }

    if (Array.isArray(car.features)) {
      const fuelFeature = car.features.find((feature) =>
        feature.toLowerCase().startsWith("karburanti"),
      );
      if (fuelFeature) {
        const value = fuelFeature.split(":").slice(1).join(":").trim();
        if (value) {
          const localized = localizeFuel(value, "sq");
          return localized || value;
        }
      }
    }

    return "-";
  }, [car]);

  const handleSwipeImageChange = useCallback(
    (index: number, meta?: ImageSwipeChangeMeta) => {
      setSelectedImageIndex(index);

      if (meta?.direction === "next" || meta?.direction === "previous") {
        setImageSwipeDirection(meta.direction);
      } else {
        setImageSwipeDirection(null);
      }
    },
    [],
  );

  // Add swipe functionality for car detail photos - must be before early returns
  const {
    currentIndex: swipeCurrentIndex,
    containerRef: imageContainerRef,
    goToNext,
    goToPrevious,
    goToIndex,
    isClickAllowed,
    swipeOffset,
    isSwiping,
  } = useImageSwipe({
    images,
    onImageChange: handleSwipeImageChange,
  });

  const imageSwipeStyle = useMemo<CSSProperties>(
    () => ({
      transform: `translate3d(${swipeOffset}px, 0, 0)`,
      transition: isSwiping
        ? "none"
        : "transform 0.35s cubic-bezier(0.22, 1, 0.36, 1)",
      willChange: "transform",
    }),
    [swipeOffset, isSwiping],
  );

  const swipeWrapperClass = useMemo(
    () =>
      `image-swipe-wrapper${isSwiping ? " image-swipe-wrapper--dragging" : ""
      }`,
    [isSwiping],
  );

  // Sync swipe current index with selected image index
  useEffect(() => {
    if (swipeCurrentIndex !== selectedImageIndex) {
      goToIndex(selectedImageIndex, "manual");
    }
  }, [selectedImageIndex, swipeCurrentIndex, goToIndex]);
  const registerMapTarget = useCallback((node: HTMLDivElement | null) => {
    // Map is now always rendered, no need to track targets
  }, []);

  // Always render map immediately - no intersection observer needed
  useEffect(() => {
    setShouldRenderMap(true);
  }, []);

  const handleImageZoomOpen = useCallback(
    (event?: { preventDefault(): void; stopPropagation(): void }) => {
      event?.preventDefault();
      event?.stopPropagation();

      if (!allowImageZoom || !images.length || !isClickAllowed()) {
        return;
      }

      impact("light");
      setIsImageZoomOpen(true);
    },
    [allowImageZoom, images.length, impact, isClickAllowed],
  );

  const handleImageZoomClose = useCallback(() => {
    setIsImageZoomOpen(false);
  }, []);
  const carImages = useMemo(() => car?.images || [], [car?.images]);
  const [isLiked, setIsLiked] = useState(false);
  const handleLike = useCallback(() => {
    impact(isLiked ? "light" : "medium");
    setIsLiked(!isLiked);
    toast({
      title: isLiked ? "U hoq nga të preferuarat" : "U shtua në të preferuarat",
      description: isLiked
        ? "Makina u hoq nga lista juaj e të preferuarave"
        : "Makina u shtua në listën tuaj të të preferuarave",
      duration: 3000,
    });
  }, [isLiked, toast, impact]);

  // Handler for opening gallery images in a new page
  const openGallery = useCallback(() => {
    trackPageView(`/car/${lot}/gallery`);
    navigate(`/car/${lot}/gallery`, {
      state: {
        images,
        carMake: car?.make,
        carModel: car?.model,
        carYear: car?.year,
        carLot: car?.lot || lot,
      },
    });
  }, [car?.lot, car?.make, car?.model, car?.year, images, lot, navigate]);

  const handleGalleryClick = useCallback(
    (e: React.MouseEvent, bypassSwipeGuard = false) => {
      e.stopPropagation();
      if (!bypassSwipeGuard && !isClickAllowed()) {
        return;
      }
      openGallery();
    },
    [isClickAllowed, openGallery],
  );

  const handleGalleryButtonClick = useCallback(
    (e: React.MouseEvent) => {
      handleGalleryClick(e, true);
    },
    [handleGalleryClick],
  );

  const handleScrollToHistory = useCallback(() => {
    impact("light");
    const reportLot = car?.lot || lot;
    if (!reportLot) return;

    prepareInspectionReportPrefetch(reportLot);
    const encodedLot = encodeURIComponent(String(reportLot));
    navigate(`/car/${encodedLot}/report`);
  }, [car?.lot, impact, lot, navigate, prepareInspectionReportPrefetch]);

  // Preload important images
  useImagePreload(car?.image ?? prefetchedSummary?.image);

  // Show skeleton loader when loading without any cached data
  if (loading && !car && !prefetchedSummary) {
    return <CarDetailsSkeleton />;
  }

  if (loading && !car) {
    if (prefetchedSummary) {
      const summaryTitleParts = [
        prefetchedSummary.year,
        prefetchedSummary.make,
        prefetchedSummary.model,
      ].filter(Boolean);
      const summaryTitle =
        summaryTitleParts.length > 0
          ? summaryTitleParts.join(" ")
          : prefetchedSummary.title ?? "Makina";
      const summaryFuel = prefetchedSummary.fuel
        ? localizeFuel(prefetchedSummary.fuel, "sq") ?? prefetchedSummary.fuel
        : undefined;
      const summaryTransmission = prefetchedSummary.transmission
        ? translateTransmission(prefetchedSummary.transmission)
        : undefined;
      const summaryColor = prefetchedSummary.color
        ? translateColor(prefetchedSummary.color)
        : undefined;
      const summaryMileage =
        prefetchedSummary.mileageLabel ??
        undefined;
      const formattedPrice =
        typeof prefetchedSummary.price === "number"
          ? `€${prefetchedSummary.price.toLocaleString()}`
          : undefined;

      return (
        <div className="min-h-screen bg-background animate-fade-in">
          <div className="container-responsive py-6 max-w-[1600px] space-y-6">
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  if (pageState && pageState.url) {
                    navigate(pageState.url);
                  } else {
                    goBack();
                  }
                }}
                className="h-9 px-4"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Kthehu te Makinat
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate("/")}
                className="h-9 px-4"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Kryefaqja
              </Button>
            </div>

            <div className="grid gap-6 lg:grid-cols-5">
              <div className="lg:col-span-3">
                <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl border border-border bg-card">
                  {prefetchedSummary.image ? (
                    <img
                      src={prefetchedSummary.image}
                      alt={summaryTitle || "Makina"}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-sm text-muted-foreground">
                      Po përgatitet imazhi i makinës…
                    </div>
                  )}
                </div>
              </div>
              <div className="lg:col-span-2 space-y-4">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Po ngarkohet raporti i plotë
                    </p>
                    <h1 className="mt-2 text-2xl sm:text-3xl font-bold text-foreground">
                      {summaryTitle}
                    </h1>
                    {prefetchedSummary.title &&
                      prefetchedSummary.title !== summaryTitle && (
                        <p className="mt-1 text-sm text-muted-foreground">
                          {prefetchedSummary.title}
                        </p>
                      )}
                    {prefetchedSummary.lot && (
                      <p className="mt-1 text-xs font-medium tracking-wide text-muted-foreground uppercase">
                        Lot #{prefetchedSummary.lot}
                      </p>
                    )}
                  </div>

                  {formattedPrice && (
                    <div className="hidden lg:flex min-w-[200px] flex-col items-end gap-1 self-start text-right">
                      <span className="text-3xl font-bold text-primary leading-tight">
                        {formattedPrice}
                      </span>
                      <span className="text-xs uppercase tracking-wide text-muted-foreground">
                        Çmimi paraprak
                      </span>
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  {formattedPrice && (
                    <div className="text-2xl font-semibold text-primary lg:hidden">
                      {formattedPrice}
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-3 text-sm text-muted-foreground">
                    {summaryMileage && (
                      <div>
                        <span className="block font-medium text-foreground">
                          Kilometrazhi
                        </span>
                        <span>{summaryMileage}</span>
                      </div>
                    )}
                    {summaryFuel && (
                      <div>
                        <span className="block font-medium text-foreground">
                          Karburanti
                        </span>
                        <span>{summaryFuel}</span>
                      </div>
                    )}
                    {summaryTransmission && (
                      <div>
                        <span className="block font-medium text-foreground">
                          Transmisioni
                        </span>
                        <span>{summaryTransmission}</span>
                      </div>
                    )}
                    {summaryColor && (
                      <div>
                        <span className="block font-medium text-foreground">
                          Ngjyra
                        </span>
                        <span>{summaryColor}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="rounded-lg border border-border bg-card p-4 text-sm leading-relaxed text-muted-foreground">
                  Po sjellim informacionin e detajuar nga partnerët tanë.
                  Kjo zakonisht merr më pak se një sekondë.
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return <CarDetailsSkeleton />;
  }
  if (error || !car) {
    return (
      <div className="min-h-screen bg-background animate-fade-in">
        <div className="container-responsive py-8">
          <Button
            variant="outline"
            onClick={() => navigate("/")}
            className="mb-6 hover:scale-105 transition-transform"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Kryefaqja
          </Button>
          <div className="text-center py-12">
            <AlertTriangle className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-foreground mb-2">
              Makina Nuk u Gjet
            </h1>
            <p className="text-muted-foreground">
              Makina që po kërkoni nuk mund të gjindet në bazën tonë të të
              dhënave.
            </p>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background animate-fade-in pb-24 md:pb-0 anti-flicker">
      <div className="container-responsive py-6 max-w-[1600px]">
        {/* Header with Actions - Modern Layout with animations */}
        <div className="flex flex-col gap-3 mb-6">
          {/* Navigation and Action Buttons with hover effects */}
          <div
            className="flex flex-wrap items-center gap-2"
            style={{
              animation: "fadeIn 0.3s ease-out forwards",
              animationDelay: "0.1s",
              opacity: 0,
            }}
          >
            <Button
              variant="outline"
              onClick={() => {
                if (pageState && pageState.url) {
                  navigate(pageState.url);
                } else {
                  goBack();
                }
              }}
              className="flex-1 sm:flex-none hover-scale shadow-lg hover:shadow-xl transition-all duration-300 h-9 px-4 group"
            >
              <ArrowLeft className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform duration-300" />
              <span className="hidden sm:inline font-medium">
                Kthehu te Makinat
              </span>
              <span className="sm:hidden font-medium">Kthehu</span>
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate("/")}
              className="flex-1 sm:flex-none hover-scale shadow-lg hover:shadow-xl transition-all duration-300 h-9 px-4 group"
            >
              <ArrowLeft className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform duration-300" />
              <span className="hidden sm:inline font-medium">Kryefaqja</span>
              <span className="sm:hidden font-medium">Home</span>
            </Button>
            <div className="ml-auto flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleLike}
                className="hover-scale shadow-lg hover:shadow-xl transition-all duration-300 h-9 px-4 group"
              >
                <Heart
                  className={`h-4 w-4 mr-2 transition-all duration-300 ${isLiked ? "fill-red-500 text-red-500 scale-110" : "group-hover:scale-110"}`}
                />
                <span className="hidden sm:inline font-medium">Pëlqej</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleShare}
                className="hover-scale shadow-lg hover:shadow-xl transition-all duration-300 h-9 px-4 group"
              >
                <Share2 className="h-4 w-4 mr-2 group-hover:rotate-12 transition-transform duration-300" />
                <span className="hidden sm:inline font-medium">Ndaj</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Main Content - Modern Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] xl:grid-cols-[1fr_420px] gap-6 lg:gap-8">
          {/* Left Column - Images and Gallery */}
          <div
            className="space-y-6 animate-fade-in-up stagger-1"
          >
            {/* Main Image with modern styling - Compact mobile design */}
            <div className="hidden lg:flex lg:gap-4">
              {/* Main Image Card */}
              <Card className="border-0 shadow-2xl overflow-hidden rounded-xl md:rounded-2xl bg-gradient-to-br from-card to-card/80 backdrop-blur-sm flex-1 min-w-0 prevent-cls transform-none transition-none">
                <CardContent className="p-0">
                  <div
                    ref={imageContainerRef}
                    className="relative w-full aspect-[4/3] bg-gradient-to-br from-muted/50 via-muted/30 to-background/50 overflow-hidden group lg:cursor-default touch-pan-y select-none car-image-container"
                    onClick={handleImageZoomOpen}
                    role={allowImageZoom ? "button" : undefined}
                    tabIndex={allowImageZoom ? 0 : -1}
                    onKeyDown={(event) => {
                      if (!allowImageZoom) {
                        return;
                      }
                      if (event.key === "Enter" || event.key === " ") {
                        handleImageZoomOpen(event);
                      }
                    }}
                    aria-label="Hap imazhin e makinës në modal me zoom"
                    data-swipe-direction={imageSwipeDirection ?? undefined}
                  >
                    {/* Main Image with optimized loading */}
                    {images.length > 0 ? (
                      <OptimizedCarImage
                        src={images[selectedImageIndex]}
                        alt={`${car.year} ${car.make} ${car.model} - Image ${selectedImageIndex + 1}`}
                        className={`${swipeWrapperClass} w-full h-full image-transition gpu-accelerate duration-500`}
                        style={imageSwipeStyle}
                        aspectRatio="aspect-[4/3]"
                        priority={selectedImageIndex === 0}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Car className="h-16 w-16 text-muted-foreground" />
                      </div>
                    )}

                    {/* Navigation arrows - Improved positioning and visibility */}
                    {images.length > 1 && (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all duration-300 bg-black/70 hover:bg-black/90 backdrop-blur-md text-white rounded-full w-10 h-10 sm:w-12 sm:h-12 p-0 hidden sm:flex z-20 hover:scale-110"
                          onClick={(e) => {
                            e.stopPropagation();
                            impact("light");
                            goToPrevious("manual");
                          }}
                          aria-label="Previous image"
                        >
                          <ChevronLeft className="h-5 w-5 sm:h-6 sm:w-6" />
                        </Button>

                        <Button
                          variant="ghost"
                          size="sm"
                          className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all duration-300 bg-black/70 hover:bg-black/90 backdrop-blur-md text-white rounded-full w-10 h-10 sm:w-12 sm:h-12 p-0 hidden sm:flex z-20 hover:scale-110"
                          onClick={(e) => {
                            e.stopPropagation();
                            impact("light");
                            goToNext("manual");
                          }}
                          aria-label="Next image"
                        >
                          <ChevronRight className="h-5 w-5 sm:h-6 sm:w-6" />
                        </Button>
                      </>
                    )}

                    {/* Lot number badge - Improved positioning */}
                    {car.lot && (
                      <Badge className="absolute top-3 left-3 bg-primary/95 backdrop-blur-md text-primary-foreground px-3 py-1.5 text-sm font-semibold shadow-xl rounded-lg">
                        {car.lot}
                      </Badge>
                    )}
                  </div>
                  {typeof car?.price === "number" && (
                    <div className="flex lg:hidden w-full items-center justify-between px-5 py-3 border-t border-border/60 bg-card/80">
                      <span className="text-xl font-bold text-foreground">
                        €{car.price.toLocaleString()}
                      </span>
                      <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                        Deri në Prishtinë pa doganë
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Desktop Thumbnail Gallery - 6 thumbnails on right side */}
              {images.length > 1 && (
                <div
                  className="hidden lg:flex lg:flex-col lg:gap-2 animate-fade-in"
                  style={{ animationDelay: "200ms" }}
                >
                  {images.slice(1, 7).map((image, index) => (
                    <button
                      key={index + 1}
                      onClick={() => {
                        impact("light");
                        goToIndex(index + 1, "manual");
                      }}
                      className={`flex-shrink-0 w-16 h-14 xl:w-20 xl:h-16 rounded-lg overflow-hidden border-2 transition-all duration-200 hover:scale-105 ${selectedImageIndex === index + 1
                        ? "border-primary shadow-lg scale-105"
                        : "border-border hover:border-primary/50"
                        }`}
                      aria-label={`View image ${index + 2}`}
                    >
                      <img
                        src={image}
                        alt={`${car.year} ${car.make} ${car.model} - Thumbnail ${index + 2}`}
                        className="w-full h-full object-cover"
                        loading="lazy"
                        onError={(e) => {
                          e.currentTarget.src = "/placeholder.svg";
                        }}
                      />
                    </button>
                  ))}
                  {images.length > 7 && (
                    <button
                      onClick={handleGalleryButtonClick}
                      className="flex-shrink-0 w-16 h-14 xl:w-20 xl:h-16 rounded-lg border-2 border-dashed border-primary/50 hover:border-primary hover:bg-primary/5 flex flex-col items-center justify-center transition-all duration-200"
                      aria-label="View all images"
                    >
                      <Camera className="h-4 w-4 xl:h-5 xl:w-5 text-primary mb-1" />
                      <span className="text-xs xl:text-sm text-primary font-medium">
                        +{images.length - 7}
                      </span>
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Mobile Main Image - Full width for mobile */}
            <Card className="lg:hidden border-0 shadow-2xl overflow-hidden rounded-xl md:rounded-2xl hover:shadow-3xl transition-all duration-500 bg-gradient-to-br from-card to-card/80 backdrop-blur-sm">
              <CardContent className="p-0">
                <div
                  ref={imageContainerRef}
                  className="relative w-full aspect-[4/3] bg-gradient-to-br from-muted/50 via-muted/30 to-background/50 overflow-hidden group cursor-pointer touch-pan-y select-none"
                  onClick={handleImageZoomOpen}
                  role={allowImageZoom ? "button" : undefined}
                  tabIndex={allowImageZoom ? 0 : -1}
                  onKeyDown={(event) => {
                    if (!allowImageZoom) {
                      return;
                    }
                    if (event.key === "Enter" || event.key === " ") {
                      handleImageZoomOpen(event);
                    }
                  }}
                  aria-label="Hap imazhin e makinës në modal me zoom"
                  data-swipe-direction={imageSwipeDirection ?? undefined}
                >
                  {/* Main Image with improved loading states */}
                  {images.length > 0 ? (
                    <img
                      src={images[selectedImageIndex]}
                      alt={`${car.year} ${car.make} ${car.model} - Image ${selectedImageIndex + 1}`}
                      className={`${swipeWrapperClass} w-full h-full object-cover transition-all duration-500`}
                      style={imageSwipeStyle}
                      onError={(e) => {
                        e.currentTarget.src = "/placeholder.svg";
                        setIsPlaceholderImage(true);
                      }}
                      onLoad={(e) => {
                        if (!e.currentTarget.src.includes("/placeholder.svg")) {
                          setIsPlaceholderImage(false);
                        }
                      }}
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Car className="h-16 w-16 text-muted-foreground" />
                    </div>
                  )}

                  {/* Navigation arrows - Improved positioning and visibility */}
                  {images.length > 1 && (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all duration-300 bg-black/70 hover:bg-black/90 backdrop-blur-md text-white rounded-full w-10 h-10 sm:w-12 sm:h-12 p-0 hidden sm:flex z-20 hover:scale-110"
                        onClick={(e) => {
                          e.stopPropagation();
                          impact("light");
                          goToPrevious("manual");
                        }}
                        aria-label="Previous image"
                      >
                        <ChevronLeft className="h-5 w-5 sm:h-6 sm:w-6" />
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
                        className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all duration-300 bg-black/70 hover:bg-black/90 backdrop-blur-md text-white rounded-full w-10 h-10 sm:w-12 sm:h-12 p-0 hidden sm:flex z-20 hover:scale-110"
                        onClick={(e) => {
                          e.stopPropagation();
                          impact("light");
                          goToNext("manual");
                        }}
                        aria-label="Next image"
                      >
                        <ChevronRight className="h-5 w-5 sm:h-6 sm:w-6" />
                      </Button>
                    </>
                  )}

                  {/* Image counter and gallery button - Improved mobile design */}
                  {images.length > 1 && (
                    <div className="absolute bottom-3 right-3 flex items-center gap-2">
                      {/* Mobile gallery button */}
                      <button
                        onClick={handleGalleryButtonClick}
                        className="gallery-button md:hidden bg-black/80 hover:bg-black/90 text-white px-3 py-2 rounded-lg text-xs font-medium backdrop-blur-sm flex items-center gap-2"
                        aria-label={`View all ${images.length} images`}
                      >
                        <Camera className="h-3 w-3" />
                        {selectedImageIndex + 1}/{images.length}
                      </button>

                      {/* Desktop gallery button */}
                      <button
                        onClick={handleGalleryButtonClick}
                        className="gallery-button hidden md:flex items-center gap-2 bg-black/60 hover:bg-black/80 text-white px-4 py-2 rounded-lg text-sm font-medium backdrop-blur-sm"
                        aria-label={`View all ${images.length} images`}
                      >
                        <Camera className="h-4 w-4" />
                        View Gallery ({images.length})
                      </button>
                    </div>
                  )}

                  {/* Lot number badge - Improved positioning */}
                  {car.lot && (
                    <Badge className="absolute top-3 left-3 bg-primary/95 backdrop-blur-md text-primary-foreground px-3 py-1.5 text-sm font-semibold shadow-xl rounded-lg">
                      {car.lot}
                    </Badge>
                  )}

                  {/* Zoom icon - Improved positioning and visibility */}
                  {allowImageZoom && (
                    <button
                      type="button"
                      onClick={handleImageZoomOpen}
                      className="absolute top-3 right-3 flex rounded-full bg-black/60 p-2 text-white backdrop-blur-md transition-transform duration-300 hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                      aria-label="Zmadho imazhin"
                    >
                      <Expand className="h-4 w-4" />
                    </button>
                  )}

                  {/* Loading indicator */}
                  {isPlaceholderImage && (
                    <div className="absolute inset-0 bg-muted/50 flex items-center justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {displayTitle && (
              <div className="animate-fade-in-up stagger-1">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 sm:gap-3">
                      {brandLogo ? (
                        <div
                          className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-md border border-border/50 bg-white shadow-sm dark:border-white/10 dark:bg-white/90 sm:h-11 sm:w-11"
                          aria-hidden={!resolvedBrandName}
                        >
                          <picture>
                            {brandLogoVariants?.dark && (
                              <source
                                srcSet={brandLogoVariants.dark}
                                media="(prefers-color-scheme: dark)"
                              />
                            )}
                            <img
                              src={brandLogoVariants?.light ?? brandLogo}
                              alt={`${resolvedBrandName} logo`}
                              className="h-full w-full object-contain"
                              loading="lazy"
                              decoding="async"
                            />
                          </picture>
                        </div>
                      ) : resolvedBrandName ? (
                        <span className="text-sm font-semibold uppercase tracking-wider text-muted-foreground/80">
                          {resolvedBrandName}
                        </span>
                      ) : null}
                      <p className="text-xl sm:text-3xl font-semibold text-foreground leading-tight">
                        {displayTitle}
                      </p>
                    </div>

                    {resolvedSecondaryTitle && resolvedSecondaryTitle !== displayTitle && (
                      <p className="text-sm sm:text-base text-muted-foreground/90 leading-snug">
                        {resolvedSecondaryTitle}
                      </p>
                    )}

                    {/* Subtitle with year and key details */}
                    <div className="flex flex-wrap items-center gap-1 text-sm text-muted-foreground leading-tight">
                      {car.year && <span className="font-medium">{car.year}</span>}
                      {car.year && (car.mileage || resolvedFuel || car.transmission) && <span>•</span>}
                      {car.mileage && <span>{formatMileage(car.mileage)}</span>}
                      {car.mileage && (resolvedFuel || car.transmission) && <span>•</span>}
                      {resolvedFuel && <span>{localizeFuel(resolvedFuel)}</span>}
                      {resolvedFuel && car.transmission && <span>•</span>}
                      {car.transmission && <span>{car.transmission}</span>}
                      {showSpecsDialogTrigger && (
                        <>
                          {(car.year || car.mileage || resolvedFuel || car.transmission) && <span>•</span>}
                          <button
                            type="button"
                            onClick={() => setIsSpecsDialogOpen(true)}
                            className="text-primary hover:underline font-medium cursor-pointer"
                          >
                            Detajet
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {typeof car.price === "number" && (
                    <div className="hidden lg:flex min-w-[200px] flex-col items-end gap-1 self-start text-right">
                      <span className="text-3xl font-bold text-primary leading-tight">
                        €{car.price.toLocaleString()}
                      </span>
                      <span className="text-xs uppercase tracking-wide text-muted-foreground">
                        Deri në Prishtinë pa doganë
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* History Section */}
            <Card
              id="history"
              ref={historySectionRef}
              className="border-0 shadow-xl rounded-xl overflow-hidden bg-card animate-fade-in-up stagger-3"
            >
              <CardContent className="p-3 md:p-5 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2.5">
                  <div className="flex items-center gap-2.5">
                    <span className="p-2 rounded-lg bg-primary/10">
                      <Shield className="h-5 w-5 text-primary" />
                    </span>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-lg md:text-xl font-bold text-foreground">
                          Historia
                        </span>
                        <Badge
                          variant={hasMainFrameworkAccident ? "destructive" : "secondary"}
                          className="text-[10px] font-semibold uppercase"
                        >
                          {accidentCount === 0 ? "Pa aksidente" : `${accidentCount}`}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Aksidentet & Historiku i Pronësisë
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleOpenHistoryReport}
                    className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-3 py-1.5 text-sm font-semibold text-primary transition-colors hover:bg-primary/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  >
                    Hap raportin e veturës
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </div>
                {hasHistoryData ? (
                  <div className="space-y-2.5 text-sm text-muted-foreground">
                    <div className="space-y-1">
                      <div>Shkëmbime: {replacementText}</div>
                      <div>Punime llamarine: {sheetMetalText}</div>
                      <div>Korrozioni: {corrosionText}</div>
                    </div>
                    <div className="space-y-1">
                      <div>Dëmet e veturës: {myCarDamageText}</div>
                      <div>Dëmet ndaj veturave të tjera: {otherCarDamageText}</div>
                      <div>Historia e veturës: {ownerHistoryText}</div>
                      <div>Shënime të veçanta: {specialNoteText}</div>
                    </div>
                  </div>
                ) : null}
              </CardContent>
            </Card>


            {/* Enhanced Detailed Information Section */}
            <Card className="glass-panel border-0 shadow-2xl rounded-xl mobile-detailed-info-card">
              <CardContent className="p-3 sm:p-4 lg:p-5">
                <div className="flex flex-col gap-2 sm:gap-2.5 mb-2 sm:mb-3"></div>

                {showDetailedInfo && (
                  <div className="space-y-3 sm:space-y-4 animate-in slide-in-from-top-2 duration-300">
                    {/* Insurance & Safety Report - Mobile Optimized */}
                    {(car.insurance_v2 || car.inspect || car.insurance) && (
                      <div
                        ref={historySectionRef}
                        className="space-y-2 sm:space-y-3 p-3 sm:p-3 bg-muted/50 rounded-lg mobile-info-section"
                      >
                        <h4 className="text-base sm:text-lg font-semibold text-foreground flex items-center gap-2">
                          <Shield className="h-4 w-4 sm:h-5 sm:w-5" />
                          Raporti i Sigurisë dhe Sigurimit
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                          {car.insurance_v2?.accidentCnt !== undefined && (
                            <div className="flex items-center justify-between p-2.5 sm:p-3 bg-card border border-border rounded-lg mobile-detail-item">
                              <span className="text-xs sm:text-sm font-medium">
                                Historia e Aksidenteve:
                              </span>
                              <Badge
                                variant={
                                  car.insurance_v2.accidentCnt === 0
                                    ? "secondary"
                                    : "destructive"
                                }
                                className="text-xs"
                              >
                                {car.insurance_v2.accidentCnt === 0
                                  ? "E Pastër"
                                  : `${car.insurance_v2.accidentCnt} aksidente`}
                              </Badge>
                            </div>
                          )}
                          {car.insurance_v2?.ownerChangeCnt !== undefined && (
                            <div className="flex items-center justify-between p-3 bg-card border border-border rounded-lg">
                              <span className="text-sm">
                                Ndryshime Pronësie:
                              </span>
                              <span className="font-medium">
                                {car.insurance_v2.ownerChangeCnt}
                              </span>
                            </div>
                          )}
                          {car.insurance_v2?.totalLossCnt !== undefined &&
                            car.insurance_v2.totalLossCnt > 0 && (
                              <div className="flex items-center justify-between p-3 bg-card border border-border rounded-lg">
                                <span className="text-sm">Humbje Totale:</span>
                                <Badge variant="destructive">
                                  {car.insurance_v2.totalLossCnt}
                                </Badge>
                              </div>
                            )}
                          {car.insurance_v2?.floodTotalLossCnt !== undefined &&
                            car.insurance_v2.floodTotalLossCnt > 0 && (
                              <div className="flex items-center justify-between p-3 bg-card border border-border rounded-lg">
                                <span className="text-sm">demtime:</span>
                                <Badge variant="destructive">
                                  {car.insurance_v2.floodTotalLossCnt}
                                </Badge>
                              </div>
                            )}
                        </div>
                        {usageHighlights.length > 0 && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                            {usageHighlights.map((item) => {
                              const valueClass =
                                item.value === "Po"
                                  ? "text-destructive"
                                  : item.value === "Jo"
                                    ? "text-emerald-600"
                                    : "text-muted-foreground";
                              return (
                                <div
                                  key={item.label}
                                  className="flex flex-col gap-1.5 rounded-lg border border-border/60 bg-card/80 p-3 sm:p-3.5"
                                >
                                  <span className="text-xs uppercase tracking-wide text-muted-foreground font-medium">
                                    {item.label}
                                  </span>
                                  <span
                                    className={`text-base sm:text-lg font-semibold ${valueClass}`}
                                  >
                                    {item.value}
                                  </span>
                                  {item.details.length > 0 && (
                                    <span className="text-xs text-muted-foreground leading-relaxed">
                                      {item.details.join(" • ")}
                                    </span>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Equipment & Options */}

                    {car.details?.options && hasAnySanitizedOptions && (
                      <EquipmentOptionsSection
                        options={sanitizedOptions}
                        features={car.features}
                        safetyFeatures={car.safety_features}
                        comfortFeatures={car.comfort_features}
                      />
                    )}

                    {/* Fallback if no options found */}
                    {(!car.details?.options || !hasAnySanitizedOptions) && (
                      <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
                        <h4 className="text-lg font-semibold text-foreground flex items-center gap-2">
                          <Settings className="h-5 w-5" />
                          Pajisjet dhe Opsionet
                        </h4>
                        <p className="text-muted-foreground">
                          Nuk ka informacion për pajisjet dhe opsionet e kësaj
                          makine.
                        </p>
                      </div>
                    )}

                    {/* Dealer Information - Admin Only */}
                    {!adminLoading && isAdmin && (
                      <Suspense
                        fallback={
                          <div className="mt-6">
                            <Card className="glass-card border border-dashed border-border/60 bg-card/40">
                              <CardContent className="flex flex-col gap-3 p-4">
                                <div className="h-4 w-40 animate-pulse rounded bg-muted/50" />
                                <div className="h-3 w-full animate-pulse rounded bg-muted/40" />
                                <div className="h-3 w-3/4 animate-pulse rounded bg-muted/40" />
                              </CardContent>
                            </Card>
                          </div>
                        }
                      >
                        <div className="mt-6">
                          <DealerInfoSection
                            car={car}
                            liveContact={liveDealerContact}
                            isLiveLoading={liveDealerLoading}
                            error={liveDealerError}
                          />
                        </div>
                      </Suspense>
                    )}

                    {/* Comprehensive Inspection Report */}
                    {(car.inspect?.items || car.details?.inspect?.items) && (
                      <div className="mt-6">
                        <Suspense fallback={
                          <div className="h-96 bg-gradient-to-br from-muted/40 to-muted/20 animate-pulse rounded-xl border border-border/40" />
                        }>
                          <CarInspectionDiagram
                            inspectionData={car.inspect?.items || car.details?.inspect?.items || []}
                            className="mt-4"
                          />
                        </Suspense>
                      </div>
                    )}

                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Enhanced Contact Card */}
          <div className="space-y-4">
            {/* Enhanced Contact & Inspection Card */}
            <Card className="glass-panel border-0 shadow-2xl lg:sticky top-20 lg:top-4 right-4 lg:right-auto rounded-xl z-50 lg:z-auto w-full lg:w-auto lg:max-w-sm">
              <CardContent className="flex flex-col gap-4 p-4">
                <div className="space-y-1 text-left sm:text-center">
                  {resolvedMainTitle && (
                    <h2 className="text-base font-semibold leading-tight text-foreground">
                      {resolvedMainTitle}
                    </h2>
                  )}
                </div>
                <Separator />

                <h3 className="text-lg font-bold text-center text-foreground">
                  Kontakt & Inspektim
                </h3>

                {/* Enhanced Contact Buttons */}
                <div className="mb-4 space-y-3">
                  <Button
                    onClick={handleContactWhatsApp}
                    className="w-full h-10 text-sm font-medium shadow-md hover:shadow-lg transition-shadow bg-green-600 hover:bg-green-700 text-white"
                  >
                    <MessageCircle className="h-4 w-4 mr-2" />
                    WhatsApp
                  </Button>

                  <Button
                    variant="outline"
                    className="w-full h-10 text-sm font-medium border hover:bg-primary hover:text-primary-foreground transition-colors"
                    onClick={handlePhoneCall}
                  >
                    <Phone className="h-4 w-4 mr-2" />
                    +383 48 181 116
                  </Button>

                  {/* Instagram */}
                  <Button
                    variant="outline"
                    className="w-full h-10 text-sm font-medium border hover:bg-pink-600 hover:text-white transition-colors"
                    onClick={() =>
                      window.open("https://www.instagram.com/korauto.ks/", "_blank")
                    }
                  >
                    <Instagram className="h-4 w-4 mr-2" />
                    Instagram
                  </Button>

                  {/* Facebook */}
                  <Button
                    variant="outline"
                    className="w-full h-10 text-sm font-medium border hover:bg-blue-600 hover:text-white transition-colors"
                    onClick={() =>
                      window.open(
                        "https://www.facebook.com/share/19tUXpz5dG/?mibextid=wwXIfr",
                        "_blank",
                      )
                    }
                  >
                    <Facebook className="h-4 w-4 mr-2" />
                    Facebook
                  </Button>

                  <Button
                    variant="outline"
                    className="w-full h-10 text-sm font-medium border hover:bg-primary hover:text-primary-foreground transition-colors"
                    onClick={() => window.open("mailto:info@korauto.com", "_self")}
                  >
                    <Mail className="h-4 w-4 mr-2" />
                    info@korauto.com
                  </Button>
                </div>

                {/* Enhanced Additional Buttons */}
                <div className="border-t border-border pt-4 space-y-3">
                  <Button
                    variant="outline"
                    className="w-full h-10 text-sm font-medium border hover:bg-primary hover:text-primary-foreground transition-colors"
                    onClick={() => navigate("/garancioni")}
                  >
                    <Shield className="h-4 w-4 mr-2" />
                    Mëso më shumë për garancionin
                  </Button>
                </div>

                {/* Enhanced Location */}
                <div className="mt-4 pt-4 border-t border-border">
                  <div className="flex items-start gap-3 text-muted-foreground">
                    <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <a
                      href="https://maps.google.com/?q=KORAUTO,Rr.+Ilaz+Kodra+70,Prishtinë,Kosovo"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm hover:text-primary transition-colors cursor-pointer leading-relaxed"
                    >
                      Rr. Ilaz Kodra 70, Prishtinë, Kosovo
                    </a>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Desktop map - small widget under Kontakt & Inspektim */}
            <Card className="hidden lg:block glass-panel border-0 shadow-2xl rounded-xl">
              <CardContent className="p-0">
                <div
                  ref={registerMapTarget}
                  className="h-56 w-full overflow-hidden rounded-xl"
                >
                  {shouldRenderMap ? (
                    <iframe
                      title="Korauto Location"
                      src="https://www.google.com/maps?q=Korauto,Rr.+Ilaz+Kodra+70,+Prishtin%C3%AB,+Kosovo&z=16&output=embed"
                      width="100%"
                      height="100%"
                      loading="lazy"
                      style={{ border: 0 }}
                      referrerPolicy="no-referrer-when-downgrade"
                      allowFullScreen
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center bg-muted/40 text-xs text-muted-foreground">
                      Harta do të shfaqet kur afroheni
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Google Maps - Store Location (mobile only) */}
        <div className="container-responsive mt-6 lg:hidden">
          <Card className="glass-panel border-0 shadow-2xl rounded-xl">
            <CardContent className="p-0">
              <div
                ref={registerMapTarget}
                className="h-56 w-full overflow-hidden rounded-xl"
              >
                {shouldRenderMap ? (
                  <iframe
                    title="Korauto Location"
                    src="https://www.google.com/maps?q=Korauto,Rr.+Ilaz+Kodra+70,+Prishtin%C3%AB,+Kosovo&z=16&output=embed"
                    width="100%"
                    height="100%"
                    loading="lazy"
                    style={{ border: 0 }}
                    referrerPolicy="no-referrer-when-downgrade"
                    allowFullScreen
                  />
                ) : (
                  <div className="flex h-full items-center justify-center bg-muted/40 text-xs text-muted-foreground">
                    Harta do të shfaqet kur afroheni
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {images.length > 0 && (
          <Suspense fallback={null}>
            <ImageZoom
              src={images[selectedImageIndex] ?? car?.image ?? ""}
              alt={`${car.year} ${car.make} ${car.model} - Image ${selectedImageIndex + 1}`}
              isOpen={isImageZoomOpen}
              onClose={handleImageZoomClose}
              images={images}
              currentIndex={selectedImageIndex}
              onImageChange={(index) => goToIndex(index, "manual")}
            />
          </Suspense>
        )}
      </div>
      {car &&
        isPortalReady &&
        createPortal(
          <div className="md:hidden fixed inset-x-0 bottom-0 z-[60] bg-background/95 backdrop-blur border-t border-border shadow-[0_-6px_12px_rgba(0,0,0,0.08)]">
            <div className="mx-auto flex w-full max-w-[1600px] items-center gap-3 px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
              <div className="flex-1 min-w-0">
                <button
                  onClick={() => setIsServicesDialogOpen(true)}
                  className="text-left hover:opacity-80 transition-opacity"
                >
                  <div className="text-2xl font-bold text-foreground leading-tight">
                    €{car.price.toLocaleString()}
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    Deri ne Prishtine pa dogan
                  </div>
                </button>
              </div>
              <Button
                size="default"
                aria-label="Thirr Korauto"
                className="flex h-9 min-w-[112px] flex-shrink-0 items-center gap-1.5 rounded-xl bg-primary px-3 text-left text-[0.8125rem] font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition-colors hover:bg-primary/90 focus-visible:ring-offset-background dark:shadow-primary/20"
                onClick={handlePhoneCall}
              >
                <Phone className="h-4 w-4" />
                <span className="leading-tight uppercase tracking-wide">CALL</span>
              </Button>
              <Button
                size="default"
                className="h-9 flex-shrink-0 rounded-xl bg-green-600 px-3 text-[0.8125rem] font-semibold text-white shadow-lg shadow-green-600/30 hover:bg-green-700"
                onClick={handleContactWhatsApp}
              >
                <MessageCircle className="mr-1.5 h-4 w-4" />
                WhatsApp
              </Button>
            </div>
          </div>,
          document.body,
        )}

      {/* Specs Dialog */}
      <Dialog open={isSpecsDialogOpen} onOpenChange={setIsSpecsDialogOpen}>
        <DialogContent className="max-w-2xl sm:max-w-3xl max-h-[80vh] overflow-y-auto p-4 sm:p-5">
          <DialogHeader className="space-y-1">
            <DialogTitle className="text-lg sm:text-xl font-semibold">Specifikimet Teknike</DialogTitle>
            <DialogDescription className="text-xs sm:text-sm text-muted-foreground">
              Të dhënat kryesore teknike për {resolvedMainTitle}
            </DialogDescription>
          </DialogHeader>
          <div className="mt-3 space-y-3">
            {primarySpecs.length > 0 && (
              <div className="space-y-1.5">
                <h4 className="font-semibold text-sm sm:text-base flex items-center gap-2">
                  <Info className="h-5 w-5 text-primary" />
                  Specifikime kryesore
                </h4>
                <div className="grid grid-cols-2 gap-2 sm:gap-3">
                  {primarySpecs.map((item) => (
                    <div
                      key={item.label}
                      className="p-2 sm:p-2.5 bg-muted/60 rounded-lg border border-border/50"
                    >
                      <div className="text-[11px] sm:text-xs text-muted-foreground leading-tight">
                        {item.label}
                      </div>
                      <div className="text-sm sm:text-base font-semibold text-foreground">
                        {item.value}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Engine Specs */}
            {(car.details?.engine_type || car.details?.cylinders || car.details?.displacement) && (
              <div className="space-y-1.5">
                <h4 className="font-semibold text-sm sm:text-base flex items-center gap-2">
                  <Settings className="h-5 w-5 text-primary" />
                  Motori
                </h4>
                <div className="grid grid-cols-2 gap-2 sm:gap-3">
                  {car.details?.engine_type && (
                    <div className="p-2 sm:p-2.5 bg-muted/60 rounded-lg border border-border/50">
                      <div className="text-[11px] sm:text-xs text-muted-foreground leading-tight">
                        Tipi i Motorit
                      </div>
                      <div className="text-sm sm:text-base font-semibold text-foreground">
                        {car.details.engine_type}
                      </div>
                    </div>
                  )}
                  {car.details?.cylinders && (
                    <div className="p-2 sm:p-2.5 bg-muted/60 rounded-lg border border-border/50">
                      <div className="text-[11px] sm:text-xs text-muted-foreground leading-tight">
                        Cilindrat
                      </div>
                      <div className="text-sm sm:text-base font-semibold text-foreground">
                        {car.details.cylinders}
                      </div>
                    </div>
                  )}
                  {car.details?.displacement && (
                    <div className="p-2 sm:p-2.5 bg-muted/60 rounded-lg border border-border/50">
                      <div className="text-[11px] sm:text-xs text-muted-foreground leading-tight">
                        Kapaciteti
                      </div>
                      <div className="text-sm sm:text-base font-semibold text-foreground">
                        {car.details.displacement}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Services Dialog */}
      <Dialog open={isServicesDialogOpen} onOpenChange={setIsServicesDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">Shërbimet e Përfshira</DialogTitle>
            <DialogDescription>
              Çmimi përfshin të gjitha shërbimet e mëposhtme
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 space-y-3">
            <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
              <span className="text-sm">Inspektimi i veturës</span>
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
            <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
              <span className="text-sm">Blerja e veturës në Kore</span>
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
            <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
              <span className="text-sm">Transporti deri te porti në Kore</span>
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
            <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
              <span className="text-sm">Ç'regjistrimi dhe eksporti në Kore</span>
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
            <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
              <span className="text-sm">Taksat e portit në Kore</span>
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
            <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
              <span className="text-sm">Transporti detar nga Korea në Durrës</span>
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
            <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
              <span className="text-sm">Taksat për lirimin e veturës nga porti në Durrës</span>
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
            <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
              <span className="text-sm">Pagesa e shpedicionit në Durrës</span>
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
            <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
              <span className="text-sm">Transporti tokësor Durrës - Prishtinë</span>
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
            <Separator />
            <div className="p-4 bg-primary/10 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="font-semibold">Çmimi Total:</span>
                <span className="text-2xl font-bold text-primary">€{car.price.toLocaleString()}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                *Deri në Prishtinë pa doganë
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
});

export default CarDetails;
