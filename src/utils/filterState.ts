import { APIFilters } from "@/utils/catalog-filter";

const normalizeValue = (value: unknown): string | undefined => {
  if (value === null || value === undefined) {
    return undefined;
  }

  const stringValue = typeof value === "string" ? value : String(value);
  const trimmed = stringValue.trim();

  if (trimmed === "" || trimmed.toLowerCase() === "all" || trimmed.toLowerCase() === "any") {
    return undefined;
  }

  return trimmed;
};

export const mergeFilterUpdates = (current: APIFilters = {}, updates: Partial<APIFilters> = {}): APIFilters => {
  const next: APIFilters = { ...current };

  Object.entries(updates).forEach(([key, value]) => {
    const normalized = normalizeValue(value);

    if (normalized === undefined) {
      delete (next as Record<string, string | undefined>)[key];
    } else {
      (next as Record<string, string | undefined>)[key] = normalized;
    }
  });

  return next;
};

export const areFiltersEqual = (a: APIFilters = {}, b: APIFilters = {}): boolean => {
  const keys = new Set([...Object.keys(a || {}), ...Object.keys(b || {})]);

  for (const key of keys) {
    const aValue = (a as Record<string, unknown>)[key];
    const bValue = (b as Record<string, unknown>)[key];

    if ((aValue ?? undefined) !== (bValue ?? undefined)) {
      return false;
    }
  }

  return true;
};
