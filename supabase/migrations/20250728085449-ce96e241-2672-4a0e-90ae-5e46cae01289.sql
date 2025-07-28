-- Phase 1: Emergency Database Cleanup & Reset
-- Clear all stuck syncs to allow fresh start
UPDATE sync_status 
SET status = 'failed', 
    completed_at = now(),
    error_message = 'Emergency cleanup - preparing for comprehensive data fetch'
WHERE status = 'running';

-- Create emergency function to populate massive sample data if APIs fail
CREATE OR REPLACE FUNCTION generate_sample_cars(car_count INTEGER DEFAULT 10000)
RETURNS INTEGER AS $$
DECLARE
    i INTEGER;
    makes TEXT[] := ARRAY['Toyota', 'Honda', 'BMW', 'Mercedes-Benz', 'Audi', 'Hyundai', 'Kia', 'Nissan', 'Mazda', 'Subaru', 'Lexus', 'Infiniti', 'Acura', 'Genesis', 'Volvo', 'Jaguar', 'Land Rover', 'Porsche', 'Ferrari', 'Lamborghini'];
    colors TEXT[] := ARRAY['Black', 'White', 'Silver', 'Gray', 'Blue', 'Red', 'Green', 'Brown', 'Yellow', 'Orange'];
    fuels TEXT[] := ARRAY['Gasoline', 'Diesel', 'Hybrid', 'Electric', 'LPG'];
    transmissions TEXT[] := ARRAY['Automatic', 'Manual', 'CVT', 'Semi-Automatic'];
    conditions TEXT[] := ARRAY['excellent', 'very_good', 'good', 'fair', 'poor'];
    models TEXT[] := ARRAY['Sedan', 'SUV', 'Hatchback', 'Coupe', 'Wagon', 'Convertible', 'Truck', 'Van'];
    inserted_count INTEGER := 0;
BEGIN
    FOR i IN 1..car_count LOOP
        INSERT INTO cars (
            id,
            external_id,
            make,
            model,
            year,
            price,
            mileage,
            title,
            color,
            fuel,
            transmission,
            condition,
            location,
            image_url,
            last_synced_at
        ) VALUES (
            'emergency-' || i::text,
            'emergency-' || i::text,
            makes[1 + (i % array_length(makes, 1))],
            models[1 + (i % array_length(models, 1))],
            2015 + (i % 9), -- Years 2015-2023
            15000 + (random() * 85000)::integer, -- Price 15k-100k
            (random() * 200000)::integer, -- Mileage 0-200k
            makes[1 + (i % array_length(makes, 1))] || ' ' || models[1 + (i % array_length(models, 1))] || ' ' || (2015 + (i % 9))::text,
            colors[1 + (i % array_length(colors, 1))],
            fuels[1 + (i % array_length(fuels, 1))],
            transmissions[1 + (i % array_length(transmissions, 1))],
            conditions[1 + (i % array_length(conditions, 1))],
            'South Korea',
            'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=400',
            now()
        ) ON CONFLICT (id) DO NOTHING;
        
        inserted_count := inserted_count + 1;
        
        -- Progress logging every 1000 records
        IF i % 1000 = 0 THEN
            RAISE NOTICE 'Generated % sample cars...', i;
        END IF;
    END LOOP;
    
    RETURN inserted_count;
END;
$$ LANGUAGE plpgsql;