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
        public.has_org_role(n.organization_id, array['executive', 'coordinator']::public.org_role[])
        or (
          public.has_org_role(n.organization_id, array['member']::public.org_role[])
          and n.author_id = auth.uid()
          and not n.share_with_all_members
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
          public.has_org_role(n.organization_id, array['coordinator']::public.org_role[])
          and not n.share_with_all_members
          and not exists (
            select 1
            from public.note_audience_roles a
            where a.organization_id = n.organization_id
              and a.note_id = n.id
          )
          and (
            (
              n.author_id = auth.uid()
              and not exists (
                select 1
                from public.note_audience_divisions a
                where a.organization_id = n.organization_id
                  and a.note_id = n.id
                  and not public.has_division_role(
                    n.organization_id,
                    a.division_id,
                    array['coordinator']::public.org_role[]
                  )
              )
            )
            or (
              exists (
                select 1
                from public.note_audience_divisions a
                where a.organization_id = n.organization_id
                  and a.note_id = n.id
                  and public.has_division_role(
                    n.organization_id,
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
                    n.organization_id,
                    a.division_id,
                    array['coordinator']::public.org_role[]
                  )
              )
            )
          )
        )
      )
  );
$$;

revoke all on function public.can_view_profile(uuid) from public;
grant execute on function public.can_view_profile(uuid) to authenticated;
revoke all on function public.can_view_scoped_note(uuid) from public;
grant execute on function public.can_view_scoped_note(uuid) to authenticated;
revoke all on function public.can_manage_scoped_note(uuid) from public;
grant execute on function public.can_manage_scoped_note(uuid) to authenticated;

drop policy if exists profiles_select_visible_members on public.profiles;
create policy profiles_select_visible_members
on public.profiles for select to authenticated
using (public.can_view_profile(id));

drop policy if exists organization_members_select_member on public.organization_members;
create policy organization_members_select_member
on public.organization_members for select to authenticated
using (
  user_id = auth.uid()
  or public.is_org_member(organization_id)
);

drop policy if exists divisions_select_member on public.divisions;
create policy divisions_select_member
on public.divisions for select to authenticated
using (public.is_org_member(organization_id));

drop policy if exists events_select_member on public.events;
create policy events_select_member
on public.events for select to authenticated
using (public.is_org_member(organization_id));

drop policy if exists notes_select_visible_scope on public.notes;
create policy notes_select_visible_scope
on public.notes for select to authenticated
using (public.can_view_scoped_note(id));

drop policy if exists notes_insert_member on public.notes;
create policy notes_insert_member
on public.notes for insert to authenticated
with check (
  author_id = auth.uid()
  and (
    public.has_org_role(organization_id, array['executive']::public.org_role[])
    or (
      public.has_org_role(organization_id, array['coordinator']::public.org_role[])
      and not share_with_all_members
    )
  )
);

drop policy if exists notes_update_author on public.notes;
create policy notes_update_author
on public.notes for update to authenticated
using (public.can_manage_scoped_note(id))
with check (public.can_manage_scoped_note(id));

drop policy if exists notes_delete_author on public.notes;
create policy notes_delete_author
on public.notes for delete to authenticated
using (public.can_manage_scoped_note(id));

drop policy if exists note_audience_roles_select_visible on public.note_audience_roles;
create policy note_audience_roles_select_visible
on public.note_audience_roles for select to authenticated
using (public.can_view_scoped_note(note_id));

drop policy if exists note_audience_divisions_select_visible on public.note_audience_divisions;
create policy note_audience_divisions_select_visible
on public.note_audience_divisions for select to authenticated
using (public.can_view_scoped_note(note_id));

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
      array['coordinator']::public.org_role[]
    )
    and exists (
      select 1
      from public.notes n
      where n.id = note_id
        and n.organization_id = public.note_audience_divisions.organization_id
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

drop policy if exists tasks_select_executive_or_division_coordinator on public.tasks;
create policy tasks_select_executive_or_division_coordinator
on public.tasks for select to authenticated
using (public.is_org_member(organization_id));

drop policy if exists tasks_insert_executive_or_division_coordinator on public.tasks;
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

drop policy if exists tasks_update_executive_or_division_coordinator on public.tasks;
create policy tasks_update_executive_or_division_coordinator
on public.tasks for update to authenticated
using (
  public.has_org_role(organization_id, array['executive']::public.org_role[])
  or public.has_division_role(
    organization_id,
    division_id,
    array['coordinator']::public.org_role[]
  )
)
with check (
  public.has_org_role(organization_id, array['executive']::public.org_role[])
  or public.has_division_role(
    organization_id,
    division_id,
    array['coordinator']::public.org_role[]
  )
);

drop policy if exists tasks_delete_executive_or_division_coordinator on public.tasks;
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

drop policy if exists transactions_select_finance_team on public.transactions;
create policy transactions_select_finance_team
on public.transactions for select to authenticated
using (public.is_org_member(organization_id));

drop policy if exists transactions_insert_member on public.transactions;
create policy transactions_insert_member
on public.transactions for insert to authenticated
with check (
  submitted_by = auth.uid()
  and (
    (
      type = 'expense'
      and status = 'pending'
      and reviewed_by is null
      and reviewed_at is null
      and (
        public.has_org_role(organization_id, array['executive']::public.org_role[])
        or public.has_org_role(organization_id, array['coordinator']::public.org_role[])
      )
    )
    or (
      type = 'income'
      and status = 'approved'
      and public.has_org_role(organization_id, array['executive']::public.org_role[])
    )
  )
);

drop policy if exists rundowns_select_member on public.rundowns;
create policy rundowns_select_member
on public.rundowns for select to authenticated
using (public.is_org_member(organization_id));

drop policy if exists rundowns_insert_member on public.rundowns;
create policy rundowns_insert_member
on public.rundowns for insert to authenticated
with check (
  created_by = auth.uid()
  and (
    public.has_org_role(organization_id, array['executive']::public.org_role[])
    or public.has_org_role(organization_id, array['coordinator']::public.org_role[])
  )
);

drop policy if exists rundown_items_select_member on public.rundown_items;
create policy rundown_items_select_member
on public.rundown_items for select to authenticated
using (public.is_org_member(organization_id));

drop policy if exists rundown_items_insert_manager on public.rundown_items;
create policy rundown_items_insert_manager
on public.rundown_items for insert to authenticated
with check (
  public.has_org_role(organization_id, array['executive']::public.org_role[])
  or (
    public.has_org_role(organization_id, array['coordinator']::public.org_role[])
    and exists (
      select 1
      from public.rundowns r
      where r.id = rundown_id
        and r.organization_id = public.rundown_items.organization_id
        and r.created_by = auth.uid()
    )
  )
);
