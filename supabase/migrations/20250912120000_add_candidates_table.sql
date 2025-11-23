/*
  # Tabla de candidatos por lista

  - candidates: Información detallada de candidatos asociados a una lista
  - FK: list_id -> candidate_lists(id)
  - RLS: lectura autenticados, escritura solo administradores
*/

create table if not exists public.candidates (
  id uuid primary key default gen_random_uuid(),
  list_id uuid not null references public.candidate_lists(id) on delete cascade,
  name text not null,
  email text,
  student_id text,
  position text not null,
  bio text,
  image_url text,
  proposals text,
  created_at timestamptz not null default now()
);

create index if not exists candidates_list_id_idx on public.candidates(list_id);

alter table public.candidates enable row level security;

-- Lectura: usuarios autenticados
do $$
begin
  create policy candidates_select on public.candidates
    for select using (auth.role() = 'authenticated');
exception when duplicate_object then
  null;
end $$;

-- Escritura: solo administradores
do $$
begin
  create policy candidates_write on public.candidates
    for all
    using (public.is_admin())
    with check (public.is_admin());
exception when duplicate_object then
  null;
end $$;


