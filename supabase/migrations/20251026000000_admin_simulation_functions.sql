/*
  # RPC de administración para simulación de votos

  - admin_apply_simulation(election_id uuid, distribution jsonb)
    Aplica de forma atómica la distribución de votos simulados.
    Solo actualiza contadores, no inserta filas en votes.

  - admin_reset_election_votes(election_id uuid)
    Reinicia contadores de la elección y sus listas.
*/

-- Eliminar versiones anteriores de la función si existen
drop function if exists public.admin_apply_simulation(uuid, jsonb, boolean);
drop function if exists public.admin_apply_simulation(uuid, jsonb);

create or replace function public.admin_apply_simulation(
  p_election_id uuid,
  p_distribution jsonb
) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_list_id uuid;
  v_votes integer;
  v_total integer := 0;
begin
  if not public.is_admin() then
    raise exception 'Solo administradores' using errcode = '42501';
  end if;

  -- Validar elección
  if not exists (select 1 from public.elections e where e.id = p_election_id) then
    raise exception 'Elección no encontrada' using errcode = '22023';
  end if;

  -- Sumar total y validar listas pertenecen a elección
  for v_list_id, v_votes in
    select (key)::uuid, (value)::int
    from jsonb_each_text(p_distribution)
  loop
    if not exists (
      select 1 from public.candidate_lists cl where cl.id = v_list_id and cl.election_id = p_election_id
    ) then
      raise exception 'Lista % no corresponde a elección', v_list_id using errcode = '23503';
    end if;
    v_total := v_total + coalesce(v_votes, 0);
  end loop;

  -- Actualizar candidate_lists
  update public.candidate_lists cl
     set votes_count = cl.votes_count + coalesce((p_distribution ->> cl.id::text)::int, 0)
   where cl.election_id = p_election_id;

  -- Actualizar total de la elección
  update public.elections e
     set total_votes = e.total_votes + v_total,
         updated_at = now()
   where e.id = p_election_id;

end; $$;

create or replace function public.admin_reset_election_votes(
  p_election_id uuid
) returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Solo administradores' using errcode = '42501';
  end if;

  -- Eliminar todos los votos de la elección
  delete from public.votes where election_id = p_election_id;

  -- Reiniciar contadores de listas
  update public.candidate_lists
     set votes_count = 0
   where election_id = p_election_id;

  -- Reiniciar total de elección
  update public.elections
     set total_votes = 0,
         updated_at = now()
   where id = p_election_id;
end; $$;

-- Conceder ejecución a rol authenticated (validación is_admin aplica)
grant execute on function public.admin_apply_simulation(uuid, jsonb) to authenticated;
grant execute on function public.admin_reset_election_votes(uuid) to authenticated;

