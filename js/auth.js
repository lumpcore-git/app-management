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
