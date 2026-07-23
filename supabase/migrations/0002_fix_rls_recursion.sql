-- Fix "infinite recursion detected in policy for relation quizzes" (42P17).
-- quizzes_select referenced quiz_collaborators, whose own policy referenced
-- quizzes back -- each SELECT re-triggered the other's RLS evaluation.
-- SECURITY DEFINER helper functions run as the table owner (which bypasses
-- RLS on tables it owns), so calling them from inside a policy breaks the cycle.

create or replace function public.is_quiz_owner(p_quiz_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.quizzes q where q.id = p_quiz_id and q.owner_id = auth.uid()
  );
$$;

create or replace function public.is_quiz_collaborator(p_quiz_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.quiz_collaborators qc
    where qc.quiz_id = p_quiz_id
      and lower(qc.invited_email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;

grant execute on function public.is_quiz_owner(uuid) to anon, authenticated;
grant execute on function public.is_quiz_collaborator(uuid) to anon, authenticated;

drop policy if exists "quizzes_select" on public.quizzes;
create policy "quizzes_select" on public.quizzes
  for select using (
    is_public
    or owner_id = auth.uid()
    or public.is_quiz_collaborator(id)
  );

drop policy if exists "quizzes_update" on public.quizzes;
create policy "quizzes_update" on public.quizzes
  for update using (
    owner_id = auth.uid()
    or public.is_quiz_collaborator(id)
  );

drop policy if exists "collaborators_select" on public.quiz_collaborators;
create policy "collaborators_select" on public.quiz_collaborators
  for select using (
    public.is_quiz_owner(quiz_id)
    or lower(invited_email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );

drop policy if exists "collaborators_insert_owner" on public.quiz_collaborators;
create policy "collaborators_insert_owner" on public.quiz_collaborators
  for insert with check (public.is_quiz_owner(quiz_id));

drop policy if exists "collaborators_delete_owner" on public.quiz_collaborators;
create policy "collaborators_delete_owner" on public.quiz_collaborators
  for delete using (public.is_quiz_owner(quiz_id));
