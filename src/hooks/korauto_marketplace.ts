import { useState, useEffect } from "react";
import { useSecureAuctionAPI } from "./useSecureAuctionAPI";
import { supabase } from "@/integrations/supabase/client";

// Marketplace-specific interfaces that extend the existing car auction system
interface MarketplaceListing {
  id: string;
  car_id: string;
  seller_id: string;
  listing_type: 'auction' | 'fixed_price' | 'negotiable';
  asking_price?: number;
  reserve_price?: number;
  listing_date: string;
  expiry_date?: string;
  status: 'active' | 'sold' | 'expired' | 'cancelled';
  description?: string;
  condition_notes?: string;
  location: string;
  contact_info?: {
    phone?: string;
    email?: string;
    preferred_contact: 'phone' | 'email' | 'app';
  };
  verification_status: 'pending' | 'verified' | 'rejected';
  featured: boolean;
  view_count: number;
  interest_count: number;
}

interface MarketplaceUser {
  id: string;
  username: string;
  email: string;
  phone?: string;
  verification_status: 'pending' | 'verified' | 'rejected';
  rating: number;
  total_sales: number;
  total_purchases: number;
  joined_date: string;
  location?: string;
  profile_image?: string;
}

interface MarketplaceOffer {
  id: string;
  listing_id: string;
  buyer_id: string;
  offer_amount: number;
  offer_date: string;
  message?: string;
  status: 'pending' | 'accepted' | 'rejected' | 'countered';
  counter_amount?: number;
  expiry_date?: string;
}

interface MarketplaceFilters {
  listing_type?: string;
  price_min?: number;
  price_max?: number;
  location?: string;
  seller_rating_min?: number;
  condition?: string;
  verified_only?: boolean;
  featured_only?: boolean;
  // Inherit all existing car filters
  manufacturer_id?: string;
  model_id?: string;
  generation_id?: string;
  year_from?: number;
  year_to?: number;
  fuel_type?: string;
  transmission?: string;
  body_type?: string;
  color?: string;
}

// Cache for marketplace data
const marketplaceCache = new Map<string, { data: any; timestamp: number }>();
const MARKETPLACE_CACHE_DURATION = 30000; // 30 seconds

/**
 * Korauto Marketplace Hook
 * 
 * This hook provides marketplace functionality while preserving the existing
 * auction API, themes, colors, and logos. It extends the current system with
 * user-to-user trading capabilities.
 */
export const useKorAutoMarketplace = () => {
  // Use the existing secure auction API for car data
  const auctionAPI = useSecureAuctionAPI();
  
  // Marketplace-specific state
  const [listings, setListings] = useState<MarketplaceListing[]>([]);
  const [userListings, setUserListings] = useState<MarketplaceListing[]>([]);
  const [offers, setOffers] = useState<MarketplaceOffer[]>([]);
  const [marketplaceLoading, setMarketplaceLoading] = useState(false);
  const [marketplaceError, setMarketplaceError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<MarketplaceUser | null>(null);

  // Helper function for cached marketplace API calls
  const getCachedMarketplaceData = async (key: string, fetcher: () => Promise<any>) => {
    const cached = marketplaceCache.get(key);
    if (cached && Date.now() - cached.timestamp < MARKETPLACE_CACHE_DURATION) {
      return cached.data;
    }
    
    const data = await fetcher();
    marketplaceCache.set(key, { data, timestamp: Date.now() });
    return data;
  };

  // Fetch marketplace listings with car data integration
  const fetchMarketplaceListings = async (filters: MarketplaceFilters = {}) => {
    setMarketplaceLoading(true);
    setMarketplaceError(null);
    
    try {
      // Use existing car filtering through the auction API
      const carFilters = {
        manufacturer_id: filters.manufacturer_id,
        model_id: filters.model_id,
        generation_id: filters.generation_id,
        from_year: filters.year_from?.toString(),
        to_year: filters.year_to?.toString(),
        fuel_type: filters.fuel_type,
        transmission: filters.transmission,
        body_type: filters.body_type,
        color: filters.color,
      };

      // Get cars using existing API (preserves existing functionality)
      await auctionAPI.fetchCars(1, carFilters);
      const availableCars = auctionAPI.cars;

      // Simulate marketplace listings (in real implementation, this would be a Supabase call)
      const mockListings: MarketplaceListing[] = availableCars.slice(0, 20).map((car, index) => ({
        id: `listing_${car.id}_${index}`,
        car_id: car.id.toString(),
        seller_id: `seller_${index % 5 + 1}`,
        listing_type: ['auction', 'fixed_price', 'negotiable'][index % 3] as any,
        asking_price: car.lots?.[0]?.buy_now ? car.lots[0].buy_now * (0.9 + Math.random() * 0.2) : undefined,
        reserve_price: car.lots?.[0]?.buy_now ? car.lots[0].buy_now * 0.8 : undefined,
        listing_date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
        expiry_date: new Date(Date.now() + Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
        status: ['active', 'active', 'active', 'sold'][index % 4] as any,
        description: `High-quality ${car.title} in excellent condition. Well maintained with full service history.`,
        condition_notes: index % 3 === 0 ? "Minor wear on interior, all mechanical components excellent" : "Excellent condition throughout",
        location: ['Seoul', 'Busan', 'Daegu', 'Incheon', 'Gwangju'][index % 5],
        contact_info: {
          preferred_contact: 'app' as const,
        },
        verification_status: index % 10 === 0 ? 'pending' : 'verified' as any,
        featured: index % 7 === 0,
        view_count: Math.floor(Math.random() * 1000),
        interest_count: Math.floor(Math.random() * 50),
      }));

      // Apply marketplace-specific filters
      let filteredListings = mockListings;
      
      if (filters.listing_type) {
        filteredListings = filteredListings.filter(l => l.listing_type === filters.listing_type);
      }
      
      if (filters.price_min) {
        filteredListings = filteredListings.filter(l => l.asking_price && l.asking_price >= filters.price_min!);
      }
      
      if (filters.price_max) {
        filteredListings = filteredListings.filter(l => l.asking_price && l.asking_price <= filters.price_max!);
      }
      
      if (filters.location) {
        filteredListings = filteredListings.filter(l => l.location.toLowerCase().includes(filters.location!.toLowerCase()));
      }
      
      if (filters.verified_only) {
        filteredListings = filteredListings.filter(l => l.verification_status === 'verified');
      }
      
      if (filters.featured_only) {
        filteredListings = filteredListings.filter(l => l.featured);
      }

      setListings(filteredListings);
      console.log(`✅ Loaded ${filteredListings.length} marketplace listings`);
      
    } catch (error) {
      console.error("❌ Error fetching marketplace listings:", error);
      setMarketplaceError("Failed to load marketplace listings");
    } finally {
      setMarketplaceLoading(false);
    }
  };

  // Create a new marketplace listing
  const createListing = async (listingData: Partial<MarketplaceListing>) => {
    setMarketplaceLoading(true);
    setMarketplaceError(null);
    
    try {
      // In a real implementation, this would be a Supabase insert
      const newListing: MarketplaceListing = {
        id: `listing_${Date.now()}`,
        listing_date: new Date().toISOString(),
        status: 'active',
        verification_status: 'pending',
        featured: false,
        view_count: 0,
        interest_count: 0,
        ...listingData as MarketplaceListing,
      };

      // Update local state
      setListings(prev => [newListing, ...prev]);
      setUserListings(prev => [newListing, ...prev]);
      
      console.log("✅ Created new marketplace listing:", newListing.id);
      return newListing;
      
    } catch (error) {
      console.error("❌ Error creating listing:", error);
      setMarketplaceError("Failed to create listing");
      throw error;
    } finally {
      setMarketplaceLoading(false);
    }
  };

  // Make an offer on a listing
  const makeOffer = async (listingId: string, offerAmount: number, message?: string) => {
    setMarketplaceLoading(true);
    setMarketplaceError(null);
    
    try {
      // In a real implementation, this would be a Supabase insert
      const newOffer: MarketplaceOffer = {
        id: `offer_${Date.now()}`,
        listing_id: listingId,
        buyer_id: currentUser?.id || 'current_user',
        offer_amount: offerAmount,
        offer_date: new Date().toISOString(),
        message,
        status: 'pending',
        expiry_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      };

      setOffers(prev => [newOffer, ...prev]);
      
      console.log("✅ Made offer on listing:", listingId);
      return newOffer;
      
    } catch (error) {
      console.error("❌ Error making offer:", error);
      setMarketplaceError("Failed to make offer");
      throw error;
    } finally {
      setMarketplaceLoading(false);
    }
  };

  // Get marketplace statistics
  const getMarketplaceStats = async () => {
    try {
      return await getCachedMarketplaceData('marketplace_stats', async () => {
        return {
          total_listings: listings.length,
          active_listings: listings.filter(l => l.status === 'active').length,
          featured_listings: listings.filter(l => l.featured).length,
          verified_sellers: Math.floor(listings.length * 0.8),
          avg_listing_price: listings.reduce((sum, l) => sum + (l.asking_price || 0), 0) / listings.length,
          total_views: listings.reduce((sum, l) => sum + l.view_count, 0),
        };
      });
    } catch (error) {
      console.error("❌ Error getting marketplace stats:", error);
      return null;
    }
  };

  // Get car details for a listing (uses existing API)
  const getCarForListing = async (listingId: string) => {
    const listing = listings.find(l => l.id === listingId);
    if (!listing) return null;
    
    // Use existing car API to get detailed car information
    return await auctionAPI.fetchCarById(listing.car_id);
  };

  // Initialize marketplace
  useEffect(() => {
    // Set up current user (in real app, this would come from auth)
    setCurrentUser({
      id: 'current_user',
      username: 'marketplace_user',
      email: 'user@korauto.com',
      verification_status: 'verified',
      rating: 4.5,
      total_sales: 3,
      total_purchases: 7,
      joined_date: '2023-01-15',
      location: 'Seoul',
    });

    // Load initial marketplace data
    fetchMarketplaceListings();
  }, []);

  return {
    // Marketplace-specific data
    listings,
    userListings,
    offers,
    currentUser,
    
    // Marketplace-specific loading states
    marketplaceLoading,
    marketplaceError,
    
    // Marketplace-specific functions
    fetchMarketplaceListings,
    createListing,
    makeOffer,
    getMarketplaceStats,
    getCarForListing,
    
    // Re-export existing auction API for compatibility
    // This preserves all existing functionality
    ...auctionAPI,
    
    // Combined loading state
    loading: auctionAPI.loading || marketplaceLoading,
    
    // Combined error state (prioritize marketplace errors)
    error: marketplaceError || auctionAPI.error,
  };
};

export default useKorAutoMarketplace;