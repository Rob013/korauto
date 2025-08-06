import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

// Specific lot numbers for inspected cars
const INSPECTED_LOT_NUMBERS = [
  "39637155",
  "39168424", 
  "40110986",
  "39677285",
  "39158306",
  "38743302",
  "39375584"
];

interface Car {
  id: string;
  manufacturer?: { name: string };
  model?: { name: string };
  year: number;
  vin: string;
  lot_number: string;
  title: string;
  status: string;
  sale_status?: string;
  final_price?: number;
  lots?: Array<{
    buy_now?: number;
    images?: { normal?: string[]; big?: string[] };
    odometer?: { km?: number };
    lot?: string;
    status?: string;
    sale_status?: string;
    final_price?: number;
    insurance_v2?: unknown;
    details?: unknown;
  }>;
  transmission?: { name: string };
  fuel?: { name: string };
  color?: { name: string };
}

export const useInspectedCars = () => {
  const [cars, setCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchInspectedCars = async () => {
      try {
        setLoading(true);
        setError(null);

        // Create search query to find cars by lot numbers
        const searchQuery = INSPECTED_LOT_NUMBERS.join(" OR ");
        
        const { data, error: apiError } = await supabase.functions.invoke('secure-cars-api', {
          body: {
            endpoint: 'cars',
            filters: {
              search: searchQuery,
              per_page: "100" // Ensure we get all results
            },
          },
        });

        if (apiError) {
          throw new Error(apiError.message);
        }

        if (data?.error) {
          throw new Error(data.error);
        }

        const allCars = data.data || [];
        
        // Filter cars to only include those with matching lot numbers
        const inspectedCars = allCars.filter((car: Car) => {
          const lotNumber = car.lot_number || car.lots?.[0]?.lot || "";
          return INSPECTED_LOT_NUMBERS.includes(lotNumber);
        });

        setCars(inspectedCars);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch inspected cars';
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchInspectedCars();
  }, []);

  return {
    cars,
    loading,
    error,
    lotNumbers: INSPECTED_LOT_NUMBERS
  };
};