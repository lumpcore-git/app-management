// ─── AZURE ENTRA ID 移行メモ ───
// 現在: data.js の INITIAL_USERS に持つ pw フィールドと照合するシンプル認証
// 移行後:
//   - login() を Microsoft Authentication Library (MSAL.js) に置き換える
//     https://github.com/AzureAD/microsoft-authentication-library-for-js
//   - 社員は Microsoft 365 アカウントでシングルサインオン（パスワード管理不要）
//   - セッション管理は MSAL のトークンキャッシュに委譲
//   - pw フィールドは INITIAL_USERS から削除できる
//   - ユーザー識別は Azure AD の objectId または userPrincipalName を使う

// ─── SESSION ───
function getSession() {
  const s = sessionStorage.getItem(LS.session);
  return s ? JSON.parse(s) : null;
}

function login(userId, password) {
  const users = getUsers();
  const user = users.find(u => u.id === userId);
  if (!user) return { ok: false, error: 'ユーザーが見つかりません' };
  if (user.pw !== password) return { ok: false, error: 'パスワードが違います' };
  sessionStorage.setItem(LS.session, JSON.stringify({ userId: user.id }));
  return { ok: true };
}

function logout() {
  sessionStorage.removeItem(LS.session);
  location.href = 'index.html';
}

// ─── 代理ログイン（admin専用） ───
// セッションは通常 { userId }。代理ログイン中は { userId: 対象者, impersonatedBy: 実際のadmin } になる。
function startImpersonation(targetUserId) {
  const session = getSession();
  if (!session) return { ok: false, error: 'ログインしていません' };
  if (session.impersonatedBy) return { ok: false, error: '既に代理ログイン中です。先に管理者へ戻ってください' };

  const actingUser = getUserById(session.userId);
  if (!actingUser || roleLevel(actingUser.role) < 5) return { ok: false, error: '権限がありません' };
  if (targetUserId === session.userId) return { ok: false, error: '自分自身は選択できません' };
  if (!getUserById(targetUserId)) return { ok: false, error: '対象ユーザーが見つかりません' };

  sessionStorage.setItem(LS.session, JSON.stringify({ userId: targetUserId, impersonatedBy: session.userId }));
  return { ok: true };
}

function stopImpersonation() {
  const session = getSession();
  if (!session?.impersonatedBy) return;
  sessionStorage.setItem(LS.session, JSON.stringify({ userId: session.impersonatedBy }));
}

// 代理ログイン中なら { admin, target } を返す。通常セッションなら null
function getImpersonationInfo() {
  const session = getSession();
  if (!session?.impersonatedBy) return null;
  const admin = getUserById(session.impersonatedBy);
  const target = getUserById(session.userId);
  if (!admin || !target) return null;
  return { admin, target };
}

// ─── AUTH GUARD ───
// Call this on app.html load — redirects to login if not authenticated
function requireAuth() {
  const session = getSession();
  if (!session) {
    location.href = 'index.html';
    return null;
  }
  const user = getUserById(session.userId);
  if (!user) {
    sessionStorage.removeItem(LS.session);
    location.href = 'index.html';
    return null;
  }
  return user;
}

// ─── ENTRA ID 認証 ───
// /.auth/me からログイン中のMicrosoftアカウントを取得し、emailで紐付けてセッションを作成する
async function tryEntraIdLogin() {
  if (getSession()) return; // すでにセッションあり
  try {
    const res = await fetch('/.auth/me');
    if (!res.ok) return;
    const data = await res.json();
    const principal = data.clientPrincipal;
    if (!principal) return;
    const email = principal.userDetails;
    const user = getUserByEmail(email);
    if (user) {
      sessionStorage.setItem(LS.session, JSON.stringify({ userId: user.id }));
    }
  } catch (_) {
    // ローカル環境など /.auth/me が存在しない場合は無視
  }
}

// ─── PERMISSION HELPERS ───
function roleLevel(role) {
  return ROLES[role]?.level || 0;
}
function canViewTeam(role) {
  return roleLevel(role) >= 2; // クローザー以上
}
function isChief(role) {
  return role === 'chief';
}
