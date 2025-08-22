// Fallback car data for when API is unavailable
export const fallbackCars = [
  {
    id: "fb-car-1",
    title: "2022 Toyota Camry Hybrid",
    manufacturer: { name: "Toyota" },
    model: { name: "Camry" },
    year: 2022,
    price: 32000,
    currency: "USD",
    odometer: 25000,
    fuel: { name: "Hybrid" },
    transmission: { name: "Automatic" },
    color: { name: "Silver" },
    grade: "4.5",
    vin: "1HGBH41JXMN109188",
    lot_number: "FB001",
    lots: [{
      buy_now: 32000,
      odometer: { km: 25000 },
      images: {
        normal: ["/lovable-uploads/7a3e2aa4-2a3b-4320-b33c-72d3d7721cfd.png"],
        big: ["/lovable-uploads/7a3e2aa4-2a3b-4320-b33c-72d3d7721cfd.png"]
      },
      lot: "FB001",
      status: 1
    }],
    location: "Prishtinë, Kosovo",
    features: ["Hybrid Engine", "Automatic Transmission", "Low Mileage"],
    is_premium: false,
    seats_count: 5,
    accidents_count: 0,
    inspection_available: true,
    status: "1"
  },
  {
    id: "fb-car-2", 
    title: "2021 Honda CR-V AWD",
    manufacturer: { name: "Honda" },
    model: { name: "CR-V" },
    year: 2021,
    price: 28000,
    currency: "USD",
    odometer: 35000,
    fuel: { name: "Gasoline" },
    transmission: { name: "CVT" },
    color: { name: "Black" },
    grade: "4.0",
    vin: "2HKRM4H75CH100234",
    lot_number: "FB002",
    lots: [{
      buy_now: 28000,
      odometer: { km: 35000 },
      images: {
        normal: ["/lovable-uploads/7a3e2aa4-2a3b-4320-b33c-72d3d7721cfd.png"],
        big: ["/lovable-uploads/7a3e2aa4-2a3b-4320-b33c-72d3d7721cfd.png"]
      },
      lot: "FB002",
      status: 1
    }],
    location: "Prishtinë, Kosovo",
    features: ["All-Wheel Drive", "CVT Transmission", "Excellent Condition"],
    is_premium: true,
    seats_count: 5,
    accidents_count: 0,
    inspection_available: true,
    status: "1"
  },
  {
    id: "fb-car-3",
    title: "2020 Hyundai Tucson Limited",
    manufacturer: { name: "Hyundai" }, 
    model: { name: "Tucson" },
    year: 2020,
    price: 24000,
    currency: "USD",
    odometer: 45000,
    fuel: { name: "Gasoline" },
    transmission: { name: "Automatic" },
    color: { name: "White" },
    grade: "4.2",
    vin: "KM8J33A26LU123456",
    lot_number: "FB003",
    lots: [{
      buy_now: 24000,
      odometer: { km: 45000 },
      images: {
        normal: ["/lovable-uploads/7a3e2aa4-2a3b-4320-b33c-72d3d7721cfd.png"],
        big: ["/lovable-uploads/7a3e2aa4-2a3b-4320-b33c-72d3d7721cfd.png"]
      },
      lot: "FB003",
      status: 1
    }],
    location: "Prishtinë, Kosovo",
    features: ["Limited Edition", "Leather Seats", "Panoramic Sunroof"],
    is_premium: false,
    seats_count: 5,
    accidents_count: 1,
    inspection_available: true,
    status: "1"
  }
];

export const fallbackManufacturers = [
  { id: "1", name: "Toyota", cars_count: 45 },
  { id: "2", name: "Honda", cars_count: 32 },
  { id: "3", name: "Hyundai", cars_count: 28 },
  { id: "4", name: "Kia", cars_count: 25 },
  { id: "5", name: "Nissan", cars_count: 20 }
];