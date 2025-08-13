-- Create or upgrade the cars table to support full catalog
CREATE TABLE IF NOT EXISTS public.cars (
  id text PRIMARY KEY,
  external_id text,
  make text NOT NULL,
  model text NOT NULL,
  year integer NOT NULL,
  price numeric,
  mileage integer,
  title text,
  vin text,
  color text,
  fuel text,
  transmission text,
  lot_number text,
  image_url text,
  images jsonb DEFAULT '[]'::jsonb,
  current_bid numeric,
  buy_now_price numeric,
  final_bid numeric,
  sale_date timestamptz,
  source_api text DEFAULT 'auctionapis',
  domain_name text,
  status text DEFAULT 'sale',
  is_live boolean DEFAULT false,
  keys_available boolean,
  is_active boolean DEFAULT true,
  is_archived boolean DEFAULT false,
  condition text,
  location text DEFAULT 'South Korea',
  last_synced_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Ensure all required columns exist (for pre-existing tables)
ALTER TABLE public.cars
  ADD COLUMN IF NOT EXISTS id text,
  ADD COLUMN IF NOT EXISTS external_id text,
  ADD COLUMN IF NOT EXISTS make text,
  ADD COLUMN IF NOT EXISTS model text,
  ADD COLUMN IF NOT EXISTS year integer,
  ADD COLUMN IF NOT EXISTS price numeric,
  ADD COLUMN IF NOT EXISTS mileage integer,
  ADD COLUMN IF NOT EXISTS title text,
  ADD COLUMN IF NOT EXISTS vin text,
  ADD COLUMN IF NOT EXISTS color text,
  ADD COLUMN IF NOT EXISTS fuel text,
  ADD COLUMN IF NOT EXISTS transmission text,
  ADD COLUMN IF NOT EXISTS lot_number text,
  ADD COLUMN IF NOT EXISTS image_url text,
  ADD COLUMN IF NOT EXISTS images jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS current_bid numeric,
  ADD COLUMN IF NOT EXISTS buy_now_price numeric,
  ADD COLUMN IF NOT EXISTS final_bid numeric,
  ADD COLUMN IF NOT EXISTS sale_date timestamptz,
  ADD COLUMN IF NOT EXISTS source_api text DEFAULT 'auctionapis',
  ADD COLUMN IF NOT EXISTS domain_name text,
  ADD COLUMN IF NOT EXISTS status text DEFAULT 'sale',
  ADD COLUMN IF NOT EXISTS is_live boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS keys_available boolean,
  ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS is_archived boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS condition text,
  ADD COLUMN IF NOT EXISTS location text DEFAULT 'South Korea',
  ADD COLUMN IF NOT EXISTS last_synced_at timestamptz DEFAULT now(),
  ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- Ensure primary key on id
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conrelid = 'public.cars'::regclass 
      AND contype = 'p'
  ) THEN
    BEGIN
      ALTER TABLE public.cars
        ADD CONSTRAINT cars_pkey PRIMARY KEY (id);
    EXCEPTION WHEN others THEN
      RAISE NOTICE 'Could not add primary key to public.cars';
    END;
  END IF;
END$$;

-- Helpful indexes for catalog queries
CREATE INDEX IF NOT EXISTS idx_cars_is_active ON public.cars (is_active);
CREATE INDEX IF NOT EXISTS idx_cars_make_model ON public.cars (make, model);
CREATE INDEX IF NOT EXISTS idx_cars_year ON public.cars (year);
CREATE INDEX IF NOT EXISTS idx_cars_price ON public.cars (price);
CREATE INDEX IF NOT EXISTS idx_cars_last_synced_at ON public.cars (last_synced_at);

-- Keep updated_at fresh
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_cars_updated_at'
  ) THEN
    CREATE TRIGGER update_cars_updated_at
    BEFORE UPDATE ON public.cars
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END$$;

-- Ensure RLS and policies (idempotent)
ALTER TABLE public.cars ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname='public' AND tablename='cars' AND policyname='Service role can manage cars'
  ) THEN
    CREATE POLICY "Service role can manage cars"
      ON public.cars
      FOR ALL
      TO public
      USING (auth.role() = 'service_role')
      WITH CHECK (auth.role() = 'service_role');
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname='public' AND tablename='cars' AND policyname='Public read access to cars'
  ) THEN
    CREATE POLICY "Public read access to cars"
      ON public.cars
      FOR SELECT
      TO public
      USING (true);
  END IF;
END$$;