# FLAGSHIP 개강 체크리스트 — 2026-08-31

공개 사이트: https://katarinabluu-gosegulover.github.io/flagship-webhacking/

## 필수 완료

- [x] `supabase/launch-2026-08-31.sql`을 Supabase SQL Editor에서 실행한다.
- [x] 검증 결과가 8행이고, `A-01`만 `is_published = true`인지 확인한다.
- [x] 공개 사이트를 배포하고 HTTPS 주소를 확보한다.
- [x] Supabase Dashboard → Authentication → URL Configuration에서 Site URL을 공개 사이트 주소로 변경한다.
- [x] Redirect URLs에 `공개 사이트 주소/**`와 `http://localhost:8000/**`를 등록한다.
- [ ] 학생 계정 생성 방식을 결정한다.
- [ ] 학생 계정으로 가입, 로그인, A-01 제출, 관리자 다운로드까지 한 번 끝까지 시험한다.

## 가입 이메일 주의

Supabase 기본 이메일 제공자는 실운영용이 아니며 이메일 발송 제한이 매우 낮다. 개강 당일 여러 학생이 가입해야 한다면 다음 중 하나를 선택한다.

1. 권장: Custom SMTP를 연결하고 이메일 확인을 유지한다.
2. 임시 운영: Authentication 설정에서 Confirm Email을 끄고 학생 가입 기간을 제한한다. 이 경우 이메일 소유 확인 없이 계정이 활성화되므로 가입 링크를 동아리 내부에만 공유한다.

## Brevo Custom SMTP

1. Brevo 계정을 만들고 발신 이메일을 인증한다.
2. Brevo Settings → SMTP & API → SMTP에서 SMTP key를 생성한다.
3. Supabase Dashboard → Authentication → Emails → SMTP Settings에서 Custom SMTP를 활성화한다.
4. Sender name은 `FLAGSHIP`, Sender email은 Brevo에서 인증한 주소를 입력한다.
5. Host는 `smtp-relay.brevo.com`, Port는 `587`을 입력한다.
6. Username은 Brevo의 SMTP login, Password는 생성한 SMTP key를 입력한다. Brevo 계정 비밀번호나 API key를 사용하지 않는다.
7. 저장 후 테스트 학생 계정 하나로 인증 메일 수신과 로그인까지 확인한다.

SMTP key는 `config.js`, Git 저장소, 메신저에 넣지 않는다. Supabase Dashboard의 SMTP Password 입력란에만 저장한다.

## GitHub Pages 배포

1. GitHub에 빈 공개 저장소를 만든다.
2. 이 프로젝트를 저장소에 push한다.
3. 저장소 Settings → Pages → Source를 `GitHub Actions`로 선택한다.
4. Actions의 `Deploy FLAGSHIP to GitHub Pages` 작업이 완료될 때까지 기다린다.
5. 발급된 `https://계정.github.io/저장소명/` 주소에서 로그인 화면을 확인한다.

`config.js`에는 Supabase publishable key만 포함해야 한다. secret 또는 service-role key는 절대 넣지 않는다.

## 개강 직전 점검

- [ ] 관리자 계정은 `admin.html`에 접근할 수 있다.
- [ ] 학생 계정은 `admin.html` 접근 시 학생 화면으로 돌아간다.
- [ ] 학생 화면에는 A-01만 나타난다.
- [ ] PDF/MD/TXT/ZIP 파일이 20MB 이하일 때 제출된다.
- [ ] 다른 학생의 제출물을 학생 계정으로 조회할 수 없다.
- [ ] 관리자는 제출 파일을 열고 점수와 피드백을 저장할 수 있다.
- [ ] 잔디에 제출 날짜가 반영된다.

## 운영 순서

매주 수업이 끝나면 관리자 패널에서 지난 주차를 `done`, 새 주차를 `active`로 변경하고 해당 주차 과제를 공개한다.

## 공식 참고 자료

- Supabase Auth Redirect URLs: https://supabase.com/docs/guides/auth/redirect-urls
- Supabase API keys: https://supabase.com/docs/guides/getting-started/api-keys
- Supabase Auth email rate limits: https://supabase.com/docs/guides/auth/rate-limits
- Brevo SMTP relay: https://developers.brevo.com/docs/smtp-integration
- GitHub Pages: https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages
