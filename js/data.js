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
  { id: 'u26', name: '廣瀬',     role: 'admin',    dept: 'hr', reportType: null, jobTitle: 'IT / イベントCL',  pw: 'lamp1234' },
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
  session:        'lc_session',
  version:        'lc_version',
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
// 月ごとに各現場の1日あたりコマ数（配置人数）を管理する
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
