-- Migration: Flexible Business Hours per Day
-- Created: 2026-01-04
-- Description: Update business_hours to support different schedules per day of week

-- Update business_hours setting with flexible schedule per day
-- Days: 0=Sunday, 1=Monday, 2=Tuesday, 3=Wednesday, 4=Thursday, 5=Friday, 6=Saturday

UPDATE public.settings
SET value = '{
  "schedule": {
    "0": {"enabled": true, "start": "08:00", "end": "21:00"},
    "1": {"enabled": true, "start": "08:00", "end": "21:00"},
    "2": {"enabled": true, "start": "18:00", "end": "21:00"},
    "3": {"enabled": true, "start": "18:00", "end": "21:00"},
    "4": {"enabled": true, "start": "18:00", "end": "21:00"},
    "5": {"enabled": true, "start": "18:00", "end": "21:00"},
    "6": {"enabled": true, "start": "18:00", "end": "21:00"}
  }
}'::jsonb,
    description = 'Horario de funcionamento por dia da semana (0=Domingo, 1=Segunda, ..., 6=Sabado)',
    updated_at = NOW()
WHERE key = 'business_hours';

-- If the setting doesn't exist, insert it
INSERT INTO public.settings (key, value, description)
SELECT
  'business_hours',
  '{
    "schedule": {
      "0": {"enabled": true, "start": "08:00", "end": "21:00"},
      "1": {"enabled": true, "start": "08:00", "end": "21:00"},
      "2": {"enabled": true, "start": "18:00", "end": "21:00"},
      "3": {"enabled": true, "start": "18:00", "end": "21:00"},
      "4": {"enabled": true, "start": "18:00", "end": "21:00"},
      "5": {"enabled": true, "start": "18:00", "end": "21:00"},
      "6": {"enabled": true, "start": "18:00", "end": "21:00"}
    }
  }'::jsonb,
  'Horario de funcionamento por dia da semana (0=Domingo, 1=Segunda, ..., 6=Sabado)'
WHERE NOT EXISTS (SELECT 1 FROM public.settings WHERE key = 'business_hours');
