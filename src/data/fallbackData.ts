export interface FallbackManufacturer {
  id: number;
  name: string;
  cars_qty: number;
  image?: string;
}

export interface FallbackModel {
  id: number;
  manufacturer_id: number;
  name: string;
  cars_qty: number;
}

export interface FallbackGeneration {
  id: number;
  manufacturer_id: number;
  model_id: number;
  name: string;
  from_year?: number;
  to_year?: number;
  cars_qty: number;
}

export interface FallbackLot {
  lot: string;
  buy_now: number;
  odometer: { km: number };
  grade_iaai?: string;
  status?: string;
  sale_status?: string;
  images: { normal: string[]; big?: string[] };
  details?: {
    seats_count?: number;
  };
}

export interface FallbackCar {
  id: number;
  lot_number: string;
  title: string;
  manufacturer: { id: number; name: string };
  model: { id: number; name: string };
  generation?: { id: number; name: string };
  year: number;
  color?: { name: string };
  transmission?: { name: string };
  engine?: { name: string };
  vin: string;
  fuel_type?: string;
  lots: FallbackLot[];
  images: { normal: string[]; big?: string[] };
  status?: number;
  sale_status?: string;
}

const placeholderImage = "/images/car-placeholder.jpg";

export const fallbackManufacturers: FallbackManufacturer[] = [
  { id: 1, name: "Hyundai", cars_qty: 42 },
  { id: 2, name: "Kia", cars_qty: 38 },
  { id: 3, name: "Genesis", cars_qty: 24 },
  { id: 4, name: "BMW", cars_qty: 56 },
  { id: 5, name: "Mercedes-Benz", cars_qty: 64 },
  { id: 6, name: "Audi", cars_qty: 31 },
  { id: 7, name: "Toyota", cars_qty: 73 },
  { id: 8, name: "Lexus", cars_qty: 29 },
  { id: 9, name: "Honda", cars_qty: 47 },
  { id: 10, name: "Volkswagen", cars_qty: 52 },
  { id: 11, name: "Volvo", cars_qty: 21 },
  { id: 12, name: "Porsche", cars_qty: 18 }
];

export const fallbackModels: FallbackModel[] = [
  { id: 101, manufacturer_id: 1, name: "Ioniq 5", cars_qty: 12 },
  { id: 102, manufacturer_id: 1, name: "Santa Fe", cars_qty: 8 },
  { id: 201, manufacturer_id: 2, name: "EV6", cars_qty: 11 },
  { id: 202, manufacturer_id: 2, name: "Sorento", cars_qty: 9 },
  { id: 301, manufacturer_id: 3, name: "GV70", cars_qty: 7 },
  { id: 302, manufacturer_id: 3, name: "G80", cars_qty: 6 },
  { id: 401, manufacturer_id: 4, name: "i4", cars_qty: 10 },
  { id: 402, manufacturer_id: 4, name: "X5", cars_qty: 14 },
  { id: 501, manufacturer_id: 5, name: "C-Class", cars_qty: 18 },
  { id: 502, manufacturer_id: 5, name: "GLC", cars_qty: 16 },
  { id: 601, manufacturer_id: 6, name: "Q5", cars_qty: 13 },
  { id: 602, manufacturer_id: 6, name: "A6", cars_qty: 11 },
  { id: 701, manufacturer_id: 7, name: "RAV4", cars_qty: 15 },
  { id: 702, manufacturer_id: 7, name: "Camry", cars_qty: 20 },
  { id: 801, manufacturer_id: 8, name: "RX 350", cars_qty: 9 },
  { id: 802, manufacturer_id: 8, name: "ES 300h", cars_qty: 7 },
  { id: 901, manufacturer_id: 9, name: "Accord", cars_qty: 14 },
  { id: 902, manufacturer_id: 9, name: "CR-V", cars_qty: 13 },
  { id: 1001, manufacturer_id: 10, name: "Golf", cars_qty: 12 },
  { id: 1002, manufacturer_id: 10, name: "Tiguan", cars_qty: 9 },
  { id: 1101, manufacturer_id: 11, name: "XC60", cars_qty: 8 },
  { id: 1102, manufacturer_id: 11, name: "XC90", cars_qty: 6 },
  { id: 1201, manufacturer_id: 12, name: "Macan", cars_qty: 5 },
  { id: 1202, manufacturer_id: 12, name: "Cayenne", cars_qty: 4 }
];

export const fallbackGenerations: FallbackGeneration[] = [
  { id: 1001, manufacturer_id: 1, model_id: 101, name: "NE (2021+)", from_year: 2021, cars_qty: 12 },
  { id: 1002, manufacturer_id: 1, model_id: 102, name: "TM (2019+)", from_year: 2019, cars_qty: 8 },
  { id: 2001, manufacturer_id: 2, model_id: 201, name: "CV (2022+)", from_year: 2022, cars_qty: 11 },
  { id: 2002, manufacturer_id: 2, model_id: 202, name: "UM (2021+)", from_year: 2021, cars_qty: 9 },
  { id: 3001, manufacturer_id: 3, model_id: 301, name: "First Gen", from_year: 2021, cars_qty: 7 },
  { id: 3002, manufacturer_id: 3, model_id: 302, name: "Second Gen", from_year: 2020, cars_qty: 6 },
  { id: 4001, manufacturer_id: 4, model_id: 401, name: "G26 (2021+)", from_year: 2021, cars_qty: 10 },
  { id: 4002, manufacturer_id: 4, model_id: 402, name: "G05 (2019+)", from_year: 2019, cars_qty: 14 },
  { id: 5001, manufacturer_id: 5, model_id: 501, name: "W206 (2022+)", from_year: 2022, cars_qty: 18 },
  { id: 5002, manufacturer_id: 5, model_id: 502, name: "X254 (2022+)", from_year: 2022, cars_qty: 16 },
  { id: 6001, manufacturer_id: 6, model_id: 601, name: "FY (2021+)", from_year: 2021, cars_qty: 13 },
  { id: 6002, manufacturer_id: 6, model_id: 602, name: "C8 (2019+)", from_year: 2019, cars_qty: 11 },
  { id: 7001, manufacturer_id: 7, model_id: 701, name: "XA50 (2019+)", from_year: 2019, cars_qty: 15 },
  { id: 7002, manufacturer_id: 7, model_id: 702, name: "XV70 (2018+)", from_year: 2018, cars_qty: 20 },
  { id: 8001, manufacturer_id: 8, model_id: 801, name: "AL20 (2020+)", from_year: 2020, cars_qty: 9 },
  { id: 8002, manufacturer_id: 8, model_id: 802, name: "X10 (2019+)", from_year: 2019, cars_qty: 7 },
  { id: 9001, manufacturer_id: 9, model_id: 901, name: "10th Gen", from_year: 2020, cars_qty: 14 },
  { id: 9002, manufacturer_id: 9, model_id: 902, name: "5th Gen", from_year: 2020, cars_qty: 13 },
  { id: 10001, manufacturer_id: 10, model_id: 1001, name: "Mk8", from_year: 2020, cars_qty: 12 },
  { id: 10002, manufacturer_id: 10, model_id: 1002, name: "Second Gen", from_year: 2018, cars_qty: 9 },
  { id: 11001, manufacturer_id: 11, model_id: 1101, name: "Second Gen", from_year: 2018, cars_qty: 8 },
  { id: 11002, manufacturer_id: 11, model_id: 1102, name: "Second Gen", from_year: 2016, cars_qty: 6 },
  { id: 12001, manufacturer_id: 12, model_id: 1201, name: "First Gen", from_year: 2019, cars_qty: 5 },
  { id: 12002, manufacturer_id: 12, model_id: 1202, name: "Second Gen", from_year: 2018, cars_qty: 4 }
];

export const fallbackCars: FallbackCar[] = [
  {
    id: 10001,
    lot_number: "FB-1001",
    title: "2022 Hyundai Ioniq 5 Limited AWD",
    manufacturer: { id: 1, name: "Hyundai" },
    model: { id: 101, name: "Ioniq 5" },
    generation: { id: 1001, name: "NE (2021+)" },
    year: 2022,
    color: { name: "Atlas White" },
    transmission: { name: "Automatic" },
    engine: { name: "Dual Motor" },
    vin: "KM8KNDAF0NU010001",
    fuel_type: "electric",
    lots: [
      {
        lot: "FB-1001",
        buy_now: 38500,
        odometer: { km: 18200 },
        grade_iaai: "4.5",
        status: "available",
        sale_status: "available",
        images: { normal: [placeholderImage] },
        details: { seats_count: 5 }
      }
    ],
    images: { normal: [placeholderImage] },
    status: 1,
    sale_status: "available"
  },
  {
    id: 10002,
    lot_number: "FB-1002",
    title: "2021 Hyundai Santa Fe Calligraphy",
    manufacturer: { id: 1, name: "Hyundai" },
    model: { id: 102, name: "Santa Fe" },
    generation: { id: 1002, name: "TM (2019+)" },
    year: 2021,
    color: { name: "Rainforest" },
    transmission: { name: "Automatic" },
    engine: { name: "2.5T" },
    vin: "5NMS5DAL0MH010002",
    fuel_type: "gasoline",
    lots: [
      {
        lot: "FB-1002",
        buy_now: 28950,
        odometer: { km: 32000 },
        grade_iaai: "4.0",
        status: "available",
        sale_status: "available",
        images: { normal: [placeholderImage] },
        details: { seats_count: 5 }
      }
    ],
    images: { normal: [placeholderImage] },
    status: 1,
    sale_status: "available"
  },
  {
    id: 20001,
    lot_number: "FB-2001",
    title: "2023 Kia EV6 GT-Line AWD",
    manufacturer: { id: 2, name: "Kia" },
    model: { id: 201, name: "EV6" },
    generation: { id: 2001, name: "CV (2022+)" },
    year: 2023,
    color: { name: "Runway Red" },
    transmission: { name: "Automatic" },
    engine: { name: "Dual Motor" },
    vin: "KNDC4DLCXP5090003",
    fuel_type: "electric",
    lots: [
      {
        lot: "FB-2001",
        buy_now: 42900,
        odometer: { km: 12400 },
        grade_iaai: "5.0",
        status: "available",
        sale_status: "available",
        images: { normal: [placeholderImage] },
        details: { seats_count: 5 }
      }
    ],
    images: { normal: [placeholderImage] },
    status: 1,
    sale_status: "available"
  },
  {
    id: 20002,
    lot_number: "FB-2002",
    title: "2022 Kia Sorento Hybrid EX",
    manufacturer: { id: 2, name: "Kia" },
    model: { id: 202, name: "Sorento" },
    generation: { id: 2002, name: "UM (2021+)" },
    year: 2022,
    color: { name: "Steel Gray" },
    transmission: { name: "Automatic" },
    engine: { name: "1.6T Hybrid" },
    vin: "5XYRKDAF2NG020004",
    fuel_type: "hybrid",
    lots: [
      {
        lot: "FB-2002",
        buy_now: 31200,
        odometer: { km: 27500 },
        grade_iaai: "4.5",
        status: "available",
        sale_status: "available",
        images: { normal: [placeholderImage] },
        details: { seats_count: 6 }
      }
    ],
    images: { normal: [placeholderImage] },
    status: 1,
    sale_status: "available"
  },
  {
    id: 30001,
    lot_number: "FB-3001",
    title: "2022 Genesis GV70 Advanced",
    manufacturer: { id: 3, name: "Genesis" },
    model: { id: 301, name: "GV70" },
    generation: { id: 3001, name: "First Gen" },
    year: 2022,
    color: { name: "Uyuni White" },
    transmission: { name: "Automatic" },
    engine: { name: "2.5T" },
    vin: "KMUMADTB8NU030005",
    fuel_type: "gasoline",
    lots: [
      {
        lot: "FB-3001",
        buy_now: 48900,
        odometer: { km: 16800 },
        grade_iaai: "4.5",
        status: "available",
        sale_status: "available",
        images: { normal: [placeholderImage] },
        details: { seats_count: 5 }
      }
    ],
    images: { normal: [placeholderImage] },
    status: 1,
    sale_status: "available"
  },
  {
    id: 40001,
    lot_number: "FB-4001",
    title: "2023 BMW i4 eDrive40 Gran Coupe",
    manufacturer: { id: 4, name: "BMW" },
    model: { id: 401, name: "i4" },
    generation: { id: 4001, name: "G26 (2021+)" },
    year: 2023,
    color: { name: "Brooklyn Grey" },
    transmission: { name: "Automatic" },
    engine: { name: "Electric" },
    vin: "WBY73AW09PFS40006",
    fuel_type: "electric",
    lots: [
      {
        lot: "FB-4001",
        buy_now: 55900,
        odometer: { km: 9200 },
        grade_iaai: "5.0",
        status: "available",
        sale_status: "available",
        images: { normal: [placeholderImage] },
        details: { seats_count: 5 }
      }
    ],
    images: { normal: [placeholderImage] },
    status: 1,
    sale_status: "available"
  },
  {
    id: 50001,
    lot_number: "FB-5001",
    title: "2022 Mercedes-Benz C300 4MATIC",
    manufacturer: { id: 5, name: "Mercedes-Benz" },
    model: { id: 501, name: "C-Class" },
    generation: { id: 5001, name: "W206 (2022+)" },
    year: 2022,
    color: { name: "Polar White" },
    transmission: { name: "Automatic" },
    engine: { name: "2.0T Mild Hybrid" },
    vin: "W1KAF4HB7NR050007",
    fuel_type: "mild hybrid",
    lots: [
      {
        lot: "FB-5001",
        buy_now: 47850,
        odometer: { km: 20500 },
        grade_iaai: "4.5",
        status: "available",
        sale_status: "available",
        images: { normal: [placeholderImage] },
        details: { seats_count: 5 }
      }
    ],
    images: { normal: [placeholderImage] },
    status: 1,
    sale_status: "available"
  },
  {
    id: 60001,
    lot_number: "FB-6001",
    title: "2021 Audi Q5 Premium Plus",
    manufacturer: { id: 6, name: "Audi" },
    model: { id: 601, name: "Q5" },
    generation: { id: 6001, name: "FY (2021+)" },
    year: 2021,
    color: { name: "Navarra Blue" },
    transmission: { name: "Automatic" },
    engine: { name: "2.0T Quattro" },
    vin: "WA1BAAFY1M2020008",
    fuel_type: "gasoline",
    lots: [
      {
        lot: "FB-6001",
        buy_now: 36900,
        odometer: { km: 41000 },
        grade_iaai: "4.0",
        status: "available",
        sale_status: "available",
        images: { normal: [placeholderImage] },
        details: { seats_count: 5 }
      }
    ],
    images: { normal: [placeholderImage] },
    status: 1,
    sale_status: "available"
  },
  {
    id: 70001,
    lot_number: "FB-7001",
    title: "2022 Toyota RAV4 Hybrid XSE",
    manufacturer: { id: 7, name: "Toyota" },
    model: { id: 701, name: "RAV4" },
    generation: { id: 7001, name: "XA50 (2019+)" },
    year: 2022,
    color: { name: "Blueprint" },
    transmission: { name: "Automatic" },
    engine: { name: "2.5 Hybrid" },
    vin: "4T3RWRFV3NU070009",
    fuel_type: "hybrid",
    lots: [
      {
        lot: "FB-7001",
        buy_now: 33950,
        odometer: { km: 23000 },
        grade_iaai: "4.5",
        status: "available",
        sale_status: "available",
        images: { normal: [placeholderImage] },
        details: { seats_count: 5 }
      }
    ],
    images: { normal: [placeholderImage] },
    status: 1,
    sale_status: "available"
  },
  {
    id: 80001,
    lot_number: "FB-8001",
    title: "2021 Lexus RX 350 Premium AWD",
    manufacturer: { id: 8, name: "Lexus" },
    model: { id: 801, name: "RX 350" },
    generation: { id: 8001, name: "AL20 (2020+)" },
    year: 2021,
    color: { name: "Caviar" },
    transmission: { name: "Automatic" },
    engine: { name: "3.5 V6" },
    vin: "2T2JZMDA2MC080010",
    fuel_type: "gasoline",
    lots: [
      {
        lot: "FB-8001",
        buy_now: 41200,
        odometer: { km: 36000 },
        grade_iaai: "4.5",
        status: "available",
        sale_status: "available",
        images: { normal: [placeholderImage] },
        details: { seats_count: 5 }
      }
    ],
    images: { normal: [placeholderImage] },
    status: 1,
    sale_status: "available"
  },
  {
    id: 90001,
    lot_number: "FB-9001",
    title: "2022 Honda Accord Touring",
    manufacturer: { id: 9, name: "Honda" },
    model: { id: 901, name: "Accord" },
    generation: { id: 9001, name: "10th Gen" },
    year: 2022,
    color: { name: "Radiant Red" },
    transmission: { name: "Automatic" },
    engine: { name: "2.0T" },
    vin: "1HGCV2F97NA090011",
    fuel_type: "gasoline",
    lots: [
      {
        lot: "FB-9001",
        buy_now: 29980,
        odometer: { km: 28500 },
        grade_iaai: "4.5",
        status: "available",
        sale_status: "available",
        images: { normal: [placeholderImage] },
        details: { seats_count: 5 }
      }
    ],
    images: { normal: [placeholderImage] },
    status: 1,
    sale_status: "available"
  },
  {
    id: 100001,
    lot_number: "FB-10001",
    title: "2021 Volkswagen Golf R Performance",
    manufacturer: { id: 10, name: "Volkswagen" },
    model: { id: 1001, name: "Golf" },
    generation: { id: 10001, name: "Mk8" },
    year: 2021,
    color: { name: "Lapiz Blue" },
    transmission: { name: "Automatic" },
    engine: { name: "2.0T 4Motion" },
    vin: "WVWAA7AU8MW100012",
    fuel_type: "gasoline",
    lots: [
      {
        lot: "FB-10001",
        buy_now: 35800,
        odometer: { km: 31000 },
        grade_iaai: "4.0",
        status: "available",
        sale_status: "available",
        images: { normal: [placeholderImage] },
        details: { seats_count: 5 }
      }
    ],
    images: { normal: [placeholderImage] },
    status: 1,
    sale_status: "available"
  },
  {
    id: 110001,
    lot_number: "FB-11001",
    title: "2022 Volvo XC60 Recharge Plus",
    manufacturer: { id: 11, name: "Volvo" },
    model: { id: 1101, name: "XC60" },
    generation: { id: 11001, name: "Second Gen" },
    year: 2022,
    color: { name: "Thunder Grey" },
    transmission: { name: "Automatic" },
    engine: { name: "T8 Recharge" },
    vin: "YV4H60DL3N1110013",
    fuel_type: "plug-in hybrid",
    lots: [
      {
        lot: "FB-11001",
        buy_now: 46900,
        odometer: { km: 19800 },
        grade_iaai: "4.5",
        status: "available",
        sale_status: "available",
        images: { normal: [placeholderImage] },
        details: { seats_count: 5 }
      }
    ],
    images: { normal: [placeholderImage] },
    status: 1,
    sale_status: "available"
  },
  {
    id: 120001,
    lot_number: "FB-12001",
    title: "2021 Porsche Macan S AWD",
    manufacturer: { id: 12, name: "Porsche" },
    model: { id: 1201, name: "Macan" },
    generation: { id: 12001, name: "First Gen" },
    year: 2021,
    color: { name: "Jet Black" },
    transmission: { name: "PDK" },
    engine: { name: "3.0T V6" },
    vin: "WP1AB2A57ML120014",
    fuel_type: "gasoline",
    lots: [
      {
        lot: "FB-12001",
        buy_now: 61900,
        odometer: { km: 24000 },
        grade_iaai: "4.5",
        status: "available",
        sale_status: "available",
        images: { normal: [placeholderImage] },
        details: { seats_count: 5 }
      }
    ],
    images: { normal: [placeholderImage] },
    status: 1,
    sale_status: "available"
  }
];
