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
    ├── data.js       ← データ定義・localStorage操作・ポイント計算・シフト・人財カルテ・スキル・権限ガイド定義
    ├── auth.js       ← ログイン・ログアウト・権限チェック・代理ログイン
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
  role: 'chief',                // ROLES のキー
  dept: 'mobile',                // DEPTS のキー
  reportTypes: ['mobile'],       // 'mobile' | 'refa' | 'style' の配列（複数可）。空配列 [] = 報告なし
  jobTitle: 'IT / イベントCL',   // 任意。あればROLESのlabelより優先表示
  pw: 'lump1234'
}
```

**報告タイプは複数持てる（他事業部の応援などで役職・部署を問わず複数タイプ報告するメンバーがいるため）。** 常に `getUserReportTypes(user)`（data.js）経由で読むこと（`user.reportType`/`user.reportTypes`を直接読まない）。この関数は新形式の配列 `reportTypes` を優先し、まだ編集されていない旧データ（単一値の `reportType`）も自動的に配列化して返すため、移行のためのDATA_VERSION更新は不要。メンバー管理の追加・編集モーダルは複数選択可能なチェックボックスで `reportTypes` を書き込み、保存時に旧 `reportType` フィールドは削除する。
- ダッシュボード（`renderDashboard`）・実績報告ページ（`renderReportPage`）は、ユーザーが複数タイプを持つ場合はページ上部にタブ（`dashTypeTab`/`reportTypeTab`）を出し、タイプごとの画面を切り替えて表示する。
- チーム実績（`renderTeam`）・コミット設定（`renderTargets`）は、複数タイプ持ちのユーザーをタイプごとに1行ずつ展開して表示する（pt系と円系は単位が違うため合算しない）。行名の横に報告タイプの小さいチップ（`.report-type-chip`）が付く。
- ランキング（`renderRanking`）のモバイル/Refa/style各セクションは、事業部に関わらず該当の報告タイプを持つユーザー全員が対象（応援メンバーも表示される）。
- 人財カルテ・プロフィールの生産性トレンドは、複数タイプ持ちの場合は `reportTypes` の先頭（主担当）のタイプを基準に表示する。

### レポート（localStorage: `lc_reports`）
```javascript
// モバイル
{ id, userId, date, type: 'mobile', sbmnp, ymnp, y_to_s, sb_shinki,
  ym_shinki, hikari_air, hikari_change, mikomi, yoyaku_mikomi,
  paypay_card, denki, selection, memo, createdAt }

// Refa
{ id, userId, date, type: 'refa', productName, amount, memo, createdAt }

// style営業（Refaと同じMTGグループ商品。フィールド構成はRefaと同一）
{ id, userId, date, type: 'style', productName, amount, memo, createdAt }
```

**注意:** レポートに `mnp` や `shinki` フィールドは存在しない。MNP系は `sbmnp`/`ymnp`、新規系は `sb_shinki`/`ym_shinki`。

### 目標（localStorage: `lc_targets`）
```javascript
// モバイル（setMobileTarget で保存）
{ userId, month: '2026-03', mnpTarget: 10, shinkiTarget: 5 }

// Refa / style営業（どちらも setRefaTarget で保存。amountTargetを共有する汎用フィールド）
{ userId, month: '2026-03', amountTarget: 100000 }
```

### チーム（localStorage: `lc_teams`）
四半期ごとに社員同士が事業部・報告タイプを問わず自由に組む「チーム」。1人が複数チームに所属できる。
- チームの作成・削除・期間編集: admin(level5)専用
- チーム名変更・メンバー編成・リーダー設定: admin、またはそのチームの現リーダー（`leaderId===本人`）。app.js側の `canManage = isAdmin || team.leaderId === CU.id` 相当の判定でチェックする
- チーム共通目標: `memberIds`に含まれる本人、またはadmin
- メンバー個人目標（`memberGoals`/`memberGoalsByMonth`）: そのメンバー本人、またはadmin
- メンバー個人の数値目標（`memberTargets`/`memberTargetsByMonth`）: admin、そのチームのリーダー、またはそのメンバー本人（`canManage || u.id === CU.id`）
```javascript
{
  id: 'team1234567890',
  name: 'チームA',
  memberIds: ['u1', 'u5', 'u12'],       // 事業部・報告タイプ不問。1人が複数チームに所属可
  leaderId: null,                        // チームリーダー（memberIdsのいずれかのuserId、またはnull）
  goalText: '',                          // チーム共通目標（自由記述。定量・定性が混在してよい）
  memberGoals: { u1: '...', u5: '...' }, // メンバー個人目標（自由記述、キーはuserId）期間全体分
  memberGoalsByMonth: { u1: { '2026-07': '...' } }, // メンバー個人目標の月次版（キーはuserId→month）
  memberTargets: { u1: { type: 'pt', value: 20 } }, // メンバー個人の数値目標（キーはuserId。値は{type:'pt'|'amount', value}）期間全体分
  memberTargetsByMonth: { u1: { '2026-07': { type: 'pt', value: 8 } } }, // 数値目標の月次版（キーはuserId→month）
  createdAt, updatedAt,
}
```
個人目標・数値目標はいずれも「期間全体で1つの値（`memberGoals`/`memberTargets`）」と「月ごとの値（`memberGoalsByMonth`/`memberTargetsByMonth`）」を両方保持する。チーム詳細ページの月セレクト（モジュール変数`teamDetailMonth`。空文字=期間全体）でどちらを表示・編集するか切り替える。数値目標はチーム単位ではなく**メンバー個人単位**で持つ。`type:'pt'`ならそのメンバーのモバイル報告の`aggregateReports().totalPt`、`type:'amount'`ならRefa/style報告の`amount`合計を、`getMemberTargetActual(userId, type, month)`（`js/data.js`。`teamDetailMonth`が空のときは`currentMonth()`を渡す）で該当月分だけ集計する。`_upsertTeam()`はメンバー編成の変更で`leaderId`が`memberIds`から外れた場合、自動的にリーダー設定を解除する。

**期間全体表示での達成率:** 期間全体（`teamDetailMonth`が空）の数値目標の達成率は、そのメンバーに月次目標（`memberTargetsByMonth`）が1件以上設定されていれば、各月の実績・目標を単純合算した概算値を使う（`_teamMemberOverallProgress()`, `js/app.js`。月ごとの実績も小さく併記表示）。月次目標が1件も無い場合のみ、従来通り「期間全体の目標値 vs 当月実績」で代用する。

### チームの期間（localStorage: `lc_team_period`）
四半期などの「期間」は会社全体で共通の1つをadminが書き換える（チームごとの個別期間は持たない）。`getTeamPeriod()`/`setTeamPeriod(label)`で操作する自由記述の文字列（日付ではなく`'2026年7月〜9月'`のようなラベル）。
```javascript
{ label: '2026年7月〜9月' }
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
現在: `6`。`_migrate()`（data.js）は保存済みユーザーが1件もない初回起動時のみ `INITIAL_USERS` で初期化し、それ以降は**保存済みユーザーを一切上書きしない**（`INITIAL_USERS` にしかいないIDだけ追加）。これはメンバー管理UIでのロール・名前編集がAzure移行後の唯一の正となったための変更（旧仕様は「INITIAL_USERSを直接編集してDATA_VERSIONを上げる」だったが、それだと本番でadminが行った編集がバージョンアップ時に消えてしまうため廃止した）。ユーザー構造そのもの（フィールド追加など）を変える場合のみ `DATA_VERSION` を上げる。

---

## 役職・権限

| role | label（コード内） | level | 説明 |
|------|-------|-------|------|
| `admin` | 役員/管理者 | 5 | 全機能・全データアクセス |
| `chief` | チーフ | 4 | チーム閲覧・シフト作成・メンバーステータス・MBTI/スキル上長承認欄の編集（コミット設定は全ロール共通で本人分のみ編集可） |
| `event_closer` | イベントクローザー | 3 | チーム閲覧 |
| `closer` | クローザー | 2 | チーム閲覧 |
| `catch` | キャッチ | 1 | 自分のみ |
| `refa` | Refa営業 | 1 | 自分のみ（Refa報告） |
| `style_sales` | style営業 | 1 | 自分のみ（style報告。Refaと同じMTGグループ商品で、報告フォーム・集計ロジックはRefaと同一構造） |
| `cotton_candy` | わたあめ師 | 1 | 報告なし |
| `hr_staff` | 人財部スタッフ | 1 | 報告なし |

### ロール変更・権限の可視化（メンバー管理）
- **インラインロール変更:** メンバー管理（`#members`）の一覧テーブルで、役職セルが直接 `<select>` になっており、モーダルを開かずその場でロール変更できる（`quickChangeRole(userId, newRole)`, [app.js](js/app.js)）。従来の「編集」モーダル（`openEditMember`/`saveMember`）は名前・部署・報告タイプ等をまとめて変える場合に引き続き使う。
- **権限ガイド:** メンバー管理ページの「📖 権限ガイド」ボタン（`openPermissionGuide()`）で、9ロール全てについて「何ができるか」を一覧表示する閲覧専用モーダル。表示内容は `data.js` の `ROLE_CAPABILITY_RULES`（`minLevel`による足切り＋部署条件などの`note`）と `getRoleCapabilities(roleKey)`（app.js）で組み立てる。
  - **注意:** これは表示専用のドキュメント目的のデータであり、実際のアクセス制御は `route()` / `renderSidebar()` / `renderBottomNav()` / `renderMobileSubtabs()` 側の条件式が正。`ROLE_CAPABILITY_RULES` を変更しても実際の権限は変わらないので、権限ロジック自体を変える場合は必ずこの4箇所（重複している）を揃えて直すこと。

### 代理ログイン（admin専用）
- admin（level 5）はメンバー管理の各行にある「🎭 代理ログイン」ボタンから、確認モーダルを経て任意のユーザーとしてアプリを閲覧できる（自分自身の行は不可）。
- 実装は `auth.js` の `startImpersonation(targetUserId)` / `stopImpersonation()` / `getImpersonationInfo()`。セッション形式を `{ userId }` から代理ログイン中は `{ userId: 対象者, impersonatedBy: 実際のadmin }` に拡張している。開始・終了とも `location.href='app.html'` でフルリロードする方式（CUの部分差し替えより安全）。
- 多重代理（代理ログイン中にさらに代理ログイン）は `startImpersonation()` 内で拒否。「管理者に戻る」で一度復帰してから次の代理ログインを行う。
- Entra IDでログインするユーザーへの代理ログインも可能（`tryEntraIdLogin()` は既存セッションがあればno-opのため、代理ログイン中に自動SSOで上書きされることはない）。
- 代理ログイン中は画面上部に常時バナー表示（`#impersonationBar`, `renderImpersonationBar()`）。`body.impersonating` クラスと `.impersonation-bar` / `body.impersonating .topbar` のCSS（`css/base.css`）で、バナーとtopbarが両方sticky表示で正しく積み重なるようにしている。
- 代理ログイン中に到達できるページ・機能は、実際にセッションが切り替わった対象ユーザーの権限（`CU.role`）にそのまま従う（admin専用ページには当然入れない）。監査ログは実装していない（要件外）。

## 事業部

| dept | label | 備考 |
|------|-------|------|
| `mobile` | モバイル事業部 | MNP・新規・ポイント制 |
| `event_promo` | イベントプロモーション部 | Refa営業 + style営業 + わたあめ師 |
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
| `#team` | `renderTeam()` | level≥1（全員が閲覧可）。作成・削除・期間編集はlevel≥5限定。名前変更・メンバー編成・リーダー設定はadminまたはそのチームのリーダー |
| `#ranking` | `renderRanking()` | 同上 |
| `#targets` | `renderTargets()` | level≥1（全社員が閲覧可）。編集は本人のみ、またはadmin |
| `#talent` | `renderTalent()` | level≥4 |
| `#members` | `renderMembers()` | level≥5 のみ |

**注意:** サイドバーの「シフト」はサブメニュー親で、実際のhashは `shifts-week` / `shifts-month` / `shifts-plan`。
**注意:** `#talent`（`renderTalent()`）のメニュー表示名は「メンバーステータス」（旧称: 人財カルテ）。関数名・変数名（`renderTalent`, `talentFilterDept`, `_refreshTalentGrid` 等）や `lc_talent` ストレージキーは互換性のため `talent`/`人財カルテ` のまま変えていない。
**注意:** `#targets`（`renderTargets()`）は2026年9月に「目標設定」から「コミット設定」へ改修した。旧仕様はチーフ(mobile限定)・admin専用で、事業部を問わず全員が編集できる想定だったが、現在は全社員が対象（level不問・報告タイプを持つ人のみ行が表示される）。各行は本人 or adminのみ編集可（他人の行は数値のみ閲覧、admin以外は編集不可）。「全員まとめて保存」ボタンは廃止した（`saveAllTargets()`関数も削除済み。各行の個別「保存」ボタンのみ）。関数名・変数名（`renderTargets`, `saveOneTarget`, `canSetTargets`跡地 等）や `lc_targets` ストレージキー・`setMobileTarget`/`setRefaTarget`関数名は互換性のため変えていない。旧「目標①/目標②」の2カラム構成は「コミット」1カラム（数値入力＋単位）に統合し、`<table>`ではなく`.commit-list`/`.commit-row`（チーム実績の`.team-member-list`/`.team-member-row`と同じグリッド行パターン。モバイルは1列に積み上がる）でレンダリングする。各行の下にコミット達成率（`calcAchieve()`で当月実績÷コミットを算出。チーム実績の達成率表示と同ロジック）をプログレスバー付きで表示する。並び替え（表示順／達成率が高い順／達成率が低い順）をモジュール変数`targetsSortOrder`で保持し、ページ上部のセレクトで切り替え可能（PC・モバイル共通、未設定行は常に末尾）。

**注意:** `#team`（`renderTeam()`）は2026年9月に「四半期ごとの社員間チーム編成・目標管理」機能へ全面刷新した（旧仕様は個人成績をmobile部署でフィルタしたテーブルで`#ranking`と内容が重複していたため置き換え）。事業部・報告タイプを問わず全社員から自由にチームを編成でき、1人が複数チームに所属できる。モジュール変数 `selectedTeamId`（`profileUserId`と同じ「選択IDを保持して同一ルートを再描画する」パターン）が空なら `renderTeamList()`（チーム一覧カード）、セットされていれば `renderTeamDetail()`（メンバー一覧＋各人の目標）を表示する。チームには任意で「リーダー」（`leaderId`）を設定でき、リーダーは自チームに限りadminと同じ編集権限（チーム名変更・メンバー編成・リーダー再設定）を持つ（削除・期間編集は引き続きadmin専用）。数値目標はチーム単位ではなくメンバー個人単位（`memberTargets`）で持ち、admin・チームリーダー・本人が編集できる。個人目標・数値目標はいずれも「期間全体で1つの値」と「月ごとの値」を両方持ち、モジュール変数`teamDetailMonth`（メンバー表の上にある月セレクト）で表示・編集対象を切り替える。詳細は[データ構造](#データ構造)の「チーム」を参照。

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
- **アイコン:** 2026年8月にemoji表示から [Tabler Icons](https://tabler.io/icons)（outline、MITライセンス）へ全面移行した。CDNは使わず、`app.html`（メインアプリ用・約40種）と `index.html`（ログイン画面用・1種）それぞれの `<body>` 冒頭に `<svg style="display:none"><symbol id="ic-{slug}" viewBox="0 0 24 24">...</symbol>...</svg>` という非表示スプライトをインラインで埋め込んでいる。表示側は `js/app.js` の `icon(name, cls)` ヘルパー（`<svg class="ico"><use href="#ic-{name}"></use></svg>` を返す）を `${icon('home')}` のようにテンプレートリテラル内で呼ぶ。サイズ・色は `css/base.css` の `.ico` クラス（`width/height:1em`、`stroke:currentColor`）が周囲のテキストのfont-size/colorを継承する形で決まるため、絵文字だった頃と同じ感覚で配置できる。塗りつぶしアイコン（ステータスドットの `circle-filled` など）には `.ico-filled` を併用する。新しいアイコンを追加する場合は、tabler-icons公式リポジトリまたはjsdelivrミラーの outline SVG から中身の `<path>` 等だけを抜き出し、両HTMLのスプライトに `<symbol id="ic-{slug}">` を追加すること。`<option>` 要素の中やトースト（`showToast`はtextContentで挿入するためHTML不可）にはSVGを描画できないので、そうした箇所は絵文字を使わずプレーンテキストのみにしている。

---

## よく使う関数（data.js）

```javascript
// ユーザー
getUsers()                          // 全ユーザー取得
getUserById(id)                     // ID指定取得
getUserDisplayRole(user)            // 表示用役職名（jobTitle優先）
getUserReportTypes(user)            // 報告タイプ一覧を返す（複数可）。reportType/reportTypesを直接読まずこれ経由で

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
setRefaTarget(userId, month, amountTarget)              // Refa/style営業 共通の目標保存（amountTarget）

// チーム（四半期ごとの社員間チーム編成・目標。事業部・報告タイプ不問、1人が複数チーム所属可）
getTeams()                          // 全チーム取得
getTeamById(id)                     // ID指定取得
getTeamsForUser(userId)             // 指定ユーザーが所属する全チーム
createTeam(name, memberIds)         // チーム作成（admin専用）
updateTeamMeta(teamId, fields)      // チーム名・メンバー編成の変更（adminまたはチームリーダー。{name}や{memberIds}を渡す）
deleteTeam(teamId)                  // チーム削除（admin専用）
setTeamGoalText(teamId, text)       // チーム共通目標の保存（本人 or admin）
setTeamMemberGoal(teamId, userId, text) // メンバー個人目標の保存・期間全体分（本人 or admin）
setTeamMemberGoalForMonth(teamId, userId, month, text) // メンバー個人目標の保存・月次版（本人 or admin）
setTeamLeader(teamId, leaderId)     // チームリーダーの設定/解除（adminまたはチームリーダー。leaderId省略/nullで解除）
setTeamMemberTarget(teamId, userId, target) // メンバー個人の数値目標の設定/削除・期間全体分（adminまたはチームリーダー、本人。{type:'pt'|'amount', value}かnull）
setTeamMemberTargetForMonth(teamId, userId, month, target) // メンバー個人の数値目標の設定/削除・月次版（同上の権限。targetがnullで削除）
getMemberTargetActual(userId, type, month) // 個人の数値目標に対する実績を集計（month省略でcurrentMonth()）
getTeamPeriod()                     // 全社共通の期間ラベル取得 { label }
setTeamPeriod(label)                // 期間ラベルの保存（admin専用）

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

// 権限ガイド（表示専用。実際の判定はroute()/renderSidebar()側が正）
ROLE_CAPABILITY_RULES               // data.js: [{key, label, minLevel, note?}, ...]
getRoleCapabilities(roleKey)        // app.js: 指定ロールが該当するROLE_CAPABILITY_RULESを返す

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

## よく使う関数（auth.js）

```javascript
getSession()                        // { userId } または代理ログイン中は { userId, impersonatedBy } を返す
login(userId, password)             // {ok, error?}
logout()
requireAuth()                       // セッションからユーザー取得。未ログインならindex.htmlへリダイレクト
tryEntraIdLogin()                   // /.auth/me からEntra IDセッションを作成（既存セッションがあればno-op）
roleLevel(role)                     // ROLESのlevelを返す
startImpersonation(targetUserId)    // admin専用。代理ログイン開始。{ok, error?}
stopImpersonation()                 // 代理ログイン終了、元のadminセッションに復帰
getImpersonationInfo()              // 代理ログイン中なら {admin, target} を返す。通常セッションならnull
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

// 複数報告タイプ選択タブ（ダッシュボード・実績報告ページ共通）
let dashTypeTab = '';        // ダッシュボードで選択中の報告タイプ
let reportTypeTab = '';      // 実績報告ページで選択中の報告タイプ

// 人財カルテ
let talentFilterDept = 'all';      // 事業部フィルタ
let talentSortKey = 'productivity'; // ソートキー: 'productivity'|'skill'|'interview_new'|'joined'
let talentQuery = '';              // 検索クエリ

// メンバー管理
let memberFilterDept = 'all';      // 事業部フィルタ
let memberQuery = '';              // 検索クエリ

// チーム実績
let selectedTeamId = '';   // 選択中のチーム（空 = 一覧表示。profileUserIdと同じ「選択IDを保持して同一ルートを再描画」パターン）
let teamDetailMonth = '';  // チーム詳細の個人目標・数値目標の表示月（空 = 期間全体）

// コミット設定
let targetsSortOrder = ''; // '' = 表示順 / 'achieve_desc' / 'achieve_asc'
```

---

## localStorage キー一覧（LS オブジェクト）

| キー | 内容 |
|------|------|
| `lc_users` | ユーザー配列 |
| `lc_reports` | レポート配列 |
| `lc_targets` | 目標配列 |
| `lc_teams` | チーム配列（四半期ごとの社員間チーム編成・目標） |
| `lc_team_period` | チーム実績ページの全社共通期間ラベル `{ label }` |
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

- **セッション管理:** sessionStorage（タブを閉じるとログアウト）。パスワードログイン・Entra IDログインとも通常時は `{ userId }`。admin代理ログイン中のみ `{ userId, impersonatedBy }`（[代理ログイン](#代理ログインadmin専用)参照）
- **ユーザー追加・名前変更・ロール変更:** メンバー管理画面（`#members`）から行うのが唯一の正しい方法。data.jsのINITIAL_USERSを直接編集してDATA_VERSIONを上げる旧運用は廃止した（`_migrate()`が保存済みユーザーを上書きしなくなったため、コード側の変更は反映されない）
- **DATA_VERSIONマイグレーション:** 初回起動（保存済みユーザーが0件）の初期化にのみ使う。ユーザーデータの一括上書きには使わないこと
- **新機能追加時:** 権限チェックを `route()` と `renderSidebar()` の**両方**に追加する
- **CSS/JSのキャッシュバスティング:** `app.html`/`index.html` の `css/base.css`・`css/components.css`・`js/*.js` は `?v=N` というクエリ付きで読み込んでいる（例: `css/components.css?v=12`）。ビルドステップがなくハッシュ付きファイル名も無いため、これがブラウザ・CDNキャッシュを無効化する唯一の手段。**CSSまたはJSを編集したら、この`?v=N`を必ずインクリメントすること**（両ファイルの全箇所を揃える）。バージョンを上げ忘れると、実機のブラウザで修正が反映されず「直したはずなのに直っていない」という報告の原因になる（2026年9月に実際に複数回発生した）。
- **写真のlocalStorage容量:** base64画像は大きい。35名全員に写真を入れると ~5MB上限に近づく
- **ダッシュボード分岐:** `renderDashboard()` はロール別に4つの関数を呼び分ける
  - level≥5 → `renderAdminDashboard()`
  - reportType==='mobile' → `renderMobileDashboard()`
  - reportType==='refa' → `renderRefaDashboard()`
  - reportType==='style' → `renderStyleDashboard()`（Refaダッシュボードと同一構造）
  - その他 → `renderBasicDashboard()`
- **既知バグ:** adminDashboard の `totalMnp` / `totalShinki` 集計が `r.mnp`/`r.shinki` を参照しており常に0（実際のフィールドは `sbmnp`/`ymnp`/`sb_shinki`/`ym_shinki`）
- **検索の部分更新パターン（日本語IME対応）:** 検索inputを含むページで `oninput` から全体再描画すると、日本語変換途中でDOMが差し替わりIMEが壊れる。検索時は結果エリア（tbody / グリッド）のみを更新し、inputには触れない設計にすること。メンバーステータス（旧称・人財カルテ）の `_refreshTalentGrid()` / メンバー管理の `_refreshMemberTable()` が参考実装。新たに検索機能を追加する場合も同じパターンに従う。

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

**役職 `style_sales`（style営業）は2026年7月に追加。** 現時点でINITIAL_USERSに該当メンバーはまだいない（ロール定義のみ）。メンバー管理画面から役職「style営業」・報告方法「style営業（売上）」を選んで追加すれば利用可能。
