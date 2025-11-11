import {
  useEffect,
  useState,
  useCallback,
  memo,
  useMemo,
  lazy,
  Suspense,
  useRef,
} from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useNavigation } from "@/contexts/NavigationContext";
import { trackPageView, trackCarView, trackFavorite } from "@/utils/analytics";
import { calculateFinalPriceEUR } from "@/utils/carPricing";
import { resolveFuelFromSources, localizeFuel } from "@/utils/fuel";
import { useOptimizedCarDetails } from "@/hooks/useOptimizedCarDetails";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
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
  Calendar,
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
  ChevronUp,
  DollarSign,
  Cog,
  Lightbulb,
  Camera,
  Wind,
  Radar,
  Tag,
  Armchair,
  DoorClosed,
  Cylinder,
  CircleDot,
  PaintBucket,
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
import { supabase } from "@/integrations/supabase/client";
import { useCurrencyAPI } from "@/hooks/useCurrencyAPI";
import { useKoreaOptions } from "@/hooks/useKoreaOptions";
import CarInspectionDiagram from "@/components/CarInspectionDiagram";
import { useImagePreload } from "@/hooks/useImagePreload";
import { useImageSwipe } from "@/hooks/useImageSwipe";
import { fallbackCars } from "@/data/fallbackData";
import { formatMileage } from "@/utils/mileageFormatter";
import { transformCachedCarRecord } from "@/services/carCache";
import { openCarReportInNewTab } from "@/utils/navigation";
import { createPortal } from "react-dom";
import {
  buildUsageHighlights,
  buildUsageHistoryList,
  type UsageHighlight,
  type UsageHistoryEntry,
} from "@/utils/encarUsage";
import { getFallbackOptionName } from "@/data/koreaOptionFallbacks";

const ImageZoom = lazy(() =>
  import("@/components/ImageZoom").then((module) => ({
    default: module.ImageZoom,
  })),
);

// Fallback mapping moved to data/koreaOptionFallbacks.ts

const normalizeText = (value: string) =>
  value.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

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
        {!showOptions && (
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
                    className={`flex flex-col items-center gap-1 p-2 rounded-md transition-colors ${
                      feature.hasFeature
                        ? "bg-primary/10 border border-primary/30"
                        : "bg-gray-100 border border-gray-200"
                    }`}
                  >
                    <IconComponent
                      className={`h-4 w-4 flex-shrink-0 ${
                        feature.hasFeature ? "text-primary" : "text-gray-400"
                      }`}
                    />
                    <span
                      className={`text-[10px] leading-tight text-center line-clamp-2 ${
                        feature.hasFeature ? "text-foreground" : "text-gray-400"
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
  const translateTransmission = (transmission: string): string => {
    const transmissionMap: Record<string, string> = {
      automatic: "automatik",
      manual: "manual",
      cvt: "CVT",
      semiautomatic: "gjysëm automatik",
      "automated manual": "manual i automatizuar",
    };
    return transmissionMap[transmission?.toLowerCase()] || transmission;
  };
  const translateColor = (color: string): string => {
    const colorMap: Record<string, string> = {
      black: "zi",
      white: "bardhë",
      grey: "gri",
      gray: "gri",
      red: "kuq",
      blue: "blu",
      silver: "argjend",
      green: "jeshil",
      yellow: "verdh",
      brown: "kafe",
      orange: "portokalli",
      purple: "vjollcë",
      pink: "rozë",
      gold: "ar",
      beige: "bezhë",
      "dark blue": "blu i errët",
      "light blue": "blu i çelët",
      "dark green": "jeshil i errët",
      "light green": "jeshil i çelët",
    };
    return colorMap[color?.toLowerCase()] || color;
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
  const [car, setCar] = useState<CarDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isImageZoomOpen, setIsImageZoomOpen] = useState(false);
  const [shouldRenderMap, setShouldRenderMap] = useState(false);
  const mapTargets = useRef<HTMLDivElement[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showDetailedInfo, setShowDetailedInfo] = useState(false);
  const [hasAutoExpanded, setHasAutoExpanded] = useState(false);
  const [showEngineSection, setShowEngineSection] = useState(false);
  const [isPlaceholderImage, setIsPlaceholderImage] = useState(false);
  const [isPortalReady, setIsPortalReady] = useState(false);
  useEffect(() => {
    setIsPortalReady(true);
    return () => setIsPortalReady(false);
  }, []);

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

  const accidentSeverity = useMemo<"none" | "minor" | "severe">(() => {
    if (accidentCount === 0) {
      return "none";
    }
    return hasMainFrameworkAccident ? "severe" : "minor";
  }, [accidentCount, hasMainFrameworkAccident]);

  const accidentStyle = useMemo(() => {
    if (accidentSeverity === "severe") {
      return {
        button:
          "border-destructive/40 text-destructive hover:border-destructive hover:shadow-2xl hover:shadow-destructive/20",
        overlay: "from-destructive/0 to-destructive/10",
        badge: "bg-destructive/20 text-destructive ring-2 ring-destructive/20",
        icon: "",
      };
    }

    if (accidentSeverity === "minor") {
      return {
        button:
          "border-border/70 text-foreground hover:border-primary hover:text-primary hover:shadow-xl hover:shadow-primary/10",
        overlay: "from-primary/0 to-primary/5",
        badge: "bg-muted text-foreground ring-1 ring-border/60",
        icon: "",
      };
    }

    return {
      button:
        "border-emerald-500/40 text-emerald-600 hover:border-emerald-500 hover:bg-emerald-500 hover:text-white hover:shadow-2xl hover:shadow-emerald-500/20",
      overlay: "from-emerald-500/0 to-emerald-500/10",
      badge:
        "bg-emerald-500/20 text-emerald-600 ring-2 ring-emerald-500/20 dark:bg-emerald-500/20 dark:text-emerald-400",
      icon: "",
    };
  }, [accidentSeverity]);

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
    (carData: any, lotData: any): CarDetails | null => {
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
        fuel: resolveFuelFromSources(carData, lotData) || undefined,
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
              status: lotData?.odometer?.status ||
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
        features: getCarFeatures(carData, lotData),
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
          inspect: lotData?.inspect ||
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

  const hydrateFromCache = useCallback(async () => {
    if (!lot) {
      return null;
    }

    try {
      const { data, error } = await supabase
        .from("cars_cache")
        .select("*")
        .or(`lot_number.eq.${lot},api_id.eq.${lot}`)
        .maybeSingle();

      if (error) {
        console.warn("Failed to load cached car", error);
        return null;
      }

      if (data) {
        const cachedCar = transformCachedCarRecord(data);
        const lotData = cachedCar?.lots?.[0];
        const details = buildCarDetails(cachedCar, lotData);
        if (details) {
          setCar(details);
          setLoading(false);
          // Store in sessionStorage for page visibility restoration
          try {
            sessionStorage.setItem(`car_${lot}`, JSON.stringify(details));
          } catch (storageError) {
            console.warn("Failed to store in sessionStorage:", storageError);
          }
          return details;
        }
      }
    } catch (cacheError) {
      console.warn("Cache hydration failed", cacheError);
    }

    // Try sessionStorage as backup
    try {
      const sessionData = sessionStorage.getItem(`car_${lot}`);
      if (sessionData) {
        const restoredCar = JSON.parse(sessionData);
        setCar(restoredCar);
        setLoading(false);
        return restoredCar;
      }
    } catch (sessionError) {
      console.warn("Failed to restore from sessionStorage:", sessionError);
    }

    return null;
  }, [buildCarDetails, lot]);

  // Extract features from car data
  const getCarFeatures = (carData: any, lot: any): string[] => {
    const features = [];
    if (carData.transmission?.name) {
      features.push(`Transmisioni: ${carData.transmission.name}`);
    }

    const resolvedFuel = resolveFuelFromSources(carData, lot);
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

  // Check admin status
  useEffect(() => {
    const checkAdminStatus = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (session?.user) {
          const { data: adminCheck } = await supabase.rpc("is_admin");
          setIsAdmin(adminCheck || false);
        }
      } catch (error) {
        console.error("Failed to check admin status:", error);
      }
    };
    checkAdminStatus();
  }, []);
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
        const timeoutId = setTimeout(() => controller.abort(), 10000);

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

        const carData = data.data;
        const lotData = carData?.lots?.[0];
        const details = buildCarDetails(carData, lotData);

        if (!details) {
          if (!background) {
            navigate("/catalog");
          }
          return;
        }

        setCar(details);
        if (!background) {
          setLoading(false);
        }

        try {
          sessionStorage.setItem(`car_${lot}`, JSON.stringify(details));
        } catch (storageError) {
          console.warn("Failed to store in sessionStorage:", storageError);
        }

        trackCarView(lot, details);
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
            if (!background) {
              setLoading(false);
            }
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
      const cachedData = await hydrateFromCache();
      // Only fetch from API if cache didn't provide data
      if (!cachedData) {
        await fetchFromApi();
      } else {
        fetchFromApi({ background: true }).catch((error) => {
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

  const handleOpenInspectionReport = useCallback(() => {
    impact("light");
    const reportLot = car?.lot || lot;
    if (!reportLot) return;

    openCarReportInNewTab(reportLot);
  }, [car?.lot, lot, impact]);

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
      if (!car) {
        return "";
      }

      const rawParts = [
        typeof car.title === "string" ? car.title.trim() : "",
        typeof car.details?.variant === "string" ? car.details.variant.trim() : "",
        typeof car.details?.trim === "string" ? car.details.trim.trim() : "",
        typeof car.details?.grade === "string" ? car.details.grade.trim() : "",
      ].filter(Boolean);

      const uniqueParts: string[] = [];
      const seen = new Set<string>();
      rawParts.forEach((part) => {
        const normalized = part.toLowerCase();
        if (!seen.has(normalized)) {
          seen.add(normalized);
          uniqueParts.push(part);
        }
      });

      if (uniqueParts.length > 0) {
        return uniqueParts.join(" • ");
      }

      return mainTitle;
    }, [car, mainTitle]);

    const fuelDisplay = useMemo(() => {
      if (!car) {
        return "-";
      }

      const detailData = car.details as Record<string, unknown> | undefined;
      const insuranceData = car.insurance_v2 as Record<string, unknown> | undefined;
      const inspectData = car.inspect as Record<string, unknown> | undefined;

      const candidateValues: unknown[] = [
        car.fuel,
        detailData?.fuel,
        detailData?.fuel_type,
        (detailData as any)?.fuelType,
        (detailData as any)?.specs?.fuel,
        (detailData as any)?.specs?.fuel_type,
        (detailData as any)?.specs?.fuelType,
        (detailData as any)?.summary?.fuel,
        (detailData as any)?.summary?.fuel_type,
        (detailData as any)?.technical?.fuel,
        (detailData as any)?.technical?.fuel_type,
        insuranceData?.fuel,
        (insuranceData as any)?.vehicle?.fuel,
        inspectData?.fuel,
      ];

      for (const candidate of candidateValues) {
        if (candidate === undefined || candidate === null) {
          continue;
        }

        const localized = localizeFuel(candidate, "sq");
        if (localized) {
          return localized;
        }

        if (typeof candidate === "string") {
          const sanitized = candidate.trim();
          if (sanitized) {
            const fallbackLocalized = localizeFuel(sanitized, "sq");
            return fallbackLocalized || sanitized;
          }
        } else if (typeof candidate === "object") {
          const nameCandidate =
            (candidate as any).name ||
            (candidate as any).label ||
            (candidate as any).value;
          if (typeof nameCandidate === "string") {
            const sanitized = nameCandidate.trim();
            if (sanitized) {
              const nestedLocalized = localizeFuel(sanitized, "sq");
              return nestedLocalized || sanitized;
            }
          }
        }
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

  // Add swipe functionality for car detail photos - must be before early returns
  const {
    currentIndex: swipeCurrentIndex,
    containerRef: imageContainerRef,
    goToNext,
    goToPrevious,
    goToIndex,
    isClickAllowed,
  } = useImageSwipe({
    images,
    onImageChange: (index) => setSelectedImageIndex(index),
  });

  // Sync swipe current index with selected image index
  useEffect(() => {
    if (swipeCurrentIndex !== selectedImageIndex) {
      goToIndex(selectedImageIndex);
    }
  }, [selectedImageIndex, swipeCurrentIndex, goToIndex]);
  const registerMapTarget = useCallback((node: HTMLDivElement | null) => {
    if (!node) return;
    mapTargets.current = mapTargets.current.filter((target) => target !== node);
    mapTargets.current.push(node);
  }, []);

  useEffect(() => {
    if (shouldRenderMap) return;
    if (
      typeof window === "undefined" ||
      !(window as any).IntersectionObserver
    ) {
      setShouldRenderMap(true);
      return;
    }
    if (mapTargets.current.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setShouldRenderMap(true);
          observer.disconnect();
        }
      },
      { rootMargin: "200px" },
    );

    mapTargets.current.forEach((target) => observer.observe(target));

    return () => observer.disconnect();
  }, [shouldRenderMap]);

  const handleImageZoomOpen = useCallback(
    (event?: { preventDefault(): void; stopPropagation(): void }) => {
      event?.preventDefault();
      event?.stopPropagation();

      if (!images.length || !isClickAllowed()) {
        return;
      }

      impact("light");
      setIsImageZoomOpen(true);
    },
    [images.length, impact, isClickAllowed],
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

  // Preload important images
  useImagePreload(car?.image);
  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container-responsive py-8">
          <div className="space-y-6 animate-fade-in">
            <div className="h-8 bg-muted/50 rounded-lg w-32 animate-pulse"></div>
            <div className="h-64 bg-muted/50 rounded-xl animate-pulse"></div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="h-6 bg-muted/50 rounded-lg w-3/4 animate-pulse"></div>
                <div className="h-4 bg-muted/50 rounded-lg w-1/2 animate-pulse"></div>
                <div className="h-32 bg-muted/50 rounded-xl animate-pulse"></div>
              </div>
              <div className="space-y-4">
                <div className="h-6 bg-muted/50 rounded-lg w-1/2 animate-pulse"></div>
                <div className="h-24 bg-muted/50 rounded-xl animate-pulse"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
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
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background animate-fade-in pb-24 md:pb-0">
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
            <div className="flex-1"></div>
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

        {/* Main Content - Modern Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] xl:grid-cols-[1fr_420px] gap-6 lg:gap-8">
          {/* Left Column - Images and Gallery */}
          <div
            className="space-y-6 animate-fade-in"
            style={{ animationDelay: "100ms" }}
          >
            {/* Main Image with modern styling - Compact mobile design */}
            <div className="hidden lg:flex lg:gap-4">
              {/* Main Image Card */}
              <Card className="border-0 shadow-2xl overflow-hidden rounded-xl md:rounded-2xl hover:shadow-3xl transition-all duration-500 bg-gradient-to-br from-card to-card/80 backdrop-blur-sm flex-1">
                <CardContent className="p-0">
                  <div
                    ref={imageContainerRef}
                    className="relative w-full aspect-[4/3] bg-gradient-to-br from-muted/50 via-muted/30 to-background/50 overflow-hidden group cursor-pointer touch-none select-none"
                    onClick={handleImageZoomOpen}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        handleImageZoomOpen(event);
                      }
                    }}
                    aria-label="Hap imazhin e makinës në modal me zoom"
                  >
                    {/* Main Image with improved loading states */}
                    {images.length > 0 ? (
                      <img
                        src={images[selectedImageIndex]}
                        alt={`${car.year} ${car.make} ${car.model} - Image ${selectedImageIndex + 1}`}
                        className="w-full h-full object-cover transition-all duration-500 group-hover:scale-105"
                        onError={(e) => {
                          e.currentTarget.src = "/placeholder.svg";
                          setIsPlaceholderImage(true);
                        }}
                        onLoad={(e) => {
                          if (
                            !e.currentTarget.src.includes("/placeholder.svg")
                          ) {
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
                            goToPrevious();
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
                            goToNext();
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
                    <button
                      type="button"
                      onClick={handleImageZoomOpen}
                      className="absolute top-3 right-3 bg-black/60 backdrop-blur-md rounded-full p-2 opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                      aria-label="Zmadho imazhin"
                    >
                      <Expand className="h-4 w-4 text-white" />
                    </button>

                    {/* Loading indicator */}
                    {isPlaceholderImage && (
                      <div className="absolute inset-0 bg-muted/50 flex items-center justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                      </div>
                    )}
                  </div>
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
                          setSelectedImageIndex(index + 1);
                        }}
                        className={`flex-shrink-0 w-16 h-14 xl:w-20 xl:h-16 rounded-lg overflow-hidden border-2 transition-all duration-200 hover:scale-105 ${
                          selectedImageIndex === index + 1
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
                  className="relative w-full aspect-[3/2] sm:aspect-[16/10] bg-gradient-to-br from-muted/50 via-muted/30 to-background/50 overflow-hidden group cursor-pointer touch-none select-none"
                  onClick={handleImageZoomOpen}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      handleImageZoomOpen(event);
                    }
                  }}
                  aria-label="Hap imazhin e makinës në modal me zoom"
                >
                  {/* Main Image with improved loading states */}
                  {images.length > 0 ? (
                    <img
                      src={images[selectedImageIndex]}
                      alt={`${car.year} ${car.make} ${car.model} - Image ${selectedImageIndex + 1}`}
                      className="w-full h-full object-cover transition-all duration-500 group-hover:scale-105"
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
                          goToPrevious();
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
                          goToNext();
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
                  <button
                    type="button"
                    onClick={handleImageZoomOpen}
                    className="absolute top-3 right-3 bg-black/60 backdrop-blur-md rounded-full p-2 opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    aria-label="Zmadho imazhin"
                  >
                    <Expand className="h-4 w-4 text-white" />
                  </button>

                  {/* Loading indicator */}
                  {isPlaceholderImage && (
                    <div className="absolute inset-0 bg-muted/50 flex items-center justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Car Title with Price - Compact mobile design */}
            <div
              className="animate-fade-in"
              style={{ animationDelay: "200ms" }}
            >
              <div className="flex items-start justify-between gap-2 mb-1">
                <div className="flex-1 min-w-0 space-y-0.5">
                  <h1 className="text-lg md:text-2xl font-bold text-foreground bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent leading-tight">
                    {mainTitle}
                  </h1>
                  {secondaryTitle && (
                    <p className="text-sm md:text-base text-muted-foreground font-medium leading-tight line-clamp-2">
                      {secondaryTitle}
                    </p>
                  )}
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                    €{car.price.toLocaleString()}
                  </div>
                    <div className="text-xs text-muted-foreground font-medium">
                      +350€ deri në Prishtinë
                    </div>
                    <button
                      type="button"
                      onClick={handleOpenInspectionReport}
                      className="mt-2 inline-flex items-center gap-1.5 text-xs md:text-sm font-semibold text-primary hover:text-primary/80 hover:underline focus:outline-none disabled:opacity-60 disabled:cursor-not-allowed"
                      disabled={!car?.lot && !lot}
                    >
                      <Shield className="h-3 w-3 md:h-4 md:w-4" />
                      <span>Historia e Sigurimit</span>
                      <Badge
                        variant="secondary"
                        className={`ml-0.5 text-[10px] font-semibold uppercase tracking-wide ${accidentStyle.badge}`}
                      >
                        {accidentCount === 0 ? "Pa aksidente" : `${accidentCount}`}
                      </Badge>
                      <ChevronRight className="h-3 w-3 md:h-4 md:w-4" />
                    </button>
                </div>
              </div>

              {/* Action Buttons - Modernized Layout */}
              <div className="flex flex-wrap gap-3 mt-4 mb-5">
                <div className="flex-1 min-w-[200px]">
                  <Button
                    onClick={handleContactWhatsApp}
                    size="lg"
                    variant="outline"
                    className="group relative w-full h-14 rounded-xl border-2 border-green-500/30 bg-gradient-to-br from-green-500/5 to-green-500/10 text-green-600 hover:border-green-500 hover:bg-green-500 hover:text-white hover:shadow-2xl hover:shadow-green-500/20 hover:-translate-y-0.5 px-5 font-semibold transition-all duration-300 overflow-hidden"
                  >
                    <span className="absolute inset-0 bg-gradient-to-br from-green-500/0 to-green-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
                    <span className="relative flex items-center justify-between w-full">
                      <span className="flex items-center gap-2.5">
                        <MessageCircle className="h-5 w-5" />
                        <span className="text-sm">WhatsApp</span>
                      </span>
                      <ChevronRight className="h-5 w-5 opacity-60 group-hover:translate-x-1 group-hover:opacity-100 transition-all duration-300" />
                    </span>
                  </Button>
                </div>
              </div>
            </div>

            {/* Vehicle Specifications - Compact Mobile Card */}
            <Card
              id="specifications"
              className="border-0 shadow-2xl rounded-xl md:rounded-2xl mobile-specs-card bg-gradient-to-br from-card to-card/80 backdrop-blur-sm overflow-hidden animate-fade-in"
              style={{ animationDelay: "400ms" }}
            >
              <CardContent className="p-3 md:p-6">
                <div className="flex flex-col gap-2 md:gap-4 mb-3 md:mb-6">
                  <h3 className="text-base md:text-xl font-bold flex items-center text-foreground">
                    <div className="p-1.5 md:p-2 bg-primary/10 rounded-lg mr-2 md:mr-3">
                      <Settings className="h-4 w-4 md:h-6 md:w-6 text-primary" />
                    </div>
                    Specifikimet Teknike
                  </h3>
                </div>

                {/* Specifications Grid - Reorganized in specific order */}
                <div className="grid grid-cols-2 gap-1.5 md:gap-3 text-xs md:text-sm items-stretch auto-rows-fr isolate relative z-0">
                  {/* 1. Brand - e.g., Volkswagen */}
                  <div className="group grid grid-cols-[auto,1fr] items-start gap-x-2 md:gap-x-3 p-2 md:p-3 bg-gradient-to-br from-muted/50 to-muted/30 backdrop-blur-sm border border-border rounded-lg md:rounded-xl hover:shadow-lg hover:border-primary/50 transition-all duration-300 mobile-spec-item h-full overflow-hidden relative z-0 min-w-0">
                    <div className="flex items-center">
                      <div className="p-1 md:p-2 bg-primary/10 rounded-md md:rounded-lg group-hover:bg-primary/20 transition-colors duration-300 shrink-0">
                        <Car className="h-3 w-3 md:h-4 md:w-4 text-primary flex-shrink-0" />
                      </div>
                    </div>
                    <span className="text-muted-foreground font-medium text-left leading-tight whitespace-normal break-words min-w-0 text-xs md:text-sm">
                      {car.make}
                    </span>
                  </div>

                  {/* 2. Model - e.g., A6 35 TDI Quattro (full variant info) */}
                  <div className="group grid grid-cols-[auto,1fr] items-start gap-x-2 md:gap-x-3 p-2 md:p-3 bg-gradient-to-br from-muted/50 to-muted/30 backdrop-blur-sm border border-border rounded-lg md:rounded-xl hover:shadow-lg hover:border-primary/50 transition-all duration-300 mobile-spec-item h-full overflow-hidden relative z-0 min-w-0">
                    <div className="flex items-center">
                      <div className="p-1 md:p-2 bg-primary/10 rounded-md md:rounded-lg group-hover:bg-primary/20 transition-colors duration-300 shrink-0">
                        <Tag className="h-3 w-3 md:h-4 md:w-4 text-primary flex-shrink-0" />
                      </div>
                    </div>
                    <span className="text-muted-foreground font-medium text-left leading-tight whitespace-normal break-words min-w-0 text-xs md:text-sm">
                      {(() => {
                        // Build full model specification with all available variant/trim info from API
                        let fullModel = car.model || "";
                        const parts: string[] = [];
                        // Try to get grade from various sources
                        const grade =
                          car.grade_iaai ||
                          car.details?.grade?.name ||
                          car.details?.grade;
                        if (
                          grade &&
                          typeof grade === "string" &&
                          !fullModel.toLowerCase().includes(grade.toLowerCase())
                        ) {
                          parts.push(grade);
                        }

                        // Try to get variant/trim info
                        const variant =
                          car.details?.variant?.name || car.details?.variant;
                        if (
                          variant &&
                          typeof variant === "string" &&
                          !fullModel
                            .toLowerCase()
                            .includes(variant.toLowerCase())
                        ) {
                          parts.push(variant);
                        }

                        const trim =
                          car.details?.trim?.name || car.details?.trim;
                        if (
                          trim &&
                          typeof trim === "string" &&
                          !fullModel
                            .toLowerCase()
                            .includes(trim.toLowerCase()) &&
                          !parts
                            .join(" ")
                            .toLowerCase()
                            .includes(trim.toLowerCase())
                        ) {
                          parts.push(trim);
                        }

                        // Add engine info
                        const engineName = car.engine?.name || car.engine;
                        const engineStr =
                          typeof engineName === "string" ? engineName : "";
                        if (
                          engineStr &&
                          engineStr !== car.model &&
                          !fullModel
                            .toLowerCase()
                            .includes(engineStr.toLowerCase())
                        ) {
                          const engineInfo = engineStr.trim();
                          if (engineInfo && engineInfo.length > 0) {
                            parts.push(engineInfo);
                          }
                        }

                        // Add drive type (Quattro, xDrive, 4WD, etc.)
                        const driveType =
                          car.drive_wheel?.name || car.drive_wheel;
                        const driveStr =
                          typeof driveType === "string" ? driveType : "";
                        if (
                          driveStr &&
                          !fullModel
                            .toLowerCase()
                            .includes(driveStr.toLowerCase()) &&
                          !parts
                            .join(" ")
                            .toLowerCase()
                            .includes(driveStr.toLowerCase())
                        ) {
                          const driveInfo = driveStr.trim();
                          if (driveInfo && driveInfo.length > 0) {
                            parts.push(driveInfo);
                          }
                        }

                        // Combine model with all parts
                        const result =
                          parts.length > 0
                            ? `${fullModel} ${parts.join(" ")}`
                            : fullModel;
                        return result;
                      })()}
                    </span>
                  </div>

                  {/* 3. Year - e.g., 2022 */}
                  <div className="group grid grid-cols-[auto,1fr] items-start gap-x-2 md:gap-x-3 p-2 md:p-3 bg-gradient-to-br from-muted/50 to-muted/30 backdrop-blur-sm border border-border rounded-lg md:rounded-xl hover:shadow-lg hover:border-primary/50 transition-all duration-300 mobile-spec-item h-full overflow-hidden relative z-0 min-w-0">
                    <div className="flex items-center">
                      <div className="p-1 md:p-2 bg-primary/10 rounded-md md:rounded-lg group-hover:bg-primary/20 transition-colors duration-300 shrink-0">
                        <Calendar className="h-3 w-3 md:h-4 md:w-4 text-primary flex-shrink-0" />
                      </div>
                    </div>
                    <span className="text-muted-foreground font-medium text-left leading-tight whitespace-normal break-words min-w-0 text-xs md:text-sm">
                      {car.year}
                    </span>
                  </div>

                  {/* 4. Mileage */}
                  <div className="group grid grid-cols-[auto,1fr] items-start gap-x-2 md:gap-x-3 p-2 md:p-3 bg-gradient-to-br from-muted/50 to-muted/30 backdrop-blur-sm border border-border rounded-lg md:rounded-xl hover:shadow-lg hover:border-primary/50 transition-all duration-300 mobile-spec-item h-full overflow-hidden relative z-0 min-w-0">
                    <div className="flex items-center">
                      <div className="p-1 md:p-2 bg-primary/10 rounded-md md:rounded-lg group-hover:bg-primary/20 transition-colors duration-300 shrink-0">
                        <Gauge className="h-3 w-3 md:h-4 md:w-4 text-primary flex-shrink-0" />
                      </div>
                    </div>
                    <span className="text-muted-foreground font-medium text-left leading-tight whitespace-normal break-words min-w-0 text-xs md:text-sm">
                      {formatMileage(car.mileage)}
                    </span>
                  </div>

                  {/* Cylinders */}
                  {car.cylinders && (
                    <div className="group grid grid-cols-[auto,1fr] items-start gap-x-2 md:gap-x-3 p-2 md:p-3 bg-gradient-to-br from-muted/50 to-muted/30 backdrop-blur-sm border border-border rounded-lg md:rounded-xl hover:shadow-lg hover:border-primary/50 transition-all duration-300 mobile-spec-item h-full overflow-hidden relative z-0 min-w-0">
                      <div className="flex items-center">
                        <div className="p-1 md:p-2 bg-primary/10 rounded-md md:rounded-lg group-hover:bg-primary/20 transition-colors duration-300 shrink-0">
                          <Cylinder className="h-3 w-3 md:h-4 md:w-4 text-primary flex-shrink-0" />
                        </div>
                      </div>
                      <span className="text-muted-foreground font-medium text-left leading-tight whitespace-normal break-words min-w-0 text-xs md:text-sm">
                        {car.cylinders}
                      </span>
                    </div>
                  )}

                  {/* Doors */}
                  {car.details?.doors_count && (
                    <div className="group grid grid-cols-[auto,1fr] items-start gap-x-2 md:gap-x-3 p-2 md:p-3 bg-gradient-to-br from-muted/50 to-muted/30 backdrop-blur-sm border border-border rounded-lg md:rounded-xl hover:shadow-lg hover:border-primary/50 transition-all duration-300 mobile-spec-item h-full overflow-hidden relative z-0 min-w-0">
                      <div className="flex items-center">
                        <div className="p-1 md:p-2 bg-primary/10 rounded-md md:rounded-lg group-hover:bg-primary/20 transition-colors duration-300 shrink-0">
                          <DoorClosed className="h-3 w-3 md:h-4 md:w-4 text-primary flex-shrink-0" />
                        </div>
                      </div>
                      <span className="text-muted-foreground font-medium text-left leading-tight whitespace-normal break-words min-w-0 text-xs md:text-sm">
                        {car.details.doors_count}
                      </span>
                    </div>
                  )}

                    {/* Fuel Type */}
                    <div className="group grid grid-cols-[auto,1fr] items-start gap-x-2 md:gap-x-3 p-2 md:p-3 bg-gradient-to-br from-muted/50 to-muted/30 backdrop-blur-sm border border-border rounded-lg md:rounded-xl hover:shadow-lg hover:border-primary/50 transition-all duration-300 mobile-spec-item h-full overflow-hidden relative z-0 min-w-0">
                      <div className="flex items-center">
                        <div className="p-1 md:p-2 bg-primary/10 rounded-md md:rounded-lg group-hover:bg-primary/20 transition-colors duration-300 shrink-0">
                          <Fuel className="h-3 w-3 md:h-4 md:w-4 text-primary flex-shrink-0" />
                        </div>
                      </div>
                      <span className="text-muted-foreground font-medium text-left leading-tight whitespace-normal break-words min-w-0 text-xs md:text-sm">
                        {fuelDisplay}
                      </span>
                    </div>

                  {/* 5. Engine - e.g., 998cc */}
                  {car.details?.engine_volume && (
                    <div className="group grid grid-cols-[auto,1fr] items-start gap-x-2 md:gap-x-3 p-2 md:p-3 bg-gradient-to-br from-muted/50 to-muted/30 backdrop-blur-sm border border-border rounded-lg md:rounded-xl hover:shadow-lg hover:border-primary/50 transition-all duration-300 mobile-spec-item h-full overflow-hidden relative z-0 min-w-0">
                      <div className="flex items-center">
                        <div className="p-1 md:p-2 bg-primary/10 rounded-md md:rounded-lg group-hover:bg-primary/20 transition-colors duration-300 shrink-0">
                          <Cog className="h-3 w-3 md:h-4 md:w-4 text-primary flex-shrink-0" />
                        </div>
                      </div>
                      <span className="text-muted-foreground font-medium text-left leading-tight whitespace-normal break-words min-w-0 text-xs md:text-sm">
                        {car.details.engine_volume}cc
                      </span>
                    </div>
                  )}

                  {/* Transmission */}
                  {car.transmission && (
                    <div className="group grid grid-cols-[auto,1fr] items-start gap-x-2 md:gap-x-3 p-2 md:p-3 bg-gradient-to-br from-muted/50 to-muted/30 backdrop-blur-sm border border-border rounded-lg md:rounded-xl hover:shadow-lg hover:border-primary/50 transition-all duration-300 mobile-spec-item h-full overflow-hidden relative z-0 min-w-0">
                      <div className="flex items-center">
                        <div className="p-1 md:p-2 bg-primary/10 rounded-md md:rounded-lg group-hover:bg-primary/20 transition-colors duration-300 shrink-0">
                          <Settings className="h-3 w-3 md:h-4 md:w-4 text-primary flex-shrink-0" />
                        </div>
                      </div>
                      <span className="text-muted-foreground font-medium capitalize text-left leading-tight whitespace-normal break-words min-w-0 text-xs md:text-sm">
                        {translateTransmission(car.transmission)}
                      </span>
                    </div>
                  )}

                  {/* Drivetrain */}
                  {car.drive_wheel?.name && (
                    <div className="group grid grid-cols-[auto,1fr] items-start gap-x-2 md:gap-x-3 p-2 md:p-3 bg-gradient-to-br from-muted/50 to-muted/30 backdrop-blur-sm border border-border rounded-lg md:rounded-xl hover:shadow-lg hover:border-primary/50 transition-all duration-300 mobile-spec-item h-full overflow-hidden relative z-0 min-w-0">
                      <div className="flex items-center">
                        <div className="p-1 md:p-2 bg-primary/10 rounded-md md:rounded-lg group-hover:bg-primary/20 transition-colors duration-300 shrink-0">
                          <CircleDot className="h-3 w-3 md:h-4 md:w-4 text-primary flex-shrink-0" />
                        </div>
                      </div>
                      <span className="text-muted-foreground font-medium uppercase text-left leading-tight whitespace-normal break-words min-w-0 text-xs md:text-sm">
                        {car.drive_wheel.name}
                      </span>
                    </div>
                  )}

                  {/* Seats */}
                  {car.details?.seats_count && (
                    <div className="group grid grid-cols-[auto,1fr] items-start gap-x-2 md:gap-x-3 p-2 md:p-3 bg-gradient-to-br from-muted/50 to-muted/30 backdrop-blur-sm border border-border rounded-lg md:rounded-xl hover:shadow-lg hover:border-primary/50 transition-all duration-300 mobile-spec-item h-full overflow-hidden relative z-0 min-w-0">
                      <div className="flex items-center">
                        <div className="p-1 md:p-2 bg-primary/10 rounded-md md:rounded-lg group-hover:bg-primary/20 transition-colors duration-300 shrink-0">
                          <Armchair className="h-3 w-3 md:h-4 md:w-4 text-primary flex-shrink-0" />
                        </div>
                      </div>
                      <span className="text-muted-foreground font-medium text-left leading-tight whitespace-normal break-words min-w-0 text-xs md:text-sm">
                        {car.details.seats_count}
                      </span>
                    </div>
                  )}

                  {/* Exterior Color */}
                  {car.color && (
                    <div className="group grid grid-cols-[auto,1fr] items-start gap-x-2 md:gap-x-3 p-2 md:p-3 bg-gradient-to-br from-muted/50 to-muted/30 backdrop-blur-sm border border-border rounded-lg md:rounded-xl hover:shadow-lg hover:border-primary/50 transition-all duration-300 mobile-spec-item h-full overflow-hidden relative z-0 min-w-0">
                      <div className="flex items-center">
                        <div className="p-1 md:p-2 bg-primary/10 rounded-md md:rounded-lg group-hover:bg-primary/20 transition-colors duration-300 shrink-0">
                          <PaintBucket className="h-3 w-3 md:h-4 md:w-4 text-primary flex-shrink-0" />
                        </div>
                      </div>
                      <span className="text-muted-foreground font-medium capitalize text-left leading-tight whitespace-normal break-words min-w-0 text-xs md:text-sm">
                        {translateColor(car.color)}
                      </span>
                    </div>
                  )}

                  {/* Interior Color */}
                  {car.details?.interior_color && (
                    <div className="group grid grid-cols-[auto,1fr] items-start gap-x-2 md:gap-x-3 p-2 md:p-3 bg-gradient-to-br from-muted/50 to-muted/30 backdrop-blur-sm border border-border rounded-lg md:rounded-xl hover:shadow-lg hover:border-primary/50 transition-all duration-300 mobile-spec-item h-full overflow-hidden relative z-0 min-w-0">
                      <div className="flex items-center">
                        <div className="p-1 md:p-2 bg-primary/10 rounded-md md:rounded-lg group-hover:bg-primary/20 transition-colors duration-300 shrink-0">
                          <Armchair className="h-3 w-3 md:h-4 md:w-4 text-primary flex-shrink-0" />
                        </div>
                      </div>
                      <span className="text-muted-foreground font-medium capitalize text-left leading-tight whitespace-normal break-words min-w-0 text-xs md:text-sm">
                        {translateColor(car.details.interior_color)}
                      </span>
                    </div>
                  )}

                  {/* VIN Number */}
                  {car.vin && (
                    <div className="group grid grid-cols-[auto,1fr] items-start gap-x-2 md:gap-x-3 p-2 md:p-3 bg-gradient-to-br from-muted/50 to-muted/30 backdrop-blur-sm border border-border rounded-lg md:rounded-xl hover:shadow-lg hover:border-primary/50 transition-all duration-300 mobile-spec-item h-full overflow-hidden relative z-0 min-w-0">
                      <div className="flex items-center">
                        <div className="p-1 md:p-2 bg-primary/10 rounded-md md:rounded-lg group-hover:bg-primary/20 transition-colors duration-300 shrink-0">
                          <Car className="h-3 w-3 md:h-4 md:w-4 text-primary flex-shrink-0" />
                        </div>
                      </div>
                      <div className="flex items-center justify-end gap-1 md:gap-2 min-w-0">
                        <span className="text-muted-foreground font-medium font-mono text-xs md:text-sm text-left leading-tight whitespace-normal break-words min-w-0">
                          {car.vin}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Enhanced Detailed Information Section */}
            <Card className="glass-panel border-0 shadow-2xl rounded-xl mobile-detailed-info-card">
              <CardContent className="p-3 sm:p-4 lg:p-6">
                <div className="flex flex-col gap-2 sm:gap-3 mb-3 sm:mb-4"></div>

                {showDetailedInfo && (
                  <div className="space-y-4 sm:space-y-6 animate-in slide-in-from-top-2 duration-300">
                    {/* Insurance & Safety Report - Mobile Optimized */}
                    {(car.insurance_v2 || car.inspect || car.insurance) && (
                      <div className="space-y-3 sm:space-y-4 p-3 sm:p-4 bg-muted/50 rounded-lg mobile-info-section">
                        <h4 className="text-base sm:text-lg font-semibold text-foreground flex items-center gap-2">
                          <Shield className="h-4 w-4 sm:h-5 sm:w-5" />
                          Raporti i Sigurisë dhe Sigurimit
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4">
                          {car.insurance_v2?.accidentCnt !== undefined && (
                            <div className="flex items-center justify-between p-2 sm:p-3 bg-card border border-border rounded-lg mobile-detail-item">
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
                                    className="flex flex-col gap-1.5 rounded-lg border border-border/60 bg-card/80 p-3 sm:p-4"
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

                    {car.details?.options && (
                      <EquipmentOptionsSection
                        options={convertOptionsToNames(car.details.options)}
                        features={car.features}
                        safetyFeatures={car.safety_features}
                        comfortFeatures={car.comfort_features}
                      />
                    )}

                    {/* Fallback if no options found */}
                    {!car.details?.options && (
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

                    {/* Comprehensive Inspection Report */}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Enhanced Contact Card */}
          <div className="space-y-4">
            {/* Enhanced Contact & Inspection Card */}
            <Card className="glass-panel border-0 shadow-2xl lg:sticky top-20 lg:top-4 right-4 lg:right-auto rounded-xl z-50 lg:z-auto w-full lg:w-auto lg:max-w-sm">
              <CardContent className="p-4">
                <h3 className="text-lg font-bold mb-4 text-center text-foreground">
                  Kontakt & Inspektim
                </h3>

                {/* Enhanced Contact Buttons */}
                  <div className="space-y-3 mb-4">
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
                        window.open(
                          "https://www.instagram.com/korauto.ks/",
                          "_blank",
                        )
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
                      onClick={() =>
                        window.open("mailto:info@korauto.com", "_self")
                      }
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
              onImageChange={setSelectedImageIndex}
            />
          </Suspense>
        )}
      </div>
      {car &&
        isPortalReady &&
        createPortal(
          <div className="md:hidden fixed inset-x-0 bottom-0 z-50 bg-background/95 backdrop-blur border-t border-border shadow-[0_-6px_12px_rgba(0,0,0,0.08)]">
            <div className="mx-auto flex w-full max-w-[1600px] items-center gap-3 px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium text-muted-foreground line-clamp-1">
                  {car.year} {car.make} {car.model}
                </div>
                <div className="text-lg font-bold text-foreground">
                  €{car.price.toLocaleString()}
                </div>
              </div>
              <Button
                variant="outline"
                size="lg"
                className="h-12 w-12 flex-shrink-0 rounded-xl border-primary/40 text-primary"
                onClick={handlePhoneCall}
              >
                <Phone className="h-5 w-5" />
              </Button>
              <Button
                size="lg"
                className="h-12 flex-shrink-0 rounded-xl bg-green-600 px-4 text-sm font-semibold text-white shadow-lg shadow-green-600/30 hover:bg-green-700"
                onClick={handleContactWhatsApp}
              >
                <MessageCircle className="mr-2 h-5 w-5" />
                WhatsApp
              </Button>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
});

export default CarDetails;
