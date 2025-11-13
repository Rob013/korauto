import React, {
  useState,
  memo,
  useCallback,
  useMemo,
  useEffect,
  useRef,
  useTransition,
} from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AdaptiveSelect } from "@/components/ui/adaptive-select";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Filter,
  X,
  Loader2,
  Search,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  Car,
  Calendar,
  Palette,
  Fuel,
  Settings,
  MapPin,
  DollarSign,
  Cog,
  Gauge,
  Users,
  Check,
} from "lucide-react";
import {
  COLOR_OPTIONS,
  FUEL_TYPE_OPTIONS,
  TRANSMISSION_OPTIONS,
  BODY_TYPE_OPTIONS,
} from "@/constants/carOptions";
import { useGenerations } from "@/hooks/useFiltersData";
import {
  APIFilters,
  sortManufacturers,
  generateYearRange,
  generateYearPresets,
  isStrictFilterMode,
} from "@/utils/catalog-filter";
import { mergeFilterUpdates, areFiltersEqual } from "@/utils/filterState";
import { sortBrandsWithPriority } from "@/utils/brandOrdering";
import { formatModelName } from "@/utils/modelNameFormatter";
import { getBrandLogo } from "@/data/brandLogos";

interface Manufacturer {
  id: number;
  name: string;
  car_count?: number;
  cars_qty?: number;
  image?: string;
}

interface Model {
  id: number;
  name: string;
  car_count?: number;
  cars_qty?: number;
}

interface FilterCounts {
  manufacturers: { [key: string]: number };
  models: { [key: string]: number };
  colors: { [key: string]: number };
  fuelTypes: { [key: string]: number };
  transmissions: { [key: string]: number };
  years: { [key: string]: number };
}

interface EncarStyleFilterProps {
  filters: APIFilters;
  manufacturers: Manufacturer[];
  models?: Model[];
  engineVariants?: Array<{ value: string; label: string; count: number }>;
  engineVariantsLoading?: boolean;
  filterCounts?: FilterCounts;
  onFiltersChange: (filters: any) => void;
  onClearFilters: () => void;
  onManufacturerChange?: (manufacturerId: string) => void;
  onModelChange?: (modelId: string) => void;
  showAdvanced?: boolean;
  onToggleAdvanced?: () => void;
  loadingCounts?: boolean;
  onFetchGrades?: (
    manufacturerId?: string,
    modelId?: string,
  ) => Promise<{ value: string; label: string; count?: number }[]>;
  onFetchTrimLevels?: (
    manufacturerId?: string,
    modelId?: string,
  ) => Promise<{ value: string; label: string; count?: number }[]>;
  isHomepage?: boolean;
  compact?: boolean;
  onSearchCars?: () => void;
  onCloseFilter?: () => void;
}

type MobileDrawerType =
  | "manufacturer"
  | "model"
  | "grade"
  | "engine"
  | "trim"
  | "year"
  | "color"
  | "fuel"
  | "transmission"
  | "body"
  | "seats";

const EncarStyleFilter = memo<EncarStyleFilterProps>(
  ({
    filters,
    manufacturers,
    models = [],
      engineVariants = [],
      engineVariantsLoading = false,
    filterCounts,
    loadingCounts = false,
    onFiltersChange,
    onClearFilters,
    onManufacturerChange,
    onModelChange,
    showAdvanced = false,
    onToggleAdvanced,
    onFetchGrades,
    onFetchTrimLevels,
    isHomepage = false,
    compact = false,
    onSearchCars,
    onCloseFilter,
  }) => {
    const [trimLevels, setTrimLevels] = useState<
      { value: string; label: string; count?: number }[]
    >([]);
    const [isLoading, setIsLoading] = useState(false);
    const loadingTimerRef = useRef<number | null>(null);
    const [activeMobileDrawer, setActiveMobileDrawer] =
      useState<MobileDrawerType | null>(null);
    const [pendingYearRange, setPendingYearRange] = useState<{
      from: string;
      to: string;
    }>({ from: "", to: "" });
    const [isPending, startTransition] = useTransition();

    // Load generations from Supabase/Lovable cache with API fallback
    const { data: generationsData, isLoading: isLoadingGenerations } =
      useGenerations(filters.model_id, filters.manufacturer_id);

    const generations = useMemo(() => {
      if (!generationsData || !Array.isArray(generationsData)) return [];
      return generationsData.map((generation: any) => ({
        value: generation.id,
        label: generation.name,
        count: generation.car_count,
      }));
    }, [generationsData]);

    // Show loading only if the update actually takes longer than a threshold to avoid flicker.
    const startLoadingWithDelay = useCallback((delayMs: number = 180) => {
      if (loadingTimerRef.current) {
        window.clearTimeout(loadingTimerRef.current);
        loadingTimerRef.current = null;
      }
      loadingTimerRef.current = window.setTimeout(() => {
        setIsLoading(true);
      }, delayMs);
    }, []);

    const stopLoading = useCallback(() => {
      if (loadingTimerRef.current) {
        window.clearTimeout(loadingTimerRef.current);
        loadingTimerRef.current = null;
      }
      setIsLoading(false);
    }, []);

    const [expandedSections, setExpandedSections] = useState<string[]>(
      compact ? ["basic"] : ["basic", "advanced"],
    );

    useEffect(() => {
      if (activeMobileDrawer === "year") {
        setPendingYearRange({
          from: filters.from_year || "",
          to: filters.to_year || "",
        });
      }
    }, [activeMobileDrawer, filters.from_year, filters.to_year]);

    // Track if strict filtering mode is enabled - using utility
    const isStrictMode = useMemo(() => isStrictFilterMode(filters), [filters]);

    const applyFiltersIfChanged = useCallback(
      (updates: Partial<APIFilters>) => {
        const nextFilters = mergeFilterUpdates(filters, updates);

        if (areFiltersEqual(filters, nextFilters)) {
          return false;
        }

        startLoadingWithDelay();
        startTransition(() => {
          onFiltersChange(nextFilters);
        });
        return true;
      },
      [filters, onFiltersChange, startLoadingWithDelay, startTransition],
    );

    useEffect(() => {
      stopLoading();
    }, [filters, stopLoading]);

    useEffect(() => {
      if (!isPending) {
        stopLoading();
      }
    }, [isPending, stopLoading]);

    useEffect(() => () => stopLoading(), [stopLoading]);

    const updateFilter = useCallback(
      (key: string, value: string) => {
        const actualValue =
          value === "all" || value === "any" ? undefined : value;

        if (key === "manufacturer_id") {
          const changed = applyFiltersIfChanged({
            manufacturer_id: actualValue,
            model_id: undefined,
            generation_id: undefined,
            grade_iaai: undefined,
            engine_spec: undefined,
            trim_level: undefined,
          });

          if (changed) {
            onManufacturerChange?.(actualValue || "");
          }
          return;
        }

        if (key === "model_id") {
          const changed = applyFiltersIfChanged({
            model_id: actualValue,
            generation_id: undefined,
            grade_iaai: undefined,
            engine_spec: undefined,
            trim_level: undefined,
          });

          if (changed) {
            onModelChange?.(actualValue || "");
          }
          return;
        }

        applyFiltersIfChanged({ [key]: actualValue } as Partial<APIFilters>);
      },
      [applyFiltersIfChanged, onManufacturerChange, onModelChange],
    );

    const handleSearchClick = useCallback(() => {
      if (onSearchCars) {
        onSearchCars();
      } else if (isHomepage) {
        const searchParams = new URLSearchParams();
        Object.entries(filters).forEach(([key, value]) => {
          if (value && value !== "") {
            searchParams.set(key, value);
          }
        });
        window.location.href = `/catalog?${searchParams.toString()}`;
      }
    }, [onSearchCars, isHomepage, filters]);

    const handleYearRangePreset = useCallback(
      (preset: { label: string; from: number; to: number }) => {
        applyFiltersIfChanged({
          from_year: preset.from.toString(),
          to_year: preset.to.toString(),
        });
      },
      [applyFiltersIfChanged],
    );

    const currentYear = useMemo(() => new Date().getFullYear(), []);
    const years = useMemo(() => generateYearRange(currentYear), [currentYear]);
    const yearRangePresets = useMemo(
      () => generateYearPresets(currentYear),
      [currentYear],
    );

    const yearOptions = useMemo(
      () => [
        ...(isStrictMode && (filters.from_year || filters.to_year)
          ? []
          : [{ value: "all", label: "Të gjithë vitet" }]),
        ...years.map((year) => ({
          value: year.toString(),
          label: year.toString(),
        })),
      ],
      [years, isStrictMode, filters.from_year, filters.to_year],
    );

    const {
      sorted: prioritizedManufacturers,
      priorityCount: prioritizedManufacturerCount,
    } = useMemo(() => {
      const excludedBrands = [
        "mitsubishi",
        "alfa romeo",
        "alfa-romeo",
        "acura",
        "mazda",
        "dongfeng",
        "lotus",
      ];
      const baseList = sortManufacturers(manufacturers).filter(
        (manufacturer) =>
          !excludedBrands.includes((manufacturer.name || "").toLowerCase()),
      );
      return sortBrandsWithPriority(baseList);
    }, [manufacturers]);

    const manufacturerOptions = useMemo(() => {
      const options = prioritizedManufacturers.map(
        (manufacturer: Manufacturer) => {
          const fallbackLogo =
            getBrandLogo(manufacturer.name) ||
            `https://auctionsapi.com/images/brands/${manufacturer.name}.svg`;
          const logoUrl = manufacturer.image || fallbackLogo;
          return {
            value: manufacturer.id.toString(),
            label: (
              <div className="flex items-center gap-2 py-1">
                <img
                  src={logoUrl}
                  alt={manufacturer.name}
                  className="w-6 h-6 object-contain flex-shrink-0 rounded bg-white dark:bg-white p-0.5 ring-1 ring-border"
                  loading="eager"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
                <span className="font-medium text-sm">
                  {manufacturer.name} (
                  {manufacturer.cars_qty || manufacturer.car_count || 0})
                </span>
              </div>
            ),
            icon: logoUrl,
          };
        },
      );

      if (
        prioritizedManufacturerCount > 0 &&
        prioritizedManufacturerCount < options.length
      ) {
        return [
          ...options.slice(0, prioritizedManufacturerCount),
          {
            value: "separator-priority-brands",
            label: "Të tjerët",
            disabled: true,
          },
          ...options.slice(prioritizedManufacturerCount),
        ];
      }

      return options;
    }, [prioritizedManufacturers, prioritizedManufacturerCount]);

    const manufacturerSelectOptions = useMemo(() => {
      if (!(isStrictMode && filters.manufacturer_id)) {
        return [
          { value: "all", label: "Të gjitha markat" },
          ...manufacturerOptions,
        ];
      }
      return manufacturerOptions;
    }, [isStrictMode, filters.manufacturer_id, manufacturerOptions]);

    const manufacturerCounts = filterCounts?.manufacturers ?? {};
    const modelCounts = filterCounts?.models ?? {};
    const colorCounts = filterCounts?.colors ?? {};
    const fuelCounts = filterCounts?.fuelTypes ?? {};
    const transmissionCounts = filterCounts?.transmissions ?? {};

    const selectedManufacturer = useMemo(
      () =>
        manufacturers.find(
          (manufacturer) =>
            manufacturer.id.toString() === filters.manufacturer_id,
        ),
      [manufacturers, filters.manufacturer_id],
    );

    const selectedModel = useMemo(
      () => models.find((model) => model.id.toString() === filters.model_id),
      [models, filters.model_id],
    );

    const normalizedModels = useMemo(() => {
      const manufacturerName = selectedManufacturer?.name;
      return models.map((model) => ({
        id: model.id.toString(),
        label: formatModelName(model.name, manufacturerName),
        rawName: model.name,
        count: model.cars_qty || model.car_count || 0,
      }));
    }, [models, selectedManufacturer?.name]);

    const popularModels = useMemo(() => {
      return [...normalizedModels]
        .filter((model) => model.count > 0)
        .sort((a, b) => b.count - a.count)
        .slice(0, 6);
    }, [normalizedModels]);

    const alphabeticalModels = useMemo(() => {
      return [...normalizedModels].sort((a, b) =>
        a.label.localeCompare(b.label),
      );
    }, [normalizedModels]);

    const selectedModelLabel = useMemo(() => {
      const found = normalizedModels.find(
        (model) => model.id === filters.model_id,
      );
      return found?.label;
    }, [normalizedModels, filters.model_id]);

    const selectedGeneration = useMemo(
      () =>
        generations.find(
          (generation) =>
            generation.value?.toString() === filters.generation_id,
        ),
      [generations, filters.generation_id],
    );

    const selectedEngine = useMemo(
      () =>
        engineVariants.find(
          (engine) => engine.value?.toString() === (filters as any).engine_spec,
        ),
      [engineVariants, filters],
    );

    const selectedTrim = useMemo(
      () =>
        trimLevels.find(
          (trim) => trim.value?.toString() === filters.trim_level,
        ),
      [trimLevels, filters.trim_level],
    );

    const colorEntries = useMemo(
      () =>
        Object.entries(COLOR_OPTIONS).map(([name, id]) => ({
          id: id.toString(),
          label: name.charAt(0).toUpperCase() + name.slice(1).replace("_", " "),
        })),
      [],
    );

    const fuelEntries = useMemo(
      () =>
        Object.entries(FUEL_TYPE_OPTIONS).map(([name, id]) => ({
          id: id.toString(),
          label: name.charAt(0).toUpperCase() + name.slice(1).replace("_", " "),
        })),
      [],
    );

    const transmissionEntries = useMemo(
      () =>
        Object.entries(TRANSMISSION_OPTIONS).map(([name, id]) => ({
          id: id.toString(),
          label: name.charAt(0).toUpperCase() + name.slice(1).replace("_", " "),
        })),
      [],
    );

    const bodyTypeEntries = useMemo(
      () =>
        Object.entries(BODY_TYPE_OPTIONS).map(([name, id]) => ({
          id: id.toString(),
          label: name.charAt(0).toUpperCase() + name.slice(1).replace("_", " "),
        })),
      [],
    );

    const seatEntries = useMemo(
      () =>
        [2, 4, 5, 6, 7, 8].map((seats) => ({
          id: seats.toString(),
          label: `${seats} ulëse`,
        })),
      [],
    );

    const selectedColor = useMemo(
      () => colorEntries.find((color) => color.id === (filters.color || "")),
      [colorEntries, filters.color],
    );

    const selectedFuel = useMemo(
      () => fuelEntries.find((fuel) => fuel.id === (filters.fuel_type || "")),
      [fuelEntries, filters.fuel_type],
    );

    const selectedTransmission = useMemo(
      () =>
        transmissionEntries.find(
          (option) => option.id === (filters.transmission || ""),
        ),
      [transmissionEntries, filters.transmission],
    );

    const selectedBodyType = useMemo(
      () =>
        bodyTypeEntries.find(
          (option) => option.id === (filters.body_type || ""),
        ),
      [bodyTypeEntries, filters.body_type],
    );

    const selectedSeats = useMemo(
      () =>
        seatEntries.find((option) => option.id === (filters.seats_count || "")),
      [seatEntries, filters.seats_count],
    );

    // Grades are now fetched automatically via useGrades hook

    useEffect(() => {
      if (filters.manufacturer_id && filters.model_id && onFetchTrimLevels) {
        const timeoutId = setTimeout(() => {
          onFetchTrimLevels(filters.manufacturer_id, filters.model_id).then(
            (trimData) => {
              if (Array.isArray(trimData)) {
                setTrimLevels(trimData);
              }
            },
          );
        }, 300);

        return () => clearTimeout(timeoutId);
      } else {
        setTrimLevels([]);
      }
    }, [filters.manufacturer_id, filters.model_id, onFetchTrimLevels]);

    const toggleSection = (section: string) => {
      setExpandedSections((prev) =>
        prev.includes(section)
          ? prev.filter((s) => s !== section)
          : [...prev, section],
      );
    };

    const handleResetFilters = useCallback(() => {
      onClearFilters();
      setPendingYearRange({ from: "", to: "" });
      setActiveMobileDrawer(null);
    }, [onClearFilters]);

    // Compact mode for sidebar
    if (compact) {
      const yearSummary =
        filters.from_year && filters.to_year
          ? `${filters.from_year} - ${filters.to_year}`
          : filters.from_year
            ? `Nga ${filters.from_year}`
            : filters.to_year
              ? `Deri ${filters.to_year}`
              : "";

      const mileageFromValue =
        (filters as any).odometer_from_km ||
        (filters as any).mileage_from ||
        "";
      const mileageToValue =
        (filters as any).odometer_to_km || (filters as any).mileage_to || "";

      const priceFromValue = filters.buy_now_price_from || "";
      const priceToValue = filters.buy_now_price_to || "";

      const closeDrawer = () => setActiveMobileDrawer(null);
      const getCount = (
        counts: Record<string, number>,
        id?: string | number,
      ) => {
        if (id === undefined || id === null) return undefined;
        return counts[id as any] ?? counts[id.toString()];
      };

      const allManufacturersCount =
        typeof (filterCounts?.manufacturers as any)?.all === "number"
          ? (filterCounts?.manufacturers as any).all
          : undefined;

      const handleYearValueChange = (key: "from" | "to", value: string) => {
        setPendingYearRange((prev) => ({
          ...prev,
          [key]: value === "all" ? "" : value,
        }));
      };

      const isYearOptionSelected = (
        currentValue: string,
        optionValue: string,
      ) => {
        if (!currentValue) {
          return optionValue === "all";
        }
        return currentValue === optionValue;
      };

      const applyYearRange = () => {
        applyFiltersIfChanged({
          from_year: pendingYearRange.from || undefined,
          to_year: pendingYearRange.to || undefined,
        });
        closeDrawer();
      };

      const clearYearRange = () => {
        applyFiltersIfChanged({
          from_year: undefined,
          to_year: undefined,
        });
        setPendingYearRange({ from: "", to: "" });
        closeDrawer();
      };

      const FilterListItem = ({
        icon,
        label,
        value,
        placeholder,
        hint,
        onClick,
        disabled,
        loading,
      }: {
        icon: React.ReactNode;
        label: string;
        value?: string;
        placeholder: string;
        hint?: string;
        onClick?: () => void;
        disabled?: boolean;
        loading?: boolean;
      }) => (
        <button
          type="button"
          onClick={onClick}
          disabled={disabled}
          className={`flex w-full items-center justify-between gap-3 py-3 transition ${
            disabled ? "cursor-not-allowed opacity-50" : "active:scale-[0.99]"
          }`}
        >
          <div className="flex items-center gap-3 text-left">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-muted-foreground shadow-inner">
              {icon}
            </span>
            <div className="flex flex-col">
              <span className="text-sm font-semibold leading-tight">
                {label}
              </span>
              <span
                className={`text-xs leading-tight ${value ? "text-foreground" : "text-muted-foreground"}`}
              >
                {value || placeholder}
              </span>
              {hint && (
                <span className="text-[11px] text-muted-foreground">
                  {hint}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {loading && (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            )}
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </div>
        </button>
      );

      const OptionRow = ({
        label,
        description,
        count,
        selected,
        onClick,
        disabled,
        icon,
      }: {
        label: string;
        description?: string;
        count?: number;
        selected?: boolean;
        onClick: () => void;
        disabled?: boolean;
        icon?: string;
      }) => (
        <button
          type="button"
          disabled={disabled}
          onClick={onClick}
          className={`flex w-full items-center justify-between gap-3 rounded-2xl px-3 py-3 text-left transition-colors ${
            disabled
              ? "cursor-not-allowed opacity-60"
              : "hover:bg-muted/60 active:scale-[0.995]"
          } ${selected ? "bg-muted/60" : ""}`}
        >
          <div className="flex items-center gap-3">
            {icon && (
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-background shadow-inner ring-1 ring-border/60">
                <img
                  src={icon}
                  alt={label}
                  className="h-6 w-6 object-contain"
                  loading="lazy"
                  onError={(event) => {
                    event.currentTarget.style.display = "none";
                  }}
                />
              </span>
            )}
            <div className="flex flex-col">
              <span
                className={`text-sm font-medium ${selected ? "text-primary" : ""}`}
              >
                {label}
              </span>
              {description && (
                <span className="text-xs text-muted-foreground">
                  {description}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {typeof count === "number" && (
              <span className="text-xs font-medium text-muted-foreground">
                {count.toLocaleString("en-US")}
              </span>
            )}
            {selected && <Check className="h-4 w-4 text-primary" />}
          </div>
        </button>
      );

      const RangeInputCard = ({
        icon,
        label,
        fromKey,
        toKey,
        fromValue,
        toValue,
        fromPlaceholder,
        toPlaceholder,
        unit,
      }: {
        icon: React.ReactNode;
        label: string;
        fromKey: string;
        toKey: string;
        fromValue?: string;
        toValue?: string;
        fromPlaceholder?: string;
        toPlaceholder?: string;
        unit?: string;
      }) => (
        <div className="rounded-3xl border border-border/60 bg-card/70 px-4 py-4 shadow-sm backdrop-blur">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-muted-foreground shadow-inner">
                {icon}
              </span>
              <span className="text-sm font-semibold">{label}</span>
            </div>
            <span className="text-[11px] font-medium uppercase tracking-wide text-primary">
              Fut vlerat
            </span>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-[11px] font-medium uppercase text-muted-foreground">
                Nga
              </Label>
              <div className="relative">
                <Input
                  type="number"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  min={0}
                  placeholder={fromPlaceholder}
                  value={fromValue || ""}
                  onChange={(e) => updateFilter(fromKey, e.target.value)}
                  className="h-11 rounded-2xl border border-border/70 bg-background/80 px-4 text-sm font-semibold"
                />
                {unit && (
                  <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                    {unit}
                  </span>
                )}
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-[11px] font-medium uppercase text-muted-foreground">
                Deri
              </Label>
              <div className="relative">
                <Input
                  type="number"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  min={0}
                  placeholder={toPlaceholder}
                  value={toValue || ""}
                  onChange={(e) => updateFilter(toKey, e.target.value)}
                  className="h-11 rounded-2xl border border-border/70 bg-background/80 px-4 text-sm font-semibold"
                />
                {unit && (
                  <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                    {unit}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      );

      const renderDrawerHeader = (title: string) => (
        <DrawerHeader className="border-b px-4 pt-6 pb-3">
          <div className="flex items-center justify-between">
            <DrawerTitle className="text-base font-semibold">
              {title}
            </DrawerTitle>
            <DrawerClose asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full"
              >
                <X className="h-4 w-4" />
              </Button>
            </DrawerClose>
          </div>
        </DrawerHeader>
      );

      const renderDrawerContent = () => {
        if (!activeMobileDrawer) return null;

        if (activeMobileDrawer === "manufacturer") {
          const highlighted =
            prioritizedManufacturerCount > 0
              ? prioritizedManufacturers.slice(0, prioritizedManufacturerCount)
              : prioritizedManufacturers;
          const remaining =
            prioritizedManufacturerCount > 0
              ? prioritizedManufacturers.slice(prioritizedManufacturerCount)
              : [];

          return (
            <>
              {renderDrawerHeader("Zgjidh markën")}
              <ScrollArea className="max-h-[70vh] px-3 py-4">
                <div className="space-y-4 pb-4">
                  <div className="space-y-1">
                    <OptionRow
                      label="Të gjitha markat"
                      count={allManufacturersCount}
                      selected={!filters.manufacturer_id}
                      onClick={() => {
                        updateFilter("manufacturer_id", "all");
                        closeDrawer();
                      }}
                    />
                  </div>
                  {highlighted.length > 0 && (
                    <div className="space-y-1">
                      <p className="px-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                        Markat më të kërkuara
                      </p>
                      {highlighted.map((manufacturer) => (
                        <OptionRow
                          key={manufacturer.id}
                          label={manufacturer.name}
                          count={
                            getCount(manufacturerCounts, manufacturer.id) ??
                            manufacturer.cars_qty ??
                            manufacturer.car_count
                          }
                          selected={
                            filters.manufacturer_id ===
                            manufacturer.id.toString()
                          }
                          icon={
                            manufacturer.image ||
                            getBrandLogo(manufacturer.name) ||
                            undefined
                          }
                          onClick={() => {
                            updateFilter(
                              "manufacturer_id",
                              manufacturer.id.toString(),
                            );
                            closeDrawer();
                          }}
                        />
                      ))}
                    </div>
                  )}
                  {remaining.length > 0 && (
                    <div className="space-y-1">
                      <p className="px-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                        Markat tjera
                      </p>
                      {remaining.map((manufacturer) => (
                        <OptionRow
                          key={manufacturer.id}
                          label={manufacturer.name}
                          count={
                            getCount(manufacturerCounts, manufacturer.id) ??
                            manufacturer.cars_qty ??
                            manufacturer.car_count
                          }
                          selected={
                            filters.manufacturer_id ===
                            manufacturer.id.toString()
                          }
                          icon={
                            manufacturer.image ||
                            getBrandLogo(manufacturer.name) ||
                            undefined
                          }
                          onClick={() => {
                            updateFilter(
                              "manufacturer_id",
                              manufacturer.id.toString(),
                            );
                            closeDrawer();
                          }}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </ScrollArea>
            </>
          );
        }

        if (activeMobileDrawer === "model") {
          return (
            <>
              {renderDrawerHeader("Zgjidh modelin")}
              {!filters.manufacturer_id ? (
                <div className="px-4 py-10 text-center text-sm text-muted-foreground">
                  Zgjidhni një markë për të parë modelet përkatëse.
                </div>
              ) : (
                <ScrollArea className="max-h-[70vh] px-3 py-4">
                  <div className="space-y-4 pb-4">
                    <OptionRow
                      label="Të gjithë modelet"
                      selected={!filters.model_id}
                      onClick={() => {
                        updateFilter("model_id", "all");
                        closeDrawer();
                      }}
                    />
                    {popularModels.length > 0 && (
                      <div className="space-y-1">
                        <p className="px-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                          Modelet e preferuara
                        </p>
                        {popularModels.map((model) => (
                          <OptionRow
                            key={`popular-${model.id}`}
                            label={model.label}
                            count={
                              getCount(modelCounts, model.id) ?? model.count
                            }
                            selected={filters.model_id === model.id}
                            onClick={() => {
                              updateFilter("model_id", model.id);
                              closeDrawer();
                            }}
                          />
                        ))}
                      </div>
                    )}
                    <div className="space-y-1">
                      <p className="px-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                        Sipas alfabetit
                      </p>
                      {alphabeticalModels.map((model) => (
                        <OptionRow
                          key={`alphabet-${model.id}`}
                          label={model.label}
                          count={getCount(modelCounts, model.id) ?? model.count}
                          selected={filters.model_id === model.id}
                          onClick={() => {
                            updateFilter("model_id", model.id);
                            closeDrawer();
                          }}
                        />
                      ))}
                    </div>
                  </div>
                </ScrollArea>
              )}
            </>
          );
        }

        if (activeMobileDrawer === "grade") {
          return (
            <>
              {renderDrawerHeader("Zgjidh gjeneratën")}
              <ScrollArea className="max-h-[70vh] px-3 py-4">
                <div className="space-y-1 pb-4">
                  <OptionRow
                    label="Të gjitha gjeneratat"
                    selected={!filters.generation_id}
                    onClick={() => {
                      updateFilter("generation_id", "all");
                      closeDrawer();
                    }}
                  />
                  {isLoadingGenerations && (
                    <div className="px-2 py-3 text-xs text-muted-foreground">
                      Po ngarkohen gjeneratat…
                    </div>
                  )}
                  {!isLoadingGenerations && generations.length === 0 && (
                    <div className="px-2 py-3 text-xs text-muted-foreground">
                      Nuk ka gjenerata të disponueshme.
                    </div>
                  )}
                  {generations.map((generation) => (
                    <OptionRow
                      key={generation.value}
                      label={generation.label}
                      count={generation.count}
                      selected={
                        filters.generation_id === generation.value?.toString()
                      }
                      onClick={() => {
                        updateFilter(
                          "generation_id",
                          generation.value?.toString() || "all",
                        );
                        closeDrawer();
                      }}
                    />
                  ))}
                </div>
              </ScrollArea>
            </>
          );
        }

        if (activeMobileDrawer === "engine") {
          const hasEngines = engineVariants && engineVariants.length > 0;
          return (
            <>
              {renderDrawerHeader("Zgjidh motorin")}
              <ScrollArea className="max-h-[70vh] px-3 py-4">
                <div className="space-y-1 pb-4">
                  <OptionRow
                    label="Të gjithë motorët"
                    selected={!(filters as any).engine_spec}
                    onClick={() => {
                      updateFilter("engine_spec", "all");
                      closeDrawer();
                    }}
                  />
                  {!filters.model_id && (
                    <div className="px-2 py-3 text-xs text-muted-foreground">
                      Zgjidhni fillimisht modelin.
                    </div>
                  )}
                    {filters.model_id && engineVariantsLoading && (
                      <div className="px-2 py-3 text-xs text-muted-foreground flex items-center gap-2">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        Po ngarkohen motorët...
                      </div>
                    )}
                    {filters.model_id && !engineVariantsLoading && !hasEngines && (
                    <div className="px-2 py-3 text-xs text-muted-foreground">
                      Nuk u gjetën motorë për këtë model.
                    </div>
                  )}
                  {hasEngines &&
                    engineVariants.map((engine) => (
                      <OptionRow
                        key={engine.value}
                        label={engine.label}
                        count={engine.count}
                        selected={
                          (filters as any).engine_spec ===
                          engine.value?.toString()
                        }
                        onClick={() => {
                          updateFilter(
                            "engine_spec",
                            engine.value?.toString() || "all",
                          );
                          closeDrawer();
                        }}
                      />
                    ))}
                </div>
              </ScrollArea>
            </>
          );
        }

        if (activeMobileDrawer === "trim") {
          return (
            <>
              {renderDrawerHeader("Zgjidh trim level")}
              <ScrollArea className="max-h-[70vh] px-3 py-4">
                <div className="space-y-1 pb-4">
                  <OptionRow
                    label="Të gjithë nivelet"
                    selected={!filters.trim_level}
                    onClick={() => {
                      updateFilter("trim_level", "all");
                      closeDrawer();
                    }}
                  />
                  {!filters.model_id && (
                    <div className="px-2 py-3 text-xs text-muted-foreground">
                      Zgjidhni fillimisht modelin.
                    </div>
                  )}
                  {filters.model_id && trimLevels.length === 0 && (
                    <div className="px-2 py-3 text-xs text-muted-foreground">
                      Nuk ka trim levels të disponueshme.
                    </div>
                  )}
                  {trimLevels.map((trim) => (
                    <OptionRow
                      key={trim.value}
                      label={trim.label}
                      count={trim.count}
                      selected={filters.trim_level === trim.value?.toString()}
                      onClick={() => {
                        updateFilter(
                          "trim_level",
                          trim.value?.toString() || "all",
                        );
                        closeDrawer();
                      }}
                    />
                  ))}
                </div>
              </ScrollArea>
            </>
          );
        }

        if (activeMobileDrawer === "color") {
          return (
            <>
              {renderDrawerHeader("Zgjidh ngjyrën")}
              <ScrollArea className="max-h-[70vh] px-3 py-4">
                <div className="space-y-1 pb-4">
                  <OptionRow
                    label="Çdo ngjyrë"
                    selected={!filters.color}
                    onClick={() => {
                      updateFilter("color", "all");
                      closeDrawer();
                    }}
                  />
                  {colorEntries.map((color) => (
                    <OptionRow
                      key={color.id}
                      label={color.label}
                      count={getCount(colorCounts, color.id)}
                      selected={filters.color === color.id}
                      onClick={() => {
                        updateFilter("color", color.id);
                        closeDrawer();
                      }}
                    />
                  ))}
                </div>
              </ScrollArea>
            </>
          );
        }

        if (activeMobileDrawer === "fuel") {
          return (
            <>
              {renderDrawerHeader("Lloji i karburantit")}
              <ScrollArea className="max-h-[70vh] px-3 py-4">
                <div className="space-y-1 pb-4">
                  <OptionRow
                    label="Çdo lloj"
                    selected={!filters.fuel_type}
                    onClick={() => {
                      updateFilter("fuel_type", "all");
                      closeDrawer();
                    }}
                  />
                  {fuelEntries.map((fuel) => (
                    <OptionRow
                      key={fuel.id}
                      label={fuel.label}
                      count={getCount(fuelCounts, fuel.id)}
                      selected={filters.fuel_type === fuel.id}
                      onClick={() => {
                        updateFilter("fuel_type", fuel.id);
                        closeDrawer();
                      }}
                    />
                  ))}
                </div>
              </ScrollArea>
            </>
          );
        }

        if (activeMobileDrawer === "transmission") {
          return (
            <>
              {renderDrawerHeader("Transmisioni")}
              <ScrollArea className="max-h-[70vh] px-3 py-4">
                <div className="space-y-1 pb-4">
                  <OptionRow
                    label="Çdo transmision"
                    selected={!filters.transmission}
                    onClick={() => {
                      updateFilter("transmission", "all");
                      closeDrawer();
                    }}
                  />
                  {transmissionEntries.map((transmission) => (
                    <OptionRow
                      key={transmission.id}
                      label={transmission.label}
                      count={getCount(transmissionCounts, transmission.id)}
                      selected={filters.transmission === transmission.id}
                      onClick={() => {
                        updateFilter("transmission", transmission.id);
                        closeDrawer();
                      }}
                    />
                  ))}
                </div>
              </ScrollArea>
            </>
          );
        }

        if (activeMobileDrawer === "body") {
          return (
            <>
              {renderDrawerHeader("Lloji i trupit")}
              <ScrollArea className="max-h-[70vh] px-3 py-4">
                <div className="space-y-1 pb-4">
                  <OptionRow
                    label="Çdo lloj"
                    selected={!filters.body_type}
                    onClick={() => {
                      updateFilter("body_type", "all");
                      closeDrawer();
                    }}
                  />
                  {bodyTypeEntries.map((body) => (
                    <OptionRow
                      key={body.id}
                      label={body.label}
                      selected={filters.body_type === body.id}
                      onClick={() => {
                        updateFilter("body_type", body.id);
                        closeDrawer();
                      }}
                    />
                  ))}
                </div>
              </ScrollArea>
            </>
          );
        }

        if (activeMobileDrawer === "seats") {
          return (
            <>
              {renderDrawerHeader("Numri i ulëseve")}
              <ScrollArea className="max-h-[70vh] px-3 py-4">
                <div className="space-y-1 pb-4">
                  <OptionRow
                    label="Çdo numër"
                    selected={!filters.seats_count}
                    onClick={() => {
                      updateFilter("seats_count", "all");
                      closeDrawer();
                    }}
                  />
                  {seatEntries.map((seat) => (
                    <OptionRow
                      key={seat.id}
                      label={seat.label}
                      selected={filters.seats_count === seat.id}
                      onClick={() => {
                        updateFilter("seats_count", seat.id);
                        closeDrawer();
                      }}
                    />
                  ))}
                </div>
              </ScrollArea>
            </>
          );
        }

        if (activeMobileDrawer === "year") {
          return (
            <>
              {renderDrawerHeader("Viti i prodhimit")}
              <div className="px-4 py-4">
                <p className="text-xs text-muted-foreground">
                  Zgjidhni gamën e vitit për makinat që kërkoni.
                </p>
                <div className="mt-4 flex gap-4">
                  <div className="flex-1">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                      Nga
                    </p>
                    <div className="mt-2 max-h-[240px] space-y-1 overflow-y-auto pr-2">
                      {yearOptions.map((option) => (
                        <OptionRow
                          key={`from-${option.value}`}
                          label={option.label}
                          selected={isYearOptionSelected(
                            pendingYearRange.from,
                            option.value,
                          )}
                          onClick={() =>
                            handleYearValueChange("from", option.value)
                          }
                        />
                      ))}
                    </div>
                  </div>
                  <div className="flex-1">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                      Deri
                    </p>
                    <div className="mt-2 max-h-[240px] space-y-1 overflow-y-auto pr-2">
                      {yearOptions.map((option) => (
                        <OptionRow
                          key={`to-${option.value}`}
                          label={option.label}
                          selected={isYearOptionSelected(
                            pendingYearRange.to,
                            option.value,
                          )}
                          onClick={() =>
                            handleYearValueChange("to", option.value)
                          }
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              <DrawerFooter className="border-t bg-background/80">
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    className="flex-1 rounded-full"
                    onClick={clearYearRange}
                  >
                    Pastro
                  </Button>
                  <Button
                    className="flex-1 rounded-full bg-primary text-primary-foreground hover:bg-primary/90"
                    onClick={applyYearRange}
                  >
                    Ruaj
                  </Button>
                </div>
              </DrawerFooter>
            </>
          );
        }

        return null;
      };

      return (
        <div className="flex h-full flex-col bg-background">
          <div className="flex-1 overflow-y-auto space-y-4 px-3 pb-6 pt-4">
            <div className="rounded-3xl border border-border/60 bg-card/70 px-4 py-4 shadow-sm backdrop-blur">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Kërkimi i makinës
              </p>
              <div className="mt-2 divide-y divide-border/60">
                <FilterListItem
                  icon={<Car className="h-4 w-4" />}
                  label="Marka"
                  value={selectedManufacturer?.name}
                  placeholder="Të gjitha markat"
                  onClick={() => setActiveMobileDrawer("manufacturer")}
                  loading={loadingCounts}
                  hint={loadingCounts ? "Po përditësohen numrat" : undefined}
                />
                <FilterListItem
                  icon={<Settings className="h-4 w-4" />}
                  label="Modeli"
                  value={selectedModelLabel || selectedModel?.name}
                  placeholder={
                    filters.manufacturer_id
                      ? "Zgjidhni modelin"
                      : "Zgjidhni markën fillimisht"
                  }
                  onClick={() => setActiveMobileDrawer("model")}
                  disabled={!filters.manufacturer_id}
                />
                <FilterListItem
                  icon={<Cog className="h-4 w-4" />}
                  label="Gjenerata"
                  value={selectedGeneration?.label}
                  placeholder={
                    filters.model_id
                      ? "Zgjidhni gjeneratën"
                      : "Zgjidhni modelin fillimisht"
                  }
                  onClick={() => setActiveMobileDrawer("grade")}
                  disabled={!filters.model_id}
                  loading={isLoadingGenerations}
                  hint={
                    isLoadingGenerations ? "Po ngarkohen opsionet" : undefined
                  }
                />
                <FilterListItem
                  icon={<Settings className="h-4 w-4" />}
                  label="Motori"
                  value={selectedEngine?.label}
                  placeholder={
                    filters.model_id
                      ? "Çdo motor"
                      : "Zgjidhni modelin fillimisht"
                  }
                  onClick={() => setActiveMobileDrawer("engine")}
                    disabled={!filters.model_id}
                    loading={!!filters.model_id && engineVariantsLoading}
                    hint={
                      filters.model_id && engineVariantsLoading
                        ? "Po ngarkohen motorët"
                        : undefined
                    }
                />
                <FilterListItem
                  icon={<Settings className="h-4 w-4" />}
                  label="Trim level"
                  value={selectedTrim?.label}
                  placeholder={
                    filters.model_id
                      ? "Çdo nivel"
                      : "Zgjidhni modelin fillimisht"
                  }
                  onClick={() => setActiveMobileDrawer("trim")}
                  disabled={!filters.model_id}
                />
                <div className="pt-3">
                  <p className="px-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Vitet e shpejta
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {yearRangePresets.map((preset) => {
                      const isActive =
                        filters.from_year === preset.from.toString() &&
                        filters.to_year === preset.to.toString();
                      return (
                        <Button
                          key={`fast-year-${preset.label}`}
                          type="button"
                          size="sm"
                          variant={isActive ? "default" : "outline"}
                          className="h-7 rounded-full px-2 text-[11px]"
                          onClick={() => handleYearRangePreset(preset)}
                        >
                          {preset.label}
                        </Button>
                      );
                    })}
                    {(filters.from_year || filters.to_year) && (
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        className="h-7 rounded-full px-2 text-[11px] text-muted-foreground"
                        onClick={() =>
                          applyFiltersIfChanged({
                            from_year: undefined,
                            to_year: undefined,
                          })
                        }
                      >
                        Reseto
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-border/60 bg-card/70 px-4 py-4 shadow-sm backdrop-blur">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Specifikat
              </p>
              <div className="mt-2 divide-y divide-border/60">
                <FilterListItem
                  icon={<Calendar className="h-4 w-4" />}
                  label="Viti i prodhimit"
                  value={yearSummary || undefined}
                  placeholder="Të gjitha vitet"
                  onClick={() => setActiveMobileDrawer("year")}
                />
                <FilterListItem
                  icon={<Palette className="h-4 w-4" />}
                  label="Ngjyra"
                  value={selectedColor?.label}
                  placeholder="Çdo ngjyrë"
                  onClick={() => setActiveMobileDrawer("color")}
                />
                <FilterListItem
                  icon={<Fuel className="h-4 w-4" />}
                  label="Karburanti"
                  value={selectedFuel?.label}
                  placeholder="Çdo lloj"
                  onClick={() => setActiveMobileDrawer("fuel")}
                />
                <FilterListItem
                  icon={<Settings className="h-4 w-4" />}
                  label="Transmisioni"
                  value={selectedTransmission?.label}
                  placeholder="Çdo transmision"
                  onClick={() => setActiveMobileDrawer("transmission")}
                />
                <FilterListItem
                  icon={<Car className="h-4 w-4" />}
                  label="Lloji i trupit"
                  value={selectedBodyType?.label}
                  placeholder="Çdo lloj"
                  onClick={() => setActiveMobileDrawer("body")}
                />
                <FilterListItem
                  icon={<Users className="h-4 w-4" />}
                  label="Numri i ulëseve"
                  value={selectedSeats?.label}
                  placeholder="Çdo numër"
                  onClick={() => setActiveMobileDrawer("seats")}
                />
              </div>
            </div>

            <RangeInputCard
              icon={<Gauge className="h-4 w-4" />}
              label="Kilometrazha (KM)"
              fromKey="odometer_from_km"
              toKey="odometer_to_km"
              fromValue={mileageFromValue}
              toValue={mileageToValue}
              fromPlaceholder="Nga"
              toPlaceholder="Deri"
              unit="km"
            />

            <RangeInputCard
              icon={<DollarSign className="h-4 w-4" />}
              label="Çmimi (EUR)"
              fromKey="buy_now_price_from"
              toKey="buy_now_price_to"
              fromValue={priceFromValue}
              toValue={priceToValue}
              fromPlaceholder="Nga"
              toPlaceholder="Deri"
              unit="€"
            />

            <div className="mt-4 flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1 h-11 rounded-full font-semibold"
                  onClick={handleResetFilters}
                >
                  Reset
                </Button>
                <Button
                  type="button"
                  className="flex-1 h-11 rounded-full bg-primary text-primary-foreground font-semibold hover:bg-primary/90"
                  onClick={() => {
                    handleSearchClick();
                    onCloseFilter?.();
                  }}
                >
                  <Search className="mr-2 h-4 w-4" />
                  {isHomepage ? "Kërko makinat" : "Shfaq rezultatet"}
                </Button>
              </div>
            </div>
          </div>

          <Drawer
            open={!!activeMobileDrawer}
            onOpenChange={(open) => {
              if (!open) {
                closeDrawer();
              }
            }}
            shouldScaleBackground={false}
          >
            <DrawerContent className="bg-background">
              {renderDrawerContent()}
            </DrawerContent>
          </Drawer>
        </div>
      );
    }

    // Catalog style - expanded with sections
    return (
      <Card className="glass-panel border-0 rounded-xl overflow-hidden">
        <ScrollArea className="max-h-[calc(100vh-6rem)] lg:max-h-[calc(100vh-4rem)]">
          <div className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Filter className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-semibold">Filtrat e Kërkimit</h3>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleResetFilters}
                disabled={isLoading}
                className="text-xs"
              >
                {isLoading ? (
                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                ) : (
                  <X className="h-3 w-3 mr-1" />
                )}
                Pastro të gjitha
              </Button>
            </div>

            {/* Basic Filters Section */}
            <div className="space-y-3">
              <Button
                type="button"
                variant="ghost"
                onClick={() => toggleSection("basic")}
                className="w-full justify-between p-2 h-auto"
              >
                <div className="flex items-center gap-2">
                  <Car className="h-4 w-4 text-primary" />
                  <span className="font-medium">Filtrat Bazë</span>
                </div>
                {expandedSections.includes("basic") ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>

              {expandedSections.includes("basic") && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-white/5 dark:bg-black/10 backdrop-blur-sm rounded-lg border border-white/10 dark:border-white/5">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium">Marka</Label>
                      <span
                        className={`inline-flex h-4 items-center gap-1 text-[10px] text-muted-foreground transition-opacity duration-200 ${loadingCounts ? "opacity-100" : "opacity-0 invisible"}`}
                      >
                        <Loader2
                          className="h-3 w-3 animate-spin"
                          aria-hidden="true"
                        />{" "}
                        Po përditësohen numrat
                      </span>
                    </div>
                    <AdaptiveSelect
                      value={filters.manufacturer_id || "all"}
                      onValueChange={(value) =>
                        updateFilter("manufacturer_id", value)
                      }
                      placeholder="Zgjidhni markën"
                      className="filter-control"
                      options={manufacturerSelectOptions}
                      forceNative
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Modeli</Label>
                    <AdaptiveSelect
                      value={filters.model_id || "all"}
                      onValueChange={(value) => updateFilter("model_id", value)}
                      disabled={!filters.manufacturer_id}
                      placeholder={
                        filters.manufacturer_id
                          ? "Zgjidhni modelin"
                          : "Zgjidhni markën së pari"
                      }
                      className="filter-control"
                      options={[
                        ...(!(isStrictMode && filters.model_id)
                          ? [{ value: "all", label: "Të gjithë modelet" }]
                          : []),
                        ...models
                          .filter(
                            (model) => model.cars_qty && model.cars_qty > 0,
                          )
                          .map((model) => {
                            const selectedManufacturer = manufacturers.find(
                              (m) =>
                                m.id.toString() === filters.manufacturer_id,
                            );
                            const formattedModelName = formatModelName(
                              model.name,
                              selectedManufacturer?.name,
                            );
                            return {
                              value: model.id.toString(),
                              label: `${formattedModelName} (${model.cars_qty})`,
                            };
                          }),
                      ]}
                      forceNative
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Advanced Filters Section */}
            <div className="space-y-3">
              <Button
                type="button"
                variant="ghost"
                onClick={() => toggleSection("advanced")}
                className="w-full justify-between p-2 h-auto"
              >
                <div className="flex items-center gap-2">
                  <Settings className="h-4 w-4 text-primary" />
                  <span className="font-medium">Filtrat e Avancuar</span>
                </div>
                {expandedSections.includes("advanced") ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>

              {expandedSections.includes("advanced") && (
                <div className="space-y-4 p-3 bg-white/5 dark:bg-black/10 backdrop-blur-sm rounded-lg border border-white/10 dark:border-white/5">
                  {/* Price */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <Label className="text-sm font-medium flex items-center gap-2">
                        <DollarSign className="h-3 w-3" />
                        Çmimi (EUR)
                      </Label>
                      <div className="grid grid-cols-2 gap-2">
                        <Input
                          type="number"
                          placeholder="Nga"
                          value={filters.buy_now_price_from || ""}
                          onChange={(e) =>
                            updateFilter("buy_now_price_from", e.target.value)
                          }
                        />
                        <Input
                          type="number"
                          placeholder="Deri"
                          value={filters.buy_now_price_to || ""}
                          onChange={(e) =>
                            updateFilter("buy_now_price_to", e.target.value)
                          }
                        />
                      </div>
                    </div>
                  </div>

                  {/* Year Selection and Variants */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium flex items-center gap-2">
                        <Calendar className="h-3 w-3" />
                        Vitet
                        {(filters.from_year || filters.to_year) && (
                          <Badge variant="secondary" className="text-xs">
                            {filters.from_year || "Çdo vit"} -{" "}
                            {filters.to_year || "sot"}
                          </Badge>
                        )}
                      </Label>

                      <div className="mt-2">
                        <Label className="text-xs text-muted-foreground mb-2 block">
                          Vitet:
                        </Label>
                        <div className="flex flex-wrap gap-1">
                          {yearRangePresets.map((preset) => (
                            <Button
                              key={preset.label}
                              type="button"
                              variant={
                                filters.from_year === preset.from.toString() &&
                                filters.to_year === preset.to.toString()
                                  ? "default"
                                  : "outline"
                              }
                              size="sm"
                              className="h-7 px-2 text-xs"
                              onClick={() => handleYearRangePreset(preset)}
                            >
                              {preset.label}
                            </Button>
                          ))}
                          {(filters.from_year || filters.to_year) && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="h-7 px-2 text-xs text-muted-foreground"
                              onClick={() =>
                                applyFiltersIfChanged({
                                  from_year: undefined,
                                  to_year: undefined,
                                })
                              }
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </div>

                      <div className="mt-3">
                        <Label className="text-xs text-muted-foreground mb-2 block">
                          Custom Year Range:
                        </Label>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-1">
                            <Label className="text-xs text-muted-foreground">
                              From Year
                            </Label>
                            <AdaptiveSelect
                              value={filters.from_year || "all"}
                              onValueChange={(value) =>
                                updateFilter("from_year", value)
                              }
                              className="h-8 text-xs"
                              placeholder="All years"
                              options={yearOptions}
                              forceNative
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs text-muted-foreground">
                              To Year
                            </Label>
                            <AdaptiveSelect
                              value={filters.to_year || "all"}
                              onValueChange={(value) =>
                                updateFilter("to_year", value)
                              }
                              className="h-8 text-xs"
                              placeholder="All years"
                              options={yearOptions}
                              forceNative
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium flex items-center gap-2">
                        <Cog className="h-3 w-3" />
                        Gjenerata
                      </Label>
                      <AdaptiveSelect
                        value={filters.generation_id || "all"}
                        onValueChange={(value) =>
                          updateFilter("generation_id", value)
                        }
                        disabled={!filters.model_id || isLoadingGenerations}
                        placeholder={
                          !filters.manufacturer_id
                            ? "Zgjidhni markën"
                            : !filters.model_id
                              ? "Zgjidhni modelin"
                              : isLoadingGenerations
                                ? "Po ngarkon..."
                                : "Zgjidhni gjeneratën"
                        }
                        options={[
                          ...(!(isStrictMode && filters.generation_id)
                            ? [{ value: "all", label: "Të gjitha gjeneratat" }]
                            : []),
                          ...generations.map((generation) => ({
                            value: generation.value,
                            label: generation.label,
                          })),
                        ]}
                        forceNative
                      />
                    </div>
                  </div>

                  {/* Color, Fuel, Transmission, Body Type */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium flex items-center gap-2">
                        <Palette className="h-3 w-3" />
                        Ngjyra
                      </Label>
                      <AdaptiveSelect
                        value={filters.color || "all"}
                        onValueChange={(value) => updateFilter("color", value)}
                        placeholder="Çdo ngjyrë"
                        options={[
                          ...(!(isStrictMode && filters.color)
                            ? [{ value: "all", label: "Çdo ngjyrë" }]
                            : []),
                          ...Object.entries(COLOR_OPTIONS).map(
                            ([name, id]) => ({
                              value: id.toString(),
                              label:
                                name.charAt(0).toUpperCase() +
                                name.slice(1).replace("_", " "),
                            }),
                          ),
                        ]}
                        forceNative
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium flex items-center gap-2">
                        <Fuel className="h-3 w-3" />
                        Karburanti
                      </Label>
                      <AdaptiveSelect
                        value={filters.fuel_type || "all"}
                        onValueChange={(value) =>
                          updateFilter("fuel_type", value)
                        }
                        placeholder="Çdo lloj"
                        options={[
                          ...(!(isStrictMode && filters.fuel_type)
                            ? [{ value: "all", label: "Çdo lloj" }]
                            : []),
                          ...Object.entries(FUEL_TYPE_OPTIONS).map(
                            ([name, id]) => ({
                              value: id.toString(),
                              label:
                                name.charAt(0).toUpperCase() +
                                name.slice(1).replace("_", " "),
                            }),
                          ),
                        ]}
                        forceNative
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium flex items-center gap-2">
                        <Settings className="h-3 w-3" />
                        Transmisioni
                      </Label>
                      <AdaptiveSelect
                        value={filters.transmission || "all"}
                        onValueChange={(value) =>
                          updateFilter("transmission", value)
                        }
                        placeholder="Çdo transmision"
                        options={[
                          ...(!(isStrictMode && filters.transmission)
                            ? [{ value: "all", label: "Çdo transmision" }]
                            : []),
                          ...Object.entries(TRANSMISSION_OPTIONS).map(
                            ([name, id]) => ({
                              value: id.toString(),
                              label:
                                name.charAt(0).toUpperCase() +
                                name.slice(1).replace("_", " "),
                            }),
                          ),
                        ]}
                        forceNative
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium flex items-center gap-2">
                        <Car className="h-3 w-3" />
                        Lloji i trupit
                      </Label>
                      <AdaptiveSelect
                        value={filters.body_type || "all"}
                        onValueChange={(value) =>
                          updateFilter("body_type", value)
                        }
                        placeholder="Çdo lloj"
                        options={[
                          ...(!(isStrictMode && filters.body_type)
                            ? [{ value: "all", label: "Çdo lloj" }]
                            : []),
                          ...Object.entries(BODY_TYPE_OPTIONS).map(
                            ([name, id]) => ({
                              value: id.toString(),
                              label:
                                name.charAt(0).toUpperCase() +
                                name.slice(1).replace("_", " "),
                            }),
                          ),
                        ]}
                        forceNative
                      />
                    </div>
                  </div>

                  {/* Mileage */}
                  <div className="space-y-3">
                    <Label className="text-sm font-medium flex items-center gap-2">
                      <MapPin className="h-3 w-3" />
                      Kilometrazhi
                    </Label>
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        type="number"
                        placeholder="Nga (km)"
                        value={filters.odometer_from_km || ""}
                        onChange={(e) =>
                          updateFilter("odometer_from_km", e.target.value)
                        }
                      />
                      <Input
                        type="number"
                        placeholder="Deri (km)"
                        value={filters.odometer_to_km || ""}
                        onChange={(e) =>
                          updateFilter("odometer_to_km", e.target.value)
                        }
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </ScrollArea>
      </Card>
    );
  },
);

EncarStyleFilter.displayName = "EncarStyleFilter";

export default EncarStyleFilter;
