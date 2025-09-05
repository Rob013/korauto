/**
 * Mock cars data with different status types for testing the status system
 */

export interface MockCar {
  id: string;
  make: string;
  model: string;
  year: number;
  price: number;
  image?: string;
  images?: string[];
  mileage?: string;
  transmission?: string;
  fuel?: string;
  color?: string;
  lot?: string;
  title?: string;
  status?: number;
  sale_status?: string;
  is_archived?: boolean;
  archived_at?: string;
  archive_reason?: string;
}

export const mockCarsWithStatus: MockCar[] = [
  // Available cars (normal state)
  {
    id: "1",
    make: "Toyota",
    model: "Corolla",
    year: 2022,
    price: 18500,
    mileage: "25000",
    transmission: "Automatic",
    fuel: "Hybrid",
    color: "White",
    lot: "TOY001",
    status: 1,
    sale_status: "active",
    image: "https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=400"
  },
  {
    id: "2", 
    make: "Honda",
    model: "Civic",
    year: 2021,
    price: 16900,
    mileage: "32000",
    transmission: "Manual",
    fuel: "Gasoline",
    color: "Blue",
    lot: "HON002",
    status: 1,
    sale_status: "active",
    image: "https://images.unsplash.com/photo-1606220588913-b3aacb4d2f46?w=400"
  },

  // Sold cars (status 3 or sale_status 'sold')
  {
    id: "3",
    make: "BMW",
    model: "X3",
    year: 2020,
    price: 35000,
    mileage: "45000",
    transmission: "Automatic",
    fuel: "Gasoline",
    color: "Black",
    lot: "BMW003",
    status: 3, // SOLD
    sale_status: "sold",
    image: "https://images.unsplash.com/photo-1555215695-3004980ad54e?w=400"
  },
  {
    id: "4",
    make: "Mercedes-Benz",
    model: "C-Class",
    year: 2021,
    price: 42000,
    mileage: "28000",
    transmission: "Automatic", 
    fuel: "Gasoline",
    color: "Silver",
    lot: "MER004",
    sale_status: "sold", // SOLD by sale_status
    image: "https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=400"
  },

  // Pending cars (status 2 or sale_status 'pending')
  {
    id: "5",
    make: "Audi",
    model: "A4",
    year: 2022,
    price: 38000,
    mileage: "15000",
    transmission: "Automatic",
    fuel: "Gasoline",
    color: "Gray",
    lot: "AUD005",
    status: 2, // PENDING
    sale_status: "pending",
    image: "https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=400"
  },
  {
    id: "6",
    make: "Volkswagen",
    model: "Golf",
    year: 2021,
    price: 22000,
    mileage: "38000",
    transmission: "Manual",
    fuel: "Gasoline",
    color: "Red",
    lot: "VW006",
    sale_status: "pending", // PENDING by sale_status
    image: "https://images.unsplash.com/photo-1606220588913-b3aacb4d2f46?w=400"
  },

  // Reserved cars (sale_status 'reserved')
  {
    id: "7",
    make: "Hyundai",
    model: "Elantra",
    year: 2022,
    price: 19500,
    mileage: "12000",
    transmission: "Automatic",
    fuel: "Gasoline",
    color: "White",
    lot: "HYU007",
    sale_status: "reserved", // RESERVED
    image: "https://images.unsplash.com/photo-1562911791-c7a97b729ec5?w=400"
  },
  {
    id: "8",
    make: "Kia",
    model: "Optima", 
    year: 2021,
    price: 21000,
    mileage: "22000",
    transmission: "Automatic",
    fuel: "Hybrid",
    color: "Black",
    lot: "KIA008",
    sale_status: "reserved", // RESERVED
    image: "https://images.unsplash.com/photo-1617814076367-b759c7d7e738?w=400"
  },

  // More available cars
  {
    id: "9",
    make: "Nissan",
    model: "Altima",
    year: 2022,
    price: 24000,
    mileage: "18000",
    transmission: "Automatic",
    fuel: "Gasoline",
    color: "Blue",
    lot: "NIS009",
    status: 1,
    sale_status: "active",
    image: "https://images.unsplash.com/photo-1609521263047-f8f205293f24?w=400"
  },
  {
    id: "10",
    make: "Mazda",
    model: "CX-5",
    year: 2021,
    price: 28000,
    mileage: "35000",
    transmission: "Automatic",
    fuel: "Gasoline",
    color: "Red",
    lot: "MAZ010",
    status: 1,
    sale_status: "active",
    image: "https://images.unsplash.com/photo-1609521263047-f8f205293f24?w=400"
  },

  // Car that should be hidden (sold more than 24 hours ago)
  {
    id: "11",
    make: "Ford",
    model: "Focus",
    year: 2020,
    price: 17000,
    mileage: "55000",
    transmission: "Manual",
    fuel: "Gasoline",
    color: "Gray",
    lot: "FOR011",
    status: 3,
    sale_status: "sold",
    is_archived: true,
    archived_at: new Date(Date.now() - 26 * 60 * 60 * 1000).toISOString(), // 26 hours ago
    archive_reason: "sold",
    image: "https://images.unsplash.com/photo-1590362891991-f776e747a588?w=400"
  }
];