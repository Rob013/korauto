import { useState, useEffect, useMemo, useRef } from "react";
import { APIFilters } from "@/utils/catalog-filter";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export interface Model {
  id: number;
  name: string;
  car_count?: number;
  cars_qty?: number;
  image?: string;
  [key: string]: any;
}

export interface CachedCarData {
  api_id: string;
  make: string;
  model: string;
  year: number;
  vin: string;
  lot_number: string;
  car_data: any; // Allow any type for car_data
  price: number;
  mileage: string;
  color: string;
  fuel: string;
  transmission: string;
}

// Quick & simple hook for admin car search
export const useAdminCarSearch = () => {
  const [searchResults, setSearchResults] = useState<CachedCarData[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();

  const performSearch = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      // Simple mock search for demo
      const mockResults: CachedCarData[] = [
        {
          api_id: "1",
          make: "BMW",
          model: "X5",
          year: 2020,
          vin: "123ABC",
          lot_number: "001",
          car_data: {},
          price: 50000,
          mileage: "50000",
          color: "Black",
          fuel: "Gasoline",
          transmission: "Automatic",
        },
        {
          api_id: "2", 
          make: "Mercedes-Benz",
          model: "E-Class",
          year: 2019,
          vin: "456DEF",
          lot_number: "002", 
          car_data: {},
          price: 45000,
          mileage: "60000",
          color: "Silver",
          fuel: "Diesel",
          transmission: "Automatic",
        }
      ].filter(car => 
        car.make.toLowerCase().includes(query.toLowerCase()) ||
        car.model.toLowerCase().includes(query.toLowerCase()) ||
        car.vin.toLowerCase().includes(query.toLowerCase())
      );

      setSearchResults(mockResults);
    } catch (error) {
      console.error('Search error:', error);
      toast({
        title: "Search Error",
        description: "Failed to search cars",
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  };

  return {
    searchResults,
    isSearching,
    searchQuery,
    setSearchQuery,
    performSearch,
  };
};