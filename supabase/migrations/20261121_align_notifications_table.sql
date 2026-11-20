do $$
begin
  -- Hanya relevan kalau kolom user_id belum ada (kondisi lama).
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'notifications' and column_name = 'user_id'
  ) and exists (select 1 from public.notifications) then
    raise exception 'public.notifications sudah berisi data lama tanpa user_id; hentikan dan cek manual.';
  end if;
end;
$$;

-- 1) Kolom yang kurang. Tabel kosong, jadi aman dibuat NOT NULL setelah ditambahkan.
alter table public.notifications
  add column if not exists user_id uuid references public.profiles (id) on delete cascade,
  add column if not exists notification_type text,
  add column if not exists data jsonb not null default '{}'::jsonb;

alter table public.notifications
  alter column user_id set not null,
  alter column notification_type set not null,
  alter column body set default '';

create index if not exists notifications_user_created_idx
  on public.notifications (user_id, created_at desc);

-- 2) Aturan akses: tiap orang hanya melihat dan menandai-dibaca notifikasinya sendiri.
alter table public.notifications enable row level security;

drop policy if exists notifications_select_member on public.notifications;
drop policy if exists notifications_update_member on public.notifications;

drop policy if exists notifications_select_self on public.notifications;
create policy notifications_select_self
on public.notifications for select to authenticated
using (user_id = auth.uid());

drop policy if exists notifications_update_read_self on public.notifications;
create policy notifications_update_read_self
on public.notifications for update to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

-- 3) Hak akses tabel: baca semua kolom, ubah hanya read_at. INSERT hanya lewat trigger.
revoke all on public.notifications from anon, authenticated;
grant select on public.notifications to authenticated;
grant update (read_at) on public.notifications to authenticated;