-- Permite tipo "other" (Outros) nos locais para correr

ALTER TABLE public.running_route_spots
  DROP CONSTRAINT IF EXISTS running_route_spots_type_check;

ALTER TABLE public.running_route_spots
  ADD CONSTRAINT running_route_spots_type_check
  CHECK (type IN ('park', 'track', 'waterfront', 'trail', 'plaza', 'other'));
