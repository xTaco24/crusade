/*
  # Datos de prueba para el sistema de votación

  1. Elección de demostración
    - Centro de Estudiantes Ingeniería 2025
    - Estado: voting_open para permitir pruebas
  
  2. Listas de candidatos
    - Lista A (Azul)
    - Lista B (Amarilla) 
    - Lista C (Verde)
*/

-- Insertar elección de demostración
insert into public.elections (title, description, career, status, start_date, end_date, eligible_voters)
values (
  'Centro de Estudiantes Ingeniería - 2025',
  'Elección oficial (demo) sede Antonio Varas',
  'Ingeniería',
  'voting_open',
  now() - interval '1 day',
  now() + interval '1 day',
  500
);

-- Insertar listas de candidatos para la elección demo
insert into public.candidate_lists (election_id, name, color, description)
select id, 'Lista A', '#60a5fa', 'Propuesta A' from public.elections where title = 'Centro de Estudiantes Ingeniería - 2025';

insert into public.candidate_lists (election_id, name, color, description)
select id, 'Lista B', '#f59e0b', 'Propuesta B' from public.elections where title = 'Centro de Estudiantes Ingeniería - 2025';

insert into public.candidate_lists (election_id, name, color, description)
select id, 'Lista C', '#34d399', 'Propuesta C' from public.elections where title = 'Centro de Estudiantes Ingeniería - 2025';