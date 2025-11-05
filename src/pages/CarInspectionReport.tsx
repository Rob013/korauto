import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { trackPageView } from "@/utils/analytics";
import { calculateFinalPriceEUR } from "@/utils/carPricing";
import { useCurrencyAPI } from "@/hooks/useCurrencyAPI";
import { fallbackCars } from "@/data/fallbackData";
import { formatMileage } from "@/utils/mileageFormatter";
import CarInspectionDiagram from "@/components/CarInspectionDiagram";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle,
  Clock,
  Cog,
  FileText,
  Loader2,
  MapPin,
  Shield,
  Wrench,
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
}

const API_BASE_URL = "https://auctionsapi.com/api";
const API_KEY = "d00985c77981fe8d26be16735f932ed1";

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
]);

const translateStatusValue = (value: unknown) => {
  if (typeof value !== "string") return String(value ?? "") || "-";
  const normalized = value.toLowerCase();
  switch (normalized) {
    case "goodness":
    case "good":
    case "ok":
    case "okay":
    case "fine":
      return "Mirë";
    case "proper":
      return "Saktë";
    case "doesn't exist":
      return "Nuk ekziston";
    case "normal":
      return "Normal";
    case "excellent":
      return "Shkëlqyeshëm";
    case "perfect":
      return "Perfekt";
    default:
      return value;
  }
};

const isPositiveStatus = (value: unknown) => {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    return positiveStatusValues.has(value.toLowerCase());
  }
  return false;
};

const formatKeyLabel = (key: string) =>
  key
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());

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

  const dayMonthYearMatch = normalized.match(/^(\d{2})[./-](\d{2})[./-](\d{4})$/);
  if (dayMonthYearMatch) {
    const [, dd, mm, yyyy] = dayMonthYearMatch;
    return monthYear ? `${mm}.${yyyy}` : `${dd}.${mm}.${yyyy}`;
  }

  const yearMonthDayMatch = normalized.match(/^(\d{4})[./-](\d{2})[./-](\d{2})$/);
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
      return parsed.toLocaleDateString("sq-AL", { month: "2-digit", year: "numeric" });
    }
    return parsed.toLocaleDateString("sq-AL", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  }

  return raw.replace(/-/g, ".").replace(/T.*/, "");
};

const CarInspectionReport = () => {
  const { id: lot } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { exchangeRate, processFloodDamageText } = useCurrencyAPI();
  const [car, setCar] = useState<InspectionReportCar | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchInspectionReport = useCallback(async () => {
    if (!lot) return;

    setLoading(true);
    setError(null);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      let response = await fetch(`${API_BASE_URL}/search-lot/${lot}/iaai`, {
        headers: {
          accept: "*/*",
          "x-api-key": API_KEY,
        },
        signal: controller.signal,
      });

      if (!response.ok) {
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
        throw new Error(`API returned ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      const carData = data.data;
      const lotData = carData?.lots?.[0];

      if (!lotData) {
        throw new Error("Informacioni i lotit mungon në përgjigjen e API-së");
      }

      const basePrice = lotData.buy_now || lotData.final_bid || lotData.price;
      const priceEUR = basePrice
        ? calculateFinalPriceEUR(basePrice, exchangeRate.rate)
        : undefined;

      const details = lotData.details || {};
      const inspectOuter =
        details?.inspect_outer || lotData.inspect_outer || carData.inspect_outer;
      const inspectInner =
        details?.inspect?.inner || lotData.inspect?.inner || carData.inspect?.inner;

        const transformed: InspectionReportCar = {
          id: carData.id?.toString() || lot,
          lot: lotData.lot || lot,
          make: carData.manufacturer?.name,
          model: carData.model?.name,
          year: carData.year,
          title: carData.title || lotData.title,
          image: lotData.images?.big?.[0] || lotData.images?.normal?.[0],
          priceEUR,
          mileageKm: lotData.odometer?.km,
          odometer: lotData.odometer,
          vin:
            lotData.vin ||
            carData.vin ||
            details?.vin ||
            details?.insurance?.car_info?.vin,
          fuel:
            carData.fuel?.name ||
            lotData.fuel?.name ||
            details?.fuel?.name ||
            details?.specs?.fuel,
          firstRegistration:
            lotData.first_registration ||
            (typeof lotData.firstRegistration === "string" && lotData.firstRegistration) ||
            details?.first_registration ||
            lotData.insurance_v2?.firstDate ||
            carData.insurance_v2?.firstDate,
          postedAt:
            lotData.listed_at ||
            lotData.posted_at ||
            lotData.created_at ||
            carData.listed_at ||
            carData.posted_at ||
            carData.created_at,
          engineDisplacement:
            lotData.insurance_v2?.displacement ||
            carData.insurance_v2?.displacement ||
            details?.engine_volume ||
            details?.engine?.displacement,
          damage: lotData.damage || details?.damage || null,
          insurance: lotData.insurance || details?.insurance || carData.insurance,
          insurance_v2: lotData.insurance_v2 || carData.insurance_v2,
          details: {
            ...details,
            inspect_outer: inspectOuter,
            inspect: {
              ...details?.inspect,
              inner: inspectInner,
            },
          },
          inspect: lotData.inspect,
          ownerChanges: details?.insurance?.owner_changes || [],
          maintenanceHistory: details?.maintenance_history || [],
          location: lotData.location,
          grade: lotData.grade_iaai,
          sourceLabel: carData.source_label || carData.domain_name,
        };

      setCar(transformed);
      setLoading(false);
    } catch (apiError) {
      console.error("Failed to fetch inspection report:", apiError);

      const fallbackCar = fallbackCars.find(
        (fallback) =>
          fallback.id === lot ||
          fallback.lot_number === lot ||
          fallback?.lots?.[0]?.lot === lot,
      );

      if (fallbackCar && fallbackCar.lots?.[0]) {
        const lotData = fallbackCar.lots[0];
        const basePrice = lotData.buy_now || fallbackCar.price;
        const priceEUR = basePrice
          ? calculateFinalPriceEUR(basePrice, exchangeRate.rate)
          : undefined;

        setCar({
          id: fallbackCar.id,
          lot: lotData.lot,
          make: fallbackCar.manufacturer?.name,
          model: fallbackCar.model?.name,
          year: fallbackCar.year,
          title: fallbackCar.title,
          image: lotData.images?.big?.[0] || lotData.images?.normal?.[0],
            priceEUR,
          mileageKm: lotData.odometer?.km,
          odometer: lotData.odometer,
          vin: fallbackCar.vin || lotData.vin,
          fuel:
            fallbackCar.fuel?.name ||
            lotData.fuel?.name ||
            fallbackCar.details?.fuel?.name,
          firstRegistration:
            lotData.first_registration ||
            fallbackCar.first_registration ||
            fallbackCar.details?.first_registration,
          postedAt: lotData.listed_at || fallbackCar.listed_at,
          engineDisplacement:
            fallbackCar.details?.engine_volume ||
            lotData.insurance_v2?.displacement,
          damage: lotData.damage || null,
          insurance: lotData.insurance,
          insurance_v2: lotData.insurance_v2,
          details: lotData.details,
          maintenanceHistory: lotData.details?.maintenance_history || [],
          ownerChanges: lotData.details?.insurance?.owner_changes || [],
        });
        setLoading(false);
        return;
      }

      setError(
        apiError instanceof Error
          ? apiError.message
          : "Nuk u arrit të ngarkohej raporti i inspektimit",
      );
      setLoading(false);
    }
  }, [exchangeRate.rate, lot]);

  useEffect(() => {
    trackPageView(`/car/${lot}/report`, {
      page_type: "inspection_report",
    });
  }, [lot]);

  useEffect(() => {
    fetchInspectionReport();
  }, [fetchInspectionReport]);

    const inspectionOuterData = useMemo(() => {
      // Try multiple potential locations and merge arrays if found
      const candidates: unknown[] = [];
      const pushIfArray = (val: unknown) => {
        if (Array.isArray(val)) candidates.push(...val);
      };
      pushIfArray(car?.details?.inspect_outer);
      pushIfArray(car?.inspect?.outer);
      pushIfArray(car?.inspect?.inspect_outer);
      pushIfArray((car as any)?.details?.inspect?.outer);
      pushIfArray((car as any)?.details?.outer);
      // Deduplicate by type.code if present
      const keyed = new Map<string, any>();
      for (const item of candidates) {
        const code = (item as any)?.type?.code || (item as any)?.code || JSON.stringify(item);
        if (!keyed.has(code)) keyed.set(code, item);
      }
      return Array.from(keyed.values());
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

  const insuranceCarInfo = car?.details?.insurance?.car_info;

  const accidents = useMemo(() => {
    if (!car?.insurance_v2?.accidents) return [];
    if (Array.isArray(car.insurance_v2.accidents)) {
      return car.insurance_v2.accidents;
    }
    return [];
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
        if (value === undefined || value === null) return "-";
        if (typeof value === "number") {
          return value.toLocaleString("de-DE");
        }
        const stringValue = `${value}`.trim();
        return stringValue ? stringValue : "-";
      };

      return {
        date: formatDisplayDate(dateValue) ?? "-",
        part:
          normalizeValue(
            accident?.part ||
              accident?.damagePart ||
              accident?.component ||
              accident?.type ||
              accident?.position,
          ),
        paint: normalizeValue(accident?.paint || accident?.paintCost || accident?.painting),
        labor: normalizeValue(accident?.labor || accident?.laborCost || accident?.workCost),
        total: normalizeValue(accident?.total || accident?.totalCost || accident?.sum),
      };
    });
  }, [accidents]);

  const hasAccidentDetails = useMemo(
    () =>
      accidentEntries.some((entry) =>
        Object.values(entry).some(
          (value) => value !== "-" && value !== "" && value !== null && value !== undefined,
        ),
      ),
    [accidentEntries],
  );

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

  const carName = `${car.year || ""} ${car.make || ""} ${car.model || ""}`.trim();
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
        : fuelSource ?? null;

    const mileageDisplay = formattedMileage || "-";

    const ownerChangeCount =
      typeof car.insurance_v2?.ownerChangeCnt === "number"
        ? car.insurance_v2.ownerChangeCnt
        : car.ownerChanges?.length;

    const ownerChangesDisplay =
      ownerChangeCount === undefined
        ? "-"
        : ownerChangeCount === 0
          ? "Asnjë"
          : ownerChangeCount === 1
            ? "1 herë"
            : `${ownerChangeCount} herë`;

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

    const usageHistoryList: Array<{ description?: string; value?: string }> = Array.isArray(
      car.details?.insurance?.usage_history,
    )
      ? car.details?.insurance?.usage_history
      : [];

    const findUsageValue = (keywords: string[]) => {
      const match = usageHistoryList.find((entry) => {
        const description = `${entry.description ?? ""}`.toLowerCase();
        return keywords.some((keyword) => description.includes(keyword));
      });
      return match?.value;
    };

    const toYesNo = (value?: string | number | boolean | null) => {
      if (value === undefined || value === null) return null;
      if (typeof value === "boolean") return value ? "Po" : "Jo";
      if (typeof value === "number") return value > 0 ? "Po" : "Jo";
      const normalized = value.toString().trim().toLowerCase();
      if (!normalized) return null;
      if (["po", "yes", "true", "1"].includes(normalized)) return "Po";
      if (["jo", "no", "false", "0"].includes(normalized)) return "Jo";
      return value.toString();
    };

    const rentalUsageValue =
      toYesNo(findUsageValue(["rent", "qira", "rental"])) ??
      toYesNo(car.insurance_v2?.carInfoUse1s?.join(" ")) ??
      toYesNo(car.insurance_v2?.carInfoUse2s?.join(" ")) ??
      toYesNo(car.insurance_v2?.loan);

    const commercialUsageValue =
      toYesNo(findUsageValue(["komerc", "biznes", "commercial"])) ??
      toYesNo(car.insurance_v2?.business);

    const usageHighlights = [
      { label: "Përdorur si veturë me qira", value: rentalUsageValue ?? "Nuk ka informata" },
      { label: "Përdorur për qëllime komerciale", value: commercialUsageValue ?? "Nuk ka informata" },
    ];

    const ownerChangesList: Array<any> = Array.isArray(car.ownerChanges) ? car.ownerChanges : [];

    const specialAccidentHistory: Array<any> = Array.isArray(
      car.details?.insurance?.special_accident_history,
    )
      ? car.details?.insurance?.special_accident_history
      : [];

    const specialAccidentStats = [
      {
        label: "Flooded?",
        value:
          typeof car.insurance_v2?.floodTotalLossCnt === "number"
            ? car.insurance_v2.floodTotalLossCnt > 0
              ? "Po"
              : "Jo"
            : insuranceCarInfo?.flood_damage
              ? toYesNo(processFloodDamageText(insuranceCarInfo.flood_damage)) ??
                processFloodDamageText(insuranceCarInfo.flood_damage)
              : "Nuk ka informata",
      },
      {
        label: "Total loss?",
        value:
          typeof car.insurance_v2?.totalLossCnt === "number"
            ? car.insurance_v2.totalLossCnt > 0
              ? "Po"
              : "Jo"
            : insuranceCarInfo?.total_loss
              ? toYesNo(insuranceCarInfo.total_loss) ?? insuranceCarInfo.total_loss
              : "Nuk ka informata",
      },
      {
        label: "Aksidente të raportuara",
        value:
          typeof car.insurance_v2?.accidentCnt === "number"
            ? car.insurance_v2.accidentCnt
            : insuranceCarInfo?.accident_history || "Nuk ka informata",
      },
      {
        label: "Pronaret e ndërruar",
        value: ownerChangesDisplay,
      },
    ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="bg-muted/30 border-b border-border">
        <div className="container-responsive py-3 flex flex-col gap-2">
          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="outline"
              className="flex items-center gap-2"
              onClick={() => navigate(`/car/${car.lot || lot}`)}
            >
              <ArrowLeft className="h-4 w-4" />
              Kthehu te makina
            </Button>
            <Badge variant="secondary" className="text-sm">
              <FileText className="h-3.5 w-3.5 mr-1" />
              Raporti i Inspektimit
            </Badge>
          </div>

            <div className="flex flex-col gap-2">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                {carName || car.title || "Raporti i Automjetit"}
              </h1>
              <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              {car.lot && (
                <span className="font-medium text-foreground">
                  Kodi i lotit: <span className="font-semibold">{car.lot}</span>
                </span>
              )}
              {formattedPrice && (
                <Badge variant="outline" className="text-sm">
                  {formattedPrice}
                </Badge>
              )}
              {formattedMileage && (
                <span>
                  Kilometrazhi: <span className="font-semibold">{formattedMileage}</span>
                </span>
              )}
              {car.grade && (
                <Badge variant="secondary" className="bg-primary/10 text-primary">
                  Grade IAAI: {car.grade}
                </Badge>
              )}
            </div>
            {car.location?.name && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4" />
                {car.location.name}
              </div>
            )}
          </div>
        </div>
      </div>

        <div className="container-responsive py-4 space-y-4">
          <Tabs defaultValue="diagram" className="space-y-3">
            <TabsList className="w-full flex flex-wrap items-stretch gap-2 bg-muted/60 p-1 rounded-lg h-auto md:flex-nowrap md:gap-1">
              <TabsTrigger
                value="diagram"
                className="flex-1 min-w-[10rem] text-sm md:text-base whitespace-normal leading-tight text-center px-3 py-2"
              >
                Diagrami i Inspektimit të Automjetit
              </TabsTrigger>
              <TabsTrigger
                value="exterior"
                className="flex-1 min-w-[10rem] text-sm md:text-base whitespace-normal leading-tight text-center px-3 py-2"
              >
                Gjendja e Jashtme dhe Karocerisë
              </TabsTrigger>
              <TabsTrigger
                value="mechanical"
                className="flex-1 min-w-[10rem] text-sm md:text-base whitespace-normal leading-tight text-center px-3 py-2"
              >
                Motori dhe Sistemi Mekanik
              </TabsTrigger>
              <TabsTrigger
                value="warranty"
                className="flex-1 min-w-[10rem] text-sm md:text-base whitespace-normal leading-tight text-center px-3 py-2"
              >
                Garancioni
              </TabsTrigger>
            </TabsList>

            <TabsContent value="diagram" className="space-y-3">
              <Card className="shadow-md">
                <CardHeader className="flex flex-col gap-1 pb-3">
                  <div className="flex items-center gap-3">
                    <Shield className="h-5 w-5 text-primary" />
                    <CardTitle className="text-xl">
                      Diagrami i Inspektimit të Automjetit
                    </CardTitle>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Gjendja vizuale e pjesëve të jashtme dhe panelet e karocerisë
                  </p>
                </CardHeader>
                <CardContent className="space-y-3">
                  <CarInspectionDiagram inspectionData={inspectionOuterData} className="mx-auto" />

                  {inspectionOuterData.length > 0 && (
                    <div className="grid gap-2 md:grid-cols-2">
                      {inspectionOuterData.map((item: any, index: number) => (
                        <Card key={`${item?.type?.code || index}-summary`} className="border-border/80">
                          <CardHeader className="pb-1">
                            <div className="flex items-center gap-3">
                              <Wrench className="h-4 w-4 text-primary" />
                              <CardTitle className="text-base font-semibold">
                                {item?.type?.title || "Pjesë e karocerisë"}
                              </CardTitle>
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-1.5">
                            {item?.statusTypes?.length > 0 && (
                              <div className="flex flex-wrap gap-1.5">
                                {item.statusTypes.map((status: any) => (
                                  <Badge key={`${status?.code}-${status?.title}`} variant="secondary">
                                    {status?.title}
                                  </Badge>
                                ))}
                              </div>
                            )}
                            {item?.attributes?.length > 0 && (
                              <ul className="space-y-1 text-sm text-muted-foreground">
                                {item.attributes.map((attribute: string, attrIndex: number) => (
                                  <li key={attrIndex} className="flex items-start gap-2">
                                    <CheckCircle className="h-3.5 w-3.5 text-muted-foreground mt-0.5" />
                                    <span>{attribute}</span>
                                  </li>
                                ))}
                              </ul>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="warranty" className="space-y-4">
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
                    Garancioni ynë mbulon komponentët kryesorë mekanikë dhe elektrikë të automjetit, sipas
                    kushteve të përcaktuara më poshtë. Qëllimi është t&apos;ju ofrojë qetësi dhe transparencë pas blerjes.
                  </p>

                  <div>
                    <h3 className="font-semibold text-foreground mb-1">Çfarë mbulohet</h3>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>Motori (blloku i motorit, kokat, komponentët e brendshëm)</li>
                      <li>Kutia e shpejtësive dhe transmisioni</li>
                      <li>Diferenciali dhe sistemi i lëvizjes</li>
                      <li>Sistemi i ftohjes dhe sistemi i karburantit</li>
                      <li>Komponentë elektrikë kryesorë (alternatori, startuesi, ECU)</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="font-semibold text-foreground mb-1">Çfarë nuk mbulohet</h3>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>Pjesët konsumuese (frena, disqe, vajra, filtra, gomat)</li>
                      <li>Zhurma, dridhje ose konsum normal</li>
                      <li>Dëme nga aksidente, përmbytje, modifikime ose pakujdesi</li>
                      <li>Shërbime rutinë dhe mirëmbajtje periodike</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="font-semibold text-foreground mb-1">Kushtet</h3>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>Garancioni është i vlefshëm vetëm me mirëmbajtje të rregullt</li>
                      <li>Çdo riparim duhet të miratohet paraprakisht nga KORAUTO</li>
                      <li>Afati dhe mbulimi mund të ndryshojnë sipas automjetit</li>
                    </ul>
                  </div>

                  <div className="pt-1">
                    <Button variant="outline" onClick={() => window.open("/garancioni", "_blank")}>
                      Shiko faqen e plotë të garancionit
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="exterior" className="space-y-4">
              <Card className="shadow-md border-border/80">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <Shield className="h-5 w-5 text-primary" />
                    <CardTitle className="text-xl">Gjendja e Jashtme dhe Karrocerisë</CardTitle>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Përmbledhje e informacionit të jashtëm dhe historisë së automjetit
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <section className="space-y-3">
                    <h3 className="text-base font-semibold text-foreground">Info gjenerale të veturës</h3>
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {generalVehicleInfo.map((item) => (
                        <div
                          key={item.label}
                          className="flex flex-col gap-1 rounded-lg border border-border/60 bg-muted/40 p-2.5"
                        >
                          <span className="text-xs uppercase tracking-wide text-muted-foreground">
                            {item.label}
                          </span>
                          <span className="text-sm font-semibold text-foreground">{item.value || "-"}</span>
                        </div>
                      ))}
                    </div>
                  </section>

                  <section className="space-y-3">
                    <h3 className="text-base font-semibold text-foreground">Historia e përdorimit të veturës</h3>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {usageHighlights.map((item) => (
                        <div
                          key={item.label}
                          className="flex flex-col gap-1 rounded-lg border border-border/60 bg-muted/30 p-2.5"
                        >
                          <span className="text-xs uppercase tracking-wide text-muted-foreground">
                            {item.label}
                          </span>
                          <span className="text-sm font-semibold text-foreground">{item.value}</span>
                        </div>
                      ))}
                    </div>
                    {usageHistoryList.length > 0 && (
                      <div className="space-y-2">
                        {usageHistoryList.map((entry, index) => (
                          <div
                            key={`${entry.description || "usage"}-${index}`}
                            className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border/40 bg-background/60 px-2.5 py-1.5 text-sm"
                          >
                            <span className="font-medium text-foreground">
                              {entry.description || "Përdorim"}
                            </span>
                            <span className="text-muted-foreground">{entry.value || "-"}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </section>

                  <section className="space-y-3">
                    <h3 className="text-base font-semibold text-foreground">Historia e ndërrimit të pronarëve</h3>
                    {ownerChangesList.length > 0 ? (
                      <div className="space-y-3">
                        {ownerChangesList.map((change, index) => (
                          <div
                            key={`${change?.change_type || "owner"}-${index}`}
                            className="rounded-lg border border-border/60 bg-muted/40 p-2.5 text-sm space-y-2"
                          >
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <span className="font-semibold text-foreground">
                                {change?.change_type || "Ndryshim pronari"}
                              </span>
                              {change?.date && (
                                <Badge variant="outline" className="text-xs">
                                  {formatDisplayDate(change.date) ?? change.date}
                                </Badge>
                              )}
                            </div>
                            {change?.usage_type && (
                              <p className="text-xs text-muted-foreground">
                                Përdorim: {change.usage_type}
                              </p>
                            )}
                            {change?.previous_number && (
                              <p className="text-xs text-muted-foreground">
                                Numri paraprak: {change.previous_number}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        Nuk ka informata për ndërrimin e pronarëve.
                      </p>
                    )}
                  </section>

                  <section className="space-y-3">
                    <h3 className="text-base font-semibold text-foreground">Historia e aksidenteve të veçanta</h3>
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                      {specialAccidentStats.map((item) => (
                        <div
                          key={item.label}
                          className="flex flex-col gap-1 rounded-lg border border-border/60 bg-muted/30 p-2.5"
                        >
                          <span className="text-xs uppercase tracking-wide text-muted-foreground">
                            {item.label}
                          </span>
                          <span className="text-sm font-semibold text-foreground">{item.value}</span>
                        </div>
                      ))}
                    </div>
                    {specialAccidentHistory.length > 0 && (
                      <div className="space-y-2">
                        {specialAccidentHistory.map((entry, index) => (
                          <div
                            key={`${entry?.type || "event"}-${index}`}
                            className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border/40 bg-background/60 px-2.5 py-1.5 text-sm"
                          >
                            <span className="font-medium text-foreground">
                              {entry?.type || "Ngjarje"}
                            </span>
                            <span className="text-muted-foreground">{entry?.value || "-"}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {insuranceCarInfo && (
                      <div className="space-y-2">
                        {[
                          { label: "Historia e aksidenteve", value: insuranceCarInfo.accident_history },
                          { label: "Riparime të regjistruara", value: insuranceCarInfo.repair_count },
                          { label: "Humbje totale", value: insuranceCarInfo.total_loss },
                          {
                            label: "Dëmtime nga uji",
                            value: insuranceCarInfo.flood_damage
                              ? processFloodDamageText(insuranceCarInfo.flood_damage)
                              : undefined,
                          },
                        ]
                          .filter((item) => item.value)
                          .map((item) => (
                            <div
                              key={item.label}
                              className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border/40 bg-background/60 px-3 py-2 text-sm"
                            >
                              <span className="font-medium text-foreground">{item.label}</span>
                              <span className="text-muted-foreground">{item.value}</span>
                            </div>
                          ))}
                      </div>
                    )}
                  </section>
                </CardContent>
              </Card>

              {car.damage && (car.damage.main || car.damage.second) && (
                <Card className="shadow-md border-border/80">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <AlertTriangle className="h-5 w-5 text-primary" />
                      <CardTitle className="text-xl">Dëmtimet e raportuara</CardTitle>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Vlerësimi i dëmtimeve të evidentuara nga inspektimi
                    </p>
                  </CardHeader>
                  <CardContent className="grid gap-3 md:grid-cols-2">
                    {car.damage?.main && (
                      <div className="p-3 rounded-lg border border-border/60 bg-muted/40">
                        <h3 className="text-sm font-semibold text-foreground mb-1">Dëmtimi kryesor</h3>
                        <p className="text-sm text-muted-foreground capitalize">{car.damage.main}</p>
                      </div>
                    )}
                    {car.damage?.second && (
                      <div className="p-3 rounded-lg border border-border/60 bg-muted/40">
                        <h3 className="text-sm font-semibold text-foreground mb-1">Dëmtimi dytësor</h3>
                        <p className="text-sm text-muted-foreground capitalize">{car.damage.second}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              <Card className="shadow-md border-border/80">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="h-5 w-5 text-primary" />
                    <CardTitle className="text-xl">Historia e aksidenteve</CardTitle>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Detaje të aksidenteve të raportuara për automjetin
                  </p>
                </CardHeader>
                <CardContent>
                  {hasAccidentDetails ? (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-border/60 text-sm">
                        <thead className="bg-muted/50">
                          <tr>
                            {[
                              "Data",
                              "Pjesa",
                              "Ngjyrosja",
                              "Punë dore",
                              "Total",
                            ].map((header) => (
                              <th
                                key={header}
                                scope="col"
                                className="px-2.5 py-1.5 text-left font-semibold uppercase tracking-wide text-xs text-muted-foreground"
                              >
                                {header}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/40">
                          {accidentEntries.map((entry, index) => (
                            <tr key={`accident-${index}`} className="bg-background/80">
                              <td className="px-2.5 py-1.5 whitespace-nowrap text-foreground">{entry.date}</td>
                              <td className="px-2.5 py-1.5 text-muted-foreground">{entry.part}</td>
                              <td className="px-2.5 py-1.5 text-muted-foreground">{entry.paint}</td>
                              <td className="px-2.5 py-1.5 text-muted-foreground">{entry.labor}</td>
                              <td className="px-2.5 py-1.5 text-muted-foreground">{entry.total}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="py-4 text-sm text-muted-foreground text-center">
                      Nuk ka inspektim për aksidente të raportuara.
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="mechanical" className="space-y-6">
              {inspectionInnerData ? (
                <Card className="shadow-md border-border/80">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <Cog className="h-5 w-5 text-primary" />
                      <CardTitle className="text-xl">Motori dhe Sistemi Mekanik</CardTitle>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Kontrolli teknik i komponentëve kryesorë të automjetit
                    </p>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-2 grid-cols-2 sm:grid-cols-2 lg:grid-cols-3">
                      {Object.entries(inspectionInnerData).map(([key, value]) => {
                        const positive = isPositiveStatus(value);
                        return (
                          <div
                            key={key}
                            className={`p-2 sm:p-3 rounded-lg border text-xs sm:text-sm ${
                              positive
                                ? "border-emerald-400/40 bg-emerald-50/60 dark:bg-emerald-500/10"
                                : "border-red-400/40 bg-red-50/60 dark:bg-red-500/10"
                            }`}
                          >
                            <span className="font-semibold text-foreground block mb-0.5 sm:mb-1 truncate">
                              {formatKeyLabel(key)}
                            </span>
                            <p className={`font-medium ${positive ? "text-emerald-700" : "text-red-700"}`}>
                              {translateStatusValue(value)}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card className="shadow-md border-border/80">
                  <CardContent className="py-10 text-center text-muted-foreground">
                    Nuk ka të dhëna të detajuara teknike të disponueshme.
                  </CardContent>
                </Card>
              )}

              {car.maintenanceHistory && car.maintenanceHistory.length > 0 && (
                <Card className="shadow-md border-border/80">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <Clock className="h-5 w-5 text-primary" />
                      <CardTitle className="text-xl">Historia e Mirëmbajtjes</CardTitle>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Shërbimet dhe mirëmbajtjet e regjistruara për automjetin
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {car.maintenanceHistory.map((record: any, index: number) => (
                      <Card key={index} className="border border-border/60 bg-muted/40">
                        <CardContent className="pt-4 space-y-2 text-sm text-muted-foreground">
                          <div className="flex flex-wrap justify-between gap-2">
                            <div className="font-semibold text-foreground">
                              {record.service_type || record.type || "Shërbim i përgjithshëm"}
                            </div>
                            {record.date && (
                              <Badge variant="outline" className="text-xs">
                                {record.date}
                              </Badge>
                            )}
                          </div>
                          {record.description && <p>{record.description}</p>}
                          {record.mileage && (
                            <p className="text-xs">
                              Kilometrazh: <span className="font-medium">{record.mileage}</span>
                            </p>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>

          <Separator />

          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-1 text-sm text-muted-foreground">
              <p>
                Për informacione shtesë ose pyetje, kontaktoni ekipin tonë të inspektimit.
              </p>
            </div>
            <Button
              size="lg"
              className="bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={() => navigate(`/car/${car.lot || lot}`)}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Kthehu te faqja e makinës
            </Button>
          </div>
        </div>
    </div>
  );
};

export default CarInspectionReport;
