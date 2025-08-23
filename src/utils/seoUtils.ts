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
  const image = car?.images?.[0] || car?.image || 'https://korautoks.com/lovable-uploads/3657dff4-7afd-45bb-9f8a-8d3f4ba8d7b4.png';
  
  const url = typeof window !== 'undefined' ? window.location.href : 'https://korautoks.com';

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
  image: 'https://korautoks.com/lovable-uploads/3657dff4-7afd-45bb-9f8a-8d3f4ba8d7b4.png',
  url: typeof window !== 'undefined' ? window.location.href : 'https://korautoks.com'
});