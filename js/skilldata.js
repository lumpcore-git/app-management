// ============================================================
//  skilldata.js  —  スキルシート定義（役職別）
//
//  編集方法:
//    各 text: '' の '' の中に項目名を入れてください（15文字前後）
//    カテゴリを分けたい場合は categories 配列にオブジェクトを追加してください
//
//  役職キー一覧:
//    catch          キャッチ        39項目
//    trainee_closer 見習いクローザー  32項目
//    closer         クローザー       55項目
//    event_closer   イベクロ         22項目
//    young_chief    ヤングチーフ      68項目
//    chief          チーフ           25項目
// ============================================================

const SKILL_TEMPLATES = {

  // ──────────────────────────────────────────
  //  キャッチ（39項目）
  // ──────────────────────────────────────────
  catch: {
    name: 'キャッチ',
    categories: [
      {
        id: 'catch_cat1', name: 'カテゴリ1',
        items: [
          { id: 'ct_01', text: '' },
          { id: 'ct_02', text: '' },
          { id: 'ct_03', text: '' },
          { id: 'ct_04', text: '' },
          { id: 'ct_05', text: '' },
          { id: 'ct_06', text: '' },
          { id: 'ct_07', text: '' },
          { id: 'ct_08', text: '' },
          { id: 'ct_09', text: '' },
          { id: 'ct_10', text: '' },
          { id: 'ct_11', text: '' },
          { id: 'ct_12', text: '' },
          { id: 'ct_13', text: '' },
          { id: 'ct_14', text: '' },
          { id: 'ct_15', text: '' },
          { id: 'ct_16', text: '' },
          { id: 'ct_17', text: '' },
          { id: 'ct_18', text: '' },
          { id: 'ct_19', text: '' },
          { id: 'ct_20', text: '' },
          { id: 'ct_21', text: '' },
          { id: 'ct_22', text: '' },
          { id: 'ct_23', text: '' },
          { id: 'ct_24', text: '' },
          { id: 'ct_25', text: '' },
          { id: 'ct_26', text: '' },
          { id: 'ct_27', text: '' },
          { id: 'ct_28', text: '' },
          { id: 'ct_29', text: '' },
          { id: 'ct_30', text: '' },
          { id: 'ct_31', text: '' },
          { id: 'ct_32', text: '' },
          { id: 'ct_33', text: '' },
          { id: 'ct_34', text: '' },
          { id: 'ct_35', text: '' },
          { id: 'ct_36', text: '' },
          { id: 'ct_37', text: '' },
          { id: 'ct_38', text: '' },
          { id: 'ct_39', text: '' },
        ]
      },
    ]
  },

  // ──────────────────────────────────────────
  //  見習いクローザー（32項目）
  // ──────────────────────────────────────────
  trainee_closer: {
    name: '見習いクローザー',
    categories: [
      {
        id: 'tc_cat1', name: 'カテゴリ1',
        items: [
          { id: 'tc_01', text: '' },
          { id: 'tc_02', text: '' },
          { id: 'tc_03', text: '' },
          { id: 'tc_04', text: '' },
          { id: 'tc_05', text: '' },
          { id: 'tc_06', text: '' },
          { id: 'tc_07', text: '' },
          { id: 'tc_08', text: '' },
          { id: 'tc_09', text: '' },
          { id: 'tc_10', text: '' },
          { id: 'tc_11', text: '' },
          { id: 'tc_12', text: '' },
          { id: 'tc_13', text: '' },
          { id: 'tc_14', text: '' },
          { id: 'tc_15', text: '' },
          { id: 'tc_16', text: '' },
          { id: 'tc_17', text: '' },
          { id: 'tc_18', text: '' },
          { id: 'tc_19', text: '' },
          { id: 'tc_20', text: '' },
          { id: 'tc_21', text: '' },
          { id: 'tc_22', text: '' },
          { id: 'tc_23', text: '' },
          { id: 'tc_24', text: '' },
          { id: 'tc_25', text: '' },
          { id: 'tc_26', text: '' },
          { id: 'tc_27', text: '' },
          { id: 'tc_28', text: '' },
          { id: 'tc_29', text: '' },
          { id: 'tc_30', text: '' },
          { id: 'tc_31', text: '' },
          { id: 'tc_32', text: '' },
        ]
      },
    ]
  },

  // ──────────────────────────────────────────
  //  クローザー（55項目）
  // ──────────────────────────────────────────
  closer: {
    name: 'クローザー',
    categories: [
      {
        id: 'cl_cat1', name: 'カテゴリ1',
        items: [
          { id: 'cl_01', text: '' },
          { id: 'cl_02', text: '' },
          { id: 'cl_03', text: '' },
          { id: 'cl_04', text: '' },
          { id: 'cl_05', text: '' },
          { id: 'cl_06', text: '' },
          { id: 'cl_07', text: '' },
          { id: 'cl_08', text: '' },
          { id: 'cl_09', text: '' },
          { id: 'cl_10', text: '' },
          { id: 'cl_11', text: '' },
          { id: 'cl_12', text: '' },
          { id: 'cl_13', text: '' },
          { id: 'cl_14', text: '' },
          { id: 'cl_15', text: '' },
          { id: 'cl_16', text: '' },
          { id: 'cl_17', text: '' },
          { id: 'cl_18', text: '' },
          { id: 'cl_19', text: '' },
          { id: 'cl_20', text: '' },
          { id: 'cl_21', text: '' },
          { id: 'cl_22', text: '' },
          { id: 'cl_23', text: '' },
          { id: 'cl_24', text: '' },
          { id: 'cl_25', text: '' },
          { id: 'cl_26', text: '' },
          { id: 'cl_27', text: '' },
          { id: 'cl_28', text: '' },
          { id: 'cl_29', text: '' },
          { id: 'cl_30', text: '' },
          { id: 'cl_31', text: '' },
          { id: 'cl_32', text: '' },
          { id: 'cl_33', text: '' },
          { id: 'cl_34', text: '' },
          { id: 'cl_35', text: '' },
          { id: 'cl_36', text: '' },
          { id: 'cl_37', text: '' },
          { id: 'cl_38', text: '' },
          { id: 'cl_39', text: '' },
          { id: 'cl_40', text: '' },
          { id: 'cl_41', text: '' },
          { id: 'cl_42', text: '' },
          { id: 'cl_43', text: '' },
          { id: 'cl_44', text: '' },
          { id: 'cl_45', text: '' },
          { id: 'cl_46', text: '' },
          { id: 'cl_47', text: '' },
          { id: 'cl_48', text: '' },
          { id: 'cl_49', text: '' },
          { id: 'cl_50', text: '' },
          { id: 'cl_51', text: '' },
          { id: 'cl_52', text: '' },
          { id: 'cl_53', text: '' },
          { id: 'cl_54', text: '' },
          { id: 'cl_55', text: '' },
        ]
      },
    ]
  },

  // ──────────────────────────────────────────
  //  イベクロ（22項目）
  // ──────────────────────────────────────────
  event_closer: {
    name: 'イベクロ',
    categories: [
      {
        id: 'ec_cat1', name: 'カテゴリ1',
        items: [
          { id: 'ec_01', text: '' },
          { id: 'ec_02', text: '' },
          { id: 'ec_03', text: '' },
          { id: 'ec_04', text: '' },
          { id: 'ec_05', text: '' },
          { id: 'ec_06', text: '' },
          { id: 'ec_07', text: '' },
          { id: 'ec_08', text: '' },
          { id: 'ec_09', text: '' },
          { id: 'ec_10', text: '' },
          { id: 'ec_11', text: '' },
          { id: 'ec_12', text: '' },
          { id: 'ec_13', text: '' },
          { id: 'ec_14', text: '' },
          { id: 'ec_15', text: '' },
          { id: 'ec_16', text: '' },
          { id: 'ec_17', text: '' },
          { id: 'ec_18', text: '' },
          { id: 'ec_19', text: '' },
          { id: 'ec_20', text: '' },
          { id: 'ec_21', text: '' },
          { id: 'ec_22', text: '' },
        ]
      },
    ]
  },

  // ──────────────────────────────────────────
  //  ヤングチーフ（68項目）
  // ──────────────────────────────────────────
  young_chief: {
    name: 'ヤングチーフ',
    categories: [
      {
        id: 'yc_cat1', name: 'カテゴリ1',
        items: [
          { id: 'yc_01', text: '' },
          { id: 'yc_02', text: '' },
          { id: 'yc_03', text: '' },
          { id: 'yc_04', text: '' },
          { id: 'yc_05', text: '' },
          { id: 'yc_06', text: '' },
          { id: 'yc_07', text: '' },
          { id: 'yc_08', text: '' },
          { id: 'yc_09', text: '' },
          { id: 'yc_10', text: '' },
          { id: 'yc_11', text: '' },
          { id: 'yc_12', text: '' },
          { id: 'yc_13', text: '' },
          { id: 'yc_14', text: '' },
          { id: 'yc_15', text: '' },
          { id: 'yc_16', text: '' },
          { id: 'yc_17', text: '' },
          { id: 'yc_18', text: '' },
          { id: 'yc_19', text: '' },
          { id: 'yc_20', text: '' },
          { id: 'yc_21', text: '' },
          { id: 'yc_22', text: '' },
          { id: 'yc_23', text: '' },
          { id: 'yc_24', text: '' },
          { id: 'yc_25', text: '' },
          { id: 'yc_26', text: '' },
          { id: 'yc_27', text: '' },
          { id: 'yc_28', text: '' },
          { id: 'yc_29', text: '' },
          { id: 'yc_30', text: '' },
          { id: 'yc_31', text: '' },
          { id: 'yc_32', text: '' },
          { id: 'yc_33', text: '' },
          { id: 'yc_34', text: '' },
          { id: 'yc_35', text: '' },
          { id: 'yc_36', text: '' },
          { id: 'yc_37', text: '' },
          { id: 'yc_38', text: '' },
          { id: 'yc_39', text: '' },
          { id: 'yc_40', text: '' },
          { id: 'yc_41', text: '' },
          { id: 'yc_42', text: '' },
          { id: 'yc_43', text: '' },
          { id: 'yc_44', text: '' },
          { id: 'yc_45', text: '' },
          { id: 'yc_46', text: '' },
          { id: 'yc_47', text: '' },
          { id: 'yc_48', text: '' },
          { id: 'yc_49', text: '' },
          { id: 'yc_50', text: '' },
          { id: 'yc_51', text: '' },
          { id: 'yc_52', text: '' },
          { id: 'yc_53', text: '' },
          { id: 'yc_54', text: '' },
          { id: 'yc_55', text: '' },
          { id: 'yc_56', text: '' },
          { id: 'yc_57', text: '' },
          { id: 'yc_58', text: '' },
          { id: 'yc_59', text: '' },
          { id: 'yc_60', text: '' },
          { id: 'yc_61', text: '' },
          { id: 'yc_62', text: '' },
          { id: 'yc_63', text: '' },
          { id: 'yc_64', text: '' },
          { id: 'yc_65', text: '' },
          { id: 'yc_66', text: '' },
          { id: 'yc_67', text: '' },
          { id: 'yc_68', text: '' },
        ]
      },
    ]
  },

  // ──────────────────────────────────────────
  //  チーフ（25項目）
  // ──────────────────────────────────────────
  chief: {
    name: 'チーフ',
    categories: [
      {
        id: 'ch_cat1', name: 'カテゴリ1',
        items: [
          { id: 'ch_01', text: '' },
          { id: 'ch_02', text: '' },
          { id: 'ch_03', text: '' },
          { id: 'ch_04', text: '' },
          { id: 'ch_05', text: '' },
          { id: 'ch_06', text: '' },
          { id: 'ch_07', text: '' },
          { id: 'ch_08', text: '' },
          { id: 'ch_09', text: '' },
          { id: 'ch_10', text: '' },
          { id: 'ch_11', text: '' },
          { id: 'ch_12', text: '' },
          { id: 'ch_13', text: '' },
          { id: 'ch_14', text: '' },
          { id: 'ch_15', text: '' },
          { id: 'ch_16', text: '' },
          { id: 'ch_17', text: '' },
          { id: 'ch_18', text: '' },
          { id: 'ch_19', text: '' },
          { id: 'ch_20', text: '' },
          { id: 'ch_21', text: '' },
          { id: 'ch_22', text: '' },
          { id: 'ch_23', text: '' },
          { id: 'ch_24', text: '' },
          { id: 'ch_25', text: '' },
        ]
      },
    ]
  },

};
