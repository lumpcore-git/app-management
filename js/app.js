// ─── CURRENT USER ───
let CU = null;

// ─── RANKING STATE ───
let rankMonth = '';
let rankItem  = '';

// ─── SHIFT STATE ───
let shiftWeekStart = null; // Date (月曜日)
let shiftMonthCursor = null; // Date (月初)
let shiftMonthUserId = '';   // 表示対象ユーザーID
let shiftMenuExpanded = false;
let shiftPlanMonth = null;   // 'YYYY-MM'（シフト作成ページ）
let shiftPlanBrushSite    = null;  // シフト作成で選択中の入力ブラシ（現場/休み）
let shiftPlanWeekdayOnly = false;  // 土日非表示トグル

// ─── PROFILE STATE ───
let profileUserId = '';
let profileActiveTab = 'perf';
let mbtiEditMode = false;

// ─── VENUE ACHIEVE STATE ───
let venueAchieveMonth = '';
let venueMenuExpanded = false;
let wdEditingSite = null; // 平日: 編集中の現場名（null = 閲覧モード）
// 週末グラフ用
let venueWeekendChartMode  = 'by_weekend'; // 'by_weekend' | 'by_month_sites' | 'by_site'
let venueWeekendSelectedSat   = '';        // 'by_weekend' 選択中の土曜日
let venueWeekendSelectedSite  = '';        // 'by_site' 選択中の現場名
let venueWeekendTrendMonths   = 6;         // 'by_site' 推移の期間（3/6/12）

// ─── DASHBOARD NOTIF/TASK TAB ───
let _dashNotifTab = 'notif'; // 'notif' | 'task'

// ─── THEME ───
function initTheme() {
  const saved = getTheme();
  document.documentElement.setAttribute('data-theme', saved);
  _syncThemeBtn(saved);
}

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme') || 'dark';
  const next = current === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  setTheme(next);
  _syncThemeBtn(next);
}

function _syncThemeBtn(theme) {
  const btn = document.getElementById('themeToggleBtn');
  if (!btn) return;
  btn.textContent = theme === 'dark' ? '☀️' : '🌙';
  btn.title = theme === 'dark' ? 'ライトモードに切替' : 'ダークモードに切替';
}

// ─── INIT ───
window.addEventListener('DOMContentLoaded', async () => {
  initTheme();
  initData();
  await tryEntraIdLogin();
  CU = requireAuth();
  if (!CU) return;

  await Store.syncFromCloud();

  renderTopbar();
  renderSidebar();

  window.addEventListener('hashchange', route);
  route();

  document.getElementById('modalOverlay').addEventListener('click', (e) => {
    if (e.target === e.currentTarget) closeModal();
  });
});

// ─── TOPBAR ───
function renderTopbar() {
  const avatarEl = document.getElementById('topbarAvatar');
  avatarEl.textContent = CU.name[0] || '?';
  avatarEl.style.background = ROLES[CU.role]?.color || '#4f7cff';
  document.getElementById('topbarName').textContent = CU.name;
  document.getElementById('topbarRoleLabel').textContent = getUserDisplayRole(CU);
  _updateNotifBadge();
}

function _updateNotifBadge() {
  const count = getUnreadCount(CU.id);
  const badge = document.getElementById('notifBadge');
  if (!badge) return;
  if (count > 0) {
    badge.textContent = count > 9 ? '9+' : String(count);
    badge.classList.remove('hidden');
  } else {
    badge.classList.add('hidden');
  }
}

// ─── SIDEBAR ───
function renderSidebar() {
  const level = roleLevel(CU.role);
  const hasReport = !!CU.reportType;
  const canSeeTeam = (level >= 2 && CU.dept === 'mobile') || level >= 5;
  
  const canSetTargets = (level >= 4 && CU.dept === 'mobile') || level >= 5;
  const hash = location.hash.replace('#', '') || 'dashboard';
  const isShiftPage  = hash === 'shifts-week' || hash === 'shifts-month' || hash === 'shifts-plan';
  const isVenuePage  = hash === 'venue-achieve-weekday' || hash === 'venue-achieve-weekend';

  if (isShiftPage) shiftMenuExpanded = true;
  if (isVenuePage) venueMenuExpanded = true;

  const nav = [
    { id: 'dashboard',            icon: '🏠', label: 'ダッシュボード', show: true },
    { id: 'report',               icon: '📝', label: '実績報告',       show: hasReport },
    { id: 'shifts',               icon: '🗓️', label: 'シフト',         show: true },
    { id: 'team',                 icon: '👥', label: 'チーム実績',     show: canSeeTeam },
    { id: 'ranking',              icon: '🏆', label: 'ランキング',     show: canSeeTeam },
    { id: 'targets',              icon: '🎯', label: '目標設定',       show: canSetTargets },
    { id: 'venue-achieve',        icon: '📊', label: '現場達成率',     show: true },
    { id: 'talent',               icon: '📋', label: '人財カルテ',     show: level >= 4 },
    { id: 'members',              icon: '⚙️', label: 'メンバー管理',  show: level >= 5 },
    { id: 'settings',             icon: '🔧', label: '設定',           show: true },
  ];

  const items = nav.filter(n => n.show);
  document.getElementById('sidebar').innerHTML = `
    <div class="nav-section">メニュー</div>
    ${items.map(n => {
      if (n.id === 'shifts') return `
        <div class="nav-item nav-item-parent" data-page="shifts" onclick="toggleShiftMenu()">
          <span class="icon">${n.icon}</span>
          <span>${n.label}</span>
          <span class="nav-caret ${shiftMenuExpanded ? 'open' : ''}">▾</span>
        </div>
        <div class="nav-submenu ${shiftMenuExpanded ? '' : 'hidden'}" id="shiftSubmenu">
          <div class="nav-subitem" data-page="shifts-week" onclick="navigate('shifts-week')">週次シフト</div>
          <div class="nav-subitem" data-page="shifts-month" onclick="navigate('shifts-month')">月次シフト</div>
          ${level >= 4 ? `<div class="nav-subitem nav-subitem-admin" data-page="shifts-plan" onclick="navigate('shifts-plan')">シフト作成</div>` : ''}
        </div>`;
      if (n.id === 'venue-achieve') return `
        <div class="nav-item nav-item-parent" data-page="venue-achieve" onclick="toggleVenueMenu()">
          <span class="icon">${n.icon}</span>
          <span>${n.label}</span>
          <span class="nav-caret ${venueMenuExpanded ? 'open' : ''}">▾</span>
        </div>
        <div class="nav-submenu ${venueMenuExpanded ? '' : 'hidden'}" id="venueSubmenu">
          <div class="nav-subitem" data-page="venue-achieve-weekday" onclick="navigate('venue-achieve-weekday')">平日達成率</div>
          <div class="nav-subitem" data-page="venue-achieve-weekend" onclick="navigate('venue-achieve-weekend')">週末達成率</div>
        </div>`;
      return `
        <div class="nav-item" data-page="${n.id}" onclick="navigate('${n.id}')">
          <span class="icon">${n.icon}</span>
          <span>${n.label}</span>
        </div>`;
    }).join('')}
    <div style="margin-top:auto;padding:12px">
      <div style="font-size:11px;color:var(--text-sub);padding:8px 0;border-top:1px solid var(--border)">
        ${DEPTS[CU.dept]?.label || ''}
      </div>
    </div>
  `;
}

// ─── ROUTER ───
function route() {
  const hash = location.hash.replace('#', '') || 'dashboard';
  const level = roleLevel(CU.role);
  const canSeeTeam = (level >= 2 && CU.dept === 'mobile') || level >= 5;
  const canSetTargets = (level >= 4 && CU.dept === 'mobile') || level >= 5;

  if ((hash === 'team' || hash === 'ranking') && !canSeeTeam) {
    location.hash = 'dashboard'; return;
  }
  if (hash === 'report' && !CU.reportType) {
    location.hash = 'dashboard'; return;
  }
  if (hash === 'targets' && !canSetTargets) {
    location.hash = 'dashboard'; return;
  }
  if (hash === 'talent' && level < 4) {
    location.hash = 'dashboard'; return;
  }
  if (hash === 'members' && level < 5) {
    location.hash = 'dashboard'; return;
  }
  if (hash === 'profile' && (level < 4 || !profileUserId)) {
    location.hash = 'talent'; return;
  }

  document.querySelectorAll('.nav-item, .nav-subitem').forEach(el => {
    const page = el.dataset.page;
    const isShift   = hash === 'shifts-week' || hash === 'shifts-month';
    const isProfile = hash === 'profile';
    const isVenue   = hash === 'venue-achieve-weekday' || hash === 'venue-achieve-weekend';
    const active = page === hash
      || (page === 'shifts'         && isShift)
      || (page === 'talent'         && isProfile)
      || (page === 'venue-achieve'  && isVenue);
    el.classList.toggle('active', active);
  });

  const isShift = hash === 'shifts-week' || hash === 'shifts-month' || hash === 'shifts-plan';
  if (isShift) shiftMenuExpanded = true;
  syncShiftMenu();

  const isVenuePage = hash === 'venue-achieve-weekday' || hash === 'venue-achieve-weekend';
  if (isVenuePage) venueMenuExpanded = true;
  syncVenueMenu();

  if (hash === 'shifts-plan' && level < 4) {
    location.hash = 'dashboard'; return;
  }

  const titles = {
    dashboard: 'ダッシュボード',
    report:    '実績報告',
    shifts:    'シフト',
    'shifts-week': '週次シフト',
    'shifts-month': '月次シフト',
    'shifts-plan': 'シフト作成',
    team:      'チーム実績',
    ranking:   'ランキング',
    targets:        '目標設定',
    'venue-achieve':         '現場達成率',
    'venue-achieve-weekday': '平日達成率',
    'venue-achieve-weekend': '週末達成率',
    talent:         '人財カルテ',
    profile:        '',
    members:        'メンバー管理',
    settings:       '設定',
  };
  document.getElementById('topbarTitle').textContent = titles[hash] || '';

  const pages = {
    dashboard: renderDashboard,
    report:    renderReportPage,
    shifts:    renderShifts,
    'shifts-week': renderShifts,
    'shifts-month': renderShiftsMonth,
    'shifts-plan': renderShiftsPlan,
    team:      renderTeam,
    ranking:   renderRanking,
    targets:        renderTargets,
    'venue-achieve':         () => navigate('venue-achieve-weekday'),
    'venue-achieve-weekday': renderVenueAchieveWeekday,
    'venue-achieve-weekend': renderVenueAchieveWeekend,
    talent:         renderTalent,
    profile:        renderProfile,
    members:        renderMembers,
    settings:       renderSettings,
  };
  (pages[hash] || renderDashboard)();
}

function toggleShiftMenu() {
  shiftMenuExpanded = !shiftMenuExpanded;
  syncShiftMenu();
}

function syncShiftMenu() {
  const submenu = document.getElementById('shiftSubmenu');
  const caret = document.querySelector('.nav-caret');
  if (submenu) {
    submenu.classList.toggle('hidden', !shiftMenuExpanded);
  }
  if (caret) {
    caret.classList.toggle('open', shiftMenuExpanded);
  }
}

function navigate(page) {
  if (page === 'shifts') {
    location.hash = 'shifts-week';
    return;
  }
  if (page === 'venue-achieve') {
    location.hash = 'venue-achieve-weekday';
    return;
  }
  location.hash = page;
}

function toggleVenueMenu() {
  venueMenuExpanded = !venueMenuExpanded;
  syncVenueMenu();
}

function syncVenueMenu() {
  const submenu = document.getElementById('venueSubmenu');
  if (submenu) submenu.classList.toggle('hidden', !venueMenuExpanded);
  // カレットは venue-achieve の nav-item-parent 内
  const parents = document.querySelectorAll('.nav-item-parent[data-page="venue-achieve"] .nav-caret');
  parents.forEach(c => c.classList.toggle('open', venueMenuExpanded));
}

// ─── HELPERS ───
function achieveColor(v) {
  if (v === null || v === undefined) return 'var(--text-sub)';
  if (v >= 100) return 'var(--green)';
  if (v >= 70)  return 'var(--accent)';
  if (v >= 50)  return 'var(--warn)';
  return 'var(--danger)';
}
function calcAchieve(actual, target) {
  if (!target || target <= 0) return null;
  return Math.round((actual / target) * 100);
}
function roleColor(role) { return ROLES[role]?.color || '#4f7cff'; }
function deptLabel(dept) { return DEPTS[dept]?.label || dept; }
function getShiftDayTone(day) {
  const toneMap = {
    0: { textColor: '#ffb347', cellBg: 'rgba(255,179,71,.08)',  headBg: 'rgba(255,179,71,.12)'  }, // 日: オレンジ
    1: { textColor: '#ffffff', cellBg: 'rgba(255,255,255,.04)', headBg: 'rgba(255,255,255,.08)' }, // 月: 白
    2: { textColor: '#ff6b6b', cellBg: 'rgba(255,107,107,.08)', headBg: 'rgba(255,107,107,.12)' }, // 火: 赤
    3: { textColor: '#6db6ff', cellBg: 'rgba(109,182,255,.08)', headBg: 'rgba(109,182,255,.12)' }, // 水: 青
    4: { textColor: '#6de08f', cellBg: 'rgba(109,224,143,.08)', headBg: 'rgba(109,224,143,.12)' }, // 木: 緑
    5: { textColor: '#ffd700', cellBg: 'rgba(255,215,0,.08)',   headBg: 'rgba(255,215,0,.12)'   }, // 金: 金
    6: { textColor: '#c58a5c', cellBg: 'rgba(197,138,92,.08)',  headBg: 'rgba(197,138,92,.12)'  }, // 土: 茶
  };
  return toneMap[day] || { textColor: 'var(--text-sub)', cellBg: 'transparent', headBg: 'transparent' };
}

// ─── TOAST ───
function showToast(msg, type = 'success') {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.className = `toast toast-${type} show`;
  setTimeout(() => { el.className = 'toast'; }, 3000);
}

// ─── MODAL ───
function showModal(html) {
  const overlay = document.getElementById('modalOverlay');
  const m = document.getElementById('modal');
  m.innerHTML = html;
  m.classList.remove('modal-wide', 'modal-mainwidth');
  overlay.classList.remove('modal-overlay-main');
  overlay.classList.remove('hidden');
}
function showWideModal(html) {
  showModal(html);
  document.getElementById('modal').classList.add('modal-wide');
}
function showTalentModal(html) {
  showModal(html);
  document.getElementById('modal').classList.add('modal-mainwidth');
  document.getElementById('modalOverlay').classList.add('modal-overlay-main');
}
function closeModal() {
  const overlay = document.getElementById('modalOverlay');
  overlay.classList.add('hidden');
  overlay.classList.remove('modal-overlay-main');
  document.getElementById('modal').classList.remove('modal-wide', 'modal-mainwidth');
}

// ═══════════════════════════════════════════════════════
// ─── NOTIFICATIONS UI ───
// ═══════════════════════════════════════════════════════

function _notificationsCard() {
  const notifs = getNotificationsForUser(CU.id);
  const level = roleLevel(CU.role);
  const unreadCount = notifs.filter(n => !n.readBy[CU.id]).length;
  const incompleteTasks = getIncompleteTaskCount(CU.id);
  const isTaskTab = _dashNotifTab === 'task';

  return `
    <div class="card fade-in">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px">
        <div style="display:flex;align-items:center;gap:2px">
          <button class="dash-tab-btn ${!isTaskTab ? 'active' : ''}" onclick="_switchDashTab('notif')">
            🔔 お知らせ${unreadCount > 0 ? `<span class="notif-unread-chip" style="margin-left:2px">${unreadCount}</span>` : ''}
          </button>
          <button class="dash-tab-btn ${isTaskTab ? 'active' : ''}" onclick="_switchDashTab('task')">
            📋 タスク${incompleteTasks > 0 ? `<span class="task-count-chip">${incompleteTasks}</span>` : ''}
          </button>
        </div>
        <div style="display:flex;gap:8px;align-items:center">
          ${!isTaskTab && unreadCount > 0 ? `<button class="btn btn-ghost" style="font-size:12px;padding:5px 10px" onclick="markAllReadAndRefresh()">すべて既読</button>` : ''}
          ${level >= 4 ? (isTaskTab
            ? `<button class="btn btn-primary" style="font-size:12px;padding:5px 12px" onclick="showCreateTaskModal()">＋ タスクを作る</button>`
            : `<button class="btn btn-primary" style="font-size:12px;padding:5px 12px" onclick="showSendNotificationModal()">📨 お知らせを送る</button>`
          ) : ''}
        </div>
      </div>

      ${isTaskTab ? _tasksPanel() : `
        ${notifs.length === 0 ? `
          <div class="empty-state" style="padding:24px 0">
            <div style="font-size:28px;margin-bottom:8px">📭</div>
            お知らせはありません
          </div>
        ` : `
          <div style="display:flex;flex-direction:column;gap:8px">
            ${notifs.slice(0, 10).map(n => {
              const isUnread = !n.readBy[CU.id];
              const from = getUserById(n.fromUserId);
              return `
                <div class="notif-item ${isUnread ? 'notif-unread' : ''}" onclick="markNotifReadAndRefresh('${n.id}')">
                  <div style="display:flex;align-items:flex-start;gap:10px">
                    ${isUnread
                      ? `<span class="notif-dot"></span>`
                      : `<span style="width:8px;flex-shrink:0;margin-top:5px"></span>`}
                    <div style="flex:1;min-width:0">
                      <div style="font-weight:${isUnread ? '700' : '500'};font-size:14px;margin-bottom:2px">${n.title}</div>
                      ${n.body ? `<div style="font-size:12px;color:var(--text-sub);margin-bottom:4px">${n.body}</div>` : ''}
                      <div style="font-size:11px;color:var(--text-sub)">${from?.name || '—'} · ${_timeAgo(n.createdAt)}</div>
                    </div>
                    ${isUnread ? `<span style="font-size:10px;color:var(--accent);flex-shrink:0;margin-top:4px">タップで既読</span>` : ''}
                  </div>
                </div>
              `;
            }).join('')}
            ${notifs.length > 10 ? `<div style="text-align:center;font-size:12px;color:var(--text-sub);padding:8px">他 ${notifs.length - 10}件</div>` : ''}
          </div>
        `}
      `}
    </div>
  `;
}

function _tasksPanel() {
  const level = roleLevel(CU.role);
  const tasks = getTasksForUser(CU.id);
  if (tasks.length === 0) {
    return `<div class="empty-state" style="padding:24px 0">
      <div style="font-size:28px;margin-bottom:8px">✅</div>
      割り当てられたタスクはありません
    </div>`;
  }
  const HORIZONS = [
    { key: 'daily',   label: '日次コミット', colorVar: '--danger',  icon: '🔴' },
    { key: 'weekly',  label: '週次コミット', colorVar: '--warn',    icon: '🟡' },
    { key: 'monthly', label: '月次コミット', colorVar: '--accent2', icon: '🔵' },
  ];
  return HORIZONS.map(({ key, label, colorVar, icon }) => {
    const group = tasks.filter(t => t.horizon === key);
    if (group.length === 0) return '';
    const pending = group.filter(t => !t.doneBy[CU.id]).length;
    return `
      <div style="margin-bottom:16px">
        <div style="display:flex;align-items:center;gap:6px;font-size:12px;font-weight:700;color:var(${colorVar});margin-bottom:8px;padding-bottom:6px;border-bottom:1px solid rgba(106,128,186,.2)">
          ${icon} ${label}
          ${pending > 0
            ? `<span style="font-weight:400;color:var(--text-sub);font-size:11px">（未完了 ${pending}件）</span>`
            : `<span style="font-size:11px;color:var(--green);font-weight:400">✓ すべて完了</span>`}
        </div>
        <div style="display:flex;flex-direction:column;gap:6px">
          ${group.map(t => _taskItem(t, level)).join('')}
        </div>
      </div>
    `;
  }).join('');
}

function _taskItem(t, level) {
  const isDone = !!t.doneBy[CU.id];
  const from = getUserById(t.fromUserId);
  const allUsers = getUsers();
  const targetIds = t.toUserIds.includes('all') ? allUsers.map(u => u.id) : t.toUserIds;
  const doneCount = targetIds.filter(uid => t.doneBy[uid]).length;
  const today = todayStr();
  const isOverdue = !isDone && t.dueDate && t.dueDate < today;
  const dueLabelText = t.dueDate === today ? '今日まで' : (t.dueDate ? t.dueDate.slice(5).replace('-', '/') + 'まで' : '');
  const canDelete = level >= 5 || t.fromUserId === CU.id;

  return `
    <div class="task-item${isDone ? ' task-done' : ''}">
      <div style="display:flex;align-items:flex-start;gap:10px">
        <div style="flex:1;min-width:0">
          <div style="font-weight:${isDone ? '400' : '600'};font-size:14px;margin-bottom:3px;${isDone ? 'text-decoration:line-through;color:var(--text-sub)' : ''}">
            ${t.title}
          </div>
          ${t.body ? `<div style="font-size:12px;color:var(--text-sub);margin-bottom:4px">${t.body}</div>` : ''}
          <div style="font-size:11px;color:var(--text-sub);display:flex;align-items:center;gap:8px;flex-wrap:wrap">
            <span>${from?.name || '—'}</span>
            ${dueLabelText ? `<span style="color:${isOverdue ? 'var(--danger)' : 'var(--text-sub)'}">${isOverdue ? '⚠ ' : ''}${dueLabelText}</span>` : ''}
            ${level >= 4 ? `<span style="color:var(--accent)">${doneCount}/${targetIds.length}人完了</span>` : ''}
          </div>
        </div>
        <div style="display:flex;flex-direction:column;gap:4px;flex-shrink:0;align-items:flex-end">
          ${isDone
            ? `<button class="btn btn-ghost" style="font-size:11px;padding:4px 10px;color:var(--green)" onclick="unmarkTaskDoneAndRefresh('${t.id}')">✓ 完了済み</button>`
            : `<button class="btn btn-primary" style="font-size:11px;padding:5px 12px" onclick="markTaskDoneAndRefresh('${t.id}')">完了にする</button>`}
          ${canDelete ? `<button class="btn btn-ghost" style="font-size:10px;padding:2px 8px;color:var(--danger)" onclick="deleteTaskAndRefresh('${t.id}')">削除</button>` : ''}
        </div>
      </div>
    </div>
  `;
}

function _timeAgo(isoString) {
  const diff = Date.now() - new Date(isoString).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'たった今';
  if (m < 60) return `${m}分前`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}時間前`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}日前`;
  return isoString.slice(0, 10).replace(/-/g, '/');
}

function _switchDashTab(tab) {
  _dashNotifTab = tab;
  renderDashboard();
}

function markNotifReadAndRefresh(notifId) {
  markNotificationRead(notifId, CU.id);
  _updateNotifBadge();
  renderDashboard();
}

function markAllReadAndRefresh() {
  markAllNotificationsRead(CU.id);
  _updateNotifBadge();
  renderDashboard();
}

function markTaskDoneAndRefresh(taskId) {
  markTaskDone(taskId, CU.id);
  renderDashboard();
}
function unmarkTaskDoneAndRefresh(taskId) {
  unmarkTaskDone(taskId, CU.id);
  renderDashboard();
}
function deleteTaskAndRefresh(taskId) {
  deleteTask(taskId);
  renderDashboard();
}

function showCreateTaskModal() {
  const users = getUsers().filter(u => u.id !== CU.id);
  showModal(`
    <div class="modal-title">📋 タスク / コミットを作成</div>
    <div style="display:flex;flex-direction:column;gap:16px;margin-top:16px">

      <div class="form-group">
        <label class="form-label">宛先</label>
        <label style="display:flex;align-items:center;gap:8px;cursor:pointer;font-size:13px;margin-bottom:8px">
          <input type="checkbox" id="task_to_all" onchange="toggleTaskToAll(this)">
          <span style="font-weight:600;color:var(--accent)">全員に割り当て</span>
        </label>
        <div id="task_recipients" style="display:flex;flex-direction:column;gap:2px;max-height:200px;overflow-y:auto;background:var(--surface2);border-radius:8px;padding:8px;border:1px solid var(--border)">
          ${users.map(u => `
            <label style="display:flex;align-items:center;gap:8px;cursor:pointer;font-size:13px;padding:5px 6px;border-radius:6px" onmouseover="this.style.background='var(--surface)'" onmouseout="this.style.background=''">
              <input type="checkbox" name="task_to" value="${u.id}">
              <span style="width:8px;height:8px;border-radius:50%;background:${ROLES[u.role]?.color || '#888'};flex-shrink:0"></span>
              <span>${u.name}</span>
              <span style="font-size:11px;color:var(--text-sub);margin-left:auto">${getUserDisplayRole(u)}</span>
            </label>
          `).join('')}
        </div>
      </div>

      <div class="form-group">
        <label class="form-label">コミット種別</label>
        <div style="display:flex;gap:8px">
          ${[
            ['daily',   '日次', '#ff95b3', 'rgba(255,149,179,.12)'],
            ['weekly',  '週次', '#ffd9a8', 'rgba(255,217,168,.12)'],
            ['monthly', '月次', '#80f1ff', 'rgba(128,241,255,.12)'],
          ].map(([val, label, color, bg], i) => `
            <label id="task_horizon_label_${val}" style="flex:1;display:flex;align-items:center;justify-content:center;gap:5px;cursor:pointer;padding:10px 6px;border-radius:8px;border:2px solid ${i === 0 ? color : 'var(--border)'};background:${i === 0 ? bg : 'var(--surface2)'};transition:all .15s;text-align:center">
              <input type="radio" name="task_horizon" value="${val}" ${i === 0 ? 'checked' : ''} onchange="updateTaskHorizonStyle()" style="display:none">
              <span style="font-weight:700;font-size:13px;color:${color}">${label}</span>
            </label>
          `).join('')}
        </div>
      </div>

      <div class="form-group">
        <label class="form-label">タイトル</label>
        <input type="text" class="form-input" id="task_title" placeholder="例：今日のMNP目標を達成する">
      </div>

      <div class="form-group">
        <label class="form-label">詳細（任意）</label>
        <textarea class="form-textarea" id="task_body" placeholder="補足があれば..."></textarea>
      </div>
    </div>
    <div style="display:flex;gap:8px;margin-top:20px;justify-content:flex-end">
      <button class="btn btn-ghost" onclick="closeModal()">キャンセル</button>
      <button class="btn btn-primary" onclick="submitTask()">📋 作成する</button>
    </div>
  `);
}

function toggleTaskToAll(checkbox) {
  const div = document.getElementById('task_recipients');
  div.style.opacity = checkbox.checked ? '0.4' : '1';
  div.style.pointerEvents = checkbox.checked ? 'none' : '';
}

function updateTaskHorizonStyle() {
  const COLORS = {
    daily:   { border: '#ff95b3', bg: 'rgba(255,149,179,.12)' },
    weekly:  { border: '#ffd9a8', bg: 'rgba(255,217,168,.12)' },
    monthly: { border: '#80f1ff', bg: 'rgba(128,241,255,.12)' },
  };
  const selected = document.querySelector('input[name="task_horizon"]:checked')?.value;
  Object.entries(COLORS).forEach(([val, c]) => {
    const label = document.getElementById(`task_horizon_label_${val}`);
    if (!label) return;
    if (val === selected) {
      label.style.borderColor = c.border;
      label.style.background = c.bg;
    } else {
      label.style.borderColor = 'var(--border)';
      label.style.background = 'var(--surface2)';
    }
  });
}

function submitTask() {
  const toAll = document.getElementById('task_to_all').checked;
  const title = document.getElementById('task_title').value.trim();
  const body  = document.getElementById('task_body').value.trim();
  const horizon = document.querySelector('input[name="task_horizon"]:checked')?.value || 'daily';

  if (!title) { showToast('タイトルを入力してください', 'error'); return; }

  let toUserIds;
  if (toAll) {
    toUserIds = ['all'];
  } else {
    const checked = [...document.querySelectorAll('input[name="task_to"]:checked')];
    toUserIds = checked.map(c => c.value);
    if (toUserIds.length === 0) { showToast('宛先を選択してください', 'error'); return; }
  }

  addTask(CU.id, toUserIds, title, body, horizon);
  closeModal();
  showToast('タスクを作成しました ✓', 'success');
  _dashNotifTab = 'task';
  renderDashboard();
}

// ── お知らせ送信モーダル（level≥4） ──
function showSendNotificationModal() {
  const users = getUsers().filter(u => u.id !== CU.id);
  const presets = [
    'スキルシートの入力をお願いします',
    '実績報告を入力してください',
    'シフトを確認してください',
    '人財カルテの内容を確認してください',
    'カスタム（自由入力）',
  ];

  showModal(`
    <div class="modal-title">📨 お知らせを送る</div>
    <div style="display:flex;flex-direction:column;gap:16px;margin-top:16px">

      <div class="form-group">
        <label class="form-label">宛先</label>
        <label style="display:flex;align-items:center;gap:8px;cursor:pointer;font-size:13px;margin-bottom:8px">
          <input type="checkbox" id="notif_to_all" onchange="toggleNotifToAll(this)">
          <span style="font-weight:600;color:var(--accent)">全員に送る</span>
        </label>
        <div id="notif_recipients" style="display:flex;flex-direction:column;gap:2px;max-height:200px;overflow-y:auto;background:var(--surface2);border-radius:8px;padding:8px;border:1px solid var(--border)">
          ${users.map(u => `
            <label style="display:flex;align-items:center;gap:8px;cursor:pointer;font-size:13px;padding:5px 6px;border-radius:6px" onmouseover="this.style.background='var(--surface)'" onmouseout="this.style.background=''">
              <input type="checkbox" name="notif_to" value="${u.id}">
              <span style="width:8px;height:8px;border-radius:50%;background:${ROLES[u.role]?.color || '#888'};flex-shrink:0"></span>
              <span>${u.name}</span>
              <span style="font-size:11px;color:var(--text-sub);margin-left:auto">${getUserDisplayRole(u)}</span>
            </label>
          `).join('')}
        </div>
      </div>

      <div class="form-group">
        <label class="form-label">お知らせ種別</label>
        <select class="form-select" id="notif_preset" onchange="updateNotifTitleFromPreset(this)">
          ${presets.map(p => `<option value="${p}">${p}</option>`).join('')}
        </select>
      </div>

      <div class="form-group">
        <label class="form-label">タイトル</label>
        <input type="text" class="form-input" id="notif_title" value="${presets[0]}" placeholder="お知らせのタイトル">
      </div>

      <div class="form-group">
        <label class="form-label">本文（任意）</label>
        <textarea class="form-textarea" id="notif_body" placeholder="詳細メッセージがあれば入力してください"></textarea>
      </div>

    </div>
    <div style="display:flex;gap:8px;margin-top:20px;justify-content:flex-end">
      <button class="btn btn-ghost" onclick="closeModal()">キャンセル</button>
      <button class="btn btn-primary" onclick="submitNotification()">📨 送信する</button>
    </div>
  `);
}

function toggleNotifToAll(checkbox) {
  const div = document.getElementById('notif_recipients');
  div.style.opacity = checkbox.checked ? '0.4' : '1';
  div.style.pointerEvents = checkbox.checked ? 'none' : '';
}

function updateNotifTitleFromPreset(select) {
  const titleInput = document.getElementById('notif_title');
  if (select.value !== 'カスタム（自由入力）') {
    titleInput.value = select.value;
  } else {
    titleInput.value = '';
    titleInput.focus();
  }
}

function submitNotification() {
  const toAll = document.getElementById('notif_to_all').checked;
  const title = document.getElementById('notif_title').value.trim();
  const body  = document.getElementById('notif_body').value.trim();

  if (!title) { showToast('タイトルを入力してください', 'error'); return; }

  let toUserIds;
  if (toAll) {
    toUserIds = ['all'];
  } else {
    const checked = [...document.querySelectorAll('input[name="notif_to"]:checked')];
    toUserIds = checked.map(c => c.value);
    if (toUserIds.length === 0) { showToast('宛先を選択してください', 'error'); return; }
  }

  addNotification(CU.id, toUserIds, title, body);
  closeModal();
  showToast('お知らせを送信しました ✓', 'success');
  _updateNotifBadge();
}

// ═══════════════════════════════════════════════════════
// ─── PAGE: ダッシュボード ───
// ═══════════════════════════════════════════════════════
function renderDashboard() {
  const level = roleLevel(CU.role);
  if (level >= 5)                   renderAdminDashboard();
  else if (CU.reportType === 'mobile') renderMobileDashboard();
  else if (CU.reportType === 'refa')   renderRefaDashboard();
  else                              renderBasicDashboard();
}

// ── 管理者ダッシュボード（役員・廣瀬さん） ──
function renderAdminDashboard() {
  const month = currentMonth();
  const allReports = getReports().filter(r => r.date.startsWith(month));
  const users = getUsers();

  // モバイル集計
  const mobileReports = allReports.filter(r => {
    const u = users.find(x => x.id === r.userId);
    return u?.dept === 'mobile';
  });
  const totalMnp    = mobileReports.reduce((s, r) => s + (Number(r.sbmnp || 0) + Number(r.ymnp || 0)), 0);
  const totalShinki = mobileReports.reduce((s, r) => s + (Number(r.sb_shinki || 0) + Number(r.ym_shinki || 0)), 0);

  // Refa集計
  const refaReports = allReports.filter(r => r.type === 'refa');
  const totalRefa   = refaReports.reduce((s, r) => s + (r.amount || 0), 0);

  // 未報告（reportTypeあるユーザー）
  const reportUsers  = users.filter(u => u.reportType);
  const reportedIds  = new Set(allReports.map(r => r.userId));
  const unreported   = reportUsers.filter(u => !reportedIds.has(u.id)).length;

  // 最新レポート5件（全員）
  const recent = [...allReports]
    .sort((a, b) => b.createdAt?.localeCompare(a.createdAt || '') || 0)
    .slice(0, 8);

  document.getElementById('main').innerHTML = `
    <div class="page-header fade-in">
      <div>
        <div class="page-title">こんにちは、${CU.name}さん 👋</div>
        <div class="page-sub">${monthLabel(month)} — 全社サマリー</div>
      </div>
    </div>

    <div class="kpi-grid fade-in" style="grid-template-columns:repeat(4,1fr)">
      <div class="kpi-card blue">
        <div class="kpi-icon">📱</div>
        <div class="kpi-label">MNP合計</div>
        <div class="kpi-value">${totalMnp}</div>
        <div class="kpi-meta">モバイル事業部</div>
      </div>
      <div class="kpi-card green">
        <div class="kpi-icon">✨</div>
        <div class="kpi-label">新規合計</div>
        <div class="kpi-value">${totalShinki}</div>
        <div class="kpi-meta">モバイル事業部</div>
      </div>
      <div class="kpi-card" style="border-color:rgba(244,114,182,.3)">
        <div class="kpi-card-bar" style="position:absolute;top:0;left:0;right:0;height:3px;background:#f472b6"></div>
        <div class="kpi-icon">💎</div>
        <div class="kpi-label">Refa売上</div>
        <div class="kpi-value" style="font-size:22px">${formatMoney(totalRefa)}</div>
        <div class="kpi-meta">イベントプロモーション部</div>
      </div>
      <div class="kpi-card ${unreported > 0 ? 'warn' : 'green'}">
        <div class="kpi-icon">🔔</div>
        <div class="kpi-label">未報告</div>
        <div class="kpi-value">${unreported}</div>
        <div class="kpi-meta">今月未報告のメンバー</div>
      </div>
    </div>

    ${_adminTodayShiftCard()}

    <div class="card fade-in">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px">
        <div class="section-title" style="margin-bottom:0">事業部別メンバー数</div>
      </div>
      <div style="display:flex;gap:12px;flex-wrap:wrap">
        ${Object.entries(DEPTS).map(([key, dept]) => {
          const count = users.filter(u => u.dept === key).length;
          return `
            <div style="background:var(--surface2);border-radius:8px;padding:12px 16px;display:flex;align-items:center;gap:10px">
              <div style="width:10px;height:10px;border-radius:50%;background:${dept.color}"></div>
              <span style="font-size:13px">${dept.label}</span>
              <strong style="color:${dept.color}">${count}人</strong>
            </div>
          `;
        }).join('')}
      </div>
    </div>

    ${_notificationsCard()}

    <div class="card fade-in">
      <div class="section-title">最近の報告（全事業部）</div>
      ${recent.length === 0 ? `<div class="empty-state">まだ報告がありません</div>` : `
        <div class="table-wrap">
          <table>
            <thead>
              <tr><th>日付</th><th>名前</th><th>事業部</th><th>内容</th></tr>
            </thead>
            <tbody>
              ${recent.map(r => {
                const u = users.find(x => x.id === r.userId);
                const content = r.type === 'refa'
                  ? `${r.productName || '—'} / ${formatMoney(r.amount)}`
                  : `MNP ${r.mnp}件 / 新規 ${r.shinki}件`;
                return `
                  <tr>
                    <td>${formatDate(r.date)}</td>
                    <td>${u?.name || '—'}</td>
                    <td style="color:${DEPTS[u?.dept]?.color || 'var(--text-sub)'}">
                      ${deptLabel(u?.dept)}
                    </td>
                    <td style="color:var(--text-sub)">${content}</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      `}
    </div>
  `;
}

// ── モバイルダッシュボード ──
function renderMobileDashboard() {
  const month = currentMonth();
  const myReports = getUserReportsForMonth(CU.id, month).filter(r => !r.type || r.type === 'mobile');
  const target = getTargetForUser(CU.id, month);
  const agg = aggregateReports(myReports);
  const myPt = agg.totalPt;
  const achieve = calcAchieve(myPt, target?.ptTarget);
  const recent = [...myReports].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5);

  // トップ商材（0より大きいもの上位3つ）
  const topProducts = PRODUCTS
    .map(p => ({ ...p, val: agg[p.key] || 0 }))
    .filter(p => p.val > 0)
    .sort((a, b) => {
      const ptA = a.type === 'amount' ? (a.val / a.per) * a.pt : a.val * a.pt;
      const ptB = b.type === 'amount' ? (b.val / b.per) * b.pt : b.val * b.pt;
      return ptB - ptA;
    })
    .slice(0, 3);

  // チーフはチームKPIも表示
  let teamSection = '';
  if (roleLevel(CU.role) >= 4) {
    const teamReports = getReports().filter(r => {
      const u = getUserById(r.userId);
      return u?.dept === 'mobile' && r.date.startsWith(month) && (!r.type || r.type === 'mobile');
    });
    const teamAgg = aggregateReports(teamReports);
    const mobileUsers = getUsers().filter(u => u.dept === 'mobile' && u.reportType === 'mobile');
    const reportedIds = new Set(teamReports.map(r => r.userId));
    const unreported = mobileUsers.filter(u => !reportedIds.has(u.id)).length;

    teamSection = `
      <div class="kpi-grid" style="grid-template-columns:repeat(3,1fr)">
        <div class="kpi-card blue">
          <div class="kpi-icon">⭐</div><div class="kpi-label">チーム総合計PT</div>
          <div class="kpi-value">${teamAgg.totalPt.toFixed(1)}</div><div class="kpi-meta">チーム合計</div>
        </div>
        <div class="kpi-card green">
          <div class="kpi-icon">📱</div><div class="kpi-label">チームSBMNP</div>
          <div class="kpi-value">${teamAgg.sbmnp}</div><div class="kpi-meta">今月合計</div>
        </div>
        <div class="kpi-card ${unreported > 0 ? 'warn' : 'green'}">
          <div class="kpi-icon">🔔</div><div class="kpi-label">未報告</div>
          <div class="kpi-value">${unreported}</div><div class="kpi-meta">今月未報告</div>
        </div>
      </div>
    `;
  }

  document.getElementById('main').innerHTML = `
    <div class="page-header fade-in">
      <div>
        <div class="page-title">こんにちは、${CU.name}さん 👋</div>
        <div class="page-sub">${monthLabel(month)}の実績サマリー</div>
      </div>
      <button class="btn btn-primary" onclick="navigate('report')">📝 実績を報告する</button>
    </div>

    ${teamSection ? `<div class="fade-in">${teamSection}</div>` : ''}

    <div class="kpi-grid fade-in">
      <div class="kpi-card blue">
        <div class="kpi-icon">⭐</div><div class="kpi-label">今月総合計PT</div>
        <div class="kpi-value" style="font-size:28px">${myPt.toFixed(1)}</div>
        <div class="kpi-meta">${target?.ptTarget ? `目標: ${target.ptTarget}pt` : '目標未設定'}</div>
      </div>
      <div class="kpi-card ${achieve !== null && achieve >= 100 ? 'green' : achieve !== null && achieve >= 70 ? 'blue' : 'warn'}">
        <div class="kpi-icon">📊</div><div class="kpi-label">達成率</div>
        <div class="kpi-value" style="color:${achieveColor(achieve)}">${achieve !== null ? achieve + '%' : '—'}</div>
        <div class="kpi-meta">${target?.ptTarget ? '今月目標PT比' : '目標未設定'}</div>
      </div>
      <div class="kpi-card green">
        <div class="kpi-icon">📱</div><div class="kpi-label">SBMNP</div>
        <div class="kpi-value">${agg.sbmnp}</div>
        <div class="kpi-meta">×5.0pt = ${(agg.sbmnp * 5).toFixed(1)}pt</div>
      </div>
      <div class="kpi-card blue">
        <div class="kpi-icon">📱</div><div class="kpi-label">YMNP</div>
        <div class="kpi-value">${agg.ymnp}</div>
        <div class="kpi-meta">×3.0pt = ${(agg.ymnp * 3).toFixed(1)}pt</div>
      </div>
    </div>

    ${_todayShiftCard(CU.id)}

    ${topProducts.length > 0 ? `
    <div class="card fade-in">
      <div class="section-title">今月の主な実績</div>
      <div style="display:flex;gap:12px;flex-wrap:wrap">
        ${topProducts.map(p => {
          const pts = p.type === 'amount' ? (p.val / p.per) * p.pt : p.val * p.pt;
          return `
            <div style="background:var(--surface2);border-radius:10px;padding:12px 16px;min-width:140px">
              <div style="font-size:11px;color:var(--text-sub);margin-bottom:4px">${p.label}</div>
              <div style="font-size:20px;font-weight:700">
                ${p.type === 'amount' ? formatMoney(p.val) : p.val + '件'}
              </div>
              <div style="font-size:12px;color:var(--accent);margin-top:2px">+${pts.toFixed(1)}pt</div>
            </div>
          `;
        }).join('')}
      </div>
    </div>
    ` : ''}

    <div class="card fade-in">
      <div class="section-title">最近の報告</div>
      ${recent.length === 0 ? `
        <div class="empty-state">
          <div style="font-size:32px;margin-bottom:8px">📋</div>
          まだ今月の報告がありません
        </div>
      ` : `
        <div class="table-wrap">
          <table>
            <thead><tr><th>日付</th><th>合計PT</th><th>SBMNP</th><th>YMNP</th><th>SB新規</th><th>メモ</th></tr></thead>
            <tbody>
              ${recent.map(r => `
                <tr>
                  <td>${formatDate(r.date)}</td>
                  <td><strong style="color:var(--accent)">${calcPoints(r).toFixed(1)}pt</strong></td>
                  <td>${r.sbmnp || 0}</td>
                  <td>${r.ymnp || 0}</td>
                  <td>${r.sb_shinki || 0}</td>
                  <td style="color:var(--text-sub)">${r.memo || '—'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `}
    </div>

    ${_notificationsCard()}
  `;
}

// ── 管理者用：本日の全社出勤サマリーカード ──
function _adminTodayShiftCard() {
  const today = todayStr();
  const users = getUsers();
  const sites = getShiftSites();

  // 現場別に出勤者をグルーピング
  const siteMap = {};
  users.forEach(u => {
    const slot = getShiftForUser(u.id, today);
    if (!slot || slot.site === '休み') return;
    siteMap[slot.site] = siteMap[slot.site] || [];
    siteMap[slot.site].push(u);
  });

  const totalWorking = Object.values(siteMap).reduce((s, arr) => s + arr.length, 0);
  const totalOff     = users.filter(u => {
    const slot = getShiftForUser(u.id, today);
    return slot?.site === '休み';
  }).length;

  if (Object.keys(siteMap).length === 0) {
    return `
      <div class="card fade-in" style="display:flex;align-items:center;gap:16px">
        <div style="font-size:28px">📅</div>
        <div>
          <div style="font-size:11px;color:var(--text-sub);font-weight:600;letter-spacing:.8px;text-transform:uppercase;margin-bottom:4px">本日の出勤状況</div>
          <div style="font-size:14px;color:var(--text-sub)">本日のシフトが未設定です</div>
        </div>
      </div>`;
  }

  return `
    <div class="card fade-in">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px">
        <div class="section-title" style="margin-bottom:0">📅 本日の出勤状況</div>
        <span style="font-size:12px;color:var(--text-sub)">出勤 <strong style="color:var(--green)">${totalWorking}</strong>名 / 休み ${totalOff}名</span>
      </div>
      <div style="display:flex;flex-direction:column;gap:10px">
        ${Object.entries(siteMap).map(([site, workers]) => {
          const c = getSiteColor(site);
          return `
            <div style="border-radius:10px;border:1px solid ${c?.border || 'var(--border)'};background:${c?.bg || 'var(--surface2)'};padding:10px 14px">
              <div style="font-size:12px;font-weight:700;color:${c?.text || 'var(--text)'};margin-bottom:6px">📍 ${site}（${workers.length}名）</div>
              <div style="display:flex;flex-wrap:wrap;gap:6px">
                ${workers.map(u => `
                  <span style="background:var(--surface);border:1px solid var(--border);border-radius:6px;padding:3px 8px;font-size:12px">${u.name}</span>
                `).join('')}
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;
}

// ── 本日シフトカード（全ダッシュボード共通） ──
function _todayShiftCard(userId) {
  const today = todayStr();
  const slot  = getShiftForUser(userId, today);
  const month = currentMonth();
  const workCount = getWorkingDaysCount(userId, month);
  const c = slot && slot.site !== '休み' ? getSiteColor(slot.site) : null;

  let icon, title, sub, chipHtml = '';
  if (!slot) {
    icon = '📅'; title = '本日のシフト未設定'; sub = '';
  } else if (slot.site === '休み') {
    icon = '🌙'; title = '本日はお休み'; sub = '';
  } else {
    icon = '📍'; title = slot.site;
    sub  = slot.start ? `${slot.start} 〜 ${slot.end}` : '';
    chipHtml = `<div class="shift-chip" style="background:${c?.bg};color:${c?.text};border-color:${c?.border};margin-top:8px">${slot.site}</div>`;
    // 同じ現場の仲間
    const colleagues = getUsers().filter(u => {
      if (u.id === userId) return false;
      const s = getShiftForUser(u.id, today);
      return s?.site === slot.site;
    });
    if (colleagues.length) {
      chipHtml += `<div style="margin-top:8px;font-size:11px;color:var(--text-sub)">同じ現場: ${colleagues.map(u => u.name).join('、')}</div>`;
    }
  }

  return `
    <div class="card fade-in" style="display:flex;align-items:flex-start;gap:16px">
      <div style="font-size:28px;line-height:1;padding-top:2px">${icon}</div>
      <div style="flex:1">
        <div style="font-size:11px;color:var(--text-sub);font-weight:600;letter-spacing:.8px;text-transform:uppercase;margin-bottom:4px">本日のシフト</div>
        <div style="font-size:16px;font-weight:700">${title}</div>
        ${sub ? `<div style="font-size:12px;color:var(--text-sub);margin-top:2px">${sub}</div>` : ''}
        ${chipHtml}
      </div>
      <div style="text-align:right;flex-shrink:0">
        <div style="font-size:11px;color:var(--text-sub)">${month.slice(5)}月出勤日数</div>
        <div style="font-size:22px;font-weight:700;color:${workCount >= 21 ? 'var(--green)' : 'var(--accent)'}">${workCount}<span style="font-size:12px;font-weight:400;color:var(--text-sub)"> / 21日</span></div>
      </div>
    </div>
  `;
}

// ── Refaダッシュボード ──
function renderRefaDashboard() {
  const month = currentMonth();
  const myReports = getUserReportsForMonth(CU.id, month).filter(r => r.type === 'refa');
  const target = getTargetForUser(CU.id, month);

  const totalAmount = myReports.reduce((s, r) => s + (r.amount || 0), 0);
  const count = myReports.length;
  const achieve = calcAchieve(totalAmount, target?.amountTarget);

  const recent = [...myReports].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5);

  document.getElementById('main').innerHTML = `
    <div class="page-header fade-in">
      <div>
        <div class="page-title">こんにちは、${CU.name}さん 👋</div>
        <div class="page-sub">${monthLabel(month)}の実績サマリー</div>
      </div>
      <button class="btn btn-primary" onclick="navigate('report')">📝 実績を報告する</button>
    </div>

    ${_todayShiftCard(CU.id)}

    <div class="kpi-grid fade-in" style="grid-template-columns:repeat(3,1fr)">
      <div class="kpi-card" style="position:relative;overflow:hidden">
        <div style="position:absolute;top:0;left:0;right:0;height:3px;background:#f472b6"></div>
        <div class="kpi-icon">💎</div><div class="kpi-label">今月売上</div>
        <div class="kpi-value" style="font-size:22px;color:#f472b6">${formatMoney(totalAmount)}</div>
        <div class="kpi-meta">${target?.amountTarget ? `目標: ${formatMoney(target.amountTarget)}` : '目標未設定'}</div>
      </div>
      <div class="kpi-card blue">
        <div class="kpi-icon">📋</div><div class="kpi-label">報告件数</div>
        <div class="kpi-value">${count}</div>
        <div class="kpi-meta">今月の報告回数</div>
      </div>
      <div class="kpi-card ${achieve !== null && achieve >= 100 ? 'green' : 'warn'}">
        <div class="kpi-icon">📊</div><div class="kpi-label">達成率</div>
        <div class="kpi-value" style="color:${achieveColor(achieve)}">${achieve !== null ? achieve + '%' : '—'}</div>
        <div class="kpi-meta">${target?.amountTarget ? '今月目標比' : '目標未設定'}</div>
      </div>
    </div>

    <div class="card fade-in">
      <div class="section-title">最近の報告</div>
      ${recent.length === 0 ? `<div class="empty-state">まだ今月の報告がありません</div>` : `
        <div class="table-wrap">
          <table>
            <thead><tr><th>日付</th><th>商材名</th><th>売上金額</th><th>メモ</th></tr></thead>
            <tbody>
              ${recent.map(r => `
                <tr>
                  <td>${formatDate(r.date)}</td>
                  <td><strong style="color:#f472b6">${r.productName || '—'}</strong></td>
                  <td><strong>${formatMoney(r.amount)}</strong></td>
                  <td style="color:var(--text-sub)">${r.memo || '—'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `}
    </div>

    ${_notificationsCard()}
  `;
}

// ── 基本ダッシュボード（わたあめ師・人財部等） ──
function renderBasicDashboard() {
  const dept = DEPTS[CU.dept];
  document.getElementById('main').innerHTML = `
    <div class="page-header fade-in">
      <div>
        <div class="page-title">こんにちは、${CU.name}さん 👋</div>
        <div class="page-sub">${dept?.label || ''}</div>
      </div>
    </div>
    ${_todayShiftCard(CU.id)}
    ${_notificationsCard()}
    <div class="card fade-in" style="text-align:center;padding:40px">
      <div style="font-size:40px;margin-bottom:12px">🏢</div>
      <div style="font-size:16px;font-weight:600;margin-bottom:6px">LUMP CORE</div>
      <div style="color:var(--text-sub);font-size:13px">
        ${getUserDisplayRole(CU)} / ${dept?.label || ''}<br>
        <span style="margin-top:6px;display:block">今月もよろしくお願いします！</span>
      </div>
    </div>
  `;
}

// ═══════════════════════════════════════════════════════
// ─── PAGE: 実績報告 ───
// ═══════════════════════════════════════════════════════
function renderReportPage() {
  if (CU.reportType === 'refa') renderRefaReportPage();
  else renderMobileReportPage();
}

// ── モバイル報告フォーム ──
function renderMobileReportPage() {
  const month = currentMonth();
  const myReports = getUserReportsForMonth(CU.id, month)
    .filter(r => !r.type || r.type === 'mobile')
    .sort((a, b) => b.date.localeCompare(a.date));

  // 今日のシフトから現場を自動取得
  const todayShift   = getShiftForUser(CU.id, todayStr());
  const initialSite  = (todayShift && todayShift.site && todayShift.site !== '休み') ? todayShift.site : '';
  const siteHint     = todayShift
    ? (todayShift.site === '休み'
        ? '本日は休日シフトです'
        : `シフトから自動入力 (${[todayShift.start, todayShift.end].filter(Boolean).join('〜')})`)
    : '';
  const allSites = getShiftSites().filter(s => s !== '休み');

  // グループ別にフィールドを生成
  const groups = [...new Set(PRODUCTS.map(p => p.group))];
  const formFields = groups.map(g => {
    const products = PRODUCTS.filter(p => p.group === g);
    return `
      <div style="margin-bottom:20px">
        <div style="font-size:11px;font-weight:700;color:var(--text-sub);letter-spacing:.8px;text-transform:uppercase;margin-bottom:10px;padding-bottom:6px;border-bottom:1px solid var(--border)">${g}</div>
        <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:10px">
          ${products.map(p => `
            <div class="form-group">
              <label class="form-label" style="display:flex;justify-content:space-between">
                <span>${p.label}</span>
                <span style="color:var(--accent);font-weight:600">${p.pt}pt${p.type === 'amount' ? `/${(p.per/10000)}万円` : '/件'}</span>
              </label>
              <input type="number" class="form-input" id="f_${p.key}"
                placeholder="${p.type === 'amount' ? '金額（円）' : '0'}"
                min="0" value="0" oninput="updatePtPreview()">
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }).join('');

  document.getElementById('main').innerHTML = `
    <div class="page-header fade-in">
      <div>
        <div class="page-title">実績報告</div>
        <div class="page-sub">${monthLabel(month)} — 商材ごとに入力してください</div>
      </div>
    </div>

    <div class="card fade-in" style="max-width:680px">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px">
        <div class="section-title" style="margin-bottom:0">新規報告</div>
        <div style="background:rgba(79,124,255,.1);border:1px solid rgba(79,124,255,.3);border-radius:10px;padding:8px 16px;text-align:center">
          <div style="font-size:11px;color:var(--text-sub)">本日合計</div>
          <div style="font-size:22px;font-weight:700;color:var(--accent)" id="ptPreview">0.0pt</div>
        </div>
      </div>

      <div style="display:flex;gap:16px;flex-wrap:wrap;margin-bottom:20px">
        <div class="form-group" style="margin-bottom:0">
          <label class="form-label">日付</label>
          <input type="date" class="form-input" id="repDate" value="${todayStr()}"
                 style="max-width:200px" onchange="updateSiteFromShift(this.value)">
        </div>
        <div class="form-group" style="margin-bottom:0;flex:1;min-width:180px">
          <label class="form-label">現場</label>
          <input type="text" class="form-input" id="repSite"
                 value="${initialSite.replace(/"/g,'&quot;')}"
                 placeholder="現場名を入力または選択"
                 list="repSiteList" autocomplete="off">
          <datalist id="repSiteList">
            ${allSites.map(s => `<option value="${s.replace(/"/g,'&quot;')}">`).join('')}
          </datalist>
          ${siteHint ? `<div style="font-size:11px;color:var(--text-sub);margin-top:4px" id="repSiteHint">${siteHint}</div>` : `<div style="font-size:11px;color:var(--text-sub);margin-top:4px" id="repSiteHint"></div>`}
        </div>
      </div>

      ${formFields}

      <div class="form-group">
        <label class="form-label">メモ（任意）</label>
        <textarea class="form-textarea" id="repMemo" placeholder="一言コメントがあれば..."></textarea>
      </div>
      <div style="margin-top:16px">
        <button class="btn btn-primary" onclick="submitMobileReport()">報告する</button>
      </div>
    </div>

    <div class="card fade-in">
      <div class="section-title">今月の報告履歴（${myReports.length}件）</div>
      ${myReports.length === 0 ? `<div class="empty-state">今月の報告がありません</div>` : `
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>日付</th><th>現場</th><th>合計PT</th><th>SBMNP</th><th>YMNP</th><th>Y→S</th>
                <th>SB新規</th><th>YM新規</th><th>光/AIR</th><th>メモ</th><th></th>
              </tr>
            </thead>
            <tbody>
              ${myReports.map(r => `
                <tr>
                  <td>${formatDate(r.date)}</td>
                  <td style="color:var(--text-sub);white-space:nowrap">${r.site || '—'}</td>
                  <td><strong style="color:var(--accent)">${calcPoints(r).toFixed(1)}pt</strong></td>
                  <td>${r.sbmnp || 0}</td>
                  <td>${r.ymnp || 0}</td>
                  <td>${r.y_to_s || 0}</td>
                  <td>${r.sb_shinki || 0}</td>
                  <td>${r.ym_shinki || 0}</td>
                  <td>${r.hikari_air || 0}</td>
                  <td style="color:var(--text-sub);max-width:120px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${r.memo || '—'}</td>
                  <td><button class="btn-icon" onclick="confirmDeleteReport('${r.id}')">🗑️</button></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `}
    </div>
  `;
}

// 日付変更時にシフトから現場を自動入力
function updateSiteFromShift(dateStr) {
  const shift = getShiftForUser(CU.id, dateStr);
  const inp   = document.getElementById('repSite');
  const hint  = document.getElementById('repSiteHint');
  if (!inp) return;
  if (shift && shift.site && shift.site !== '休み') {
    inp.value = shift.site;
    if (hint) hint.textContent = `シフトから自動入力 (${[shift.start, shift.end].filter(Boolean).join('〜')})`;
  } else {
    inp.value = '';
    if (hint) hint.textContent = (shift && shift.site === '休み') ? '本日は休日シフトです' : '';
  }
}

function updatePtPreview() {
  const mock = {};
  PRODUCTS.forEach(p => { mock[p.key] = Number(document.getElementById(`f_${p.key}`)?.value || 0); });
  const pts = calcPoints(mock);
  const el = document.getElementById('ptPreview');
  if (el) el.textContent = pts.toFixed(1) + 'pt';
}

function submitMobileReport() {
  const date = document.getElementById('repDate').value;
  const memo = document.getElementById('repMemo').value.trim();

  if (!date) { showToast('日付を選択してください', 'error'); return; }

  const site   = document.getElementById('repSite')?.value?.trim() || '';
  const report = { userId: CU.id, date, memo, type: 'mobile', site };
  PRODUCTS.forEach(p => {
    report[p.key] = Number(document.getElementById(`f_${p.key}`)?.value || 0);
  });

  if (calcPoints(report) === 0) {
    showToast('いずれかの商材を入力してください', 'error'); return;
  }

  addReport(report);
  showToast('報告しました！');
  renderMobileReportPage();
}

// ── Refa報告フォーム ──
function renderRefaReportPage() {
  const month = currentMonth();
  const myReports = getUserReportsForMonth(CU.id, month)
    .filter(r => r.type === 'refa')
    .sort((a, b) => b.date.localeCompare(a.date));

  document.getElementById('main').innerHTML = `
    <div class="page-header fade-in">
      <div>
        <div class="page-title">実績報告</div>
        <div class="page-sub">${monthLabel(month)} — Refa売上を入力してください</div>
      </div>
    </div>

    <div class="card fade-in" style="max-width:600px">
      <div class="section-title">新規報告</div>
      <div class="form-group">
        <label class="form-label">日付</label>
        <input type="date" class="form-input" id="repDate" value="${todayStr()}">
      </div>
      <div class="form-group" style="margin-top:12px">
        <label class="form-label">💎 商材名</label>
        <input type="text" class="form-input" id="repProduct" placeholder="例: ReFa CARAT RAY">
      </div>
      <div class="form-group" style="margin-top:12px">
        <label class="form-label">💴 売上金額（円）</label>
        <input type="number" class="form-input" id="repAmount" placeholder="例: 28000" min="0">
      </div>
      <div class="form-group" style="margin-top:12px">
        <label class="form-label">メモ（任意）</label>
        <textarea class="form-textarea" id="repMemo" placeholder="一言コメントがあれば..."></textarea>
      </div>
      <div style="margin-top:16px">
        <button class="btn btn-primary" onclick="submitRefaReport()">報告する</button>
      </div>
    </div>

    <div class="card fade-in">
      <div class="section-title">今月の報告履歴（${myReports.length}件）</div>
      ${myReports.length === 0 ? `<div class="empty-state">今月の報告がありません</div>` : `
        <div class="table-wrap">
          <table>
            <thead><tr><th>日付</th><th>商材名</th><th>売上金額</th><th>メモ</th><th></th></tr></thead>
            <tbody>
              ${myReports.map(r => `
                <tr>
                  <td>${r.date}</td>
                  <td><strong style="color:#f472b6">${r.productName || '—'}</strong></td>
                  <td><strong>${formatMoney(r.amount)}</strong></td>
                  <td style="color:var(--text-sub)">${r.memo || '—'}</td>
                  <td><button class="btn-icon" onclick="confirmDeleteReport('${r.id}')">🗑️</button></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `}
    </div>
  `;
}

function submitRefaReport() {
  const date        = document.getElementById('repDate').value;
  const productName = document.getElementById('repProduct').value.trim();
  const amount      = parseInt(document.getElementById('repAmount').value) || 0;
  const memo        = document.getElementById('repMemo').value.trim();

  if (!date) { showToast('日付を選択してください', 'error'); return; }
  if (!productName) { showToast('商材名を入力してください', 'error'); return; }
  if (amount <= 0) { showToast('売上金額を入力してください', 'error'); return; }

  addReport({ userId: CU.id, date, productName, amount, memo, type: 'refa' });
  showToast('報告しました！');
  renderRefaReportPage();
}

// ── 報告削除 ──
function confirmDeleteReport(reportId) {
  showModal(`
    <div class="modal-header">
      <div style="font-size:20px">🗑️</div>
      <div class="modal-title">報告を削除</div>
      <button class="modal-close" onclick="closeModal()">✕</button>
    </div>
    <div class="modal-body">
      <p style="color:var(--text-sub)">この報告を削除しますか？元に戻せません。</p>
    </div>
    <div class="modal-footer">
      <button class="btn btn-ghost" onclick="closeModal()">キャンセル</button>
      <button class="btn btn-danger" onclick="execDeleteReport('${reportId}')">削除する</button>
    </div>
  `);
}
function execDeleteReport(reportId) {
  deleteReportById(reportId);
  closeModal();
  showToast('削除しました');
  renderReportPage();
}

// ═══════════════════════════════════════════════════════
// ─── PAGE: チーム実績 ───
// ═══════════════════════════════════════════════════════
function renderTeam(filterDept) {
  const month = currentMonth();
  const level = roleLevel(CU.role);
  const isAdmin = level >= 5;

  // 管理者は全部署 or フィルター、それ以外は自部署のみ
  const targetDept = isAdmin ? (filterDept || '') : CU.dept;
  const users = getUsers().filter(u =>
    u.reportType && (targetDept ? u.dept === targetDept : true)
  );

  const allReports = getReports().filter(r => r.date.startsWith(month));
  const targets = getTargets();

  const stats = users.map(u => {
    const uReports = allReports.filter(r => r.userId === u.id);
    let totalPt = 0, displayPrimary = '', displaySecondary = '';
    let achieve = null;
    const t = targets.find(x => x.userId === u.id && x.month === month);

    if (u.reportType === 'mobile') {
      const agg = aggregateReports(uReports.filter(r => !r.type || r.type === 'mobile'));
      totalPt = agg.totalPt;
      displayPrimary   = `${agg.sbmnp}件`;
      displaySecondary = `${agg.ymnp}件`;
      achieve = calcAchieve(totalPt, t?.ptTarget);
    } else if (u.reportType === 'refa') {
      const amount = uReports.reduce((s, r) => s + (r.amount || 0), 0);
      totalPt = amount;
      displayPrimary = formatMoney(amount);
      achieve = calcAchieve(amount, t?.amountTarget);
    }

    const last = [...uReports].sort((a, b) => b.date.localeCompare(a.date))[0];
    return { ...u, totalPt, displayPrimary, displaySecondary, achieve, last };
  }).sort((a, b) => b.totalPt - a.totalPt);

  const deptFilter = isAdmin ? `
    <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
      ${[['', '全部署'], ...Object.entries(DEPTS).filter(([k]) => k !== 'executive' && k !== 'hr')
        .map(([k, v]) => [k, v.label])].map(([key, label]) => `
        <button class="btn ${(filterDept || '') === key ? 'btn-primary' : 'btn-ghost'}"
          style="font-size:12px;padding:6px 12px"
          onclick="renderTeam('${key}')">
          ${label}
        </button>
      `).join('')}
    </div>
  ` : '';

  document.getElementById('main').innerHTML = `
    <div class="page-header fade-in">
      <div>
        <div class="page-title">チーム実績</div>
        <div class="page-sub">${monthLabel(month)} — ${targetDept ? deptLabel(targetDept) : '全事業部'}</div>
      </div>
      ${deptFilter}
    </div>

    <div class="card fade-in">
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>名前</th>
              ${isAdmin ? '<th>事業部</th>' : ''}
              <th>役職</th>
              <th>合計PT / 売上</th>
              <th>SBMNP</th>
              <th>YMNP</th>
              <th>達成率</th>
              <th>最終報告</th>
            </tr>
          </thead>
          <tbody>
            ${stats.map(u => {
              const isMobile = u.reportType === 'mobile';
              return `
                <tr>
                  <td>
                    <div class="emp-cell">
                      <div class="avatar" style="background:${roleColor(u.role)}">${u.name[0]}</div>
                      <span class="emp-name">${u.name}</span>
                    </div>
                  </td>
                  ${isAdmin ? `<td style="color:${DEPTS[u.dept]?.color};font-size:12px">${deptLabel(u.dept)}</td>` : ''}
                  <td style="color:${roleColor(u.role)};font-size:12px">${getUserDisplayRole(u)}</td>
                  <td><strong style="color:var(--accent)">${isMobile ? u.totalPt.toFixed(1) + 'pt' : u.displayPrimary}</strong></td>
                  <td>${isMobile ? u.displayPrimary : '—'}</td>
                  <td>${isMobile ? u.displaySecondary : '—'}</td>
                  <td>
                    ${u.achieve !== null ? `
                      <div class="progress-wrap">
                        <div class="progress-bar">
                          <div class="progress-fill" style="width:${Math.min(u.achieve,100)}%;background:${achieveColor(u.achieve)}"></div>
                        </div>
                        <span style="color:${achieveColor(u.achieve)};min-width:40px;font-size:12px">${u.achieve}%</span>
                      </div>
                    ` : '<span style="color:var(--text-sub);font-size:12px">未設定</span>'}
                  </td>
                  <td style="color:${u.last ? 'var(--text-sub)' : 'var(--danger)'};font-size:12px">
                    ${u.last ? formatDate(u.last.date) : '未報告'}
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

// ═══════════════════════════════════════════════════════
// ─── PAGE: ランキング ───
// ═══════════════════════════════════════════════════════
function renderRanking() {
  if (!rankMonth) rankMonth = currentMonth();

  const level = roleLevel(CU.role);
  const isAdmin = level >= 5;
  const months = getAvailableMonths();
  const medals = ['🥇', '🥈', '🥉'];

  // モバイルのみ商材別ランキング対応
  const isMobileRank = !rankItem || rankItem === '_refa' ? false : true;
  const showMobile = !rankItem || rankItem !== '_refa';

  // ── モバイルランキング計算 ──
  const mobileUsers = getUsers().filter(u => u.dept === 'mobile' && u.reportType === 'mobile');
  const mobileReports = getReports().filter(r =>
    r.date.startsWith(rankMonth) && (!r.type || r.type === 'mobile')
  );
  const mobileStats = mobileUsers.map(u => {
    const uReports = mobileReports.filter(r => r.userId === u.id);
    const agg = aggregateReports(uReports);
    let sortVal;
    if (!rankItem) {
      sortVal = agg.totalPt;
    } else {
      const p = PRODUCTS.find(x => x.key === rankItem);
      sortVal = p ? agg[rankItem] : 0;
    }
    return { ...u, agg, sortVal };
  }).sort((a, b) => b.sortVal - a.sortVal);

  // ── Refaランキング計算 ──
  const refaUsers = getUsers().filter(u => u.dept === 'event_promo' && u.reportType === 'refa');
  const refaReports = getReports().filter(r => r.date.startsWith(rankMonth) && r.type === 'refa');
  const refaStats = refaUsers.map(u => {
    const uReports = refaReports.filter(r => r.userId === u.id);
    const total = uReports.reduce((s, r) => s + (r.amount || 0), 0);
    return { ...u, total };
  }).sort((a, b) => b.total - a.total);

  // ── 商材タブ生成 ──
  const productTabs = [
    { key: '', label: '総合PT' },
    ...PRODUCTS.map(p => ({ key: p.key, label: p.label })),
  ];

  const selectedProduct = rankItem ? PRODUCTS.find(p => p.key === rankItem) : null;

  document.getElementById('main').innerHTML = `
    <div class="page-header fade-in">
      <div>
        <div class="page-title">ランキング</div>
        <div class="page-sub">${monthLabel(rankMonth)}</div>
      </div>
      <select class="filter-select" id="rankMonthSel" onchange="rankMonth=this.value;renderRanking()">
        ${months.map(m => `<option value="${m}" ${m === rankMonth ? 'selected' : ''}>${monthLabel(m)}</option>`).join('')}
      </select>
    </div>

    <!-- モバイル：商材タブ -->
    <div style="overflow-x:auto;padding-bottom:4px" class="fade-in">
      <div class="tab-bar">
        ${productTabs.map(t => `
          <button class="tab ${rankItem === t.key ? 'active' : ''}"
            onclick="rankItem='${t.key}';renderRanking()">
            ${t.label}
          </button>
        `).join('')}
      </div>
    </div>

    <!-- モバイルランキング -->
    <div class="card fade-in">
      <div class="section-title" style="display:flex;align-items:center;gap:8px">
        モバイル事業部
        ${selectedProduct ? `<span style="color:var(--accent);font-size:12px">— ${selectedProduct.label}（${selectedProduct.pt}pt/${selectedProduct.type === 'amount' ? `${selectedProduct.per/10000}万円` : '件'}）</span>` : ''}
      </div>
      ${mobileStats.filter(u => u.sortVal > 0).length === 0 ? `
        <div class="empty-state">${monthLabel(rankMonth)}のデータがありません</div>
      ` : mobileStats.map((u, i) => {
        const displayVal = !rankItem
          ? `${u.agg.totalPt.toFixed(1)}pt`
          : selectedProduct?.type === 'amount'
            ? formatMoney(u.sortVal)
            : `${u.sortVal}件`;
        const subVal = !rankItem
          ? `SBMNP ${u.agg.sbmnp} / YMNP ${u.agg.ymnp} / SB新規 ${u.agg.sb_shinki}`
          : !rankItem ? '' : '';
        return `
          <div class="rank-item ${i < 3 ? 'rank-top' : ''}" ${u.sortVal === 0 ? 'style="opacity:.4"' : ''}>
            <div class="rank-num">${u.sortVal > 0 ? (medals[i] || (i + 1)) : '—'}</div>
            <div class="avatar" style="background:${roleColor(u.role)}">${u.name[0]}</div>
            <div class="rank-info">
              <div class="rank-name">${u.name}</div>
              <div class="rank-role" style="color:${roleColor(u.role)}">${getUserDisplayRole(u)}</div>
              ${subVal ? `<div style="font-size:11px;color:var(--text-sub);margin-top:2px">${subVal}</div>` : ''}
            </div>
            <div class="rank-stats">
              <span class="rank-total" style="color:${u.sortVal > 0 ? 'var(--accent)' : 'var(--text-sub)'}">${displayVal}</span>
            </div>
          </div>
        `;
      }).join('')}
    </div>

    ${isAdmin || CU.dept === 'event_promo' ? `
    <!-- Refaランキング -->
    <div class="card fade-in">
      <div class="section-title">イベントプロモーション部 — Refa売上</div>
      ${refaStats.length === 0 ? `<div class="empty-state">${monthLabel(rankMonth)}のデータがありません</div>` :
        refaStats.map((u, i) => `
          <div class="rank-item ${i < 3 ? 'rank-top' : ''}" ${u.total === 0 ? 'style="opacity:.4"' : ''}>
            <div class="rank-num">${u.total > 0 ? (medals[i] || (i + 1)) : '—'}</div>
            <div class="avatar" style="background:${roleColor(u.role)}">${u.name[0]}</div>
            <div class="rank-info">
              <div class="rank-name">${u.name}</div>
              <div class="rank-role" style="color:${roleColor(u.role)}">${getUserDisplayRole(u)}</div>
            </div>
            <div class="rank-stats">
              <span class="rank-total" style="color:#f472b6">${formatMoney(u.total)}</span>
            </div>
          </div>
        `).join('')}
    </div>
    ` : ''}
  `;
}

// ═══════════════════════════════════════════════════════
// ─── PAGE: 目標設定 ───
// ═══════════════════════════════════════════════════════
function renderTargets() {
  const month = currentMonth();
  const level = roleLevel(CU.role);
  const isAdmin = level >= 5;

  // 管理者は全reportType持ちユーザー、チーフはモバイルのみ
  const users = getUsers().filter(u =>
    u.reportType && (isAdmin || u.dept === 'mobile')
  );
  const targets = getTargets();

  document.getElementById('main').innerHTML = `
    <div class="page-header fade-in">
      <div>
        <div class="page-title">目標設定</div>
        <div class="page-sub">${monthLabel(month)}のメンバー別目標</div>
      </div>
      <button class="btn btn-primary" onclick="saveAllTargets()">全員まとめて保存</button>
    </div>

    <div class="card fade-in">
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>名前</th>
              ${isAdmin ? '<th>事業部</th>' : ''}
              <th>役職</th>
              <th>目標①</th>
              <th>目標②</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            ${users.map(u => {
              const t = targets.find(x => x.userId === u.id && x.month === month);
              const isMobile = u.reportType === 'mobile';
              return `
                <tr>
                  <td>
                    <div class="emp-cell">
                      <div class="avatar" style="background:${roleColor(u.role)}">${u.name[0]}</div>
                      <span>${u.name}</span>
                    </div>
                  </td>
                  ${isAdmin ? `<td style="color:${DEPTS[u.dept]?.color};font-size:12px">${deptLabel(u.dept)}</td>` : ''}
                  <td style="color:${roleColor(u.role)};font-size:12px">${getUserDisplayRole(u)}</td>
                  ${isMobile ? `
                    <td><input type="number" class="form-input-sm" id="pt_${u.id}" value="${t?.ptTarget ?? ''}" placeholder="PT目標" min="0" style="width:90px"></td>
                    <td style="color:var(--text-sub);font-size:12px">pt</td>
                  ` : `
                    <td><input type="number" class="form-input-sm" id="amt_${u.id}" value="${t?.amountTarget ?? ''}" placeholder="目標売上" min="0" style="width:120px"></td>
                    <td style="color:var(--text-sub);font-size:12px">円</td>
                  `}
                  <td>
                    <button class="btn btn-ghost" style="font-size:12px;padding:6px 12px"
                      onclick="saveOneTarget('${u.id}','${u.reportType}')">保存</button>
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function saveOneTarget(userId, reportType) {
  const month = currentMonth();
  if (reportType === 'mobile') {
    const pt = parseFloat(document.getElementById(`pt_${userId}`)?.value) || 0;
    _upsertTarget(userId, month, { ptTarget: pt });
  } else {
    const amt = parseInt(document.getElementById(`amt_${userId}`)?.value) || 0;
    setRefaTarget(userId, month, amt);
  }
  showToast('目標を保存しました');
}

function saveAllTargets() {
  const users = getUsers().filter(u => u.reportType);
  users.forEach(u => {
    if (u.reportType === 'mobile') {
      const pt = parseFloat(document.getElementById(`pt_${u.id}`)?.value) || 0;
      _upsertTarget(u.id, currentMonth(), { ptTarget: pt });
    } else if (u.reportType === 'refa') {
      const amt = parseInt(document.getElementById(`amt_${u.id}`)?.value) || 0;
      setRefaTarget(u.id, currentMonth(), amt);
    }
  });
  showToast('全員の目標を保存しました！');
}

// ═══════════════════════════════════════════════════════
// ═══════════════════════════════════════════════════════
// ─── PAGE: シフト ───
// ═══════════════════════════════════════════════════════
function renderShifts() {
  if (!shiftWeekStart) shiftWeekStart = getMondayOf(new Date());

  const level    = roleLevel(CU.role);
  const canEdit  = level >= 4;
  const users    = getUsers();
  const sites    = getShiftSites();
  const weekDates = getWeekDates(shiftWeekStart);
  const today    = todayStr();
  const dayNames = ['月', '火', '水', '木', '金', '土', '日'];

  // 今週の月・日を表示
  const wStart = weekDates[0];
  const wEnd   = weekDates[6];
  const weekLabel = `${wStart.getMonth()+1}/${wStart.getDate()}(月) ～ ${wEnd.getMonth()+1}/${wEnd.getDate()}(日)`;

  // 月ラベル（シフト表示中の月）
  const dispMonth = `${wStart.getFullYear()}-${String(wStart.getMonth()+1).padStart(2,'0')}`;

  // 現場凡例
  const siteLegend = sites.map((site, i) => {
    const c = SITE_COLORS[i % SITE_COLORS.length];
    return `<span class="shift-chip" style="background:${c.bg};color:${c.text};border-color:${c.border}">📍 ${site}</span>`;
  }).join('');

  // 社員行を生成
  const rows = users.map(u => {
    const workCount = getWorkingDaysCount(u.id, dispMonth);
    const workColor = workCount >= 21 ? 'var(--green)' : workCount >= 15 ? 'var(--accent)' : 'var(--text-sub)';

    const cells = weekDates.map((d, di) => {
      const ds    = dateToStr(d);
      const slot  = getShiftForUser(u.id, ds);
      const isToday = ds === today;
      const isOff   = slot?.site === '休み';
      const c     = slot && !isOff ? getSiteColor(slot.site) : null;
      const tone  = getShiftDayTone(d.getDay());

      const chipStyle = c
        ? `background:${c.bg};color:${c.text};border-color:${c.border}`
        : isOff
          ? 'background:rgba(122,130,153,.1);color:var(--text-sub);border-color:rgba(122,130,153,.2)'
          : 'background:transparent;color:var(--text-sub);border-color:var(--border)';

      const chipLabel = slot
        ? (isOff ? '休' : _shortSite(slot.site))
        : '—';

      const timeLabel = slot && !isOff && slot.start
        ? `<div style="font-size:10px;color:var(--text-sub);margin-top:2px">${slot.start}〜</div>`
        : '';

      const cellBg = isToday
        ? 'background:rgba(79,124,255,.1);'
        : `background:${tone.cellBg};`;

      if (canEdit) {
        return `
          <td class="shift-cell" style="${cellBg}" onclick="openShiftModal('${u.id}','${ds}')">
            <div class="shift-chip" style="${chipStyle};cursor:pointer">${chipLabel}</div>
            ${timeLabel}
          </td>`;
      }
      return `
        <td class="shift-cell" style="${cellBg}">
          <div class="shift-chip" style="${chipStyle}">${chipLabel}</div>
          ${timeLabel}
        </td>`;
    }).join('');

    return `
      <tr>
        <td class="shift-name-cell">
          <div class="emp-cell">
            <div class="avatar" style="width:28px;height:28px;font-size:11px;background:${roleColor(u.role)}">${u.name[0]}</div>
            <div>
              <div style="font-size:12px;font-weight:600">${u.name}</div>
              <div style="font-size:10px;color:${workColor}">${dispMonth.slice(5)}月 ${workCount}日出勤</div>
            </div>
          </div>
        </td>
        ${cells}
      </tr>`;
  }).join('');

  document.getElementById('main').innerHTML = `
    <div class="page-header fade-in">
      <div>
        <div class="page-title">シフト表</div>
        <div class="page-sub">月間21日出勤目標 ${canEdit ? '— <span style="color:var(--green)">セルをクリックで編集</span>' : '— 閲覧のみ'}</div>
      </div>
      <div style="display:flex;gap:8px;align-items:center">
        <button class="btn btn-ghost" style="font-size:18px;padding:6px 12px" onclick="moveWeek(-1)">◀</button>
        <span style="font-size:13px;font-weight:600;min-width:220px;text-align:center">${weekLabel}</span>
        <button class="btn btn-ghost" style="font-size:18px;padding:6px 12px" onclick="moveWeek(1)">▶</button>
      </div>
    </div>

    <!-- 凡例 -->
    <div class="fade-in" style="display:flex;gap:8px;flex-wrap:wrap;align-items:center">
      <span style="font-size:11px;color:var(--text-sub)">現場：</span>
      ${siteLegend}
      <span class="shift-chip" style="background:rgba(122,130,153,.1);color:var(--text-sub);border-color:rgba(122,130,153,.2)">休</span>
    </div>

    <!-- シフト表 -->
    <div class="card fade-in" style="padding:0;overflow:hidden">
      <div style="overflow-x:auto">
        <table class="shift-table">
          <thead>
            <tr>
              <th class="shift-name-cell" style="font-size:11px">社員</th>
              ${weekDates.map((d, i) => {
                const ds = dateToStr(d);
                const isToday = ds === today;
                const tone = getShiftDayTone(d.getDay());
                return `
                  <th style="text-align:center;background:${isToday ? 'rgba(79,124,255,.16)' : tone.headBg}">
                    <div style="color:${tone.textColor};font-weight:700">${dayNames[i]}</div>
                    <div style="font-size:16px;font-weight:700;color:${isToday ? 'var(--accent)' : 'var(--text)'}">${d.getDate()}</div>
                  </th>`;
              }).join('')}
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    </div>
  `;
}

function renderShiftsMonth() {
  if (!shiftMonthCursor) {
    const d = new Date();
    shiftMonthCursor = new Date(d.getFullYear(), d.getMonth(), 1);
  }
  const viewableUsers = getShiftViewableUsers();
  if (!shiftMonthUserId || !viewableUsers.some(u => u.id === shiftMonthUserId)) {
    shiftMonthUserId = (viewableUsers.find(u => u.id === CU.id) || viewableUsers[0])?.id || '';
  }
  const selectedUser = getUserById(shiftMonthUserId);
  const monthStr = `${shiftMonthCursor.getFullYear()}-${String(shiftMonthCursor.getMonth() + 1).padStart(2, '0')}`;
  const monthLabelText = monthLabel(monthStr);
  const workCount = selectedUser ? getWorkingDaysCount(selectedUser.id, monthStr) : 0;

  // 実績報告チェック（reportType があるユーザーのみ）
  const needsReport = !!selectedUser?.reportType;
  const reportedDates = needsReport
    ? new Set(getUserReportsForMonth(selectedUser.id, monthStr).map(r => r.date))
    : new Set();
  const today = todayStr();

  // 過去の出勤日で報告済み/未報告の集計
  let workDaysPast = 0, reportedCount = 0;
  if (needsReport) {
    const lastDay = new Date(shiftMonthCursor.getFullYear(), shiftMonthCursor.getMonth() + 1, 0).getDate();
    for (let d = 1; d <= lastDay; d++) {
      const ds = dateToStr(new Date(shiftMonthCursor.getFullYear(), shiftMonthCursor.getMonth(), d));
      if (ds > today) break;
      const slot = getShiftForUser(selectedUser.id, ds);
      if (slot && slot.site !== '休み') {
        workDaysPast++;
        if (reportedDates.has(ds)) reportedCount++;
      }
    }
  }

  const weeks = buildMonthMatrix(shiftMonthCursor);
  const calendarHtml = weeks.map(week => `
    <tr>
      ${week.map(day => {
        if (!day) return `<td class="month-cell is-empty"></td>`;
        const ds = dateToStr(day);
        const slot = selectedUser ? getShiftForUser(selectedUser.id, ds) : null;
        const isToday = ds === today;
        const wk = day.getDay();
        const tone = getShiftDayTone(wk);
        const isOff = slot?.site === '休み';
        const c = slot && !isOff ? getSiteColor(slot.site) : null;
        const chipStyle = c
          ? `background:${c.bg};color:${c.text};border-color:${c.border}`
          : isOff
            ? 'background:rgba(122,130,153,.1);color:var(--text-sub);border-color:rgba(122,130,153,.2)'
            : 'background:transparent;color:var(--text-sub);border-color:var(--border)';
        // 報告バッジ（出勤日 & reportType あり & 当日以前のみ）
        let reportBadge = '';
        if (needsReport && slot && !isOff && ds <= today) {
          if (reportedDates.has(ds)) {
            reportBadge = `<div class="report-badge report-ok">✓ 報告済</div>`;
          } else {
            reportBadge = `<div class="report-badge report-missing">! 未報告</div>`;
          }
        }
        return `
          <td class="month-cell ${isToday ? 'is-today' : ''}" style="${isToday ? '' : `background:${tone.cellBg};`}">
            <div class="month-day" style="color:${tone.textColor}">${day.getDate()}</div>
            <div class="shift-chip" style="${chipStyle}">${slot ? (isOff ? '休' : _shortSite(slot.site)) : '—'}</div>
            ${slot && !isOff && slot.start ? `<div class="month-time">${slot.start}〜</div>` : ''}
            ${reportBadge}
          </td>
        `;
      }).join('')}
    </tr>
  `).join('');

  document.getElementById('main').innerHTML = `
    <div class="page-header fade-in">
      <div>
        <div class="page-title">月次シフト</div>
        <div class="page-sub">1人ずつカレンダーで確認できます</div>
      </div>
      <div style="display:flex;gap:8px;align-items:center">
        <button class="btn btn-ghost" style="font-size:18px;padding:6px 12px" onclick="moveShiftMonth(-1)">◀</button>
        <span style="font-size:13px;font-weight:600;min-width:140px;text-align:center">${monthLabelText}</span>
        <button class="btn btn-ghost" style="font-size:18px;padding:6px 12px" onclick="moveShiftMonth(1)">▶</button>
      </div>
    </div>

    <div class="card fade-in" style="display:flex;gap:16px;align-items:center;flex-wrap:wrap">
      <div class="form-group" style="min-width:220px;margin:0">
        <label class="form-label">表示メンバー</label>
        <select class="form-select" onchange="changeShiftMonthUser(this.value)">
          ${viewableUsers.map(u => `<option value="${u.id}" ${u.id === shiftMonthUserId ? 'selected' : ''}>${u.name}（${getUserDisplayRole(u)}）</option>`).join('')}
        </select>
      </div>
      <div style="font-size:13px;color:var(--text-sub)">
        <span style="color:var(--text)">${selectedUser?.name || '-'}</span> の ${shiftMonthCursor.getMonth() + 1}月出勤日数：
        <span style="font-weight:700;color:${workCount >= 21 ? 'var(--green)' : 'var(--accent)'}">${workCount}日</span>
      </div>
      ${needsReport && workDaysPast > 0 ? (() => {
        const pct = Math.round(reportedCount / workDaysPast * 100);
        const color = pct === 100 ? 'var(--green)' : pct >= 70 ? 'var(--warn)' : 'var(--danger)';
        return `
        <div style="flex:1;min-width:200px">
          <div class="report-summary-bar">
            <span style="color:var(--text-sub);white-space:nowrap">報告完了率</span>
            <div class="report-progress-track">
              <div class="report-progress-fill" style="width:${pct}%;background:${color}"></div>
            </div>
            <span style="font-weight:700;color:${color};white-space:nowrap">${reportedCount}/${workDaysPast}日 (${pct}%)</span>
          </div>
        </div>`;
      })() : needsReport ? `<div style="font-size:12px;color:var(--text-sub)">まだ出勤日がありません</div>` : ''}
    </div>

    <div class="card fade-in" style="padding:0;overflow:hidden">
      <table class="month-shift-calendar">
        <thead>
          <tr>
            ${['日', '月', '火', '水', '木', '金', '土'].map((name, i) => {
              const tone = getShiftDayTone(i);
              return `<th style="color:${tone.textColor};background:${tone.headBg}">${name}</th>`;
            }).join('')}
          </tr>
        </thead>
        <tbody>${calendarHtml}</tbody>
      </table>
    </div>
  `;
}

// 現場名を短縮（長い名前が多いため）
function _shortSite(site) {
  if (!site) return '—';
  // 10文字以上は末尾を省略
  return site.length > 6 ? site.slice(0, 5) + '…' : site;
}

function moveWeek(dir) {
  const d = new Date(shiftWeekStart);
  d.setDate(d.getDate() + dir * 7);
  shiftWeekStart = d;
  renderShifts();
}

function moveShiftMonth(dir) {
  const d = new Date(shiftMonthCursor);
  d.setMonth(d.getMonth() + dir);
  shiftMonthCursor = new Date(d.getFullYear(), d.getMonth(), 1);
  renderShiftsMonth();
}

function changeShiftMonthUser(userId) {
  shiftMonthUserId = userId;
  renderShiftsMonth();
}

function getShiftViewableUsers() {
  const level = roleLevel(CU.role);
  if (level >= 5) return getUsers();
  if (level >= 2 && CU.dept === 'mobile') {
    return getUsers().filter(u => u.dept === 'mobile');
  }
  return [CU];
}

function buildMonthMatrix(monthStart) {
  const y = monthStart.getFullYear();
  const m = monthStart.getMonth();
  const lastDay = new Date(y, m + 1, 0).getDate();
  const firstWeekday = new Date(y, m, 1).getDay(); // 0:日
  const cells = [];
  for (let i = 0; i < firstWeekday; i++) cells.push(null);
  for (let d = 1; d <= lastDay; d++) cells.push(new Date(y, m, d));
  while (cells.length % 7 !== 0) cells.push(null);
  const weeks = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
}

function openShiftModal(userId, dateStr) {
  if (roleLevel(CU.role) < 4) return;
  const u     = getUserById(userId);
  const sites = getShiftSites();
  const slot  = getShiftForUser(userId, dateStr);
  const [, mm, dd] = dateStr.split('-');

  showModal(`
    <div class="modal-header">
      <div class="avatar" style="background:${roleColor(u.role)};width:32px;height:32px;font-size:12px">${u.name[0]}</div>
      <div class="modal-title">${u.name} — ${parseInt(mm)}/${parseInt(dd)}</div>
      <button class="modal-close" onclick="closeModal()">✕</button>
    </div>
    <div class="modal-body">
      <div class="form-group">
        <label class="form-label">現場</label>
        <select class="form-select" id="ms_site">
          <option value="休み" ${slot?.site === '休み' || !slot ? 'selected' : ''}>🗓 休み</option>
          ${sites.map(s => `<option value="${s}" ${slot?.site === s ? 'selected' : ''}>${s}</option>`).join('')}
        </select>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">開始時間</label>
          <input type="time" class="form-input" id="ms_start" value="${slot?.start || '10:00'}">
        </div>
        <div class="form-group">
          <label class="form-label">終了時間</label>
          <input type="time" class="form-input" id="ms_end" value="${slot?.end || '19:00'}">
        </div>
      </div>
    </div>
    <div class="modal-footer">
      <button class="btn btn-ghost" onclick="closeModal()">キャンセル</button>
      <button class="btn btn-primary" onclick="saveShiftFromModal('${userId}','${dateStr}')">保存</button>
    </div>
  `);
}

function saveShiftFromModal(userId, dateStr) {
  const site  = document.getElementById('ms_site').value;
  const start = document.getElementById('ms_start').value;
  const end   = document.getElementById('ms_end').value;
  setShiftForUser(userId, dateStr, { site, start, end });
  closeModal();
  showToast('シフトを保存しました');
  renderShifts();
}

// ═══════════════════════════════════════════════════════
// ─── PAGE: シフト作成（level >= 4） ───
// ═══════════════════════════════════════════════════════
function renderShiftsPlan() {
  if (!shiftPlanMonth) shiftPlanMonth = currentMonth();

  const mobileUsers = getUsers().filter(u => u.dept === 'mobile');
  const sites       = getShiftSites();
  const plan        = getVenuePlanForMonth(shiftPlanMonth);
  const [planY, planM] = shiftPlanMonth.split('-').map(Number);
  const lastDay     = new Date(planY, planM, 0).getDate();
  const today       = todayStr();
  const dayNames    = ['日', '月', '火', '水', '木', '金', '土'];
  const hiddenDates = getPlanHiddenDates(shiftPlanMonth);

  // 全スケジュールを一括取得
  const schedules = getShiftSchedules();

  // 月間集計（現場コマ数バー用）
  const monthVenueCounts = {};
  sites.forEach(s => { monthVenueCounts[s] = 0; });
  let monthOffCount = 0;
  mobileUsers.forEach(u => {
    Object.entries(schedules[u.id] || {}).forEach(([date, slot]) => {
      if (!slot?.site || !date.startsWith(shiftPlanMonth)) return;
      if (slot.site === '休み') { monthOffCount++; return; }
      monthVenueCounts[slot.site] = (monthVenueCounts[slot.site] || 0) + 1;
    });
  });

  // ── ヘッダー列（メンバー名） ──
  const memberHeaders = mobileUsers.map(u => `
    <th class="splan-member-th">
      <div class="avatar" style="width:26px;height:26px;font-size:10px;margin:0 auto 3px;background:${roleColor(u.role)}">${u.name[0]}</div>
      <div style="font-size:10px;font-weight:600;line-height:1.2">${u.name}</div>
    </th>`).join('');

  // ── 行（日付ごと）を構築 ──
  const tableRows = [];
  for (let d = 1; d <= lastDay; d++) {
    const dateObj  = new Date(planY, planM - 1, d);
    const ds       = dateToStr(dateObj);
    const wk       = dateObj.getDay();
    const tone     = getShiftDayTone(wk);
    const isWeekend = wk === 0 || wk === 6;
    const isToday  = ds === today;

    // 土日トグルでスキップ
    if (shiftPlanWeekdayOnly && isWeekend) continue;
    // 非表示日はスキップ
    if (hiddenDates.has(ds)) continue;

    const cells = mobileUsers.map(u => {
      const slot  = schedules[u.id]?.[ds];
      const isOff = slot?.site === '休み';
      const c     = slot && !isOff ? getSiteColor(slot.site) : null;
      const chipStyle = c
        ? `background:${c.bg};color:${c.text};border-color:${c.border}`
        : isOff
          ? 'background:rgba(122,130,153,.1);color:var(--text-sub);border-color:rgba(122,130,153,.2)'
          : 'background:transparent;color:var(--text-sub);border-color:var(--border)';
      const chipLabel = slot ? (isOff ? '休' : _shortSite(slot.site)) : '—';
      return `
        <td class="splan-cell${isToday ? ' is-today' : ''}" style="${isToday ? '' : `background:${tone.cellBg};`}" onclick="onPlanCellClick(event,'${u.id}','${ds}')">
          <div class="shift-chip" style="${chipStyle};cursor:pointer;font-size:10px;padding:3px 5px">${chipLabel}</div>
        </td>`;
    }).join('');

    tableRows.push(`
      <tr class="splan-row${isToday ? ' is-today-row' : ''}${isWeekend ? ' is-weekend' : ''}">
        <td class="splan-day-col" style="color:${tone.textColor};${isToday ? '' : `background:${tone.headBg};`}">
          <span class="splan-day-num">${d}</span>
          <span class="splan-day-name">${dayNames[wk]}</span>
          <button class="splan-hide-btn" onclick="onPlanHideDate(event,'${ds}')" title="この日を非表示にする">×</button>
        </td>
        ${cells}
      </tr>`);
  }

  // ── 現場コマ数バー ──
  const venueBarHtml = [
    { site: '休み', slots: null, color: { bg: 'rgba(122,130,153,.1)', border: 'rgba(122,130,153,.3)', text: 'var(--text-sub)' } },
    ...sites.map((s, i) => ({ site: s, slots: plan[s]?.slots || 0, color: SITE_COLORS[i % SITE_COLORS.length] })),
  ].map(({ site, slots, color }) => {
    const isSelected  = shiftPlanBrushSite === site;
    const subLabel    = site === '休み' ? '休み入力' : (slots > 0 ? `${slots}名/月` : '未設定');
    const monthFilled = site === '休み' ? monthOffCount : (monthVenueCounts[site] || 0);
    const monthTotal  = site === '休み' ? null : slots;
    const countLabel  = monthTotal > 0 ? `月間 ${monthFilled}/${monthTotal}` : `月間 ${monthFilled}コマ`;
    const countColor  = !monthTotal ? 'var(--text-sub)'
      : monthFilled > monthTotal ? 'var(--danger)'
      : monthFilled === monthTotal ? 'var(--green)' : 'var(--warn)';
    return `
      <button type="button" class="splan-venue-pill${isSelected ? ' is-selected' : ''}"
        style="background:${color.bg};border-color:${color.border}"
        onclick="setShiftPlanBrush('${site}')">
        <span style="color:${color.text};font-weight:700">${site}</span>
        <span style="color:${color.text};opacity:.7;font-size:11px">${subLabel}</span>
        <span style="color:${countColor};font-size:11px;font-weight:700">${countLabel}</span>
      </button>`;
  }).join('');

  const brushStatus = shiftPlanBrushSite
    ? `選択中：<b>${shiftPlanBrushSite}</b>（セルをクリックで連続入力）`
    : '現場をクリックしてからセルをクリックすると連続入力できます。';

  const hiddenCount = hiddenDates.size;

  document.getElementById('main').innerHTML = `
    <!-- シフト配置グリッド -->
    <div class="card fade-in" style="padding:0;overflow:hidden">
      <div class="splan-table-info">
        <div>
          <div class="splan-table-info-title">シフト作成</div>
          <div class="splan-table-info-sub">モバイル事業部の月次シフトを組みます — <span style="color:var(--green)">現場選択→セルクリックで連続入力</span></div>
        </div>
        <div class="splan-table-info-actions">
          <button class="splan-toggle-btn${shiftPlanWeekdayOnly ? ' is-active' : ''}" onclick="toggleShiftPlanWeekdayOnly()">
            土日を非表示
          </button>
          ${hiddenCount > 0 ? `
            <button class="splan-toggle-btn is-warn" onclick="openHiddenDatesModal()">
              非表示の日 ${hiddenCount}件
            </button>` : ''}
          <button class="btn btn-ghost" style="padding:6px 12px;font-size:16px" onclick="moveShiftPlanMonth(-1)">◀</button>
          <span style="font-weight:700;min-width:100px;text-align:center;font-size:14px">${monthLabel(shiftPlanMonth)}</span>
          <button class="btn btn-ghost" style="padding:6px 12px;font-size:16px" onclick="moveShiftPlanMonth(1)">▶</button>
          <button class="btn btn-outline" onclick="openVenuePlanModal()" style="font-size:12px">⚙ 現場・コマ数設定</button>
        </div>
      </div>
      <div class="splan-scroll-wrap">
        <table class="splan-table">
          <thead>
            <tr>
              <th class="splan-day-col splan-day-th">日付</th>
              ${memberHeaders}
            </tr>
          </thead>
          <tbody>
            ${tableRows.join('') || `<tr><td colspan="${mobileUsers.length + 1}" style="padding:20px;text-align:center;color:var(--text-sub)">表示できる日付がありません</td></tr>`}
          </tbody>
        </table>
      </div>
    </div>

    <!-- ツールバー（ブラシ状況 + トグル群） -->
    <div class="fade-in" style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-top:-4px">
      <span style="font-size:12px;color:var(--text-sub);flex:1">${brushStatus}</span>
      ${shiftPlanBrushSite ? `<button class="btn btn-ghost" style="padding:3px 10px;font-size:11px" onclick="clearShiftPlanBrush()">ブラシ解除</button>` : ''}
    </div>

    <!-- 現場コマ数バー -->
    <div class="card fade-in" style="display:flex;gap:10px;flex-wrap:wrap;align-items:center;padding:12px 16px">
      <span style="font-size:11px;color:var(--text-sub);font-weight:600;white-space:nowrap">現場コマ数(/月)：</span>
      ${venueBarHtml || '<span style="font-size:12px;color:var(--text-sub)">⚙ 現場・コマ数設定 から設定してください</span>'}
    </div>
  `;
}

function moveShiftPlanMonth(dir) {
  const [y, m] = shiftPlanMonth.split('-').map(Number);
  const next = new Date(y, m - 1 + dir, 1);
  shiftPlanMonth = `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, '0')}`;
  renderShiftsPlan();
}

function toggleShiftPlanWeekdayOnly() {
  shiftPlanWeekdayOnly = !shiftPlanWeekdayOnly;
  renderShiftsPlan();
}

// 行の「×」クリック → その日を非表示
function onPlanHideDate(event, dateStr) {
  event.stopPropagation();
  hidePlanDate(shiftPlanMonth, dateStr);
  renderShiftsPlan();
}

// 非表示日の管理モーダル
function openHiddenDatesModal() {
  const hidden = [...getPlanHiddenDates(shiftPlanMonth)].sort();
  const dayNames = ['日', '月', '火', '水', '木', '金', '土'];
  const rows = hidden.map(ds => {
    const d = new Date(ds);
    const wk = d.getDay();
    const dayColor = wk === 0 ? 'var(--danger)' : wk === 6 ? 'var(--warn)' : 'var(--text)';
    return `
      <div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid var(--border)">
        <span style="font-weight:700;color:${dayColor};min-width:70px">
          ${parseInt(ds.slice(5, 7))}/${parseInt(ds.slice(8))}（${dayNames[wk]}）
        </span>
        <button class="btn btn-ghost" style="margin-left:auto;padding:3px 10px;font-size:11px"
          onclick="onRestorePlanDate('${ds}')">表示に戻す</button>
      </div>`;
  }).join('');

  showModal(`
    <div class="modal-header">
      <div class="modal-title">非表示の日付</div>
      <div style="font-size:12px;color:var(--text-sub)">${monthLabel(shiftPlanMonth)}</div>
      <button class="modal-close" onclick="closeModal()">✕</button>
    </div>
    <div class="modal-body">
      <p style="font-size:12px;color:var(--text-sub);margin-bottom:8px">
        非表示にした日付の一覧です。「表示に戻す」でグリッドに再表示されます。
      </p>
      ${rows || '<p style="color:var(--text-sub);text-align:center;padding:16px">非表示の日付はありません</p>'}
    </div>
    <div class="modal-footer">
      <button class="btn btn-ghost" onclick="closeModal()">閉じる</button>
      <button class="btn btn-outline" style="color:var(--warn)" onclick="onClearAllHiddenDates()">全て表示に戻す</button>
    </div>
  `);
}

function onRestorePlanDate(dateStr) {
  restorePlanDate(shiftPlanMonth, dateStr);
  closeModal();
  renderShiftsPlan();
}

function onClearAllHiddenDates() {
  clearPlanHiddenDates(shiftPlanMonth);
  closeModal();
  renderShiftsPlan();
}

function setShiftPlanBrush(site) {
  shiftPlanBrushSite = shiftPlanBrushSite === site ? null : site;
  renderShiftsPlan();
}

function clearShiftPlanBrush() {
  shiftPlanBrushSite = null;
  renderShiftsPlan();
}

function onPlanCellClick(event, userId, dateStr) {
  if (roleLevel(CU.role) < 4) return;
  if (!shiftPlanBrushSite || event?.altKey) {
    openPlanCellModal(userId, dateStr);
    return;
  }

  const current = getShiftForUser(userId, dateStr);
  if (current?.site === shiftPlanBrushSite) return;

  setShiftForUser(userId, dateStr, {
    site: shiftPlanBrushSite,
    start: current?.start || '10:00',
    end: current?.end || '19:00',
  });
  renderShiftsPlan();
}

// 現場・コマ数設定モーダル
function openVenuePlanModal() {
  const sites = getShiftSites();
  const plan  = getVenuePlanForMonth(shiftPlanMonth);

  const rows = sites.map((s, i) => {
    const c = SITE_COLORS[i % SITE_COLORS.length];
    const slots = plan[s]?.slots || 0;
    return `
      <div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid var(--border)">
        <span class="shift-chip" style="background:${c.bg};color:${c.text};border-color:${c.border};flex:1;max-width:none;text-align:center">${s}</span>
        <div style="display:flex;align-items:center;gap:6px">
          <button class="btn btn-ghost" style="padding:2px 8px;font-size:16px"
            onclick="adjustVenueSlots('${s}', -1)">−</button>
          <input type="number" class="form-input" id="vp_${i}"
            value="${slots}" min="0" max="30"
            style="width:60px;text-align:center;font-size:16px;font-weight:700;padding:4px"
            oninput="syncVenueSlotLabel(${i})">
          <button class="btn btn-ghost" style="padding:2px 8px;font-size:16px"
            onclick="adjustVenueSlots('${s}', 1)">＋</button>
          <span style="font-size:12px;color:var(--text-sub);min-width:44px">名/月</span>
        </div>
      </div>`;
  }).join('');

  showModal(`
    <div class="modal-header">
      <div class="modal-title">現場・コマ数設定</div>
      <div style="font-size:12px;color:var(--text-sub)">${monthLabel(shiftPlanMonth)}</div>
      <button class="modal-close" onclick="closeModal()">✕</button>
    </div>
    <div class="modal-body">
      <p style="font-size:12px;color:var(--text-sub);margin-bottom:4px">
        各現場に1か月あたり何名配置するかを設定します。0 = この月は使わない。
      </p>
      <div>${rows}</div>
    </div>
    <div class="modal-footer">
      <button class="btn btn-ghost" onclick="closeModal()">キャンセル</button>
      <button class="btn btn-primary" onclick="saveVenuePlan()">保存</button>
    </div>
  `);

  // − / ＋ボタン用のグローバル参照を保持
  window._vpSites = sites;
}

function adjustVenueSlots(site, delta) {
  const sites = window._vpSites || getShiftSites();
  const idx = sites.indexOf(site);
  if (idx < 0) return;
  const input = document.getElementById(`vp_${idx}`);
  if (!input) return;
  const newVal = Math.max(0, Math.min(30, parseInt(input.value || 0) + delta));
  input.value = newVal;
}

function saveVenuePlan() {
  const sites = window._vpSites || getShiftSites();
  const plan  = {};
  sites.forEach((s, i) => {
    const el    = document.getElementById(`vp_${i}`);
    const slots = el ? parseInt(el.value) || 0 : 0;
    if (slots > 0) plan[s] = { slots };
  });
  setVenuePlanForMonth(shiftPlanMonth, plan);
  closeModal();
  showToast('コマ数設定を保存しました');
  renderShiftsPlan();
}

// セルクリック → シフト割り当てモーダル
function openPlanCellModal(userId, dateStr) {
  if (roleLevel(CU.role) < 4) return;
  const u     = getUserById(userId);
  const sites = getShiftSites();
  const plan  = getVenuePlanForMonth(shiftPlanMonth || dateStr.substring(0, 7));
  const slot  = getShiftForUser(userId, dateStr);
  const [, mm, dd] = dateStr.split('-');

  // この日の各現場の配置人数（自分を除く）
  const mobileUsers = getUsers().filter(x => x.dept === 'mobile');
  const schedules   = getShiftSchedules();
  const venueCounts = {};
  sites.forEach(s => { venueCounts[s] = 0; });
  mobileUsers.forEach(u2 => {
    if (u2.id === userId) return;
    const s2 = schedules[u2.id]?.[dateStr];
    if (s2?.site && s2.site !== '休み') {
      venueCounts[s2.site] = (venueCounts[s2.site] || 0) + 1;
    }
  });

  const siteOptions = sites.map(s => {
    const filled = venueCounts[s] + (slot?.site === s ? 1 : 0);
    const total  = plan[s]?.slots || 0;
    const label  = total > 0
      ? `${s}（${filled}/${total}コマ${filled > total ? ' ⚠' : filled === total ? ' ✓' : ''}）`
      : s;
    return `<option value="${s}" ${slot?.site === s ? 'selected' : ''}>${label}</option>`;
  }).join('');

  showModal(`
    <div class="modal-header">
      <div class="avatar" style="background:${roleColor(u.role)};width:32px;height:32px;font-size:12px">${u.name[0]}</div>
      <div class="modal-title">${u.name} — ${parseInt(mm)}/${parseInt(dd)}</div>
      <button class="modal-close" onclick="closeModal()">✕</button>
    </div>
    <div class="modal-body">
      <div class="form-group">
        <label class="form-label">現場</label>
        <select class="form-select" id="pc_site">
          <option value="休み" ${slot?.site === '休み' || !slot ? 'selected' : ''}>🗓 休み / 未設定</option>
          ${siteOptions}
        </select>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">開始時間</label>
          <input type="time" class="form-input" id="pc_start" value="${slot?.start || '10:00'}">
        </div>
        <div class="form-group">
          <label class="form-label">終了時間</label>
          <input type="time" class="form-input" id="pc_end" value="${slot?.end || '19:00'}">
        </div>
      </div>
    </div>
    <div class="modal-footer">
      <button class="btn btn-ghost" onclick="closeModal()">キャンセル</button>
      <button class="btn btn-primary" onclick="savePlanCell('${userId}','${dateStr}')">保存</button>
    </div>
  `);
}

function savePlanCell(userId, dateStr) {
  const site  = document.getElementById('pc_site').value;
  const start = document.getElementById('pc_start').value;
  const end   = document.getElementById('pc_end').value;
  setShiftForUser(userId, dateStr, { site, start, end });
  closeModal();
  showToast('シフトを保存しました');
  renderShiftsPlan();
}

// ═══════════════════════════════════════════════════════
// ─── PAGE: メンバー管理（admin only） ───
// ═══════════════════════════════════════════════════════
// メンバー行HTML（テーブル tbody 用）
function _memberRowsHTML(users) {
  if (!users.length) return `<tr><td colspan="4" class="list-empty" style="padding:32px">該当するメンバーが見つかりません</td></tr>`;
  return users.map(u => `
    <tr>
      <td>
        <div class="emp-cell">
          <div class="avatar" style="background:${roleColor(u.role)}">${u.name[0]}</div>
          <span class="emp-name">${u.name}</span>
        </div>
      </td>
      <td style="color:${DEPTS[u.dept]?.color};font-size:12px">${deptLabel(u.dept)}</td>
      <td style="color:${roleColor(u.role)};font-size:12px">${getUserDisplayRole(u)}</td>
      <td style="display:flex;gap:8px;align-items:center">
        <button class="btn btn-ghost" style="font-size:12px;padding:6px 12px"
          onclick="openEditMember('${u.id}')">編集</button>
        ${u.id !== CU.id
          ? `<button class="btn btn-danger" style="font-size:12px;padding:6px 12px"
              onclick="confirmDeleteMember('${u.id}')">削除</button>`
          : '<span style="font-size:11px;color:var(--text-sub)">(自分)</span>'}
      </td>
    </tr>
  `).join('');
}

// 検索クエリに基づき絞り込んだユーザーを返す
function _filteredMemberUsers() {
  const deptOrder = Object.keys(DEPTS);
  const idNum = u => parseInt(u.id.replace(/\D/g, '')) || 0;
  let users = getUsers().sort((a, b) => {
    const di = deptOrder.indexOf(a.dept) - deptOrder.indexOf(b.dept);
    return di !== 0 ? di : idNum(a) - idNum(b);
  });
  if (memberFilterDept !== 'all') users = users.filter(u => u.dept === memberFilterDept);
  const q = memberQuery.trim().toLowerCase();
  if (q) users = users.filter(u =>
    u.name.toLowerCase().includes(q)
    || deptLabel(u.dept).toLowerCase().includes(q)
    || getUserDisplayRole(u).toLowerCase().includes(q)
  );
  return users;
}

// テーブルと件数だけ更新（検索inputには触らない）
function _refreshMemberTable() {
  const users = _filteredMemberUsers();
  const tbody = document.getElementById('member-tbody');
  if (tbody) tbody.innerHTML = _memberRowsHTML(users);
  const sub = document.getElementById('member-sub');
  if (sub) sub.textContent = `ユーザーの追加・編集・削除（${users.length} / ${getUsers().length}名）`;
  const clear = document.getElementById('member-clear');
  if (clear) clear.style.display = memberQuery ? '' : 'none';
}

function renderMembers() {
  const users = _filteredMemberUsers();
  const totalAll = getUsers().length;
  const deptFilters = [
    { key: 'all', label: 'すべて' },
    ...Object.entries(DEPTS).map(([k, v]) => ({ key: k, label: v.label })),
  ];

  document.getElementById('main').innerHTML = `
    <div class="page-header fade-in">
      <div>
        <div class="page-title">メンバー管理</div>
        <div id="member-sub" class="page-sub">ユーザーの追加・編集・削除（${users.length} / ${totalAll}名）</div>
      </div>
      <button class="btn btn-primary" onclick="openAddMember()">＋ メンバー追加</button>
    </div>
    <div class="member-controls fade-in">
      <div class="tc-search-wrap" style="max-width:300px">
        <span class="tc-search-icon">🔍</span>
        <input type="text" id="member-q" class="tc-search-input" placeholder="名前・事業部・役職で検索"
          value="${memberQuery.replace(/"/g, '&quot;')}"
          oninput="setMemberQuery(this.value)">
        <button id="member-clear" class="tc-search-clear" onclick="setMemberQuery('')"
          style="${memberQuery ? '' : 'display:none'}">✕</button>
      </div>
      <div style="display:flex;gap:8px;flex-wrap:wrap">
        ${deptFilters.map(f => `
          <button class="talent-filter-btn ${memberFilterDept === f.key ? 'active' : ''}"
            onclick="setMemberFilterDept('${f.key}')">${f.label}</button>
        `).join('')}
      </div>
    </div>
    <div class="card fade-in">
      <div class="table-wrap">
        <table>
          <thead>
            <tr><th>名前</th><th>事業部</th><th>役職</th><th>操作</th></tr>
          </thead>
          <tbody id="member-tbody">
            ${_memberRowsHTML(users)}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function setMemberQuery(val) {
  memberQuery = val;
  _refreshMemberTable(); // inputには触れず結果だけ更新
}

function setMemberFilterDept(dept) { memberFilterDept = dept; renderMembers(); }

// ─── SETTINGS ───
function renderSettings() {
  const theme = document.documentElement.getAttribute('data-theme') || 'dark';

  document.getElementById('main').innerHTML = `
    <div class="page-header fade-in">
      <div>
        <div class="page-title">設定</div>
        <div class="page-sub">表示・テーマのカスタマイズ</div>
      </div>
    </div>

    <div class="card fade-in">
      <div class="section-title">テーマ</div>
      <div style="display:flex;flex-direction:column;gap:12px">
        <div style="font-size:14px;color:var(--text-sub)">アプリの配色を選択してください。</div>
        <div style="display:flex;gap:12px;flex-wrap:wrap">
          <div class="theme-option ${theme === 'dark' ? 'active' : ''}" onclick="applyTheme('dark')">
            <div class="theme-preview theme-preview-dark">
              <div class="tp-bar"></div>
              <div class="tp-sidebar"></div>
              <div class="tp-content">
                <div class="tp-card"></div>
                <div class="tp-card"></div>
              </div>
            </div>
            <div class="theme-option-label">
              <span class="theme-radio ${theme === 'dark' ? 'checked' : ''}"></span>
              ダークモード
            </div>
          </div>
          <div class="theme-option ${theme === 'light' ? 'active' : ''}" onclick="applyTheme('light')">
            <div class="theme-preview theme-preview-light">
              <div class="tp-bar"></div>
              <div class="tp-sidebar"></div>
              <div class="tp-content">
                <div class="tp-card"></div>
                <div class="tp-card"></div>
              </div>
            </div>
            <div class="theme-option-label">
              <span class="theme-radio ${theme === 'light' ? 'checked' : ''}"></span>
              ライトモード
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="card fade-in">
      <div class="section-title">バージョン情報</div>
      <div style="font-size:13px;color:var(--text-sub);line-height:1.8">
        <div>LUMP CORE</div>
        <div>データバージョン: ${Store.get(LS.version) ?? '-'}</div>
      </div>
    </div>
  `;
}

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  setTheme(theme);
  _syncThemeBtn(theme);
  renderSettings(); // re-render to update selected state
}

function _deptOptions(selected) {
  return Object.entries(DEPTS).map(([k, v]) =>
    `<option value="${k}" ${k === selected ? 'selected' : ''}>${v.label}</option>`
  ).join('');
}
function _roleOptions(selected) {
  return Object.entries(ROLES).sort((a, b) => b[1].level - a[1].level).map(([k, v]) =>
    `<option value="${k}" ${k === selected ? 'selected' : ''}>${v.label}</option>`
  ).join('');
}
function _reportTypeOptions(selected) {
  return [['mobile','モバイル（MNP・新規）'],['refa','Refa営業（売上）'],['','報告なし']].map(([k, l]) =>
    `<option value="${k}" ${(selected||'') === k ? 'selected' : ''}>${l}</option>`
  ).join('');
}

function openAddMember() {
  showModal(`
    <div class="modal-header">
      <div style="font-size:20px">👤</div>
      <div class="modal-title">メンバー追加</div>
      <button class="modal-close" onclick="closeModal()">✕</button>
    </div>
    <div class="modal-body">
      <div class="form-group">
        <label class="form-label">氏名</label>
        <input type="text" class="form-input" id="newName" placeholder="例: 田中 太郎">
      </div>
      <div class="form-group">
        <label class="form-label">事業部</label>
        <select class="form-select" id="newDept">${_deptOptions('mobile')}</select>
      </div>
      <div class="form-group">
        <label class="form-label">役職</label>
        <select class="form-select" id="newRole">${_roleOptions('catch')}</select>
      </div>
      <div class="form-group">
        <label class="form-label">役職表示名（任意）</label>
        <input type="text" class="form-input" id="newJobTitle" placeholder="例: IT / イベントCL">
      </div>
      <div class="form-group">
        <label class="form-label">報告タイプ</label>
        <select class="form-select" id="newReportType">${_reportTypeOptions('mobile')}</select>
      </div>
      <div class="form-group">
        <label class="form-label">初期パスワード</label>
        <input type="text" class="form-input" id="newPw" value="lamp1234">
      </div>
    </div>
    <div class="modal-footer">
      <button class="btn btn-ghost" onclick="closeModal()">キャンセル</button>
      <button class="btn btn-primary" onclick="addMember()">追加する</button>
    </div>
  `);
}

function addMember() {
  const name       = document.getElementById('newName').value.trim();
  const dept       = document.getElementById('newDept').value;
  const role       = document.getElementById('newRole').value;
  const jobTitle   = document.getElementById('newJobTitle').value.trim() || undefined;
  const reportType = document.getElementById('newReportType').value || null;
  const pw         = document.getElementById('newPw').value || 'lamp1234';

  if (!name) { showToast('氏名を入力してください', 'error'); return; }

  const users = getUsers();
  users.push({ id: 'u' + Date.now(), name, role, dept, reportType, jobTitle, pw });
  saveUsers(users);
  closeModal();
  showToast(`${name} を追加しました`);
  renderMembers();
}

function openEditMember(userId) {
  const u = getUserById(userId);
  if (!u) return;

  showModal(`
    <div class="modal-header">
      <div style="font-size:20px">✏️</div>
      <div class="modal-title">メンバー編集</div>
      <button class="modal-close" onclick="closeModal()">✕</button>
    </div>
    <div class="modal-body">
      <div class="form-group">
        <label class="form-label">氏名</label>
        <input type="text" class="form-input" id="editName" value="${u.name}">
      </div>
      <div class="form-group">
        <label class="form-label">事業部</label>
        <select class="form-select" id="editDept">${_deptOptions(u.dept)}</select>
      </div>
      <div class="form-group">
        <label class="form-label">役職</label>
        <select class="form-select" id="editRole">${_roleOptions(u.role)}</select>
      </div>
      <div class="form-group">
        <label class="form-label">役職表示名（任意）</label>
        <input type="text" class="form-input" id="editJobTitle" value="${u.jobTitle || ''}" placeholder="例: IT / イベントCL">
      </div>
      <div class="form-group">
        <label class="form-label">報告タイプ</label>
        <select class="form-select" id="editReportType">${_reportTypeOptions(u.reportType)}</select>
      </div>
      <div class="form-group">
        <label class="form-label">パスワード変更（空欄で変更なし）</label>
        <input type="text" class="form-input" id="editPw" placeholder="新しいパスワード">
      </div>
    </div>
    <div class="modal-footer">
      <button class="btn btn-ghost" onclick="closeModal()">キャンセル</button>
      <button class="btn btn-primary" onclick="saveMember('${userId}')">保存する</button>
    </div>
  `);
}

function saveMember(userId) {
  const name       = document.getElementById('editName').value.trim();
  const dept       = document.getElementById('editDept').value;
  const role       = document.getElementById('editRole').value;
  const jobTitle   = document.getElementById('editJobTitle').value.trim() || undefined;
  const reportType = document.getElementById('editReportType').value || null;
  const pw         = document.getElementById('editPw').value;

  if (!name) { showToast('氏名を入力してください', 'error'); return; }

  const users = getUsers();
  const idx = users.findIndex(u => u.id === userId);
  if (idx < 0) return;

  users[idx] = { ...users[idx], name, dept, role, jobTitle, reportType };
  if (pw) users[idx].pw = pw;
  saveUsers(users);

  if (userId === CU.id) {
    Object.assign(CU, { name, dept, role, jobTitle, reportType });
    renderTopbar();
    renderSidebar();
  }

  closeModal();
  showToast('保存しました');
  renderMembers();
}

function confirmDeleteMember(userId) {
  const u = getUserById(userId);
  if (!u) return;
  showModal(`
    <div class="modal-header">
      <div style="font-size:20px">⚠️</div>
      <div class="modal-title">メンバー削除</div>
      <button class="modal-close" onclick="closeModal()">✕</button>
    </div>
    <div class="modal-body">
      <p><strong>${u.name}</strong> を削除しますか？</p>
      <p style="color:var(--text-sub);font-size:13px;margin-top:8px">この操作は元に戻せません。報告データは残ります。</p>
    </div>
    <div class="modal-footer">
      <button class="btn btn-ghost" onclick="closeModal()">キャンセル</button>
      <button class="btn btn-danger" onclick="execDeleteMember('${userId}')">削除する</button>
    </div>
  `);
}

function execDeleteMember(userId) {
  const u = getUserById(userId);
  saveUsers(getUsers().filter(x => x.id !== userId));
  closeModal();
  showToast(`${u?.name || 'メンバー'} を削除しました`);
  renderMembers();
}

// ════════════════════════════════════════════
// 人財カルテ（Talent Management）
// ════════════════════════════════════════════

let talentFilterDept = 'all';
let talentSortKey    = 'productivity'; // 'productivity'|'skill'|'interview_new'|'interview_old'|'joined'
let talentQuery      = '';
let memberQuery      = '';
let memberFilterDept = 'all';
let _talentSkillDraft = null; // スキルシート編集中のドラフト

// 在籍期間を計算して "X年Yヶ月" 形式で返す
function calcTenure(joinMonth) {
  if (!joinMonth) return '';
  const [jy, jm] = joinMonth.split('-').map(Number);
  const now = new Date();
  const months = (now.getFullYear() - jy) * 12 + (now.getMonth() + 1 - jm);
  if (months < 0) return '';
  const years = Math.floor(months / 12);
  const rem = months % 12;
  if (years === 0) return `${rem}ヶ月`;
  if (rem === 0) return `${years}年`;
  return `${years}年${rem}ヶ月`;
}

// 入社年月inputの変更時に在籍期間ヒントをリアルタイム更新
function updateTenureHint(inputId, hintId) {
  const val = document.getElementById(inputId)?.value;
  const hint = document.getElementById(hintId);
  if (!hint) return;
  hint.textContent = val ? calcTenure(val) : '';
}

// ─── ソート ───
function _sortTalentUsers(users) {
  const deptOrder = Object.keys(DEPTS);
  const idNum = u => parseInt(u.id.replace(/\D/g, '')) || 0;
  return [...users].sort((a, b) => {
    switch (talentSortKey) {
      case 'name':
        return a.name.localeCompare(b.name, 'ja');
      case 'productivity': {
        const ta = getTalentProductivityTrend(a.id, 1);
        const tb = getTalentProductivityTrend(b.id, 1);
        const va = ta ? ta[0].value : -1;
        const vb = tb ? tb[0].value : -1;
        return vb - va;
      }
      case 'skill': {
        const sa = getSkillScore(a.id), sb = getSkillScore(b.id);
        const pa = sa.total > 0 ? sa.checked / sa.total : -1;
        const pb = sb.total > 0 ? sb.checked / sb.total : -1;
        return pb - pa;
      }
      case 'interview_new': {
        const da = getTalentCard(a.id).lastInterviewDate || '';
        const db = getTalentCard(b.id).lastInterviewDate || '';
        if (!da && !db) return idNum(a) - idNum(b);
        if (!da) return 1; if (!db) return -1;
        return db.localeCompare(da); // 新しい順（未設定は末尾）
      }
      case 'interview_old': {
        const da = getTalentCard(a.id).lastInterviewDate || '';
        const db = getTalentCard(b.id).lastInterviewDate || '';
        if (!da && !db) return idNum(a) - idNum(b);
        if (!da) return 1; if (!db) return -1;
        return da.localeCompare(db); // 古い順（面談が遅れているメンバーが上）
      }
      case 'joined': {
        const ja = getTalentCard(a.id).joinMonth || '';
        const jb = getTalentCard(b.id).joinMonth || '';
        if (!ja && !jb) return idNum(a) - idNum(b);
        if (!ja) return 1; if (!jb) return -1;
        return ja.localeCompare(jb); // 古い順（入社が早い順）
      }
      default: { // 'dept': 事業部順 → ID順
        const di = deptOrder.indexOf(a.dept) - deptOrder.indexOf(b.dept);
        return di !== 0 ? di : idNum(a) - idNum(b);
      }
    }
  });
}

function _filterTalentUsers(users) {
  const q = talentQuery.trim().toLowerCase();
  if (!q) return users;
  return users.filter(u => {
    const card = getTalentCard(u.id);
    return u.name.toLowerCase().includes(q)
      || (card.jobDescription || '').toLowerCase().includes(q)
      || deptLabel(u.dept).toLowerCase().includes(q)
      || getUserDisplayRole(u).toLowerCase().includes(q);
  });
}

// グリッドと件数だけ更新（検索inputには触らない）
function _refreshTalentGrid() {
  const level = roleLevel(CU.role);
  let users = getUsers();
  if (talentFilterDept !== 'all') users = users.filter(u => u.dept === talentFilterDept);
  users = _filterTalentUsers(users);
  users = _sortTalentUsers(users);

  const grid = document.getElementById('talent-grid');
  if (grid) grid.innerHTML = users.length
    ? users.map(u => _tcCardHTML(u, level >= 4)).join('')
    : '<div class="list-empty">該当するメンバーが見つかりません</div>';

  const sub = document.getElementById('talent-sub');
  if (sub) sub.textContent = `生産性指標 × ジョブ面談を中核にした1人1カード（${users.length} / ${getUsers().length}名）`;

  const clear = document.getElementById('talent-clear');
  if (clear) clear.style.display = talentQuery ? '' : 'none';
}

// ─── 一覧ページ ───
function renderTalent() {
  const level = roleLevel(CU.role);
  let users = getUsers();
  if (talentFilterDept !== 'all') users = users.filter(u => u.dept === talentFilterDept);
  users = _filterTalentUsers(users);
  users = _sortTalentUsers(users);

  const totalAll = getUsers().length;
  const deptFilters = [
    { key: 'all', label: 'すべて' },
    ...Object.entries(DEPTS).map(([k, v]) => ({ key: k, label: v.label })),
  ];
  const sortOptions = [
    { key: 'productivity',  label: '生産性順' },
    { key: 'skill',         label: 'スキル達成順' },
    { key: 'interview_new', label: '面談履歴順' },
    { key: 'joined',        label: '入社順' },
  ];

  document.getElementById('main').innerHTML = `
    <div class="page-header fade-in">
      <div>
        <div class="page-title">人財カルテ</div>
        <div id="talent-sub" class="page-sub">生産性指標 × ジョブ面談を中核にした1人1カード（${users.length} / ${totalAll}名）</div>
      </div>
      ${level >= 5 ? `<button class="btn btn-ghost" onclick="openSkillTemplateEditor()">📋 スキルシート設定</button>` : ''}
    </div>
    <div class="tc-controls fade-in">
      <div class="tc-search-wrap">
        <span class="tc-search-icon">🔍</span>
        <input type="text" id="talent-q" class="tc-search-input" placeholder="名前・職務・役職で検索"
          value="${talentQuery.replace(/"/g, '&quot;')}"
          oninput="setTalentQuery(this.value)">
        <button id="talent-clear" class="tc-search-clear" onclick="setTalentQuery('')"
          style="${talentQuery ? '' : 'display:none'}">✕</button>
      </div>
      <select class="form-select tc-sort-select" onchange="setTalentSort(this.value)">
        ${sortOptions.map(o => `<option value="${o.key}" ${talentSortKey === o.key ? 'selected' : ''}>${o.label}</option>`).join('')}
      </select>
    </div>
    <div class="talent-filter-bar fade-in">
      ${deptFilters.map(f => `
        <button class="talent-filter-btn ${talentFilterDept === f.key ? 'active' : ''}"
          onclick="setTalentFilter('${f.key}')">${f.label}</button>
      `).join('')}
    </div>
    <div id="talent-grid" class="talent-grid fade-in">
      ${users.length
        ? users.map(u => _tcCardHTML(u, level >= 4)).join('')
        : '<div class="list-empty">該当するメンバーが見つかりません</div>'}
    </div>
  `;
}

function setTalentSort(key) { talentSortKey = key; renderTalent(); }

function setTalentQuery(val) {
  talentQuery = val;
  _refreshTalentGrid(); // inputには触れず結果だけ更新
}

function setTalentFilter(dept) {
  talentFilterDept = dept;
  renderTalent();
}

// ─── カード HTML ───
function _tcCardHTML(user, canEdit) {
  const card  = getTalentCard(user.id);
  const trend = getTalentProductivityTrend(user.id, 6);
  const skill = getSkillScore(user.id);
  const photo = getPhoto(user.id);
  const isRefa = user.reportType === 'refa';

  // 写真 or アバター
  const photoHTML = photo
    ? `<div class="tc-photo"><img src="${photo}" alt="${user.name}"></div>`
    : `<div class="tc-photo"><div class="tc-photo-av" style="background:${roleColor(user.role)}">${user.name[0]}</div></div>`;

  // 生産性スコア
  let scoreHTML = '';
  if (trend) {
    const maxVal = Math.max(...trend.map(t => t.value), 1);
    const latest = trend[trend.length - 1].value;
    const scoreText = isRefa
      ? (latest > 0 ? (latest / 10000).toFixed(1) + '万円' : '—')
      : (latest > 0 ? latest.toFixed(1) + ' pt' : '—');
    const barsHTML = trend.map((t, i) => {
      const h = Math.max(Math.round((t.value / maxVal) * 26), 2);
      return `<div class="tc-trend-bar${i === trend.length - 1 ? ' cur' : ''}" style="height:${h}px"></div>`;
    }).join('');
    scoreHTML = `
      <div class="tc-metric">
        <div class="tc-mlabel">今月の生産性</div>
        <div class="tc-mval ${latest > 0 ? '' : 'muted'}">${scoreText}</div>
        <div class="tc-trend">${barsHTML}</div>
      </div>`;
  } else {
    scoreHTML = `
      <div class="tc-metric">
        <div class="tc-mlabel">生産性</div>
        <div class="tc-mval muted">—</div>
      </div>`;
  }

  // スキル達成率
  const skillPct = skill.total > 0 ? Math.round((skill.checked / skill.total) * 100) : 0;
  const skillHTML = `
    <div class="tc-metric">
      <div class="tc-mlabel">スキル達成</div>
      <div class="tc-mval" style="font-size:21px;color:var(--green)">${skill.total > 0 ? skillPct + '%' : '—'}</div>
      <div class="tc-skill-bar-wrap"><div class="tc-skill-bar-fill" style="width:${skillPct}%"></div></div>
      <div class="tc-skill-count">${skill.checked} / ${skill.total} 項目</div>
    </div>`;

  // ボディ（上長コメントか育成アクション）
  const bodyText = card.managerComment || card.devActions || '';
  const bodyLabel = card.managerComment ? '上長コメント' : card.devActions ? '育成アクション' : '';
  const bodyHTML = bodyText ? `
    <div class="tc-body">
      <div class="tc-body-label">${bodyLabel}</div>
      <div class="tc-body-text">${bodyText.length > 80 ? bodyText.slice(0, 80) + '…' : bodyText}</div>
    </div>` : '';

  // フッタータグ
  const tags = [];
  if (card.lastInterviewDate) tags.push(`<span class="tc-tag">面談 ${formatDate(card.lastInterviewDate)}</span>`);
  if (card.nextRoleCandidate) tags.push(`<span class="tc-tag accent">↑ ${card.nextRoleCandidate}</span>`);
  if (card.nextReviewDate) {
    const diff = (new Date(card.nextReviewDate) - new Date()) / 86400000;
    tags.push(`<span class="tc-tag ${diff < 30 ? 'warn' : ''}">見直 ${formatDate(card.nextReviewDate)}</span>`);
  }

  return `
    <div class="tc" onclick="openTalentCard('${user.id}')">
      <div class="tc-head">
        ${photoHTML}
        <div class="tc-info">
          <div class="tc-name">${user.name}</div>
          <div class="tc-dept" style="color:${DEPTS[user.dept]?.color}">${deptLabel(user.dept)}</div>
          <div class="tc-role-line">${getUserDisplayRole(user)}</div>
          ${card.jobDescription ? `<div class="tc-job">${card.jobDescription}</div>` : ''}
          ${card.joinMonth ? `<div class="tc-join">入社 ${card.joinMonth.replace('-', '年')}月 <span class="tc-tenure">（${calcTenure(card.joinMonth)}）</span></div>` : ''}
        </div>
        ${canEdit ? `<button class="btn btn-ghost" style="font-size:11px;padding:4px 10px;align-self:flex-start;flex-shrink:0"
          onclick="event.stopPropagation();openTalentCard('${user.id}')">詳細 →</button>` : ''}
      </div>
      <div class="tc-metrics">${scoreHTML}${skillHTML}</div>
      ${bodyHTML}
      <div class="tc-foot">${tags.join('')}<div class="tc-foot-gap"></div></div>
    </div>`;
}

// ─── 詳細ページへ遷移 ───
function openTalentCard(userId) {
  profileUserId = userId;
  profileActiveTab = 'perf';
  navigate('profile');
}

// ─── プロフィールページ ───
function renderProfile() {
  const level = roleLevel(CU.role);
  const canEdit = level >= 4;
  const canManagerApprove = level >= 5;
  const user = getUserById(profileUserId);
  if (!user) { navigate('talent'); return; }

  document.getElementById('topbarTitle').textContent = user.name;

  const card    = getTalentCard(profileUserId);
  const trend   = getTalentProductivityTrend(profileUserId, 6);
  const photo   = getPhoto(profileUserId);
  const ev      = getSkillEval(profileUserId);
  const tmpl    = getSkillTemplate();
  const isRefa  = user.reportType === 'refa';
  const mon     = currentMonth();
  const reports = getUserReportsForMonth(profileUserId, mon);
  const agg     = (reports.length && !isRefa) ? aggregateReports(reports) : null;
  const refaAmt = isRefa ? reports.reduce((s, r) => s + Number(r.amount || 0), 0) : 0;
  const workDays = getWorkingDaysCount(profileUserId, mon);

  // ── 写真ブロック ──
  const photoHTML = photo
    ? `<img src="${photo}" alt="${user.name}">`
    : `<div class="profile-avatar-av" style="background:${roleColor(user.role)}">${user.name[0]}</div>`;

  // ── 生産性グラフ ──
  let trendBlock = '<div style="color:var(--text-sub);font-size:13px;padding:16px 0">実績報告なし（生産性データ未取得）</div>';
  if (trend) {
    const maxVal = Math.max(...trend.map(t => t.value), 1);
    const latest = trend[trend.length - 1].value;
    const numText = isRefa
      ? (latest > 0 ? (latest / 10000).toFixed(1) : '—')
      : (latest > 0 ? latest.toFixed(1) : '—');
    const unitText = isRefa ? '万円（今月）' : 'pt（今月）';
    const barsHTML = trend.map((t, i) => {
      const h = Math.max(Math.round((t.value / maxVal) * 48), 2);
      const mo = t.month.slice(5, 7) + '月';
      return `<div class="tm-trend-col">
        <div class="tm-trend-bar${i === trend.length - 1 ? ' cur' : ''}" style="height:${h}px"></div>
        <div class="tm-trend-tick">${mo}</div>
      </div>`;
    }).join('');
    trendBlock = `
      <div class="tm-score-box">
        <div>
          <div class="tm-score-num">${numText}</div>
          <div class="tm-score-unit">${unitText}</div>
        </div>
        <div class="tm-trend-area">
          <div class="tm-trend-label">直近6か月の推移</div>
          <div class="tm-trend-bars">${barsHTML}</div>
        </div>
      </div>`;
  }

  // ── 今月の実績詳細 ──
  let aggBlock = '';
  if (agg) {
    const items = PRODUCTS.filter(p => agg[p.key] > 0);
    if (items.length) {
      aggBlock = `
        <div class="profile-agg-section">
          <div class="profile-agg-title">今月の商材別実績</div>
          <div class="profile-agg-grid">
            ${items.map(p => `
              <div class="profile-agg-item">
                <div class="profile-agg-label">${p.label}</div>
                <div class="profile-agg-val">${agg[p.key]}<span class="profile-agg-unit">件</span></div>
                <div class="profile-agg-pt">${(agg[p.key] * p.pt).toFixed(1)}pt</div>
              </div>`).join('')}
          </div>
        </div>`;
    }
  } else if (isRefa && refaAmt > 0) {
    aggBlock = `
      <div class="profile-agg-section">
        <div class="profile-agg-title">今月の売上</div>
        <div style="font-size:28px;font-weight:700;color:var(--accent2);font-family:'Space Grotesk',sans-serif;margin-top:6px">${formatMoney(refaAmt)}</div>
      </div>`;
  }

  // ── 強み・課題 ──
  const ta = (id, val, ph) => canEdit
    ? `<textarea class="form-input" id="tc_${id}" rows="3" placeholder="${ph}">${val || ''}</textarea>`
    : `<div class="profile-text-val">${val || '—'}</div>`;

  const strengthsBlock = `
    <div class="profile-two-col">
      <div class="form-group">
        <label class="form-label">強み（営業観点）</label>
        ${ta('strengths', card.strengths, 'クロージング力、提案の幅 など')}
      </div>
      <div class="form-group">
        <label class="form-label">課題（営業観点）</label>
        ${ta('challenges', card.challenges, '見込み管理、後追い率 など')}
      </div>
    </div>
    <div class="form-group">
      <label class="form-label">保有スキル・資格</label>
      ${canEdit
        ? `<input type="text" class="form-input" id="tc_skills" value="${(card.skills||'').replace(/"/g,'&quot;')}" placeholder="例: FP2級、SB認定資格 など">`
        : `<div class="profile-text-val">${card.skills || '—'}</div>`}
    </div>`;

  // ── スキルシートパネル ──
  const skill     = getSkillScore(profileUserId);
  const catScores = getSkillScoreByCategory(profileUserId);
  const totalPct  = skill.total > 0 ? Math.round(skill.checked / skill.total * 100) : 0;

  const catSummaryHTML = `
    <div class="sk-cat-summary">
      ${catScores.map(c => `
        <div class="sk-cat-summary-row">
          <div class="sk-cat-summary-name">${c.name}</div>
          <div class="sk-cat-summary-bar-wrap">
            <div class="sk-cat-summary-bar-fill" style="width:${c.pct}%"></div>
          </div>
          <div class="sk-cat-summary-nums">${c.certified}<span class="sk-cat-summary-total">/${c.total}</span></div>
          <div class="sk-cat-summary-pct">${c.pct}%</div>
        </div>`).join('')}
    </div>`;

  function skItemHTML(item) {
    const d = ev[item.id];
    const raw = (d && d !== true) ? d : { self: d === true, certifier: { name: '', date: '' }, manager: { name: '', date: '' } };
    const certified = isItemCertified(d);
    const certDone  = !!(raw.certifier?.name && raw.certifier?.date);
    const mgrDone   = !!(raw.manager?.name && raw.manager?.date);
    return `
      <div class="sk-item sk-item--cert${certified ? ' sk-item--done' : ''}">
        <div class="sk-item-header">
          <span class="sk-item-text${certified ? ' ok' : ''}">${item.text}</span>
          ${certified ? '<span class="sk-badge-cert">認定済み</span>' : ''}
        </div>
        <div class="sk-cert-steps">
          <label class="sk-cert-step sk-cert-step--self${raw.self ? ' done' : ''}">
            <input type="checkbox" id="sk_self_${item.id}" ${raw.self ? 'checked' : ''} ${canEdit ? '' : 'disabled'}>
            <span class="sk-cert-step-label">本人認定</span>
          </label>
          <div class="sk-cert-step${certDone ? ' done' : ''}">
            <span class="sk-cert-step-label">認定者</span>
            <input type="text" class="sk-cert-input" id="sk_cn_${item.id}" placeholder="サイン" value="${(raw.certifier?.name||'').replace(/"/g,'&quot;')}" ${canEdit ? '' : 'disabled'}>
            <input type="date" class="sk-cert-input sk-cert-date" id="sk_cd_${item.id}" value="${raw.certifier?.date||''}" ${canEdit ? '' : 'disabled'}>
          </div>
          <div class="sk-cert-step${mgrDone ? ' done' : ''}">
            <span class="sk-cert-step-label">マネージャー</span>
            <input type="text" class="sk-cert-input" id="sk_mn_${item.id}" placeholder="サイン" value="${(raw.manager?.name||'').replace(/"/g,'&quot;')}" ${canManagerApprove ? '' : 'disabled'}>
            <input type="date" class="sk-cert-input sk-cert-date" id="sk_md_${item.id}" value="${raw.manager?.date||''}" ${canManagerApprove ? '' : 'disabled'}>
          </div>
        </div>
      </div>`;
  }

  const skillPanelHTML = `
    <div class="sk-panel-wrap">
      <div class="sk-total-header">
        <div class="sk-total-num">${skill.checked} <span class="sk-total-denom">/ ${skill.total} 項目認定</span></div>
        <div class="sk-total-pct" style="color:var(--green)">${totalPct}% 完了</div>
      </div>
      ${catSummaryHTML}
      ${tmpl.categories.length > 1 ? `
      <div class="sk-cat-tabs">
        ${tmpl.categories.map((cat, i) => {
          const cs = catScores.find(c => c.id === cat.id) || { certified: 0, total: 0 };
          return `<button class="sk-cat-tab${i === 0 ? ' active' : ''}" onclick="switchSkillCat('${cat.id}',this)">${cat.name}<span class="sk-cat-tab-badge">${cs.certified}/${cs.total}</span></button>`;
        }).join('')}
      </div>` : ''}
      ${tmpl.categories.map((cat, i) => `
        <div class="sk-cat-panel" id="skp_${cat.id}"${i > 0 ? ' style="display:none"' : ''}>
          ${cat.items.map(item => skItemHTML(item)).join('')}
        </div>`).join('')}
    </div>`;

  // ── 経歴・面談タブ ──
  const jobHistory    = getJobHistory(profileUserId);
  const interviewLogs = getInterviewLogs(profileUserId);

  // ジョブ経歴タイムライン
  const jobTimelineHTML = jobHistory.length === 0
    ? `<div class="hist-empty">経歴が登録されていません</div>`
    : jobHistory.map((e, i) => {
        const isLast = i === jobHistory.length - 1;
        const ym = e.date ? e.date.replace('-', '年') + '月〜' : '—';
        return `
          <div class="hist-entry${isLast ? ' hist-entry--current' : ''}">
            <div class="hist-dot${isLast ? ' hist-dot--current' : ''}"></div>
            <div class="hist-line-wrap">
              <div class="hist-header">
                <div class="hist-date">${ym}</div>
                <div class="hist-role">${e.role || '—'}</div>
                ${e.dept ? `<div class="hist-dept">${e.dept}</div>` : ''}
                ${isLast ? '<div class="hist-badge-now">現在</div>' : ''}
              </div>
              ${e.memo ? `<div class="hist-memo">${e.memo.replace(/\n/g,'<br>')}</div>` : ''}
              ${canEdit ? `
              <div class="hist-actions">
                <button class="btn btn-ghost hist-btn" onclick="openJobHistoryModal('${profileUserId}','${e.id}')">編集</button>
                <button class="btn btn-ghost hist-btn hist-btn--danger" onclick="confirmDeleteJobHistory('${profileUserId}','${e.id}')">削除</button>
              </div>` : ''}
            </div>
          </div>`;
      }).join('');

  // 面談ログリスト
  const interviewLogsHTML = interviewLogs.length === 0
    ? `<div class="hist-empty">面談ログが登録されていません</div>`
    : interviewLogs.map(l => {
        const dateLabel = l.date || '—';
        return `
          <div class="ilog-card">
            <div class="ilog-header">
              <div class="ilog-date">${dateLabel}</div>
              ${l.interviewer ? `<div class="ilog-interviewer">担当: ${l.interviewer}</div>` : ''}
              ${canEdit ? `
              <div class="ilog-actions">
                <button class="btn btn-ghost hist-btn" onclick="openInterviewLogModal('${profileUserId}','${l.id}')">編集</button>
                <button class="btn btn-ghost hist-btn hist-btn--danger" onclick="confirmDeleteInterviewLog('${profileUserId}','${l.id}')">削除</button>
              </div>` : ''}
            </div>
            ${l.summary ? `<div class="ilog-section"><div class="ilog-label">面談内容</div><div class="ilog-body">${l.summary.replace(/\n/g,'<br>')}</div></div>` : ''}
            ${l.agreedActions ? `<div class="ilog-section"><div class="ilog-label">合意事項・アクション</div><div class="ilog-body">${l.agreedActions.replace(/\n/g,'<br>')}</div></div>` : ''}
            ${l.nextDate ? `<div class="ilog-section"><div class="ilog-label">次回予定</div><div class="ilog-body">${l.nextDate}</div></div>` : ''}
          </div>`;
      }).join('');

  const historyBlock = `
    <div class="hist-section">
      <div class="hist-section-header">
        <div class="hist-section-title">ジョブ経歴</div>
        ${canEdit ? `<button class="btn btn-ghost hist-add-btn" onclick="openJobHistoryModal('${profileUserId}',null)">＋ 追加</button>` : ''}
      </div>
      <div class="hist-timeline">${jobTimelineHTML}</div>
    </div>
    <div class="hist-section">
      <div class="hist-section-header">
        <div class="hist-section-title">面談ログ</div>
        ${canEdit ? `<button class="btn btn-ghost hist-add-btn" onclick="openInterviewLogModal('${profileUserId}',null)">＋ 追加</button>` : ''}
      </div>
      <div class="ilog-list">${interviewLogsHTML}</div>
    </div>`;

  // ── メッセージタブ ──
  const inp = (id, val, ph) => canEdit
    ? `<input type="text" class="form-input" id="tc_${id}" value="${(val||'').replace(/"/g,'&quot;')}" placeholder="${ph}">`
    : `<div class="profile-text-val">${val || '—'}</div>`;
  const taMsg = (id, val, ph) => canEdit
    ? `<textarea class="form-input" id="tc_${id}" rows="3" placeholder="${ph}">${val || ''}</textarea>`
    : `<div class="profile-text-val">${val || '—'}</div>`;
  const dateInp = (id, val) => canEdit
    ? `<input type="date" class="form-input" id="tc_${id}" value="${val || ''}">`
    : `<div class="profile-text-val">${val || '—'}</div>`;

  const msgBlock = `
    <div class="form-group">
      <label class="form-label">上長コメント</label>
      ${taMsg('managerComment', card.managerComment, '現状評価・特記事項など')}
    </div>
    <div class="form-group">
      <label class="form-label">育成アクション</label>
      ${taMsg('devActions', card.devActions, '例: 提案力研修（5月）など')}
    </div>
    <div class="profile-two-col" style="margin-top:8px">
      <div class="form-group">
        <label class="form-label">最終面談日</label>
        ${dateInp('lastInterviewDate', card.lastInterviewDate)}
      </div>
      <div class="form-group">
        <label class="form-label">次回見直し予定日</label>
        ${dateInp('nextReviewDate', card.nextReviewDate)}
      </div>
    </div>
    <div class="form-group">
      <label class="form-label">面談で合意した役割</label>
      ${inp('agreedRole', card.agreedRole, '例: クローザーとして独立稼働')}
    </div>
    <div class="form-group">
      <label class="form-label">次の役職候補</label>
      ${inp('nextRoleCandidate', card.nextRoleCandidate, '例: イベントCL → チーフ候補')}
    </div>`;

  // ── MBTIタブ ──
  const mbtiBlock = buildMbtiView(getMbti(user.id), canManagerApprove, user.id);

  // ── 生産性スコア（左カラム） ──
  const prodScore = !agg && !isRefa ? '—'
    : isRefa ? (refaAmt > 0 ? (refaAmt / 10000).toFixed(1) + '万' : '—')
    : agg.totalPt > 0 ? agg.totalPt.toFixed(1) + 'pt' : '—';

  document.getElementById('main').innerHTML = `
    <div class="profile-page fade-in">
      <div class="profile-topbar">
        <button class="btn btn-ghost profile-back" onclick="navigate('talent')">← 一覧へ</button>
        ${canEdit ? `<button class="btn btn-primary" style="margin-left:auto" onclick="saveProfileCard('${user.id}')">保存する</button>` : ''}
      </div>

      <div class="profile-layout">
        <aside class="profile-left">
          <div class="profile-avatar-block">
            <div class="profile-avatar" id="profilePhotoWrap">${photoHTML}</div>
            ${canEdit ? `
            <div class="profile-avatar-btns">
              <button class="btn btn-ghost" style="font-size:11px" onclick="uploadTalentPhoto('${user.id}')">写真変更</button>
              ${photo ? `<button class="btn btn-ghost" style="font-size:11px;color:var(--danger)" onclick="removeTalentPhoto('${user.id}')">削除</button>` : ''}
            </div>` : ''}
          </div>

          <div class="profile-identity">
            <div class="profile-name">${user.name}</div>
            <div class="profile-dept" style="color:${DEPTS[user.dept]?.color}">${deptLabel(user.dept)}</div>
            <div class="profile-role">${getUserDisplayRole(user)}</div>
            ${card.joinMonth ? `<div class="profile-join">入社 ${card.joinMonth.replace('-', '年')}月<span class="profile-tenure">（${calcTenure(card.joinMonth)}）</span></div>` : ''}
          </div>

          ${canEdit ? `
          <div class="profile-left-section">
            <div class="profile-left-label">入社年月</div>
            <input type="month" class="form-input" id="tc_joinMonth" value="${card.joinMonth || ''}"
              oninput="updateTenureHint('tc_joinMonth','tc_tenureHint_profile')">
            <div id="tc_tenureHint_profile" class="tenure-hint">${card.joinMonth ? calcTenure(card.joinMonth) : ''}</div>
          </div>` : ''}

          <div class="profile-left-section">
            <div class="profile-left-label">自己紹介 / 職務</div>
            ${canEdit
              ? `<textarea class="form-input" id="tc_jobDescription" rows="2" placeholder="モバイル販売 / チームリード など">${card.jobDescription || ''}</textarea>`
              : `<div class="profile-left-text">${card.jobDescription || '—'}</div>`}
          </div>

          <div class="profile-left-section">
            <div class="profile-left-label">今月の目標・希望</div>
            ${canEdit
              ? `<textarea class="form-input" id="tc_careerHope" rows="2" placeholder="例: チーフを目指したい など">${card.careerHope || ''}</textarea>`
              : `<div class="profile-left-text">${card.careerHope || '—'}</div>`}
          </div>

          <div class="profile-stats">
            <div class="profile-stat">
              <div class="profile-stat-num">${workDays}</div>
              <div class="profile-stat-label">出勤日数（今月）</div>
            </div>
            <div class="profile-stat">
              <div class="profile-stat-num" style="color:var(--accent)">${prodScore}</div>
              <div class="profile-stat-label">生産性（今月）</div>
            </div>
          </div>
        </aside>

        <div class="profile-right">
          <div class="profile-tabs">
            <button class="profile-tab ${profileActiveTab === 'perf' ? 'active' : ''}" onclick="switchProfileTab('perf')">実績</button>
            <button class="profile-tab ${profileActiveTab === 'skill' ? 'active' : ''}" onclick="switchProfileTab('skill')">スキル</button>
            <button class="profile-tab ${profileActiveTab === 'history' ? 'active' : ''}" onclick="switchProfileTab('history')">経歴・面談</button>
            <button class="profile-tab ${profileActiveTab === 'msg' ? 'active' : ''}" onclick="switchProfileTab('msg')">メッセージ</button>
            <button class="profile-tab ${profileActiveTab === 'mbti' ? 'active' : ''}" onclick="switchProfileTab('mbti')">MBTI</button>
          </div>

          <div class="profile-panel${profileActiveTab === 'perf' ? '' : ' hidden'}" id="pp_perf">
            ${trendBlock}
            ${aggBlock}
            ${strengthsBlock}
          </div>

          <div class="profile-panel${profileActiveTab === 'skill' ? '' : ' hidden'}" id="pp_skill">
            ${skillPanelHTML}
          </div>

          <div class="profile-panel${profileActiveTab === 'history' ? '' : ' hidden'}" id="pp_history">
            ${historyBlock}
          </div>

          <div class="profile-panel${profileActiveTab === 'msg' ? '' : ' hidden'}" id="pp_msg">
            ${msgBlock}
          </div>

          <div class="profile-panel${profileActiveTab === 'mbti' ? '' : ' hidden'}" id="pp_mbti">
            ${mbtiBlock}
          </div>
        </div>
      </div>
    </div>
  `;
}

function switchProfileTab(tab) {
  profileActiveTab = tab;
  document.querySelectorAll('.profile-tab').forEach(b => {
    b.classList.toggle('active', b.getAttribute('onclick')?.includes(`'${tab}'`));
  });
  ['perf', 'skill', 'history', 'msg', 'mbti'].forEach(t => {
    const p = document.getElementById('pp_' + t);
    if (p) p.classList.toggle('hidden', t !== tab);
  });
  const layout = document.querySelector('.profile-layout');
  if (layout) layout.classList.toggle('skill-active', tab === 'skill');
}

// ─────────────────────────────────────────────
// MBTI ヘルパー
// ─────────────────────────────────────────────
const MBTI_TYPES = {
  INTJ:'建築家', INTP:'論理学者', ENTJ:'指揮官', ENTP:'討論者',
  INFJ:'提唱者', INFP:'仲介者',  ENFJ:'主人公',  ENFP:'運動家',
  ISTJ:'管理者', ISFJ:'擁護者',  ESTJ:'幹部',    ESFJ:'領事',
  ISTP:'巨匠',   ISFP:'冒険家',  ESTP:'起業家',  ESFP:'エンターテイナー',
};
const MBTI_GROUPS = [
  { key:'analyst',  label:'分析家', color:'#8b6fac', roles:['INTJ','INTP','ENTJ','ENTP'] },
  { key:'diplomat', label:'外交官', color:'#3aad78', roles:['INFJ','INFP','ENFJ','ENFP'] },
  { key:'sentinel', label:'番人',   color:'#4fa8d2', roles:['ISTJ','ISFJ','ESTJ','ESFJ'] },
  { key:'explorer', label:'探検家', color:'#d4a830', roles:['ISTP','ISFP','ESTP','ESFP'] },
];
// 軸の左右順序は 16personalities 準拠（N左/S右、T左/F右）
// 各軸に独立した色を割り当て
const MBTI_AXES = [
  { key:'ei', left:'E', leftJa:'外向型', right:'I', rightJa:'内向型', color:'#4ecdc4' },
  { key:'sn', left:'N', leftJa:'直感型', right:'S', rightJa:'感覚型', color:'#f0b429' },
  { key:'ft', left:'T', leftJa:'思考型', right:'F', rightJa:'感情型', color:'#38c96e' },
  { key:'jp', left:'J', leftJa:'計画型', right:'P', rightJa:'探索型', color:'#9775fa' },
];
const MBTI_ID_COLOR = '#ff6b81';

function getMbtiGroup(type4) {
  return MBTI_GROUPS.find(g => g.roles.includes(type4)) || { label:'不明', color:'#6a80ba' };
}

// ── バー1本分のHTML ──
function _mbtiBarRow(leftLetter, leftJa, rightLetter, rightJa, d, color) {
  const isLeftDom = d && d.pole === leftLetter;
  const pct = d?.pct ?? 50;
  const domJa = isLeftDom ? leftJa : rightJa;
  // ドットは優勢な極の端に近い位置: 左優勢なら左寄り、右優勢なら右寄り
  // pct=91(E左) → dotLeft=9(左端近く), pct=82(P右) → dotLeft=82(右端近く)
  const dotLeft = isLeftDom ? (100 - pct) : pct;
  // フィルは優勢でない側から伸びて、ドット位置まで埋める（太いバーで強さを表現）
  const fillCss = isLeftDom ? `right:0;width:${pct}%` : `left:0;width:${pct}%`;
  return `
    <div class="mbti-axis-block">
      <div class="mbti-axis-dom" style="text-align:${isLeftDom ? 'left' : 'right'};color:${color}">
        <strong>${pct}%</strong> ${domJa}
      </div>
      <div class="mbti-bar-container">
        <div class="mbti-bar-bg" style="background:${color}28"></div>
        <div class="mbti-bar-fill" style="background:${color};${fillCss}"></div>
        <div class="mbti-dot" style="border-color:${color};left:${dotLeft}%"></div>
      </div>
      <div class="mbti-axis-foot">
        <span class="${isLeftDom ? 'mbti-foot-dom' : ''}">${leftJa}</span>
        <span class="${!isLeftDom ? 'mbti-foot-dom' : ''}">${rightJa}</span>
      </div>
    </div>`;
}

// ── 表示パネル（ビューモード）──
function buildMbtiView(mbti, isAdmin, userId) {
  const editBtn = isAdmin
    ? `<button class="btn btn-ghost mbti-edit-open-btn" onclick="openMbtiEdit()">編集</button>`
    : '';

  if (!mbti) {
    return `
      <div class="mbti-panel">
        <div class="mbti-panel-topbar">${editBtn}</div>
        <div class="mbti-empty">MBTIデータ未登録</div>
      </div>`;
  }

  // type4 はデータの pole を直接連結（軸の left/right 定義と独立）
  const ei = mbti.ei || {}; const sn = mbti.sn || {};
  const ft = mbti.ft || {}; const jp = mbti.jp || {};
  const type4    = (ei.pole||'?') + (sn.pole||'?') + (ft.pole||'?') + (jp.pole||'?');
  const idData   = mbti.id || {};
  const idPole   = idData.pole || 'A';
  const typeName = MBTI_TYPES[type4] || type4;
  const group    = getMbtiGroup(type4);
  const idLabel  = idPole === 'A' ? '積極型' : '慎重型';

  const axesBars = MBTI_AXES.map(a =>
    _mbtiBarRow(a.left, a.leftJa, a.right, a.rightJa, mbti[a.key], a.color)
  ).join('');
  const idBar = _mbtiBarRow('A', '積極型', 'T', '慎重型', idData, MBTI_ID_COLOR);

  return `
    <div class="mbti-panel">
      <div class="mbti-panel-topbar">${editBtn}</div>

      <div class="mbti-hero">
        <div class="mbti-code-block" style="background:${group.color}1e;border:2px solid ${group.color}70">
          <span class="mbti-code-main" style="color:${group.color}">${type4}</span><span class="mbti-code-id" style="color:${group.color}">-${idPole}</span>
        </div>
        <div class="mbti-hero-meta">
          <div class="mbti-type-name">${typeName}</div>
          <div class="mbti-chips">
            <span class="mbti-chip" style="background:${group.color}22;color:${group.color};border-color:${group.color}50">${group.label}</span>
            <span class="mbti-chip" style="background:${MBTI_ID_COLOR}1a;color:${MBTI_ID_COLOR};border-color:${MBTI_ID_COLOR}44">${idLabel}</span>
          </div>
        </div>
      </div>

      <div class="mbti-divider"></div>

      <div class="mbti-section-hd">性格の4軸</div>
      <div class="mbti-axes-list">${axesBars}</div>

      <div class="mbti-section-hd" style="margin-top:4px">アイデンティティ</div>
      <div class="mbti-axes-list">${idBar}</div>
    </div>`;
}

// ── 編集フォーム ──
function buildMbtiEditForm(mbti, userId) {
  const row = (key, lo, loja, ro, roja, cur) => {
    const pole = cur?.pole || lo;
    const pct  = cur?.pct  || '';
    return `
      <div class="mbti-ef-row">
        <span class="mbti-ef-label">${loja} <em>${lo}</em> / ${roja} <em>${ro}</em></span>
        <div class="mbti-ef-inputs">
          <select class="form-input mbti-ef-sel" id="mbti_${key}_pole">
            <option value="${lo}" ${pole===lo?'selected':''}>${lo} ${loja}</option>
            <option value="${ro}" ${pole===ro?'selected':''}>${ro} ${roja}</option>
          </select>
          <div class="mbti-ef-pct-wrap">
            <input type="number" class="form-input mbti-ef-pct" id="mbti_${key}_pct"
              min="51" max="100" value="${pct}" placeholder="51–100">
            <span class="mbti-ef-unit">%</span>
          </div>
        </div>
      </div>`;
  };
  return `
    <div class="mbti-edit-panel">
      <div class="mbti-ef-hint">優勢な側を選び、パーセンテージ（51〜100）を入力してください。</div>
      ${MBTI_AXES.map(a => row(a.key, a.left, a.leftJa, a.right, a.rightJa, mbti?.[a.key])).join('')}
      ${row('id', 'A', '積極', 'T', '慎重', mbti?.id)}
      <div class="mbti-ef-actions">
        <button class="btn btn-ghost" onclick="cancelMbtiEdit()">キャンセル</button>
        <button class="btn btn-primary" onclick="saveMbtiData('${userId}')">保存する</button>
      </div>
    </div>`;
}

function openMbtiEdit() {
  mbtiEditMode = true;
  const p = document.getElementById('pp_mbti');
  if (p) p.innerHTML = buildMbtiEditForm(getMbti(profileUserId), profileUserId);
}

function cancelMbtiEdit() {
  mbtiEditMode = false;
  const p = document.getElementById('pp_mbti');
  if (p) p.innerHTML = buildMbtiView(getMbti(profileUserId), roleLevel(CU.role) >= 5, profileUserId);
}

function saveMbtiData(userId) {
  const keys = ['ei', 'sn', 'ft', 'jp', 'id'];
  const mbtiData = {};
  for (const key of keys) {
    const poleEl = document.getElementById('mbti_' + key + '_pole');
    const pctEl  = document.getElementById('mbti_' + key + '_pct');
    if (!poleEl || !pctEl) continue;
    const pct = parseInt(pctEl.value, 10);
    if (!poleEl.value || isNaN(pct) || pct < 51 || pct > 100) {
      showToast('51〜100の数値を入力してください', 'error');
      return;
    }
    mbtiData[key] = { pole: poleEl.value, pct };
  }
  setMbti(userId, mbtiData);
  mbtiEditMode = false;
  const p = document.getElementById('pp_mbti');
  if (p) p.innerHTML = buildMbtiView(getMbti(userId), roleLevel(CU.role) >= 5, userId);
  showToast('MBTIを保存しました', 'success');
}

function saveProfileCard(userId) {
  const g = id => { const el = document.getElementById('tc_' + id); return el ? el.value.trim() : ''; };
  setTalentCard(userId, {
    joinMonth:         g('joinMonth'),
    jobDescription:    g('jobDescription'),
    strengths:         g('strengths'),
    challenges:        g('challenges'),
    skills:            g('skills'),
    lastInterviewDate: g('lastInterviewDate'),
    agreedRole:        g('agreedRole'),
    nextRoleCandidate: g('nextRoleCandidate'),
    nextReviewDate:    g('nextReviewDate'),
    managerComment:    g('managerComment'),
    careerHope:        g('careerHope'),
    devActions:        g('devActions'),
  });
  const tmpl = getSkillTemplate();
  const evalObj = {};
  tmpl.categories.forEach(cat =>
    cat.items.forEach(item => {
      const selfEl = document.getElementById('sk_self_' + item.id);
      const cnEl   = document.getElementById('sk_cn_'   + item.id);
      const cdEl   = document.getElementById('sk_cd_'   + item.id);
      const mnEl   = document.getElementById('sk_mn_'   + item.id);
      const mdEl   = document.getElementById('sk_md_'   + item.id);
      if (!selfEl && !cnEl) return;
      evalObj[item.id] = {
        self:      selfEl ? selfEl.checked : false,
        certifier: { name: cnEl ? cnEl.value.trim() : '', date: cdEl ? cdEl.value : '' },
        manager:   { name: mnEl ? mnEl.value.trim() : '', date: mdEl ? mdEl.value : '' },
      };
    })
  );
  setSkillEval(userId, evalObj);
  showToast('カルテを保存しました');
  renderProfile();
}

// ─── ジョブ経歴モーダル ───
function openJobHistoryModal(userId, entryId) {
  const existing = entryId ? getJobHistory(userId).find(e => e.id === entryId) : null;
  const isNew = !existing;
  showModal(`
    <div style="padding:4px 0">
      <div style="font-size:15px;font-weight:700;margin-bottom:16px">${isNew ? '経歴を追加' : '経歴を編集'}</div>
      <div class="form-group">
        <label class="form-label">開始年月</label>
        <input type="month" class="form-input" id="jh_date" value="${existing?.date || ''}">
      </div>
      <div class="form-group">
        <label class="form-label">役職 / ポジション</label>
        <input type="text" class="form-input" id="jh_role" placeholder="例: クローザー" value="${(existing?.role||'').replace(/"/g,'&quot;')}">
      </div>
      <div class="form-group">
        <label class="form-label">事業部・チーム</label>
        <input type="text" class="form-input" id="jh_dept" placeholder="例: モバイル事業部" value="${(existing?.dept||'').replace(/"/g,'&quot;')}">
      </div>
      <div class="form-group">
        <label class="form-label">メモ（担当業務・変更理由など）</label>
        <textarea class="form-input" id="jh_memo" rows="3" placeholder="例: キャッチからクローザーへ昇格。MNP専任対応。">${existing?.memo||''}</textarea>
      </div>
      <div style="display:flex;gap:8px;margin-top:16px">
        <button class="btn btn-ghost" style="flex:1" onclick="closeModal()">キャンセル</button>
        <button class="btn btn-primary" style="flex:1" onclick="saveJobHistoryEntry('${userId}','${entryId||''}')">保存</button>
      </div>
    </div>
  `);
}
function saveJobHistoryEntry(userId, entryId) {
  const g = id => { const el = document.getElementById(id); return el ? el.value.trim() : ''; };
  const data = { date: g('jh_date'), role: g('jh_role'), dept: g('jh_dept'), memo: g('jh_memo') };
  if (!data.date || !data.role) { showToast('開始年月と役職は必須です', 'error'); return; }
  if (entryId) {
    updateJobHistoryEntry(userId, entryId, data);
  } else {
    addJobHistoryEntry(userId, data);
  }
  closeModal();
  showToast('経歴を保存しました');
  renderProfile();
}
function confirmDeleteJobHistory(userId, entryId) {
  showModal(`
    <div style="padding:4px 0">
      <div style="font-size:15px;font-weight:700;margin-bottom:8px">経歴を削除</div>
      <div style="color:var(--text-sub);margin-bottom:20px">この経歴エントリを削除しますか？</div>
      <div style="display:flex;gap:8px">
        <button class="btn btn-ghost" style="flex:1" onclick="closeModal()">キャンセル</button>
        <button class="btn" style="flex:1;background:var(--danger);color:#fff" onclick="execDeleteJobHistory('${userId}','${entryId}')">削除する</button>
      </div>
    </div>
  `);
}
function execDeleteJobHistory(userId, entryId) {
  deleteJobHistoryEntry(userId, entryId);
  closeModal();
  showToast('経歴を削除しました');
  renderProfile();
}

// ─── 面談ログモーダル ───
function openInterviewLogModal(userId, logId) {
  const existing = logId ? getInterviewLogs(userId).find(l => l.id === logId) : null;
  const isNew = !existing;
  showModal(`
    <div style="padding:4px 0">
      <div style="font-size:15px;font-weight:700;margin-bottom:16px">${isNew ? '面談ログを追加' : '面談ログを編集'}</div>
      <div class="profile-two-col">
        <div class="form-group">
          <label class="form-label">面談日</label>
          <input type="date" class="form-input" id="il_date" value="${existing?.date || ''}">
        </div>
        <div class="form-group">
          <label class="form-label">担当者（面談者）</label>
          <input type="text" class="form-input" id="il_interviewer" placeholder="例: 廣瀬" value="${(existing?.interviewer||'').replace(/"/g,'&quot;')}">
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">面談内容・まとめ</label>
        <textarea class="form-input" id="il_summary" rows="4" placeholder="話し合った内容を記録...">${existing?.summary||''}</textarea>
      </div>
      <div class="form-group">
        <label class="form-label">合意事項・アクション</label>
        <textarea class="form-input" id="il_agreedActions" rows="3" placeholder="例: 来月からシフトリーダー担当">${existing?.agreedActions||''}</textarea>
      </div>
      <div class="form-group">
        <label class="form-label">次回面談予定日</label>
        <input type="date" class="form-input" id="il_nextDate" value="${existing?.nextDate||''}">
      </div>
      <div style="display:flex;gap:8px;margin-top:16px">
        <button class="btn btn-ghost" style="flex:1" onclick="closeModal()">キャンセル</button>
        <button class="btn btn-primary" style="flex:1" onclick="saveInterviewLog('${userId}','${logId||''}')">保存</button>
      </div>
    </div>
  `);
}
function saveInterviewLog(userId, logId) {
  const g = id => { const el = document.getElementById(id); return el ? el.value.trim() : ''; };
  const data = {
    date: g('il_date'), interviewer: g('il_interviewer'),
    summary: g('il_summary'), agreedActions: g('il_agreedActions'), nextDate: g('il_nextDate'),
  };
  if (!data.date) { showToast('面談日は必須です', 'error'); return; }
  if (logId) {
    updateInterviewLog(userId, logId, data);
  } else {
    addInterviewLog(userId, data);
  }
  closeModal();
  showToast('面談ログを保存しました');
  renderProfile();
}
function confirmDeleteInterviewLog(userId, logId) {
  showModal(`
    <div style="padding:4px 0">
      <div style="font-size:15px;font-weight:700;margin-bottom:8px">面談ログを削除</div>
      <div style="color:var(--text-sub);margin-bottom:20px">この面談ログを削除しますか？</div>
      <div style="display:flex;gap:8px">
        <button class="btn btn-ghost" style="flex:1" onclick="closeModal()">キャンセル</button>
        <button class="btn" style="flex:1;background:var(--danger);color:#fff" onclick="execDeleteInterviewLog('${userId}','${logId}')">削除する</button>
      </div>
    </div>
  `);
}
function execDeleteInterviewLog(userId, logId) {
  deleteInterviewLog(userId, logId);
  closeModal();
  showToast('面談ログを削除しました');
  renderProfile();
}

// ─── 旧モーダル形式（参照用・以下は不使用） ───
function openTalentCardModal(userId, activeTab = 'basic') {
  const level = roleLevel(CU.role);
  const canEdit = level >= 4;
  const canManagerApprove = level >= 5;
  const user = getUserById(userId);
  if (!user) return;

  const card  = getTalentCard(userId);
  const trend = getTalentProductivityTrend(userId, 6);
  const photo = getPhoto(userId);
  const ev    = getSkillEval(userId);
  const tmpl  = getSkillTemplate();
  const isRefa = user.reportType === 'refa';

  const tabs = [
    { id: 'basic',     label: '基本情報' },
    { id: 'eval',      label: '評価・能力' },
    { id: 'interview', label: '面談情報' },
    { id: 'memo',      label: '運用メモ' },
    { id: 'skill',     label: 'スキルシート' },
  ];

  // ── 写真パネル ──
  const photoBlock = photo
    ? `<div class="tm-photo"><img src="${photo}" alt="${user.name}" id="tmPhotoImg_${userId}"></div>`
    : `<div class="tm-photo"><div class="tm-photo-av" style="background:${roleColor(user.role)}" id="tmPhotoAv_${userId}">${user.name[0]}</div></div>`;

  // ── 生産性グラフ ──
  let trendBlock = '<div style="color:var(--text-sub);font-size:13px">実績報告なし（生産性データ未取得）</div>';
  if (trend) {
    const maxVal = Math.max(...trend.map(t => t.value), 1);
    const latest = trend[trend.length - 1].value;
    const numText = isRefa
      ? (latest > 0 ? (latest / 10000).toFixed(1) : '—')
      : (latest > 0 ? latest.toFixed(1) : '—');
    const unitText = isRefa ? '万円（今月）' : 'pt（今月）';
    const barsHTML = trend.map((t, i) => {
      const h = Math.max(Math.round((t.value / maxVal) * 48), 2);
      const mo = t.month.slice(5, 7) + '月';
      return `<div class="tm-trend-col">
        <div class="tm-trend-bar${i === trend.length - 1 ? ' cur' : ''}" style="height:${h}px"></div>
        <div class="tm-trend-tick">${mo}</div>
      </div>`;
    }).join('');
    trendBlock = `
      <div class="tm-score-box">
        <div>
          <div class="tm-score-num">${numText}</div>
          <div class="tm-score-unit">${unitText}</div>
        </div>
        <div class="tm-trend-area">
          <div class="tm-trend-label">直近6か月の推移</div>
          <div class="tm-trend-bars">${barsHTML}</div>
        </div>
      </div>`;
  }

  // ── スキルシートパネル ──
  const skill = getSkillScore(userId);
  const catScores = getSkillScoreByCategory(userId);
  const totalPct = skill.total > 0 ? Math.round(skill.checked / skill.total * 100) : 0;

  // カテゴリ別進捗サマリー
  const catSummaryHTML = `
    <div class="sk-cat-summary">
      ${catScores.map(c => `
        <div class="sk-cat-summary-row">
          <div class="sk-cat-summary-name">${c.name}</div>
          <div class="sk-cat-summary-bar-wrap">
            <div class="sk-cat-summary-bar-fill" style="width:${c.pct}%"></div>
          </div>
          <div class="sk-cat-summary-nums">${c.certified}<span class="sk-cat-summary-total">/${c.total}</span></div>
          <div class="sk-cat-summary-pct">${c.pct}%</div>
        </div>`).join('')}
    </div>`;

  // 3段階認定 — 項目ごとのHTML
  function skItemHTML(item) {
    const d = ev[item.id];
    const raw = (d && d !== true) ? d : { self: d === true, certifier: { name: '', date: '' }, manager: { name: '', date: '' } };
    const certified = isItemCertified(d);
    const certDone  = !!(raw.certifier?.name && raw.certifier?.date);
    const mgrDone   = !!(raw.manager?.name && raw.manager?.date);
    return `
      <div class="sk-item sk-item--cert${certified ? ' sk-item--done' : ''}">
        <div class="sk-item-header">
          <span class="sk-item-text${certified ? ' ok' : ''}">${item.text}</span>
          ${certified ? '<span class="sk-badge-cert">認定済み</span>' : ''}
        </div>
        <div class="sk-cert-steps">
          <label class="sk-cert-step sk-cert-step--self${raw.self ? ' done' : ''}">
            <input type="checkbox" id="sk_self_${item.id}" ${raw.self ? 'checked' : ''} ${canEdit ? '' : 'disabled'}>
            <span class="sk-cert-step-label">本人認定</span>
          </label>
          <div class="sk-cert-step${certDone ? ' done' : ''}">
            <span class="sk-cert-step-label">認定者</span>
            <input type="text" class="sk-cert-input" id="sk_cn_${item.id}" placeholder="サイン" value="${(raw.certifier?.name||'').replace(/"/g,'&quot;')}" ${canEdit ? '' : 'disabled'}>
            <input type="date" class="sk-cert-input sk-cert-date" id="sk_cd_${item.id}" value="${raw.certifier?.date||''}" ${canEdit ? '' : 'disabled'}>
          </div>
          <div class="sk-cert-step${mgrDone ? ' done' : ''}">
            <span class="sk-cert-step-label">マネージャー</span>
            <input type="text" class="sk-cert-input" id="sk_mn_${item.id}" placeholder="サイン" value="${(raw.manager?.name||'').replace(/"/g,'&quot;')}" ${canManagerApprove ? '' : 'disabled'}>
            <input type="date" class="sk-cert-input sk-cert-date" id="sk_md_${item.id}" value="${raw.manager?.date||''}" ${canManagerApprove ? '' : 'disabled'}>
          </div>
        </div>
      </div>`;
  }

  const skillPanelHTML = `
    <div class="sk-panel-wrap">
      <div class="sk-total-header">
        <div class="sk-total-num">${skill.checked} <span class="sk-total-denom">/ ${skill.total} 項目認定</span></div>
        <div class="sk-total-pct" style="color:var(--green)">${totalPct}% 完了</div>
      </div>
      ${catSummaryHTML}
      ${tmpl.categories.length > 1 ? `
      <div class="sk-cat-tabs">
        ${tmpl.categories.map((cat, i) => {
          const cs = catScores.find(c => c.id === cat.id) || { certified: 0, total: 0 };
          return `<button class="sk-cat-tab${i === 0 ? ' active' : ''}" onclick="switchSkillCat('${cat.id}',this)">${cat.name}<span class="sk-cat-tab-badge">${cs.certified}/${cs.total}</span></button>`;
        }).join('')}
      </div>` : ''}
      ${tmpl.categories.map((cat, i) => `
        <div class="sk-cat-panel" id="skp_${cat.id}"${i > 0 ? ' style="display:none"' : ''}>
          ${cat.items.map(item => skItemHTML(item)).join('')}
        </div>`).join('')}
    </div>`;

  // ─ フォームヘルパー ─
  const inp  = (id, val, ph = '') => canEdit
    ? `<input type="text" class="form-input" id="tc_${id}" value="${(val||'').replace(/"/g,'&quot;')}" placeholder="${ph}">`
    : `<div style="font-size:13px;color:${val ? 'var(--text)' : 'var(--text-sub)'}">${val || '—'}</div>`;
  const ta   = (id, val, ph = '') => canEdit
    ? `<textarea class="form-input" id="tc_${id}" rows="3" placeholder="${ph}">${val || ''}</textarea>`
    : `<div style="font-size:13px;color:${val ? 'var(--text)' : 'var(--text-sub)'};white-space:pre-wrap;line-height:1.6">${val || '—'}</div>`;
  const date = (id, val) => canEdit
    ? `<input type="date" class="form-input" id="tc_${id}" value="${val || ''}">`
    : `<div style="font-size:13px">${val || '—'}</div>`;

  showTalentModal(`
    <div class="modal-header" style="padding-bottom:0;border-bottom:none">
      <div class="tm-photo" style="width:40px;height:40px;flex-shrink:0">
        ${photo ? `<img src="${photo}" alt="">` : `<div class="tm-photo-av" style="background:${roleColor(user.role)};font-size:16px">${user.name[0]}</div>`}
      </div>
      <div class="modal-title">${user.name}<span style="font-size:12px;font-weight:400;color:var(--text-sub);margin-left:8px">${deptLabel(user.dept)} / ${getUserDisplayRole(user)}</span></div>
      <button class="modal-close" onclick="closeModal()">✕</button>
    </div>

    <div class="tm-tabs">
      ${tabs.map(t => `<button class="tm-tab${t.id === activeTab ? ' active' : ''}" onclick="switchTalentTab('${t.id}')">${t.label}</button>`).join('')}
    </div>

    <!-- 基本情報 -->
    <div class="tm-panel${activeTab === 'basic' ? '' : ' hidden'}" id="tp_basic">
      <div class="tm-photo-row">
        <div class="tm-photo" id="tmPhotoWrap">
          ${photo ? `<img src="${photo}" alt="${user.name}" id="tmPhotoImg">` : `<div class="tm-photo-av" style="background:${roleColor(user.role)}" id="tmPhotoAv">${user.name[0]}</div>`}
        </div>
        ${canEdit ? `
        <div class="tm-photo-btns">
          <button class="btn btn-ghost" style="font-size:12px" onclick="uploadTalentPhoto('${userId}')">写真をアップロード</button>
          ${photo ? `<button class="btn btn-ghost" style="font-size:12px;color:var(--danger)" onclick="removeTalentPhoto('${userId}')">写真を削除</button>` : ''}
        </div>` : ''}
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">入社年月</label>
          ${canEdit
            ? `<input type="month" class="form-input" id="tc_joinMonth" value="${card.joinMonth || ''}"
                oninput="updateTenureHint('tc_joinMonth','tc_tenureHint_modal')">
               <div id="tc_tenureHint_modal" class="tenure-hint">${card.joinMonth ? calcTenure(card.joinMonth) : ''}</div>`
            : `<div style="font-size:13px">${card.joinMonth ? card.joinMonth.replace('-', '年') + '月 <span class="tc-tenure">（' + calcTenure(card.joinMonth) + '）</span>' : '—'}</div>`}
        </div>
        <div class="form-group">
          <label class="form-label">現在のジョブ（職務）</label>
          ${inp('jobDescription', card.jobDescription, '例: モバイル販売 / チームリード')}
        </div>
      </div>
      <div class="form-row">
        <div>
          <div class="form-label" style="margin-bottom:4px">所属</div>
          <div style="font-size:13px;font-weight:600;color:${DEPTS[user.dept]?.color}">${deptLabel(user.dept)}</div>
        </div>
        <div>
          <div class="form-label" style="margin-bottom:4px">役職</div>
          <div style="font-size:13px;font-weight:600;color:${roleColor(user.role)}">${getUserDisplayRole(user)}</div>
        </div>
      </div>
    </div>

    <!-- 評価・能力 -->
    <div class="tm-panel${activeTab === 'eval' ? '' : ' hidden'}" id="tp_eval">
      ${trendBlock}
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">強み（営業観点）</label>
          ${ta('strengths', card.strengths, 'クロージング力、提案の幅 など')}
        </div>
        <div class="form-group">
          <label class="form-label">課題（営業観点）</label>
          ${ta('challenges', card.challenges, '見込み管理、後追い率 など')}
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">保有スキル・資格</label>
        ${inp('skills', card.skills, '例: FP2級、SB認定資格 など')}
      </div>
    </div>

    <!-- 面談情報 -->
    <div class="tm-panel${activeTab === 'interview' ? '' : ' hidden'}" id="tp_interview">
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">最終面談日</label>
          ${date('lastInterviewDate', card.lastInterviewDate)}
        </div>
        <div class="form-group">
          <label class="form-label">次回見直し予定日</label>
          ${date('nextReviewDate', card.nextReviewDate)}
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">面談で合意した役割</label>
        ${inp('agreedRole', card.agreedRole, '例: クローザーとして独立稼働')}
      </div>
      <div class="form-group">
        <label class="form-label">次の役職候補</label>
        ${inp('nextRoleCandidate', card.nextRoleCandidate, '例: イベントCL → チーフ候補')}
      </div>
    </div>

    <!-- 運用メモ -->
    <div class="tm-panel${activeTab === 'memo' ? '' : ' hidden'}" id="tp_memo">
      <div class="form-group">
        <label class="form-label">上長コメント</label>
        ${ta('managerComment', card.managerComment, '現状評価・特記事項など')}
      </div>
      <div class="form-group">
        <label class="form-label">本人希望（キャリア希望）</label>
        ${ta('careerHope', card.careerHope, '例: チーフを目指したい、Refa専任でやっていきたい など')}
      </div>
      <div class="form-group">
        <label class="form-label">育成アクション</label>
        ${ta('devActions', card.devActions, '例: 提案力研修（5月）、同行OJT（毎週水曜）など')}
      </div>
    </div>

    <!-- スキルシート -->
    <div class="tm-panel${activeTab === 'skill' ? '' : ' hidden'}" id="tp_skill">
      ${skillPanelHTML}
    </div>

    <div class="modal-footer">
      <button class="btn btn-ghost" onclick="closeModal()">閉じる</button>
      ${canEdit ? `<button class="btn btn-primary" onclick="saveTalentCard('${userId}')">保存する</button>` : ''}
    </div>
  `);
}

function switchTalentTab(tab) {
  document.querySelectorAll('.tm-tab').forEach(b =>
    b.classList.toggle('active', b.textContent === document.querySelector(`.tm-tab[onclick*="${tab}"]`)?.textContent)
  );
  // より確実な方法
  document.querySelectorAll('.tm-tab').forEach(b => {
    b.classList.toggle('active', b.getAttribute('onclick')?.includes(`'${tab}'`));
  });
  ['basic','eval','interview','memo','skill'].forEach(t => {
    const p = document.getElementById('tp_' + t);
    if (p) p.classList.toggle('hidden', t !== tab);
  });
}

// ─── 写真アップロード ───
function uploadTalentPhoto(userId) {
  const inp = document.createElement('input');
  inp.type = 'file';
  inp.accept = 'image/*';
  inp.onchange = e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const SIZE = 220;
        canvas.width = SIZE; canvas.height = SIZE;
        const ctx = canvas.getContext('2d');
        const s = Math.min(img.width, img.height);
        const sx = (img.width - s) / 2, sy = (img.height - s) / 2;
        ctx.drawImage(img, sx, sy, s, s, 0, 0, SIZE, SIZE);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.82);
        setPhoto(userId, dataUrl);
        const wrap = document.getElementById('profilePhotoWrap');
        if (wrap) wrap.innerHTML = `<img src="${dataUrl}" alt="">`;
        showToast('写真を更新しました');
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  };
  inp.click();
}

function removeTalentPhoto(userId) {
  removePhoto(userId);
  const wrap = document.getElementById('profilePhotoWrap');
  const user = getUserById(userId);
  if (wrap && user) {
    wrap.innerHTML = `<div class="profile-avatar-av" style="background:${roleColor(user.role)}">${user.name[0]}</div>`;
  }
  showToast('写真を削除しました');
}

// ─── カルテ保存 ───
function saveTalentCard(userId) {
  const g = id => { const el = document.getElementById('tc_' + id); return el ? el.value.trim() : ''; };
  setTalentCard(userId, {
    joinMonth:         g('joinMonth'),
    jobDescription:    g('jobDescription'),
    strengths:         g('strengths'),
    challenges:        g('challenges'),
    skills:            g('skills'),
    lastInterviewDate: g('lastInterviewDate'),
    agreedRole:        g('agreedRole'),
    nextRoleCandidate: g('nextRoleCandidate'),
    nextReviewDate:    g('nextReviewDate'),
    managerComment:    g('managerComment'),
    careerHope:        g('careerHope'),
    devActions:        g('devActions'),
  });
  // スキルシート評価を保存（3段階認定フォーマット）
  const tmpl = getSkillTemplate();
  const evalObj = {};
  tmpl.categories.forEach(cat =>
    cat.items.forEach(item => {
      const selfEl = document.getElementById('sk_self_' + item.id);
      const cnEl   = document.getElementById('sk_cn_'   + item.id);
      const cdEl   = document.getElementById('sk_cd_'   + item.id);
      const mnEl   = document.getElementById('sk_mn_'   + item.id);
      const mdEl   = document.getElementById('sk_md_'   + item.id);
      if (!selfEl && !cnEl) return; // スキルパネルが非表示の場合はスキップ
      evalObj[item.id] = {
        self:       selfEl ? selfEl.checked : false,
        certifier:  { name: cnEl ? cnEl.value.trim() : '', date: cdEl ? cdEl.value : '' },
        manager:    { name: mnEl ? mnEl.value.trim() : '', date: mdEl ? mdEl.value : '' },
      };
    })
  );
  setSkillEval(userId, evalObj);
  closeModal();
  showToast('カルテを保存しました');
  renderTalent();
}

// ─── スキルシート カテゴリ切替 ───
function switchSkillCat(catId, btn) {
  const wrap = btn.closest('.sk-panel-wrap');
  wrap.querySelectorAll('.sk-cat-panel').forEach(p => p.style.display = 'none');
  wrap.querySelectorAll('.sk-cat-tab').forEach(b => b.classList.remove('active'));
  document.getElementById('skp_' + catId).style.display = '';
  btn.classList.add('active');
}

// ─── スキルシート テンプレート編集 ───
function openSkillTemplateEditor() {
  _talentSkillDraft = JSON.parse(JSON.stringify(getSkillTemplate()));
  _renderSkillTemplateEditor();
}

function _renderSkillTemplateEditor() {
  const tmpl = _talentSkillDraft;
  const catsHTML = tmpl.categories.map((cat, ci) => `
    <div class="ste-cat">
      <div class="ste-cat-head">
        <input class="form-input ste-cat-name" id="ste_cat_${ci}" value="${cat.name}" placeholder="カテゴリ名">
        <button class="btn btn-danger" style="font-size:11px;padding:5px 10px;flex-shrink:0"
          onclick="steDeleteCat(${ci})">削除</button>
      </div>
      <div class="ste-items">
        ${cat.items.map((item, ii) => `
          <div class="ste-item-row">
            <input class="form-input ste-item-text" id="ste_item_${ci}_${ii}" value="${item.text}" placeholder="評価項目の文章">
            <button class="btn btn-ghost" style="font-size:11px;padding:5px 10px;flex-shrink:0;color:var(--danger)"
              onclick="steDeleteItem(${ci},${ii})">✕</button>
          </div>`).join('')}
      </div>
      <button class="btn btn-ghost" style="font-size:12px;width:100%" onclick="steAddItem(${ci})">＋ 項目を追加</button>
    </div>`).join('');

  showWideModal(`
    <div class="modal-header">
      <div style="font-size:20px">📋</div>
      <div class="modal-title">スキルシート設定</div>
      <button class="modal-close" onclick="closeModal()">✕</button>
    </div>
    <div class="modal-body" style="max-height:65vh;overflow-y:auto">
      <div style="font-size:12px;color:var(--text-sub);margin-bottom:16px">
        カテゴリと評価項目を自由に設定できます。保存後は全メンバーのスキルシートに反映されます。
      </div>
      <div class="ste-wrap">${catsHTML}</div>
      <button class="btn btn-ghost" style="width:100%;margin-top:12px" onclick="steAddCat()">＋ カテゴリを追加</button>
    </div>
    <div class="modal-footer">
      <button class="btn btn-ghost" onclick="closeModal();_talentSkillDraft=null">キャンセル</button>
      <button class="btn btn-primary" onclick="steApplySave()">保存する</button>
    </div>
  `);
}

function _steCollect() {
  _talentSkillDraft.categories.forEach((cat, ci) => {
    const cn = document.getElementById(`ste_cat_${ci}`);
    if (cn) cat.name = cn.value;
    cat.items.forEach((item, ii) => {
      const el = document.getElementById(`ste_item_${ci}_${ii}`);
      if (el) item.text = el.value;
    });
  });
}
function steDeleteCat(ci) {
  _steCollect();
  _talentSkillDraft.categories.splice(ci, 1);
  _renderSkillTemplateEditor();
}
function steDeleteItem(ci, ii) {
  _steCollect();
  _talentSkillDraft.categories[ci].items.splice(ii, 1);
  _renderSkillTemplateEditor();
}
function steAddItem(ci) {
  _steCollect();
  _talentSkillDraft.categories[ci].items.push({ id: 'i' + Date.now(), text: '' });
  _renderSkillTemplateEditor();
}
function steAddCat() {
  _steCollect();
  _talentSkillDraft.categories.push({ id: 'c' + Date.now(), name: '', items: [] });
  _renderSkillTemplateEditor();
}
function steApplySave() {
  _steCollect();
  const cleaned = {
    categories: _talentSkillDraft.categories
      .filter(c => c.name.trim())
      .map(c => ({ ...c, items: c.items.filter(i => i.text.trim()) }))
      .filter(c => c.items.length > 0)
  };
  if (!cleaned.categories.length) { showToast('カテゴリと項目を1つ以上入力してください', 'error'); return; }
  saveSkillTemplate(cleaned);
  _talentSkillDraft = null;
  closeModal();
  showToast('スキルシートを保存しました');
  renderTalent();
}

// ═══════════════════════════════════════════════════════
// ─── VENUE ACHIEVE（現場達成率）───
// ═══════════════════════════════════════════════════════

// ── SVGチャート: 水平バー（平日現場別比較） ──
// items: [{ label, budget, actual }]
// ── SVGチャート: 縦棒（現場別・予算vs実績・達成率） ──
// items: [{ label, budget, actual }]
function _vaVBarChart(items) {
  if (!items || !items.length) return '';
  const padL = 22, padR = 10, padT = 38, padB = 54;
  const barAreaH = 120;
  const W = 500, H = padT + barAreaH + padB;
  const n = items.length;
  const step = (W - padL - padR) / n;
  const barW = Math.max(14, Math.min(56, step * 0.58));
  const maxVal = Math.max(...items.map(i => Math.max(Number(i.budget)||0, Number(i.actual)||0)), 1);
  const baseY = padT + barAreaH;
  const rotateLabels = n > 4;

  const gridLines = [0.25, 0.5, 0.75, 1.0].map(p => {
    const y = padT + barAreaH * (1 - p);
    return `
      <line x1="${padL}" y1="${y}" x2="${W - padR}" y2="${y}" stroke="rgba(255,255,255,.05)" stroke-width="1"/>
      <text x="${padL - 3}" y="${y + 4}" text-anchor="end" font-size="8" fill="rgba(208,216,238,.28)">${Math.round(p * maxVal)}</text>`;
  }).join('');

  const bars = items.map((item, i) => {
    const bgt   = Number(item.budget) || 0;
    const act   = Number(item.actual) || 0;
    const rate  = calcAchieve(act, bgt);
    const color = achieveColor(rate);
    const cx = padL + step * i + step / 2;
    const x  = cx - barW / 2;
    const bh = bgt > 0 ? (bgt / maxVal) * barAreaH : 5;
    const ah = bgt > 0
      ? Math.min(act / bgt, 1.3) * bh
      : (act > 0 ? (act / maxVal) * barAreaH : 0);
    const budgetY = baseY - bh;
    const actualY = baseY - ah;
    const lbl = item.label.length > 9 ? item.label.slice(0, 8) + '…' : item.label;
    const labelEl = rotateLabels
      ? `<g transform="translate(${cx},${baseY + 10}) rotate(-35)"><text text-anchor="end" font-size="10" fill="rgba(208,216,238,.8)">${lbl}</text></g>`
      : `<text x="${cx}" y="${baseY + 16}" text-anchor="middle" font-size="10" fill="rgba(208,216,238,.8)">${lbl}</text>`;
    return `
      <rect x="${x}" y="${budgetY}" width="${barW}" height="${bh}" rx="3" fill="rgba(255,255,255,.1)"/>
      ${ah > 1 ? `<rect x="${x}" y="${actualY}" width="${barW}" height="${ah}" rx="3" fill="${color}" opacity=".86"/>` : ''}
      ${bgt > 0 ? `<text x="${cx}" y="${budgetY - 4}" text-anchor="middle" font-size="9" fill="rgba(208,216,238,.42)">目標${bgt}</text>` : ''}
      ${rate !== null
        ? `<text x="${cx}" y="${Math.min(actualY - 5, budgetY - 16)}" text-anchor="middle" font-size="11" font-weight="bold" fill="${color}" font-family="'Space Grotesk',monospace">${rate}%</text>`
        : (bgt > 0 ? `<text x="${cx}" y="${budgetY - 16}" text-anchor="middle" font-size="9" fill="rgba(208,216,238,.35)">—</text>` : '')}
      ${act > 0 && ah > 14 ? `<text x="${cx}" y="${actualY + 12}" text-anchor="middle" font-size="10" fill="rgba(255,255,255,.82)" font-family="'Space Grotesk',monospace">${act}</text>` : ''}
      ${act > 0 && ah <= 14 ? `<text x="${cx}" y="${actualY - 2}" text-anchor="middle" font-size="9" fill="rgba(208,216,238,.65)" font-family="'Space Grotesk',monospace">${act}</text>` : ''}
      ${labelEl}`;
  }).join('');

  return `<div class="va-chart-wrap">
    <svg width="100%" viewBox="0 0 ${W} ${H}" style="display:block;min-width:260px">
      ${gridLines}${bars}
    </svg>
  </div>`;
}

// ── SVGチャート: 縦棒（週末別達成率比較） ──
// weekends: [{sat, sun}], weData: {[sat]: {sites:[...]}}
function _vaWeekendBarChart(weekends, weData) {
  if (!weekends.length) return '';
  const items = weekends.map(({ sat, sun }) => {
    const sites = (weData[sat] || {}).sites || [];
    const totalBudget = sites.reduce((s, x) => s + (Number(x.budget) || 0), 0);
    const totalActual = sites.reduce((s, x) => s + (Number(x.actual) || 0), 0);
    const rate  = calcAchieve(totalActual, totalBudget);
    const [, m, d] = sat.split('-');
    return { label: `${parseInt(m)}/${parseInt(d)}`, budget: totalBudget, actual: totalActual, rate };
  });

  const W = 420, H = 130;
  const n = items.length;
  const maxBudget = Math.max(...items.map(i => i.budget), 1);
  const barMaxH = 78;
  const totalBarW = Math.min(52, Math.floor((W - 30) / n) - 10);
  const step = (W - 20) / n;

  const bars = items.map((item, i) => {
    const cx = 10 + step * i + step / 2;
    const x  = cx - totalBarW / 2;
    const bh = item.budget > 0 ? (item.budget / maxBudget) * barMaxH : 6;
    const ah = item.budget > 0 ? Math.min(item.actual / item.budget, 1.25) * bh : 0;
    const color = achieveColor(item.rate);
    const budgetY = H - 26 - bh;
    const actualY = H - 26 - ah;
    return `
      <rect x="${x}" y="${budgetY}" width="${totalBarW}" height="${bh}" rx="3" fill="rgba(255,255,255,.09)"/>
      ${ah > 0 ? `<rect x="${x}" y="${actualY}" width="${totalBarW}" height="${ah}" rx="3" fill="${color}" opacity=".85"/>` : ''}
      ${item.budget > 0 ? `<text x="${cx}" y="${budgetY - 3}" text-anchor="middle" font-size="9" fill="rgba(208,216,238,.42)">目標${item.budget}</text>` : ''}
      ${item.actual > 0 && ah > 13 ? `<text x="${cx}" y="${actualY + 11}" text-anchor="middle" font-size="9" fill="rgba(255,255,255,.8)">${item.actual}</text>` : ''}
      <text x="${cx}" y="${H - 10}" text-anchor="middle" font-size="10" fill="rgba(208,216,238,.7)">${item.label}</text>
      ${item.rate !== null ? `<text x="${cx}" y="${Math.min(actualY - 4, budgetY - 14)}" text-anchor="middle" font-size="10" font-weight="bold" fill="${color}">${item.rate}%</text>` : ''}
    `;
  }).join('');

  return `<div class="va-chart-wrap">
    <svg width="100%" viewBox="0 0 ${W} ${H}" style="display:block;max-width:420px">${bars}</svg>
  </div>`;
}

// ── 平日カテゴリ定義 ──
const WD_CATS = [
  { key: 'sy',        label: 'SY対外 (Y→S込み)', unit: '件',   weeks: true  },
  { key: 'mnp',       label: 'MNP',               unit: '件',   weeks: false },
  { key: 'shinki',    label: '新規・番号以降',      unit: '件',   weeks: false },
  { key: 'bb',        label: 'BB',                unit: '件',   weeks: false },
  { key: 'denki',     label: '電気',              unit: '件',   weeks: false },
  { key: 'paypay',    label: 'PayPayカード',        unit: '件',   weeks: false },
  { key: 'mikomi',    label: '週末見込み',         unit: '件',   weeks: false },
  { key: 'selection', label: 'セレクション',       unit: '万円', weeks: false },
];

// ── 平日ビュー ──
function _renderVAWeekday(achieve, canEdit) {
  const sites  = getShiftSites().filter(s => s !== '休み');
  const wdData = achieve.weekday || {};

  const chartItems = sites.map(site => ({
    label:  site,
    budget: (wdData[site] || {}).budget || 0,
    actual: (wdData[site] || {}).actual || 0
  }));
  const totalBudget = chartItems.reduce((s, i) => s + i.budget, 0);
  const totalActual = chartItems.reduce((s, i) => s + i.actual, 0);
  const totalRate   = calcAchieve(totalActual, totalBudget);

  const venueCards = sites.length === 0
    ? `<div class="card fade-in" style="text-align:center;color:var(--text-sub);padding:20px 0">⚙ 設定 → 現場・コマ数設定 から現場を追加してください</div>`
    : sites.map(site => _renderWdVenueCard(site, wdData[site] || {}, canEdit)).join('');

  return `
    <div class="card fade-in">
      <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;margin-bottom:14px">
        <div class="section-title" style="margin:0">平日 現場別達成率</div>
        <div style="text-align:right">
          <div style="font-size:11px;color:var(--text-sub)">合計達成率</div>
          <div style="font-family:'Space Grotesk',monospace;font-size:28px;font-weight:700;color:${achieveColor(totalRate)};line-height:1.1">${totalRate !== null ? totalRate + '%' : '—'}</div>
          <div style="font-size:11px;color:var(--text-sub);margin-top:2px">予算 ${totalBudget.toLocaleString()} / 実績 ${totalActual.toLocaleString()}</div>
        </div>
      </div>
      ${sites.length ? _vaVBarChart(chartItems) : '<div style="color:var(--text-sub);font-size:13px">現場が登録されていません</div>'}
    </div>
    ${venueCards}`;
}

// ── 現場カード（閲覧 or 編集）──
function _renderWdVenueCard(site, siteData, canEdit) {
  const sc  = getSiteColor(site);
  const dot = sc ? sc.text : 'var(--accent)';
  if (wdEditingSite === site && canEdit) {
    return _renderWdVenueCardEdit(site, siteData, dot);
  }
  return _renderWdVenueCardView(site, siteData, dot, canEdit);
}

// ── 現場カード: 閲覧モード ──
function _renderWdVenueCardView(site, siteData, dot, canEdit) {
  const items    = siteData.items || {};
  const hasItems = Object.keys(items).length > 0;
  const sy       = items.sy || {};
  const syTarget = Number(sy.target) || Number(siteData.budget) || 0;
  const syActual = [1,2,3,4,5].reduce((s, w) => s + (Number(sy[`w${w}a`]) || 0), 0) || Number(siteData.actual) || 0;
  const syRate   = calcAchieve(syActual, syTarget);
  const editBtn  = canEdit
    ? `<button class="btn btn-ghost" style="font-size:12px;padding:5px 12px" onclick="wdStartEdit('${site.replace(/\\/g,'\\\\').replace(/'/g,"\\'")}')">編集</button>`
    : '';

  const header = `
    <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;margin-bottom:${hasItems?14:0}px">
      <div style="display:flex;align-items:center;gap:10px">
        <div style="width:10px;height:10px;border-radius:50%;background:${dot};flex-shrink:0"></div>
        <div style="font-size:15px;font-weight:700">${site}</div>
      </div>
      <div style="display:flex;align-items:center;gap:12px">
        ${syRate !== null ? `<div style="font-family:'Space Grotesk',monospace;font-size:20px;font-weight:700;color:${achieveColor(syRate)}">${syRate}%</div>` : ''}
        ${editBtn}
      </div>
    </div>`;

  if (!hasItems) {
    return `<div class="card fade-in">
      ${header}
      ${canEdit ? '<div style="color:var(--text-sub);font-size:12px;text-align:center;padding:6px 0">編集から週次データを入力できます</div>' : ''}
    </div>`;
  }

  // 週カラー定義 [背景色, 左ボーダー色]
  const W_CLR = [
    ['rgba(134,249,215,.11)', 'rgba(134,249,215,.5)'],
    ['rgba(255,217,168,.11)', 'rgba(255,217,168,.5)'],
    ['rgba(255,149,179,.08)', 'rgba(255,149,179,.4)'],
    ['rgba(255,149,179,.13)', 'rgba(255,149,179,.5)'],
    ['rgba(255,149,179,.19)', 'rgba(255,149,179,.6)'],
  ];

  const wBgt       = [1,2,3,4,5].map(w => Number(sy[`w${w}b`]) || 0);
  const wAct       = [1,2,3,4,5].map(w => Number(sy[`w${w}a`]) || 0);
  const activeWks  = [0,1,2,3,4].filter(i => wBgt[i] > 0 || wAct[i] > 0);
  const showSY     = syTarget > 0 || syActual > 0 || activeWks.length > 0;
  const sySpan     = 1 + activeWks.length;

  const syRows = showSY ? `
    <tr style="border-top:1px solid rgba(106,128,186,.2)">
      <td rowspan="${sySpan}" style="padding:9px 12px;font-size:13px;font-weight:600;vertical-align:middle;border-right:1px solid rgba(106,128,186,.12);white-space:nowrap">SY対外</td>
      <td style="padding:7px 8px;font-size:11px;color:var(--text-sub);text-align:center">合計</td>
      <td style="padding:7px 10px;font-family:'Space Grotesk',monospace;font-size:12px;text-align:right;color:var(--text-sub)">${syTarget > 0 ? syTarget : '—'}</td>
      <td style="padding:7px 10px;font-family:'Space Grotesk',monospace;font-size:13px;font-weight:600;text-align:right">${syActual > 0 ? syActual : '—'}</td>
      <td style="padding:7px 10px;font-family:'Space Grotesk',monospace;font-size:13px;font-weight:700;text-align:right;color:${achieveColor(syRate)}">${syRate !== null ? syRate + '%' : '—'}</td>
    </tr>
    ${activeWks.map(i => {
      const wb = wBgt[i], wa = wAct[i], wr = calcAchieve(wa, wb);
      return `<tr style="background:${W_CLR[i][0]};border-top:1px solid rgba(106,128,186,.06)">
        <td style="padding:5px 8px;font-size:12px;color:var(--text-sub);text-align:center;border-left:3px solid ${W_CLR[i][1]}">W${i+1}</td>
        <td style="padding:5px 10px;font-family:'Space Grotesk',monospace;font-size:12px;text-align:right;color:var(--text-sub)">${wb > 0 ? wb : '—'}</td>
        <td style="padding:5px 10px;font-family:'Space Grotesk',monospace;font-size:12px;text-align:right">${wa > 0 ? wa : '—'}</td>
        <td style="padding:5px 10px;font-family:'Space Grotesk',monospace;font-size:12px;font-weight:600;text-align:right;color:${achieveColor(wr)}">${wr !== null ? wr + '%' : '—'}</td>
      </tr>`;
    }).join('')}` : '';

  const catRows = WD_CATS.filter(c => !c.weeks).map(cat => {
    const d      = items[cat.key] || {};
    const target = Number(d.target) || 0;
    const actual = Number(d.actual) || 0;
    if (target === 0 && actual === 0) return '';
    const rate = calcAchieve(actual, target);
    return `
      <tr style="border-top:1px solid rgba(106,128,186,.15)">
        <td colspan="2" style="padding:8px 12px;font-size:13px">${cat.label}</td>
        <td style="padding:8px 10px;font-family:'Space Grotesk',monospace;font-size:12px;text-align:right;color:var(--text-sub)">${target > 0 ? target + cat.unit : '—'}</td>
        <td style="padding:8px 10px;font-family:'Space Grotesk',monospace;font-size:13px;font-weight:600;text-align:right">${actual > 0 ? actual + cat.unit : '—'}</td>
        <td style="padding:8px 10px;font-family:'Space Grotesk',monospace;font-size:13px;font-weight:700;text-align:right;color:${achieveColor(rate)}">${rate !== null ? rate + '%' : '—'}</td>
      </tr>`;
  }).join('');

  return `
    <div class="card fade-in">
      ${header}
      <div style="overflow-x:auto">
        <table style="width:100%;border-collapse:collapse">
          <thead>
            <tr style="border-bottom:1px solid var(--border)">
              <th style="padding:6px 12px;text-align:left;font-size:11px;color:var(--text-sub);font-weight:500">商材</th>
              <th style="padding:6px 8px;text-align:center;font-size:11px;color:var(--text-sub);font-weight:500;width:38px">週</th>
              <th style="padding:6px 10px;text-align:right;font-size:11px;color:var(--text-sub);font-weight:500">目標</th>
              <th style="padding:6px 10px;text-align:right;font-size:11px;color:var(--text-sub);font-weight:500">実績</th>
              <th style="padding:6px 10px;text-align:right;font-size:11px;color:var(--text-sub);font-weight:500;min-width:56px">達成率</th>
            </tr>
          </thead>
          <tbody>
            ${syRows}
            ${catRows}
          </tbody>
        </table>
      </div>
    </div>`;
}

// ── 現場カード: 編集モード ──
function _renderWdVenueCardEdit(site, siteData, dot) {
  const items = siteData.items || {};
  const sy    = items.sy || {};

  const weekInputs = [1,2,3,4,5].map(w => `
    <tr>
      <td style="padding:5px 12px 5px 0;font-size:13px;color:var(--text-sub);white-space:nowrap">W${w}</td>
      <td style="padding:4px 6px">
        <div style="display:flex;align-items:center;gap:4px">
          <input type="number" class="form-input-sm" id="wd_sy_w${w}b" value="${Number(sy[`w${w}b`])||''}" placeholder="0" min="0" style="width:72px">
          <span style="font-size:11px;color:var(--text-sub)">件</span>
        </div>
      </td>
      <td style="padding:4px 6px">
        <div style="display:flex;align-items:center;gap:4px">
          <input type="number" class="form-input-sm" id="wd_sy_w${w}a" value="${Number(sy[`w${w}a`])||''}" placeholder="0" min="0" style="width:72px">
          <span style="font-size:11px;color:var(--text-sub)">件</span>
        </div>
      </td>
    </tr>`).join('');

  const otherInputs = WD_CATS.filter(c => !c.weeks).map(cat => {
    const d = items[cat.key] || {};
    return `
      <tr style="border-top:1px solid rgba(106,128,186,.15)">
        <td style="padding:8px 12px;font-size:13px;white-space:nowrap">${cat.label}</td>
        <td style="padding:6px 8px">
          <div style="display:flex;align-items:center;gap:4px">
            <input type="number" class="form-input-sm" id="wd_${cat.key}_t" value="${Number(d.target)||''}" placeholder="0" min="0" style="width:80px">
            <span style="font-size:11px;color:var(--text-sub)">${cat.unit}</span>
          </div>
        </td>
        <td style="padding:6px 8px">
          <div style="display:flex;align-items:center;gap:4px">
            <input type="number" class="form-input-sm" id="wd_${cat.key}_a" value="${Number(d.actual)||''}" placeholder="0" min="0" style="width:80px">
            <span style="font-size:11px;color:var(--text-sub)">${cat.unit}</span>
          </div>
        </td>
      </tr>`;
  }).join('');

  return `
    <div class="card fade-in" style="border:1px solid var(--accent)">
      <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;margin-bottom:18px">
        <div style="display:flex;align-items:center;gap:10px">
          <div style="width:10px;height:10px;border-radius:50%;background:${dot};flex-shrink:0"></div>
          <div style="font-size:15px;font-weight:700">${site}</div>
          <span style="font-size:11px;background:rgba(171,160,255,.2);color:var(--accent);padding:2px 8px;border-radius:20px">編集中</span>
        </div>
        <div style="display:flex;gap:8px">
          <button class="btn btn-ghost" style="font-size:12px;padding:5px 12px" onclick="wdCancelEdit()">キャンセル</button>
          <button class="btn btn-primary" style="font-size:12px;padding:5px 14px" onclick="wdSaveEdit('${site.replace(/\\/g,'\\\\').replace(/'/g,"\\'")}')">保存</button>
        </div>
      </div>

      <div style="margin-bottom:16px">
        <div style="font-size:12px;font-weight:600;color:var(--accent2);margin-bottom:8px">SY対外 (Y→S込み)</div>
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px">
          <span style="font-size:13px;color:var(--text-sub)">月間目標:</span>
          <input type="number" class="form-input-sm" id="wd_sy_target" value="${Number(sy.target)||''}" placeholder="0" min="0" style="width:88px">
          <span style="font-size:12px;color:var(--text-sub)">件</span>
        </div>
        <div style="overflow-x:auto">
          <table style="border-collapse:collapse">
            <thead>
              <tr>
                <th style="padding:4px 12px 4px 0;text-align:left;font-size:11px;color:var(--text-sub);font-weight:500">週</th>
                <th style="padding:4px 8px;font-size:11px;color:var(--text-sub);font-weight:500">目標</th>
                <th style="padding:4px 8px;font-size:11px;color:var(--text-sub);font-weight:500">実績</th>
              </tr>
            </thead>
            <tbody>${weekInputs}</tbody>
          </table>
        </div>
      </div>

      <div style="overflow-x:auto">
        <table style="width:100%;border-collapse:collapse">
          <thead>
            <tr style="border-bottom:1px solid var(--border)">
              <th style="padding:6px 12px;text-align:left;font-size:11px;color:var(--text-sub);font-weight:500">カテゴリ</th>
              <th style="padding:6px 8px;font-size:11px;color:var(--text-sub);font-weight:500">目標</th>
              <th style="padding:6px 8px;font-size:11px;color:var(--text-sub);font-weight:500">実績</th>
            </tr>
          </thead>
          <tbody>${otherInputs}</tbody>
        </table>
      </div>
    </div>`;
}

// ── 週末達成率: 現場名コンボボックス ──
function _vaVenueComboHtml(inputId, value, style) {
  return `<div class="va-venue-combo" style="${style}">
    <input type="text" class="form-input-sm" id="${inputId}"
           value="${value.replace(/"/g, '&quot;')}" placeholder="現場名"
           autocomplete="off" style="width:100%"
           oninput="_vaComboFilter('${inputId}')"
           onfocus="_vaComboShow('${inputId}')"
           onblur="_vaComboHide('${inputId}')">
    <div class="va-venue-dropdown" id="${inputId}_drop" style="display:none"></div>
  </div>`;
}

function _vaComboAll() {
  return getAllVenueWeekendSiteNames();
}

function _vaComboRenderDrop(drop, inputId, names) {
  if (!names.length) {
    drop.innerHTML = '<div class="va-venue-option-empty">候補なし</div>';
    return;
  }
  drop.innerHTML = names.map(n =>
    `<div class="va-venue-option" onmousedown="event.preventDefault();_vaComboSelect('${inputId}','${n.replace(/'/g, "\\'")}')">` +
    n + '</div>'
  ).join('');
}

function _vaComboFilter(inputId) {
  const input = document.getElementById(inputId);
  const drop  = document.getElementById(inputId + '_drop');
  if (!input || !drop) return;
  const q = input.value.trim().toLowerCase();
  const filtered = _vaComboAll().filter(n => !q || n.toLowerCase().includes(q));
  _vaComboRenderDrop(drop, inputId, filtered);
  drop.style.display = 'block';
}

function _vaComboShow(inputId) {
  const input = document.getElementById(inputId);
  const drop  = document.getElementById(inputId + '_drop');
  if (!input || !drop) return;
  const q = input.value.trim().toLowerCase();
  const filtered = _vaComboAll().filter(n => !q || n.toLowerCase().includes(q));
  _vaComboRenderDrop(drop, inputId, filtered);
  drop.style.display = 'block';
}

function _vaComboHide(inputId) {
  // mousedown の後に blur が来るので少し待つ
  setTimeout(() => {
    const drop = document.getElementById(inputId + '_drop');
    if (drop) drop.style.display = 'none';
  }, 180);
}

function _vaComboSelect(inputId, name) {
  const input = document.getElementById(inputId);
  if (input) { input.value = name; input.dispatchEvent(new Event('input')); }
  const drop = document.getElementById(inputId + '_drop');
  if (drop) drop.style.display = 'none';
}

// ── 週末ビュー ──
function _renderVAWeekend(achieve, canEdit) {
  const weekends  = getWeekendDates(venueAchieveMonth);
  const weAchieve = achieve.weekends || {};

  if (!weekends.length) {
    return `<div class="card fade-in" style="text-align:center;color:var(--text-sub);padding:40px">この月に週末はありません</div>`;
  }

  // 全週末の合計
  const grandBudget = weekends.reduce((s, { sat }) => {
    return s + ((weAchieve[sat] || {}).sites || []).reduce((ss, x) => ss + (Number(x.budget) || 0), 0);
  }, 0);
  const grandActual = weekends.reduce((s, { sat }) => {
    return s + ((weAchieve[sat] || {}).sites || []).reduce((ss, x) => ss + (Number(x.actual) || 0), 0);
  }, 0);
  const grandRate = calcAchieve(grandActual, grandBudget);

  // 週末ごとのカード
  const weekendCards = weekends.map(({ sat, sun }) => {
    const sites     = (weAchieve[sat] || {}).sites || [];
    const dateLabel = formatDate(sat) + '(土)' + (sun ? '・' + formatDate(sun) + '(日)' : '');
    const wBudget   = sites.reduce((s, x) => s + (Number(x.budget) || 0), 0);
    const wActual   = sites.reduce((s, x) => s + (Number(x.actual) || 0), 0);
    const wRate     = calcAchieve(wActual, wBudget);

    const siteRows = sites.map((site, idx) => {
      const rate  = calcAchieve(Number(site.actual) || 0, Number(site.budget) || 0);
      const color = achieveColor(rate);
      return `
        <tr style="border-bottom:1px solid rgba(106,128,186,.15)">
          <td style="padding:8px 10px">
            ${canEdit
              ? _vaVenueComboHtml(`va_we_name_${sat}_${idx}`, site.name, 'width:150px')
              : `<span style="font-size:13px">${site.name}</span>`}
          </td>
          ${canEdit
            ? `<td style="padding:6px 8px"><input type="number" class="form-input-sm" id="va_we_b_${sat}_${idx}" value="${Number(site.budget)||''}" placeholder="0" min="0" style="width:80px"></td>
               <td style="padding:6px 8px"><input type="number" class="form-input-sm" id="va_we_a_${sat}_${idx}" value="${Number(site.actual)||''}" placeholder="0" min="0" style="width:80px"></td>`
            : `<td style="padding:8px 10px;font-family:'Space Grotesk',monospace;text-align:right;font-size:13px">${Number(site.budget)>0?Number(site.budget).toLocaleString():'—'}</td>
               <td style="padding:8px 10px;font-family:'Space Grotesk',monospace;text-align:right;font-size:13px">${Number(site.actual)>0?Number(site.actual).toLocaleString():'—'}</td>`}
          <td style="padding:8px 10px;min-width:120px">
            ${rate !== null
              ? `<div style="display:flex;align-items:center;gap:6px">
                   <div class="va-progress-bar" style="flex:1"><div class="va-progress-fill" style="width:${Math.min(rate,100)}%;background:${color}"></div></div>
                   <span style="font-family:'Space Grotesk',monospace;font-size:13px;font-weight:700;color:${color};min-width:40px;text-align:right">${rate}%</span>
                 </div>`
              : `<span style="color:var(--text-sub);font-size:11px">予算未設定</span>`}
          </td>
          ${canEdit ? `<td style="padding:6px 8px"><button class="btn" style="font-size:11px;padding:3px 8px;background:rgba(255,149,179,.15);color:var(--danger);border:1px solid rgba(255,149,179,.3)" onclick="venueAchieveRemoveWeekendSite('${sat}',${idx})">✕</button></td>` : ''}
        </tr>`;
    }).join('');

    // 新規追加行（編集時のみ）
    const newRow = canEdit ? `
      <tr style="background:rgba(171,160,255,.05)">
        <td style="padding:6px 8px">${_vaVenueComboHtml(`va_we_new_name_${sat}`, '', 'width:150px')}</td>
        <td style="padding:6px 8px"><input type="number" class="form-input-sm" id="va_we_new_b_${sat}" placeholder="予算" min="0" style="width:80px"></td>
        <td style="padding:6px 8px"><input type="number" class="form-input-sm" id="va_we_new_a_${sat}" placeholder="実績" min="0" style="width:80px"></td>
        <td colspan="2" style="padding:6px 8px">
          <button class="btn btn-ghost" style="font-size:11px;padding:4px 10px" onclick="venueAchieveAddWeekendSite('${sat}')">＋ 追加</button>
        </td>
      </tr>` : '';

    return `
      <div class="card fade-in">
        <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px;margin-bottom:14px">
          <div>
            <div style="font-size:15px;font-weight:700">${dateLabel}</div>
            ${wBudget > 0 ? `<div style="font-size:11px;color:var(--text-sub);margin-top:2px">予算 ${wBudget.toLocaleString()} / 実績 ${wActual.toLocaleString()}</div>` : ''}
          </div>
          <div style="display:flex;align-items:center;gap:10px">
            ${wRate !== null ? `<div style="font-family:'Space Grotesk',monospace;font-size:22px;font-weight:700;color:${achieveColor(wRate)}">${wRate}%</div>` : ''}
            ${canEdit ? `<button class="btn btn-primary" style="font-size:12px;padding:5px 14px" onclick="venueAchieveSaveWeekend('${sat}')">保存</button>` : ''}
          </div>
        </div>
        <div style="overflow-x:auto">
          <table style="width:100%;border-collapse:collapse">
            <thead>
              <tr style="border-bottom:1px solid var(--border)">
                <th style="padding:7px 10px;text-align:left;font-size:11px;color:var(--text-sub);font-weight:500">現場名</th>
                <th style="padding:7px 10px;text-align:${canEdit?'left':'right'};font-size:11px;color:var(--text-sub);font-weight:500">予算</th>
                <th style="padding:7px 10px;text-align:${canEdit?'left':'right'};font-size:11px;color:var(--text-sub);font-weight:500">実績</th>
                <th style="padding:7px 10px;text-align:left;font-size:11px;color:var(--text-sub);font-weight:500">達成率</th>
                ${canEdit ? '<th style="width:40px"></th>' : ''}
              </tr>
            </thead>
            <tbody>
              ${siteRows}
              ${newRow}
              ${sites.length === 0 && !canEdit ? `<tr><td colspan="4" style="padding:16px 10px;text-align:center;color:var(--text-sub);font-size:13px">データなし</td></tr>` : ''}
            </tbody>
          </table>
        </div>
      </div>`;
  }).join('');

  return `
    <!-- 概要チャート -->
    <div class="card fade-in">
      <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;margin-bottom:14px">
        <div class="section-title" style="margin:0">週末 週別達成率</div>
        <div style="text-align:right">
          <div style="font-size:11px;color:var(--text-sub)">月間合計達成率</div>
          <div style="font-family:'Space Grotesk',monospace;font-size:28px;font-weight:700;color:${achieveColor(grandRate)};line-height:1.1">${grandRate !== null ? grandRate + '%' : '—'}</div>
          <div style="font-size:11px;color:var(--text-sub);margin-top:2px">予算 ${grandBudget.toLocaleString()} / 実績 ${grandActual.toLocaleString()}</div>
        </div>
      </div>
      ${_vaWeekendBarChart(weekends, weAchieve)}
    </div>

    ${weekendCards}`;
}

// ── メインレンダラー ──
// ── 平日達成率ページ ──
function renderVenueAchieveWeekday() {
  if (!venueAchieveMonth) venueAchieveMonth = currentMonth();
  const level   = roleLevel(CU.role);
  const canEdit = level >= 4;
  const months  = getAvailableMonths();
  const achieve = getVenueAchieve(venueAchieveMonth);

  document.getElementById('main').innerHTML = `
    <div class="page-header fade-in">
      <div>
        <div class="page-title">平日達成率</div>
        <div class="page-sub">${monthLabel(venueAchieveMonth)}の現場別・平日予算達成状況</div>
      </div>
      <select class="form-input-sm" onchange="venueAchieveMonth=this.value;renderVenueAchieveWeekday()">
        ${months.map(m => `<option value="${m}" ${m===venueAchieveMonth?'selected':''}>${monthLabel(m)}</option>`).join('')}
      </select>
    </div>
    <div style="display:flex;flex-direction:column;gap:16px">
      ${_renderVAWeekday(achieve, canEdit)}
    </div>
  `;
}

// ── 週末達成率ページ（グラフ切り替え付き）──
function renderVenueAchieveWeekend() {
  if (!venueAchieveMonth) venueAchieveMonth = currentMonth();
  const level   = roleLevel(CU.role);
  const canEdit = level >= 4;
  const months  = getAvailableMonths();
  const achieve = getVenueAchieve(venueAchieveMonth);
  const weekends = getWeekendDates(venueAchieveMonth);
  const weAchieve = achieve.weekends || {};

  // 選択中の週末をデフォルト設定（最初の週末）
  if (!venueWeekendSelectedSat || !weekends.find(w => w.sat === venueWeekendSelectedSat)) {
    venueWeekendSelectedSat = weekends[0]?.sat || '';
  }

  // 「現場×過去6ヶ月」モード用の現場一覧（直近6ヶ月全体から収集）
  const trendSiteNames = _vaCollectAllSiteNames(6);
  if (!venueWeekendSelectedSite || !trendSiteNames.includes(venueWeekendSelectedSite)) {
    venueWeekendSelectedSite = trendSiteNames[0] || '';
  }

  // グラフエリア
  const chartSection = _renderVAWeekendChart(weekends, weAchieve, trendSiteNames);

  document.getElementById('main').innerHTML = `
    <div class="page-header fade-in">
      <div>
        <div class="page-title">週末達成率</div>
        <div class="page-sub">${monthLabel(venueAchieveMonth)}の週末別予算達成状況</div>
      </div>
      <select class="form-input-sm" onchange="venueAchieveMonth=this.value;venueWeekendSelectedSat='';renderVenueAchieveWeekend()">
        ${months.map(m => `<option value="${m}" ${m===venueAchieveMonth?'selected':''}>${monthLabel(m)}</option>`).join('')}
      </select>
    </div>
    <div style="display:flex;flex-direction:column;gap:16px">
      ${chartSection}
      ${_renderVAWeekend(achieve, canEdit)}
    </div>
  `;
}

// 過去N ヶ月のすべての週末現場名を収集（ユニーク・登場順）
function _vaCollectAllSiteNames(monthCount = 6) {
  const names = new Set();
  const now = new Date();
  for (let i = monthCount - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const m = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    for (const n of getVenueWeekendSiteNames(m)) names.add(n);
  }
  return [...names];
}

// ── 週末グラフ切り替えセクション ──
function _renderVAWeekendChart(weekends, weAchieve, trendSiteNames) {
  const modeToggle = `
    <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
      <div class="va-view-toggle">
        <button class="va-vt-btn${venueWeekendChartMode==='by_weekend'?' is-active':''}"
          onclick="venueWeekendChartMode='by_weekend';renderVenueAchieveWeekend()">週末 × 全現場</button>
        <button class="va-vt-btn${venueWeekendChartMode==='by_month_sites'?' is-active':''}"
          onclick="venueWeekendChartMode='by_month_sites';renderVenueAchieveWeekend()">月間現場合計</button>
        <button class="va-vt-btn${venueWeekendChartMode==='by_site'?' is-active':''}"
          onclick="venueWeekendChartMode='by_site';renderVenueAchieveWeekend()">現場別推移</button>
      </div>
      ${venueWeekendChartMode === 'by_weekend' && weekends.length > 0 ? `
        <select class="form-input-sm" onchange="venueWeekendSelectedSat=this.value;renderVenueAchieveWeekend()">
          ${weekends.map(({sat, sun}) => {
            const lbl = formatDate(sat) + '(土)' + (sun ? '・' + formatDate(sun) + '(日)' : '');
            return `<option value="${sat}" ${sat===venueWeekendSelectedSat?'selected':''}>${lbl}</option>`;
          }).join('')}
        </select>
      ` : ''}
      ${venueWeekendChartMode === 'by_site' && trendSiteNames.length > 0 ? `
        <select class="form-input-sm" onchange="venueWeekendSelectedSite=this.value;renderVenueAchieveWeekend()">
          ${trendSiteNames.map(n => `<option value="${n}" ${n===venueWeekendSelectedSite?'selected':''}>${n}</option>`).join('')}
        </select>
        <select class="form-input-sm" onchange="venueWeekendTrendMonths=parseInt(this.value);renderVenueAchieveWeekend()">
          <option value="3" ${venueWeekendTrendMonths===3?'selected':''}>3ヶ月</option>
          <option value="6" ${venueWeekendTrendMonths===6?'selected':''}>6ヶ月</option>
          <option value="12" ${venueWeekendTrendMonths===12?'selected':''}>12ヶ月</option>
        </select>
      ` : ''}
    </div>`;

  let chartHtml = '';
  let chartTitle = '';
  let summaryHtml = '';

  if (venueWeekendChartMode === 'by_weekend') {
    const sites = (weAchieve[venueWeekendSelectedSat] || {}).sites || [];
    const [, m, d] = (venueWeekendSelectedSat || '----').split('-');
    chartTitle = venueWeekendSelectedSat
      ? `${parseInt(m)}/${parseInt(d)}(土) 現場別達成率`
      : '週末を選択してください';
    if (sites.length) {
      const totalBudget = sites.reduce((s, x) => s + (Number(x.budget)||0), 0);
      const totalActual = sites.reduce((s, x) => s + (Number(x.actual)||0), 0);
      const totalRate   = calcAchieve(totalActual, totalBudget);
      summaryHtml = `
        <div style="text-align:right">
          <div style="font-size:11px;color:var(--text-sub)">合計達成率</div>
          <div style="font-family:'Space Grotesk',monospace;font-size:26px;font-weight:700;color:${achieveColor(totalRate)};line-height:1.1">${totalRate!==null?totalRate+'%':'—'}</div>
          <div style="font-size:11px;color:var(--text-sub);margin-top:2px">目標 ${totalBudget.toLocaleString()} / 実績 ${totalActual.toLocaleString()}</div>
        </div>`;
      chartHtml = _vaVBarChart(sites.map(s => ({ label: s.name, budget: Number(s.budget)||0, actual: Number(s.actual)||0 })));
    } else {
      chartHtml = `<div style="color:var(--text-sub);font-size:13px;text-align:center;padding:20px 0">この週末にはデータがありません</div>`;
    }

  } else if (venueWeekendChartMode === 'by_month_sites') {
    // 月の全週末を現場ごとに合算して比較
    chartTitle = '月間 現場別合計達成率';
    const siteMap = {};
    weekends.forEach(({ sat }) => {
      ((weAchieve[sat] || {}).sites || []).forEach(s => {
        if (!siteMap[s.name]) siteMap[s.name] = { budget: 0, actual: 0 };
        siteMap[s.name].budget += Number(s.budget) || 0;
        siteMap[s.name].actual += Number(s.actual) || 0;
      });
    });
    const monthItems = Object.entries(siteMap)
      .map(([name, v]) => ({ label: name, budget: v.budget, actual: v.actual }))
      .sort((a, b) => b.actual - a.actual);
    if (monthItems.length) {
      const totalBudget = monthItems.reduce((s, x) => s + x.budget, 0);
      const totalActual = monthItems.reduce((s, x) => s + x.actual, 0);
      const totalRate   = calcAchieve(totalActual, totalBudget);
      summaryHtml = `
        <div style="text-align:right">
          <div style="font-size:11px;color:var(--text-sub)">月間合計達成率</div>
          <div style="font-family:'Space Grotesk',monospace;font-size:26px;font-weight:700;color:${achieveColor(totalRate)};line-height:1.1">${totalRate!==null?totalRate+'%':'—'}</div>
          <div style="font-size:11px;color:var(--text-sub);margin-top:2px">目標 ${totalBudget.toLocaleString()} / 実績 ${totalActual.toLocaleString()}</div>
        </div>`;
      chartHtml = _vaVBarChart(monthItems);
    } else {
      chartHtml = `<div style="color:var(--text-sub);font-size:13px;text-align:center;padding:20px 0">データがありません</div>`;
    }

  } else {
    // 指定現場の推移
    chartTitle = venueWeekendSelectedSite
      ? `「${venueWeekendSelectedSite}」 週末実績 過去${venueWeekendTrendMonths}ヶ月推移`
      : '現場を選択してください';
    if (venueWeekendSelectedSite) {
      const trend = getVenueWeekendSiteTrend(venueWeekendSelectedSite, venueWeekendTrendMonths);
      const totalBudget = trend.reduce((s, x) => s + x.budget, 0);
      const totalActual = trend.reduce((s, x) => s + x.actual, 0);
      const totalRate   = calcAchieve(totalActual, totalBudget);
      summaryHtml = `
        <div style="text-align:right">
          <div style="font-size:11px;color:var(--text-sub)">${venueWeekendTrendMonths}ヶ月合計達成率</div>
          <div style="font-family:'Space Grotesk',monospace;font-size:26px;font-weight:700;color:${achieveColor(totalRate)};line-height:1.1">${totalRate!==null?totalRate+'%':'—'}</div>
          <div style="font-size:11px;color:var(--text-sub);margin-top:2px">目標 ${totalBudget.toLocaleString()} / 実績 ${totalActual.toLocaleString()}</div>
        </div>`;
      chartHtml = _vaTrendChart(trend);
    } else {
      chartHtml = `<div style="color:var(--text-sub);font-size:13px;text-align:center;padding:20px 0">現場を選択してください</div>`;
    }
  }

  return `
    <div class="card fade-in">
      <div style="display:flex;align-items:flex-start;justify-content:space-between;flex-wrap:wrap;gap:12px;margin-bottom:14px">
        <div>
          <div style="font-size:12px;color:var(--text-sub);margin-bottom:8px">グラフ表示</div>
          ${modeToggle}
          <div style="font-size:13px;font-weight:600;margin-top:10px">${chartTitle}</div>
        </div>
        ${summaryHtml}
      </div>
      ${chartHtml}
    </div>`;
}

// ── SVGチャート: 月別推移（現場×過去6ヶ月）──
// trend: [{ month, label, budget, actual, rate }]
function _vaTrendChart(trend) {
  if (!trend || !trend.length) return '';
  const W = 520, H = 160;
  const n = trend.length;
  const maxBudget = Math.max(...trend.map(t => t.budget), 1);
  const barMaxH = 90;
  const step = (W - 30) / n;
  const barW = Math.min(48, step - 14);

  const bars = trend.map((t, i) => {
    const cx = 15 + step * i + step / 2;
    const x  = cx - barW / 2;
    const bh = t.budget > 0 ? (t.budget / maxBudget) * barMaxH : 6;
    const ah = t.budget > 0 ? Math.min(t.actual / t.budget, 1.3) * bh : 0;
    const color = achieveColor(t.rate);
    const budgetY = H - 30 - bh;
    const actualY = H - 30 - ah;
    // 月ラベル（短縮: "4月"）
    const shortLabel = t.label.replace(/\d+年/, '').replace('ヶ月', '').replace('月', '月');
    return `
      <rect x="${x}" y="${budgetY}" width="${barW}" height="${bh}" rx="3" fill="rgba(255,255,255,.09)"/>
      ${ah > 0 ? `<rect x="${x}" y="${actualY}" width="${barW}" height="${ah}" rx="3" fill="${color}" opacity=".85"/>` : ''}
      ${t.budget > 0 ? `<text x="${cx}" y="${budgetY - 3}" text-anchor="middle" font-size="9" fill="rgba(208,216,238,.38)">目標${t.budget}</text>` : ''}
      <text x="${cx}" y="${H - 14}" text-anchor="middle" font-size="10" fill="rgba(208,216,238,.75)">${shortLabel}</text>
      ${t.rate !== null
        ? `<text x="${cx}" y="${Math.min(actualY - 4, budgetY - 14)}" text-anchor="middle" font-size="10" font-weight="bold" fill="${color}">${t.rate}%</text>`
        : `<text x="${cx}" y="${budgetY - 14}" text-anchor="middle" font-size="10" fill="rgba(208,216,238,.4)">—</text>`}
      ${t.actual > 0 && ah > 13 ? `<text x="${cx}" y="${actualY + 11}" text-anchor="middle" font-size="9" fill="rgba(255,255,255,.8)">${t.actual}</text>` : ''}
      <text x="${cx}" y="${H - 4}" text-anchor="middle" font-size="9" fill="rgba(208,216,238,.45)">${t.actual > 0 && ah <= 13 ? t.actual.toLocaleString() : ''}</text>
    `;
  }).join('');

  // 実績ラインを折れ線で接続
  const linePoints = trend
    .map((t, i) => {
      if (!t.actual) return null;
      const cx = 15 + step * i + step / 2;
      const bh = t.budget > 0 ? (t.budget / maxBudget) * barMaxH : 6;
      const ah = t.budget > 0 ? Math.min(t.actual / t.budget, 1.3) * bh : 0;
      return `${cx},${H - 30 - ah}`;
    })
    .filter(Boolean);
  const polyline = linePoints.length >= 2
    ? `<polyline points="${linePoints.join(' ')}" fill="none" stroke="rgba(171,160,255,.5)" stroke-width="1.5" stroke-dasharray="4 2"/>`
    : '';

  return `<div class="va-chart-wrap">
    <svg width="100%" viewBox="0 0 ${W} ${H}" style="display:block;min-width:260px">
      ${bars}${polyline}
    </svg>
  </div>`;
}

// ── 保存関数 ──

// 平日: 編集開始
function wdStartEdit(site) {
  wdEditingSite = site;
  renderVenueAchieveWeekday();
}

// 平日: 編集キャンセル
function wdCancelEdit() {
  wdEditingSite = null;
  renderVenueAchieveWeekday();
}

// 平日: 現場カードを保存
function wdSaveEdit(site) {
  const g = id => parseFloat(document.getElementById(id)?.value) || 0;
  const items = {
    sy: {
      target: g('wd_sy_target'),
      w1b: g('wd_sy_w1b'), w1a: g('wd_sy_w1a'),
      w2b: g('wd_sy_w2b'), w2a: g('wd_sy_w2a'),
      w3b: g('wd_sy_w3b'), w3a: g('wd_sy_w3a'),
      w4b: g('wd_sy_w4b'), w4a: g('wd_sy_w4a'),
      w5b: g('wd_sy_w5b'), w5a: g('wd_sy_w5a'),
    },
    mnp:       { target: g('wd_mnp_t'),       actual: g('wd_mnp_a')       },
    shinki:    { target: g('wd_shinki_t'),     actual: g('wd_shinki_a')    },
    bb:        { target: g('wd_bb_t'),         actual: g('wd_bb_a')        },
    denki:     { target: g('wd_denki_t'),      actual: g('wd_denki_a')     },
    paypay:    { target: g('wd_paypay_t'),     actual: g('wd_paypay_a')    },
    mikomi:    { target: g('wd_mikomi_t'),     actual: g('wd_mikomi_a')    },
    selection: { target: g('wd_selection_t'),  actual: g('wd_selection_a') },
  };
  setVenueWeekdayItems(venueAchieveMonth, site, items);
  wdEditingSite = null;
  showToast(`${site}の平日データを保存しました`, 'success');
  renderVenueAchieveWeekday();
}

// 週末: 1週末分を保存（新規追加行も含む）
function venueAchieveSaveWeekend(sat) {
  const cur   = getVenueAchieve(venueAchieveMonth);
  const saved = (cur.weekends[sat] || {}).sites || [];
  const sites = [];

  saved.forEach((_, idx) => {
    const name   = document.getElementById(`va_we_name_${sat}_${idx}`)?.value?.trim();
    const budget = parseInt(document.getElementById(`va_we_b_${sat}_${idx}`)?.value) || 0;
    const actual = parseInt(document.getElementById(`va_we_a_${sat}_${idx}`)?.value) || 0;
    if (name) sites.push({ name, budget, actual });
  });

  // 追加行
  const newName   = document.getElementById(`va_we_new_name_${sat}`)?.value?.trim();
  const newBudget = parseInt(document.getElementById(`va_we_new_b_${sat}`)?.value) || 0;
  const newActual = parseInt(document.getElementById(`va_we_new_a_${sat}`)?.value) || 0;
  if (newName) sites.push({ name: newName, budget: newBudget, actual: newActual });

  cur.weekends[sat] = { sites };
  setVenueAchieve(venueAchieveMonth, cur);
  showToast(`${formatDate(sat)} 週末の達成率を保存しました`, 'success');
  renderVenueAchieveWeekend();
}

// 週末: 追加行だけを即時コミット
function venueAchieveAddWeekendSite(sat) {
  const newName = document.getElementById(`va_we_new_name_${sat}`)?.value?.trim();
  if (!newName) { showToast('現場名を入力してください', 'error'); return; }
  const newBudget = parseInt(document.getElementById(`va_we_new_b_${sat}`)?.value) || 0;
  const newActual = parseInt(document.getElementById(`va_we_new_a_${sat}`)?.value) || 0;

  const cur   = getVenueAchieve(venueAchieveMonth);
  const saved = (cur.weekends[sat] || {}).sites || [];
  // 既存行の入力値も保持して保存
  const sites = [];
  saved.forEach((_, idx) => {
    const name   = document.getElementById(`va_we_name_${sat}_${idx}`)?.value?.trim() || _.name;
    const budget = parseInt(document.getElementById(`va_we_b_${sat}_${idx}`)?.value) || Number(_.budget) || 0;
    const actual = parseInt(document.getElementById(`va_we_a_${sat}_${idx}`)?.value) || Number(_.actual) || 0;
    if (name) sites.push({ name, budget, actual });
  });
  sites.push({ name: newName, budget: newBudget, actual: newActual });

  cur.weekends[sat] = { sites };
  setVenueAchieve(venueAchieveMonth, cur);
  renderVenueAchieveWeekend();
}

// 週末: 現場1行を削除
function venueAchieveRemoveWeekendSite(sat, idx) {
  const cur   = getVenueAchieve(venueAchieveMonth);
  const sites = [...((cur.weekends[sat] || {}).sites || [])];
  sites.splice(idx, 1);
  cur.weekends[sat] = { sites };
  setVenueAchieve(venueAchieveMonth, cur);
  showToast('現場を削除しました', 'success');
  renderVenueAchieveWeekend();
}
