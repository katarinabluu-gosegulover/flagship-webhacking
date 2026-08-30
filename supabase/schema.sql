-- FLAGSHIP Web Security Lab
-- Run this entire file once in Supabase Dashboard > SQL Editor.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default '새 멤버' check (char_length(display_name) between 1 and 40),
  role text not null default 'student' check (role in ('student', 'admin')),
  created_at timestamptz not null default now()
);

create table if not exists public.curriculum_weeks (
  id uuid primary key default gen_random_uuid(),
  week_number integer not null unique check (week_number between 1 and 52),
  title text not null,
  description text not null default '',
  level text not null default 'BASIC' check (level in ('BASIC', 'CORE', 'ADVANCED')),
  tags text[] not null default '{}',
  duration_minutes integer not null default 90 check (duration_minutes > 0),
  status text not null default 'locked' check (status in ('done', 'active', 'locked')),
  created_at timestamptz not null default now()
);

create table if not exists public.assignments (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  week_id uuid references public.curriculum_weeks(id) on delete set null,
  title text not null,
  description text not null default '',
  due_at timestamptz not null,
  max_score integer not null default 100 check (max_score between 1 and 1000),
  is_published boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.resources (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null default '',
  category text not null default '강의자료',
  file_path text,
  original_file_name text,
  external_url text,
  size_bytes bigint check (size_bytes is null or size_bytes >= 0),
  uploaded_by uuid references public.profiles(id) on delete set null,
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  constraint resource_has_target check (file_path is not null or external_url is not null)
);

create table if not exists public.submissions (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null references public.assignments(id) on delete cascade,
  student_id uuid not null references public.profiles(id) on delete cascade,
  file_path text not null,
  original_file_name text not null,
  memo text,
  status text not null default 'submitted' check (status in ('submitted', 'graded', 'returned')),
  submitted_at timestamptz not null default now(),
  unique (assignment_id, student_id)
);

create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null unique references public.submissions(id) on delete cascade,
  reviewer_id uuid not null references public.profiles(id) on delete restrict,
  score integer not null check (score between 0 and 100),
  feedback text not null,
  reviewed_at timestamptz not null default now()
);

create table if not exists public.notices (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  content text not null,
  is_pinned boolean not null default false,
  author_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists submissions_student_idx on public.submissions(student_id);
create index if not exists submissions_assignment_idx on public.submissions(assignment_id);
create index if not exists assignments_due_idx on public.assignments(due_at);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(nullif(new.raw_user_meta_data ->> 'display_name', ''), split_part(new.email, '@', 1)));
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and role = 'admin'
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

alter table public.profiles enable row level security;
alter table public.curriculum_weeks enable row level security;
alter table public.assignments enable row level security;
alter table public.resources enable row level security;
alter table public.submissions enable row level security;
alter table public.reviews enable row level security;
alter table public.notices enable row level security;

create policy "profile read self or admin" on public.profiles for select to authenticated
using ((select auth.uid()) = id or (select public.is_admin()));
create policy "profile update admin" on public.profiles for update to authenticated
using ((select public.is_admin())) with check ((select public.is_admin()));

create policy "curriculum read authenticated" on public.curriculum_weeks for select to authenticated using (true);
create policy "curriculum admin insert" on public.curriculum_weeks for insert to authenticated with check ((select public.is_admin()));
create policy "curriculum admin update" on public.curriculum_weeks for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "curriculum admin delete" on public.curriculum_weeks for delete to authenticated using ((select public.is_admin()));

create policy "published assignments read" on public.assignments for select to authenticated
using (is_published or (select public.is_admin()));
create policy "assignments admin insert" on public.assignments for insert to authenticated with check ((select public.is_admin()));
create policy "assignments admin update" on public.assignments for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "assignments admin delete" on public.assignments for delete to authenticated using ((select public.is_admin()));

create policy "published resources read" on public.resources for select to authenticated
using (is_published or (select public.is_admin()));
create policy "resources admin insert" on public.resources for insert to authenticated with check ((select public.is_admin()));
create policy "resources admin update" on public.resources for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "resources admin delete" on public.resources for delete to authenticated using ((select public.is_admin()));

create policy "submission read own or admin" on public.submissions for select to authenticated
using (student_id = (select auth.uid()) or (select public.is_admin()));
create policy "submission insert own" on public.submissions for insert to authenticated
with check (student_id = (select auth.uid()));
create policy "submission admin update" on public.submissions for update to authenticated
using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "submission delete own or admin" on public.submissions for delete to authenticated
using (student_id = (select auth.uid()) or (select public.is_admin()));

create policy "review read own or admin" on public.reviews for select to authenticated
using (
  (select public.is_admin()) or exists (
    select 1 from public.submissions s
    where s.id = submission_id and s.student_id = (select auth.uid())
  )
);
create policy "review admin insert" on public.reviews for insert to authenticated with check ((select public.is_admin()));
create policy "review admin update" on public.reviews for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "review admin delete" on public.reviews for delete to authenticated using ((select public.is_admin()));

create policy "notices read authenticated" on public.notices for select to authenticated using (true);
create policy "notices admin insert" on public.notices for insert to authenticated with check ((select public.is_admin()));
create policy "notices admin update" on public.notices for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "notices admin delete" on public.notices for delete to authenticated using ((select public.is_admin()));

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('submissions', 'submissions', false, 20971520, array['application/pdf','application/zip','application/x-zip-compressed','application/octet-stream','text/plain','text/markdown','text/x-markdown']),
  ('resources', 'resources', false, 52428800, null)
on conflict (id) do update set public = excluded.public, file_size_limit = excluded.file_size_limit;

create policy "student upload own submission" on storage.objects for insert to authenticated
with check (bucket_id = 'submissions' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "read own submission or admin" on storage.objects for select to authenticated
using (bucket_id = 'submissions' and ((storage.foldername(name))[1] = (select auth.uid())::text or (select public.is_admin())));
create policy "delete own submission or admin" on storage.objects for delete to authenticated
using (bucket_id = 'submissions' and ((storage.foldername(name))[1] = (select auth.uid())::text or (select public.is_admin())));

create policy "authenticated read resources" on storage.objects for select to authenticated
using (bucket_id = 'resources');
create policy "admin upload resources" on storage.objects for insert to authenticated
with check (bucket_id = 'resources' and (select public.is_admin()));
create policy "admin update resources" on storage.objects for update to authenticated
using (bucket_id = 'resources' and (select public.is_admin())) with check (bucket_id = 'resources' and (select public.is_admin()));
create policy "admin delete resources" on storage.objects for delete to authenticated
using (bucket_id = 'resources' and (select public.is_admin()));

-- Seed curriculum. Safe to run more than once.
insert into public.curriculum_weeks (week_number, title, description, level, tags, duration_minutes, status)
values
  (1, 'Web & HTTP Fundamentals', '웹의 동작 원리와 HTTP 요청·응답 구조를 프록시로 관찰합니다.', 'BASIC', array['HTTP','Burp Suite','DevTools'], 90, 'done'),
  (2, 'Authentication & Session', '쿠키와 세션을 이해하고 인증 로직의 취약점을 분석합니다.', 'BASIC', array['Cookie','Session','JWT'], 120, 'done'),
  (3, 'SQL Injection', 'SQL 질의 구조와 안전한 랩에서 Injection 원리를 실습합니다.', 'CORE', array['SQLi','Union','Blind'], 150, 'active'),
  (4, 'Cross-Site Scripting', 'Reflected, Stored, DOM XSS를 구분하고 입력값 처리를 배웁니다.', 'CORE', array['XSS','DOM','CSP'], 150, 'locked'),
  (5, 'File Vulnerabilities', '파일 처리 과정의 검증 취약점과 방어 방법을 살펴봅니다.', 'CORE', array['Upload','MIME','Path'], 150, 'locked'),
  (6, 'Server-Side Attacks', 'SSRF, XXE, Command Injection의 서버 측 공격 표면을 분석합니다.', 'ADVANCED', array['SSRF','XXE','CMDi'], 180, 'locked')
on conflict (week_number) do update set title = excluded.title, description = excluded.description,
  level = excluded.level, tags = excluded.tags, duration_minutes = excluded.duration_minutes, status = excluded.status;

insert into public.assignments (code, week_id, title, description, due_at, is_published)
select seed.code, week.id, seed.title, seed.description, seed.due_at, seed.is_published
from (values
  ('A-01', 1, 'HTTP 패킷 분석 보고서', '요청과 응답을 캡처하여 구조를 분석하세요.', now() + interval '7 days', true),
  ('A-02', 2, '인증 우회 시나리오 분석', '취약 서비스의 인증 로직과 개선안을 작성하세요.', now() + interval '14 days', true),
  ('A-03', 3, 'SQLi Lab Write-up', '허가된 실습 랩의 풀이와 대응 방안을 제출하세요.', now() + interval '21 days', true)
) as seed(code, week_number, title, description, due_at, is_published)
join public.curriculum_weeks week on week.week_number = seed.week_number
on conflict (code) do nothing;

-- After creating your own account, promote it once in SQL Editor:
-- update public.profiles set role = 'admin' where id = (select id from auth.users where email = 'YOUR_EMAIL');
