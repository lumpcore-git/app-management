// ─── AZURE ENTRA ID 移行メモ ───
// 現在: data.js の INITIAL_USERS に持つ pw フィールドと照合するシンプル認証
// 移行後:
//   - login() を Microsoft Authentication Library (MSAL.js) に置き換える
//     https://github.com/AzureAD/microsoft-authentication-library-for-js
//   - 社員は Microsoft 365 アカウントでシングルサインオン（パスワード管理不要）
//   - セッション管理は MSAL のトークンキャッシュに委譲
//   - pw フィールドは INITIAL_USERS から削除できる
//   - ユーザー識別は Azure AD の objectId または userPrincipalName を使う

// ─── ENTRA ID 認証（MSAL.js）設定 ───
// Azure Static Web AppsのFreeプランではサーバー側のカスタム認証(staticwebapp.config.jsonのauth設定)が
// Standardプラン限定のため使えない。追加課金なしで実現するため、ブラウザ側で直接Microsoftとやり取りする
// MSAL.js（js/auth.jsより先にCDNから読み込み済み）を使う。
const MSAL_CONFIG = {
  auth: {
    clientId: 'bdace26f-ef88-43d6-838f-078372fafa89',
    authority: 'https://login.microsoftonline.com/2d4a0f8f-5b57-4dd4-8599-05d3af407c85',
    redirectUri: location.origin + '/index.html',
  },
  cache: {
    cacheLocation: 'sessionStorage', // タブを閉じたらログアウトという既存の挙動に合わせる
  },
};
const msalInstance = (typeof msal !== 'undefined') ? new msal.PublicClientApplication(MSAL_CONFIG) : null;
const msalReady = msalInstance ? msalInstance.initialize() : Promise.resolve();

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
  if (msalInstance && msalInstance.getAllAccounts().length > 0) {
    msalInstance.logoutRedirect({ postLogoutRedirectUri: location.origin + '/index.html' });
    return; // logoutRedirect自体が遷移するのでlocation.hrefは不要
  }
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
// リダイレクト帰り、または既存のMSALセッションからMicrosoftアカウントを取得し、
// emailで紐付けてセッションを作成する
async function tryEntraIdLogin() {
  if (getSession()) return { ok: true }; // すでにセッションあり
  if (!msalInstance) return { ok: false, reason: 'unavailable' }; // MSAL.jsが読み込めない環境（ローカル等）では無視
  try {
    await msalReady;
    const result = await msalInstance.handleRedirectPromise();
    const account = result?.account || msalInstance.getAllAccounts()[0];
    if (!account) return { ok: false, reason: 'no_account' };
    msalInstance.setActiveAccount(account);
    const email = account.username; // userPrincipalName相当
    // 他の端末（メンバー管理）で追加されたemailを反映してから照合する。
    // これをせず端末ローカルの古いユーザー一覧で照合すると、後から追加されたメンバーが
    // 「一致するユーザーが見つからない」扱いになりログイン画面に戻り続けてしまう。
    await Store.syncFromCloud();
    const user = getUserByEmail(email);
    if (user) {
      sessionStorage.setItem(LS.session, JSON.stringify({ userId: user.id }));
      return { ok: true };
    }
    return { ok: false, reason: 'no_match', email };
  } catch (_) {
    // サインインのキャンセルなどは無視
    return { ok: false, reason: 'error' };
  }
}

// index.html の「Microsoftアカウントでログイン」ボタンから呼ぶ
function loginWithEntraId() {
  if (!msalInstance) return;
  msalReady.then(() => msalInstance.loginRedirect({ scopes: ['User.Read'] }));
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
