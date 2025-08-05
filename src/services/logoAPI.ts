/**
 * Logo API service for fetching car manufacturer logos from reliable sources
 */

// Official domains for major car manufacturers
const MANUFACTURER_DOMAINS: Record<string, string> = {
  'BMW': 'bmw.com',
  'Mercedes-Benz': 'mercedes-benz.com',
  'Audi': 'audi.com',
  'Volkswagen': 'volkswagen.com',
  'Porsche': 'porsche.com',
  'Opel': 'opel.com',
  'Hyundai': 'hyundai.com',
  'Kia': 'kia.com',
  'Genesis': 'genesis.com',
  'Toyota': 'toyota.com',
  'Honda': 'honda.com',
  'Nissan': 'nissan.com',
  'Mazda': 'mazda.com',
  'Subaru': 'subaru.com',
  'Mitsubishi': 'mitsubishi-motors.com',
  'Lexus': 'lexus.com',
  'Infiniti': 'infiniti.com',
  'Acura': 'acura.com',
  'Ford': 'ford.com',
  'Chevrolet': 'chevrolet.com',
  'Cadillac': 'cadillac.com',
  'GMC': 'gmc.com',
  'Tesla': 'tesla.com',
  'Chrysler': 'chrysler.com',
  'Jeep': 'jeep.com',
  'Dodge': 'dodge.com',
  'Land Rover': 'landrover.com',
  'Jaguar': 'jaguar.com',
  'Volvo': 'volvocars.com',
  'Ferrari': 'ferrari.com',
  'Lamborghini': 'lamborghini.com',
  'Maserati': 'maserati.com',
  'Bentley': 'bentley.com',
  'Rolls-Royce': 'rolls-roycemotorcars.com',
  'Aston Martin': 'astonmartin.com',
  'McLaren': 'mclaren.com',
  'Peugeot': 'peugeot.com',
  'Renault': 'renault.com',
  'Citroën': 'citroen.com',
  'Fiat': 'fiat.com',
  'Alfa Romeo': 'alfaromeo.com',
  'Skoda': 'skoda.com',
  'Seat': 'seat.com',
  'Mini': 'mini.com'
};

export interface LogoSource {
  url: string;
  type: 'clearbit' | 'carlogos' | 'wikipedia' | 'local' | 'cdn';
  priority: number;
}

/**
 * Generate multiple logo sources for a manufacturer with different APIs and fallbacks
 */
export const generateLogoSources = (manufacturerName: string): LogoSource[] => {
  const sources: LogoSource[] = [];
  const domain = MANUFACTURER_DOMAINS[manufacturerName];
  const normalizedName = manufacturerName.toLowerCase().replace(/[^a-z0-9]/g, '');

  // 1. Local logo (highest priority)
  sources.push({
    url: `/logos/${normalizedName}.svg`,
    type: 'local',
    priority: 1
  });

  // 2. Clearbit API with official domain (very reliable)
  if (domain) {
    sources.push({
      url: `https://logo.clearbit.com/${domain}`,
      type: 'clearbit',
      priority: 2
    });
  }

  // 3. CarLogos.org (specialized for car brands)
  sources.push({
    url: `https://www.carlogos.org/car-logos/${normalizedName}-logo.png`,
    type: 'carlogos',
    priority: 3
  });

  // 4. Alternative CarLogos.org format
  sources.push({
    url: `https://www.carlogos.org/logo/${manufacturerName.replace(/\s+/g, '-').toLowerCase()}.png`,
    type: 'carlogos',
    priority: 4
  });

  // 5. Wikipedia/Wikimedia Commons (high quality, reliable)
  sources.push({
    url: `https://upload.wikimedia.org/wikipedia/commons/thumb/d/d5/${manufacturerName.replace(/\s+/g, '_')}_logo.svg/200px-${manufacturerName.replace(/\s+/g, '_')}_logo.svg.png`,
    type: 'wikipedia',
    priority: 5
  });

  // 6. CDN fallbacks (existing reliable sources)
  sources.push({
    url: `https://cdn.freebiesupply.com/logos/large/2x/${normalizedName}-logo-png-transparent.png`,
    type: 'cdn',
    priority: 6
  });

  // 7. Google S2 Favicon service (good fallback)
  if (domain) {
    sources.push({
      url: `https://www.google.com/s2/favicons?sz=64&domain=${domain}`,
      type: 'clearbit',
      priority: 7
    });
  }

  return sources.sort((a, b) => a.priority - b.priority);
};

/**
 * Test if a logo URL is accessible
 */
export const testLogoUrl = async (url: string): Promise<boolean> => {
  try {
    const response = await fetch(url, { 
      method: 'HEAD',
      mode: 'no-cors' // Handle CORS issues
    });
    return response.ok;
  } catch (error) {
    // For no-cors mode, we can't check the actual response
    // so we'll rely on the image onLoad/onError events
    return false;
  }
};

/**
 * Get the best available logo URL for a manufacturer
 */
export const getBestLogoUrl = async (manufacturerName: string): Promise<string | null> => {
  const sources = generateLogoSources(manufacturerName);
  
  // For now, return the first source since we'll handle testing in the component
  // This allows for immediate display while testing happens in the background
  return sources.length > 0 ? sources[0].url : null;
};

/**
 * Preload logos for better performance
 */
export const preloadLogos = (manufacturerNames: string[]): void => {
  manufacturerNames.forEach(name => {
    const sources = generateLogoSources(name);
    sources.slice(0, 3).forEach(source => { // Preload top 3 sources
      const img = new Image();
      img.src = source.url;
    });
  });
};

export default {
  generateLogoSources,
  getBestLogoUrl,
  testLogoUrl,
  preloadLogos
};