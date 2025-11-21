import { supabase } from '@/integrations/supabase/client';

/**
 * Ensures complete car data is saved to cars_cache table
 * This significantly improves loading performance
 */
export const syncCarDataToCache = async (carData: any): Promise<boolean> => {
  if (!carData?.id) return false;

  try {
    const {
      id,
      make,
      model,
      year,
      price,
      price_usd,
      price_eur,
      price_cents,
      mileage,
      vin,
      fuel,
      transmission,
      color,
      condition,
      grade,
      lot_number,
      sale_status,
      status,
      images,
      high_res_images,
      features,
      inspection_report,
      accident_history,
      damage_primary,
      damage_secondary,
      service_history,
      warranty_info,
      previous_owners,
      engine_size,
      engine_displacement,
      cylinders,
      max_power,
      torque,
      acceleration,
      top_speed,
      co2_emissions,
      fuel_consumption,
      doors,
      seats,
      body_style,
      drive_type,
      location_country,
      location_state,
      location_city,
      seller_type,
      seller_notes,
      insurance,
      insurance_v2,
      details,
      inspect,
      ownerChanges,
      maintenanceHistory,
      location,
      sourceLabel,
      encarVehicle,
      encarInspection,
      encarRecord,
      encarRecordSummary,
      ...rest
    } = carData;

    // Build complete car_data object
    const car_data = {
      ...rest,
      id,
      make,
      model,
      year,
      mileage,
      vin,
      fuel,
      transmission,
      color,
      condition,
      grade,
      insurance,
      insurance_v2,
      details,
      inspect,
      ownerChanges,
      maintenanceHistory,
      location,
      sourceLabel,
      encarVehicle,
      encarInspection,
      encarRecord,
      encarRecordSummary,
    };

    // Build lot_data if exists
    const lot_data = carData.lots?.[0] || {
      lot: lot_number,
      buy_now: price,
      sale_status,
      status,
      images: { normal: images, big: high_res_images },
    };

    const { error } = await supabase
      .from('cars_cache')
      .upsert({
        id,
        api_id: id,
        make,
        model,
        year,
        price: price_eur || price,
        price_usd,
        price_eur,
        price_cents,
        mileage: typeof mileage === 'number' ? String(mileage) : mileage,
        vin,
        fuel,
        transmission,
        color,
        condition,
        grade,
        lot_number,
        sale_status,
        image_url: images?.[0],
        images: images || [],
        high_res_images: high_res_images || [],
        features: features || [],
        inspection_report: inspection_report || {},
        accident_history,
        damage_primary,
        damage_secondary,
        service_history,
        warranty_info,
        previous_owners,
        engine_size,
        engine_displacement,
        cylinders,
        max_power,
        torque,
        acceleration,
        top_speed,
        co2_emissions,
        fuel_consumption,
        doors,
        seats,
        body_style,
        drive_type,
        location_country,
        location_state,
        location_city,
        seller_type,
        seller_notes,
        car_data,
        lot_data,
        original_api_data: carData,
        last_api_sync: new Date().toISOString(),
        last_updated_source: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'id'
      });

    if (error) {
      console.error('Error syncing car data to cache:', error);
      return false;
    }

    return true;
  } catch (err) {
    console.error('Error in syncCarDataToCache:', err);
    return false;
  }
};

/**
 * Batch sync multiple cars to cache (parallel processing)
 */
export const batchSyncCarsToCache = async (cars: any[]): Promise<number> => {
  const results = await Promise.allSettled(
    cars.map(car => syncCarDataToCache(car))
  );
  
  return results.filter(
    (result): result is PromiseFulfilledResult<boolean> => 
      result.status === 'fulfilled' && result.value === true
  ).length;
};
