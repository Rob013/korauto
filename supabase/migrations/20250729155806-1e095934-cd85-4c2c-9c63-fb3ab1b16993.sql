-- Create a table to track analytics and website activity
CREATE TABLE public.website_analytics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NULL,
  session_id TEXT NULL,
  page_url TEXT NOT NULL,
  page_title TEXT NULL,
  referrer TEXT NULL,
  user_agent TEXT NULL,
  ip_address INET NULL,
  action_type TEXT NOT NULL, -- 'page_view', 'car_view', 'favorite_add', 'favorite_remove', 'inspection_request', 'search', 'contact'
  car_id TEXT NULL,
  metadata JSONB NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.website_analytics ENABLE ROW LEVEL SECURITY;

-- Create policies for analytics
CREATE POLICY "Service role can manage analytics" 
ON public.website_analytics 
FOR ALL 
USING (auth.role() = 'service_role'::text);

CREATE POLICY "Admins can view analytics" 
ON public.website_analytics 
FOR SELECT 
USING (is_admin());

-- Create index for better performance
CREATE INDEX idx_website_analytics_created_at ON public.website_analytics(created_at DESC);
CREATE INDEX idx_website_analytics_action_type ON public.website_analytics(action_type);
CREATE INDEX idx_website_analytics_car_id ON public.website_analytics(car_id);

-- Update favorite_cars table to better integrate with analytics
ALTER TABLE public.favorite_cars ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Create trigger for favorite_cars updated_at
CREATE OR REPLACE FUNCTION public.update_favorite_cars_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_favorite_cars_updated_at
BEFORE UPDATE ON public.favorite_cars
FOR EACH ROW
EXECUTE FUNCTION public.update_favorite_cars_updated_at();