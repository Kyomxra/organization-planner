-- Organization Planner: initial Supabase schema.
-- Paste this whole file into Supabase SQL Editor and run it once.

create type public.org_role as enum ('executive', 'coordinator', 'member');
create type public.member_status as enum ('active', 'inactive');
create type public.transaction_type as enum ('income', 'expense');
create type public.transaction_status as enum ('pending', 'approved', 'rejected');

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null default '',
  email text,
  avatar_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text not null default '',
  logo_path text,
  created_by uuid not null references public.profiles (id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz
);

create table public.divisions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  name text not null,
  color text,
  background_color text,
  created_at timestamptz not null default now(),
  unique (organization_id, id),
  unique (organization_id, name)
);

create table public.organization_members (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  division_id uuid,
  role public.org_role not null default 'member',
  status public.member_status not null default 'active',
  joined_at timestamptz not null default now(),
  unique (organization_id, user_id),
  foreign key (organization_id, division_id)
    references public.divisions (organization_id, id) on delete restrict
);

create table public.events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  division_id uuid,
  title text not null,
  category text not null default 'organization meeting',
  description text not null default '',
  notes text not null default '',
  start_at timestamptz not null,
  end_at timestamptz not null,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint events_end_after_start check (end_at > start_at),
  unique (organization_id, id),
  foreign key (organization_id, division_id)
    references public.divisions (organization_id, id) on delete restrict
);

create table public.rundowns (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  event_id uuid,
  title text not null,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, id),
  foreign key (organization_id, event_id)
    references public.events (organization_id, id) on delete restrict
);

create table public.rundown_items (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  rundown_id uuid not null,
  sort_order integer not null check (sort_order > 0),
  title text not null,
  start_time time,
  duration_minutes integer not null default 0 check (duration_minutes >= 0),
  description text not null default '',
  assignee_user_id uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  unique (rundown_id, sort_order),
  foreign key (organization_id, rundown_id)
    references public.rundowns (organization_id, id) on delete cascade
);

create table public.notes (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  author_id uuid not null references public.profiles (id) on delete restrict,
  title text not null,
  content text not null default '',
  share_with_all_members boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, id)
);

create table public.note_audience_roles (
  organization_id uuid not null,
  note_id uuid not null,
  role public.org_role not null,
  primary key (note_id, role),
  foreign key (organization_id, note_id)
    references public.notes (organization_id, id) on delete cascade
);

create table public.note_audience_divisions (
  organization_id uuid not null,
  note_id uuid not null,
  division_id uuid not null,
  primary key (note_id, division_id),
  foreign key (organization_id, note_id)
    references public.notes (organization_id, id) on delete cascade,
  foreign key (organization_id, division_id)
    references public.divisions (organization_id, id) on delete cascade
);

create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  type public.transaction_type not null,
  amount bigint not null check (amount > 0),
  occurred_on date not null default current_date,
  source_or_category text not null,
  description text not null default '',
  status public.transaction_status not null,
  receipt_path text,
  submitted_by uuid references public.profiles (id) on delete set null,
  reviewed_by uuid references public.profiles (id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.organization_invites (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  code_hash text not null unique,
  role_to_grant public.org_role not null default 'member',
  expires_at timestamptz,
  max_redemptions integer not null default 1 check (max_redemptions > 0),
  redeemed_count integer not null default 0 check (redeemed_count >= 0),
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  revoked_at timestamptz
);

create index organization_members_user_idx
  on public.organization_members (user_id, status);
create index divisions_organization_idx
  on public.divisions (organization_id);
create index events_organization_start_idx
  on public.events (organization_id, start_at);
create index rundowns_organization_idx
  on public.rundowns (organization_id);
create index rundown_items_rundown_order_idx
  on public.rundown_items (rundown_id, sort_order);
create index rundown_items_organization_idx
  on public.rundown_items (organization_id);
create index notes_organization_created_idx
  on public.notes (organization_id, created_at desc);
create index note_audience_roles_lookup_idx
  on public.note_audience_roles (organization_id, role, note_id);
create index note_audience_divisions_lookup_idx
  on public.note_audience_divisions (organization_id, division_id, note_id);
create index transactions_organization_date_idx
  on public.transactions (organization_id, occurred_on desc);
create index transactions_organization_status_idx
  on public.transactions (organization_id, status);
create index organization_invites_organization_idx
  on public.organization_invites (organization_id);

create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create trigger organizations_set_updated_at
before update on public.organizations
for each row execute function public.set_updated_at();

create trigger events_set_updated_at
before update on public.events
for each row execute function public.set_updated_at();

create trigger rundowns_set_updated_at
before update on public.rundowns
for each row execute function public.set_updated_at();

create trigger notes_set_updated_at
before update on public.notes
for each row execute function public.set_updated_at();

create trigger transactions_set_updated_at
before update on public.transactions
for each row execute function public.set_updated_at();

create function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, email)
  values (
    new.id,
    coalesce(
      nullif(new.raw_user_meta_data ->> 'full_name', ''),
      nullif(split_part(coalesce(new.email, ''), '@', 1), ''),
      'User'
    ),
    new.email
  )
  on conflict (id) do update
  set email = excluded.email;
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_auth_user();

create trigger on_auth_user_email_updated
after update of email on auth.users
for each row execute function public.handle_new_auth_user();

create function public.add_organization_creator_as_executive()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.organization_members (organization_id, user_id, role)
  values (new.id, new.created_by, 'executive');
  return new;
end;
$$;

create trigger on_organization_created
after insert on public.organizations
for each row execute function public.add_organization_creator_as_executive();

create function public.is_org_member(p_organization_id uuid)
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
      and m.user_id = auth.uid()
      and m.status = 'active'
  );
$$;

create function public.has_org_role(
  p_organization_id uuid,
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
      and m.user_id = auth.uid()
      and m.status = 'active'
      and m.role = any (p_roles)
  );
$$;

create function public.can_view_profile(p_user_id uuid)
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
    );
$$;

create function public.can_view_note(p_note_id uuid)
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
            on m.organization_id = a.organization_id
           and m.role = a.role
          where a.note_id = n.id
            and m.user_id = auth.uid()
            and m.status = 'active'
        )
        or exists (
          select 1
          from public.note_audience_divisions a
          join public.organization_members m
            on m.organization_id = a.organization_id
           and m.division_id = a.division_id
          where a.note_id = n.id
            and m.user_id = auth.uid()
            and m.status = 'active'
        )
      )
  );
$$;

create function public.can_manage_note(p_note_id uuid)
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
        or public.has_org_role(
          n.organization_id,
          array['executive']::public.org_role[]
        )
      )
  );
$$;

revoke all on function public.is_org_member(uuid) from public;
revoke all on function public.has_org_role(uuid, public.org_role[]) from public;
revoke all on function public.can_view_profile(uuid) from public;
revoke all on function public.can_view_note(uuid) from public;
revoke all on function public.can_manage_note(uuid) from public;
grant execute on function public.is_org_member(uuid) to authenticated;
grant execute on function public.has_org_role(uuid, public.org_role[]) to authenticated;
grant execute on function public.can_view_profile(uuid) to authenticated;
grant execute on function public.can_view_note(uuid) to authenticated;
grant execute on function public.can_manage_note(uuid) to authenticated;

alter table public.profiles enable row level security;
alter table public.organizations enable row level security;
alter table public.organization_members enable row level security;
alter table public.divisions enable row level security;
alter table public.events enable row level security;
alter table public.rundowns enable row level security;
alter table public.rundown_items enable row level security;
alter table public.notes enable row level security;
alter table public.note_audience_roles enable row level security;
alter table public.note_audience_divisions enable row level security;
alter table public.transactions enable row level security;
alter table public.organization_invites enable row level security;

create policy profiles_select_visible
on public.profiles for select to authenticated
using (public.can_view_profile(id));

create policy profiles_update_self
on public.profiles for update to authenticated
using (id = auth.uid())
with check (id = auth.uid());

create policy organizations_select_member
on public.organizations for select to authenticated
using (public.is_org_member(id));

create policy organizations_insert_creator
on public.organizations for insert to authenticated
with check (created_by = auth.uid());

create policy organizations_update_executive
on public.organizations for update to authenticated
using (
  public.has_org_role(id, array['executive']::public.org_role[])
)
with check (
  public.has_org_role(id, array['executive']::public.org_role[])
);

create policy organization_members_select_member
on public.organization_members for select to authenticated
using (public.is_org_member(organization_id));

create policy organization_members_update_executive
on public.organization_members for update to authenticated
using (
  public.has_org_role(organization_id, array['executive']::public.org_role[])
)
with check (
  public.has_org_role(organization_id, array['executive']::public.org_role[])
);

create policy divisions_select_member
on public.divisions for select to authenticated
using (public.is_org_member(organization_id));

create policy divisions_insert_manager
on public.divisions for insert to authenticated
with check (
  public.has_org_role(
    organization_id,
    array['executive', 'coordinator']::public.org_role[]
  )
);

create policy divisions_update_manager
on public.divisions for update to authenticated
using (
  public.has_org_role(
    organization_id,
    array['executive', 'coordinator']::public.org_role[]
  )
)
with check (
  public.has_org_role(
    organization_id,
    array['executive', 'coordinator']::public.org_role[]
  )
);

create policy divisions_delete_manager
on public.divisions for delete to authenticated
using (
  public.has_org_role(
    organization_id,
    array['executive', 'coordinator']::public.org_role[]
  )
);

create policy events_select_member
on public.events for select to authenticated
using (public.is_org_member(organization_id));

create policy events_insert_member
on public.events for insert to authenticated
with check (
  public.is_org_member(organization_id)
  and created_by = auth.uid()
);

create policy events_update_manager
on public.events for update to authenticated
using (
  public.has_org_role(
    organization_id,
    array['executive', 'coordinator']::public.org_role[]
  )
)
with check (
  public.has_org_role(
    organization_id,
    array['executive', 'coordinator']::public.org_role[]
  )
);

create policy events_delete_manager
on public.events for delete to authenticated
using (
  public.has_org_role(
    organization_id,
    array['executive', 'coordinator']::public.org_role[]
  )
);

create policy rundowns_select_member
on public.rundowns for select to authenticated
using (public.is_org_member(organization_id));

create policy rundowns_insert_member
on public.rundowns for insert to authenticated
with check (
  public.is_org_member(organization_id)
  and created_by = auth.uid()
);

create policy rundowns_update_manager
on public.rundowns for update to authenticated
using (
  public.has_org_role(
    organization_id,
    array['executive', 'coordinator']::public.org_role[]
  )
)
with check (
  public.has_org_role(
    organization_id,
    array['executive', 'coordinator']::public.org_role[]
  )
);

create policy rundowns_delete_manager
on public.rundowns for delete to authenticated
using (
  public.has_org_role(
    organization_id,
    array['executive', 'coordinator']::public.org_role[]
  )
);

create policy rundown_items_select_member
on public.rundown_items for select to authenticated
using (public.is_org_member(organization_id));

create policy rundown_items_insert_manager
on public.rundown_items for insert to authenticated
with check (
  public.has_org_role(
    organization_id,
    array['executive', 'coordinator']::public.org_role[]
  )
);

create policy rundown_items_update_manager
on public.rundown_items for update to authenticated
using (
  public.has_org_role(
    organization_id,
    array['executive', 'coordinator']::public.org_role[]
  )
)
with check (
  public.has_org_role(
    organization_id,
    array['executive', 'coordinator']::public.org_role[]
  )
);

create policy rundown_items_delete_manager
on public.rundown_items for delete to authenticated
using (
  public.has_org_role(
    organization_id,
    array['executive', 'coordinator']::public.org_role[]
  )
);

create policy notes_select_audience
on public.notes for select to authenticated
using (public.can_view_note(id));

create policy notes_insert_member
on public.notes for insert to authenticated
with check (
  public.is_org_member(organization_id)
  and author_id = auth.uid()
);

create policy notes_update_author
on public.notes for update to authenticated
using (author_id = auth.uid())
with check (
  author_id = auth.uid()
  and public.is_org_member(organization_id)
);

create policy notes_delete_author
on public.notes for delete to authenticated
using (author_id = auth.uid());

create policy note_audience_roles_select
on public.note_audience_roles for select to authenticated
using (public.can_view_note(note_id));

create policy note_audience_roles_insert
on public.note_audience_roles for insert to authenticated
with check (public.can_manage_note(note_id));

create policy note_audience_roles_delete
on public.note_audience_roles for delete to authenticated
using (public.can_manage_note(note_id));

create policy note_audience_divisions_select
on public.note_audience_divisions for select to authenticated
using (public.can_view_note(note_id));

create policy note_audience_divisions_insert
on public.note_audience_divisions for insert to authenticated
with check (public.can_manage_note(note_id));

create policy note_audience_divisions_delete
on public.note_audience_divisions for delete to authenticated
using (public.can_manage_note(note_id));

create policy transactions_select_finance_team
on public.transactions for select to authenticated
using (
  (
    submitted_by = auth.uid()
    and public.is_org_member(organization_id)
  )
  or public.has_org_role(
    organization_id,
    array['executive', 'coordinator']::public.org_role[]
  )
);

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
      and reviewed_by is null
      and reviewed_at is null
      and public.has_org_role(
        organization_id,
        array['executive', 'coordinator']::public.org_role[]
      )
    )
  )
);

create policy transactions_review_manager
on public.transactions for update to authenticated
using (
  public.has_org_role(
    organization_id,
    array['executive', 'coordinator']::public.org_role[]
  )
)
with check (
  public.has_org_role(
    organization_id,
    array['executive', 'coordinator']::public.org_role[]
  )
  and reviewed_by = auth.uid()
  and status in ('approved', 'rejected')
);

create policy transactions_delete_executive
on public.transactions for delete to authenticated
using (
  public.has_org_role(organization_id, array['executive']::public.org_role[])
);

create policy organization_invites_select_executive
on public.organization_invites for select to authenticated
using (
  public.has_org_role(organization_id, array['executive']::public.org_role[])
);

create policy organization_invites_insert_executive
on public.organization_invites for insert to authenticated
with check (
  public.has_org_role(organization_id, array['executive']::public.org_role[])
  and created_by = auth.uid()
);

create policy organization_invites_update_executive
on public.organization_invites for update to authenticated
using (
  public.has_org_role(organization_id, array['executive']::public.org_role[])
)
with check (
  public.has_org_role(organization_id, array['executive']::public.org_role[])
);

grant usage on schema public to authenticated;
grant usage on type public.org_role to authenticated;
grant usage on type public.member_status to authenticated;
grant usage on type public.transaction_type to authenticated;
grant usage on type public.transaction_status to authenticated;

grant select, insert, update, delete on
  public.profiles,
  public.organizations,
  public.organization_members,
  public.divisions,
  public.events,
  public.rundowns,
  public.rundown_items,
  public.notes,
  public.note_audience_roles,
  public.note_audience_divisions,
  public.transactions,
  public.organization_invites
to authenticated;
