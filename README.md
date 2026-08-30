# FLAGSHIP — Web Security Lab

웹해킹 동아리용 커리큘럼·과제·자료·채점 플랫폼입니다. 학생 화면과 별도의 관리자 패널을 제공하며 Supabase Auth, PostgreSQL, private Storage를 사용합니다.

## 제공 기능

### 교육생

- 이메일/비밀번호 로그인과 가입 신청
- DB 기반 주차별 커리큘럼 조회
- 과제 파일을 private 저장소로 제출
- 본인 제출 상태, 점수, 피드백 조회
- 로그인 사용자만 수업 자료 다운로드

### 관리자

- 별도 `admin.html` 관리자 패널
- 커리큘럼 주차 생성·수정·삭제
- 과제 생성·수정·공개·삭제
- 전체 제출 파일 열람, 채점, 피드백
- 최근 16주 제출 잔디, 학생별 필터, 날짜별 제출 상세 확인
- 수업 자료 업로드·다운로드·삭제
- 멤버 역할을 교육생/관리자로 변경

## 프로젝트 파일

- `index.html`, `app-v2.js`: 교육생 화면
- `login.html`, `login.js`: 인증 화면
- `admin.html`, `admin.js`: 관리자 전용 화면
- `backend.js`: Auth, Database, Storage 데이터 계층
- `supabase/schema.sql`: 테이블, RLS, Storage 정책과 초기 데이터
- `config.example.js`: 브라우저 연결 설정 예시
- `start-server.ps1`: 의존성 없는 로컬 서버

## 시작하기

정확한 연결 순서는 [SUPABASE_SETUP.md](SUPABASE_SETUP.md)를 참고하세요.

설정을 마친 후 PowerShell에서 실행합니다.

```powershell
.\start-server.ps1
```

그다음 `http://localhost:8000/login.html`에 접속합니다.

## 2026년 8월 31일 개강

- Dreamhack 심화 Path 기반 실제 8주 일정: `CURRICULUM_2026_ADVANCED.md`
- 실제 8주 일정과 과제 데이터: `supabase/launch-2026-08-31.sql`
- 배포 및 개강 점검 순서: `LAUNCH_CHECKLIST.md`
- GitHub Pages 자동 배포: `.github/workflows/pages.yml`

개강 SQL은 기존 예시 데이터를 고정 일정으로 갱신하며 여러 번 실행해도 같은 결과가 되도록 작성되어 있습니다. 첫 주에는 1주차만 진행 중이고 A-01만 학생에게 공개됩니다.

## 보안 설계

- 모든 공개 스키마 테이블에 RLS가 활성화됩니다.
- 교육생은 본인 제출물과 본인 피드백만 조회할 수 있습니다.
- 관리자 권한은 `profiles.role`을 DB 정책에서 검사합니다.
- 제출물과 수업 자료는 private bucket을 사용합니다.
- 다운로드는 5분 동안 유효한 signed URL을 사용합니다.
- `service_role` 키는 프런트엔드에 사용하지 않습니다.

Supabase 공식 문서는 노출된 스키마의 테이블에 RLS를 활성화하고, private bucket 접근을 Storage RLS로 제어할 것을 안내합니다.

## 참고 자료

- [Supabase Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [Supabase 이메일/비밀번호 로그인](https://supabase.com/docs/reference/javascript/auth-signinwithpassword)
- [Supabase Storage 접근 제어](https://supabase.com/docs/guides/storage/security/access-control)
- [Supabase private bucket](https://supabase.com/docs/guides/storage/buckets/fundamentals)
