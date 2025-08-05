import React from 'react';
import CarCard from './CarCard';

// Mock data for demonstration
const mockCars = [
  {
    id: '1',
    make: 'BMW',
    model: 'X5',
    year: 2022,
    price: 45000,
    image: 'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=400&h=300&fit=crop',
    mileage: '45,000 km',
    transmission: 'automatic',
    fuel: 'gasoline',
    color: 'black',
    lot: '12345',
    title: 'BMW X5 xDrive40i M Sport',
  },
  {
    id: '2',
    make: 'Mercedes-Benz',
    model: 'C-Class',
    year: 2021,
    price: 38000,
    image: 'https://images.unsplash.com/photo-1563720223185-11003d516935?w=400&h=300&fit=crop',
    mileage: '32,000 km',
    transmission: 'automatic',
    fuel: 'gasoline',
    color: 'white',
    lot: '12346',
    title: 'Mercedes-Benz C300 AMG Line',
  },
  {
    id: '3',
    make: 'Audi',
    model: 'A4',
    year: 2023,
    price: 42000,
    image: 'https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=400&h=300&fit=crop',
    mileage: '15,000 km',
    transmission: 'automatic',
    fuel: 'hybrid',
    color: 'silver',
    lot: '12347',
    title: 'Audi A4 Quattro S-Line',
  },
  {
    id: '4',
    make: 'Tesla',
    model: 'Model 3',
    year: 2023,
    price: 48000,
    image: 'https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=400&h=300&fit=crop',
    mileage: '8,000 km',
    transmission: 'automatic',
    fuel: 'electric',
    color: 'blue',
    lot: '12348',
    title: 'Tesla Model 3 Performance',
  },
];

export const MockCarCards: React.FC = () => {
  return (
    <div className="container mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6 text-center">Improved Car Card Layout Demo</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {mockCars.map((car) => (
          <CarCard
            key={car.id}
            {...car}
          />
        ))}
      </div>
    </div>
  );
};

export default MockCarCards;