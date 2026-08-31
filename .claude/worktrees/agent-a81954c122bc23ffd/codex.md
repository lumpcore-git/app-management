# LUMP CORE アプリ — Codex向け作業ガイド

このファイルは、Codex（開発アシスタント）が素早く安全に改修できるように、プロジェクトの要点だけをまとめた実務向けメモです。

## 1. プロジェクト概要
- 社内向けWebアプリ（Teams代替を想定）
- **バックエンドなし**、データは `localStorage` に保存
- 現状はプロトタイプ（将来的に Firebase 移行予定）

## 2. 主要ファイルと責務
- `index.html`: ログイン画面
- `app.html`: メインアプリ（SPA）
- `css/base.css`: 変数・レイアウト・共通UI
- `css/components.css`: ボタン/カード/モーダル等の部品
- `js/data.js`: データ定義・永続化・集計ロジック
- `js/auth.js`: ログイン/ログアウト/認可
- `js/app.js`: 画面描画とルーティング

### JS読み込み順（厳守）
1. `data.js`
2. `auth.js`
3. `app.js`

## 3. データ保存キー
- `lc_users`
- `lc_reports`
- `lc_targets`
- `lc_session`
- `lc_version`

## 4. 変更時の重要ルール
1. **ユーザー構造を変更したら `DATA_VERSION` を上げる**（マイグレーション前提）
2. 新規画面・機能は以下の2箇所で権限制御を更新
   - `route()`
   - `renderSidebar()`
3. 既存UIトーンを維持
   - ダークテーマ
   - CSS変数ベースの配色
   - 通知は `showToast()`、モーダルは `showModal()` を優先

## 5. 権限の目安
- `admin`（level 5）: 全機能
- `chief`（level 4）: 目標設定・チーム閲覧
- `event_closer` / `closer`（level 2-3）: チーム閲覧
- `catch` / `refa` 等（level 1）: 基本は自分のデータ中心

## 6. 実装時チェックリスト
- [ ] 既存の localStorage データ互換性を壊していない
- [ ] 権限漏れがない（表示/遷移の両方）
- [ ] 月次集計（`YYYY-MM`）を崩していない
- [ ] モバイル報告とRefa報告の分岐を壊していない
- [ ] UI崩れがない（PC/スマホ幅）

## 7. まず読むと効率が良い場所
1. `js/data.js`（データ構造と集計仕様の把握）
2. `js/app.js`（画面遷移と表示条件の把握）
3. `js/auth.js`（ログインと権限境界の把握）

## 8. 典型的な改修パターン
- **項目追加**: `data.js` のモデル/集計更新 → `app.js` の入力UI/表示更新
- **権限追加**: ロール定義更新 → `route()` と `renderSidebar()` の条件更新
- **見た目調整**: `base.css` / `components.css` に寄せて最小差分で修正

---
必要に応じて、`CLAUDE.md` の詳細仕様を正として参照してください。