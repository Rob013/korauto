const PLACEHOLDER_VALUES = new Set([
  "",
  "-",
  "--",
  "---",
  "n/a",
  "na",
  "none",
  "null",
  "undefined",
  "unknown",
  "pending",
  "0",
]);

const MULTI_VALUE_SEPARATORS = ["/", "\\", "+", "&", "|", ",", ";"];

const FUEL_PATH_CANDIDATES = [
  "fuel",
  "fuel.name",
  "fuel.value",
  "fuel.label",
  "fuel.type",
  "fuelType",
  "fuelType.name",
  "fuelType.value",
  "fuel_type",
  "fuel_type.name",
  "fuel_type.value",
  "details.fuel",
  "details.fuel.name",
  "details.fuel.value",
  "details.fuel_type",
  "details.fuel_type.name",
  "details.fuel_type.value",
  "details.specs.fuel",
  "details.specs.fuel_type",
  "details.specs.fuelType",
  "details.specification.fuel",
  "details.summary.fuel",
  "specs.fuel",
  "specs.fuel_type",
  "specs.fuelType",
  "summary.fuel",
  "technical.fuel",
  "vehicle.fuel",
  "vehicle.fuel_type",
  "engine.fuel",
  "engine.specs.fuel",
  "engine.specification.fuel",
  "insurance_v2.fuel",
  "insurance_v2.fuel_type",
  "insurance.general_info.fuel",
  "insurance.general_info.fuel_type",
  "insurance.car_info.fuel",
  "insurance.car_info.fuel_type",
  "inspection.fuel",
  "attributes.fuel",
  "properties.fuel",
  "metadata.fuel",
  "meta.fuel",
  "characteristics.fuel",
  "summary.specs.fuel",
];

const FUEL_TRANSLATIONS_SQ: Record<string, string> = {
  Gasoline: "Benzin",
  Petrol: "Benzin",
  Diesel: "Diesel",
  Hybrid: "Hibrid",
  "Plug-in Hybrid": "Hibrid Plug-in",
  "Mild Hybrid": "Mild Hybrid",
  Electric: "Elektrik",
  "Diesel Hybrid": "Hibrid Diesel",
  "Gasoline Hybrid": "Hibrid",
  "Diesel Electric": "Diesel Elektrik",
  LPG: "LPG",
  CNG: "CNG",
  LNG: "LNG",
  Hydrogen: "Hidrogjen",
  Ethanol: "Ethanol",
  Propane: "Propan",
  BiFuel: "Bi-Fuel",
  "Gasoline / LPG": "Benzin / LPG",
  Gas: "Gaz",
};

const capitalizeWords = (value: string): string => {
  const trimmed = value.trim();
  if (!trimmed) {
    return "";
  }

  if (/^[a-z]{1,4}$/i.test(trimmed)) {
    return trimmed.toUpperCase();
  }

  return trimmed
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
};

const sanitizeRawValue = (value: string): string => {
  return value.replace(/\r?\n|\r/g, " ").replace(/\s+/g, " ").trim();
};

const extractFuelString = (value: unknown): string | null => {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value === "string") {
    const sanitized = sanitizeRawValue(value);
    const lower = sanitized.toLowerCase();
    if (PLACEHOLDER_VALUES.has(lower)) {
      return null;
    }
    return sanitized;
  }

  if (typeof value === "number" && !Number.isNaN(value)) {
    return String(value);
  }

  if (typeof value === "object") {
    const candidates = [
      (value as any).name,
      (value as any).label,
      (value as any).value,
      (value as any).type,
      (value as any).fuel,
    ];

    for (const candidate of candidates) {
      const extracted = extractFuelString(candidate);
      if (extracted) {
        return extracted;
      }
    }
  }

  return null;
};

const getNestedValue = (source: any, path: string): unknown => {
  if (!source) {
    return undefined;
  }

  return path.split(".").reduce<unknown>((acc, key) => {
    if (acc === undefined || acc === null) {
      return undefined;
    }
    if (typeof acc !== "object") {
      return undefined;
    }
    return (acc as Record<string, unknown>)[key];
  }, source);
};

const uniqueNonEmpty = (values: (string | null | undefined)[]): string[] =>
  Array.from(
    new Set(
      values
        .map((value) => (value || "").trim())
        .filter((value) => Boolean(value)),
    ),
  );

const normalizeSingleFuelString = (value: string): string => {
  const cleaned = sanitizeRawValue(value);
  const lower = cleaned.toLowerCase();
  const withoutParens = lower.replace(/\(.*?\)/g, " ");

  if (/(phev|plug[-\s]?in|plug in)/.test(withoutParens)) {
    if (/diesel/.test(withoutParens)) {
      return "Diesel Plug-in Hybrid";
    }
    if (/gasoline|petrol|benzin/.test(withoutParens)) {
      return "Plug-in Hybrid";
    }
    return "Plug-in Hybrid";
  }

  if (/(mhev|mild hybrid)/.test(withoutParens)) {
    return "Mild Hybrid";
  }

  if (/hybrid/.test(withoutParens) || /hev/.test(withoutParens)) {
    if (/diesel/.test(withoutParens)) {
      return "Diesel Hybrid";
    }
    if (/gasoline|petrol|benzin/.test(withoutParens)) {
      return "Hybrid";
    }
    return "Hybrid";
  }

  if (/electric|bev|battery/.test(withoutParens)) {
    if (/diesel/.test(withoutParens)) {
      return "Diesel Electric";
    }
    if (/gasoline|petrol|benzin/.test(withoutParens)) {
      return "Gasoline Hybrid";
    }
    return "Electric";
  }

  if (/diesel/.test(withoutParens) || /\bd\b/.test(withoutParens)) {
    return "Diesel";
  }

  if (
    /gasoline|petrol|benzin|benzine|gasolin|unleaded/.test(withoutParens) ||
    /\bgas\b/.test(withoutParens)
  ) {
    return "Gasoline";
  }

  if (/lpg|autogas|lp gas/.test(withoutParens)) {
    return "LPG";
  }

  if (/cng|compressed natural/.test(withoutParens)) {
    return "CNG";
  }

  if (/lng|liquefied natural/.test(withoutParens)) {
    return "LNG";
  }

  if (/hydrogen|fuel cell/.test(withoutParens)) {
    return "Hydrogen";
  }

  if (/ethanol|e85|biofuel/.test(withoutParens)) {
    return "Ethanol";
  }

  if (/propane/.test(withoutParens)) {
    return "Propane";
  }

  if (/bi[-\s]?fuel|bifuel/.test(withoutParens)) {
    return "BiFuel";
  }

  return capitalizeWords(cleaned);
};

const normalizeFuelString = (value: string): string => {
  for (const separator of MULTI_VALUE_SEPARATORS) {
    if (value.includes(separator)) {
      const parts = value
        .split(separator)
        .map((part) => normalizeFuelString(part.trim()));
      const uniqueParts = uniqueNonEmpty(parts);
      if (uniqueParts.length === 0) {
        return "";
      }
      if (uniqueParts.length === 1) {
        return uniqueParts[0];
      }

      // Special handling for gasoline + electric combinations
      const hasElectric = uniqueParts.some((part) =>
        /electric/i.test(part),
      );
      const hasGasoline = uniqueParts.some((part) =>
        /(gasoline|petrol|benzin)/i.test(part),
      );
      const hasDiesel = uniqueParts.some((part) => /diesel/i.test(part));

      if (hasElectric && hasGasoline) {
        return "Hybrid";
      }

      if (hasElectric && hasDiesel) {
        return "Diesel Electric";
      }

      if (hasGasoline && uniqueParts.includes("LPG")) {
        return "Gasoline / LPG";
      }

      return uniqueParts.join(" / ");
    }
  }

  return normalizeSingleFuelString(value);
};

export const normalizeFuelValue = (value: unknown): string | null => {
  const extracted = extractFuelString(value);
  if (!extracted) {
    return null;
  }

  const normalized = normalizeFuelString(extracted);
  if (!normalized) {
    return null;
  }

  return normalized;
};

export const resolveFuelFromSources = (
  carData?: any,
  lotData?: any,
): string | null => {
  for (const path of FUEL_PATH_CANDIDATES) {
    const carCandidate = normalizeFuelValue(getNestedValue(carData, path));
    if (carCandidate) {
      return carCandidate;
    }

    const lotCandidate = normalizeFuelValue(getNestedValue(lotData, path));
    if (lotCandidate) {
      return lotCandidate;
    }
  }

  // Direct fallbacks for common shorthand objects
  const fallbackCandidates = [
    carData?.fuel,
    lotData?.fuel,
    carData?.fuel_name,
    lotData?.fuel_name,
    carData?.fueltype,
    lotData?.fueltype,
  ];

  for (const candidate of fallbackCandidates) {
    const normalized = normalizeFuelValue(candidate);
    if (normalized) {
      return normalized;
    }
  }

  return null;
};

export const localizeFuel = (
  value: unknown,
  locale: "sq" | "en" = "sq",
): string | null => {
  const normalized = normalizeFuelValue(value);
  if (!normalized) {
    return null;
  }

  if (locale === "sq") {
    return FUEL_TRANSLATIONS_SQ[normalized] || normalized;
  }

  return normalized;
};

