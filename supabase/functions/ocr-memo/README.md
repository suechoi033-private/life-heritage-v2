# ocr-memo — 손글씨 케어 메모 판독 Edge Function

타이핑이 어려운 보호자가 손으로 쓴 **돌봄 일지 메모**를 사진으로 찍으면,
Claude Vision으로 글자를 옮겨 적어(전사) 케어링 기록의 칸을 자동으로 채워준다.
사용자는 내용을 확인하고 **[저장]만** 누르면 된다.

> 배경: 치매 배우자를 돌보며 매일 수기 메모를 작성해 카톡으로 자녀에게
> 공유하시는 어르신 같은 분들을 위한 기능. 타이핑 장벽을 없앤다.

> ⚠️ 의학적 판단·진단이 아니라 **글자 옮겨적기(전사)**다. 내용을 지어내지 않는다.
> 결과는 사용자가 저장 전에 직접 확인·수정한다.

## 동작

1. 호출자 JWT 검증 (ANTHROPIC 키 남용 방지)
2. 요청 본문의 base64 이미지를 Claude Vision으로 판독
3. 손글씨 원문(`transcription`)을 그대로 옮기고, 내용을 케어 기록 칸(식사·약·기분·병원·유의점·영양·자유메모)으로 분류
4. JSON 반환 — **DB·스토리지에 아무것도 저장하지 않는다**(전사만 수행). 원본 사진을 남기고 싶으면 프런트가 기록의 사진으로 함께 첨부한다.

## 시크릿 설정

```bash
# Anthropic API 키 (Claude Vision) — analyze-rx와 동일 키 재사용 가능
supabase secrets set ANTHROPIC_API_KEY="sk-ant-..."
```

`SUPABASE_URL`, `SUPABASE_ANON_KEY` 는 자동 주입.

## 배포

```bash
supabase functions deploy ocr-memo
```

## 호출 (프런트)

```js
const { data, error } = await supabase.functions.invoke('ocr-memo', {
  body: { image: base64NoPrefix, media_type: 'image/jpeg' },
});
// data: { ok: true, transcription: "…", fields: { daily_status, medications, emotion, hospital_visit, cautions, nutrition, free_memo } }
```

`js/memo-ocr.js` 의 `ocrMemo(file)` 가 이미지 압축·인코딩·호출을 감싼다.
