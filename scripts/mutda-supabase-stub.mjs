// 묻다 e2e용 Supabase 스텁 (브라우저 ESM)
// 이 샌드박스는 이그레스 정책상 cdn.jsdelivr.net / supabase.co 접근이 막혀 있어,
// Playwright 라우팅으로 supabase-js CDN import를 이 파일로 대체한다.
// 실제 DB 스키마(정보 스키마 덤프)를 내장해, 프론트가 존재하지 않는
// 테이블/컬럼을 쓰면 즉시 throw → e2e 실패로 드러난다.
// 상태는 localStorage에 저장해 페이지 이동 간 유지.

const SCHEMA = {
  mutda_belongings: ["id","user_id","name","category","decision","recipient","note","done","created_at","public_sale"],
  mutda_checkin_alerts: ["id","user_id","triggered_at","hours_inactive","status","notified_at","resolved_at"],
  mutda_events: ["id","user_id","event","meta","created_at"],
  mutda_guardians: ["id","user_id","name","relation","phone","email","sort_order","created_at","guardian_user_id","invite_code","linked_at"],
  mutda_push_subscriptions: ["id","user_id","endpoint","p256dh_key","auth_key","user_agent","created_at"],
  mutda_notifications: ["id","user_id","kind","title","body","url","read","created_at"],
  mutda_letters: ["id","user_id","kind","recipient","body","status","created_at","updated_at","sent_at","shared_post_id"],
  mutda_pet_plans: ["id","user_id","pet_name","species","age_note","feeding","medical","vet","caretaker_name","caretaker_contact","caretaker_agreed","handover_note","created_at","updated_at"],
  mutda_post_comments: ["id","post_id","user_id","author_name","body","created_at"],
  mutda_posts: ["id","user_id","author_name","title","body","topic","is_seed","created_at"],
  mutda_profiles: ["user_id","name","birth_year","onboarding","journey_focus","has_pet","checkin_enabled","checkin_threshold_hours","share_location","last_active_at","last_lat","last_lng","last_location_at","streak_days","last_visit_date","created_at","updated_at"],
  mutda_will_answers: ["user_id","question_key","answer","updated_at"],
  mutda_will_revisions: ["id","will_id","user_id","version","body","created_at"],
  mutda_wills: ["id","user_id","body","version","status","handwritten_at","notarized_at","created_at","updated_at"],
};

const RPCS = ['mutda_heartbeat', 'mutda_guardian_preview', 'mutda_link_guardian', 'mutda_letters_stats'];
const LS_KEY = 'mutda-stub-state';

function seedState() {
  const now = new Date().toISOString();
  return {
    user: null,
    tables: {
      mutda_posts: [
        { id: 'seed-1', user_id: null, author_name: '묻다 팀', title: '아버지의 서랍을 정리하며 알게 된 것', body: '아버지가 떠나신 뒤 서랍을 열었을 때, 저는 아무것도 몰랐습니다. 준비는 남는 사람을 위한 일이구나 생각했습니다.', topic: 'belongings', is_seed: true, created_at: now },
        { id: 'seed-2', user_id: null, author_name: '묻다 팀', title: '감사의 말은 미리 전할 때 가장 힘이 셉니다', body: '가장 많이 남아 있는 건 물건이 아니라, 전하지 못한 말이었습니다.', topic: 'letter', is_seed: true, created_at: now },
      ],
    },
  };
}

let state = (() => {
  try { return JSON.parse(localStorage.getItem(LS_KEY)) || seedState(); }
  catch { return seedState(); }
})();
const save = () => localStorage.setItem(LS_KEY, JSON.stringify(state));
const rows = (t) => (state.tables[t] ||= []);

function checkTable(t) {
  if (!SCHEMA[t]) throw new Error(`[stub] 존재하지 않는 테이블: ${t}`);
}
function checkCols(t, obj) {
  for (const k of Object.keys(obj)) {
    if (!SCHEMA[t].includes(k)) throw new Error(`[stub] ${t}에 없는 컬럼: ${k}`);
  }
}
function checkSelect(t, cols) {
  if (!cols || cols === '*') return;
  cols.split(',').map(s => s.trim()).forEach(c => {
    if (c && c !== '*' && !SCHEMA[t].includes(c)) throw new Error(`[stub] ${t}에 없는 컬럼 select: ${c}`);
  });
}

function withDefaults(t, row) {
  const r = { ...row };
  const has = (c) => SCHEMA[t].includes(c);
  if (has('id') && r.id == null) r.id = crypto.randomUUID();
  const now = new Date().toISOString();
  if (has('created_at') && r.created_at == null) r.created_at = now;
  if (has('updated_at') && r.updated_at == null) r.updated_at = now;
  if (t === 'mutda_letters' && r.status == null) r.status = 'draft';
  if (t === 'mutda_wills') { r.status ??= 'draft'; r.version ??= 1; }
  if (t === 'mutda_belongings') { r.decision ??= 'undecided'; r.done ??= false; }
  if (t === 'mutda_guardians') {
    r.sort_order ??= 0;
    r.invite_code ??= Math.random().toString(16).slice(2, 14);
  }
  if (t === 'mutda_notifications') r.read ??= false;
  if (t === 'mutda_profiles') {
    r.checkin_enabled ??= false; r.checkin_threshold_hours ??= 18;
    r.share_location ??= false; r.streak_days ??= 1;
    r.last_visit_date ??= now.slice(0, 10); r.last_active_at ??= now;
  }
  return r;
}

class Query {
  constructor(table) {
    checkTable(table);
    this.t = table; this.filters = []; this.orders = []; this.lim = null;
    this.op = 'select'; this.payload = null; this.wantRows = false;
    this.head = false; this.countMode = null; this.singleMode = null;
  }
  select(cols = '*', opts = {}) {
    checkSelect(this.t, cols);
    if (this.op === 'select') { this.head = !!opts.head; this.countMode = opts.count || null; }
    else this.wantRows = true;
    return this;
  }
  eq(col, val) {
    if (!SCHEMA[this.t].includes(col)) throw new Error(`[stub] ${this.t}에 없는 컬럼 eq: ${col}`);
    this.filters.push([col, val]); return this;
  }
  order(col, opts = {}) { this.orders.push([col, opts.ascending !== false]); return this; }
  limit(n) { this.lim = n; return this; }
  maybeSingle() { this.singleMode = 'maybe'; return this; }
  single() { this.singleMode = 'strict'; return this; }
  insert(p) { this.op = 'insert'; this.payload = p; return this; }
  update(p) { this.op = 'update'; this.payload = p; return this; }
  upsert(p) { this.op = 'upsert'; this.payload = p; return this; }
  delete() { this.op = 'delete'; return this; }

  _match(r) { return this.filters.every(([c, v]) => r[c] === v); }

  _run() {
    const t = this.t;
    if (this.op === 'insert' || this.op === 'upsert') {
      const list = Array.isArray(this.payload) ? this.payload : [this.payload];
      const out = [];
      for (const p of list) {
        checkCols(t, p);
        if (this.op === 'upsert') {
          // PK 기준 병합 (will_answers 등 복합키는 user_id+question_key)
          const keyCols = t === 'mutda_will_answers' ? ['user_id', 'question_key']
            : SCHEMA[t].includes('id') ? ['id'] : ['user_id'];
          const found = rows(t).find(r => keyCols.every(k => p[k] != null && r[k] === p[k]));
          if (found) { Object.assign(found, p); out.push(found); continue; }
        }
        const r = withDefaults(t, p);
        rows(t).push(r); out.push(r);
      }
      save();
      return out;
    }
    if (this.op === 'update') {
      checkCols(t, this.payload);
      const out = rows(t).filter(r => this._match(r));
      out.forEach(r => Object.assign(r, this.payload));
      save();
      return out;
    }
    if (this.op === 'delete') {
      const keep = rows(t).filter(r => !this._match(r));
      const out = rows(t).filter(r => this._match(r));
      state.tables[t] = keep; save();
      return out;
    }
    let out = rows(t).filter(r => this._match(r));
    for (const [c, asc] of [...this.orders].reverse()) {
      out = [...out].sort((a, b) => (a[c] < b[c] ? -1 : a[c] > b[c] ? 1 : 0) * (asc ? 1 : -1));
    }
    if (this.lim != null) out = out.slice(0, this.lim);
    return out;
  }

  then(resolve, reject) {
    try {
      const out = this._run();
      if (this.op === 'select' && this.head) return resolve({ count: out.length, data: null, error: null });
      let data = out;
      if (this.singleMode) {
        data = out[0] ?? null;
        if (this.singleMode === 'strict' && !data)
          return resolve({ data: null, error: { message: '[stub] single(): no rows' } });
      }
      resolve({ data, error: null, count: this.countMode ? out.length : undefined });
    } catch (e) { reject ? reject(e) : console.error(e); throw e; }
  }
}

function makeUser(email, name) {
  return { id: 'e87c1246-53e8-4927-b6eb-184c740e2462', email, user_metadata: { name: name || '테스트' } };
}

export function createClient() {
  return {
    auth: {
      async getUser() { return { data: { user: state.user }, error: null }; },
      async signInWithPassword({ email }) {
        state.user = makeUser(email); save();
        return { data: { user: state.user, session: {} }, error: null };
      },
      async signUp({ email, options }) {
        state.user = makeUser(email, options?.data?.name); save();
        return { data: { user: state.user, session: {} }, error: null };
      },
      async signOut() { state.user = null; save(); return { error: null }; },
    },
    from: (t) => new Query(t),
    async rpc(name, args = {}) {
      if (!RPCS.includes(name)) throw new Error(`[stub] 존재하지 않는 RPC: ${name}`);
      if (name === 'mutda_letters_stats') {
        const ls = rows('mutda_letters');
        return { data: [{ total: ls.length, sent: ls.filter(l => l.sent_at).length,
          senders: new Set(ls.map(l => l.user_id)).size }], error: null };
      }
      if (name === 'mutda_guardian_preview') {
        const g = rows('mutda_guardians').find(r => r.invite_code === args.p_code);
        if (!g) return { data: [], error: null };
        const p = rows('mutda_profiles').find(r => r.user_id === g.user_id);
        return { data: [{ user_name: p?.name || '묻다 사용자', guardian_name: g.name, already_linked: !!g.guardian_user_id }], error: null };
      }
      if (name === 'mutda_link_guardian') {
        if (!state.user) return { data: null, error: { message: '로그인이 필요합니다' } };
        const g = rows('mutda_guardians').find(r => r.invite_code === args.p_code);
        if (!g) return { data: null, error: { message: '유효하지 않은 초대예요' } };
        if (g.user_id === state.user.id) return { data: null, error: { message: '자기 자신을 보호자로 연결할 수 없어요' } };
        g.guardian_user_id = state.user.id; g.linked_at = new Date().toISOString(); save();
        const p = rows('mutda_profiles').find(r => r.user_id === g.user_id);
        return { data: [{ user_name: p?.name || '묻다 사용자', guardian_name: g.name }], error: null };
      }
      if (name === 'mutda_heartbeat' && state.user) {
        const p = rows('mutda_profiles').find(r => r.user_id === state.user.id);
        if (p) {
          p.last_active_at = new Date().toISOString();
          if (args.p_lat != null) { p.last_lat = args.p_lat; p.last_lng = args.p_lng; p.last_location_at = p.last_active_at; }
        }
        rows('mutda_checkin_alerts').forEach(a => {
          if (a.user_id === state.user.id && a.status !== 'resolved') {
            a.status = 'resolved'; a.resolved_at = new Date().toISOString();
          }
        });
        save();
      }
      return { data: null, error: null };
    },
  };
}
