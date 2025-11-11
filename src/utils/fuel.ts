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
  "details.specification.fuel_type",
  "details.specification.fuelType",
  "details.specifications.fuel",
  "details.specifications.fuel_type",
  "details.specifications.fuelType",
  "details.summary.fuel",
  "specification.fuel",
  "specification.fuel_type",
  "specification.fuelType",
  "specifications.fuel",
  "specifications.fuel_type",
  "specifications.fuelType",
  "specs.fuel",
  "specs.fuel_type",
  "specs.fuelType",
  "summary.fuel",
  "summary.specification.fuel",
  "summary.specification.fuel_type",
  "summary.specification.fuelType",
  "technical.fuel",
  "technical.fuel_type",
  "technical.fuelType",
  "technicalSpecification.fuel",
  "technicalSpecification.fuel_type",
  "technicalSpecification.fuelType",
  "technicalSpecifications.fuel",
  "technicalSpecifications.fuel_type",
  "technicalSpecifications.fuelType",
  "specs.specification.fuel",
  "specs.specification.fuel_type",
  "specs.specification.fuelType",
  "specs.technical.fuel",
  "specs.technical.fuel_type",
  "specs.technical.fuelType",
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

const FUEL_KEY_PATTERN = /(fuel|karburant)/i;
const FUEL_LABEL_KEYS = [
  "label",
  "name",
  "title",
  "key",
  "attribute",
  "header",
  "field",
  "type",
  "id",
  "code",
];
const FUEL_VALUE_KEYS = [
  "value",
  "val",
  "data",
  "content",
  "display",
  "displayValue",
  "display_value",
  "text",
  "name",
  "value_text",
];
const MAX_DEEP_SEARCH_DEPTH = 6;
const MAX_DEEP_SEARCH_NODES = 5000;

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
      (value as any).value,
      (value as any).val,
      (value as any).data,
      (value as any).text,
      (value as any).displayValue,
      (value as any).display_value,
      (value as any).name,
      (value as any).label,
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

const normalizeCandidateValue = (value: unknown): string | null => {
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

const extractFuelFromSpecObject = (obj: Record<string, unknown> | null | undefined): string | null => {
  if (!obj || typeof obj !== "object") {
    return null;
  }

  for (const [key, value] of Object.entries(obj)) {
    if (FUEL_LABEL_KEYS.includes(key)) {
      continue;
    }

    if (FUEL_KEY_PATTERN.test(key)) {
      const normalized = normalizeCandidateValue(value);
      if (normalized) {
        return normalized;
      }
    }
  }

  for (const labelKey of FUEL_LABEL_KEYS) {
    const rawLabel = obj[labelKey];
    if (typeof rawLabel === "string" && FUEL_KEY_PATTERN.test(rawLabel)) {
      for (const valueKey of FUEL_VALUE_KEYS) {
        if (valueKey in obj) {
          const normalized = normalizeCandidateValue(obj[valueKey]);
          if (normalized) {
            return normalized;
          }
        }
      }

      const values = (obj as any).values;
      if (Array.isArray(values)) {
        for (const entry of values) {
          const normalized = normalizeCandidateValue(entry);
          if (normalized) {
            return normalized;
          }
        }
      }

      const labelParts = rawLabel.split(":");
      if (labelParts.length > 1) {
        const inlineValue = labelParts.slice(1).join(":").trim();
        const normalized = normalizeCandidateValue(inlineValue);
        if (normalized) {
          return normalized;
        }
      }
    }
  }

  return null;
};

const deepSearchFuel = (
  source: unknown,
  maxDepth = MAX_DEEP_SEARCH_DEPTH,
  maxNodes = MAX_DEEP_SEARCH_NODES,
): string | null => {
  if (source === null || source === undefined) {
    return null;
  }

  const visited = new Set<unknown>();
  const stack: Array<{ value: unknown; depth: number }> = [
    { value: source, depth: 0 },
  ];
  let processed = 0;

  while (stack.length > 0) {
    const { value, depth } = stack.pop() as { value: unknown; depth: number };

    if (value === null || value === undefined) {
      continue;
    }

    if (typeof value === "string" || typeof value === "number") {
      const normalized = normalizeCandidateValue(value);
      if (normalized) {
        return normalized;
      }
      continue;
    }

    if (typeof value !== "object") {
      continue;
    }

    if (visited.has(value)) {
      continue;
    }
    visited.add(value);

    if (++processed > maxNodes) {
      break;
    }

    const specCandidate = extractFuelFromSpecObject(value as Record<string, unknown>);
    if (specCandidate) {
      return specCandidate;
    }

    if (Array.isArray(value)) {
      for (const item of value) {
        const normalized = normalizeCandidateValue(item);
        if (normalized) {
          return normalized;
        }
        if (depth + 1 <= maxDepth) {
          stack.push({ value: item, depth: depth + 1 });
        }
      }
      continue;
    }

    for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
      if (FUEL_KEY_PATTERN.test(key)) {
        const normalized = normalizeCandidateValue(child);
        if (normalized) {
          return normalized;
        }
      }

      if (depth + 1 <= maxDepth) {
        stack.push({ value: child, depth: depth + 1 });
      }
    }
  }

  return null;
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

export const resolveFuelFromSources = (...sources: any[]): string | null => {
  const uniqueSources = sources.filter(Boolean);
  if (uniqueSources.length === 0) {
    return null;
  }

  for (const path of FUEL_PATH_CANDIDATES) {
    for (const source of uniqueSources) {
      const candidate = normalizeFuelValue(getNestedValue(source, path));
      if (candidate) {
        return candidate;
      }
    }
  }

  for (const source of uniqueSources) {
    const directCandidates = [
      source?.fuel,
      source?.fuel_type,
      source?.fuelType,
      source?.fuel_name,
      source?.fuelName,
      source?.fueltype,
      source?.fueltype_name,
      source?.fuel_type_name,
      source?.technical?.fuel,
      source?.technical?.fuel_type,
      source?.technical?.fuelType,
      source?.spec?.fuel,
      source?.spec?.fuel_type,
      source?.spec?.fuelType,
      source?.primary_attributes?.fuel,
      source?.attributes?.fuel,
      source?.properties?.fuel,
    ];

    for (const candidate of directCandidates) {
      const normalized = normalizeFuelValue(candidate);
      if (normalized) {
        return normalized;
      }
    }
  }

  for (const source of uniqueSources) {
    const deepCandidate = deepSearchFuel(source);
    if (deepCandidate) {
      return deepCandidate;
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

