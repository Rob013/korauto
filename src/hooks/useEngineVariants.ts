import { useMemo } from 'react';
import { extractUniqueEngineSpecs } from '@/utils/catalog-filter';

interface Car {
  id: string;
  title?: string;
  engine?: { name?: string };
  [key: string]: unknown;
}

export const useEngineVariants = (cars: Car[], modelId?: string) => {
  return useMemo(() => {
    if (!modelId || !cars || cars.length === 0) {
      return [];
    }
    
    // Extract unique engine specs from the current car list
    const variants = extractUniqueEngineSpecs(cars);
    
    return variants;
  }, [cars, modelId]);
};
