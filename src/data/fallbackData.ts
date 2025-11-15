import { getBrandLogo } from "./brandLogos";

export type EntityRef = {
  id: number;
  name: string;
  toString(): string;
};

export type FallbackLot = {
  lot: string;
  buy_now: number;
  currency?: string;
  status: number;
  sale_status: string;
  final_price?: number;
  odometer: {
    km: number;
    mi: number;
  };
  images: {
    normal: string[];
    big: string[];
  };
  domain: {
    name: string;
  };
  grade_iaai: string;
  insurance_v2?: {
    accidentCnt: number;
  };
  details?: {
    badge?: string;
    options?: {
      standard?: string[];
      choice?: string[];
      tuning?: string[];
    };
  };
};

export type FallbackCar = {
  id: string;
  lot_number: string;
  title: string;
  make: string;
  model: EntityRef;
  manufacturer: EntityRef;
  generation?: EntityRef;
  year: number;
  vin: string;
  fuel?: string;
  transmission?: { name: string };
  color?: string | { name: string };
  body_type?: { name: string };
  drive_wheel?: string;
  cylinders?: number;
  seats?: number;
  buy_now?: number;
  price?: number;
  mileage?: number;
  details?: {
    seats_count?: number;
    options?: {
      standard?: string[];
      choice?: string[];
      tuning?: string[];
    };
  };
  insurance_v2?: {
    accidentCnt: number;
  };
  lots: FallbackLot[];
  images: string[];
  source_api?: string;
};

const IMAGE_POOL = [
  "/lovable-uploads/3094fd63-7a92-4497-8103-e166b6b09f70.png",
  "/lovable-uploads/3657dff4-7afd-45bb-9f8a-8d3f4ba8d7b4.png",
  "/lovable-uploads/7a3e2aa4-2a3b-4320-b33c-72d3d7721cfd.png",
  "/lovable-uploads/91efade6-53ff-4c15-ae10-6ac8f338c2b9.png",
  "/lovable-uploads/d1ff645d-f293-44ab-b806-ae5eb2483633.png",
  "/lovable-uploads/fb2b9889-d3da-4280-a77b-7567f307aed5.png",
  "/placeholder.svg",
];

const createEntityRef = (id: number, name: string): EntityRef => ({
  id,
  name,
  toString() {
    return name;
  },
});

const pickImages = (indexes: number[]): string[] =>
  indexes.map((index) => IMAGE_POOL[index % IMAGE_POOL.length]);

type FallbackCarDefinition = {
  id: string;
  lot: string;
  manufacturerId: number;
  manufacturerName: string;
  modelId: number;
  modelName: string;
  generationId?: number;
  generationName?: string;
  year: number;
  vin: string;
  fuel: string;
  transmission: string;
  color: string;
  bodyType: string;
  drive: string;
  cylinders: number;
  seats: number;
  mileageKm: number;
  buyNow: number;
  source: "encar" | "kbchachacha";
  grade: string;
  accidentCnt: number;
  standardOptions: string[];
  choiceOptions: string[];
  images: number[];
  titleSuffix?: string;
};

const asMi = (km: number) => Math.round(km * 0.621371);

const fallbackCarDefinitions: FallbackCarDefinition[] = [
  {
    id: "fallback-bmw-x5-2021",
    lot: "ENC-52130",
    manufacturerId: 1001,
    manufacturerName: "BMW",
    modelId: 10101,
    modelName: "X5 xDrive40d",
    year: 2021,
    vin: "WBA11BJ0500F12345",
    fuel: "Diesel",
    transmission: "Automatik",
    color: "Mineral White",
    bodyType: "SUV",
    drive: "AWD",
    cylinders: 6,
    seats: 5,
    mileageKm: 48000,
    buyNow: 38500,
    source: "encar",
    grade: "4.5",
    accidentCnt: 0,
    standardOptions: ["Navigacion profesional", "Sedilje me ngrohje", "Head-up display"],
    choiceOptions: ["Suspension ajri", "Asistent parkimi 360°"],
    images: [0, 1, 6],
    titleSuffix: "Luxury Line",
  },
  {
    id: "fallback-audi-q7-2022",
    lot: "ENC-53342",
    manufacturerId: 1002,
    manufacturerName: "Audi",
    modelId: 10201,
    modelName: "Q7 55 TFSI",
    year: 2022,
    vin: "WAUZZZ4M9ND001256",
    fuel: "Gasoline",
    transmission: "Tiptronic",
    color: "Glacier White",
    bodyType: "SUV",
    drive: "quattro",
    cylinders: 6,
    seats: 7,
    mileageKm: 39200,
    buyNow: 41200,
    source: "encar",
    grade: "4.0",
    accidentCnt: 0,
    standardOptions: ["Virtual cockpit", "Matrix LED", "Bang & Olufsen audio"],
    choiceOptions: ["Asistent trafiku", "Suspension adaptiv"],
    images: [2, 3, 6],
    titleSuffix: "S line",
  },
  {
    id: "fallback-mercedes-c300-2020",
    lot: "KBC-44811",
    manufacturerId: 1003,
    manufacturerName: "Mercedes-Benz",
    modelId: 10301,
    modelName: "C300 4MATIC",
    year: 2020,
    vin: "WDD2050841R557889",
    fuel: "Gasoline",
    transmission: "9G-Tronic",
    color: "Obsidian Black",
    bodyType: "Sedan",
    drive: "AWD",
    cylinders: 4,
    seats: 5,
    mileageKm: 51500,
    buyNow: 29800,
    source: "kbchachacha",
    grade: "4.0",
    accidentCnt: 0,
    standardOptions: ["MBUX", "Sedilje me ngrohje", "Park Pilot"],
    choiceOptions: ["Interier AMG", "Sound Burmester"],
    images: [4, 5, 6],
    titleSuffix: "AMG Line",
  },
  {
    id: "fallback-lexus-rx350-2021",
    lot: "ENC-50198",
    manufacturerId: 1004,
    manufacturerName: "Lexus",
    modelId: 10401,
    modelName: "RX350",
    year: 2021,
    vin: "JTJBZMCA5M2055521",
    fuel: "Gasoline",
    transmission: "Automatik",
    color: "Sonic Titanium",
    bodyType: "SUV",
    drive: "AWD",
    cylinders: 6,
    seats: 5,
    mileageKm: 35500,
    buyNow: 36900,
    source: "encar",
    grade: "4.5",
    accidentCnt: 0,
    standardOptions: ["Lexus Safety System", "Sedilje ventilim", "Portbagazh elektrik"],
    choiceOptions: ["Heads-up display", "Suspension adaptiv"],
    images: [1, 3, 6],
  },
  {
    id: "fallback-porsche-cayenne-2019",
    lot: "ENC-48900",
    manufacturerId: 1005,
    manufacturerName: "Porsche",
    modelId: 10501,
    modelName: "Cayenne",
    year: 2019,
    vin: "WP1ZZZ9YZKDA62311",
    fuel: "Gasoline",
    transmission: "Tiptronic S",
    color: "Jet Black",
    bodyType: "SUV",
    drive: "AWD",
    cylinders: 6,
    seats: 5,
    mileageKm: 60200,
    buyNow: 52900,
    source: "encar",
    grade: "3.5",
    accidentCnt: 0,
    standardOptions: ["PCM 12\"", "PAS", "ParkAssist"],
    choiceOptions: ["Sport Chrono", "Sedilje masazh"],
    images: [0, 2, 6],
  },
  {
    id: "fallback-range-rover-2020",
    lot: "KBC-43110",
    manufacturerId: 1006,
    manufacturerName: "Land Rover",
    modelId: 10601,
    modelName: "Range Rover Vogue",
    year: 2020,
    vin: "SALGA2AN0LA599210",
    fuel: "Diesel",
    transmission: "ZF 8HP",
    color: "Aruba",
    bodyType: "SUV",
    drive: "AWD",
    cylinders: 8,
    seats: 5,
    mileageKm: 48800,
    buyNow: 61800,
    source: "kbchachacha",
    grade: "4.0",
    accidentCnt: 0,
    standardOptions: ["Terrain Response 2", "Meridian audio", "Sedilje me masazh"],
    choiceOptions: ["Panoramic roof", "Black pack"],
    images: [5, 4, 6],
  },
  {
    id: "fallback-hyundai-palisade-2022",
    lot: "ENC-54567",
    manufacturerId: 1007,
    manufacturerName: "Hyundai",
    modelId: 10701,
    modelName: "Palisade Calligraphy",
    year: 2022,
    vin: "KM8R5DHE6NU412345",
    fuel: "Gasoline",
    transmission: "Automatik",
    color: "Moonlight Cloud",
    bodyType: "SUV",
    drive: "AWD",
    cylinders: 6,
    seats: 7,
    mileageKm: 27300,
    buyNow: 35800,
    source: "encar",
    grade: "4.5",
    accidentCnt: 0,
    standardOptions: ["Hyundai SmartSense", "Sedilje kapitene", "Sistem 12\""],
    choiceOptions: ["Ventilim rreshti i dytë", "Konsolë e brendshme"],
    images: [3, 1, 6],
  },
  {
    id: "fallback-kia-sorento-2022",
    lot: "ENC-54401",
    manufacturerId: 1008,
    manufacturerName: "Kia",
    modelId: 10801,
    modelName: "Sorento SX Prestige",
    year: 2022,
    vin: "KNDRMDLH6N5257890",
    fuel: "Hybrid",
    transmission: "6DCT",
    color: "Snow White Pearl",
    bodyType: "SUV",
    drive: "AWD",
    cylinders: 4,
    seats: 6,
    mileageKm: 24100,
    buyNow: 34200,
    source: "encar",
    grade: "4.5",
    accidentCnt: 0,
    standardOptions: ["UVO infotainment", "Asistent korsie", "Sedilje të ventiluar"],
    choiceOptions: ["Head-up display", "Sistem Bose"],
    images: [4, 2, 6],
  },
  {
    id: "fallback-honda-pilot-2020",
    lot: "KBC-42011",
    manufacturerId: 1009,
    manufacturerName: "Honda",
    modelId: 10901,
    modelName: "Pilot Touring",
    year: 2020,
    vin: "5FNYF6H90LB012345",
    fuel: "Gasoline",
    transmission: "9AT",
    color: "Modern Steel",
    bodyType: "SUV",
    drive: "AWD",
    cylinders: 6,
    seats: 8,
    mileageKm: 58700,
    buyNow: 28900,
    source: "kbchachacha",
    grade: "3.5",
    accidentCnt: 0,
    standardOptions: ["Honda Sensing", "Cabin Talk", "Blu-ray entertainment"],
    choiceOptions: ["Towing paketë", "Defender pllakash"],
    images: [0, 5, 6],
  },
  {
    id: "fallback-volvo-xc90-2021",
    lot: "ENC-53002",
    manufacturerId: 1010,
    manufacturerName: "Volvo",
    modelId: 11001,
    modelName: "XC90 T8 Recharge",
    year: 2021,
    vin: "YV4BR0BK7M1678901",
    fuel: "Plug-in Hybrid",
    transmission: "Geartronic",
    color: "Thunder Grey",
    bodyType: "SUV",
    drive: "AWD",
    cylinders: 4,
    seats: 7,
    mileageKm: 36500,
    buyNow: 45800,
    source: "encar",
    grade: "4.0",
    accidentCnt: 0,
    standardOptions: ["Pilot Assist", "Air suspension", "Bowers & Wilkins"],
    choiceOptions: ["Integrated booster", "Crystal shifter"],
    images: [1, 4, 6],
  },
  {
    id: "fallback-tesla-model3-2022",
    lot: "ENC-55590",
    manufacturerId: 1011,
    manufacturerName: "Tesla",
    modelId: 11101,
    modelName: "Model 3 Long Range",
    year: 2022,
    vin: "5YJ3E1EA3NF210987",
    fuel: "Electric",
    transmission: "Single speed",
    color: "Pearl White Multi-Coat",
    bodyType: "Sedan",
    drive: "AWD",
    cylinders: 0,
    seats: 5,
    mileageKm: 21400,
    buyNow: 42900,
    source: "encar",
    grade: "4.5",
    accidentCnt: 0,
    standardOptions: ["Autopilot", "Premium connectivity", "Glas roof"],
    choiceOptions: ["Full Self Driving", "Felne 19\""],
    images: [2, 5, 6],
  },
  {
    id: "fallback-toyota-landcruiser-2021",
    lot: "KBC-46004",
    manufacturerId: 1012,
    manufacturerName: "Toyota",
    modelId: 11201,
    modelName: "Land Cruiser ZX",
    year: 2021,
    vin: "JTMHJ9BJ6M4088123",
    fuel: "Diesel",
    transmission: "10AT",
    color: "Graphite Metallic",
    bodyType: "SUV",
    drive: "4WD",
    cylinders: 8,
    seats: 7,
    mileageKm: 33800,
    buyNow: 67400,
    source: "kbchachacha",
    grade: "4.5",
    accidentCnt: 0,
    standardOptions: ["Crawl Control", "KDSS", "Sedilje premium"],
    choiceOptions: ["Frigorifer qendror", "Roof rack OEM"],
    images: [3, 0, 6],
  },
];

const buildFallbackCar = (definition: FallbackCarDefinition): FallbackCar => {
  const manufacturer = createEntityRef(definition.manufacturerId, definition.manufacturerName);
  const model = createEntityRef(definition.modelId, definition.modelName);
  const generation =
    definition.generationId && definition.generationName
      ? createEntityRef(definition.generationId, definition.generationName)
      : undefined;

  const images = pickImages(definition.images);
  const lot: FallbackLot = {
    lot: definition.lot,
    buy_now: definition.buyNow,
    currency: "USD",
    status: 1,
    sale_status: "AVAILABLE",
    final_price: definition.buyNow,
    odometer: {
      km: definition.mileageKm,
      mi: asMi(definition.mileageKm),
    },
    images: {
      normal: images,
      big: images,
    },
    domain: {
      name: definition.source,
    },
    grade_iaai: definition.grade,
    insurance_v2: {
      accidentCnt: definition.accidentCnt,
    },
    details: {
      badge: definition.titleSuffix ?? "Premium",
      options: {
        standard: [...definition.standardOptions],
        choice: [...definition.choiceOptions],
      },
    },
  };

  return {
    id: definition.id,
    lot_number: definition.lot,
    title: `${definition.year} ${definition.manufacturerName} ${definition.modelName}${
      definition.titleSuffix ? ` ${definition.titleSuffix}` : ""
    }`,
    make: definition.manufacturerName,
    manufacturer,
    model,
    generation,
    year: definition.year,
    vin: definition.vin,
    fuel: definition.fuel,
    transmission: { name: definition.transmission },
    color: definition.color,
    body_type: { name: definition.bodyType },
    drive_wheel: definition.drive,
    cylinders: definition.cylinders,
    seats: definition.seats,
    buy_now: definition.buyNow,
    price: definition.buyNow,
    mileage: definition.mileageKm,
    details: {
      seats_count: definition.seats,
      options: {
        standard: [...definition.standardOptions],
        choice: [...definition.choiceOptions],
      },
    },
    insurance_v2: {
      accidentCnt: definition.accidentCnt,
    },
    lots: [lot],
    images,
    source_api: definition.source,
  };
};

export const fallbackCars: FallbackCar[] = fallbackCarDefinitions.map(buildFallbackCar);

type FallbackManufacturer = {
  id: number;
  name: string;
  cars_qty: number;
  car_count: number;
  image?: string;
};

const manufacturerMap = new Map<number, FallbackManufacturer>();

for (const car of fallbackCars) {
  const existing = manufacturerMap.get(car.manufacturer.id);
  if (existing) {
    existing.cars_qty += 1;
    existing.car_count += 1;
    continue;
  }
  manufacturerMap.set(car.manufacturer.id, {
    id: car.manufacturer.id,
    name: car.manufacturer.name,
    cars_qty: 1,
    car_count: 1,
    image: getBrandLogo(car.manufacturer.name) ?? undefined,
  });
}

export const fallbackManufacturers: FallbackManufacturer[] = Array.from(
  manufacturerMap.values(),
).sort((a, b) => a.name.localeCompare(b.name));

export const cloneFallbackCar = (car: FallbackCar): FallbackCar => {
  const manufacturer = createEntityRef(car.manufacturer.id, car.manufacturer.name);
  const model = createEntityRef(car.model.id, car.model.name);
  const generation = car.generation
    ? createEntityRef(car.generation.id, car.generation.name)
    : undefined;

  return {
    ...car,
    manufacturer,
    model,
    generation,
    details: car.details
      ? {
          seats_count: car.details.seats_count,
          options: car.details.options
            ? {
                standard: [...(car.details.options.standard || [])],
                choice: [...(car.details.options.choice || [])],
                tuning: [...(car.details.options.tuning || [])],
              }
            : undefined,
        }
      : undefined,
    insurance_v2: car.insurance_v2
      ? {
          accidentCnt: car.insurance_v2.accidentCnt,
        }
      : undefined,
    lots: car.lots.map((lot) => ({
      ...lot,
      odometer: { ...lot.odometer },
      images: {
        normal: [...lot.images.normal],
        big: [...lot.images.big],
      },
      domain: { ...lot.domain },
      insurance_v2: lot.insurance_v2 ? { ...lot.insurance_v2 } : undefined,
      details: lot.details
        ? {
            ...lot.details,
            options: lot.details.options
              ? {
                  standard: [...(lot.details.options.standard || [])],
                  choice: [...(lot.details.options.choice || [])],
                  tuning: [...(lot.details.options.tuning || [])],
                }
              : undefined,
          }
        : undefined,
    })),
    images: [...car.images],
  };
};