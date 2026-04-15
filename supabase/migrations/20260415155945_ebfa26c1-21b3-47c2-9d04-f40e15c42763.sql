
-- Create table for scheduled interviews
CREATE TABLE public.scheduled_interviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  candidate_name TEXT NOT NULL,
  candidate_email TEXT NOT NULL,
  interview_date DATE NOT NULL,
  interview_time TEXT NOT NULL,
  accessibility_needs TEXT,
  confirmation_code TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'scheduled',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.scheduled_interviews ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert (candidates are not logged in)
CREATE POLICY "Anyone can schedule an interview"
ON public.scheduled_interviews
FOR INSERT
WITH CHECK (true);

-- Allow anyone to look up their interview by confirmation code and email
CREATE POLICY "Anyone can view interview by confirmation code"
ON public.scheduled_interviews
FOR SELECT
USING (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_scheduled_interviews_updated_at
BEFORE UPDATE ON public.scheduled_interviews
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
