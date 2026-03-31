// ─── DATA VERSION (構造変更時に上げる) ───
const DATA_VERSION = 3;

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

// ─── LOCALSTORAGE KEYS ───
const LS = {
  users:    'lc_users',
  reports:  'lc_reports',
  targets:  'lc_targets',
  session:  'lc_session',
  version:  'lc_version',
};

// ─── INIT & MIGRATION ───
function initData() {
  const version = parseInt(localStorage.getItem(LS.version) || '0');

  if (version < DATA_VERSION) {
    _migrate();
    localStorage.setItem(LS.version, String(DATA_VERSION));
  }

  if (!localStorage.getItem(LS.reports)) localStorage.setItem(LS.reports, JSON.stringify([]));
  if (!localStorage.getItem(LS.targets)) localStorage.setItem(LS.targets, JSON.stringify([]));
}

function _migrate() {
  // ── 既存ユーザーのパスワードだけ保持し、INITIAL_USERSを正とする ──
  const existingUsers = JSON.parse(localStorage.getItem(LS.users) || '[]');
  const pwMap = {};
  existingUsers.forEach(u => { pwMap[u.id] = u.pw; });

  // INITIAL_USERSを基準に、カスタムパスワードがあれば上書き保持
  const newUsers = INITIAL_USERS.map(u => ({
    ...u,
    pw: pwMap[u.id] || u.pw,
  }));

  localStorage.setItem(LS.users, JSON.stringify(newUsers));

  // ── 既存レポートに type フィールドを追加 ──
  const reports = JSON.parse(localStorage.getItem(LS.reports) || '[]');
  const migratedReports = reports.map(r => r.type ? r : { ...r, type: 'mobile' });
  localStorage.setItem(LS.reports, JSON.stringify(migratedReports));
}

// ─── USERS ───
function getUsers() {
  return JSON.parse(localStorage.getItem(LS.users) || '[]');
}
function saveUsers(users) {
  localStorage.setItem(LS.users, JSON.stringify(users));
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
  return JSON.parse(localStorage.getItem(LS.reports) || '[]');
}
function saveReports(reports) {
  localStorage.setItem(LS.reports, JSON.stringify(reports));
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
  return JSON.parse(localStorage.getItem(LS.targets) || '[]');
}
function saveTargets(targets) {
  localStorage.setItem(LS.targets, JSON.stringify(targets));
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
