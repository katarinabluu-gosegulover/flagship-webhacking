-- FLAGSHIP 2026-08-31 launch curriculum
-- Run once in Supabase Dashboard > SQL Editor before opening the course.
-- Idempotent: rerunning updates the eight curriculum weeks and assignments.
-- Source path: https://dreamhack.io/lecture/paths/web-hacking-advanced

begin;

insert into public.curriculum_weeks
  (week_number, title, description, level, tags, duration_minutes, status)
values
  (1, 'Client-Side Template Injection (CSTI)',
   '2026-08-31 수업. 프론트엔드 템플릿의 신뢰 경계를 이해하고 CSTI가 XSS로 이어지는 흐름과 안전한 렌더링 원칙을 분석합니다.',
   'ADVANCED', array['CSTI', 'XSS', 'Template'], 120, 'active'),
  (2, 'XS-Search',
   '2026-09-07 수업. 브라우저의 SOP와 교차 출처 부채널을 이해하고 XS-Search의 정보 노출 조건과 완화 방법을 학습합니다.',
   'ADVANCED', array['XS-Search', 'SOP', 'Side Channel'], 120, 'locked'),
  (3, 'CSS Injection',
   '2026-09-14 수업. CSS 주입으로 발생하는 UI 변조와 정보 노출 경로를 허가된 Lab에서 관찰하고 방어 원칙을 정리합니다.',
   'ADVANCED', array['CSS Injection', 'UI Redress', 'Exfiltration'], 90, 'locked'),
  (4, 'DOM Vulnerability',
   '2026-09-21 수업. DOM Clobbering과 DOM XSS의 데이터 흐름을 분석하고 안전한 DOM API 사용과 이름 충돌 방지를 학습합니다.',
   'ADVANCED', array['DOM', 'DOM Clobbering', 'DOM XSS'], 90, 'locked'),
  (5, 'Relative Path Overwrite (RPO)',
   '2026-09-28 수업. 상대 경로 해석과 브라우저·서버 간 URL 처리 차이가 RPO로 이어지는 원리를 분석합니다.',
   'ADVANCED', array['RPO', 'Relative Path', 'URL'], 90, 'locked'),
  (6, 'RPO Advanced Practice',
   '2026-10-05 수업. Dreamhack RPO 실습과 심화 문제를 바탕으로 재현 조건, 영향 범위, 방어 체크리스트를 완성합니다.',
   'ADVANCED', array['RPO', 'Lab', 'Mitigation'], 90, 'locked'),
  (7, 'Web Cache Poisoning',
   '2026-10-12 수업. 캐시 키와 비키 입력의 차이를 이해하고 Web Cache Poisoning의 발생 조건과 캐시 정책 개선안을 분석합니다.',
   'ADVANCED', array['Web Cache', 'Cache Poisoning', 'Cache Key'], 135, 'locked'),
  (8, 'Web Cache Deception',
   '2026-10-19 수업. 경로 해석과 캐시 규칙의 불일치로 개인화 응답이 저장되는 조건을 분석하고 안전한 캐싱 정책을 설계합니다.',
   'ADVANCED', array['Web Cache', 'Cache Deception', 'Path'], 135, 'locked')
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
  ('A-01', 1, 'CSTI 신뢰 경계 분석 보고서',
   'Dreamhack CSTI Unit을 학습하고 템플릿 입력부터 DOM 출력까지의 데이터 흐름, 위험한 신뢰 가정, 안전한 렌더링 개선안을 PDF 또는 Markdown으로 제출하세요.',
   timestamptz '2026-09-06 23:59:00+09', true),
  ('A-02', 2, 'XS-Search 부채널 분석',
   'SOP가 보호하는 경계와 XS-Search가 관찰하는 신호를 구분하고 정보 노출 조건, 영향, 완화 방안을 도식화하세요.',
   timestamptz '2026-09-13 23:59:00+09', false),
  ('A-03', 3, 'CSS Injection 방어 리뷰',
   '허가된 Lab에서 관찰한 UI 변조와 정보 노출 흐름을 정리하고 스타일 입력 제한, DOM 격리, 보안 정책 개선안을 제안하세요.',
   timestamptz '2026-09-20 23:59:00+09', false),
  ('A-04', 4, 'DOM 취약점 데이터 흐름 분석',
   'DOM Clobbering 또는 DOM XSS 사례의 source와 sink, 이름 충돌 지점, 안전한 DOM API 및 검증 방안을 정리하세요.',
   timestamptz '2026-09-27 23:59:00+09', false),
  ('A-05', 5, 'RPO 발생 조건 분석',
   '상대 경로, base URL, 콘텐츠 타입, 라우팅 규칙이 RPO에 미치는 영향을 표로 정리하고 재현 조건과 방어책을 제출하세요.',
   timestamptz '2026-10-04 23:59:00+09', false),
  ('A-06', 6, 'RPO Advanced Lab Write-up',
   'Dreamhack의 허가된 RPO 실습과 심화 문제에서 관찰한 요청·응답 흐름, 영향 범위, 서버와 브라우저 측 완화 방안을 작성하세요.',
   timestamptz '2026-10-11 23:59:00+09', false),
  ('A-07', 7, 'Web Cache Poisoning 위협 모델',
   '캐시 키에 포함되는 입력과 제외되는 입력을 구분하고 중독 조건, 사용자 영향, 캐시 정책 및 응답 헤더 개선안을 제출하세요.',
   timestamptz '2026-10-18 23:59:00+09', false),
  ('A-08', 8, 'Web Cache Deception 방어 설계',
   '동적·정적 경로 판정과 캐시 규칙의 불일치를 분석하고 개인화 응답 캐싱을 막는 경로·헤더·CDN 설정 체크리스트를 작성하세요.',
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
