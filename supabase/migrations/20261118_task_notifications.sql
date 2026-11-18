-- Task notifications
-- Membuat notifikasi otomatis (tabel public.notifications) untuk aktivitas tugas:
--   1. Tugas baru diberikan ke seorang member      -> notifikasi ke member tsb   (task_assigned)
--   2. Tugas dipindah ke member lain               -> notifikasi ke member baru  (task_assigned)
--   3. Judul / deadline / prioritas tugas berubah  -> notifikasi ke assignee     (task_updated)
--   4. Status tugas berubah (pending/ongoing/done) -> notifikasi ke pembuat tugas
--                                                     dan coordinator divisinya (task_status_changed)
-- Orang yang melakukan aksi (auth.uid()) tidak dinotifikasi sendiri.
-- Aman dijalankan ulang (create or replace + drop trigger if exists).

create or replace function public.notify_task_activity()
returns trigger
language plpgsql
security definer          -- jalan dengan hak pemilik fungsi, supaya boleh INSERT ke notifications
set search_path = ''      -- wajib untuk security definer: semua nama tabel ditulis lengkap (public.xxx)
as $$
declare
  v_actor uuid := auth.uid();   -- user yang sedang membuat/mengubah tugas
begin
  -- ===== Tugas baru (INSERT) =====
  if tg_op = 'INSERT' then
    if new.assignee_user_id is not null
       and new.assignee_user_id is distinct from v_actor then
      insert into public.notifications (
        organization_id, user_id, notification_type, title, body, data
      )
      values (
        new.organization_id,
        new.assignee_user_id,
        'task_assigned',
        'New task: ' || new.title,
        'A task was assigned to you.',
        jsonb_build_object('task_id', new.id)
      );
    end if;
    return new;
  end if;

  -- ===== Tugas diubah (UPDATE) =====

  -- Assignee berganti -> kabari assignee yang baru
  if new.assignee_user_id is not null
     and new.assignee_user_id is distinct from old.assignee_user_id
     and new.assignee_user_id is distinct from v_actor then
    insert into public.notifications (
      organization_id, user_id, notification_type, title, body, data
    )
    values (
      new.organization_id,
      new.assignee_user_id,
      'task_assigned',
      'New task: ' || new.title,
      'A task was assigned to you.',
      jsonb_build_object('task_id', new.id)
    );

  -- Assignee tetap, tapi detail penting berubah -> kabari assignee
  elsif new.assignee_user_id is not null
        and new.assignee_user_id is not distinct from old.assignee_user_id
        and new.assignee_user_id is distinct from v_actor
        and (
          new.title is distinct from old.title
          or new.due_at is distinct from old.due_at
          or new.priority is distinct from old.priority
        ) then
    insert into public.notifications (
      organization_id, user_id, notification_type, title, body, data
    )
    values (
      new.organization_id,
      new.assignee_user_id,
      'task_updated',
      'Task updated: ' || new.title,
      'The details of a task assigned to you were changed.',
      jsonb_build_object('task_id', new.id)
    );
  end if;

  -- Status berubah -> kabari pembuat tugas + coordinator divisi tsb
  if new.status is distinct from old.status then
    insert into public.notifications (
      organization_id, user_id, notification_type, title, body, data
    )
    select
      new.organization_id,
      r.user_id,
      'task_status_changed',
      'Task ' || new.status::text || ': ' || new.title,
      'The status changed from ' || old.status::text || ' to ' || new.status::text || '.',
      jsonb_build_object('task_id', new.id)
    from (
      select new.created_by as user_id
      union                                   -- union (bukan union all) membuang duplikat
      select m.user_id
      from public.organization_members m
      where m.organization_id = new.organization_id
        and m.division_id = new.division_id
        and m.role = 'coordinator'
        and m.status = 'active'
    ) r
    where r.user_id is not null
      and r.user_id is distinct from v_actor;
  end if;

  return new;
end;
$$;

-- Trigger berjalan SETELAH baris tersimpan (after), sekali per baris (for each row).
drop trigger if exists notifications_after_task_insert on public.tasks;
create trigger notifications_after_task_insert
after insert on public.tasks
for each row execute function public.notify_task_activity();

-- Untuk UPDATE, trigger hanya aktif kalau salah satu kolom di bawah ini ikut diubah.
drop trigger if exists notifications_after_task_update on public.tasks;
create trigger notifications_after_task_update
after update of assignee_user_id, title, due_at, priority, status on public.tasks
for each row execute function public.notify_task_activity();