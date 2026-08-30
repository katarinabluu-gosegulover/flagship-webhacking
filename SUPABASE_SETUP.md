# Supabase 연결 가이드

## 1. 프로젝트 만들기

1. [Supabase Dashboard](https://supabase.com/dashboard)에서 새 프로젝트를 만듭니다.
2. 프로젝트가 준비되면 **SQL Editor**를 엽니다.
3. [`supabase/schema.sql`](supabase/schema.sql)의 전체 내용을 붙여 넣고 한 번 실행합니다.

SQL은 다음 항목을 만듭니다.

- `profiles`, `curriculum_weeks`, `assignments`, `resources`, `submissions`, `reviews`, `notices`
- 신규 Auth 사용자의 프로필 자동 생성 trigger
- 교육생/관리자 역할 검사용 함수와 RLS 정책
- private `submissions`, `resources` Storage bucket
- 6주 기본 커리큘럼과 예시 과제

## 2. 브라우저 연결 정보 입력

Supabase Dashboard의 **Project Settings → API**에서 다음 값을 확인합니다.

- Project URL
- Publishable key 또는 legacy anon key

`config.js`를 열어 두 값을 입력합니다.

```js
window.FLAGSHIP_CONFIG = {
  supabaseUrl: 'https://프로젝트-ID.supabase.co',
  supabaseAnonKey: '공개용-PUBLISHABLE-또는-ANON-KEY',
};
```

이 키는 RLS가 적용된 브라우저용 공개 키입니다. RLS를 우회하는 `service_role` 키는 절대로 `config.js`에 넣지 마세요.

## 3. 로그인 설정

Supabase Dashboard의 **Authentication → URL Configuration**에서 다음을 설정합니다.

- Site URL: `http://localhost:8000`
- Redirect URL: `http://localhost:8000/**`

이메일 확인 없이 바로 테스트하려면 개발 중에만 **Authentication → Providers → Email**의 Confirm email 옵션을 끌 수 있습니다. 실제 운영에서는 이메일 확인을 켜는 편이 안전합니다.

## 4. 첫 관리자 계정 만들기

1. `.\start-server.ps1`을 실행합니다.
2. `http://localhost:8000/login.html`에서 본인 계정을 가입합니다.
3. 이메일 확인이 활성화되어 있다면 확인 메일을 처리합니다.
4. Supabase SQL Editor에서 아래 SQL의 이메일을 본인 이메일로 바꾸어 한 번 실행합니다.

```sql
update public.profiles
set role = 'admin'
where id = (
  select id from auth.users where email = 'YOUR_EMAIL@example.com'
);
```

5. 다시 로그인한 후 왼쪽 메뉴의 **관리자 패널**을 엽니다.

첫 관리자 승격을 SQL Editor에서 수행하는 이유는 일반 가입자가 화면 조작만으로 관리자 권한을 얻지 못하게 하기 위해서입니다. 이후 다른 운영자의 역할은 관리자 패널에서 변경할 수 있습니다.

## 5. 운영 전 확인

- 교육생 계정에서 다른 학생 제출물이 보이지 않는지 확인
- 관리자 계정에서 전체 제출물과 멤버가 보이는지 확인
- 20MB 초과 과제 파일이 거부되는지 확인
- 로그아웃 후 `admin.html` 접근 시 로그인 화면으로 이동하는지 확인
- Supabase Dashboard에 `service_role` 키가 유출되지 않았는지 확인

## 공식 참고 자료

- [RLS와 Auth 연동](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [사용자 프로필 테이블 구성](https://supabase.com/docs/guides/auth/managing-user-data)
- [Storage Access Control](https://supabase.com/docs/guides/storage/security/access-control)
- [Private bucket과 signed URL](https://supabase.com/docs/guides/storage/buckets/fundamentals)
