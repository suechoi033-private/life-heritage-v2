-- =============================================================
-- 잇다 — 신규 기능 일괄 적용 (SQL Editor에 통째로 붙여넣고 Run)
-- 포함: 처방전 분석 + 케어 가이드 + 이야기 카드 + 인라인 댓글/실시간
--       + 자기성찰 질문 v2(가벼운 입구 15문항)
-- 멱등(여러 번 실행해도 안전)하게 작성됨 — 정책은 drop-if-exists 후 재생성,
--   시드/데이터 삽입은 not exists / on conflict 로 중복 방지.
-- 생성: 5개 마이그레이션 병합본
-- =============================================================

-- ===== 20260524_care_prescriptions.sql =====
-- =============================================================
-- 케어링 처방전 분석 (MVP 1차)
--   - 처방전 사진 업로드 → OCR → 식약처(e약은요) 약물정보 카드
--   - 민감정보(건강정보) 처리: private 버킷 + RLS + 정보주체 동의 + 30일 자동삭제
--
-- ⚠️ 진단이 아닌 "정보 제공". 모든 표시에 디스클레이머 필수.
-- 메인 마이그레이션(20260517_redesign_mvp.sql) 이후 실행.
-- =============================================================

-- -------------------------------------------------------------
-- 0. 정보주체(부모) 건강정보 처리 동의 플래그
--    care_subjects 테이블에 컬럼 추가 (없으면)
-- -------------------------------------------------------------
alter table public.care_subjects
  add column if not exists health_data_consent_at timestamptz,
  add column if not exists health_data_consent_by uuid references public.profiles(id);

-- -------------------------------------------------------------
-- 1. 처방전 1건 (이미지 + OCR 원문 + 처리 상태)
-- -------------------------------------------------------------
create table if not exists public.care_prescriptions (
  id            uuid primary key default gen_random_uuid(),
  subject_id    uuid not null references public.care_subjects(id) on delete cascade,
  uploader_id   uuid not null references public.profiles(id),
  storage_path  text not null,
  ocr_text      text,
  status        text not null default 'pending'
                  check (status in ('pending','processing','done','failed')),
  error_msg     text,
  rx_date       date,
  created_at    timestamptz default now()
);

create index if not exists care_rx_subject_idx
  on public.care_prescriptions (subject_id, created_at desc);

-- -------------------------------------------------------------
-- 2. 처방전에서 추출된 약물 N건 (식약처 조회 결과 캐시)
-- -------------------------------------------------------------
create table if not exists public.care_prescription_drugs (
  id              uuid primary key default gen_random_uuid(),
  prescription_id uuid not null references public.care_prescriptions(id) on delete cascade,
  raw_name        text not null,
  matched_name    text,
  item_seq        text,
  efficacy        text,
  usage_text      text,
  caution         text,
  interactions    text,
  confidence      numeric,
  sort_order      int default 0,
  created_at      timestamptz default now()
);

create index if not exists care_rx_drugs_rx_idx
  on public.care_prescription_drugs (prescription_id, sort_order);

-- -------------------------------------------------------------
-- 3. RLS
--    접근 권한 = 해당 subject의 owner(care_subjects.user_id)
--               또는 care_members 협력자
--    쓰기(분석 결과 저장)는 Edge Function(service_role)만 — 정책 미부여
-- -------------------------------------------------------------
alter table public.care_prescriptions       enable row level security;
alter table public.care_prescription_drugs  enable row level security;

-- 공통 접근 판별: 주어진 subject_id에 현재 사용자가 접근 가능한가
create or replace function public.can_access_care_subject(p_subject_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.care_subjects s
    where s.id = p_subject_id and s.user_id = auth.uid()
  ) or exists (
    select 1 from public.care_members cm
    where cm.subject_id = p_subject_id and cm.user_id = auth.uid()
  );
$$;

-- 처방전: 접근 가능한 사람은 조회, 본인이 업로더로 등록(INSERT)
drop policy if exists "care_rx_member_select" on public.care_prescriptions;
create policy "care_rx_member_select" on public.care_prescriptions
  for select using (public.can_access_care_subject(subject_id));

drop policy if exists "care_rx_member_insert" on public.care_prescriptions;
create policy "care_rx_member_insert" on public.care_prescriptions
  for insert with check (
    uploader_id = auth.uid()
    and public.can_access_care_subject(subject_id)
  );

-- 업로더 본인이 자신이 올린 처방전 삭제 가능 (이미지·약물 cascade)
drop policy if exists "care_rx_uploader_delete" on public.care_prescriptions;
create policy "care_rx_uploader_delete" on public.care_prescriptions
  for delete using (uploader_id = auth.uid());

-- 약물 카드: 부모 처방전을 볼 수 있으면 조회 가능
drop policy if exists "care_rx_drugs_member_select" on public.care_prescription_drugs;
create policy "care_rx_drugs_member_select" on public.care_prescription_drugs
  for select using (
    exists (
      select 1 from public.care_prescriptions p
      where p.id = care_prescription_drugs.prescription_id
        and public.can_access_care_subject(p.subject_id)
    )
  );

-- -------------------------------------------------------------
-- 4. Storage 버킷 (private — 민감 건강정보)
-- -------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('care-rx', 'care-rx', false)
on conflict (id) do nothing;

-- 경로 규칙: {uploader_id}/rx/{...}  (media-upload.js makePath와 동일)
drop policy if exists "care_rx_storage_owner_select" on storage.objects;
create policy "care_rx_storage_owner_select"
  on storage.objects for select
  using (
    bucket_id = 'care-rx'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "care_rx_storage_owner_insert" on storage.objects;
create policy "care_rx_storage_owner_insert"
  on storage.objects for insert
  with check (
    bucket_id = 'care-rx'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "care_rx_storage_owner_delete" on storage.objects;
create policy "care_rx_storage_owner_delete"
  on storage.objects for delete
  using (
    bucket_id = 'care-rx'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- -------------------------------------------------------------
-- 5. 30일 자동삭제 (민감정보 최소보관 원칙)
--    원본 이미지 + 처방전 레코드를 30일 후 파기.
--    pg_cron 사용 가능 시 아래 스케줄을 등록한다(수동 1회).
--      select cron.schedule('purge-care-rx', '0 3 * * *',
--        $$ select public.purge_old_prescriptions() $$);
--    pg_cron 미사용 시 Edge Function/외부 스케줄러에서 RPC로 호출.
-- -------------------------------------------------------------
create or replace function public.purge_old_prescriptions(p_days int default 30)
returns int
language plpgsql
security definer
set search_path = public, storage
as $$
declare
  v_count int;
  v_paths text[];
begin
  select array_agg(storage_path) into v_paths
  from public.care_prescriptions
  where created_at < now() - make_interval(days => p_days);

  -- 스토리지 오브젝트 삭제 (경로 매칭)
  if v_paths is not null then
    delete from storage.objects
    where bucket_id = 'care-rx' and name = any(v_paths);
  end if;

  delete from public.care_prescriptions
  where created_at < now() - make_interval(days => p_days);
  get diagnostics v_count = row_count;

  return v_count;
end;
$$;


-- ===== 20260524_care_guides.sql =====
-- =============================================================
-- 케어링 처방전 분석 2차 — 케어 가이드 콘텐츠
--   약물 적응증 → "추정 관리 영역(category)" → 식이·영양·일상케어 가이드
--
-- ⚠️ 진단·치료법이 아니라 일반 건강정보(생활관리)다. AI 생성이 아닌
--    큐레이션 콘텐츠로 관리해 출처·검수가 가능하도록 한다.
--    아래 시드는 **예시**이며, 운영 전 의료/영양 전문가 검수가 필요하다.
-- 20260524_care_prescriptions.sql 이후 실행.
-- =============================================================

create table if not exists public.care_guides (
  id             uuid primary key default gen_random_uuid(),
  category       text not null unique,   -- 'hypertension', 'diabetes' ...
  category_label text not null,          -- '고혈압'
  summary        text,                   -- 한 줄 설명
  foods_avoid    text,                   -- 피해야 할 음식 (줄바꿈 구분)
  nutrition      text,                   -- 권장 영양·식이
  daily_care     text,                   -- 일상 케어·생활관리
  source         text,                   -- 출처
  is_published   boolean default true,
  sort_order     int default 0,
  created_at     timestamptz default now(),
  updated_at     timestamptz default now()
);

alter table public.care_guides enable row level security;

-- 일반 건강정보 — 인증 사용자 누구나 조회(공개), 쓰기는 관리자/서비스만
drop policy if exists "care_guides_public_read" on public.care_guides;
create policy "care_guides_public_read" on public.care_guides
  for select using (is_published = true);

-- -------------------------------------------------------------
-- 시드 (예시 — 운영 전 전문가 검수 필요)
--   내용은 공공 보건기관에서 널리 권고되는 일반적 생활관리 수준으로 제한.
--   category UNIQUE + on conflict 로 재실행 시 중복 없음.
-- -------------------------------------------------------------
insert into public.care_guides
  (category, category_label, summary, foods_avoid, nutrition, daily_care, source, sort_order)
values
  ('hypertension', '고혈압',
   '혈압 관리를 돕는 약이 포함되어 있어요. 나트륨 조절과 규칙적인 생활이 도움이 됩니다.',
   E'· 국·찌개·젓갈·장아찌 등 짠 음식\n· 라면·가공육(햄·소시지)·인스턴트 식품\n· 과도한 카페인·음주',
   E'· 나트륨 줄이기(국물 적게, 저염 조리)\n· 채소·과일·통곡물 충분히\n· 칼륨이 풍부한 식품(바나나·감자·시금치)\n· 등푸른 생선 등 건강한 지방',
   E'· 매일 같은 시간 혈압 측정·기록\n· 가벼운 유산소 운동(걷기 등)\n· 금연·절주, 충분한 수면\n· 처방약은 거르지 않고 규칙적으로',
   '질병관리청·대한고혈압학회 일반 권고 기반', 10),

  ('diabetes', '당뇨',
   '혈당 관리를 돕는 약이 포함되어 있어요. 식사 시간과 탄수화물 조절이 중요합니다.',
   E'· 설탕·꿀·시럽이 많은 음식, 단 음료\n· 흰쌀밥·흰빵 등 정제 탄수화물 과다\n· 과일주스·가당 음료',
   E'· 일정한 식사 시간·양 유지\n· 통곡물·잡곡, 식이섬유 풍부한 채소\n· 단백질(두부·생선·계란) 적정량\n· 천천히 골고루 먹기',
   E'· 공복·식후 혈당 측정·기록\n· 식후 가벼운 산책\n· 발 상처 관찰(당뇨발 예방)\n· 저혈당 증상(식은땀·어지럼) 시 즉시 당분 보충',
   '질병관리청·대한당뇨병학회 일반 권고 기반', 20),

  ('dyslipidemia', '고지혈증·이상지질',
   '콜레스테롤·중성지방 관리를 돕는 약이 포함되어 있어요. 지방의 종류 선택이 핵심입니다.',
   E'· 삼겹살·곱창 등 포화지방\n· 튀김·과자·마가린 등 트랜스지방\n· 내장류·계란 노른자 과다 섭취',
   E'· 등푸른 생선(고등어·연어)의 불포화지방\n· 견과류·올리브유 적정량\n· 채소·과일·통곡물의 식이섬유\n· 콩·두부 등 식물성 단백질',
   E'· 규칙적인 유산소 운동\n· 적정 체중 유지\n· 정기적인 지질 검사\n· 금연·절주',
   '질병관리청·대한심장학회 일반 권고 기반', 30),

  ('bone_joint', '관절·뼈 건강',
   '관절·뼈 건강과 관련된 약이 포함되어 있어요. 칼슘·비타민D와 적절한 활동이 도움이 됩니다.',
   E'· 짠 음식(칼슘 배출 증가)\n· 과도한 카페인·탄산음료\n· 과음',
   E'· 칼슘 식품(우유·요거트·멸치·두부)\n· 비타민D(햇볕·등푸른 생선)\n· 단백질 충분히\n· 채소·과일',
   E'· 무리하지 않는 범위의 규칙적 운동\n· 낙상 예방(미끄럼 방지·조명)\n· 적정 체중 유지\n· 통증 변화 기록',
   '질병관리청·대한골대사학회 일반 권고 기반', 40)
on conflict (category) do nothing;


-- ===== 20260525_story_format.sql =====
-- =============================================================
-- 이야기 카드 (롱폼 여정 콘텐츠) 포맷
--   오늘의집 '집들이'의 잇다 버전 — 한 사람이 한 lifecycle 단계를
--   통과한 1인칭 롱폼 여정(에세이 + 체크리스트 + 도구 CTA).
--
-- contents 테이블에 story 포맷 필드 추가. 기존 글은 모두 'article'.
-- 20260517_redesign_mvp.sql 이후 실행.
-- =============================================================

alter table public.contents
  add column if not exists format text not null default 'article'
    check (format in ('article', 'story')),
  add column if not exists cover_image_url text,
  add column if not exists excerpt text,          -- 한 줄 발췌(피드/hero 노출)
  add column if not exists checklist jsonb,        -- [{ "text": "...", "url": "선택" }]
  add column if not exists cta_label text,         -- 도구 CTA 버튼 문구
  add column if not exists cta_url text;           -- 도구 CTA 링크

-- 홈 hero: 최신 발행 story를 빠르게 찾기 위한 인덱스
create index if not exists contents_story_idx
  on public.contents (format, is_published, created_at desc);


-- ===== 20260525_inline_comments_realtime.sql =====
-- =============================================================
-- 카드 인라인 댓글(콘텐츠 직접 댓글) + 홈 피드 실시간 갱신
--
-- 1) comments가 콘텐츠를 직접 타겟할 수 있게 content_id 추가
--    (기존 comments는 community_posts(post_id) 타겟 — 유지)
-- 2) 홈 실시간 갱신을 위해 contents/reactions/comments를
--    supabase_realtime publication에 추가
-- 20260517_redesign_mvp.sql 이후 실행.
-- =============================================================

-- 1) comments: 콘텐츠 직접 댓글 지원
alter table public.comments
  add column if not exists content_id uuid references public.contents(id) on delete cascade;

alter table public.comments alter column post_id drop not null;

-- post_id 또는 content_id 중 정확히 하나만 (기존 행은 post_id만 → 통과)
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'comments_target_chk'
  ) then
    alter table public.comments
      add constraint comments_target_chk
      check ((post_id is not null) <> (content_id is not null));
  end if;
end $$;

create index if not exists comments_content_idx
  on public.comments (content_id, created_at) where content_id is not null;

-- 2) 실시간 publication 등록 (이미 등록돼 있으면 건너뜀)
do $$
declare t text;
begin
  foreach t in array array['contents','reactions','comments'] loop
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t
    ) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
exception when undefined_object then
  -- supabase_realtime publication이 없으면 무시(로컬/특수 환경)
  null;
end $$;


-- ===== 20260525_daily_questions_v2_additions.sql =====
-- 자기 성찰 질문 v2 — '가벼운 입구' 신규 문항 추가
-- 근거: docs/content/questions-100-v2.md (신규 표시 문항 28·43·44 + N1~N12)
--
-- 설계 원칙 (one-way door 안전):
--   * 비파괴: 기존 daily_questions 행과 daily_answers(답변 FK) 를 건드리지 않는다.
--   * 멱등: 동일 question_text가 이미 있으면 건너뛴다(재실행해도 중복 없음).
--   * 트랜잭션: 실패 시 전체 롤백.
--   * display_order는 현재 최대값 뒤에 순서대로 부여(기존 순서·오늘질문 RPC 불변).
-- 카테고리는 앱 enum(self/relationships/work/regret/gratitude/legacy/endings) 사용.
--
-- 참고: v2의 전체 재정렬·중복 정리·1부/2부 게이팅은 라이브 테이블 확인 후 별도 진행.
--        (이 마이그레이션은 '명백히 새로운' 가벼운 문항만 추가한다.)

begin;

with new_q(category, question_text, ord) as (
  values
    ('relationships', '한동안 연락 못 한 사람에게 오늘 안부를 보낸다면, 누구에게?', 1),
    ('work',          '첫 월급(또는 첫 일)으로 무엇을 했는지 기억하나요?', 2),
    ('work',          '오늘 일하다 ''이래서 이 일을 한다'' 싶었던 순간이 있었나요?', 3),
    ('self',          '요즘 내 플레이리스트 맨 위에 있는 노래는? 왜 그 곡인가요?', 4),
    ('self',          '오늘 내 기분을 날씨로 표현한다면?', 5),
    ('self',          '혼자 있는 시간에 나는 주로 무엇을 하나요? 그게 나에 대해 말해주는 건?', 6),
    ('gratitude',     '오늘 먹은 것 중 가장 만족스러웠던 한 끼는?', 7),
    ('gratitude',     '계절이 바뀔 때 내가 꼭 챙기는 나만의 의식이 있나요?', 8),
    ('self',          '내 몸에서 가장 마음에 드는 부분 하나는?', 9),
    ('self',          '요즘 내 몸이 나에게 보내는 신호가 있나요?', 10),
    ('self',          '최근에 ''잘 썼다'' 싶은 돈은 어디에 쓴 것이었나요?', 11),
    ('self',          '돈에 대한 나의 첫 기억은 무엇인가요?', 12),
    ('self',          '내 휴대폰 사진첩에서 가장 오래된 사진은 무엇인가요?', 13),
    ('self',          'SNS에는 절대 안 올리지만 나에게는 소중한 순간이 있나요?', 14),
    ('self',          '10년째 변하지 않는 내 취향이 있다면?', 15)
),
base as (
  select coalesce(max(display_order), 0) as max_order from public.daily_questions
)
insert into public.daily_questions (category, question_text, display_order)
select n.category, n.question_text, base.max_order + n.ord
from new_q n, base
where not exists (
  select 1 from public.daily_questions d where d.question_text = n.question_text
);

commit;
