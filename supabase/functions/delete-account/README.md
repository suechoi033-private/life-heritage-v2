# delete-account — 회원탈퇴(계정 삭제) Edge Function

> ⚠️ **이 함수는 아직 배포되지 않았습니다.**
> 실데이터를 영구 삭제하는 **one-way door** 작업이므로, **창업자가 직접 검토 후
> Supabase에 배포**해야 합니다. 프런트엔드(탈퇴 UI)는 이미 배포되어 있으나,
> 이 함수가 배포되기 전까지는 사용자가 탈퇴를 시도하면
> "현재 탈퇴 처리를 준비 중입니다. 고객센터로 문의해주세요" 안내가 표시됩니다.
> (앱은 깨지지 않습니다.)

## 무엇을 하나

인증된 사용자가 자기 계정을 영구 삭제한다.

1. 호출자의 JWT를 검증해 본인 `uid` 확인 (남의 계정 삭제 불가).
2. service-role 권한으로 해당 사용자의 모든 데이터를 의존성 역순으로 삭제
   (일기·답변·목표·태그·게시글·댓글·리액션·북마크·푸시구독·친구·콘텐츠 등).
3. `profiles` 행 삭제 후 `auth.admin.deleteUser(uid)` 로 인증 사용자 삭제.

## FK / cascade 메모 (배포 전 1회 확인 권장)

스키마(`supabase/migrations/20260517_redesign_mvp.sql`)상 거의 모든 user FK가
`public.profiles(id)` 를 **ON DELETE CASCADE** 로 참조하고, `profiles.id` 는
`auth.users.id` 와 동일하다.

- 만약 `profiles.id` 가 `auth.users(id) on delete cascade` 로 묶여 있다면
  → 사실상 `admin.auth.admin.deleteUser(uid)` 한 번으로 전부 정리된다.
- 이 repo에는 `profiles` **원본 정의가 없어** cascade 여부를 코드만으로
  확정할 수 없다. 그래서 이 함수는 **cascade에 의존하지 않고** 자식 테이블을
  명시적으로 삭제한다(멱등 — cascade가 이미 있어도 무해).

배포 전 한 번 확인하려면 SQL Editor에서:

```sql
select conname, confdeltype
from pg_constraint
where conrelid = 'public.profiles'::regclass and contype = 'f';
-- confdeltype = 'c' 이면 cascade
```

`care_*` 테이블의 소유/멤버 컬럼명은 repo에 정의가 없어 추정으로 처리한다
(`care_members` 의 `user_id`/`member_id`/`profile_id` 중 존재하는 컬럼 시도).
실제 컬럼명을 확인해 필요 시 `index.ts` 의 care 처리 부분을 조정할 것.

## 배포 방법 (창업자)

```bash
# 1) Supabase CLI 로그인 & 프로젝트 링크 (최초 1회)
supabase login
supabase link --project-ref zugwccngzprjjnwtajyr

# 2) 함수 배포
supabase functions deploy delete-account

# 3) 환경변수 확인
#  SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY 는
#  Edge Function 런타임에 자동 주입된다. 별도 secrets 설정 불필요.
#  (자동 주입이 안 되는 경우에만 수동 설정)
#    supabase secrets set SUPABASE_SERVICE_ROLE_KEY=<service_role_key>
```

배포 후 프런트의 탈퇴 버튼이 `supabase.functions.invoke('delete-account')` 로
이 함수를 호출한다. 추가 클라이언트 변경은 필요 없다.

## 검증 (배포 후, 테스트 계정으로)

1. 테스트 계정으로 로그인 → 마이 → 회원탈퇴 → "탈퇴" 입력 → 확인.
2. `auth.users` 와 각 테이블에서 해당 uid 행이 사라졌는지 확인.
3. 로그아웃되어 `login.html?goodbye=1` 로 이동하는지 확인.
