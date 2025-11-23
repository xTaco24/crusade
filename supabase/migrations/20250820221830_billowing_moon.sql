/*
  # Extensiones y tipos base para el sistema de votación

  1. Extensiones
    - pgcrypto para generación de UUIDs y hashes
  
  2. Tipos
    - election_status enum para estados de elección
  
  3. Funciones de utilidad
    - jwt_roles() para extraer roles del JWT
    - is_admin() y is_committee() para verificar permisos
*/

-- Extensiones necesarias
create extension if not exists pgcrypto;

-- Tipo enum para estados de elección
create type election_status as enum (
  'draft','scheduled','campaign','voting_open','paused','voting_closed','results_published'
);

-- Función para extraer roles del JWT
create or replace function public.jwt_roles() returns text[]
language sql stable as $$
with claims as (select auth.jwt() as j),
r1 as (
  select coalesce(
    (select array_agg(value::text)
       from jsonb_array_elements_text(coalesce(j->'app_metadata'->'roles','[]'::jsonb))),
    array[]::text[]
  ) as roles
  from claims
),
r2 as (
  select coalesce(
    (select array_agg(value::text)
       from jsonb_array_elements_text(coalesce(j->'user_metadata'->'roles','[]'::jsonb))),
    array[]::text[]
  ) as roles
  from claims
)
select coalesce((select roles from r1), array[]::text[]) || coalesce((select roles from r2), array[]::text[]);
$$;

-- Función para verificar si el usuario es administrador
create or replace function public.is_admin() returns boolean
language sql stable as $$
  select 'administrator' = any(public.jwt_roles());
$$;

-- Función para verificar si el usuario es del comité electoral
create or replace function public.is_committee() returns boolean
language sql stable as $$
  select 'electoral_committee' = any(public.jwt_roles());
$$;