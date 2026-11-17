create type public.task_priority as enum ('low', 'medium', 'high', 'urgent');
create type public.task_status as enum ('pending', 'ongoing', 'completed');

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  division_id uuid not null,
  title text not null,
  description text not null default '',
  instructions text not null default '',
  due_at date,
  priority public.task_priority not null default 'medium',
  status public.task_status not null default 'pending',
  progress_update text not null default '',
  assignee_user_id uuid references public.profiles (id) on delete set null,
  created_by uuid not null references public.profiles (id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (organization_id, division_id)
    references public.divisions (organization_id, id) on delete cascade
);

create index tasks_division_status_idx
  on public.tasks (organization_id, division_id, status, due_at);
create index tasks_assignee_status_idx
  on public.tasks (organization_id, assignee_user_id, status, due_at);

alter table public.tasks enable row level security;

create or replace function public.has_division_role(
  p_organization_id uuid,
  p_division_id uuid,
  p_roles public.org_role[]
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.organization_members m
    where m.organization_id = p_organization_id
      and m.division_id = p_division_id
      and m.user_id = auth.uid()
      and m.status = 'active'
      and m.role = any (p_roles)
  );
$$;

create or replace function public.can_view_profile(p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select p_user_id = auth.uid()
    or exists (
      select 1
      from public.organization_members viewer
      join public.organization_members target
        on target.organization_id = viewer.organization_id
      where viewer.user_id = auth.uid()
        and target.user_id = p_user_id
        and viewer.status = 'active'
        and target.status = 'active'
        and (
          viewer.role = 'executive'
          or (
            viewer.division_id is not null
            and viewer.division_id = target.division_id
          )
        )
    );
$$;

create or replace function public.can_view_scoped_note(p_note_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.notes n
    where n.id = p_note_id
      and (
        n.author_id = auth.uid()
        or (
          n.share_with_all_members
          and public.is_org_member(n.organization_id)
        )
        or exists (
          select 1
          from public.note_audience_roles a
          join public.organization_members m
            on m.organization_id = n.organization_id
            and m.role::text = a.role::text
          where a.organization_id = n.organization_id
            and a.note_id = n.id
            and m.user_id = auth.uid()
            and m.status = 'active'
        )
        or exists (
          select 1
          from public.note_audience_divisions a
          where a.organization_id = n.organization_id
            and a.note_id = n.id
            and public.has_division_role(
              n.organization_id,
              a.division_id,
              array['coordinator', 'member']::public.org_role[]
            )
        )
      )
  );
$$;

create or replace function public.can_manage_scoped_note(p_note_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.notes n
    where n.id = p_note_id
      and (
        public.has_org_role(n.organization_id, array['executive']::public.org_role[])
        or (
          n.author_id = auth.uid()
          and public.is_org_member(n.organization_id)
          and (
            not n.share_with_all_members
            and not exists (
              select 1
              from public.note_audience_roles a
              where a.organization_id = n.organization_id
                and a.note_id = n.id
            )
            and not exists (
              select 1
              from public.note_audience_divisions a
              where a.organization_id = n.organization_id
                and a.note_id = n.id
                and not public.has_division_role(
                  a.organization_id,
                  a.division_id,
                  array['coordinator', 'member']::public.org_role[]
                )
            )
          )
        )
        or (
          not n.share_with_all_members
          and public.is_org_member(n.organization_id)
          and not exists (
            select 1
            from public.note_audience_roles a
            where a.organization_id = n.organization_id
              and a.note_id = n.id
          )
          and exists (
            select 1
            from public.note_audience_divisions a
            where a.organization_id = n.organization_id
              and a.note_id = n.id
              and public.has_division_role(
                a.organization_id,
                a.division_id,
                array['coordinator']::public.org_role[]
              )
          )
          and not exists (
            select 1
            from public.note_audience_divisions a
            where a.organization_id = n.organization_id
              and a.note_id = n.id
              and not public.has_division_role(
                a.organization_id,
                a.division_id,
                array['coordinator']::public.org_role[]
              )
          )
        )
      )
  );
$$;

revoke all on function public.has_division_role(uuid, uuid, public.org_role[]) from public;
grant execute on function public.has_division_role(uuid, uuid, public.org_role[]) to authenticated;
revoke all on function public.can_view_profile(uuid) from public;
grant execute on function public.can_view_profile(uuid) to authenticated;
revoke all on function public.can_view_scoped_note(uuid) from public;
grant execute on function public.can_view_scoped_note(uuid) to authenticated;
revoke all on function public.can_manage_scoped_note(uuid) from public;
grant execute on function public.can_manage_scoped_note(uuid) to authenticated;

alter table public.profiles enable row level security;
drop policy if exists profiles_select_visible_members on public.profiles;
create policy profiles_select_visible_members
on public.profiles for select to authenticated
using (public.can_view_profile(id));
drop policy if exists profiles_update_self on public.profiles;
create policy profiles_update_self
on public.profiles for update to authenticated
using (id = auth.uid())
with check (id = auth.uid());

alter table public.notes enable row level security;
drop policy if exists notes_select_visible_scope on public.notes;
create policy notes_select_visible_scope
on public.notes for select to authenticated
using (public.can_view_scoped_note(id));

alter table public.note_audience_roles enable row level security;
drop policy if exists note_audience_roles_select_visible on public.note_audience_roles;
create policy note_audience_roles_select_visible
on public.note_audience_roles for select to authenticated
using (public.can_view_scoped_note(note_id));

alter table public.note_audience_divisions enable row level security;
drop policy if exists note_audience_divisions_select_visible on public.note_audience_divisions;
create policy note_audience_divisions_select_visible
on public.note_audience_divisions for select to authenticated
using (public.can_view_scoped_note(note_id));

drop policy if exists organization_members_select_member on public.organization_members;
create policy organization_members_select_member
on public.organization_members for select to authenticated
using (
  user_id = auth.uid()
  or public.has_org_role(organization_id, array['executive']::public.org_role[])
  or (
    division_id is not null
    and public.has_division_role(
      organization_id,
      division_id,
      array['coordinator', 'member']::public.org_role[]
    )
  )
);

drop policy if exists divisions_select_member on public.divisions;
create policy divisions_select_member
on public.divisions for select to authenticated
using (
  public.has_org_role(organization_id, array['executive']::public.org_role[])
  or public.has_division_role(
    organization_id,
    id,
    array['coordinator', 'member']::public.org_role[]
  )
);

drop policy if exists divisions_insert_manager on public.divisions;
create policy divisions_insert_manager
on public.divisions for insert to authenticated
with check (public.has_org_role(organization_id, array['executive']::public.org_role[]));

drop policy if exists divisions_update_manager on public.divisions;
create policy divisions_update_manager
on public.divisions for update to authenticated
using (public.has_org_role(organization_id, array['executive']::public.org_role[]))
with check (public.has_org_role(organization_id, array['executive']::public.org_role[]));

drop policy if exists divisions_delete_manager on public.divisions;
create policy divisions_delete_manager
on public.divisions for delete to authenticated
using (public.has_org_role(organization_id, array['executive']::public.org_role[]));

drop policy if exists events_select_member on public.events;
create policy events_select_member
on public.events for select to authenticated
using (
  public.has_org_role(organization_id, array['executive']::public.org_role[])
  or (
    division_id is null
    and public.is_org_member(organization_id)
  )
  or (
    division_id is not null
    and public.has_division_role(
      organization_id,
      division_id,
      array['coordinator', 'member']::public.org_role[]
    )
  )
);

drop policy if exists events_insert_member on public.events;
create policy events_insert_member
on public.events for insert to authenticated
with check (
  created_by = auth.uid()
  and (
    (
      division_id is null
      and public.has_org_role(organization_id, array['executive']::public.org_role[])
    )
    or (
      division_id is not null
      and (
        public.has_org_role(organization_id, array['executive']::public.org_role[])
        or public.has_division_role(
          organization_id,
          division_id,
          array['coordinator']::public.org_role[]
        )
      )
    )
  )
);

drop policy if exists events_update_manager on public.events;
create policy events_update_manager
on public.events for update to authenticated
using (
  public.has_org_role(organization_id, array['executive']::public.org_role[])
  or (
    division_id is not null
    and public.has_division_role(
      organization_id,
      division_id,
      array['coordinator']::public.org_role[]
    )
  )
)
with check (
  public.has_org_role(organization_id, array['executive']::public.org_role[])
  or (
    division_id is not null
    and public.has_division_role(
      organization_id,
      division_id,
      array['coordinator']::public.org_role[]
    )
  )
);

drop policy if exists events_delete_manager on public.events;
create policy events_delete_manager
on public.events for delete to authenticated
using (
  public.has_org_role(organization_id, array['executive']::public.org_role[])
  or (
    division_id is not null
    and public.has_division_role(
      organization_id,
      division_id,
      array['coordinator']::public.org_role[]
    )
  )
);

drop policy if exists rundowns_select_member on public.rundowns;
create policy rundowns_select_member
on public.rundowns for select to authenticated
using (
  public.has_org_role(organization_id, array['executive']::public.org_role[])
);

drop policy if exists rundowns_insert_member on public.rundowns;
create policy rundowns_insert_member
on public.rundowns for insert to authenticated
with check (
  created_by = auth.uid()
  and public.has_org_role(organization_id, array['executive']::public.org_role[])
);

drop policy if exists rundowns_update_manager on public.rundowns;
create policy rundowns_update_manager
on public.rundowns for update to authenticated
using (public.has_org_role(organization_id, array['executive']::public.org_role[]))
with check (public.has_org_role(organization_id, array['executive']::public.org_role[]));

drop policy if exists rundowns_delete_manager on public.rundowns;
create policy rundowns_delete_manager
on public.rundowns for delete to authenticated
using (public.has_org_role(organization_id, array['executive']::public.org_role[]));

drop policy if exists rundown_items_select_member on public.rundown_items;
create policy rundown_items_select_member
on public.rundown_items for select to authenticated
using (
  public.has_org_role(organization_id, array['executive']::public.org_role[])
);

drop policy if exists rundown_items_insert_manager on public.rundown_items;
create policy rundown_items_insert_manager
on public.rundown_items for insert to authenticated
with check (public.has_org_role(organization_id, array['executive']::public.org_role[]));

drop policy if exists rundown_items_update_manager on public.rundown_items;
create policy rundown_items_update_manager
on public.rundown_items for update to authenticated
using (public.has_org_role(organization_id, array['executive']::public.org_role[]))
with check (public.has_org_role(organization_id, array['executive']::public.org_role[]));

drop policy if exists rundown_items_delete_manager on public.rundown_items;
create policy rundown_items_delete_manager
on public.rundown_items for delete to authenticated
using (public.has_org_role(organization_id, array['executive']::public.org_role[]));

drop policy if exists transactions_select_finance_team on public.transactions;
create policy transactions_select_finance_team
on public.transactions for select to authenticated
using (
  submitted_by = auth.uid()
  or public.has_org_role(organization_id, array['executive']::public.org_role[])
);

drop policy if exists transactions_insert_member on public.transactions;
create policy transactions_insert_member
on public.transactions for insert to authenticated
with check (
  public.is_org_member(organization_id)
  and submitted_by = auth.uid()
  and (
    (
      type = 'expense'
      and status = 'pending'
      and reviewed_by is null
      and reviewed_at is null
    )
    or (
      type = 'income'
      and status = 'approved'
      and public.has_org_role(organization_id, array['executive']::public.org_role[])
    )
  )
);

drop policy if exists transactions_review_manager on public.transactions;
create policy transactions_review_manager
on public.transactions for update to authenticated
using (public.has_org_role(organization_id, array['executive']::public.org_role[]))
with check (
  public.has_org_role(organization_id, array['executive']::public.org_role[])
  and reviewed_by = auth.uid()
  and status in ('approved', 'rejected')
);

create or replace function public.notify_event_members()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.notifications (
    organization_id,
    user_id,
    notification_type,
    title,
    body,
    data
  )
  select
    new.organization_id,
    m.user_id,
    'event_created',
    'New event: ' || new.title,
    'A new event was added to your organization calendar.',
    jsonb_build_object('event_id', new.id)
  from public.organization_members m
  where m.organization_id = new.organization_id
    and m.status = 'active'
    and m.user_id <> coalesce(new.created_by, auth.uid())
    and (
      new.division_id is null
      or m.division_id = new.division_id
      or m.role = 'executive'
    );
  return new;
end;
$$;

create or replace function public.notify_transaction_activity()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' and new.type = 'expense' and new.status = 'pending' then
    insert into public.notifications (
      organization_id,
      user_id,
      notification_type,
      title,
      body,
      data
    )
    select
      new.organization_id,
      m.user_id,
      'expense_review',
      'Expense needs review',
      new.source_or_category || ' was submitted for review.',
      jsonb_build_object('transaction_id', new.id)
    from public.organization_members m
    where m.organization_id = new.organization_id
      and m.status = 'active'
      and m.role = 'executive'
      and m.user_id <> coalesce(new.submitted_by, auth.uid());
  elsif tg_op = 'UPDATE' and old.status is distinct from new.status
    and new.status in ('approved', 'rejected')
    and new.submitted_by is not null
    and new.submitted_by <> coalesce(new.reviewed_by, auth.uid()) then
    insert into public.notifications (
      organization_id,
      user_id,
      notification_type,
      title,
      body,
      data
    )
    values (
      new.organization_id,
      new.submitted_by,
      'expense_reviewed',
      'Expense ' || new.status::text,
      new.source_or_category || ' was ' || new.status::text || '.',
      jsonb_build_object('transaction_id', new.id)
    );
  end if;
  return new;
end;
$$;

drop policy if exists notes_insert_member on public.notes;
create policy notes_insert_member
on public.notes for insert to authenticated
with check (
  author_id = auth.uid()
  and (
    public.has_org_role(organization_id, array['executive']::public.org_role[])
    or (
      public.is_org_member(organization_id)
      and not share_with_all_members
    )
  )
);

drop policy if exists notes_update_author on public.notes;
create policy notes_update_author
on public.notes for update to authenticated
using (public.can_manage_scoped_note(id))
with check (public.can_manage_scoped_note(id));

create or replace function public.prevent_scoped_note_scope_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.has_org_role(old.organization_id, array['executive']::public.org_role[])
    and (
      new.organization_id is distinct from old.organization_id
      or new.author_id is distinct from old.author_id
      or new.share_with_all_members is distinct from old.share_with_all_members
    ) then
    raise exception 'Only executives can change note ownership or organization-wide scope.';
  end if;
  return new;
end;
$$;

create trigger notes_prevent_scoped_change
before update on public.notes
for each row execute function public.prevent_scoped_note_scope_change();

drop policy if exists notes_delete_author on public.notes;
create policy notes_delete_author
on public.notes for delete to authenticated
using (
  public.can_manage_scoped_note(id)
);

drop policy if exists note_audience_roles_insert on public.note_audience_roles;
create policy note_audience_roles_insert
on public.note_audience_roles for insert to authenticated
with check (
  public.has_org_role(organization_id, array['executive']::public.org_role[])
);

drop policy if exists note_audience_roles_delete on public.note_audience_roles;
create policy note_audience_roles_delete
on public.note_audience_roles for delete to authenticated
using (
  public.has_org_role(organization_id, array['executive']::public.org_role[])
);

drop policy if exists note_audience_divisions_insert on public.note_audience_divisions;
create policy note_audience_divisions_insert
on public.note_audience_divisions for insert to authenticated
with check (
  public.has_org_role(organization_id, array['executive']::public.org_role[])
  or (
    public.has_division_role(
      organization_id,
      division_id,
      array['coordinator', 'member']::public.org_role[]
    )
    and exists (
      select 1
      from public.notes n
      where n.id = note_id
        and n.author_id = auth.uid()
        and not n.share_with_all_members
        and not exists (
          select 1
          from public.note_audience_roles a
          where a.organization_id = n.organization_id
            and a.note_id = n.id
        )
    )
  )
);

drop policy if exists note_audience_divisions_delete on public.note_audience_divisions;
create policy note_audience_divisions_delete
on public.note_audience_divisions for delete to authenticated
using (
  public.has_org_role(organization_id, array['executive']::public.org_role[])
  or public.can_manage_scoped_note(note_id)
);

create policy tasks_select_executive_or_division_coordinator
on public.tasks for select to authenticated
using (
  public.has_org_role(organization_id, array['executive']::public.org_role[])
  or public.has_division_role(
    organization_id,
    division_id,
    array['coordinator']::public.org_role[]
  )
  or (
    assignee_user_id = auth.uid()
    and public.has_division_role(
      organization_id,
      division_id,
      array['member']::public.org_role[]
    )
  )
);

create policy tasks_insert_executive_or_division_coordinator
on public.tasks for insert to authenticated
with check (
  created_by = auth.uid()
  and (
    public.has_org_role(organization_id, array['executive']::public.org_role[])
    or public.has_division_role(
      organization_id,
      division_id,
      array['coordinator']::public.org_role[]
    )
  )
);

create policy tasks_update_executive_or_division_coordinator
on public.tasks for update to authenticated
using (
  public.has_org_role(organization_id, array['executive']::public.org_role[])
  or public.has_division_role(
    organization_id,
    division_id,
    array['coordinator']::public.org_role[]
  )
  or (
    assignee_user_id = auth.uid()
    and public.has_division_role(
      organization_id,
      division_id,
      array['member']::public.org_role[]
    )
  )
)
with check (
  public.has_org_role(organization_id, array['executive']::public.org_role[])
  or public.has_division_role(
    organization_id,
    division_id,
    array['coordinator']::public.org_role[]
  )
  or (
    assignee_user_id = auth.uid()
    and public.has_division_role(
      organization_id,
      division_id,
      array['member']::public.org_role[]
    )
  )
);

create policy tasks_delete_executive_or_division_coordinator
on public.tasks for delete to authenticated
using (
  public.has_org_role(organization_id, array['executive']::public.org_role[])
  or public.has_division_role(
    organization_id,
    division_id,
    array['coordinator']::public.org_role[]
  )
);

create or replace function public.validate_task_assignee()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'UPDATE'
    and old.assignee_user_id = auth.uid()
    and public.has_division_role(
      old.organization_id,
      old.division_id,
      array['member']::public.org_role[]
    )
    and (
      new.id is distinct from old.id
      or new.organization_id is distinct from old.organization_id
      or new.division_id is distinct from old.division_id
      or new.title is distinct from old.title
      or new.description is distinct from old.description
      or new.instructions is distinct from old.instructions
      or new.due_at is distinct from old.due_at
      or new.priority is distinct from old.priority
      or new.assignee_user_id is distinct from old.assignee_user_id
      or new.created_by is distinct from old.created_by
      or new.created_at is distinct from old.created_at
    ) then
    raise exception 'Members may update only the status and progress of their assigned tasks.';
  end if;

  if new.assignee_user_id is not null and not exists (
    select 1
    from public.organization_members m
    where m.organization_id = new.organization_id
      and m.division_id = new.division_id
      and m.user_id = new.assignee_user_id
      and m.role = 'member'
      and m.status = 'active'
  ) then
    raise exception 'Tasks can only be assigned to active members of the same division.';
  end if;
  new.updated_at := now();
  return new;
end;
$$;

create trigger tasks_validate_assignee
before insert or update on public.tasks
for each row execute function public.validate_task_assignee();

grant usage on type public.task_priority, public.task_status to authenticated;
grant select, insert, update, delete on public.tasks to authenticated;
