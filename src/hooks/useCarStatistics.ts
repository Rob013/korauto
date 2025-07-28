import { useState, useEffect } from 'react';

const API_BASE_URL = 'https://auctionsapi.com/api';
const API_KEY = 'd00985c77981fe8d26be16735f932ed1';

interface ManufacturerStats {
  id: number;
  name: string;
  totalCars: number;
  models: ModelStats[];
}

interface ModelStats {
  id: number;
  name: string;
  count: number;
}

interface CarStatistics {
  totalCars: number;
  manufacturers: ManufacturerStats[];
  loading: boolean;
  error: string | null;
}

export const useCarStatistics = () => {
  const [statistics, setStatistics] = useState<CarStatistics>({
    totalCars: 0,
    manufacturers: [],
    loading: false,
    error: null
  });

  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const fetchStatistics = async () => {
    setStatistics(prev => ({ ...prev, loading: true, error: null }));

    try {
      // First, fetch all manufacturers
      const manufacturersResponse = await fetch(`${API_BASE_URL}/manufacturers/cars`, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'KORAUTO-WebApp/1.0',
          'X-API-Key': API_KEY
        }
      });

      if (!manufacturersResponse.ok) {
        throw new Error(`Failed to fetch manufacturers: ${manufacturersResponse.status}`);
      }

      const manufacturersData = await manufacturersResponse.json();
      const manufacturers = manufacturersData.data || [];

      const manufacturerStats: ManufacturerStats[] = [];
      let totalCars = 0;

      // For each manufacturer, fetch models and car counts
      for (const manufacturer of manufacturers.slice(0, 10)) { // Limit to first 10 to avoid rate limits
        try {
          await delay(500); // Rate limiting

          // Fetch models for this manufacturer
          const modelsResponse = await fetch(`${API_BASE_URL}/models/${manufacturer.id}/cars`, {
            headers: {
              'Accept': 'application/json',
              'User-Agent': 'KORAUTO-WebApp/1.0',
              'X-API-Key': API_KEY
            }
          });

          if (!modelsResponse.ok) {
            console.warn(`Failed to fetch models for manufacturer ${manufacturer.name}`);
            continue;
          }

          const modelsData = await modelsResponse.json();
          const models = modelsData.data || [];
          
          const modelStats: ModelStats[] = [];
          let manufacturerTotal = 0;

          // For each model, get car count
          for (const model of models.slice(0, 5)) { // Limit models to avoid too many requests
            try {
              await delay(300); // Rate limiting

              const carsResponse = await fetch(`${API_BASE_URL}/cars?manufacturer_id=${manufacturer.id}&model_id=${model.id}&per_page=1&simple_paginate=1`, {
                headers: {
                  'Accept': 'application/json',
                  'User-Agent': 'KORAUTO-WebApp/1.0',
                  'X-API-Key': API_KEY
                }
              });

              if (carsResponse.ok) {
                const carsData = await carsResponse.json();
                const carCount = carsData.meta?.total || 0;
                
                modelStats.push({
                  id: model.id,
                  name: model.name,
                  count: carCount
                });
                manufacturerTotal += carCount;
              }
            } catch (err) {
              console.warn(`Failed to fetch car count for model ${model.name}:`, err);
            }
          }

          manufacturerStats.push({
            id: manufacturer.id,
            name: manufacturer.name,
            totalCars: manufacturerTotal,
            models: modelStats.sort((a, b) => b.count - a.count) // Sort by count descending
          });

          totalCars += manufacturerTotal;

        } catch (err) {
          console.warn(`Failed to process manufacturer ${manufacturer.name}:`, err);
        }
      }

      setStatistics({
        totalCars,
        manufacturers: manufacturerStats.sort((a, b) => b.totalCars - a.totalCars), // Sort by total cars descending
        loading: false,
        error: null
      });

    } catch (err) {
      console.error('Error fetching statistics:', err);
      setStatistics(prev => ({
        ...prev,
        loading: false,
        error: err instanceof Error ? err.message : 'Failed to fetch statistics'
      }));
    }
  };

  const refreshStatistics = () => {
    fetchStatistics();
  };

  useEffect(() => {
    fetchStatistics();
  }, []);

  return {
    ...statistics,
    refreshStatistics
  };
};