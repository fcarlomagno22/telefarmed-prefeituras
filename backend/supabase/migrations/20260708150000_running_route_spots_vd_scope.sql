-- Escopo VD em locais para correr + revoga INSERT/SELECT anon (API service_role)

ALTER TABLE public.running_route_spots
  ADD COLUMN IF NOT EXISTS entidade_contratante_id UUID
    REFERENCES public.entidades_contratantes(id) ON DELETE RESTRICT,
  ADD COLUMN IF NOT EXISTS paciente_id UUID
    REFERENCES public.pacientes(id) ON DELETE SET NULL;

COMMENT ON COLUMN public.running_route_spots.entidade_contratante_id IS
  'Entidade do paciente que submeteu o local (isolamento multi-tenant).';
COMMENT ON COLUMN public.running_route_spots.paciente_id IS
  'Paciente VD que submeteu o local.';

CREATE INDEX IF NOT EXISTS idx_running_route_spots_entidade
  ON public.running_route_spots (entidade_contratante_id);

CREATE INDEX IF NOT EXISTS idx_running_route_spots_lat_lng
  ON public.running_route_spots (latitude, longitude);

DROP POLICY IF EXISTS "anon_insert_running_route_spots" ON public.running_route_spots;
DROP POLICY IF EXISTS "anon_select_running_route_spots" ON public.running_route_spots;

REVOKE ALL ON TABLE public.running_route_spots FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.running_route_spots TO service_role;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'run-walk-locais-capas',
  'run-walk-locais-capas',
  false,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp']::text[]
)
ON CONFLICT (id) DO NOTHING;
