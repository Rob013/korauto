/**
 * Auctions API Service
 * Handles integration with api.auctionsapi.com endpoints
 * Supports scroll-based pagination, brands, and models
 */

export interface AuctionsApiCar {
  id: string;
  brand: string;
  model: string;
  year: number;
  // Add other car properties as needed based on actual API response
  [key: string]: any;
}

export interface AuctionsApiResponse {
  data: AuctionsApiCar[];
  scroll_id: string | null;
  next_url: string | null;
  message?: string;
}

export interface Brand {
  id: number;
  name: string;
}

export interface Model {
  id: number;
  name: string;
  generations: Generation[];
}

export interface Generation {
  generation_id: number;
  name: string;
  start_year: number;
  end_year: number;
}

export interface AuctionsApiConfig {
  apiKey: string;
  baseUrl?: string;
  scrollTime?: number; // in minutes, max 15
  limit?: number; // max 2000
}

export class AuctionsApiService {
  private config: Required<AuctionsApiConfig>;
  private scrollId: string | null = null;
  private isScrolling: boolean = false;

  constructor(config: AuctionsApiConfig) {
    this.config = {
      baseUrl: 'https://api.auctionsapi.com',
      scrollTime: 10,
      limit: 1000,
      ...config
    };
  }

  /**
   * Start a new scroll session to fetch cars
   */
  async startCarsScroll(): Promise<AuctionsApiResponse> {
    if (this.isScrolling) {
      throw new Error('A scroll session is already active. End it before starting a new one.');
    }

    const params = new URLSearchParams({
      api_key: this.config.apiKey,
      scroll_time: this.config.scrollTime.toString(),
      limit: this.config.limit.toString()
    });

    const url = `${this.config.baseUrl}/cars?${params}`;
    
    try {
      const response = await this.makeRequest(url);
      this.scrollId = response.scroll_id;
      this.isScrolling = true;
      return response;
    } catch (error) {
      throw new Error(`Failed to start cars scroll: ${error}`);
    }
  }

  /**
   * Continue scrolling to get next batch of cars
   */
  async continueCarsScroll(): Promise<AuctionsApiResponse> {
    if (!this.isScrolling || !this.scrollId) {
      throw new Error('No active scroll session. Start a new scroll first.');
    }

    const params = new URLSearchParams({
      api_key: this.config.apiKey,
      scroll_id: this.scrollId
    });

    const url = `${this.config.baseUrl}/cars?${params}`;
    
    try {
      const response = await this.makeRequest(url);
      
      // If no more data, end the scroll session
      if (!response.scroll_id || response.data.length === 0) {
        this.endScroll();
      } else {
        this.scrollId = response.scroll_id;
      }
      
      return response;
    } catch (error) {
      this.endScroll();
      throw new Error(`Failed to continue cars scroll: ${error}`);
    }
  }

  /**
   * End the current scroll session
   */
  endScroll(): void {
    this.scrollId = null;
    this.isScrolling = false;
  }

  /**
   * Get all brands
   */
  async getBrands(): Promise<Brand[]> {
    const params = new URLSearchParams({
      api_key: this.config.apiKey
    });

    const url = `${this.config.baseUrl}/brands?${params}`;
    
    try {
      const response = await this.makeRequest(url);
      return response;
    } catch (error) {
      throw new Error(`Failed to fetch brands: ${error}`);
    }
  }

  /**
   * Get models for a specific brand
   */
  async getModels(brandId: number): Promise<Model[]> {
    const params = new URLSearchParams({
      api_key: this.config.apiKey
    });

    const url = `${this.config.baseUrl}/models/${brandId}?${params}`;
    
    try {
      const response = await this.makeRequest(url);
      return response;
    } catch (error) {
      throw new Error(`Failed to fetch models for brand ${brandId}: ${error}`);
    }
  }

  /**
   * Fetch all cars using scroll pagination
   * This method handles the complete scroll workflow
   */
  async fetchAllCars(): Promise<AuctionsApiCar[]> {
    const allCars: AuctionsApiCar[] = [];
    
    try {
      // Start scroll session
      let response = await this.startCarsScroll();
      allCars.push(...response.data);

      // Continue scrolling until no more data
      while (response.scroll_id && response.data.length > 0) {
        response = await this.continueCarsScroll();
        allCars.push(...response.data);
      }

      return allCars;
    } catch (error) {
      throw new Error(`Failed to fetch all cars: ${error}`);
    } finally {
      // Ensure scroll session is ended
      this.endScroll();
    }
  }

  /**
   * Make HTTP request with error handling
   */
  private async makeRequest(url: string): Promise<any> {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'KORAUTO-WebApp/1.0'
      },
      signal: AbortSignal.timeout(30000) // 30 second timeout
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      
      try {
        const errorData = JSON.parse(errorText);
        errorMessage = errorData.message || errorMessage;
      } catch {
        // Use default error message if JSON parsing fails
      }

      // Handle specific error codes
      switch (response.status) {
        case 403:
          if (errorMessage.includes('api_key')) {
            throw new Error('Invalid or missing API key');
          } else if (errorMessage.includes('subscription')) {
            throw new Error('API subscription is not active');
          } else if (errorMessage.includes('whitelist')) {
            throw new Error('IP address not allowed');
          } else if (errorMessage.includes('data')) {
            throw new Error('No data available in subscription');
          }
          break;
        case 400:
          if (errorMessage.includes('scroll_time')) {
            throw new Error('Scroll time must be less than 15 minutes');
          } else if (errorMessage.includes('limit')) {
            throw new Error('Limit must be less than 2000');
          }
          break;
      }

      throw new Error(errorMessage);
    }

    return await response.json();
  }

  /**
   * Check if there's an active scroll session
   */
  hasActiveScroll(): boolean {
    return this.isScrolling;
  }

  /**
   * Get current scroll ID
   */
  getCurrentScrollId(): string | null {
    return this.scrollId;
  }
}

// Factory function to create service instance
export const createAuctionsApiService = (apiKey: string): AuctionsApiService => {
  return new AuctionsApiService({ apiKey });
};

// Default export
export default AuctionsApiService;
