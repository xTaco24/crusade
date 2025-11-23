/*
  # Políticas de Row Level Security (RLS)

  1. Habilitar RLS
    - Todas las tablas tienen RLS habilitado
  
  2. Políticas de elections
    - Lectura: todos los usuarios autenticados
    - Escritura: solo administradores
  
  3. Políticas de candidate_lists
    - Lectura: todos los usuarios autenticados
    - Escritura: solo administradores
  
  4. Políticas de votes
    - Lectura: propios votos, administradores y comité electoral
    - Escritura: solo inserción con validaciones estrictas
*/

-- Habilitar RLS en todas las tablas
alter table public.elections enable row level security;
alter table public.candidate_lists enable row level security;
alter table public.votes enable row level security;

-- Políticas para elections
create policy elections_select on public.elections
  for select using (auth.role() = 'authenticated');

create policy elections_write on public.elections
  for all
  using (public.is_admin())
  with check (public.is_admin());

-- Políticas para candidate_lists
create policy candidate_lists_select on public.candidate_lists
  for select using (auth.role() = 'authenticated');

create policy candidate_lists_write on public.candidate_lists
  for all
  using (public.is_admin())
  with check (public.is_admin());

-- Políticas para votes
-- SELECT: usuario puede ver sus propios votos, admin y comité pueden ver todos
create policy votes_select on public.votes
  for select using (
    user_id = auth.uid() or public.is_admin() or public.is_committee()
  );

-- INSERT: validaciones estrictas para votación
create policy votes_insert on public.votes
  for insert
  with check (
    auth.uid() is not null
    and user_id = auth.uid()
    and exists (
      select 1 from public.elections e 
      where e.id = election_id 
      and e.status = 'voting_open'
    )
    and exists (
      select 1 from public.candidate_lists cl 
      where cl.id = candidate_list_id 
      and cl.election_id = election_id
    )
  );

-- UPDATE/DELETE de votes: no permitido (sin políticas definidas)