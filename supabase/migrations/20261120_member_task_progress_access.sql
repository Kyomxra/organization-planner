drop policy if exists tasks_update_executive_or_division_coordinator
on public.tasks;

create policy tasks_update_executive_or_division_coordinator
on public.tasks
for update
to authenticated
using (
  public.has_org_role(
    organization_id,
    array['executive']::public.org_role[]
  )
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
  public.has_org_role(
    organization_id,
    array['executive']::public.org_role[]
  )
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
