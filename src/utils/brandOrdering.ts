export interface BrandLike {
  id: string | number;
  name: string;
  [key: string]: any;
}

const PRIORITY_BRAND_KEYS = [
  "audi",
  "volkswagen",
  "mercedesbenz",
  "bmw"
];

const normalizeBrandName = (name: string): string => {
  return name.toLowerCase().replace(/[^a-z0-9]/g, "");
};

export interface SortedBrandsResult<T extends BrandLike> {
  sorted: T[];
  priorityCount: number;
}

export const sortBrandsWithPriority = <T extends BrandLike>(brands: T[]): SortedBrandsResult<T> => {
  if (!Array.isArray(brands) || brands.length === 0) {
    return { sorted: [], priorityCount: 0 };
  }

  const usedIndices = new Set<number>();
  const prioritized: T[] = [];

  PRIORITY_BRAND_KEYS.forEach((key) => {
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
      const nameA = a?.name?.toString().trim() || "";
      const nameB = b?.name?.toString().trim() || "";
      return nameA.localeCompare(nameB, undefined, { sensitivity: "base" });
    });

  return {
    sorted: [...prioritized, ...remaining],
    priorityCount: prioritized.length
  };
};
