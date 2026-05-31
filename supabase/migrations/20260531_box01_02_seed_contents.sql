-- =============================================================
-- 오늘 잇고 박스 01+02 — C 콘텐츠 23편 (잇다 에디터 큐레이션)
-- 박스: docs/content/onneul-itgo-box-01.md (C1~C12, C6 제외 → 11편)
--       docs/content/onneul-itgo-box-02.md (C13~C24 → 12편)
--
-- 설계:
--   * category='reflection' 전부 (오늘 잇고 큐레이션 흐름)
--   * author_type='official', is_published=true
--   * 멱등: 같은 title 있으면 skip
--   * 적용: Supabase SQL Editor에서 실행
-- =============================================================

begin;

insert into public.contents (category, title, body, content_type, author_type, is_published)
select 'reflection', '살아 있을 확률', $b$한 과학자는 한 인간이 살아 있을 확률을 10⁻²,⁶⁸⁵,⁰⁰⁰이라 했다. 1조 면짜리 주사위 200만 개를 동시에 던져 모두 같은 숫자가 나올 확률.

하루의 대부분 우리는 이 사실을 놓친다. 못 한 것을 자책하고, 더 가지지 못한 것을 헤아리며. 그러나 그 자책조차 살아 있어야 가능한 일이다.

*살아 있다는 것 자체가 기적이라는 말은 위로가 아니다. 통계다.*

**나에게 닿는 질문 ·** 살아 있다는 사실 하나면 충분하다고 생각한 일이 있었나요?

*출처 · 「편안함의 습격」, 마이클 이스터.*
— *잇다 한 줄*$b$, 'text', 'official', true
where not exists (select 1 from public.contents where title = '살아 있을 확률');

insert into public.contents (category, title, body, content_type, author_type, is_published)
select 'reflection', '어제의 나는 오늘의 내가 아니다', $b$몸의 약 37조 개 세포 중 매일 3,300억 개가 죽고 새로 태어난다. 7년이면 사실상 거의 모든 세포가 한 번씩 갈렸다.

그런데도 '나'라는 감각은 끊기지 않는다. 우리는 매일 같은 사람으로 깨어난다고 믿지만, 생물학적으로는 그렇지 않다.

*어쩌면 '나'는 몸이 아니라, 매 순간 자신을 이어 두려는 한 결의(決意)인지도 모른다.*

**나에게 닿는 질문 ·** 오늘 당신을 어제의 자신과 잇는 것은 무엇이었나요? 계속 남길 것과 버리고 싶은 것은 무엇인가요?

— *잇다 한 줄*$b$, 'text', 'official', true
where not exists (select 1 from public.contents where title = '어제의 나는 오늘의 내가 아니다');

insert into public.contents (category, title, body, content_type, author_type, is_published)
select 'reflection', '오늘의 한 줄을 위해 산 하루', $b$폴 리쾨르는 "우리는 인생을 살면서 동시에 그 인생의 이야기를 쓰고 있다"고 했다. 같은 하루를 어떻게 기억하느냐는 그 하루의 의미를 결정한다.

잠들기 전 단 한 줄로 오늘을 적을 수 있다면, 그 한 줄을 위해 산 것 같은 하루가 된다. 하루의 의미는 일어난 일이 아니라, 그 일을 어떤 한 문장으로 자신에게 들려주느냐에 더 가깝다.

**나에게 닿는 질문 ·** 오늘은 어떤 한 줄로 기록될까요?

— *잇다 한 줄*$b$, 'text', 'official', true
where not exists (select 1 from public.contents where title = '오늘의 한 줄을 위해 산 하루');

insert into public.contents (category, title, body, content_type, author_type, is_published)
select 'reflection', '진단 다음 날', $b$어머니가 폐암 진단을 받았다. 의사는 길어야 1년이라 했고, 어머니는 한참 묵묵히 들었다. 다음 날 어머니가 처음으로 한 말은 "베란다 꽃 화분 흙 갈아야 하는데"였다.

죽음 앞에서 사람이 가장 먼저 떠올리는 것은 가장 사소한 것일까. *어쩌면 사소함이야말로 우리가 진짜로 사랑했던 것일까?*

**나에게 닿는 질문 ·** 지금 당신이 어머니라면, 어떤 생각을 떠올릴 것 같나요. 지금 당장 해야 할 일은 무엇인가요?

— *잇다 한 줄*$b$, 'text', 'official', true
where not exists (select 1 from public.contents where title = '진단 다음 날');

insert into public.contents (category, title, body, content_type, author_type, is_published)
select 'reflection', '사라진 것의 모양', $b$어린 시절 마당에 있던 감나무가 사라졌다는 걸, 사촌이 보내준 옛 사진을 보고서야 알았다. 매일 보던 자리였는데, 매일 봤기 때문에 보지 못한 거였다.

우리는 늘 거기 있던 것의 모양을 잘 모른다. 사라진 다음에야 비로소 그 자리를 본다. 사랑도, 어떤 사람도, 어떤 시간도 그렇다.

*가장 잘 보이는 것은 잃기 직전의 모양이 아니라, 잃은 다음의 자리다.*

**나에게 닿는 질문 ·** 지금도 거기 있지만, 언젠가 사라질 것, 그러나 영원히 기억하고 싶은 것은 무엇인가요?

— *잇다 한 줄*$b$, 'text', 'official', true
where not exists (select 1 from public.contents where title = '사라진 것의 모양');

insert into public.contents (category, title, body, content_type, author_type, is_published)
select 'reflection', '내 장례식에 틀고 싶은 음악', $b$누군가 내게 물었다. "네 장례식엔 어떤 노래를 틀고 싶어?" 나는 한참 답을 못 했다.

그 질문은 사실 *"너는 어떤 사람으로 기억되고 싶어?"*의 다른 모양이었다. 우리는 매일 무수히 많은 노래를 듣지만, '내 마지막에 흐를 한 곡'을 정해본 적은 잘 없다.

그건 죽음에 대한 질문이 아니라, 내가 가장 사랑한 것에 대한 질문이다.

**나에게 닿는 질문 ·** 오늘, 당신의 마지막에 흐를 한 곡을 골라본다면?

[ ♬ 나의 장례식 플레이리스트에서 한 곡 골라두기 → ](./my-song.html)

— *잇다 한 줄*$b$, 'text', 'official', true
where not exists (select 1 from public.contents where title = '내 장례식에 틀고 싶은 음악');

insert into public.contents (category, title, body, content_type, author_type, is_published)
select 'reflection', '사별 후 1년, 다시 웃은 날', $b$어머니를 보낸 지 1년이 지난 어느 봄, 친구의 농담에 나도 모르게 웃었다. 웃고 나서 울었다.

웃은 게 미안해서 운 게 아니었다. *다시 웃을 수 있는 내가 낯설어서* 운 거였다.

슬픔은 끝나지 않는다. 다만 슬픔 옆에 살아갈 자리가 천천히 생긴다. 어떤 날은 슬픔이 더 넓고, 어떤 날은 그 옆자리가 더 넓을 뿐이다.

**나에게 닿는 질문 ·** 슬픔 옆에 자리를 내어 본 순간이 있다면, 언제였나요?

— *잇다 한 줄*$b$, 'text', 'official', true
where not exists (select 1 from public.contents where title = '사별 후 1년, 다시 웃은 날');

insert into public.contents (category, title, body, content_type, author_type, is_published)
select 'reflection', '누군가의 마지막 문장', $b$외할머니가 마지막으로 남긴 말은 "그 호박전 좀 부쳐 먹어라"였다. 거창한 유언이 아니었다.

가장 사소한 한 마디가 가장 오래 남는다. 그 호박전의 맛은 잊었지만, 그 말은 30년이 지난 지금도 가족 식탁에서 가끔 인용된다.

*우리가 남기는 것은 결국 한 문장일지도 모른다. 가르치려 한 말이 아니라, 그냥 무심히 한 한 마디. 사랑은 그 무심함 속에 가장 잘 살아남는다.*

**나에게 닿는 질문 ·** 당신이 한 마디 남긴다면, 어떤 말 일까요?

— *잇다 한 줄*$b$, 'text', 'official', true
where not exists (select 1 from public.contents where title = '누군가의 마지막 문장');

insert into public.contents (category, title, body, content_type, author_type, is_published)
select 'reflection', '유언장 한 줄', $b$호스피스 의사 BJ Miller는 "유언장은 죽음을 위한 게 아니라 살아 있는 사람들을 위한 것"이라 말했다.

유언장의 첫 줄을 지금 쓴다면, 우리는 자신이 가장 중요하게 여기는 것을 한 번 더 마주하게 된다.

*그 한 줄은 오늘 그대로 살아도 부끄럽지 않은 한 줄이어야 한다. 그래야 유언장은 미래의 짐이 아니라 현재의 거울이 된다.*

**나에게 닿는 질문 ·** 오늘 유언을 남긴다면, 첫 줄을 어떻게 시작할까요?

— *잇다 한 줄*$b$, 'text', 'official', true
where not exists (select 1 from public.contents where title = '유언장 한 줄');

insert into public.contents (category, title, body, content_type, author_type, is_published)
select 'reflection', '사전연명의료의향서를 등록한 날', $b$어머니가 사전연명의료의향서에 서명한 날, 우리는 함께 밥을 먹었다. 어머니는 평소처럼 농담을 했다.

그날 나는 처음으로 알았다. *죽음을 미리 말한다는 것이 무거움이 아니라, 살아 있는 시간을 더 또렷이 만든다는 것을.*

사전 의향서를 쓴다는 건 죽음을 준비하는 일이 아니다. 가족에게 무거운 결정을 떠넘기지 않겠다는, 가장 사려 깊은 형태의 사랑이다.

**나에게 닿는 질문 ·** 사랑하는 사람에게 미리 남겨두고 싶은 결정이 있나요?

— *잇다 한 줄*$b$, 'text', 'official', true
where not exists (select 1 from public.contents where title = '사전연명의료의향서를 등록한 날');

insert into public.contents (category, title, body, content_type, author_type, is_published)
select 'reflection', '마지막 자리에서 가장 흔한 후회', $b$호주의 호스피스 간호사 브로니 웨어는 수많은 환자의 마지막을 곁에서 돌보며, 그들이 가장 흔하게 후회한 한 가지를 책으로 남겼다.

*"나 자신에게 진실한 삶을 살았더라면. 남이 기대하는 모습이 아니라."*

이 후회는 다른 어떤 후회보다도 더 자주, 더 깊게 마지막 순간의 환자들이 흘린 한 문장이었다. 더 가진 것도, 더 이룬 것도, 더 많이 일한 것도 아니었다.

*결국 우리에게 마지막으로 남는 것은 자기다움이다.*

**나에게 닿는 질문 ·** 오늘, 당신이 가장 '나답게' 산 한 순간은 언제였나요?

*출처 · 「The Top Five Regrets of the Dying」, Bronnie Ware.*
— *잇다 한 줄*$b$, 'text', 'official', true
where not exists (select 1 from public.contents where title = '마지막 자리에서 가장 흔한 후회');

-- ===== Box 02 =====

insert into public.contents (category, title, body, content_type, author_type, is_published)
select 'reflection', '잇기, 가장 작은 형태의 사랑', $b$메시지 한 통. 안부 전화 한 번. 사진 한 장.

우리는 매일 무수한 것을 끊고 잇는다. '잇다(連)'는 거창한 단어 같지만, 사실 가장 작은 동작이다. 누군가의 안부를 한 번 더 떠올리는 것, 어제의 나와 오늘의 나를 한 줄로 묶는 것.

*잇다는 사랑의 가장 사소한 모양이다. 사소함을 지키는 일이 결국 한 사람을, 한 가족을, 한 삶을 만든다.*

**나에게 닿는 질문 ·** 오늘, 당신이 잇기로 한 가장 작은 것 하나는 무엇인가요?

— *잇다 한 줄*$b$, 'text', 'official', true
where not exists (select 1 from public.contents where title = '잇기, 가장 작은 형태의 사랑');

insert into public.contents (category, title, body, content_type, author_type, is_published)
select 'reflection', '손 한 번 잡았던', $b$평생 단 한 번, 친구의 손을 가만히 잡고 운 적이 있다. 우리는 그 순간을 잘 말하지 않지만, 가장 자주 떠올린다.

말로 할 수 없는 일들은 종종 손이 대신해 준다. 어떤 위로는 입이 아니라 손바닥에서 온다.

*가장 무거운 마음은 가장 작은 동작에 담긴다.*

**나에게 닿는 질문 ·** 마지막으로 누군가의 손을 가만히 잡았던 게 언제인가요?

— *잇다 한 줄*$b$, 'text', 'official', true
where not exists (select 1 from public.contents where title = '손 한 번 잡았던');

insert into public.contents (category, title, body, content_type, author_type, is_published)
select 'reflection', '사소함이 회복이다', $b$큰 슬픔 뒤에 처음 웃는 곳은 보통 사소한 자리다. 김치 한 조각이 짠 것. 친구의 이상한 농담. 길에서 본 강아지의 비뚤어진 걸음.

회복은 거대한 사건으로 오지 않는다. *사소함이 다시 사소함으로 느껴지는 순간*에 온다.

일상이 다시 평범해진다는 것은, 어느 날엔 기적이다.

**나에게 닿는 질문 ·** 최근 가장 사소했던 좋음 한 가지는 무엇이었나요?

— *잇다 한 줄*$b$, 'text', 'official', true
where not exists (select 1 from public.contents where title = '사소함이 회복이다');

insert into public.contents (category, title, body, content_type, author_type, is_published)
select 'reflection', '안부, 그 짧은 단어', $b$'안부를 묻다'는 한국어에서 가장 짧고 무거운 단어다. *"잘 지내?"* 라고 묻는 게 사실 가장 어려운 질문이다.

우리는 다 안 괜찮으면서 잘 지낸다고 답한다. 그 거짓말이 어떤 날엔 한 사람을 살린다.

*안부는 진실의 교환이 아니라, 마음의 약속이다. 너를 기억하고 있다는, 가장 짧은 형태의 약속.*

**나에게 닿는 질문 ·** 오늘, 안부를 묻고 싶은 한 사람이 있다면 누구인가요?

— *잇다 한 줄*$b$, 'text', 'official', true
where not exists (select 1 from public.contents where title = '안부, 그 짧은 단어');

insert into public.contents (category, title, body, content_type, author_type, is_published)
select 'reflection', '옛 사진 속의 나', $b$10년 전 사진을 꺼냈다. 그때의 나는 지금의 내가 가진 답을 하나도 몰랐다. 그런데도 웃고 있었다.

답을 몰라도 우리는 살아진다는 게 위로다. 모르는 채로도 충분히 살 수 있다는 사실은, 답을 찾지 못한 오늘에 가장 큰 격려가 된다.

*오늘의 답이 없어도 괜찮은 이유는, 10년 전의 나도 답이 없었다는 것이다.*

**나에게 닿는 질문 ·** 10년 전의 나에게 한 줄 보낸다면, 무어라 쓰시겠어요?

— *잇다 한 줄*$b$, 'text', 'official', true
where not exists (select 1 from public.contents where title = '옛 사진 속의 나');

insert into public.contents (category, title, body, content_type, author_type, is_published)
select 'reflection', '잊었던 노래', $b$라디오에서 갑자기 흘러나온 노래. 가사를 잊은 줄 알았는데, 후렴이 입에서 자연스럽게 흘러나왔다.

우리가 기억하는 것보다 몸이 기억하는 게 많다. *회복은 종종 머리가 아니라 몸이 먼저 알아챈다.* 노래의 후렴이 그것을 알려준다.

오늘 우연히 떠오른 한 곡이 있다면, 그건 당신의 몸이 보낸 신호다.

**나에게 닿는 질문 ·** 오늘 우연히 떠오른 노래 한 곡이 있나요?

— *잇다 한 줄*$b$, 'text', 'official', true
where not exists (select 1 from public.contents where title = '잊었던 노래');

insert into public.contents (category, title, body, content_type, author_type, is_published)
select 'reflection', '다시 만든 아침', $b$일이 무너진 뒤에도 아침은 왔다. 처음엔 그게 잔인했고, 지금은 그게 고맙다.

회복의 첫 의식은 거창하지 않다. *어제와 같은 시간에 일어나는 일.* 같은 컵에 커피를 따르는 일. 같은 창으로 빛을 보는 일.

아침을 다시 짓는다는 건, 자신을 다시 짓는 일이다.

**나에게 닿는 질문 ·** 회복기에 가장 도움이 됐던 아침 의식 하나가 있다면?

— *잇다 한 줄*$b$, 'text', 'official', true
where not exists (select 1 from public.contents where title = '다시 만든 아침');

insert into public.contents (category, title, body, content_type, author_type, is_published)
select 'reflection', '익숙해진 슬픔', $b$1년이 지난 슬픔은 익숙해진다. 그게 사라진 게 아니라, 함께 사는 법을 배운 거다.

슬픔은 끝나지 않지만 자리를 좁힌다. 그 옆자리에 다시 다른 것이 들어올 공간이 생긴다. *생활이, 노래가, 친구의 농담이, 새 책이.*

익숙해진다는 것은 작별이 아니라, 동거의 시작이다.

**나에게 닿는 질문 ·** 슬픔 옆에 다시 자리 잡은 한 가지는 무엇인가요?

— *잇다 한 줄*$b$, 'text', 'official', true
where not exists (select 1 from public.contents where title = '익숙해진 슬픔');

insert into public.contents (category, title, body, content_type, author_type, is_published)
select 'reflection', '다시 좋아진 음악', $b$한동안 어떤 음악도 좋지 않았다. 그러던 어느 봄날, 차 안에서 노래 한 곡에 콧등이 시큰했다.

회복을 알리는 신호는 종종 음악으로 온다. *다시 음악이 들리는 날이, 마음이 다시 열리는 날이다.*

그 한 곡을 잘 기억해 두면, 그게 자신의 회복기 첫 표지가 된다.

**나에게 닿는 질문 ·** 최근 다시 좋아진 노래가 있다면, 무엇인가요?

— *잇다 한 줄*$b$, 'text', 'official', true
where not exists (select 1 from public.contents where title = '다시 좋아진 음악');

insert into public.contents (category, title, body, content_type, author_type, is_published)
select 'reflection', '새로 산 물건 하나', $b$1년 만에 새 컵 하나를 샀다. 별 의미 없는 컵이지만, 새것을 살 마음이 생긴 게 자기다.

회복은 거대한 결심에 깃들지 않는다. *새 물건을 사는 마음, 새 책을 펴는 손, 새 친구에게 처음 인사하는 입에 깃든다.*

작은 새것이 큰 결심보다 크다.

**나에게 닿는 질문 ·** 최근 새로 사거나 갖고 싶었던 작은 것 하나는?

— *잇다 한 줄*$b$, 'text', 'official', true
where not exists (select 1 from public.contents where title = '새로 산 물건 하나');

insert into public.contents (category, title, body, content_type, author_type, is_published)
select 'reflection', '다시 만난 친구', $b$5년 만에 만난 친구가 첫 마디로 "너 그대로다"라고 했다. 변한 게 많은데, 그 말이 마음에 들었다.

*시간이 지나도 같은 자리에 서 있는 사람이 있다는 건 큰 행운이다.* 변하지 않은 한 사람이 있으면, 변한 나도 나로 살 수 있다.

오래 자리를 지킨 한 사람이 결국 우리를 자기답게 만든다.

**나에게 닿는 질문 ·** 오랫동안 같은 자리에 있는 한 사람이 있다면, 누구인가요?

— *잇다 한 줄*$b$, 'text', 'official', true
where not exists (select 1 from public.contents where title = '다시 만난 친구');

insert into public.contents (category, title, body, content_type, author_type, is_published)
select 'reflection', '오늘부터 다른 한 줄', $b$지난 1년을 한 줄로 적어보라면 '버틴 해'라 적었을 거다. 올해는 다른 한 줄을 적고 싶다.

같은 하루를 어떻게 쓰느냐가 다른 한 해를 만든다. *오늘의 한 줄이 1년의 결을 정한다.*

오늘부터 적는 한 줄이, 내년의 표지가 된다.

**나에게 닿는 질문 ·** 오늘부터 적고 싶은 새 한 줄은 무엇인가요?

— *잇다 한 줄*$b$, 'text', 'official', true
where not exists (select 1 from public.contents where title = '오늘부터 다른 한 줄');

commit;
