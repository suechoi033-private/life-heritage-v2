# 잇다 — Supabase 설정 가이드

## 1. 마이그레이션 적용

```bash
# Supabase Dashboard → SQL Editor 또는 CLI
supabase db push
# 또는 수동 실행 (이 순서대로):
#   1) migrations/20260517_redesign_mvp.sql                  — 모든 테이블 + RLS
#   2) migrations/20260517_storage_buckets.sql               — Storage 버킷 + 정책
#   3) migrations/20260517_migrate_stories_to_contents.sql   — (선택) 기존 추모 데이터 이전
```

검증 쿼리:
```sql
select count(*) from public.stories;
select count(*) from public.contents where category = 'memorial';
-- 두 카운트가 일치해야 함
```

## 2. 소셜 로그인 설정

### 구글 / 애플 (Supabase 네이티브)
- Dashboard → Authentication → Providers → Google / Apple 활성화
- OAuth Client ID/Secret 입력
- Redirect URL: `https://<your-domain>/index.html`

### 카카오 (Edge Function 브리지)
1. **카카오 디벨로퍼스에서 앱 등록**
   - REST API 키, JavaScript 키 발급
   - 플랫폼 → Web → 사이트 도메인 등록
   - 동의항목: 닉네임(필수), 이메일(선택), 프로필 사진(선택)

2. **Edge Function 배포**
   ```bash
   supabase functions deploy kakao-signin
   ```

3. **클라이언트에 JS 키 주입**
   배포 시 `<script>window.__KAKAO_JS_KEY__='...'</script>` 또는
   `auth.js` 상단에 환경별로 주입.

4. **Magic Link 활성화 확인**
   카카오 토큰 → Supabase 세션 변환에 magic link 메커니즘 사용.
   Dashboard → Authentication → Settings → "Enable magic links" 켜져 있어야 함.

## 3. 푸시 알림 (Web Push)

### VAPID 키 생성
```bash
npx web-push generate-vapid-keys
# Public Key  → 클라이언트에 주입 (window.__VAPID_PUBLIC_KEY__)
# Private Key → Edge Function 환경변수 VAPID_PRIVATE_KEY
```

### 푸시 발송 Edge Function (별도 작성 필요)
- 트리거: `care_logs` INSERT/UPDATE, `friend_invites` 수락, `comments` INSERT
- Supabase Database Webhooks → Edge Function 호출
- Edge Function이 `push_subscriptions` 조회 → web-push로 발송

## 4. Storage 버킷

`20260517_storage_buckets.sql` 실행 시 자동 생성:
- `diary-media`   (private, RLS — 작성자만 접근, signed URL 사용)
- `content-media` (public read,  작성자만 쓰기)
- `post-media`    (public read,  작성자만 쓰기)

기존(유지):
- `story-photos` (public read)
- `care-photos`  (private, RLS)

## 5. RLS 정책 확인

마이그레이션 후 Dashboard → Database → Policies에서 모든 신규 테이블의
RLS가 활성화되어 있는지 확인. 비활성 상태면 다음 실행:

```sql
alter table public.diary_entries enable row level security;
-- ... (모든 신규 테이블에 대해)
```

## 6. 100명 규모 용량 가이드

| 항목 | 1인당 월 사용량 | 100명 총량 |
|---|---|---|
| 일기 30개 + 사진 60장(평균 200KB) | 12MB | 1.2GB / 월 |
| 돌봄 로그 30개 + 사진 30장 | 6MB | 600MB / 월 |
| 콘텐츠/커뮤니티 텍스트 | <1MB | <100MB |
| **합계** | ~20MB | **약 2GB / 월** |

- Supabase Pro($25/월): Storage 100GB, DB 8GB → **여유 충분**
- 무료 티어(Storage 1GB, DB 500MB): 1-2개월만 버팀 → Pro 권장
