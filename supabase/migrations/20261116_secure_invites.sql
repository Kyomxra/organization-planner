create extension if not exists pgcrypto with schema extensions;

create or replace function public.create_organization_invites(p_organization_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_role public.org_role;
  invite_code text;
  result jsonb := '{}'::jsonb;
begin
  if auth.uid() is null or not public.has_org_role(
    p_organization_id,
    array['executive']::public.org_role[]
  ) then
    raise exception 'Only an organization executive can create invite codes.';
  end if;

  foreach target_role in array array[
    'executive'::public.org_role,
    'coordinator'::public.org_role,
    'member'::public.org_role
  ]
  loop
    invite_code := 'ORG-' || upper(replace(gen_random_uuid()::text, '-', ''));
    insert into public.organization_invites (
      organization_id,
      code_hash,
      role_to_grant,
      expires_at,
      max_redemptions,
      created_by
    )
    values (
      p_organization_id,
      encode(extensions.digest(convert_to(invite_code, 'UTF8'), 'sha256'), 'hex'),
      target_role,
      now() + interval '30 days',
      25,
      auth.uid()
    );
    result := result || jsonb_build_object(target_role::text, invite_code);
  end loop;

  return result;
end;
$$;

create or replace function public.redeem_organization_invite(p_code text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  invite_record public.organization_invites%rowtype;
begin
  if auth.uid() is null or nullif(btrim(p_code), '') is null then
    raise exception 'Sign in and provide an invite code.';
  end if;

  update public.organization_invites
  set redeemed_count = redeemed_count + 1
  where code_hash = encode(
      extensions.digest(convert_to(upper(btrim(p_code)), 'UTF8'), 'sha256'),
      'hex'
    )
    and revoked_at is null
    and (expires_at is null or expires_at > now())
    and redeemed_count < max_redemptions
  returning * into invite_record;

  if not found then
    raise exception 'This invite code is invalid, expired, revoked, or fully redeemed.';
  end if;

  if exists (
    select 1
    from public.organization_members m
    where m.organization_id = invite_record.organization_id
      and m.user_id = auth.uid()
      and m.status = 'active'
  ) then
    update public.organization_invites
    set redeemed_count = redeemed_count - 1
    where id = invite_record.id;
    raise exception 'You are already an active member of this organization.';
  end if;

  insert into public.organization_members (organization_id, user_id, role, status)
  values (invite_record.organization_id, auth.uid(), invite_record.role_to_grant, 'active')
  on conflict (organization_id, user_id) do update
  set role = excluded.role,
      status = 'active',
      joined_at = now();

  return invite_record.organization_id;
end;
$$;

revoke all on function public.create_organization_invites(uuid) from public, anon;
revoke all on function public.redeem_organization_invite(text) from public, anon;
grant execute on function public.create_organization_invites(uuid) to authenticated;
grant execute on function public.redeem_organization_invite(text) to authenticated;

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  notification_type text not null,
  title text not null,
  body text not null default '',
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  read_at timestamptz
);

create index if not exists notifications_user_created_idx
  on public.notifications (user_id, created_at desc);

alter table public.notifications enable row level security;

drop policy if exists notifications_select_self on public.notifications;
create policy notifications_select_self
on public.notifications for select to authenticated
using (user_id = auth.uid());

drop policy if exists notifications_update_read_self on public.notifications;
create policy notifications_update_read_self
on public.notifications for update to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

revoke all on public.notifications from anon, authenticated;
grant select on public.notifications to authenticated;
grant update (read_at) on public.notifications to authenticated;

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
    and m.user_id <> coalesce(new.created_by, auth.uid());
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
      and m.role in ('executive', 'coordinator')
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

drop trigger if exists notifications_after_event_insert on public.events;
create trigger notifications_after_event_insert
after insert on public.events
for each row execute function public.notify_event_members();

drop trigger if exists notifications_after_transaction_insert on public.transactions;
create trigger notifications_after_transaction_insert
after insert on public.transactions
for each row execute function public.notify_transaction_activity();

drop trigger if exists notifications_after_transaction_review on public.transactions;
create trigger notifications_after_transaction_review
after update of status on public.transactions
for each row execute function public.notify_transaction_activity();
