// ─── DATA VERSION (構造変更時に上げる) ───
const DATA_VERSION = 6;

// ─── ROLE DEFINITIONS ───
const ROLES = {
  admin:         { label: '役員/管理者',     level: 5, color: '#a78bfa' },
  chief:         { label: 'チーフ',           level: 4, color: '#ff4f6a' },
  event_closer:  { label: 'イベントクローザー', level: 3, color: '#ffb347' },
  closer:        { label: 'クローザー',       level: 2, color: '#4f7cff' },
  catch:         { label: 'キャッチ',         level: 1, color: '#00e5c3' },
  refa:          { label: 'Refa営業',         level: 1, color: '#f472b6' },
  cotton_candy:  { label: 'わたあめ師',       level: 1, color: '#60a5fa' },
  hr_staff:      { label: '人財部スタッフ',   level: 1, color: '#94a3b8' },
};

// ─── DEPARTMENTS ───
const DEPTS = {
  mobile:      { label: 'モバイル事業部',            color: '#4f7cff' },
  event_promo: { label: 'イベントプロモーション部',  color: '#f472b6' },
  hr:          { label: '人財部',                    color: '#34d399' },
  executive:   { label: '役員',                      color: '#a78bfa' },
};

// ─── INITIAL USERS ───
// dept: 所属事業部
// reportType: 'mobile' | 'refa' | null（報告なし）
// jobTitle: 表示用の役職名（任意、省略時はROLESのlabelを使用）
const INITIAL_USERS = [
  // ── モバイル事業部 ──
  { id: 'u1',  name: '北村晃平',   role: 'chief',        dept: 'mobile',      reportType: 'mobile', pw: 'lamp1234' },
  { id: 'u2',  name: '立川航成',   role: 'chief',        dept: 'mobile',      reportType: 'mobile', pw: 'lamp1234' },
  { id: 'u3',  name: '黒井彪雅',   role: 'chief',        dept: 'mobile',      reportType: 'mobile', pw: 'lamp1234' },
  { id: 'u4',  name: '井出大凱',   role: 'event_closer', dept: 'mobile',      reportType: 'mobile', pw: 'lamp1234' },
  { id: 'u5',  name: '小野聖斗',   role: 'event_closer', dept: 'mobile',      reportType: 'mobile', pw: 'lamp1234' },
  { id: 'u9',  name: '木村洸稀',   role: 'closer',       dept: 'mobile',      reportType: 'mobile', pw: 'lamp1234' },
  { id: 'u10', name: '伊能直人',   role: 'closer',       dept: 'mobile',      reportType: 'mobile', pw: 'lamp1234' },
  { id: 'u11', name: '全賢鎭',     role: 'closer',       dept: 'mobile',      reportType: 'mobile', pw: 'lamp1234' },
  { id: 'u15', name: '高橋茉凜',   role: 'catch',        dept: 'mobile',      reportType: 'mobile', pw: 'lamp1234' },
  { id: 'u16', name: '有馬雄士',   role: 'catch',        dept: 'mobile',      reportType: 'mobile', pw: 'lamp1234' },
  { id: 'u17', name: '小川翔',     role: 'catch',        dept: 'mobile',      reportType: 'mobile', pw: 'lamp1234' },
  { id: 'u18', name: '亀田幸',     role: 'catch',        dept: 'mobile',      reportType: 'mobile', pw: 'lamp1234' },

  // ── イベントプロモーション部 ──
  { id: 'u20', name: '川上彩香',   role: 'refa',         dept: 'event_promo', reportType: 'refa',   pw: 'lamp1234' },
  { id: 'u21', name: '⽯原玲奈',   role: 'refa',         dept: 'event_promo', reportType: 'refa',   pw: 'lamp1234' },
  { id: 'u22', name: '長涼香',   role: 'refa',         dept: 'event_promo', reportType: 'refa',   pw: 'lamp1234' },
  { id: 'u24', name: '梅田莉津夢', role: 'cotton_candy', dept: 'event_promo', reportType: null,     pw: 'lamp1234' },
  { id: 'u25', name: '瀬之口百合香', role: 'cotton_candy', dept: 'event_promo', reportType: null,     pw: 'lamp1234' },

  // ── 人財部 ──
  { id: 'u26', name: '廣瀬',     role: 'admin',    dept: 'hr', reportType: null, jobTitle: 'IT / イベントCL',  email: 't.hirose@lumpcore.co.jp', pw: 'lamp1234' },
  { id: 'u27', name: '三瓶久',   role: 'hr_staff', dept: 'hr', reportType: null, jobTitle: '総務',              pw: 'lamp1234' },
  { id: 'u28', name: '吉田悠人',   role: 'hr_staff', dept: 'hr', reportType: null, jobTitle: '採用',              pw: 'lamp1234' },
  { id: 'u29', name: '岩淵由佳',   role: 'hr_staff', dept: 'hr', reportType: null, jobTitle: '採用',              pw: 'lamp1234' },
  { id: 'u30', name: '渡合広明', role: 'hr_staff', dept: 'hr', reportType: null, jobTitle: 'チーフトレーナー', pw: 'lamp1234' },
  { id: 'u31', name: '堤拓樹', role: 'hr_staff', dept: 'hr', reportType: null, jobTitle: 'IT / 総務',        pw: 'lamp1234' },

  // ── 役員 ──
  { id: 'u32', name: '森崎隆介', role: 'admin', dept: 'executive', reportType: null, pw: 'lamp1234' },
  { id: 'u33', name: '鈴木克友', role: 'admin', dept: 'executive', reportType: null, pw: 'lamp1234' },
  { id: 'u34', name: '蜂谷伸之助', role: 'admin', dept: 'executive', reportType: null, pw: 'lamp1234' },
  { id: 'u35', name: '川喜多航', role: 'admin', dept: 'executive', reportType: null, pw: 'lamp1234' },
];

// ─── STORAGE KEYS ───
const LS = {
  users:          'lc_users',
  reports:        'lc_reports',
  targets:        'lc_targets',
  shiftSites:     'lc_shift_sites',
  shiftSchedules: 'lc_shift_schedules',
  shiftVenuePlans:'lc_venue_plans',
  talent:         'lc_talent',
  photos:         'lc_photos',
  skillTemplate:  'lc_skill_template',
  skillEval:      'lc_skill_eval',
  notifications:  'lc_notifications',
  tasks:          'lc_tasks',
  venueAchieve:   'lc_venue_achieve',
  session:        'lc_session',
  version:        'lc_version',
  shiftPlanHidden:'lc_shift_plan_hidden',
  theme:          'lc_theme',
  jobHistory:     'lc_job_history',
  interviewLogs:  'lc_interview_logs',
};

// ─── STORAGE ADAPTER ───
// Azure移行時はここだけ差し替える（data.js内の他のコードは変更不要）。
//
// 現在: localStorage（プロトタイプ用・バックエンドなし）
// 移行先: Azure Cosmos DB または Azure SQL Database
//
// 移行手順メモ:
//   1. Store.get / Store.set / Store.remove を Azure SDK 呼び出しに書き換える
//   2. 各データ関数を async/await 化する（app.js 側も await が必要）
//   3. LS のキー名をコレクション名・テーブル名に読み替える
//   4. 認証は auth.js 側で Azure Entra ID (旧Azure AD) に切り替える
//      → Microsoft 365 アカウントでのシングルサインオンが使える
//      → pw フィールドは不要になる
const Store = {
  get(key, fallback = null) {
    const v = localStorage.getItem(key);
    return v !== null ? JSON.parse(v) : fallback;
  },
  set(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  },
  remove(key) {
    localStorage.removeItem(key);
  },
};

// ─── THEME (クライアントローカル設定 — Azure移行後もlocalStorageに残す) ───
function getTheme() {
  return localStorage.getItem(LS.theme) || 'dark';
}
function setTheme(theme) {
  localStorage.setItem(LS.theme, theme);
}

// ─── INIT & MIGRATION ───
function initData() {
  const version = Store.get(LS.version, 0);

  if (version < DATA_VERSION) {
    _migrate();
    Store.set(LS.version, DATA_VERSION);
  }

  if (!Store.get(LS.reports))        Store.set(LS.reports, []);
  if (!Store.get(LS.targets))        Store.set(LS.targets, []);
  if (!Store.get(LS.shiftSites))      Store.set(LS.shiftSites, DEFAULT_SHIFT_SITES);
  if (!Store.get(LS.shiftSchedules))  Store.set(LS.shiftSchedules, buildInitialShiftSchedules());
  if (!Store.get(LS.shiftVenuePlans)) Store.set(LS.shiftVenuePlans, {});

  // MBTIサンプルデータ（未設定時のみ）
  const _mbtiSeeds = {
    u1:  { ei:{pole:'E',pct:91}, sn:{pole:'S',pct:65}, ft:{pole:'F',pct:71}, jp:{pole:'P',pct:82}, id:{pole:'A',pct:86} }, // 北村晃平 ESFP-A
    u26: { ei:{pole:'E',pct:83}, sn:{pole:'N',pct:100},ft:{pole:'F',pct:80}, jp:{pole:'P',pct:86}, id:{pole:'A',pct:58} }, // 廣瀬 ENFP-A
  };
  const _talentCards = Store.get(LS.talent, {});
  let _talentChanged = false;
  for (const [uid, mbtiData] of Object.entries(_mbtiSeeds)) {
    if (!_talentCards[uid]?.mbti) {
      _talentCards[uid] = { ...(_talentCards[uid] || {}), mbti: mbtiData, updatedAt: new Date().toISOString() };
      _talentChanged = true;
    }
  }
  if (_talentChanged) Store.set(LS.talent, _talentCards);
}

function _migrate() {
  // ── 既存ユーザーのパスワードだけ保持し、INITIAL_USERSを正とする ──
  const existingUsers = Store.get(LS.users, []);
  const pwMap = {};
  existingUsers.forEach(u => { pwMap[u.id] = u.pw; });

  // INITIAL_USERSを基準に、カスタムパスワードがあれば上書き保持
  const newUsers = INITIAL_USERS.map(u => ({
    ...u,
    pw: pwMap[u.id] || u.pw,
  }));

  Store.set(LS.users, newUsers);

  // ── 既存レポートに type フィールドを追加 ──
  const reports = Store.get(LS.reports, []);
  const migratedReports = reports.map(r => r.type ? r : { ...r, type: 'mobile' });
  Store.set(LS.reports, migratedReports);

  // ── シフトを曜日ベース→日付ベースにリセット ──
  Store.remove(LS.shiftSchedules);
}

// ─── USERS ───
function getUsers() {
  return Store.get(LS.users, []);
}
function saveUsers(users) {
  Store.set(LS.users, users);
}
function getUserById(id) {
  return getUsers().find(u => u.id === id) || null;
}
function getUserByEmail(email) {
  if (!email) return null;
  const lower = email.toLowerCase();
  // ストアのユーザーデータに email フィールドがあれば優先
  const stored = getUsers().find(u => u.email && u.email.toLowerCase() === lower);
  if (stored) return stored;
  // INITIAL_USERS で email を照合し、対応するストアのユーザーを返す（localStorage が古い場合の対応）
  const initial = INITIAL_USERS.find(u => u.email && u.email.toLowerCase() === lower);
  if (initial) return getUserById(initial.id);
  return null;
}
// 表示用の役職名（jobTitle優先、なければROLESのlabel）
function getUserDisplayRole(user) {
  return user.jobTitle || ROLES[user.role]?.label || user.role;
}

// ─── REPORTS ───
function getReports() {
  return Store.get(LS.reports, []);
}
function saveReports(reports) {
  Store.set(LS.reports, reports);
}
function addReport(report) {
  const reports = getReports();
  report.id = 'r' + Date.now();
  report.createdAt = new Date().toISOString();
  reports.push(report);
  saveReports(reports);
  return report;
}
function deleteReportById(reportId) {
  saveReports(getReports().filter(r => r.id !== reportId));
}
function getUserReportsForMonth(userId, month) {
  return getReports().filter(r => r.userId === userId && r.date.startsWith(month));
}

// ─── TARGETS ───
function getTargets() {
  return Store.get(LS.targets, []);
}
function saveTargets(targets) {
  Store.set(LS.targets, targets);
}
function getTargetForUser(userId, month) {
  return getTargets().find(t => t.userId === userId && t.month === month) || null;
}
function setMobileTarget(userId, month, mnpTarget, shinkiTarget) {
  _upsertTarget(userId, month, { mnpTarget: parseInt(mnpTarget)||0, shinkiTarget: parseInt(shinkiTarget)||0 });
}
function setRefaTarget(userId, month, amountTarget) {
  _upsertTarget(userId, month, { amountTarget: parseInt(amountTarget)||0 });
}
function _upsertTarget(userId, month, fields) {
  const targets = getTargets();
  const idx = targets.findIndex(t => t.userId === userId && t.month === month);
  if (idx >= 0) targets[idx] = { ...targets[idx], ...fields };
  else targets.push({ userId, month, ...fields });
  saveTargets(targets);
}
// 後方互換性のためのエイリアス
function setTarget(userId, month, mnpTarget, shinkiTarget) {
  setMobileTarget(userId, month, mnpTarget, shinkiTarget);
}

// ─── SHIFTS (日付ベース) ───
const DEFAULT_SHIFT_SITES = [
  'テラスモール松戸',
  'アリオ市原',
  'ユーカリが丘',
  'イオン木更津',
];

// 現場ごとの色（base.cssの配色に合わせた明度）
const SITE_COLORS = [
  { bg: 'rgba(79,124,255,.22)',  text: '#a0b8ff', border: 'rgba(79,124,255,.55)'  }, // blue
  { bg: 'rgba(167,139,250,.22)', text: '#c4b5fd', border: 'rgba(167,139,250,.55)' }, // purple
  { bg: 'rgba(52,211,153,.22)',  text: '#6ee7b7', border: 'rgba(52,211,153,.55)'  }, // green
  { bg: 'rgba(251,146,60,.22)',  text: '#fcd9a0', border: 'rgba(251,146,60,.55)'  }, // orange
  { bg: 'rgba(244,114,182,.22)', text: '#f9a8d4', border: 'rgba(244,114,182,.55)' }, // pink
  { bg: 'rgba(96,165,250,.22)',  text: '#bfdbfe', border: 'rgba(96,165,250,.55)'  }, // sky
];

function buildInitialShiftSchedules() {
  return {}; // 日付ベース: { [userId]: { [dateStr]: { site, start, end } } }
}

function getShiftSites() {
  return Store.get(LS.shiftSites) || DEFAULT_SHIFT_SITES;
}
function saveShiftSites(sites) {
  Store.set(LS.shiftSites, sites);
}
function getShiftSchedules() {
  return Store.get(LS.shiftSchedules, {});
}
function saveShiftSchedules(schedules) {
  Store.set(LS.shiftSchedules, schedules);
}

// 特定ユーザー・日付のシフトを取得
function getShiftForUser(userId, dateStr) {
  const s = getShiftSchedules();
  return s[userId]?.[dateStr] || null;
}

// 特定ユーザー・日付のシフトを保存
function setShiftForUser(userId, dateStr, data) {
  const s = getShiftSchedules();
  s[userId] = s[userId] || {};
  s[userId][dateStr] = data;
  saveShiftSchedules(s);
}

// ユーザーの月間出勤日数（休み・未設定を除く）
function getWorkingDaysCount(userId, month) {
  const s = getShiftSchedules();
  const userSched = s[userId] || {};
  return Object.entries(userSched).filter(([date, slot]) =>
    date.startsWith(month) && slot.site && slot.site !== '休み'
  ).length;
}

// 現場名 → 色オブジェクト
function getSiteColor(site) {
  const sites = getShiftSites();
  const idx = sites.indexOf(site);
  if (idx < 0 || site === '休み') return null;
  return SITE_COLORS[idx % SITE_COLORS.length];
}

// Date → 'YYYY-MM-DD'
function dateToStr(d) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}
function nthWeekdayOfMonth(year, month, weekday, nth) {
  const firstDay = new Date(year, month - 1, 1).getDay();
  const offset = (weekday - firstDay + 7) % 7;
  return 1 + offset + (nth - 1) * 7;
}

function calcVernalEquinoxDay(year) {
  return Math.floor(20.8431 + 0.242194 * (year - 1980) - Math.floor((year - 1980) / 4));
}

function calcAutumnalEquinoxDay(year) {
  return Math.floor(23.2488 + 0.242194 * (year - 1980) - Math.floor((year - 1980) / 4));
}

function isJapaneseHoliday(date) {
  const y = date.getFullYear();
  const m = date.getMonth() + 1;
  const d = date.getDate();

  if (y < 1948) return false;

  const fixed = new Set([
    '01-01', // 元日
    '02-11', // 建国記念の日
    '02-23', // 天皇誕生日
    '04-29', // 昭和の日
    '05-03', // 憲法記念日
    '05-04', // みどりの日
    '05-05', // こどもの日
    '08-11', // 山の日
    '11-03', // 文化の日
    '11-23', // 勤労感謝の日
  ]);
  if (fixed.has(`${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`)) return true;

  // ハッピーマンデー制度
  if (m === 1 && d === nthWeekdayOfMonth(y, 1, 1, 2)) return true;  // 成人の日
  if (m === 7 && d === nthWeekdayOfMonth(y, 7, 1, 3)) return true;  // 海の日
  if (m === 9 && d === nthWeekdayOfMonth(y, 9, 1, 3)) return true;  // 敬老の日
  if (m === 10 && d === nthWeekdayOfMonth(y, 10, 1, 2)) return true; // スポーツの日

  // 春分・秋分
  if (m === 3 && d === calcVernalEquinoxDay(y)) return true;
  if (m === 9 && d === calcAutumnalEquinoxDay(y)) return true;

  // 振替休日（簡易）
  if (date.getDay() === 1) {
    const prev = new Date(y, m - 1, d - 1);
    if (isJapaneseHoliday(prev)) return true;
  }

  // 国民の休日（簡易）
  const prev = new Date(y, m - 1, d - 1);
  const next = new Date(y, m - 1, d + 1);
  if (prev.getDay() !== 0 && next.getDay() !== 0 && isJapaneseHoliday(prev) && isJapaneseHoliday(next)) {
    return true;
  }

  return false;
}

function isBusinessDay(date) {
  const wk = date.getDay();
  if (wk === 0 || wk === 6) return false;
  return !isJapaneseHoliday(date);
}

// 任意の日付が属する週の月曜日を返す
function getMondayOf(date) {
  const d = new Date(date);
  const day = d.getDay();
  d.setDate(d.getDate() - (day === 0 ? 6 : day - 1));
  d.setHours(0,0,0,0);
  return d;
}

// 月曜日から7日分の Date 配列を返す
function getWeekDates(monday) {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(d.getDate() + i);
    return d;
  });
}

// ─── VENUE PLANS (現場コマ数設定) ───
// 月ごとに各現場の1か月あたり配置人数を管理する
// lc_venue_plans: { [month: 'YYYY-MM']: { [venue: string]: { slots: number } } }
function getVenuePlans() {
  return Store.get(LS.shiftVenuePlans, {});
}
function saveVenuePlans(plans) {
  Store.set(LS.shiftVenuePlans, plans);
}
function getVenuePlanForMonth(month) {
  return getVenuePlans()[month] || {};
}
function setVenuePlanForMonth(month, plan) {
  const plans = getVenuePlans();
  plans[month] = plan;
  saveVenuePlans(plans);
}

// ─── SHIFT PLAN HIDDEN DATES（非表示日付）───
// lc_shift_plan_hidden: { [month: 'YYYY-MM']: ['YYYY-MM-DD', ...] }
function getPlanHiddenDates(month) {
  const all = Store.get('lc_shift_plan_hidden', {});
  return new Set(all[month] || []);
}
function setPlanHiddenDates(month, dateSet) {
  const all = Store.get('lc_shift_plan_hidden', {});
  all[month] = [...dateSet].sort();
  Store.set('lc_shift_plan_hidden', all);
}
function hidePlanDate(month, dateStr) {
  const hidden = getPlanHiddenDates(month);
  hidden.add(dateStr);
  setPlanHiddenDates(month, hidden);
}
function restorePlanDate(month, dateStr) {
  const hidden = getPlanHiddenDates(month);
  hidden.delete(dateStr);
  setPlanHiddenDates(month, hidden);
}
function clearPlanHiddenDates(month) {
  const all = Store.get('lc_shift_plan_hidden', {});
  delete all[month];
  Store.set('lc_shift_plan_hidden', all);
}

// ─── PRODUCTS & POINTS (モバイル事業部) ───
const PRODUCTS = [
  { key: 'sbmnp',         label: 'SBMNP',               pt: 5.0, type: 'count', unit: '件', group: 'MNP系' },
  { key: 'ymnp',          label: 'YMNP',                pt: 3.0, type: 'count', unit: '件', group: 'MNP系' },
  { key: 'y_to_s',        label: 'Y→S',                 pt: 0.5, type: 'count', unit: '件', group: 'MNP系' },
  { key: 'sb_shinki',     label: 'SB新規',              pt: 1.0, type: 'count', unit: '件', group: '新規系' },
  { key: 'ym_shinki',     label: 'YM新規',              pt: 1.0, type: 'count', unit: '件', group: '新規系' },
  { key: 'hikari_air',    label: '光新規/AIR',          pt: 3.0, type: 'count', unit: '件', group: '新規系' },
  { key: 'hikari_change', label: '光事業者変更',        pt: 3.0, type: 'count', unit: '件', group: '新規系' },
  { key: 'mikomi',        label: '見込み',              pt: 0.5, type: 'count', unit: '件', group: 'その他' },
  { key: 'yoyaku_mikomi', label: '予約番号発行済み見込み', pt: 1.0, type: 'count', unit: '件', group: 'その他' },
  { key: 'paypay_card',   label: 'PayPayカード',        pt: 0.2, type: 'count', unit: '件', group: 'その他' },
  { key: 'denki',         label: '電気',                pt: 0.5, type: 'count', unit: '件', group: 'その他' },
  { key: 'selection',     label: 'セレクション',        pt: 3.0, type: 'amount', unit: '円', per: 50000, group: 'その他' },
];

// 1件のレポートのポイントを計算
function calcPoints(report) {
  return PRODUCTS.reduce((total, p) => {
    const val = Number(report[p.key] || 0);
    if (p.type === 'amount') return total + (val / p.per) * p.pt;
    return total + val * p.pt;
  }, 0);
}

// 複数レポートを集計（月合計など）
function aggregateReports(reports) {
  const result = {};
  PRODUCTS.forEach(p => { result[p.key] = 0; });
  reports.forEach(r => {
    PRODUCTS.forEach(p => { result[p.key] += Number(r[p.key] || 0); });
  });
  result.totalPt = calcPoints(result);
  return result;
}

// レポートが存在する月の一覧（降順）
function getAvailableMonths() {
  const reports = getReports().filter(r => !r.type || r.type === 'mobile');
  const months = new Set(reports.map(r => r.date.substring(0, 7)));
  // 直近4ヶ月は常に選択肢に含める
  const d = new Date();
  for (let i = 0; i < 4; i++) {
    const m = new Date(d.getFullYear(), d.getMonth() - i, 1);
    months.add(`${m.getFullYear()}-${String(m.getMonth() + 1).padStart(2, '0')}`);
  }
  return [...months].sort().reverse();
}

// ─── DATE HELPERS ───
function currentMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}
function todayStr() {
  return new Date().toISOString().split('T')[0];
}
function monthLabel(month) {
  if (!month) return '';
  const [y, m] = month.split('-');
  return `${y}年${parseInt(m)}月`;
}
function formatDate(dateStr) {
  if (!dateStr) return '';
  const [, m, d] = dateStr.split('-');
  return `${parseInt(m)}/${parseInt(d)}`;
}
function formatMoney(n) {
  return Number(n || 0).toLocaleString('ja-JP') + '円';
}

// ─── TALENT CARDS (人材カルテ) ───
// lc_talent: { [userId]: { joinMonth, jobDescription, strengths, challenges,
//   skills, lastInterviewDate, agreedRole, nextRoleCandidate, nextReviewDate,
//   managerComment, careerHope, devActions, updatedAt } }
function getTalentCards() {
  return Store.get(LS.talent, {});
}
function saveTalentCards(cards) {
  Store.set(LS.talent, cards);
}
function getTalentCard(userId) {
  return getTalentCards()[userId] || {};
}
function setTalentCard(userId, data) {
  const cards = getTalentCards();
  cards[userId] = { ...(cards[userId] || {}), ...data, updatedAt: new Date().toISOString() };
  saveTalentCards(cards);
}

// ─── MBTI ───
// mbti: { ei:{pole:'E'|'I',pct:0-100}, sn:{pole:'S'|'N',pct}, ft:{pole:'F'|'T',pct},
//          jp:{pole:'J'|'P',pct}, id:{pole:'A'|'T',pct} }
function getMbti(userId) {
  return getTalentCard(userId).mbti || null;
}
function setMbti(userId, mbtiData) {
  setTalentCard(userId, { mbti: mbtiData });
}

// ─── JOB HISTORY (ジョブ経歴) ───
// lc_job_history: { [userId]: [ { id, date, role, dept, memo, createdAt } ] }
// date: 'YYYY-MM'  role: 表示用役職テキスト  dept: 事業部テキスト
function getJobHistory(userId) {
  return (Store.get(LS.jobHistory, {})[userId] || [])
    .slice().sort((a, b) => (a.date < b.date ? -1 : 1));
}
function addJobHistoryEntry(userId, entry) {
  const all = Store.get(LS.jobHistory, {});
  const list = all[userId] || [];
  list.push({ ...entry, id: 'jh' + Date.now(), createdAt: new Date().toISOString() });
  all[userId] = list;
  Store.set(LS.jobHistory, all);
}
function updateJobHistoryEntry(userId, entryId, data) {
  const all = Store.get(LS.jobHistory, {});
  all[userId] = (all[userId] || []).map(e => e.id === entryId ? { ...e, ...data } : e);
  Store.set(LS.jobHistory, all);
}
function deleteJobHistoryEntry(userId, entryId) {
  const all = Store.get(LS.jobHistory, {});
  all[userId] = (all[userId] || []).filter(e => e.id !== entryId);
  Store.set(LS.jobHistory, all);
}

// ─── INTERVIEW LOGS (面談ログ) ───
// lc_interview_logs: { [userId]: [ { id, date, interviewer, summary, agreedActions, nextDate, createdAt } ] }
function getInterviewLogs(userId) {
  return (Store.get(LS.interviewLogs, {})[userId] || [])
    .slice().sort((a, b) => (a.date > b.date ? -1 : 1)); // 新しい順
}
function addInterviewLog(userId, log) {
  const all = Store.get(LS.interviewLogs, {});
  const list = all[userId] || [];
  list.push({ ...log, id: 'il' + Date.now(), createdAt: new Date().toISOString() });
  all[userId] = list;
  Store.set(LS.interviewLogs, all);
}
function updateInterviewLog(userId, logId, data) {
  const all = Store.get(LS.interviewLogs, {});
  all[userId] = (all[userId] || []).map(l => l.id === logId ? { ...l, ...data } : l);
  Store.set(LS.interviewLogs, all);
}
function deleteInterviewLog(userId, logId) {
  const all = Store.get(LS.interviewLogs, {});
  all[userId] = (all[userId] || []).filter(l => l.id !== logId);
  Store.set(LS.interviewLogs, all);
}

// ─── PHOTOS (顔写真, base64) ───
function getPhoto(userId) {
  return Store.get(LS.photos, {})[userId] || null;
}
function setPhoto(userId, dataUrl) {
  const p = Store.get(LS.photos, {});
  p[userId] = dataUrl;
  Store.set(LS.photos, p);
}
function removePhoto(userId) {
  const p = Store.get(LS.photos, {});
  delete p[userId];
  Store.set(LS.photos, p);
}

// ─── SKILL TEMPLATE (スキルシート定義) ───
// 項目定義は skilldata.js の DEFAULT_SKILL_TEMPLATE を参照（全員共通）
function getSkillTemplate() {
  return Store.get(LS.skillTemplate, DEFAULT_SKILL_TEMPLATE);
}
function saveSkillTemplate(tmpl) {
  Store.set(LS.skillTemplate, tmpl);
}

// ─── SKILL EVAL (ユーザー別チェック状況) ───
function getSkillEval(userId) {
  return Store.get(LS.skillEval, {})[userId] || {};
}
function setSkillEval(userId, evalObj) {
  const all = Store.get(LS.skillEval, {});
  all[userId] = evalObj;
  Store.set(LS.skillEval, all);
}

// 旧形式(true)との後方互換を保ちつつ、3段階認定がすべて揃っているか判定
function isItemCertified(d) {
  if (!d || d === true) return false;
  return !!(d.self && d.certifier?.name && d.certifier?.date && d.manager?.name && d.manager?.date);
}

// 本人チェック(self)が入っているか（未認定でも進捗表示に使う）
function isItemSelfChecked(d) {
  if (!d) return false;
  if (d === true) return true;  // 旧形式
  return !!d.self;
}

function getSkillScore(userId) {
  const tmpl = getSkillTemplate();
  const ev = getSkillEval(userId);
  let total = 0, checked = 0;
  tmpl.categories.forEach(cat => {
    cat.items.forEach(item => {
      total++;
      if (isItemCertified(ev[item.id])) checked++;
    });
  });
  return { checked, total };
}

// カテゴリ別スコアを返す [{id, name, certified, selfChecked, total, pct}]
function getSkillScoreByCategory(userId) {
  const tmpl = getSkillTemplate();
  const ev = getSkillEval(userId);
  return tmpl.categories.map(cat => {
    const total = cat.items.length;
    const certified = cat.items.filter(item => isItemCertified(ev[item.id])).length;
    const selfChecked = cat.items.filter(item => isItemSelfChecked(ev[item.id])).length;
    return {
      id: cat.id,
      name: cat.name,
      certified,
      selfChecked,
      total,
      pct: total > 0 ? Math.round(certified / total * 100) : 0
    };
  });
}

// ─── NOTIFICATIONS (お知らせ) ───
// lc_notifications: [{ id, fromUserId, toUserIds, title, body, createdAt, readBy:{userId:ISO} }]
// toUserIds: ['all'] で全員、または ['u1','u2',...] で個別指定
function getNotifications() {
  return Store.get(LS.notifications, []);
}
function saveNotifications(notifs) {
  Store.set(LS.notifications, notifs);
}
function getNotificationsForUser(userId) {
  return getNotifications()
    .filter(n => n.toUserIds.includes('all') || n.toUserIds.includes(userId))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
function addNotification(fromUserId, toUserIds, title, body) {
  const notifs = getNotifications();
  const n = {
    id: 'n' + Date.now(),
    fromUserId,
    toUserIds,
    title,
    body: body || '',
    createdAt: new Date().toISOString(),
    readBy: {},
  };
  notifs.push(n);
  saveNotifications(notifs);
  return n;
}
function markNotificationRead(notifId, userId) {
  const notifs = getNotifications();
  const n = notifs.find(x => x.id === notifId);
  if (n && !n.readBy[userId]) {
    n.readBy[userId] = new Date().toISOString();
    saveNotifications(notifs);
  }
}
function markAllNotificationsRead(userId) {
  const notifs = getNotifications();
  const ts = new Date().toISOString();
  let changed = false;
  notifs.forEach(n => {
    if ((n.toUserIds.includes('all') || n.toUserIds.includes(userId)) && !n.readBy[userId]) {
      n.readBy[userId] = ts;
      changed = true;
    }
  });
  if (changed) saveNotifications(notifs);
}
function getUnreadCount(userId) {
  return getNotificationsForUser(userId).filter(n => !n.readBy[userId]).length;
}

// ─── TASKS (タスク / コミット管理) ───
// lc_tasks: [{
//   id, fromUserId, toUserIds,
//   title, body,
//   horizon: 'daily' | 'weekly' | 'monthly',
//   dueDate: 'YYYY-MM-DD',
//   doneBy: { userId: ISO },
//   createdAt
// }]
function getTasks() {
  return Store.get(LS.tasks, []);
}
function saveTasks(tasks) {
  Store.set(LS.tasks, tasks);
}
function _calcTaskDueDate(horizon) {
  const today = new Date();
  if (horizon === 'daily') {
    return todayStr();
  } else if (horizon === 'weekly') {
    const day = today.getDay();
    const diff = day === 0 ? 0 : 7 - day;
    const end = new Date(today);
    end.setDate(today.getDate() + diff);
    return end.toISOString().slice(0, 10);
  } else if (horizon === 'monthly') {
    const end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    return end.toISOString().slice(0, 10);
  }
  return todayStr();
}
function getTasksForUser(userId) {
  const ORDER = { daily: 0, weekly: 1, monthly: 2 };
  return getTasks()
    .filter(t => t.toUserIds.includes('all') || t.toUserIds.includes(userId))
    .sort((a, b) => {
      const ho = (ORDER[a.horizon] ?? 3) - (ORDER[b.horizon] ?? 3);
      if (ho !== 0) return ho;
      return b.createdAt.localeCompare(a.createdAt);
    });
}
function addTask(fromUserId, toUserIds, title, body, horizon) {
  const tasks = getTasks();
  const t = {
    id: 'tk' + Date.now(),
    fromUserId,
    toUserIds,
    title,
    body: body || '',
    horizon,
    dueDate: _calcTaskDueDate(horizon),
    doneBy: {},
    createdAt: new Date().toISOString(),
  };
  tasks.push(t);
  saveTasks(tasks);
  return t;
}
function markTaskDone(taskId, userId) {
  const tasks = getTasks();
  const t = tasks.find(x => x.id === taskId);
  if (t) { t.doneBy[userId] = new Date().toISOString(); saveTasks(tasks); }
}
function unmarkTaskDone(taskId, userId) {
  const tasks = getTasks();
  const t = tasks.find(x => x.id === taskId);
  if (t && t.doneBy[userId]) { delete t.doneBy[userId]; saveTasks(tasks); }
}
function deleteTask(taskId) {
  saveTasks(getTasks().filter(t => t.id !== taskId));
}
function getIncompleteTaskCount(userId) {
  return getTasksForUser(userId).filter(t => !t.doneBy[userId]).length;
}

// ─── TALENT: 直近N か月の生産性推移を返す ───
// [{month:'YYYY-MM', value: number, label: string}]
// ─── VENUE ACHIEVEMENT (現場達成率) ───
// lc_venue_achieve v2: { [month: 'YYYY-MM']: {
//   weekday:  { [site: string]: { budget: number, actual: number } },
//   weekends: { [sat: 'YYYY-MM-DD']: { sites: Array<{ name, budget, actual }> } }
// }}
// ※ v1形式（{ [site]: { weekdayBudget, weekdayActual, weekends: {...} } }）は
//    getVenueAchieve 内で自動マイグレーション

// 指定月のすべての週末（土曜日）を返す: [{ sat:'YYYY-MM-DD', sun:'YYYY-MM-DD'|null }]
function getWeekendDates(month) {
  const [y, m] = month.split('-').map(Number);
  const daysInMonth = new Date(y, m, 0).getDate();
  const weekends = [];
  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(y, m - 1, d);
    if (date.getDay() === 6) {
      const sat = `${y}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
      const sunD = d + 1;
      const sun = sunD <= daysInMonth
        ? `${y}-${String(m).padStart(2,'0')}-${String(sunD).padStart(2,'0')}`
        : null;
      weekends.push({ sat, sun });
    }
  }
  return weekends;
}

// 月のデータを取得（v1→v2 自動マイグレーション付き）
function getVenueAchieve(month) {
  const raw = Store.get(LS.venueAchieve, {})[month] || {};
  // 新フォーマット判定: 'weekday' か 'weekends' キーがあればv2
  if ('weekday' in raw || 'weekends' in raw) {
    return { weekday: raw.weekday || {}, weekends: raw.weekends || {} };
  }
  // v1 → v2 マイグレーション
  const weekday = {};
  const weekends = {};
  for (const [site, data] of Object.entries(raw)) {
    if (typeof data !== 'object' || data === null) continue;
    if ((data.weekdayBudget || 0) > 0 || (data.weekdayActual || 0) > 0) {
      weekday[site] = { budget: data.weekdayBudget || 0, actual: data.weekdayActual || 0 };
    }
    for (const [sat, weData] of Object.entries(data.weekends || {})) {
      weekends[sat] = weekends[sat] || { sites: [] };
      if ((weData.budget || 0) > 0 || (weData.actual || 0) > 0) {
        weekends[sat].sites.push({ name: site, budget: weData.budget || 0, actual: weData.actual || 0 });
      }
    }
  }
  return { weekday, weekends };
}

// 現場別・週末月次推移を取得（過去N ヶ月）
// returns: [{ month: 'YYYY-MM', label, budget, actual, rate }]
function getVenueWeekendSiteTrend(siteName, monthCount = 6) {
  const result = [];
  const now = new Date();
  for (let i = monthCount - 1; i >= 0; i--) {
    const d     = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const month = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const achieve  = getVenueAchieve(month);
    const weekends = achieve.weekends || {};
    let budget = 0, actual = 0;
    for (const weDay of Object.values(weekends)) {
      for (const s of (weDay.sites || [])) {
        if (s.name === siteName) {
          budget += Number(s.budget) || 0;
          actual += Number(s.actual) || 0;
        }
      }
    }
    result.push({ month, label: monthLabel(month), budget, actual, rate: calcAchieve(actual, budget) });
  }
  return result;
}

// 指定月の全週末に登場する現場名一覧を取得（ユニーク）
function getVenueWeekendSiteNames(month) {
  const achieve  = getVenueAchieve(month);
  const weekends = achieve.weekends || {};
  const names = new Set();
  for (const weDay of Object.values(weekends)) {
    for (const s of (weDay.sites || [])) {
      if (s.name) names.add(s.name);
    }
  }
  return [...names];
}

// シフト登録現場 + 週末達成率データに登場した全現場名を返す（重複排除・五十音順）
function getAllVenueWeekendSiteNames() {
  const names = new Set(getShiftSites());
  const allData = Store.get(LS.venueAchieve, {});
  Object.values(allData).forEach(monthData => {
    const weekends = monthData.weekends || {};
    Object.values(weekends).forEach(wd => {
      (wd.sites || []).forEach(s => { if (s.name) names.add(s.name); });
    });
  });
  return [...names].sort((a, b) => a.localeCompare(b, 'ja'));
}

// 月全体のデータを上書き保存
function setVenueAchieve(month, data) {
  const all = Store.get(LS.venueAchieve, {});
  all[month] = data;
  Store.set(LS.venueAchieve, all);
}

// 平日1現場分を保存（部分更新）
function setVenueAchieveWeekday(month, site, siteData) {
  const cur = getVenueAchieve(month);
  cur.weekday[site] = siteData;
  setVenueAchieve(month, cur);
}

// 平日1現場の詳細カテゴリを取得
function getVenueWeekdayItems(month, site) {
  return (getVenueAchieve(month).weekday[site] || {}).items || {};
}

// 平日1現場の詳細カテゴリを保存（SY対外合計をbudget/actualに同期）
function setVenueWeekdayItems(month, site, items) {
  const cur  = getVenueAchieve(month);
  const prev = cur.weekday[site] || {};
  const sy   = items.sy || {};
  const syActual = [1,2,3,4,5].reduce((s, w) => s + (Number(sy[`w${w}a`]) || 0), 0);
  cur.weekday[site] = {
    budget: Number(sy.target) || prev.budget || 0,
    actual: syActual || prev.actual || 0,
    items
  };
  setVenueAchieve(month, cur);
}

// 週末1日分のサイト配列を保存（部分更新）
function setVenueAchieveWeekend(month, sat, sitesArray) {
  const cur = getVenueAchieve(month);
  cur.weekends[sat] = { sites: sitesArray };
  setVenueAchieve(month, cur);
}

function getTalentProductivityTrend(userId, months = 6) {
  const user = getUserById(userId);
  if (!user || !user.reportType) return null;
  const result = [];
  const now = new Date();
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const month = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const reports = getUserReportsForMonth(userId, month);
    if (user.reportType === 'mobile') {
      const agg = aggregateReports(reports);
      result.push({ month, value: agg.totalPt, label: monthLabel(month) });
    } else if (user.reportType === 'refa') {
      const total = reports.reduce((s, r) => s + Number(r.amount || 0), 0);
      result.push({ month, value: total, label: monthLabel(month) });
    }
  }
  return result;
}
