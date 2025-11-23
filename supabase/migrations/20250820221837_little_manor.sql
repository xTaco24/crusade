/*
  # Tablas principales del sistema de votación

  1. Tablas
    - elections: Información de elecciones
    - candidate_lists: Listas de candidatos (solo info general)
    - votes: Votos emitidos con comprobantes
  
  2. Índices
    - Índices para optimizar consultas frecuentes
  
  3. Constraints
    - Un voto por usuario por elección
    - FK compuesta para garantizar integridad lista-elección
*/

-- Tabla de elecciones
create table public.elections (
  id               uuid primary key default gen_random_uuid(),
  title            text not null,
  description      text,
  campus           text not null default 'Antonio Varas',
  career           text,
  status           election_status not null default 'draft',
  start_date       timestamptz,
  end_date         timestamptz,
  total_votes      integer not null default 0,
  eligible_voters  integer,
  created_by       uuid references auth.users(id) on delete set null,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

-- Índices para elections
create index elections_status_idx on public.elections (status);
create index elections_dates_idx on public.elections (start_date, end_date);
create index elections_created_by_idx on public.elections (created_by);

-- Tabla de listas de candidatos (solo información general)
create table public.candidate_lists (
  id           uuid primary key default gen_random_uuid(),
  election_id  uuid not null references public.elections(id) on delete cascade,
  name         text not null,
  color        text,
  description  text,
  votes_count  integer not null default 0,
  created_at   timestamptz not null default now(),
  -- UNIQUE necesario para FK compuesta desde votes
  constraint candidate_lists_unique_pair unique (id, election_id)
);

-- Índices para candidate_lists
create index candidate_lists_election_id_idx on public.candidate_lists (election_id);

-- Tabla de votos con comprobante
create table public.votes (
  id                uuid primary key default gen_random_uuid(),
  election_id       uuid not null references public.elections(id) on delete cascade,
  candidate_list_id uuid not null,
  user_id           uuid not null references auth.users(id) on delete cascade,
  receipt_hash      text not null,
  confirmed         boolean not null default true,
  created_at        timestamptz not null default now(),
  -- Un voto por usuario por elección
  constraint one_vote_per_user_per_election unique (user_id, election_id),
  -- FK compuesta: garantiza que la lista pertenezca a la misma elección
  constraint votes_candidate_list_matches_election
    foreign key (candidate_list_id, election_id)
    references public.candidate_lists (id, election_id)
    on delete restrict
);

-- Índices para votes
create unique index votes_receipt_hash_idx on public.votes (receipt_hash);
create index votes_election_id_idx on public.votes (election_id);
create index votes_candidate_list_id_idx on public.votes (candidate_list_id);
create index votes_user_id_idx on public.votes (user_id);