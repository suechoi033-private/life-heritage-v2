# analyze-rx — 처방전 분석 Edge Function

처방전 사진을 OCR(Claude Vision)로 판독해 약물명을 추출하고, 식약처
**의약품개요정보(e약은요)** API로 효능·용법·주의·상호작용을 조회해 저장한다.

> ⚠️ 의학적 진단이 아니라 **정보 제공**이다. 결과를 보여주는 모든 화면에
> "참고용, 의사·약사와 상담" 디스클레이머를 반드시 노출한다.

## 사전 준비 (마이그레이션)

`supabase/migrations/20260524_care_prescriptions.sql` 를 먼저 적용한다.
(테이블·RLS·`care-rx` 버킷·`can_access_care_subject`·`purge_old_prescriptions` 생성)

## 시크릿 설정

```bash
# 공공데이터포털(data.go.kr)에서 "의약품개요정보(e약은요)" 활용신청 후 발급된
# 일반 인증키(Encoding). URL 인코딩된 값을 그대로 넣는다.
supabase secrets set DATA_GO_KR_KEY="발급키"

# Anthropic API 키 (Claude Vision OCR)
supabase secrets set ANTHROPIC_API_KEY="sk-ant-..."
```

`SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` 는 자동 주입.

## 배포

```bash
supabase functions deploy analyze-rx
```

## 호출 (프런트)

```js
const { data, error } = await supabase.functions.invoke('analyze-rx', {
  body: { prescription_id },
});
// data: { ok: true, drugs: 3 }
```

## 30일 자동삭제

민감 건강정보 최소보관을 위해 30일 경과분을 파기한다. pg_cron 사용 시:

```sql
select cron.schedule('purge-care-rx', '0 3 * * *',
  $$ select public.purge_old_prescriptions() $$);
```

pg_cron 미사용 환경이면 외부 스케줄러(예: cron-job.org)에서
`purge_old_prescriptions` RPC를 매일 호출하도록 구성한다.
