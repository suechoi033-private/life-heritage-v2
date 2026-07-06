-- 묻다 — 유품 정리: '맡겨두기(돌봄 부탁)' 결정
-- 예: 미성년 자녀에게 물려줄 귀중품을 믿을 만한 사람에게 잠시 맡겨둔다.
-- custodian = 임시 보관인, recipient = 나중에 최종으로 받을 사람.

alter table public.mutda_belongings
  add column if not exists custodian text;
