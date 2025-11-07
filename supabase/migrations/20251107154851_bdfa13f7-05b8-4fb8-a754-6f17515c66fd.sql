-- Create table for custom inspection diagram marker positions
CREATE TABLE IF NOT EXISTS public.inspection_marker_positions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  part_key TEXT NOT NULL UNIQUE,
  panel TEXT NOT NULL CHECK (panel IN ('within', 'out')),
  x NUMERIC NOT NULL,
  y NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Enable RLS
ALTER TABLE public.inspection_marker_positions ENABLE ROW LEVEL SECURITY;

-- Anyone can read marker positions
CREATE POLICY "Anyone can view marker positions"
  ON public.inspection_marker_positions
  FOR SELECT
  USING (true);

-- Only admins can insert/update/delete marker positions
CREATE POLICY "Admins can manage marker positions"
  ON public.inspection_marker_positions
  FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Create index for faster lookups
CREATE INDEX idx_marker_positions_part_key ON public.inspection_marker_positions(part_key);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION public.update_marker_positions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_marker_positions_updated_at
  BEFORE UPDATE ON public.inspection_marker_positions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_marker_positions_updated_at();