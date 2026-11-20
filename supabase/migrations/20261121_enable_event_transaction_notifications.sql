create or replace function public.notify_event_members()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.notifications (
    organization_id, user_id, notification_type, title, body, data
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
      organization_id, user_id, notification_type, title, body, data
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
      organization_id, user_id, notification_type, title, body, data
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