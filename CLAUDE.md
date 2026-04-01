# LUMP CORE アプリ — Claude向け作業ガイド

## プロジェクト概要
社内向けWebアプリ（Teamsの代替）。モバイル事業部を中心とした実績管理システム。
バックエンドなし・localStorageのみのプロトタイプ。将来的に Azure (Cosmos DB + Entra ID) 移行予定。

---

## ファイル構成

```
ランプコアアプリ/
├── index.html        ← ログイン画面
├── app.html          ← メインアプリ（SPA）
├── css/
│   ├── base.css      ← CSS変数・レイアウト・サイドバー・トップバー
│   └── components.css ← ボタン・カード・テーブル・モーダル・タブ・トースト
└── js/
    ├── data.js       ← データ定義・localStorage操作・ポイント計算
    ├── auth.js       ← ログイン・ログアウト・権限チェック
    └── app.js        ← 全ページのレンダリングロジック（SPA）
```

**読み込み順（必ず守る）:** `data.js` → `auth.js` → `app.js`

---

## データ構造

### ユーザー（localStorage: `lc_users`）
```javascript
{
  id: 'u1',
  name: '北村晃平',
  role: 'chief',          // ROLES のキー
  dept: 'mobile',         // DEPTS のキー
  reportType: 'mobile',   // 'mobile' | 'refa' | null
  jobTitle: 'IT / イベントCL', // 任意。あればROLESのlabelより優先表示
  pw: 'lamp1234'
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

### 目標（localStorage: `lc_targets`）
```javascript
// モバイル
{ userId, month: '2026-03', ptTarget: 50 }

// Refa
{ userId, month: '2026-03', amountTarget: 100000 }
```

### DATA_VERSION
現在: `3`。ユーザー構造を変えたら必ず上げること（マイグレーション自動実行）。

---

## 役職・権限

| role | label | level | 説明 |
|------|-------|-------|------|
| `admin` | 役員/管理者 | 5 | 全機能・全データアクセス |
| `chief` | チーフ | 4 | モバイル目標設定・チーム閲覧 |
| `event_closer` | イベントCL | 3 | チーム閲覧 |
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

| key | label | pt | 単位 |
|-----|-------|----|------|
| `sbmnp` | SBMNP | 5.0 | /件 |
| `ymnp` | YMNP | 3.0 | /件 |
| `y_to_s` | Y→S | 0.5 | /件 |
| `sb_shinki` | SB新規 | 1.0 | /件 |
| `ym_shinki` | YM新規 | 1.0 | /件 |
| `hikari_air` | 光新規/AIR | 3.0 | /件 |
| `hikari_change` | 光事業者変更 | 3.0 | /件 |
| `mikomi` | 見込み | 0.5 | /件 |
| `yoyaku_mikomi` | 予約番号発行済み見込み | 1.0 | /件 |
| `paypay_card` | PayPayカード | 0.2 | /件 |
| `denki` | 電気 | 0.5 | /件 |
| `selection` | セレクション | 3.0 | /5万円 |

---

## ページ構成（app.js のルーティング）

| hash | 関数 | 最低レベル |
|------|------|-----------|
| `#dashboard` | `renderDashboard()` | 1 |
| `#report` | `renderReportPage()` | reportType必須 |
| `#team` | `renderTeam()` | level≥2 かつ mobile部署、またはlevel≥5 |
| `#ranking` | `renderRanking()` | 同上 |
| `#targets` | `renderTargets()` | level≥4 かつ mobile、またはlevel≥5 |
| `#members` | `renderMembers()` | level≥5 のみ |

---

## デザインルール

- **カラーパレット:** CSS変数（`--accent: #4f7cff`, `--green: #3ddc97`, `--warn: #ffb347`, `--danger: #ff4f6a`）
- **フォント:** Noto Sans JP（日本語）/ Space Grotesk（数値・ロゴ）
- **テーマ:** ダークモード固定
- **アニメーション:** `.fade-in` クラスをページコンテンツに付与
- **モーダル:** `showModal(html)` / `closeModal()` を使う
- **トースト通知:** `showToast(msg, type)` — type は `'success'` | `'error'`

---

## よく使う関数（data.js）

```javascript
getUsers()                          // 全ユーザー取得
getUserById(id)                     // ID指定取得
getUserDisplayRole(user)            // 表示用役職名（jobTitle優先）
getReports()                        // 全レポート取得
getUserReportsForMonth(userId, month) // ユーザーの月別レポート
addReport(report)                   // レポート追加
calcPoints(report)                  // 1件のポイント計算
aggregateReports(reports)           // 複数レポートを集計（totalPt付き）
getAvailableMonths()                // 選択可能な月一覧（降順）
currentMonth()                      // 'YYYY-MM'
todayStr()                          // 'YYYY-MM-DD'
monthLabel(month)                   // '2026年3月'
formatMoney(n)                      // '28,000円'
```

---

## 注意事項

- **localStorageのキー:** `lc_users`, `lc_reports`, `lc_targets`, `lc_session`, `lc_version`
- **セッション管理:** sessionStorage（タブを閉じるとログアウト）
- **ユーザー追加・名前変更:** data.jsのINITIAL_USERSを変更 → DATA_VERSIONを上げる
- **新機能追加時:** 権限チェックを `route()` と `renderSidebar()` の両方に追加する
- **ランキング状態:** `rankMonth` と `rankItem` はモジュールレベル変数で管理

---

## 現在のユーザー数
- モバイル事業部: 19名（チーフ3・イベントCL5・クローザー6・キャッチ5）
- イベントプロモーション部: 6名（Refa営業4・わたあめ師2）
- 人財部: 6名（廣瀬さんはadminレベル）
- 役員: 4名
- **合計: 35名**（50名まで拡張予定）
