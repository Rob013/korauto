export interface BrandLike {
  id: string | number;
  name: string;
  [key: string]: any;
}

const DEFAULT_PRIORITY_BRAND_KEYS = [
  "audi",
  "mercedes",
  "mercedesbenz",
  "volkswagen",
  "vw",
  "bmw"
];

type CountGetter<T> = (brand: T) => number;

interface SortOptions<T> {
  getCount?: CountGetter<T>;
  priorityKeys?: string[];
}

const normalizeBrandName = (name: string): string => {
  return name.toLowerCase().replace(/[^a-z0-9]/g, "");
};

export interface SortedBrandsResult<T extends BrandLike> {
  sorted: T[];
  priorityCount: number;
}

const defaultCountGetter = <T extends BrandLike>(brand: T): number => {
  if (!brand) return 0;
  if (typeof (brand as any).count === "number") return (brand as any).count;
  if (typeof (brand as any).cars_qty === "number") return (brand as any).cars_qty;
  if (typeof (brand as any).car_count === "number") return (brand as any).car_count;
  return 0;
};

export const sortBrandsWithPriority = <T extends BrandLike>(brands: T[], options: SortOptions<T> = {}): SortedBrandsResult<T> => {
  if (!Array.isArray(brands) || brands.length === 0) {
    return { sorted: [], priorityCount: 0 };
  }

  const priorityKeys = options.priorityKeys || DEFAULT_PRIORITY_BRAND_KEYS;
  const getCount: CountGetter<T> = options.getCount || defaultCountGetter;
  const usedIndices = new Set<number>();
  const prioritized: T[] = [];

  priorityKeys.forEach((key) => {
    let matchIndex = brands.findIndex((brand, index) => {
      if (usedIndices.has(index) || !brand?.name) {
        return false;
      }
      return normalizeBrandName(brand.name) === key;
    });

    if (matchIndex === -1) {
      matchIndex = brands.findIndex((brand, index) => {
        if (usedIndices.has(index) || !brand?.name) {
          return false;
        }
        return normalizeBrandName(brand.name).includes(key);
      });
    }

    if (matchIndex !== -1) {
      prioritized.push(brands[matchIndex]);
      usedIndices.add(matchIndex);
    }
  });

  const remaining = brands
    .filter((_, index) => !usedIndices.has(index))
    .sort((a, b) => {
      const countA = getCount(a);
      const countB = getCount(b);
      if (countA !== countB) {
        return countB - countA;
      }

      const nameA = a?.name?.toString().trim() || "";
      const nameB = b?.name?.toString().trim() || "";
      return nameA.localeCompare(nameB, undefined, { sensitivity: "base" });
    });

  return {
    sorted: [...prioritized, ...remaining],
    priorityCount: prioritized.length
  };
};
