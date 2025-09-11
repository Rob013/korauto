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
        normal: [
          "/images/placeholder-car.jpg",
          "https://picsum.photos/800/600?random=1",
          "https://picsum.photos/800/600?random=2",
          "https://picsum.photos/800/600?random=3",
          "https://picsum.photos/800/600?random=4",
          "https://picsum.photos/800/600?random=5"
        ],
        big: [
          "/images/placeholder-car.jpg",
          "https://picsum.photos/1200/900?random=1",
          "https://picsum.photos/1200/900?random=2",
          "https://picsum.photos/1200/900?random=3",
          "https://picsum.photos/1200/900?random=4",
          "https://picsum.photos/1200/900?random=5"
        ]
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
        normal: ["/images/placeholder-car.jpg"],
        big: ["/images/placeholder-car.jpg"]
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
        normal: ["/images/placeholder-car.jpg"],
        big: ["/images/placeholder-car.jpg"]
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
  },
  // Test cars for status badge verification
  {
    id: "test-sold-car",
    title: "2023 Tesla Model 3 - SOLD",
    manufacturer: { name: "Tesla" },
    model: { name: "Model 3" },
    year: 2023,
    price: 45000,
    currency: "USD",
    odometer: 15000,
    fuel: { name: "Electric" },
    transmission: { name: "Automatic" },
    color: { name: "Red" },
    grade: "5.0",
    vin: "5YJ3E1EA7JF123456",
    lot_number: "SOLD001",
    lots: [{
      buy_now: 45000,
      odometer: { km: 15000 },
      images: {
        normal: ["/images/placeholder-car.jpg"],
        big: ["/images/placeholder-car.jpg"]
      },
      lot: "SOLD001",
      status: 3
    }],
    location: "Prishtinë, Kosovo",
    features: ["Electric", "Autopilot", "Premium Interior"],
    is_premium: true,
    seats_count: 5,
    accidents_count: 0,
    inspection_available: false,
    status: "3",
    sale_status: "sold"
  },
  {
    id: "test-reserved-car",
    title: "2022 BMW X5 - RESERVED",
    manufacturer: { name: "BMW" },
    model: { name: "X5" },
    year: 2022,
    price: 55000,
    currency: "USD", 
    odometer: 20000,
    fuel: { name: "Gasoline" },
    transmission: { name: "Automatic" },
    color: { name: "Blue" },
    grade: "4.8",
    vin: "5UXCR6C0XN9123456",
    lot_number: "RSV001",
    lots: [{
      buy_now: 55000,
      odometer: { km: 20000 },
      images: {
        normal: ["/images/placeholder-car.jpg"],
        big: ["/images/placeholder-car.jpg"]
      },
      lot: "RSV001",
      status: 1
    }],
    location: "Prishtinë, Kosovo",
    features: ["All-Wheel Drive", "Premium Package", "Navigation"],
    is_premium: true,
    seats_count: 7,
    accidents_count: 0,
    inspection_available: true,
    status: "1",
    sale_status: "reserved"
  },
  {
    id: "test-pending-car",
    title: "2021 Mercedes C-Class - PENDING",
    manufacturer: { name: "Mercedes-Benz" },
    model: { name: "C-Class" },
    year: 2021,
    price: 42000,
    currency: "USD",
    odometer: 30000,
    fuel: { name: "Gasoline" },
    transmission: { name: "Automatic" },
    color: { name: "Silver" },
    grade: "4.6",
    vin: "55SWF8DB9JU123456",
    lot_number: "PND001",
    lots: [{
      buy_now: 42000,
      odometer: { km: 30000 },
      images: {
        normal: ["/images/placeholder-car.jpg"],
        big: ["/images/placeholder-car.jpg"]
      },
      lot: "PND001",
      status: 2
    }],
    location: "Prishtinë, Kosovo",
    features: ["Luxury Interior", "Sport Package", "Premium Sound"],
    is_premium: true,
    seats_count: 5,
    accidents_count: 0,
    inspection_available: true,
    status: "2",
    sale_status: "pending"
  }
];

export const fallbackManufacturers = [
  { id: "1", name: "Toyota", cars_count: 45 },
  { id: "2", name: "Honda", cars_count: 32 },
  { id: "3", name: "Hyundai", cars_count: 28 },
  { id: "4", name: "Kia", cars_count: 25 },
  { id: "5", name: "Nissan", cars_count: 20 }
];