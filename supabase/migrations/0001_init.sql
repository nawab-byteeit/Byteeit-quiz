-- ByteeIT Quiz Platform - initial schema
-- Profiles, quizzes, sharing (collaborators), and live rooms/players/answers.
-- Anonymous player writes go exclusively through SECURITY DEFINER RPCs
-- (join_room, submit_answer, reset_room) so scoring is authoritative server-side.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  display_name text,
  avatar_url text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles_select_all" on public.profiles
  for select using (true);
create policy "profiles_insert_own" on public.profiles
  for insert with check (auth.uid() = id);
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, display_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'display_name', new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- quizzes + sharing
-- ---------------------------------------------------------------------------
create table public.quizzes (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  description text,
  category text,
  questions jsonb not null default '[]'::jsonb,
  is_public boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index quizzes_owner_id_idx on public.quizzes (owner_id);

alter table public.quizzes enable row level security;

create trigger quizzes_set_updated_at
  before update on public.quizzes
  for each row execute function public.set_updated_at();

create table public.quiz_collaborators (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid not null references public.quizzes(id) on delete cascade,
  invited_email text not null,
  invited_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (quiz_id, invited_email)
);

create index quiz_collaborators_quiz_id_idx on public.quiz_collaborators (quiz_id);
create index quiz_collaborators_email_idx on public.quiz_collaborators (invited_email);

alter table public.quiz_collaborators enable row level security;

create policy "quizzes_select" on public.quizzes
  for select using (
    is_public
    or owner_id = auth.uid()
    or exists (
      select 1 from public.quiz_collaborators qc
      where qc.quiz_id = quizzes.id
        and lower(qc.invited_email) = lower(coalesce(auth.jwt() ->> 'email', ''))
    )
  );

create policy "quizzes_insert_own" on public.quizzes
  for insert with check (owner_id = auth.uid());

create policy "quizzes_update" on public.quizzes
  for update using (
    owner_id = auth.uid()
    or exists (
      select 1 from public.quiz_collaborators qc
      where qc.quiz_id = quizzes.id
        and lower(qc.invited_email) = lower(coalesce(auth.jwt() ->> 'email', ''))
    )
  );

create policy "quizzes_delete_owner" on public.quizzes
  for delete using (owner_id = auth.uid());

create policy "collaborators_select" on public.quiz_collaborators
  for select using (
    exists (select 1 from public.quizzes q where q.id = quiz_id and q.owner_id = auth.uid())
    or lower(invited_email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );

create policy "collaborators_insert_owner" on public.quiz_collaborators
  for insert with check (
    exists (select 1 from public.quizzes q where q.id = quiz_id and q.owner_id = auth.uid())
  );

create policy "collaborators_delete_owner" on public.quiz_collaborators
  for delete using (
    exists (select 1 from public.quizzes q where q.id = quiz_id and q.owner_id = auth.uid())
  );

-- ---------------------------------------------------------------------------
-- live rooms
-- ---------------------------------------------------------------------------
create table public.rooms (
  id uuid primary key default gen_random_uuid(),
  room_code text not null unique,
  host_id uuid not null references public.profiles(id) on delete cascade,
  host_name text not null default 'Quiz Host',
  quiz_id uuid references public.quizzes(id) on delete set null,
  quiz_title text not null default 'Custom Quiz',
  questions jsonb not null default '[]'::jsonb,
  status text not null default 'lobby' check (status in ('lobby','question','revealed','leaderboard','finished')),
  current_question_index int not null default 0,
  active_session_filter text not null default 'all',
  time_limit int not null default 30,
  question_started_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index rooms_host_id_idx on public.rooms (host_id);

alter table public.rooms enable row level security;

create trigger rooms_set_updated_at
  before update on public.rooms
  for each row execute function public.set_updated_at();

create policy "rooms_select_all" on public.rooms
  for select using (true);
create policy "rooms_insert_own" on public.rooms
  for insert with check (host_id = auth.uid());
create policy "rooms_update_own" on public.rooms
  for update using (host_id = auth.uid());
create policy "rooms_delete_own" on public.rooms
  for delete using (host_id = auth.uid());

create table public.room_players (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms(id) on delete cascade,
  name text not null,
  score int not null default 0,
  streak int not null default 0,
  last_answer jsonb,
  client_token uuid not null default gen_random_uuid(),
  joined_at timestamptz not null default now()
);

create unique index room_players_room_name_lower_idx on public.room_players (room_id, lower(name));

alter table public.room_players enable row level security;

-- Select-only: writes happen exclusively through join_room / submit_answer / reset_room below.
create policy "room_players_select_all" on public.room_players
  for select using (true);

create table public.room_answers (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms(id) on delete cascade,
  question_id bigint not null,
  player_id uuid not null references public.room_players(id) on delete cascade,
  option_index int not null,
  is_correct boolean not null,
  points_earned int not null default 0,
  time_taken_seconds int not null default 0,
  created_at timestamptz not null default now(),
  unique (room_id, question_id, player_id)
);

create index room_answers_room_id_idx on public.room_answers (room_id);

alter table public.room_answers enable row level security;

create policy "room_answers_select_all" on public.room_answers
  for select using (true);

-- ---------------------------------------------------------------------------
-- RPCs (SECURITY DEFINER — bypass RLS on room_players/room_answers by design)
-- ---------------------------------------------------------------------------

create or replace function public.join_room(p_room_code text, p_name text)
returns table (id uuid, name text, score int, streak int, client_token uuid)
language plpgsql
security definer set search_path = public
as $$
declare
  v_room_id uuid;
  v_name text := trim(p_name);
  v_existing record;
  v_new record;
begin
  if v_name is null or v_name = '' then
    raise exception 'Name is required';
  end if;

  select r.id into v_room_id from public.rooms r where upper(r.room_code) = upper(p_room_code);
  if v_room_id is null then
    raise exception 'Room not found';
  end if;

  select rp.id, rp.name, rp.score, rp.streak, rp.client_token
    into v_existing
    from public.room_players rp
    where rp.room_id = v_room_id and lower(rp.name) = lower(v_name);

  if found then
    return query select v_existing.id, v_existing.name, v_existing.score, v_existing.streak, v_existing.client_token;
    return;
  end if;

  insert into public.room_players (room_id, name)
  values (v_room_id, v_name)
  returning room_players.id, room_players.name, room_players.score, room_players.streak, room_players.client_token
  into v_new;

  return query select v_new.id, v_new.name, v_new.score, v_new.streak, v_new.client_token;
end;
$$;

create or replace function public.submit_answer(
  p_room_id uuid,
  p_player_id uuid,
  p_client_token uuid,
  p_question_id bigint,
  p_option_index int,
  p_time_taken_seconds int
)
returns table (is_correct boolean, points_earned int, new_score int, new_streak int)
language plpgsql
security definer set search_path = public
as $$
declare
  v_room public.rooms;
  v_player public.room_players;
  v_question jsonb;
  v_correct_answer int;
  v_time_limit int;
  v_is_correct boolean;
  v_time_ratio numeric;
  v_speed_bonus int := 0;
  v_points int := 0;
  v_new_streak int;
  v_streak_bonus int := 0;
  v_total int := 0;
  v_rowcount int;
begin
  select * into v_room from public.rooms where id = p_room_id;
  if not found then
    raise exception 'Room not found';
  end if;
  if v_room.status <> 'question' then
    raise exception 'Room is not accepting answers right now';
  end if;

  select * into v_player from public.room_players
    where id = p_player_id and room_id = p_room_id and client_token = p_client_token;
  if not found then
    raise exception 'Invalid player session';
  end if;

  select q into v_question
    from jsonb_array_elements(v_room.questions) q
    where (q->>'id')::bigint = p_question_id
    limit 1;

  if v_question is null then
    raise exception 'Question not found in this room';
  end if;

  v_correct_answer := (v_question->>'correctAnswer')::int;
  v_time_limit := coalesce((v_question->>'timeLimit')::int, v_room.time_limit, 30);
  v_is_correct := (p_option_index = v_correct_answer);

  if v_is_correct then
    v_time_ratio := greatest(0, (v_time_limit - p_time_taken_seconds)::numeric / v_time_limit);
    v_speed_bonus := round(500 * v_time_ratio);
    v_points := 500 + v_speed_bonus;
    v_new_streak := v_player.streak + 1;
    if v_new_streak > 1 then
      v_streak_bonus := (v_new_streak - 1) * 100;
    end if;
    v_total := v_points + v_streak_bonus;
  else
    v_new_streak := 0;
    v_total := 0;
  end if;

  insert into public.room_answers (room_id, question_id, player_id, option_index, is_correct, points_earned, time_taken_seconds)
  values (p_room_id, p_question_id, p_player_id, p_option_index, v_is_correct, v_total, p_time_taken_seconds)
  on conflict (room_id, question_id, player_id) do nothing;

  get diagnostics v_rowcount = row_count;

  if v_rowcount > 0 then
    update public.room_players
      set score = score + v_total,
          streak = v_new_streak,
          last_answer = jsonb_build_object(
            'questionId', p_question_id,
            'optionIndex', p_option_index,
            'isCorrect', v_is_correct,
            'pointsEarned', v_total,
            'timeTakenSeconds', p_time_taken_seconds
          )
      where id = p_player_id
      returning score, streak into v_player.score, v_player.streak;
  end if;

  return query select v_is_correct, v_total, v_player.score, v_player.streak;
end;
$$;

create or replace function public.reset_room(p_room_id uuid)
returns void
language plpgsql
security definer set search_path = public
as $$
begin
  if not exists (select 1 from public.rooms where id = p_room_id and host_id = auth.uid()) then
    raise exception 'Not authorized';
  end if;

  delete from public.room_answers where room_id = p_room_id;
  delete from public.room_players where room_id = p_room_id;

  update public.rooms
    set status = 'lobby',
        current_question_index = 0,
        question_started_at = null
    where id = p_room_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- Grants
-- ---------------------------------------------------------------------------
grant usage on schema public to anon, authenticated;

grant select on public.profiles, public.quizzes, public.quiz_collaborators,
  public.rooms, public.room_players, public.room_answers to anon, authenticated;

grant insert, update on public.profiles to authenticated;
grant insert, update, delete on public.quizzes to authenticated;
grant insert, delete on public.quiz_collaborators to authenticated;
grant insert, update, delete on public.rooms to authenticated;

grant execute on function public.join_room(text, text) to anon, authenticated;
grant execute on function public.submit_answer(uuid, uuid, uuid, bigint, int, int) to anon, authenticated;
grant execute on function public.reset_room(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Realtime publication
-- ---------------------------------------------------------------------------
do $$ begin
  execute 'alter publication supabase_realtime add table public.rooms';
exception when duplicate_object then null;
end $$;

do $$ begin
  execute 'alter publication supabase_realtime add table public.room_players';
exception when duplicate_object then null;
end $$;

do $$ begin
  execute 'alter publication supabase_realtime add table public.room_answers';
exception when duplicate_object then null;
end $$;
