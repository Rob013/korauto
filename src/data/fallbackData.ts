import { getBrandLogo } from "./brandLogos";

const PLACEHOLDER_IMAGE = "/images/car-placeholder.jpg";

type ManufacturerDefinition = {
  id: number;
  name: string;
};

type ModelDefinition = {
  id: number;
  name: string;
  manufacturer_id: number;
};

type GenerationDefinition = {
  id: number;
  name: string;
  manufacturer_id: number;
  model_id: number;
  from_year: number;
  to_year: number;
};

type FallbackCarSeed = {
  id: string;
  lotNumber: string;
  title: string;
  manufacturerId: number;
  modelId: number;
  generationId: number;
  year: number;
  grade: string;
  engine: string;
  powerKw: number;
  powerHp: number;
  fuel: string;
  transmission: string;
  bodyType: string;
  color: string;
  seats: number;
  buyNow: number;
  finalBid: number;
  odometerKm: number;
  vin: string;
  accidentCnt?: number;
  source?: string;
};

const MANUFACTURERS: ManufacturerDefinition[] = [
  { id: 1, name: "Audi" },
  { id: 9, name: "BMW" },
  { id: 16, name: "Mercedes-Benz" },
  { id: 32, name: "Toyota" },
  { id: 48, name: "Ford" },
  { id: 64, name: "Honda" },
  { id: 75, name: "Hyundai" },
  { id: 86, name: "Kia" },
  { id: 92, name: "Genesis" },
  { id: 161, name: "Tesla" },
];

const MODELS: ModelDefinition[] = [
  { id: 1001, manufacturer_id: 1, name: "Q5" },
  { id: 9001, manufacturer_id: 9, name: "i4" },
  { id: 1601, manufacturer_id: 16, name: "GLC" },
  { id: 3201, manufacturer_id: 32, name: "Camry" },
  { id: 3202, manufacturer_id: 32, name: "RAV4" },
  { id: 4801, manufacturer_id: 48, name: "Explorer" },
  { id: 6401, manufacturer_id: 64, name: "CR-V" },
  { id: 7501, manufacturer_id: 75, name: "Ioniq 5" },
  { id: 7502, manufacturer_id: 75, name: "Santa Fe" },
  { id: 8601, manufacturer_id: 86, name: "EV6" },
  { id: 9201, manufacturer_id: 92, name: "GV70" },
  { id: 16101, manufacturer_id: 161, name: "Model 3" },
];

const GENERATIONS: GenerationDefinition[] = [
  { id: 100101, manufacturer_id: 1, model_id: 1001, name: "FY (Facelift)", from_year: 2021, to_year: 2024 },
  { id: 900101, manufacturer_id: 9, model_id: 9001, name: "G26", from_year: 2021, to_year: 2024 },
  { id: 160101, manufacturer_id: 16, model_id: 1601, name: "X254", from_year: 2020, to_year: 2024 },
  { id: 320101, manufacturer_id: 32, model_id: 3201, name: "XV70", from_year: 2018, to_year: 2024 },
  { id: 320201, manufacturer_id: 32, model_id: 3202, name: "XA50", from_year: 2019, to_year: 2024 },
  { id: 480101, manufacturer_id: 48, model_id: 4801, name: "U625", from_year: 2020, to_year: 2024 },
  { id: 640101, manufacturer_id: 64, model_id: 6401, name: "RW2", from_year: 2020, to_year: 2024 },
  { id: 750101, manufacturer_id: 75, model_id: 7501, name: "NE", from_year: 2021, to_year: 2024 },
  { id: 750201, manufacturer_id: 75, model_id: 7502, name: "TM", from_year: 2020, to_year: 2024 },
  { id: 860101, manufacturer_id: 86, model_id: 8601, name: "CV", from_year: 2021, to_year: 2024 },
  { id: 920101, manufacturer_id: 92, model_id: 9201, name: "MK1", from_year: 2021, to_year: 2024 },
  { id: 1610101, manufacturer_id: 161, model_id: 16101, name: "Highland", from_year: 2023, to_year: 2025 },
];

const FALLBACK_CAR_SEEDS: FallbackCarSeed[] = [
  {
    id: "fb-car-1",
    lotNumber: "FB001",
    title: "2022 Toyota Camry Hybrid",
    manufacturerId: 32,
    modelId: 3201,
    generationId: 320101,
    year: 2022,
    grade: "Hybrid Premium",
    engine: "2.5L Hybrid E-CVT",
    powerKw: 160,
    powerHp: 215,
    fuel: "Hybrid",
    transmission: "Automatic",
    bodyType: "Sedan",
    color: "Pearl White",
    seats: 5,
    buyNow: 21500,
    finalBid: 21000,
    odometerKm: 18200,
    vin: "JTNB11HK7N3012345",
  },
  {
    id: "fb-car-2",
    lotNumber: "FB002",
    title: "2021 Toyota RAV4 Prime",
    manufacturerId: 32,
    modelId: 3202,
    generationId: 320201,
    year: 2021,
    grade: "Prime XSE",
    engine: "2.5L Hybrid AWD",
    powerKw: 225,
    powerHp: 302,
    fuel: "Hybrid",
    transmission: "Automatic",
    bodyType: "SUV",
    color: "Midnight Black",
    seats: 5,
    buyNow: 31800,
    finalBid: 31000,
    odometerKm: 26500,
    vin: "JTMGB3FV6M1234567",
  },
  {
    id: "fb-car-3",
    lotNumber: "FB003",
    title: "2023 Hyundai Ioniq 5 Tech",
    manufacturerId: 75,
    modelId: 7501,
    generationId: 750101,
    year: 2023,
    grade: "Tech AWD",
    engine: "77.4 kWh Dual Motor",
    powerKw: 239,
    powerHp: 321,
    fuel: "Electric",
    transmission: "Automatic",
    bodyType: "Crossover",
    color: "Cyber Gray",
    seats: 5,
    buyNow: 46500,
    finalBid: 45200,
    odometerKm: 9800,
    vin: "KM8KNDAF3PU123456",
  },
  {
    id: "fb-car-4",
    lotNumber: "FB004",
    title: "2022 Hyundai Santa Fe Calligraphy",
    manufacturerId: 75,
    modelId: 7502,
    generationId: 750201,
    year: 2022,
    grade: "Calligraphy Diesel",
    engine: "2.2L CRDi AWD",
    powerKw: 149,
    powerHp: 200,
    fuel: "Diesel",
    transmission: "Automatic",
    bodyType: "SUV",
    color: "Lagoon Blue",
    seats: 7,
    buyNow: 38900,
    finalBid: 37800,
    odometerKm: 22100,
    vin: "KMHS381HENF123456",
    accidentCnt: 1,
  },
  {
    id: "fb-car-5",
    lotNumber: "FB005",
    title: "2023 Kia EV6 GT-Line",
    manufacturerId: 86,
    modelId: 8601,
    generationId: 860101,
    year: 2023,
    grade: "GT-Line AWD",
    engine: "77.4 kWh GT-Line",
    powerKw: 239,
    powerHp: 320,
    fuel: "Electric",
    transmission: "Automatic",
    bodyType: "Crossover",
    color: "Snow White Pearl",
    seats: 5,
    buyNow: 48800,
    finalBid: 47200,
    odometerKm: 12500,
    vin: "KNDC4DLC6P5123456",
  },
  {
    id: "fb-car-6",
    lotNumber: "FB006",
    title: "2022 BMW i4 eDrive40",
    manufacturerId: 9,
    modelId: 9001,
    generationId: 900101,
    year: 2022,
    grade: "eDrive40",
    engine: "83.9 kWh eDrive40",
    powerKw: 250,
    powerHp: 335,
    fuel: "Electric",
    transmission: "Automatic",
    bodyType: "Coupe",
    color: "Portimao Blue",
    seats: 5,
    buyNow: 52900,
    finalBid: 51700,
    odometerKm: 14500,
    vin: "WBY33AW08NFM12345",
  },
  {
    id: "fb-car-7",
    lotNumber: "FB007",
    title: "2022 Mercedes-Benz GLC 300e",
    manufacturerId: 16,
    modelId: 1601,
    generationId: 160101,
    year: 2022,
    grade: "300e 4MATIC",
    engine: "2.0L PHEV 4MATIC",
    powerKw: 235,
    powerHp: 315,
    fuel: "Plug-in Hybrid",
    transmission: "Automatic",
    bodyType: "SUV",
    color: "Selenite Grey",
    seats: 5,
    buyNow: 57800,
    finalBid: 56200,
    odometerKm: 19800,
    vin: "W1N0G6DB2NV123456",
  },
  {
    id: "fb-car-8",
    lotNumber: "FB008",
    title: "2021 Audi Q5 45 TFSI e",
    manufacturerId: 1,
    modelId: 1001,
    generationId: 100101,
    year: 2021,
    grade: "45 TFSI e quattro",
    engine: "2.0L Plug-in Hybrid",
    powerKw: 220,
    powerHp: 295,
    fuel: "Plug-in Hybrid",
    transmission: "Automatic",
    bodyType: "SUV",
    color: "Daytona Gray",
    seats: 5,
    buyNow: 42800,
    finalBid: 41700,
    odometerKm: 26800,
    vin: "WA1F2AFY0M2123456",
  },
  {
    id: "fb-car-9",
    lotNumber: "FB009",
    title: "2023 Tesla Model 3 Long Range",
    manufacturerId: 161,
    modelId: 16101,
    generationId: 1610101,
    year: 2023,
    grade: "Long Range AWD",
    engine: "Dual Motor AWD",
    powerKw: 258,
    powerHp: 346,
    fuel: "Electric",
    transmission: "Automatic",
    bodyType: "Sedan",
    color: "Deep Blue Metallic",
    seats: 5,
    buyNow: 49900,
    finalBid: 48800,
    odometerKm: 8700,
    vin: "5YJ3E1EB8PF123456",
  },
  {
    id: "fb-car-10",
    lotNumber: "FB010",
    title: "2022 Genesis GV70 Luxury",
    manufacturerId: 92,
    modelId: 9201,
    generationId: 920101,
    year: 2022,
    grade: "2.5T Luxury",
    engine: "2.5T AWD",
    powerKw: 224,
    powerHp: 300,
    fuel: "Gasoline",
    transmission: "Automatic",
    bodyType: "SUV",
    color: "Adriatic Blue",
    seats: 5,
    buyNow: 61200,
    finalBid: 59800,
    odometerKm: 15800,
    vin: "KMUHCESC0NU123456",
  },
  {
    id: "fb-car-11",
    lotNumber: "FB011",
    title: "2021 Ford Explorer Limited Hybrid",
    manufacturerId: 48,
    modelId: 4801,
    generationId: 480101,
    year: 2021,
    grade: "Limited Hybrid",
    engine: "3.3L V6 Hybrid",
    powerKw: 235,
    powerHp: 318,
    fuel: "Hybrid",
    transmission: "Automatic",
    bodyType: "SUV",
    color: "Star White",
    seats: 7,
    buyNow: 36500,
    finalBid: 35400,
    odometerKm: 31200,
    vin: "1FM5K8FW5MGA12345",
    accidentCnt: 1,
  },
  {
    id: "fb-car-12",
    lotNumber: "FB012",
    title: "2022 Honda CR-V Hybrid Sport Touring",
    manufacturerId: 64,
    modelId: 6401,
    generationId: 640101,
    year: 2022,
    grade: "Sport Touring",
    engine: "2.0L e:HEV",
    powerKw: 152,
    powerHp: 204,
    fuel: "Hybrid",
    transmission: "Automatic",
    bodyType: "SUV",
    color: "Radiant Red",
    seats: 5,
    buyNow: 32900,
    finalBid: 31800,
    odometerKm: 21000,
    vin: "2HKRS6H95NH123456",
  },
];

interface FallbackLot {
  id: string;
  lot: string;
  buy_now: number;
  final_bid: number;
  currency: string;
  grade_iaai: string;
  odometer: { km: number };
  images: { normal: string[]; big: string[] };
  details: { badge: string; color: string; seats_count: number };
  damage: { main: string; second: string };
  keys_available: boolean;
  status: string;
  sale_status: string;
  domain: { name: string };
  source: string;
}

export interface FallbackCar {
  id: string;
  lot_number: string;
  title: string;
  manufacturer: { id: number; name: string };
  model: { id: number; name: string };
  generation: GenerationDefinition;
  year: number;
  fuel_type: string;
  fuel: string;
  transmission: { name: string };
  engine: { name: string; power_kw: number; power_hp: number };
  color: { name: string };
  body_type: { name: string };
  details: { seats_count: number; badge: string };
  lots: FallbackLot[];
  lot: FallbackLot;
  buy_now: number;
  final_bid: number;
  price: number;
  odometer: { km: number };
  images: { normal: string[]; big: string[] };
  insurance_v2: { accidentCnt: number; year?: number };
  source: string;
  domain: { name: string };
  status: string;
  sale_status: string;
  created_at: string;
  updated_at: string;
  popularity_score: number;
  vin: string;
}

const VARIANTS_PER_SEED = 5;

const manufacturerLookup = new Map(MANUFACTURERS.map((entry) => [entry.id, entry]));
const modelLookup = new Map(MODELS.map((entry) => [entry.id, entry]));
const generationLookup = new Map(GENERATIONS.map((entry) => [entry.id, entry]));

const ensureImages = () => ({
  normal: [PLACEHOLDER_IMAGE],
  big: [PLACEHOLDER_IMAGE],
});

const clampYear = (year: number, generation: GenerationDefinition) => {
  if (year < generation.from_year) {
    return generation.from_year;
  }
  if (year > generation.to_year) {
    return generation.to_year;
  }
  return year;
};

const buildVin = (base: string, variantIndex: number) => {
  if (variantIndex === 0) {
    return base;
  }
  const prefix = base.slice(0, Math.max(base.length - 2, 10));
  const suffix = (variantIndex + 10).toString(36).toUpperCase().padStart(2, "0");
  return `${prefix.slice(0, 15)}${suffix}`.slice(0, 17);
};

const buildCarFromSeed = (seed: FallbackCarSeed, variantIndex: number): FallbackCar => {
  const manufacturer = manufacturerLookup.get(seed.manufacturerId)!;
  const model = modelLookup.get(seed.modelId)!;
  const generation = generationLookup.get(seed.generationId)!;

  const suffix = variantIndex === 0 ? "" : `-${variantIndex.toString().padStart(2, "0")}`;
  const lotNumber = variantIndex === 0 ? seed.lotNumber : `${seed.lotNumber}${suffix}`;
  const id = variantIndex === 0 ? seed.id : `${seed.id}${suffix}`;

  const yearAdjustment = seed.year - variantIndex;
  const year = clampYear(yearAdjustment, generation);
  const priceDelta = variantIndex === 0 ? 0 : (variantIndex % 2 === 0 ? variantIndex * 750 : -variantIndex * 650);
  const buyNow = Math.max(seed.buyNow + priceDelta, 12000);
  const finalBid = Math.max(seed.finalBid + priceDelta - 200, Math.floor(buyNow * 0.92));
  const odometerKm = Math.max(seed.odometerKm + variantIndex * 3200, 4500);
  const accidentCnt =
    seed.accidentCnt !== undefined
      ? Math.max(seed.accidentCnt - (variantIndex % 2 === 1 ? 1 : 0), 0)
      : 0;
  const gradeSuffix =
    variantIndex === 0 ? "" : variantIndex % 2 === 0 ? " Plus" : " Edition";
  const badge = `${seed.grade}${gradeSuffix}`.trim();
  const powerKw = seed.powerKw + variantIndex * 2;
  const powerHp = seed.powerHp + variantIndex * 3;
  const source = seed.source || "encar";
  const createdAt = new Date(2024, Math.min(variantIndex, 10), 10 + variantIndex).toISOString();
  const updatedAt = new Date(2024, Math.min(variantIndex, 10), 20 + variantIndex).toISOString();

  const lot: FallbackLot = {
    id: `${lotNumber}-lot`,
    lot: lotNumber,
    buy_now: buyNow,
    final_bid: finalBid,
    currency: "USD",
    grade_iaai: badge,
    odometer: { km: odometerKm },
    images: ensureImages(),
    details: {
      badge,
      color: seed.color,
      seats_count: seed.seats,
    },
    damage: { main: accidentCnt > 0 ? "Minor" : "None", second: "None" },
    keys_available: true,
    status: "live",
    sale_status: "live",
    domain: { name: source },
    source,
  };

  return {
    id,
    lot_number: lotNumber,
    title: variantIndex === 0 ? seed.title : `${seed.title} ${year}`,
    manufacturer: { ...manufacturer },
    model: { ...model },
    generation: { ...generation },
    year,
    fuel_type: seed.fuel,
    fuel: seed.fuel,
    transmission: { name: seed.transmission },
    engine: {
      name: seed.engine,
      power_kw: powerKw,
      power_hp: powerHp,
    },
    color: { name: seed.color },
    body_type: { name: seed.bodyType },
    details: { seats_count: seed.seats, badge },
    lots: [lot],
    lot,
    buy_now: buyNow,
    final_bid: finalBid,
    price: buyNow,
    odometer: { km: odometerKm },
    images: ensureImages(),
    insurance_v2: { accidentCnt, year },
    source,
    domain: { name: source },
    status: "live",
    sale_status: "live",
    created_at: createdAt,
    updated_at: updatedAt,
    popularity_score: 90 - variantIndex * 2,
    vin: buildVin(seed.vin, variantIndex),
  };
};

export const fallbackCars: FallbackCar[] = FALLBACK_CAR_SEEDS.flatMap((seed) =>
  Array.from({ length: VARIANTS_PER_SEED }, (_, variantIndex) => buildCarFromSeed(seed, variantIndex)),
);

type ManufacturerStat = {
  id: number;
  name: string;
  cars_qty: number;
  car_count: number;
  image?: string;
};

type ModelStat = ModelDefinition & {
  cars_qty: number;
  car_count: number;
};

type GenerationStat = GenerationDefinition & {
  cars_qty: number;
};

const manufacturerCounts = new Map<number, number>();
const modelCounts = new Map<number, number>();
const generationCounts = new Map<number, number>();

fallbackCars.forEach((car) => {
  const manufacturerId = car.manufacturer?.id;
  const modelId = car.model?.id;
  const generationId = car.generation?.id;

  if (manufacturerId) {
    manufacturerCounts.set(manufacturerId, (manufacturerCounts.get(manufacturerId) || 0) + 1);
  }
  if (modelId) {
    modelCounts.set(modelId, (modelCounts.get(modelId) || 0) + 1);
  }
  if (generationId) {
    generationCounts.set(generationId, (generationCounts.get(generationId) || 0) + 1);
  }
});

export const fallbackManufacturers: ManufacturerStat[] = MANUFACTURERS.map((manufacturer) => {
  const count = manufacturerCounts.get(manufacturer.id) || 0;
  return {
    ...manufacturer,
    cars_qty: count,
    car_count: count,
    image: getBrandLogo(manufacturer.name),
  };
})
  .filter((manufacturer) => manufacturer.cars_qty > 0)
  .sort((a, b) => a.name.localeCompare(b.name));

export const fallbackModels: ModelStat[] = MODELS.map((model) => {
  const count = modelCounts.get(model.id) || 0;
  return {
    ...model,
    cars_qty: count,
    car_count: count,
  };
})
  .filter((model) => model.cars_qty > 0)
  .sort((a, b) => a.name.localeCompare(b.name));

export const fallbackGenerations: GenerationStat[] = GENERATIONS.map((generation) => ({
  ...generation,
  cars_qty: generationCounts.get(generation.id) || 0,
}))
  .filter((generation) => generation.cars_qty > 0)
  .sort((a, b) => a.name.localeCompare(b.name));