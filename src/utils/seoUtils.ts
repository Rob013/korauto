/**
 * Utility functions for SEO and social media meta tags
 */

interface CarMetaData {
  title: string;
  description: string;
  image: string;
  url: string;
  price?: number;
  year?: number;
  make?: string;
  model?: string;
}

/**
 * Get the base URL for the application
 */
const getBaseUrl = (): string => {
  if (typeof window !== 'undefined') {
    return `${window.location.protocol}//${window.location.host}`;
  }
  
  // Fallback for SSR or build time - use environment variable if available
  return process.env.VITE_BASE_URL || 'https://korautoks.com';
};

/**
 * Get the current page URL
 */
const getCurrentUrl = (): string => {
  if (typeof window !== 'undefined') {
    return window.location.href;
  }
  
  return getBaseUrl();
};

/**
 * Get the full image URL
 */
const getImageUrl = (imagePath: string): string => {
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }
  
  // For relative paths, use the base URL
  const baseUrl = getBaseUrl();
  return `${baseUrl}${imagePath.startsWith('/') ? imagePath : `/${imagePath}`}`;
};

/**
 * Generate car-specific meta tags for social media sharing
 */
export const generateCarMetaTags = (car: any, lot: string): CarMetaData => {
  const carTitle = car ? `${car.year} ${car.make} ${car.model}` : 'Car Details';
  const carPrice = car?.price ? `€${car.price.toLocaleString()}` : '';
  const lotInfo = lot ? `#${lot}` : '';
  
  const title = car 
    ? `${carTitle} ${carPrice} ${lotInfo} - KORAUTO`
    : 'KORAUTO - Premium Cars from South Korea';

  const description = car
    ? `${carTitle} in excellent condition. Price: ${carPrice}. ${car.mileage ? `Mileage: ${car.mileage}. ` : ''}${car.fuel ? `Fuel: ${car.fuel}. ` : ''}${car.transmission ? `Transmission: ${car.transmission}. ` : ''}Premium car import from South Korea with professional inspection.`
    : 'Find your perfect car from South Korea with best price and quality. Professional car inspection services and premium vehicle imports.';

  // Use the first car image if available, otherwise fallback to default logo
  const carImage = car?.images?.[0] || car?.image;
  const defaultLogo = '/lovable-uploads/3657dff4-7afd-45bb-9f8a-8d3f4ba8d7b4.png';
  const image = getImageUrl(carImage || defaultLogo);
  
  const url = getCurrentUrl();

  return {
    title,
    description,
    image,
    url,
    price: car?.price,
    year: car?.year,
    make: car?.make,
    model: car?.model
  };
};

/**
 * Default meta tags for non-car pages
 */
export const getDefaultMetaTags = (): CarMetaData => ({
  title: 'KORAUTO - Premium Cars from South Korea',
  description: 'Find your perfect car from South Korea with best price and quality. Professional car inspection services and premium vehicle imports.',
  image: getImageUrl('/lovable-uploads/3657dff4-7afd-45bb-9f8a-8d3f4ba8d7b4.png'),
  url: getCurrentUrl()
});