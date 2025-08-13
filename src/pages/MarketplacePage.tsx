import { useState, useEffect } from "react";
import { useKorAutoMarketplace } from "@/hooks/korauto_marketplace";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Heart, MapPin, Eye, Calendar, Car, DollarSign, User, Clock, Star } from "lucide-react";
import { toast } from "sonner";

const MarketplacePage = () => {
  const marketplace = useKorAutoMarketplace();
  const [filters, setFilters] = useState({
    listing_type: '',
    price_min: '',
    price_max: '',
    location: '',
    verified_only: false,
    featured_only: false,
  });
  const [selectedListing, setSelectedListing] = useState<string | null>(null);
  const [offerAmount, setOfferAmount] = useState('');

  // Handle filter changes and fetch listings
  const handleFilterChange = (key: string, value: any) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    
    // Convert string values to appropriate types for API
    const apiFilters = {
      ...newFilters,
      price_min: newFilters.price_min ? parseInt(newFilters.price_min) : undefined,
      price_max: newFilters.price_max ? parseInt(newFilters.price_max) : undefined,
    };
    
    marketplace.fetchMarketplaceListings(apiFilters);
  };

  // Handle making an offer
  const handleMakeOffer = async (listingId: string) => {
    if (!offerAmount) {
      toast.error("Please enter an offer amount");
      return;
    }

    try {
      await marketplace.makeOffer(listingId, parseInt(offerAmount));
      toast.success("Offer submitted successfully!");
      setSelectedListing(null);
      setOfferAmount('');
    } catch (error) {
      toast.error("Failed to submit offer");
    }
  };

  // Format price for display
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW',
    }).format(price);
  };

  // Get status badge color (using existing theme colors)
  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'sold': return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
      case 'expired': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300';
      default: return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
    }
  };

  // Loading skeleton component
  const ListingSkeleton = () => (
    <Card className="card-enhanced">
      <Skeleton className="h-48 w-full rounded-t-lg" />
      <CardContent className="p-4">
        <Skeleton className="h-6 w-3/4 mb-2" />
        <Skeleton className="h-4 w-1/2 mb-4" />
        <div className="flex gap-2 mb-3">
          <Skeleton className="h-6 w-16" />
          <Skeleton className="h-6 w-20" />
        </div>
        <Skeleton className="h-8 w-full" />
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header - using existing theme colors */}
      <div className="bg-card border-b">
        <div className="container-responsive py-6">
          <div className="flex items-center gap-3 mb-4">
            <Car className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold text-foreground">KorAuto Marketplace</h1>
          </div>
          <p className="text-muted-foreground">Buy and sell cars directly with other users</p>
        </div>
      </div>

      <div className="container-responsive py-6">
        <div className="grid lg:grid-cols-4 gap-6">
          {/* Filters Sidebar - using existing design patterns */}
          <div className="lg:col-span-1">
            <Card className="sticky top-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Filters
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Listing Type Filter */}
                <div>
                  <label className="text-sm font-medium">Listing Type</label>
                  <Select value={filters.listing_type} onValueChange={(value) => handleFilterChange('listing_type', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="All types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All types</SelectItem>
                      <SelectItem value="auction">Auction</SelectItem>
                      <SelectItem value="fixed_price">Fixed Price</SelectItem>
                      <SelectItem value="negotiable">Negotiable</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Price Range */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-sm font-medium">Min Price</label>
                    <Input
                      type="number"
                      placeholder="Min"
                      value={filters.price_min}
                      onChange={(e) => handleFilterChange('price_min', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Max Price</label>
                    <Input
                      type="number"
                      placeholder="Max"
                      value={filters.price_max}
                      onChange={(e) => handleFilterChange('price_max', e.target.value)}
                    />
                  </div>
                </div>

                {/* Location Filter */}
                <div>
                  <label className="text-sm font-medium">Location</label>
                  <Input
                    placeholder="Enter city..."
                    value={filters.location}
                    onChange={(e) => handleFilterChange('location', e.target.value)}
                  />
                </div>

                {/* Quick Filters */}
                <div className="space-y-2">
                  <Button
                    variant={filters.verified_only ? "default" : "outline"}
                    size="sm"
                    className="w-full"
                    onClick={() => handleFilterChange('verified_only', !filters.verified_only)}
                  >
                    Verified Sellers Only
                  </Button>
                  <Button
                    variant={filters.featured_only ? "default" : "outline"}
                    size="sm"
                    className="w-full"
                    onClick={() => handleFilterChange('featured_only', !filters.featured_only)}
                  >
                    Featured Listings
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Listings Grid */}
          <div className="lg:col-span-3">
            {/* Results Summary */}
            <div className="flex items-center justify-between mb-6">
              <div className="text-sm text-muted-foreground">
                {marketplace.loading ? "Loading..." : `${marketplace.listings.length} listings found`}
              </div>
              <div className="flex items-center gap-2">
                <Star className="h-4 w-4 text-yellow-500" />
                <span className="text-sm text-muted-foreground">Featured listings shown first</span>
              </div>
            </div>

            {/* Loading State */}
            {marketplace.loading && (
              <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                {[...Array(6)].map((_, i) => (
                  <ListingSkeleton key={i} />
                ))}
              </div>
            )}

            {/* Error State */}
            {marketplace.error && (
              <Card className="p-8 text-center">
                <div className="text-destructive font-medium mb-2">Error Loading Listings</div>
                <div className="text-muted-foreground mb-4">{marketplace.error}</div>
                <Button onClick={() => marketplace.fetchMarketplaceListings()}>
                  Try Again
                </Button>
              </Card>
            )}

            {/* Listings Grid */}
            {!marketplace.loading && !marketplace.error && (
              <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                {marketplace.listings.map((listing) => {
                  // Get car data for this listing
                  const car = marketplace.cars.find(c => c.id.toString() === listing.car_id);
                  
                  return (
                    <Card key={listing.id} className="card-enhanced overflow-hidden">
                      {/* Car Image */}
                      <div className="relative h-48 bg-gray-100 dark:bg-gray-800">
                        {car?.lots?.[0]?.images?.normal?.[0] ? (
                          <img
                            src={car.lots[0].images.normal[0]}
                            alt={car.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Car className="h-16 w-16 text-muted-foreground" />
                          </div>
                        )}
                        
                        {/* Featured Badge */}
                        {listing.featured && (
                          <Badge className="absolute top-2 right-2 bg-yellow-500 text-yellow-900">
                            <Star className="h-3 w-3 mr-1" />
                            Featured
                          </Badge>
                        )}

                        {/* Verification Badge */}
                        {listing.verification_status === 'verified' && (
                          <Badge className="absolute top-2 left-2 bg-green-500 text-white">
                            ✓ Verified
                          </Badge>
                        )}
                      </div>

                      <CardContent className="p-4">
                        {/* Car Title */}
                        <h3 className="font-semibold text-lg mb-2 line-clamp-2">
                          {car?.title || "Car Information Loading..."}
                        </h3>

                        {/* Price */}
                        <div className="text-2xl font-bold text-primary mb-3">
                          {listing.asking_price ? formatPrice(listing.asking_price) : "Price on request"}
                        </div>

                        {/* Status and Type Badges */}
                        <div className="flex gap-2 mb-3">
                          <Badge className={getStatusBadgeColor(listing.status)}>
                            {listing.status}
                          </Badge>
                          <Badge variant="outline">
                            {listing.listing_type.replace('_', ' ')}
                          </Badge>
                        </div>

                        {/* Details */}
                        <div className="space-y-1 text-sm text-muted-foreground mb-4">
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {listing.location}
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            Listed {new Date(listing.listing_date).toLocaleDateString()}
                          </div>
                          <div className="flex items-center gap-1">
                            <Eye className="h-3 w-3" />
                            {listing.view_count} views
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="space-y-2">
                          <Button 
                            className="w-full" 
                            onClick={() => setSelectedListing(listing.id)}
                            disabled={listing.status !== 'active'}
                          >
                            {listing.listing_type === 'auction' ? 'Place Bid' : 'Make Offer'}
                          </Button>
                          
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm" className="flex-1">
                              <User className="h-3 w-3 mr-1" />
                              Seller
                            </Button>
                            <Button variant="outline" size="sm">
                              <Heart className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}

            {/* Empty State */}
            {!marketplace.loading && !marketplace.error && marketplace.listings.length === 0 && (
              <Card className="p-12 text-center">
                <Car className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No listings found</h3>
                <p className="text-muted-foreground mb-4">
                  Try adjusting your filters or check back later for new listings.
                </p>
                <Button onClick={() => {
                  setFilters({
                    listing_type: '',
                    price_min: '',
                    price_max: '',
                    location: '',
                    verified_only: false,
                    featured_only: false,
                  });
                  marketplace.fetchMarketplaceListings();
                }}>
                  Clear Filters
                </Button>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Offer Modal */}
      {selectedListing && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Make an Offer</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">Offer Amount (KRW)</label>
                <Input
                  type="number"
                  placeholder="Enter your offer..."
                  value={offerAmount}
                  onChange={(e) => setOfferAmount(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <Button 
                  className="flex-1" 
                  onClick={() => handleMakeOffer(selectedListing)}
                  disabled={marketplace.marketplaceLoading}
                >
                  {marketplace.marketplaceLoading ? "Submitting..." : "Submit Offer"}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setSelectedListing(null);
                    setOfferAmount('');
                  }}
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default MarketplacePage;