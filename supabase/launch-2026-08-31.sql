-- FLAGSHIP 2026-08-31 launch curriculum
-- Run once in Supabase Dashboard > SQL Editor before opening the course.
-- Idempotent: rerunning updates the eight curriculum weeks and assignments.
-- Source path: Dreamhack Web Hacking Basics - Deep Dive.

begin;

insert into public.curriculum_weeks
  (week_number, title, description, level, tags, duration_minutes, status)
values
  (1, 'XSS Filtering Bypass',
   '2026-08-31 수업. Dreamhack 심화 Path의 XSS 필터링 동작과 탐지 한계를 학습하고 허가된 Lab에서 결과를 기록합니다.',
   'CORE', array['XSS', 'Filter', 'JavaScript'], 210, 'active'),
  (2, 'Content Security Policy (CSP)',
   '2026-09-07 수업. CSP 정책 평가 방식과 잘못된 설정에서 생기는 위험을 분석하고 안전한 정책 작성 원칙을 학습합니다.',
   'CORE', array['CSP', 'XSS', 'Policy'], 210, 'locked'),
  (3, 'CSRF/CORS Bypass',
   '2026-09-14 수업. CSRF 토큰 검증과 CORS 정책의 동작 원리를 살펴보고 구성 오류를 방어 관점에서 분석합니다.',
   'CORE', array['CSRF', 'CORS', 'postMessage'], 210, 'locked'),
  (4, 'Command Injection Advanced',
   '2026-09-21 수업. 운영체제별 명령 실행 경계와 입력 검증의 한계를 허가된 실습 환경에서 분석합니다.',
   'ADVANCED', array['Command Injection', 'Linux', 'Windows'], 240, 'locked'),
  (5, 'File Vulnerability Advanced',
   '2026-09-28 수업. 운영체제별 파일 업로드·다운로드 검증과 서버 설정에서 발생하는 위험을 분석합니다.',
   'ADVANCED', array['File Upload', 'File Download', 'Path'], 240, 'locked'),
  (6, 'SQL Injection Advanced',
   '2026-10-05 수업. Blind, Error, Time 기반 SQL Injection과 WAF 탐지 한계를 허가된 Lab에서 분석합니다.',
   'ADVANCED', array['SQLi', 'Blind', 'WAF'], 270, 'locked'),
  (7, 'SQL Injection Fingerprinting',
   '2026-10-12 수업. 시스템 테이블과 DBMS별 응답 차이를 이용한 식별 원리를 방어 관점과 함께 학습합니다.',
   'ADVANCED', array['SQLi', 'DBMS', 'Fingerprinting'], 180, 'locked'),
  (8, 'NoSQL Injection Advanced',
   '2026-10-19 수업. CouchDB, MongoDB, Redis의 질의 처리 차이와 Injection 방어 원칙을 비교합니다.',
   'ADVANCED', array['NoSQL', 'MongoDB', 'Redis'], 270, 'locked')
on conflict (week_number) do update set
  title = excluded.title,
  description = excluded.description,
  level = excluded.level,
  tags = excluded.tags,
  duration_minutes = excluded.duration_minutes,
  status = excluded.status;

insert into public.assignments
  (code, week_id, title, description, due_at, max_score, is_published)
select
  schedule.code,
  week.id,
  schedule.title,
  schedule.description,
  schedule.due_at,
  100,
  schedule.is_published
from (values
  ('A-01', 1, 'XSS 필터 동작 분석 보고서',
   'Dreamhack의 해당 Unit과 허가된 Lab을 학습하고 필터 규칙, 관찰 결과, 안전한 출력 처리 개선안을 PDF 또는 Markdown으로 제출하세요. 공격 문자열 자체보다 원인과 방어 설명을 중심으로 작성합니다.',
   timestamptz '2026-09-06 23:59:00+09', true),
  ('A-02', 2, 'CSP 정책 리뷰',
   '제공된 CSP 사례의 지시어와 리소스 허용 범위를 표로 정리하고 과도한 허용 규칙을 줄인 개선 정책을 제안하세요.',
   timestamptz '2026-09-13 23:59:00+09', false),
  ('A-03', 3, 'CSRF/CORS 신뢰 경계 분석',
   '허가된 실습 사례에서 요청 주체, Origin 검증, 자격 증명 전달, 토큰 검증 흐름을 그리고 구성상의 문제와 개선안을 제출하세요.',
   timestamptz '2026-09-20 23:59:00+09', false),
  ('A-04', 4, 'Command Injection 방어 설계',
   '허가된 Lab의 입력부터 명령 실행 지점까지 데이터 흐름을 추적하고 셸 호출 제거, 허용 목록, 권한 분리 개선안을 작성하세요.',
   timestamptz '2026-09-27 23:59:00+09', false),
  ('A-05', 5, '파일 처리 위협 모델',
   '파일 업로드·다운로드 흐름의 신뢰 경계를 만들고 파일명, 경로, MIME, 실행 권한, 웹 루트 분리 점검표를 제출하세요.',
   timestamptz '2026-10-04 23:59:00+09', false),
  ('A-06', 6, 'Advanced SQLi Lab Write-up',
   'Dreamhack의 허가된 Lab에서 관찰한 Blind·Error·Time 기반 차이를 비교하고 파라미터 바인딩과 WAF 의존 최소화 방안을 작성하세요.',
   timestamptz '2026-10-11 23:59:00+09', false),
  ('A-07', 7, 'DBMS Fingerprinting 비교표',
   '과정에서 다룬 DBMS 식별 단서를 비교표로 정리하고 오류 정보 최소화, 계정 권한 분리 등 방어 방안을 작성하세요.',
   timestamptz '2026-10-18 23:59:00+09', false),
  ('A-08', 8, 'NoSQL Injection 방어 비교',
   'CouchDB, MongoDB, Redis 중 두 가지를 선택해 질의 구조와 위험한 입력 처리의 차이, 스키마 검증 및 권한 분리 방안을 제출하세요.',
   timestamptz '2026-10-25 23:59:00+09', false)
) as schedule(code, week_number, title, description, due_at, is_published)
join public.curriculum_weeks week on week.week_number = schedule.week_number
on conflict (code) do update set
  week_id = excluded.week_id,
  title = excluded.title,
  description = excluded.description,
  due_at = excluded.due_at,
  max_score = excluded.max_score,
  is_published = excluded.is_published;

commit;

-- Verification query: expected result is 8 rows and only A-01 is published.
select
  week.week_number,
  week.status,
  assignment.code,
  assignment.due_at at time zone 'Asia/Seoul' as due_at_kst,
  assignment.is_published
from public.curriculum_weeks week
left join public.assignments assignment on assignment.week_id = week.id
where week.week_number between 1 and 8
order by week.week_number;
