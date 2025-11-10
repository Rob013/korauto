// Deprecated mock data utilities have been replaced with empty stubs to prevent accidental use.
export interface MockCar {
  id: string;
  make: string;
  model: string;
  year: number;
  price: number;
  mileage?: number;
  fuel?: string;
  transmission?: string;
  bodyType?: string;
  color?: string;
  location?: string;
  images?: string[];
}

export const carModels: Record<string, string[]> = {};

export const generateMockCars = (_count: number, _startId: number = 1): MockCar[] => {
  return [];
};

export const mockCarsDatabase: MockCar[] = [];

export interface MockCarsResponse {
  cars: MockCar[];
  total: number;
  page: number;
  totalPages: number;
  hasMore: boolean;
}

export const mockFetchCars = async (
  _filters: any,
  signal?: AbortSignal
): Promise<MockCarsResponse> => {
  if (signal?.aborted) {
    throw new Error("Request aborted");
  }

  return {
    cars: [],
    total: 0,
    page: 1,
    totalPages: 0,
    hasMore: false
  };
};