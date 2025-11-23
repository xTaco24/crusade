/*
  # Funciones y triggers del sistema de votación

  1. Funciones
    - make_receipt() para generar comprobantes únicos
    - votes_after_insert() para actualizar contadores automáticamente
  
  2. Triggers
    - Trigger para actualizar contadores después de insertar votos
  
  3. RPC
    - cast_vote() para votación atómica y segura
*/

-- Generador de comprobante único
create or replace function public.make_receipt() returns text
language sql stable as $$
  select replace(gen_random_uuid()::text, '-', '');
$$;

-- Función trigger: actualiza contadores después de insertar voto
create or replace function public.votes_after_insert() returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Generar comprobante si no existe
  if new.receipt_hash is null or length(new.receipt_hash) = 0 then
    new.receipt_hash := public.make_receipt();
    update public.votes set receipt_hash = new.receipt_hash where id = new.id;
  end if;

  -- Actualizar contador total de la elección
  update public.elections
     set total_votes = total_votes + 1, updated_at = now()
   where id = new.election_id;

  -- Actualizar contador de la lista de candidatos
  update public.candidate_lists
     set votes_count = votes_count + 1
   where id = new.candidate_list_id;

  return null;
end;
$$;

-- Crear trigger
drop trigger if exists trg_votes_after_insert on public.votes;
create trigger trg_votes_after_insert
  after insert on public.votes
  for each row
  execute function public.votes_after_insert();

-- RPC para emitir voto de forma atómica
create or replace function public.cast_vote(p_election uuid, p_list uuid)
returns public.votes
language plpgsql
security invoker
set search_path = public
as $$
declare
  v public.votes;
begin
  -- Insertar voto (las validaciones las hace RLS y constraints)
  insert into public.votes (election_id, candidate_list_id, user_id, receipt_hash)
  values (p_election, p_list, auth.uid(), public.make_receipt())
  returning * into v;

  return v;
exception
  when unique_violation then
    raise exception 'Ya existe un voto para este usuario en esta elección' using errcode = '23505';
  when foreign_key_violation then
    raise exception 'Lista de candidatos no válida para esta elección' using errcode = '23503';
end;
$$;