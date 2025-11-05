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
  Users,
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
    const data =
      car?.details?.inspect_outer ||
      car?.inspect?.outer ||
      car?.inspect?.inspect_outer ||
      [];

    return Array.isArray(data) ? data : [];
  }, [car]);

  const inspectionInnerData = useMemo(() => {
    const data =
      car?.details?.inspect?.inner ||
      car?.inspect?.inner ||
      car?.details?.inspect_inner ||
      null;

    if (!data || typeof data !== "object") {
      return null;
    }

    return data as Record<string, unknown>;
  }, [car]);

  const insuranceCarInfo = car?.details?.insurance?.car_info;

  const accidents = useMemo(() => {
    if (!car?.insurance_v2?.accidents) return [];
    if (Array.isArray(car.insurance_v2.accidents)) {
      return car.insurance_v2.accidents;
    }
    return [];
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

  const carName = `${car.year || ""} ${car.make || ""} ${car.model || ""}`.trim();
  const formattedPrice = car.priceEUR
    ? `${car.priceEUR.toLocaleString("de-DE")} €`
    : undefined;
  const formattedMileage = car.mileageKm
    ? formatMileage(car.mileageKm)
    : car.odometer?.km
      ? formatMileage(car.odometer.km)
      : undefined;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="bg-muted/30 border-b border-border">
        <div className="container-responsive py-6 flex flex-col gap-4">
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
            <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
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

      <div className="container-responsive py-10 space-y-8">
        {car.image && (
          <Card className="overflow-hidden shadow-md">
            <div className="aspect-video bg-muted">
              <img
                src={car.image}
                alt={carName || car.title || "Foto e automjetit"}
                className="h-full w-full object-cover"
                loading="lazy"
              />
            </div>
          </Card>
        )}

        <Tabs defaultValue="diagram" className="space-y-6">
          <TabsList className="grid grid-cols-1 md:grid-cols-3 gap-2 bg-muted/60 p-1 rounded-xl">
            <TabsTrigger value="diagram" className="text-sm md:text-base">
              Diagrami i Inspektimit të Automjetit
            </TabsTrigger>
            <TabsTrigger value="exterior" className="text-sm md:text-base">
              Gjendja e Jashtme dhe Karocerisë
            </TabsTrigger>
            <TabsTrigger value="mechanical" className="text-sm md:text-base">
              Motori dhe Sistemi Mekanik
            </TabsTrigger>
          </TabsList>

          <TabsContent value="diagram" className="space-y-6">
            <Card className="shadow-lg">
              <CardHeader className="flex flex-col gap-1">
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
              <CardContent className="space-y-6">
                {inspectionOuterData && inspectionOuterData.length > 0 ? (
                  <div className="space-y-6">
                    <CarInspectionDiagram
                      inspectionData={inspectionOuterData}
                      className="mx-auto"
                    />

                    <div className="grid gap-4 md:grid-cols-2">
                      {inspectionOuterData.map((item: any, index: number) => (
                        <Card key={`${item?.type?.code || index}-summary`} className="border-border/80">
                          <CardHeader className="pb-2">
                            <div className="flex items-center gap-3">
                              <Wrench className="h-4 w-4 text-primary" />
                              <CardTitle className="text-base font-semibold">
                                {item?.type?.title || "Pjesë e karocerisë"}
                              </CardTitle>
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-3">
                            {item?.statusTypes?.length > 0 && (
                              <div className="flex flex-wrap gap-2">
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
                                    <CheckCircle className="h-3.5 w-3.5 text-muted-foreground mt-1" />
                                    <span>{attribute}</span>
                                  </li>
                                ))}
                              </ul>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-3 py-10 text-center text-muted-foreground">
                    <Shield className="h-8 w-8" />
                    <p>Nuk ka të dhëna për diagramin e inspektimit vizual.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="exterior" className="space-y-6">
            {car.insurance_v2 && (
              <Card className="shadow-md border-border/80">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <Shield className="h-5 w-5 text-primary" />
                    <CardTitle className="text-xl">Historia e Sigurisë & Sigurimit</CardTitle>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Të dhënat e aksidenteve, pronarëve dhe demtimeve të raportuara nga siguracioni
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {typeof car.insurance_v2.accidentCnt === "number" && (
                      <div className="p-4 rounded-lg border border-border/60 bg-muted/40">
                        <span className="text-sm font-semibold text-foreground block mb-1">
                          Aksidente
                        </span>
                        <Badge
                          variant={car.insurance_v2.accidentCnt === 0 ? "secondary" : "destructive"}
                          className="text-sm"
                        >
                          {car.insurance_v2.accidentCnt === 0
                            ? "E pastër"
                            : `${car.insurance_v2.accidentCnt} raste`}
                        </Badge>
                      </div>
                    )}
                    {typeof car.insurance_v2.ownerChangeCnt === "number" && (
                      <div className="p-4 rounded-lg border border-border/60 bg-muted/40">
                        <span className="text-sm font-semibold text-foreground block mb-1">
                          Ndryshime pronësie
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {car.insurance_v2.ownerChangeCnt}
                        </span>
                      </div>
                    )}
                    {typeof car.insurance_v2.totalLossCnt === "number" && (
                      <div className="p-4 rounded-lg border border-border/60 bg-muted/40">
                        <span className="text-sm font-semibold text-foreground block mb-1">
                          Humbje totale
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {car.insurance_v2.totalLossCnt}
                        </span>
                      </div>
                    )}
                    {typeof car.insurance_v2.floodTotalLossCnt === "number" && (
                      <div className="p-4 rounded-lg border border-border/60 bg-muted/40">
                        <span className="text-sm font-semibold text-foreground block mb-1">
                          Dëmtime nga përmbytjet
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {car.insurance_v2.floodTotalLossCnt}
                        </span>
                      </div>
                    )}
                  </div>

                  {accidents.length > 0 && (
                    <div className="mt-6 space-y-3">
                      <h3 className="text-base font-semibold text-foreground">
                        Aksidente të raportuara
                      </h3>
                      <div className="grid gap-3 md:grid-cols-2">
                        {accidents.map((accident: any, idx: number) => (
                          <Card key={idx} className="border border-border/60 bg-background">
                            <CardContent className="pt-4 space-y-2 text-sm text-muted-foreground">
                              {accident.date && (
                                <div>
                                  <span className="font-medium text-foreground">Data:</span> {accident.date}
                                </div>
                              )}
                              {accident.type && (
                                <div>
                                  <span className="font-medium text-foreground">Lloji:</span> {accident.type}
                                </div>
                              )}
                              {accident.note && <p>{accident.note}</p>}
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {car.damage && (car.damage.main || car.damage.second) && (
              <Card className="shadow-md border-border/80">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="h-5 w-5 text-primary" />
                    <CardTitle className="text-xl">
                      Gjendja e Jashtme dhe Karocerisë
                    </CardTitle>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Vlerësimi i dëmtimeve dhe riparime të mundshme
                  </p>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-2">
                  {car.damage?.main && (
                    <div className="p-4 rounded-lg border border-border/60 bg-muted/40">
                      <h3 className="text-sm font-semibold text-foreground mb-1">
                        Dëmtimi kryesor
                      </h3>
                      <p className="text-sm text-muted-foreground capitalize">
                        {car.damage.main}
                      </p>
                    </div>
                  )}
                  {car.damage?.second && (
                    <div className="p-4 rounded-lg border border-border/60 bg-muted/40">
                      <h3 className="text-sm font-semibold text-foreground mb-1">
                        Dëmtimi dytësor
                      </h3>
                      <p className="text-sm text-muted-foreground capitalize">
                        {car.damage.second}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {insuranceCarInfo && (
              <Card className="shadow-md border-border/80">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <Shield className="h-5 w-5 text-primary" />
                    <CardTitle className="text-xl">Detaje nga siguracioni</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-2">
                  {insuranceCarInfo.accident_history && (
                    <div className="p-4 rounded-lg border border-border/60 bg-muted/40">
                      <h3 className="text-sm font-semibold text-foreground mb-1">
                        Historia e aksidenteve
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {insuranceCarInfo.accident_history}
                      </p>
                    </div>
                  )}
                  {insuranceCarInfo.repair_count && (
                    <div className="p-4 rounded-lg border border-border/60 bg-muted/40">
                      <h3 className="text-sm font-semibold text-foreground mb-1">
                        Riparime të regjistruara
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {insuranceCarInfo.repair_count}
                      </p>
                    </div>
                  )}
                  {insuranceCarInfo.total_loss && (
                    <div className="p-4 rounded-lg border border-border/60 bg-muted/40">
                      <h3 className="text-sm font-semibold text-foreground mb-1">
                        Humbje totale
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {insuranceCarInfo.total_loss}
                      </p>
                    </div>
                  )}
                  {insuranceCarInfo.flood_damage && (
                    <div className="p-4 rounded-lg border border-border/60 bg-muted/40">
                      <h3 className="text-sm font-semibold text-foreground mb-1">
                        Dëmtime nga uji
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {processFloodDamageText(insuranceCarInfo.flood_damage)}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {car.ownerChanges && car.ownerChanges.length > 0 && (
              <Card className="shadow-md border-border/80">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <Users className="h-5 w-5 text-primary" />
                    <CardTitle className="text-xl">Historia e pronësisë</CardTitle>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Ndryshimet e pronarëve gjatë kohës
                  </p>
                </CardHeader>
                <CardContent className="space-y-3">
                  {car.ownerChanges.map((change: any, index: number) => (
                    <Card key={index} className="border border-border/60 bg-muted/40">
                      <CardContent className="pt-4 text-sm text-muted-foreground">
                        <div className="flex flex-wrap justify-between gap-2">
                          <div>
                            <span className="font-semibold text-foreground">
                              {change.change_type}
                            </span>
                            {change.usage_type && (
                              <p className="text-xs mt-1">Lloji: {change.usage_type}</p>
                            )}
                          </div>
                          {change.date && (
                            <Badge variant="outline" className="text-xs">
                              {change.date}
                            </Badge>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </CardContent>
              </Card>
            )}
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
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {Object.entries(inspectionInnerData).map(([key, value]) => {
                      const positive = isPositiveStatus(value);
                      return (
                        <div
                          key={key}
                          className={`p-4 rounded-lg border ${
                            positive
                              ? "border-emerald-400/40 bg-emerald-50/60 dark:bg-emerald-500/10"
                              : "border-red-400/40 bg-red-50/60 dark:bg-red-500/10"
                          }`}
                        >
                          <span className="text-sm font-semibold text-foreground block mb-1">
                            {formatKeyLabel(key)}
                          </span>
                          <p
                            className={`text-sm font-medium ${
                              positive ? "text-emerald-700" : "text-red-700"
                            }`}
                          >
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
              Ky raport përmbledh të gjitha të dhënat e disponueshme nga API për automjetin.
            </p>
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
