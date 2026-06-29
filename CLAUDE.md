# LUMP CORE アプリ — Claude向け作業ガイド

## プロジェクト概要
社内向けWebアプリ（Teamsの代替）。モバイル事業部を中心とした実績管理システム。
**現在はAzure本番環境で稼働中。** Azure Static Web Apps + Cosmos DB + Entra ID 構成。

**会社名の正しい表記:** `lumpcore`（lump + core）。`lampcore` は誤り。ドメインは `lumpcore.co.jp`。Azureリソース名に `lampcore` と誤記したものがあるが（lampcore-cosmos, lampcore-app, rg-lampcore）、動作上は問題なし。

---

## 現在の開発状況（2026年6月時点）

### 完了済み
- ✅ Azure Static Web Apps でホスティング（GitHub pushで自動デプロイ）
- ✅ Entra ID（Microsoft 365）ログイン追加（パスワードログインと並存）
- ✅ Cosmos DB 接続・読み書き動作確認済み
- ✅ Store.syncFromCloud() でアプリ起動時にCosmosDBからデータ同期
- ✅ Store.set/remove でデータ変更時にCosmosDBへバックグラウンド同期

### 進行中・残タスク
- 🔧 既存データのCosmosDB投入（地道に進める予定）
- 🔧 他メンバーへのEntra IDログイン展開（data.jsにemailフィールドを追加）
- 🔧 カスタムドメイン設定（lumpcore.co.jp）

### Azure構成
| リソース | 名前 | 備考 |
|---------|------|------|
| リソースグループ | rg-lumpcore | |
| Static Web Apps | lumpcore-app | URL: `https://delightful-pebble-06bc21400.7.azurestaticapps.net` |
| Cosmos DB | lampcore-cosmos（誤記） | DB名: `lumpcore-db` |
| GitHub リポジトリ | lumpcore-git/app-management | |

**重要:** APIは `.7.` 付きURLでのみ動作する。`.7.` なしURLではAPIが404になる。

### EntraIDログイン済みユーザー
現在 `t.hirose@lumpcore.co.jp`（廣瀬さん、u26）のみEntra IDログイン対応済み。
他メンバーはdata.jsの該当ユーザーに `email` フィールドを追加すれば対応可能。

---

## ファイル構成

```
ランプコアアプリ/
├── index.html        ← ログイン画面
├── app.html          ← メインアプリ（SPA）
├── css/
│   ├── base.css      ← CSS変数・レイアウト・サイドバー・トップバー
│   └── components.css ← ボタン・カード・テーブル・モーダル・タブ・トースト・シフト・人財カルテ
└── js/
    ├── data.js       ← データ定義・localStorage操作・ポイント計算・シフト・人財カルテ・スキル
    ├── auth.js       ← ログイン・ログアウト・権限チェック
    └── app.js        ← 全ページのレンダリングロジック（SPA）
```

**読み込み順（必ず守る）:** `data.js` → `auth.js` → `app.js`

> **data.js はAPIゲートウェイ相当として扱う。**
> app.js・auth.js から直接 `localStorage` / `sessionStorage` を触ることを禁止。
> データの読み書きは必ず data.js の関数または `Store` / `getTheme()` / `setTheme()` を経由すること。
> → Azure移行時は data.js と auth.js のみを差し替えれば済む設計を維持する。

---

## データ構造

### ユーザー（localStorage: `lc_users`）
```javascript
{
  id: 'u1',
  name: '北村晃平',
  role: 'chief',          // ROLES のキー
  dept: 'mobile',         // DEPTS のキー
  reportType: 'mobile',   // 'mobile' | 'refa' | null（報告なし）
  jobTitle: 'IT / イベントCL', // 任意。あればROLESのlabelより優先表示
  pw: 'lump1234'
}
```

### レポート（localStorage: `lc_reports`）
```javascript
// モバイル
{ id, userId, date, type: 'mobile', sbmnp, ymnp, y_to_s, sb_shinki,
  ym_shinki, hikari_air, hikari_change, mikomi, yoyaku_mikomi,
  paypay_card, denki, selection, memo, createdAt }

// Refa
{ id, userId, date, type: 'refa', productName, amount, memo, createdAt }
```

**注意:** レポートに `mnp` や `shinki` フィールドは存在しない。MNP系は `sbmnp`/`ymnp`、新規系は `sb_shinki`/`ym_shinki`。

### 目標（localStorage: `lc_targets`）
```javascript
// モバイル（setMobileTarget で保存）
{ userId, month: '2026-03', mnpTarget: 10, shinkiTarget: 5 }

// Refa（setRefaTarget で保存）
{ userId, month: '2026-03', amountTarget: 100000 }
```

### シフト（localStorage: `lc_shift_schedules`）
```javascript
// 日付ベース: { [userId]: { [dateStr: 'YYYY-MM-DD']: { site, start, end } } }
{ 'u1': { '2026-04-07': { site: 'テラスモール松戸', start: '10:00', end: '19:00' } } }
```

### 人財カルテ（localStorage: `lc_talent`）
```javascript
{ [userId]: { joinMonth, jobDescription, strengths, challenges,
  skills, lastInterviewDate, agreedRole, nextRoleCandidate, nextReviewDate,
  managerComment, careerHope, devActions, updatedAt } }
```

### スキル評価（localStorage: `lc_skill_eval`）
```javascript
{ [userId]: { [itemId]: true } }  // チェック済みアイテムのみ true
```

### DATA_VERSION
現在: `6`。ユーザー構造を変えたら必ず上げること（マイグレーション自動実行）。

---

## 役職・権限

| role | label（コード内） | level | 説明 |
|------|-------|-------|------|
| `admin` | 役員/管理者 | 5 | 全機能・全データアクセス |
| `chief` | チーフ | 4 | モバイル目標設定・チーム閲覧・シフト作成・人財カルテ |
| `event_closer` | イベントクローザー | 3 | チーム閲覧 |
| `closer` | クローザー | 2 | チーム閲覧 |
| `catch` | キャッチ | 1 | 自分のみ |
| `refa` | Refa営業 | 1 | 自分のみ（Refa報告） |
| `cotton_candy` | わたあめ師 | 1 | 報告なし |
| `hr_staff` | 人財部スタッフ | 1 | 報告なし |

## 事業部

| dept | label | 備考 |
|------|-------|------|
| `mobile` | モバイル事業部 | MNP・新規・ポイント制 |
| `event_promo` | イベントプロモーション部 | Refa営業 + わたあめ師 |
| `hr` | 人財部 | 廣瀬さん（admin）含む |
| `executive` | 役員 | 役員4名 |

---

## モバイル商材とポイント（PRODUCTS in data.js）

| key | label | pt | 単位 | group |
|-----|-------|----|------|-------|
| `sbmnp` | SBMNP | 5.0 | /件 | MNP系 |
| `ymnp` | YMNP | 3.0 | /件 | MNP系 |
| `y_to_s` | Y→S | 0.5 | /件 | MNP系 |
| `sb_shinki` | SB新規 | 1.0 | /件 | 新規系 |
| `ym_shinki` | YM新規 | 1.0 | /件 | 新規系 |
| `hikari_air` | 光新規/AIR | 3.0 | /件 | 新規系 |
| `hikari_change` | 光事業者変更 | 3.0 | /件 | 新規系 |
| `mikomi` | 見込み | 0.5 | /件 | その他 |
| `yoyaku_mikomi` | 予約番号発行済み見込み | 1.0 | /件 | その他 |
| `paypay_card` | PayPayカード | 0.2 | /件 | その他 |
| `denki` | 電気 | 0.5 | /件 | その他 |
| `selection` | セレクション | 3.0 | /5万円 | その他 |

---

## ページ構成（app.js のルーティング）

| hash | 関数 | 最低条件 |
|------|------|---------|
| `#dashboard` | `renderDashboard()` | level≥1（role別に4バリアント） |
| `#report` | `renderReportPage()` | reportType必須 |
| `#shifts-week` | `renderShifts()` | level≥1（全員） |
| `#shifts-month` | `renderShiftsMonth()` | level≥1（全員） |
| `#shifts-plan` | `renderShiftsPlan()` | level≥4 かつ mobile、またはlevel≥5 |
| `#team` | `renderTeam()` | level≥2 かつ mobile部署、またはlevel≥5 |
| `#ranking` | `renderRanking()` | 同上 |
| `#targets` | `renderTargets()` | level≥4 かつ mobile、またはlevel≥5 |
| `#talent` | `renderTalent()` | level≥4 |
| `#members` | `renderMembers()` | level≥5 のみ |

**注意:** サイドバーの「シフト」はサブメニュー親で、実際のhashは `shifts-week` / `shifts-month` / `shifts-plan`。

---

## デザインルール

- **カラーパレット（base.cssの実際の値）:**
  ```
  --bg: #202b4f
  --surface: #2d3a68
  --surface2: #3a4d86
  --border: #6a80ba
  --accent: #aba0ff    ← 紫系（旧#4f7cffではない）
  --accent2: #80f1ff   ← シアン
  --warn: #ffd9a8
  --danger: #ff95b3
  --text: #fbfcff
  --text-sub: #d0d8ee
  --green: #86f9d7
  --radius: 12px
  ```
- **フォント:** Noto Sans JP（日本語）/ Space Grotesk（数値・ロゴ）
- **テーマ:** ダークモード固定（背景はradial-gradient）
- **アニメーション:** `.fade-in` クラスをページコンテンツに付与
- **モーダル:** `showModal(html)` / `showWideModal(html)` / `closeModal()`
- **トースト通知:** `showToast(msg, type)` — type は `'success'` | `'error'`

---

## よく使う関数（data.js）

```javascript
// ユーザー
getUsers()                          // 全ユーザー取得
getUserById(id)                     // ID指定取得
getUserDisplayRole(user)            // 表示用役職名（jobTitle優先）

// レポート
getReports()                        // 全レポート取得
getUserReportsForMonth(userId, month) // ユーザーの月別レポート
addReport(report)                   // レポート追加
deleteReportById(reportId)          // レポート削除
calcPoints(report)                  // 1件のポイント計算
aggregateReports(reports)           // 複数レポートを集計（totalPt付き）

// 目標
getTargetForUser(userId, month)     // 目標取得
setMobileTarget(userId, month, mnpTarget, shinkiTarget) // モバイル目標保存
setRefaTarget(userId, month, amountTarget)              // Refa目標保存

// シフト
getShiftSites()                     // 現場一覧取得
getShiftSchedules()                 // 全シフト取得
getShiftForUser(userId, dateStr)    // 特定日のシフト取得
setShiftForUser(userId, dateStr, data) // シフト保存
getSiteColor(site)                  // 現場名→色オブジェクト {bg, text, border}
getWorkingDaysCount(userId, month)  // 月間出勤日数

// 人財カルテ
getTalentCard(userId)               // カルテ取得
setTalentCard(userId, data)         // カルテ保存（部分更新）
getPhoto(userId)                    // 顔写真（base64）取得
setPhoto(userId, dataUrl)           // 顔写真保存
getTalentProductivityTrend(userId, months?) // 生産性推移 [{month, value, label}]

// 人財カルテ表示ヘルパー（app.js に定義、data.js ではない）
calcTenure(joinMonth)               // 'YYYY-MM' → "X年Yヶ月" 形式の在籍期間文字列
updateTenureHint(inputId, hintId)   // 入社年月inputの変更時に在籍期間表示をリアルタイム更新

// スキルシート
getSkillTemplate()                  // テンプレート取得
getSkillEval(userId)                // ユーザーのチェック状況取得
setSkillEval(userId, evalObj)       // チェック状況保存
getSkillScore(userId)               // {checked, total} を返す

// 日付・表示
getAvailableMonths()                // 選択可能な月一覧（降順、直近4か月は常に含む）
currentMonth()                      // 'YYYY-MM'
todayStr()                          // 'YYYY-MM-DD'
monthLabel(month)                   // '2026年3月'
formatDate(dateStr)                 // '4/7'（M/D形式）
formatMoney(n)                      // '28,000円'
isJapaneseHoliday(date)             // 祝日判定（振替休日・春分・秋分含む）
isBusinessDay(date)                 // 営業日判定（土日祝除く）
getMondayOf(date)                   // その週の月曜日を返す
getWeekDates(monday)                // 月曜から7日のDate配列
```

---

## app.js のモジュールレベル変数（状態管理）

```javascript
let CU = null;               // 現在ログイン中のユーザー（Current User）
let rankMonth = '';          // ランキング選択月
let rankItem  = '';          // ランキング選択商材キー（''=総合PT）
let shiftWeekStart = null;   // 週次シフトの月曜日（Date）
let shiftMonthCursor = null; // 月次シフトの月初（Date）
let shiftMonthUserId = '';   // 月次シフト表示対象ユーザーID
let shiftMenuExpanded = false; // サイドバーのシフトサブメニュー開閉
let shiftPlanMonth = null;   // シフト作成ページの月（'YYYY-MM'）
let shiftPlanBrushSite = null; // シフト作成で選択中の入力ブラシ
let shiftPlanWeekdayOnly = false; // 土日非表示トグル

// 人財カルテ
let talentFilterDept = 'all';      // 事業部フィルタ
let talentSortKey = 'productivity'; // ソートキー: 'productivity'|'skill'|'interview_new'|'joined'
let talentQuery = '';              // 検索クエリ

// メンバー管理
let memberFilterDept = 'all';      // 事業部フィルタ
let memberQuery = '';              // 検索クエリ
```

---

## localStorage キー一覧（LS オブジェクト）

| キー | 内容 |
|------|------|
| `lc_users` | ユーザー配列 |
| `lc_reports` | レポート配列 |
| `lc_targets` | 目標配列 |
| `lc_shift_sites` | 現場名配列（文字列） |
| `lc_shift_schedules` | シフト { [userId]: { [dateStr]: {site,start,end} } } |
| `lc_venue_plans` | 現場コマ数 { [month]: { [venue]: {slots} } } |
| `lc_talent` | 人財カルテ { [userId]: {...} } |
| `lc_photos` | 顔写真 { [userId]: dataUrl } |
| `lc_skill_template` | スキルシート定義 |
| `lc_skill_eval` | スキル評価 { [userId]: { [itemId]: bool } } |
| `lc_session` | セッション（sessionStorageに保存） |
| `lc_version` | DATA_VERSION番号 |
| `lc_shift_plan_hidden` | シフト作成の非表示日付 { [month]: ['YYYY-MM-DD',...] } |
| `lc_theme` | テーマ設定 `'dark'` \| `'light'`（クライアントローカル — Azure移行後も保持） |

**注意:** `lc_theme` はUIのローカル設定のため、Azure移行後もlocalStorageのままで問題ない。`getTheme()` / `setTheme()` 経由でアクセスすること。

---

## シフト機能の仕様

- **現場（sites）:** デフォルトは4か所。管理者が追加・編集可能
- **色:** SITE_COLORS 配列（6色）をインデックス順に割り当て
- **「休み」:** site が `'休み'` の場合は色なし、出勤日数カウントから除外
- **週次シフト（#shifts-week）:** `shiftWeekStart`（月曜）を基準に7日表示
- **月次シフト（#shifts-month）:** カレンダー形式。`shiftMonthUserId` で対象ユーザー切替
- **シフト作成（#shifts-plan）:** level≥4 専用。月全体を縦＝日付・横＝メンバーのテーブルで一括管理

---

## 注意事項

- **セッション管理:** sessionStorage（タブを閉じるとログアウト）。Azure移行後はEntra IDトークンに置き換わる
- **ユーザー追加・名前変更（プロトタイプ期間のみ）:** data.jsのINITIAL_USERSを変更 → DATA_VERSIONを上げる。Azure移行後はEntra ID + Cosmos DBから取得するため、INITIAL_USERSは不要になる
- **DATA_VERSIONマイグレーションはlocalStorage専用:** Azure移行後は不要になる。スキーマ変更のために不必要にDATA_VERSIONを上げることは避ける
- **新機能追加時:** 権限チェックを `route()` と `renderSidebar()` の**両方**に追加する
- **写真のlocalStorage容量:** base64画像は大きい。35名全員に写真を入れると ~5MB上限に近づく
- **ダッシュボード分岐:** `renderDashboard()` はロール別に4つの関数を呼び分ける
  - level≥5 → `renderAdminDashboard()`
  - reportType==='mobile' → `renderMobileDashboard()`
  - reportType==='refa' → `renderRefaDashboard()`
  - その他 → `renderBasicDashboard()`
- **既知バグ:** adminDashboard の `totalMnp` / `totalShinki` 集計が `r.mnp`/`r.shinki` を参照しており常に0（実際のフィールドは `sbmnp`/`ymnp`/`sb_shinki`/`ym_shinki`）
- **検索の部分更新パターン（日本語IME対応）:** 検索inputを含むページで `oninput` から全体再描画すると、日本語変換途中でDOMが差し替わりIMEが壊れる。検索時は結果エリア（tbody / グリッド）のみを更新し、inputには触れない設計にすること。人財カルテの `_refreshTalentGrid()` / メンバー管理の `_refreshMemberTable()` が参考実装。新たに検索機能を追加する場合も同じパターンに従う。

---

## Azure移行に備えた設計ルール

### 移行時に差し替えるファイル
| ファイル | 現在 | Azure移行後 |
|----------|------|-------------|
| `data.js` の `Store` オブジェクト | localStorage | Cosmos DB SDK |
| `data.js` の各データ関数 | 同期 | async/await 化が必要 |
| `auth.js` | sessionStorage + パスワード認証 | MSAL.js + Entra ID SSO |

### 変わらないもの
- `app.js` のレンダリングロジック全体（UIはそのまま）
- `css/` のスタイル
- `lc_theme` のlocalStorage保存（UIローカル設定）

### 移行手順メモ（将来の作業者向け）
1. `Store.get` / `Store.set` / `Store.remove` を Cosmos DB SDK 呼び出しに書き換える
2. 各データ関数を `async/await` 化する（app.js 側も `await` が必要になる）
3. `LS` のキー名をCosmosDBのコンテナ名・ドキュメントIDに読み替える
4. `auth.js` を MSAL.js を使ったEntra ID認証に置き換える（`pw` フィールドは不要）
5. `INITIAL_USERS` を削除し、ユーザー情報はEntra ID + Cosmos DBから取得する
6. `DATA_VERSION` マイグレーション処理は削除する（DBスキーマ管理に移行）

### コーディング時の禁止事項
- `app.js` から直接 `localStorage.getItem/setItem` を呼ぶこと（`lc_theme` は例外）
- `app.js` から直接 `sessionStorage` を呼ぶこと
- データ操作のロジックを `app.js` に書くこと（必ず `data.js` に関数を作る）

---

## 現在のユーザー数（INITIAL_USERS の実態）
- モバイル事業部: 12名（チーフ3・イベントCL2・クローザー3・キャッチ4）
- イベントプロモーション部: 5名（Refa営業3・わたあめ師2）
- 人財部: 6名（廣瀬さんはadminレベル）
- 役員: 4名
- **合計: 27名**（IDは u1〜u35 だが欠番あり。削除済みユーザーのIDは再利用しない）
