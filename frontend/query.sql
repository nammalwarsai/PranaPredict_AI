-- Run this query in your Supabase SQL Editor to add the new fields

ALTER TABLE public.health_reports
ADD COLUMN location text,
ADD COLUMN diabetes boolean DEFAULT false,
ADD COLUMN hypertension boolean DEFAULT false,
ADD COLUMN heart_disease boolean DEFAULT false,
ADD COLUMN kidney_disease boolean DEFAULT false,
ADD COLUMN diet_type text,
ADD COLUMN water_intake numeric,
ADD COLUMN sleep_duration numeric,
ADD COLUMN alcohol_consumption text,
ADD COLUMN work_type text;
