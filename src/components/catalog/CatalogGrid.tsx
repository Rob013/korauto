import { memo } from 'react';
import CarCard from '@/components/CarCard';
import { useCurrencyAPI } from '@/hooks/useCurrencyAPI';

interface Car {
  id: string;
  year: number;
  title?: string;
  vin?: string;
  manufacturer?: { name: string };
  model?: { name: string };
  generation?: { name: string };
  body_type?: { name: string };
  color?: { name: string };
  engine?: { name: string };
  transmission?: { name: string };
  drive_wheel?: string;
  vehicle_type?: { name: string };
  fuel?: { name: string };
  cylinders?: number;
  condition?: string;
  lot_number?: string;
  status?: string | number;
  sale_status?: string;
  final_price?: number;
  lots?: any[];
}

interface CatalogGridProps {
  cars: Car[];
  viewMode: 'grid' | 'list';
  highlightCarId?: string | null;
}

const CatalogGrid = memo(({ cars, viewMode, highlightCarId }: CatalogGridProps) => {
  const { convertUSDtoEUR } = useCurrencyAPI();

  return (
    <div className={viewMode === 'grid' 
      ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
      : "space-y-4"
    }>
      {cars.map((car) => {
        const lot = car.lots?.[0];
        const usdPrice = lot?.buy_now || 25000;
        const price = convertUSDtoEUR(Math.round(usdPrice + 2200));
        const lotNumber = car.lot_number || lot?.lot || '';
        
        return (
          <div key={car.id} id={`car-${car.id}`} data-lot-id={`car-lot-${lotNumber}`}>
            <div id={`car-lot-${lotNumber}`}></div>
            <CarCard
              id={car.id}
              make={car.manufacturer?.name || 'Unknown'}
              model={car.model?.name || 'Unknown'}
              year={car.year}
              price={price}
              image={lot?.images?.normal?.[0] || lot?.images?.big?.[0]}
              vin={car.vin}
              mileage={lot?.odometer?.km ? `${lot.odometer.km.toLocaleString()} km` : undefined}
              transmission={car.transmission?.name}
              fuel={car.fuel?.name}
              color={car.color?.name}
              condition={car.condition?.replace('run_and_drives', 'Good')}
              lot={car.lot_number || lot?.lot || ''}
              title={car.title || ''}
              status={Number(car.status || lot?.status || 1)}
              sale_status={car.sale_status || lot?.sale_status}
              final_price={car.final_price || lot?.final_price}
              generation={car.generation?.name}
              body_type={car.body_type?.name}
              engine={car.engine?.name}
              drive_wheel={car.drive_wheel}
              vehicle_type={car.vehicle_type?.name}
              cylinders={car.cylinders}
              bid={lot?.bid}
              estimate_repair_price={lot?.estimate_repair_price}
              pre_accident_price={lot?.pre_accident_price}
              clean_wholesale_price={lot?.clean_wholesale_price}
              actual_cash_value={lot?.actual_cash_value}
              sale_date={lot?.sale_date}
              seller={lot?.seller}
              seller_type={lot?.seller_type}
              detailed_title={lot?.detailed_title}
              damage_main={lot?.damage?.main}
              damage_second={lot?.damage?.second}
              keys_available={lot?.keys_available}
              airbags={lot?.airbags}
              grade_iaai={lot?.grade_iaai}
              domain={lot?.domain?.name}
              external_id={lot?.external_id}
              insurance={(lot as any)?.insurance}
              insurance_v2={(lot as any)?.insurance_v2}
              location={(lot as any)?.location}
              inspect={(lot as any)?.inspect}
              details={(lot as any)?.details}
            />
          </div>
        );
      })}
    </div>
  );
});

CatalogGrid.displayName = 'CatalogGrid';

export default CatalogGrid;