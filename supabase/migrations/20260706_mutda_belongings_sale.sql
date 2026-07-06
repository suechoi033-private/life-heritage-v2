-- 묻다 — 유품 정리: '판매하기' 결정 + 공개 동의
-- 판매하기로 남긴 품목을 (동의 시) 공개해, 차후 사전·사후 유품정리
-- 서비스의 씨앗으로 삼는다. 아직 공개 조회 정책은 열지 않는다 —
-- 실제 서비스 설계 시 별도 결정.

alter table public.mutda_belongings
  add column if not exists public_sale boolean not null default false;
