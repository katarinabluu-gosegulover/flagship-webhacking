# FLAGSHIP 운영 버전 구현 보고서

## 구현 결과

기존 브라우저 전용 MVP를 사용자 인증, PostgreSQL 데이터베이스, 실제 파일 저장소를 사용하는 운영 구조로 확장했습니다. 학생 화면과 관리자 화면을 분리했으며 권한 검사는 프런트엔드 표시 여부뿐 아니라 데이터베이스 RLS 정책에서도 수행합니다.

## 권한 구조

| 데이터 | 교육생 | 관리자 |
|---|---|---|
| 커리큘럼·공개 과제·공개 자료 | 조회 | 전체 관리 |
| 제출물 | 본인 것만 생성·조회 | 전체 조회·상태 변경 |
| 피드백 | 본인 제출의 피드백만 조회 | 생성·수정·삭제 |
| 멤버 프로필 | 본인 프로필 조회 | 전체 조회·역할 변경 |
| 제출 파일 | 본인 경로만 업로드·조회 | 전체 조회 |
| 자료 파일 | 로그인 후 조회 | 업로드·조회·삭제 |

## 파일 저장 방식

- 과제: `submissions/{사용자 UUID}/{과제 UUID}/{시간}_{정리된 파일명}`
- 자료: `resources/{관리자 UUID}/{시간}_{정리된 파일명}`
- 두 bucket 모두 private이며 signed URL 유효 시간은 기본 5분입니다.

## 남은 외부 설정

소스 코드는 연결 가능한 상태이지만 Supabase 프로젝트는 사용자 소유 계정에서 생성해야 합니다. 프로젝트 생성 후 [`SUPABASE_SETUP.md`](SUPABASE_SETUP.md)에 따라 SQL 실행, 공개 연결 값 입력, 첫 관리자 승격이 필요합니다.

## 근거

Supabase 공식 문서는 브라우저에서 노출되는 테이블에 RLS를 활성화하고, private Storage bucket을 RLS와 signed URL로 보호하도록 설명합니다.

- https://supabase.com/docs/guides/database/postgres/row-level-security
- https://supabase.com/docs/guides/storage/security/access-control
- https://supabase.com/docs/guides/storage/buckets/fundamentals
