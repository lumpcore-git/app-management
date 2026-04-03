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

// ─── INIT ───
window.addEventListener('DOMContentLoaded', () => {
  initData();
  CU = requireAuth();
  if (!CU) return;

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
}

// ─── SIDEBAR ───
function renderSidebar() {
  const level = roleLevel(CU.role);
  const hasReport = !!CU.reportType;
  const canSeeTeam = (level >= 2 && CU.dept === 'mobile') || level >= 5;
  const canSetTargets = (level >= 4 && CU.dept === 'mobile') || level >= 5;
  const hash = location.hash.replace('#', '') || 'dashboard';
  const isShiftPage = hash === 'shifts-week' || hash === 'shifts-month' || hash === 'shifts-plan';

  if (isShiftPage) shiftMenuExpanded = true;

  const nav = [
    { id: 'dashboard', icon: '🏠', label: 'ダッシュボード', show: true },
    { id: 'report',    icon: '📝', label: '実績報告',       show: hasReport },
    { id: 'shifts',    icon: '🗓️', label: 'シフト',         show: true },
    { id: 'team',      icon: '👥', label: 'チーム実績',     show: canSeeTeam },
    { id: 'ranking',   icon: '🏆', label: 'ランキング',     show: canSeeTeam },
    { id: 'targets',   icon: '🎯', label: '目標設定',       show: canSetTargets },
    { id: 'talent',    icon: '📋', label: '人財カルテ',     show: level >= 4 },
    { id: 'members',   icon: '⚙️', label: 'メンバー管理',  show: level >= 5 },
  ];

  const items = nav.filter(n => n.show);
  document.getElementById('sidebar').innerHTML = `
    <div class="nav-section">メニュー</div>
    ${items.map(n => `
      ${n.id === 'shifts'
        ? `
          <div class="nav-item nav-item-parent" data-page="shifts" onclick="toggleShiftMenu()">
            <span class="icon">${n.icon}</span>
            <span>${n.label}</span>
            <span class="nav-caret ${shiftMenuExpanded ? 'open' : ''}">▾</span>
          </div>
          <div class="nav-submenu ${shiftMenuExpanded ? '' : 'hidden'}" id="shiftSubmenu">
            <div class="nav-subitem" data-page="shifts-week" onclick="navigate('shifts-week')">週次シフト</div>
            <div class="nav-subitem" data-page="shifts-month" onclick="navigate('shifts-month')">月次シフト</div>
            ${level >= 4 ? `<div class="nav-subitem nav-subitem-admin" data-page="shifts-plan" onclick="navigate('shifts-plan')">シフト作成</div>` : ''}
          </div>
        `
        : `
          <div class="nav-item" data-page="${n.id}" onclick="navigate('${n.id}')">
            <span class="icon">${n.icon}</span>
            <span>${n.label}</span>
          </div>
        `
      }
    `).join('')}
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

  document.querySelectorAll('.nav-item, .nav-subitem').forEach(el => {
    const page = el.dataset.page;
    const isShift = hash === 'shifts-week' || hash === 'shifts-month';
    const active = page === hash || (page === 'shifts' && isShift);
    el.classList.toggle('active', active);
  });

  const isShift = hash === 'shifts-week' || hash === 'shifts-month' || hash === 'shifts-plan';
  if (isShift) shiftMenuExpanded = true;
  syncShiftMenu();

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
    targets:   '目標設定',
    talent:    '人財カルテ',
    members:   'メンバー管理',
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
    targets:   renderTargets,
    talent:    renderTalent,
    members:   renderMembers,
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
  location.hash = page;
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
  const m = document.getElementById('modal');
  m.innerHTML = html;
  m.classList.remove('modal-wide');
  document.getElementById('modalOverlay').classList.remove('hidden');
}
function showWideModal(html) {
  showModal(html);
  document.getElementById('modal').classList.add('modal-wide');
}
function closeModal() {
  document.getElementById('modalOverlay').classList.add('hidden');
  document.getElementById('modal').classList.remove('modal-wide');
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

      <div class="form-group" style="margin-bottom:20px">
        <label class="form-label">日付</label>
        <input type="date" class="form-input" id="repDate" value="${todayStr()}" style="max-width:200px">
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
                <th>日付</th><th>合計PT</th><th>SBMNP</th><th>YMNP</th><th>Y→S</th>
                <th>SB新規</th><th>YM新規</th><th>光/AIR</th><th>メモ</th><th></th>
              </tr>
            </thead>
            <tbody>
              ${myReports.map(r => `
                <tr>
                  <td>${formatDate(r.date)}</td>
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

  const report = { userId: CU.id, date, memo, type: 'mobile' };
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

  const weeks = buildMonthMatrix(shiftMonthCursor);
  const calendarHtml = weeks.map(week => `
    <tr>
      ${week.map(day => {
        if (!day) return `<td class="month-cell is-empty"></td>`;
        const ds = dateToStr(day);
        const slot = selectedUser ? getShiftForUser(selectedUser.id, ds) : null;
        const isToday = ds === todayStr();
        const wk = day.getDay();
        const tone = getShiftDayTone(wk);
        const isOff = slot?.site === '休み';
        const c = slot && !isOff ? getSiteColor(slot.site) : null;
        const chipStyle = c
          ? `background:${c.bg};color:${c.text};border-color:${c.border}`
          : isOff
            ? 'background:rgba(122,130,153,.1);color:var(--text-sub);border-color:rgba(122,130,153,.2)'
            : 'background:transparent;color:var(--text-sub);border-color:var(--border)';
        return `
          <td class="month-cell ${isToday ? 'is-today' : ''}" style="${isToday ? '' : `background:${tone.cellBg};`}">
            <div class="month-day" style="color:${tone.textColor}">${day.getDate()}</div>
            <div class="shift-chip" style="${chipStyle}">${slot ? (isOff ? '休' : _shortSite(slot.site)) : '—'}</div>
            ${slot && !isOff && slot.start ? `<div class="month-time">${slot.start}〜</div>` : ''}
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

    <div class="card fade-in" style="display:flex;gap:12px;align-items:center;flex-wrap:wrap">
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
function renderMembers() {
  const users = getUsers();

  document.getElementById('main').innerHTML = `
    <div class="page-header fade-in">
      <div>
        <div class="page-title">メンバー管理</div>
        <div class="page-sub">ユーザーの追加・編集・削除（全${users.length}名）</div>
      </div>
      <button class="btn btn-primary" onclick="openAddMember()">＋ メンバー追加</button>
    </div>

    <div class="card fade-in">
      <div class="table-wrap">
        <table>
          <thead>
            <tr><th>名前</th><th>事業部</th><th>役職</th><th>操作</th></tr>
          </thead>
          <tbody>
            ${users.map(u => `
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
                  ${u.id !== CU.id ? `
                    <button class="btn btn-danger" style="font-size:12px;padding:6px 12px"
                      onclick="confirmDeleteMember('${u.id}')">削除</button>
                  ` : '<span style="font-size:11px;color:var(--text-sub)">(自分)</span>'}
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
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
let _talentSkillDraft = null; // スキルシート編集中のドラフト

// ─── 一覧ページ ───
function renderTalent() {
  const level = roleLevel(CU.role);
  const users = getUsers().filter(u =>
    talentFilterDept === 'all' ? true : u.dept === talentFilterDept
  );
  const deptFilters = [
    { key: 'all', label: 'すべて' },
    ...Object.entries(DEPTS).map(([k, v]) => ({ key: k, label: v.label })),
  ];

  document.getElementById('main').innerHTML = `
    <div class="page-header fade-in">
      <div>
        <div class="page-title">人財カルテ</div>
        <div class="page-sub">生産性指標 × ジョブ面談を中核にした1人1カード（${users.length}名）</div>
      </div>
      ${level >= 5 ? `<button class="btn btn-ghost" onclick="openSkillTemplateEditor()">📋 スキルシート設定</button>` : ''}
    </div>
    <div class="talent-filter-bar fade-in">
      ${deptFilters.map(f => `
        <button class="talent-filter-btn ${talentFilterDept === f.key ? 'active' : ''}"
          onclick="setTalentFilter('${f.key}')">${f.label}</button>
      `).join('')}
    </div>
    <div class="talent-grid fade-in">
      ${users.map(u => _tcCardHTML(u, level >= 4)).join('')}
    </div>
  `;
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
          ${card.joinMonth ? `<div class="tc-join">入社 ${card.joinMonth.replace('-', '年')}月</div>` : ''}
        </div>
        ${canEdit ? `<button class="btn btn-ghost" style="font-size:11px;padding:4px 10px;align-self:flex-start;flex-shrink:0"
          onclick="event.stopPropagation();openTalentCard('${user.id}')">詳細 →</button>` : ''}
      </div>
      <div class="tc-metrics">${scoreHTML}${skillHTML}</div>
      ${bodyHTML}
      <div class="tc-foot">${tags.join('')}<div class="tc-foot-gap"></div></div>
    </div>`;
}

// ─── 詳細/編集モーダル（タブ式） ───
function openTalentCard(userId, activeTab = 'basic') {
  const level = roleLevel(CU.role);
  const canEdit = level >= 4;
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
  const skillPanelHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px">
      <div>
        <div style="font-size:18px;font-weight:700;color:var(--green)">${skill.checked} / ${skill.total} 項目達成</div>
        <div style="font-size:12px;color:var(--text-sub);margin-top:2px">
          ${skill.total > 0 ? Math.round(skill.checked / skill.total * 100) : 0}% 完了
        </div>
      </div>
    </div>
    ${tmpl.categories.map(cat => `
      <div class="sk-cat">
        <div class="sk-cat-name">${cat.name}</div>
        ${cat.items.map(item => `
          <div class="sk-item">
            <input type="checkbox" class="sk-checkbox" id="sk_${item.id}" ${ev[item.id] ? 'checked' : ''}
              ${canEdit ? '' : 'disabled'} onchange="this.parentElement.querySelector('.sk-item-text').classList.toggle('ok',this.checked)">
            <label for="sk_${item.id}" class="sk-item-text ${ev[item.id] ? 'ok' : ''}">${item.text}</label>
          </div>`).join('')}
      </div>`).join('')}`;

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

  showWideModal(`
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
          ${canEdit ? `<input type="month" class="form-input" id="tc_joinMonth" value="${card.joinMonth || ''}">` : `<div style="font-size:13px">${card.joinMonth ? card.joinMonth.replace('-', '年') + '月' : '—'}</div>`}
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
        // モーダル内の写真を即時更新
        const wrap = document.getElementById('tmPhotoWrap');
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
  const wrap = document.getElementById('tmPhotoWrap');
  const user = getUserById(userId);
  if (wrap && user) {
    wrap.innerHTML = `<div class="tm-photo-av" style="background:${roleColor(user.role)}">${user.name[0]}</div>`;
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
  // スキルシート評価を保存
  const tmpl = getSkillTemplate();
  const evalObj = {};
  tmpl.categories.forEach(cat =>
    cat.items.forEach(item => {
      const el = document.getElementById('sk_' + item.id);
      evalObj[item.id] = el ? el.checked : false;
    })
  );
  setSkillEval(userId, evalObj);
  closeModal();
  showToast('カルテを保存しました');
  renderTalent();
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
