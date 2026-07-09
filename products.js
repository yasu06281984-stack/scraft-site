/* ============================================================
   S-CRAFT 商品データ
   frp-craft.shop から取得した実データ（デモ用シード：約50点）
   本番は GitHub Actions クローラーで全商品(717点)を自動生成
   ------------------------------------------------------------
   schema:
   id     : frp-craft.shop の商品ID（/product/{id}）
   name   : 商品名
   code   : 品番
   price  : 最低販売価格（税込・円）
   models : 適合シャシーコード配列（"ALL"=汎用）
   cat    : カテゴリキー
   img    : 商品画像ファイル名（/data/frp-craft/product/ 配下）※クローラーで全件補完
   lead   : 納期区分（F/S/M/A/R/N/在庫）
   soldout: 売切れフラグ
   ============================================================ */

const SHOP_BASE = "https://www.frp-craft.shop";

/* 車種別グループ（現行サイトの24グループをそのまま踏襲） */
const MODELS = [
  { key:"ZD8ZN8", code:"ZD8/ZN8", name:"BRZ・GR86",             gid:18, gen:"2021-" },
  { key:"ZC6ZN6", code:"ZC6/ZN6", name:"BRZ・86",               gid:15, gen:"2012-2021" },
  { key:"VN",     code:"VN",      name:"レヴォーグ・レイバック",  gid:17, gen:"2020-" },
  { key:"VM",     code:"VM",      name:"レヴォーグ",             gid:2,  gen:"2014-2020" },
  { key:"VB",     code:"VB",      name:"WRX S4",                gid:19, gen:"2021-" },
  { key:"VA",     code:"VA",      name:"WRX STI / S4",          gid:1,  gen:"2014-2021" },
  { key:"GU",     code:"GU",      name:"インプレッサ・クロストレック", gid:24, gen:"2022-" },
  { key:"GKGT",   code:"GK/GT",   name:"インプレッサ",           gid:7,  gen:"2016-2023" },
  { key:"GJGP",   code:"GJ/GP",   name:"インプレッサ",           gid:8,  gen:"2011-2016" },
  { key:"GRGV",   code:"GR/GV/GH/GE", name:"インプレッサ",       gid:9,  gen:"2007-2014" },
  { key:"GDGG",   code:"GD/GG",   name:"インプレッサ",           gid:11, gen:"2000-2007" },
  { key:"GC",     code:"GC",      name:"インプレッサ",           gid:12, gen:"1992-2000" },
  { key:"BT",     code:"BT",      name:"レガシィ アウトバック",   gid:20, gen:"2021-" },
  { key:"BNBS",   code:"BN/BS",   name:"レガシィ",              gid:16, gen:"2014-2020" },
  { key:"BMBR",   code:"BM/BR",   name:"レガシィ",              gid:3,  gen:"2009-2014" },
  { key:"BLBP",   code:"BL/BP",   name:"レガシィ",              gid:4,  gen:"2003-2009" },
  { key:"BEBH",   code:"BE/BH",   name:"レガシィ",              gid:5,  gen:"1998-2003" },
  { key:"BD",     code:"BD",      name:"レガシィ",              gid:6,  gen:"1993-1998" },
  { key:"SL",     code:"SL",      name:"フォレスター",           gid:25, gen:"2024-" },
  { key:"SK",     code:"SK",      name:"フォレスター",           gid:13, gen:"2018-2024" },
  { key:"SJ",     code:"SJ",      name:"フォレスター",           gid:23, gen:"2012-2018" },
  { key:"SH",     code:"SH",      name:"フォレスター",           gid:22, gen:"2007-2012" },
  { key:"SF",     code:"SF",      name:"フォレスター",           gid:21, gen:"1997-2002" },
  { key:"YA",     code:"YA",      name:"エクシーガ",             gid:14, gen:"2008-2015" },
];

/* カテゴリ（現行ショップのカテゴリIDを保持） */
const CATS = [
  { key:"front",    label:"フロント（バンパー／リップ／グリル）", lid:28 },
  { key:"bonnet",   label:"ボンネット",                       lid:31 },
  { key:"fender",   label:"フェンダー",                       lid:32 },
  { key:"side",     label:"サイド",                           lid:34 },
  { key:"wing",     label:"リアウィング／スポイラー",           lid:38 },
  { key:"rear",     label:"リア（バンパー／アンダー）",         lid:36 },
  { key:"engine",   label:"エンジンルームパーツ",              lid:40 },
  { key:"meter",    label:"メーターフード／内装",              lid:41 },
  { key:"gtdry",    label:"GT-DRY（ドライカーボン）",          lid:47 },
  { key:"led",      label:"LED／電子部品",                    lid:23 },
  { key:"goods",    label:"グッズ／機能部品",                  lid:14 },
  { key:"chemical", label:"コーティング／ケミカル",             lid:15 },
  { key:"used",     label:"中古パーツ／委託販売",              lid:16 },
];

const PRODUCTS = [
  /* ---- フロント系 ---- */
  { id:906, name:"リップスポイラー", code:"20108", price:44000, models:["ZD8ZN8"], cat:"front", img:"20250115_c11a01.jpg", lead:"F" },
  { id:905, name:"リップスポイラー TYPE-II", code:"20109", price:49500, models:["VA"], cat:"front" },
  { id:725, name:"リップスポイラー", code:"20101", price:49500, models:["VN"], cat:"front", img:"20221118_d94cfb.jpg", lead:"S" },
  { id:920, name:"グランドエフェクトスポイラー Type-S", code:"20100", price:57200, models:["VN"], cat:"front" },
  { id:961, name:"グランドエフェクトスポイラー Type-SII", code:"20110", price:57200, models:["VA","VM"], cat:"front" },
  { id:798, name:"グランドエフェクトスポイラー Type-S", code:"20054", price:57200, models:["VA","VM"], cat:"front" },
  { id:860, name:"グランドエフェクトスポイラー Type-R", code:"20067", price:26400, models:["VA"], cat:"front" },
  { id:733, name:"カーボングリル", code:"20103", price:66000, models:["VA"], cat:"front" },
  { id:797, name:"ドライカーボンエンブレム", code:"20079", price:18700, models:["VA"], cat:"front" },

  /* ---- ボンネット ---- */
  { id:757, name:"ドライカーボンボンネット", code:"20037", price:217800, models:["ZC6ZN6"], cat:"bonnet" },
  { id:756, name:"ボンネット", code:"20075/20087", price:106700, models:["VA","VM"], cat:"bonnet" },

  /* ---- フェンダー ---- */
  { id:971, name:"フェンダートリム 前後セット", code:"20114", price:77000, models:["ZD8ZN8"], cat:"fender" },
  { id:972, name:"フェンダートリム", code:"20114", price:44000, models:["ZD8ZN8"], cat:"fender" },
  { id:766, name:"リヤフェンダートリム", code:"20078ZCZN", price:38500, models:["ZC6ZN6"], cat:"fender" },
  { id:765, name:"リヤフェンダートリム", code:"20078VAVM", price:38500, models:["VA","VM"], cat:"fender" },
  { id:764, name:"リヤフェンダートリム", code:"20078BMBR", price:38500, models:["BMBR"], cat:"fender" },

  /* ---- サイド ---- */
  { id:969, name:"サイドスポイラー", code:"20112", price:80300, models:["ZD8ZN8"], cat:"side" },

  /* ---- リアウィング／スポイラー ---- */
  { id:883, name:"リヤウイング", code:"20106", price:86900, models:["ZD8ZN8"], cat:"wing", img:"20231205_fe7894.jpg", lead:"M" },
  { id:854, name:"リヤウイング", code:"20097", price:57200, models:["VN"], cat:"wing" },
  { id:861, name:"オプション翼端板", code:"20102", price:29700, models:["VN"], cat:"wing" },
  { id:864, name:"オプションガーニーフラップ", code:"20105", price:26400, models:["ZD8ZN8","ZC6ZN6"], cat:"wing" },
  { id:863, name:"オプションボルテックスジェネレーター", code:"20104", price:41800, models:["ZD8ZN8","ZC6ZN6"], cat:"wing" },
  { id:848, name:"オプションウイング（GTウイング換装）", code:"20042", price:101200, models:["ZD8ZN8","ZC6ZN6"], cat:"wing" },

  /* ---- リア ---- */
  { id:822, name:"ディフューザー", code:"20098", price:39600, models:["VN"], cat:"rear" },
  { id:909, name:"リアアンダーオフセットプレート", code:"20111", price:4400, models:["VA"], cat:"rear" },
  { id:823, name:"マッドガード", code:"20099", price:42900, models:["VN"], cat:"rear" },
  { id:970, name:"マッドガード", code:"20113", price:46200, models:["ZD8ZN8"], cat:"rear" },

  /* ---- エンジンルーム ---- */
  { id:866, name:"EFP（エンジンルーム・フェンダー・プロテクター）", code:"20050/rj236", price:52800, models:["VA","VM"], cat:"engine" },

  /* ---- メーター／内装 ---- */
  { id:873, name:"ドライカーボン3連メーターパネル", code:"20074C", price:33000, models:["ZC6ZN6"], cat:"meter" },
  { id:871, name:"ドライカーボン追加メーターベース", code:"20089", price:36300, models:["ZC6ZN6"], cat:"meter" },
  { id:870, name:"追加メーターベース", code:"20073", price:22000, models:["VA","VM","GJGP","SJ"], cat:"meter" },
  { id:869, name:"追加メーターフード", code:"20023", price:38500, models:["GRGV"], cat:"meter" },
  { id:868, name:"追加メーターフード", code:"20048", price:38500, models:["GDGG"], cat:"meter" },

  /* ---- GT-DRY（ドライカーボンアクセサリー） ---- */
  { id:562, name:"バッテリーマイナス端子カバー", code:"agd-batter-terminal", price:2486, models:["VB","VN","VA","VM","ZD8ZN8","GU","GKGT","GJGP","SJ","SL","BNBS"], cat:"gtdry" },
  { id:663, name:"ブレーキフルードタンクキャップカバー", code:"brake-oil-cap", price:6160, models:["ALL"], cat:"gtdry" },
  { id:664, name:"クーラントリザーブタンクキャップカバー", code:"coolant-cap", price:8360, models:["ALL"], cat:"gtdry" },
  { id:665, name:"ウォッシャータンクキャップカバー", code:"window-washer-cap", price:9460, models:["ALL"], cat:"gtdry" },
  { id:608, name:"LEDウィンカー付きドアミラー", code:"axis-mirror-to-mtype", price:19118, models:["VN","VB"], cat:"gtdry" },
  { id:887, name:"キックガード用補修キット", code:"kickguard-repair-kit", price:1320, models:["ALL"], cat:"gtdry" },

  /* ---- LED／電子部品 ---- */
  { id:610, name:"アイスワイヤー【ICE FUSE】", code:"IFIWHE-", price:14960, models:["ALL"], cat:"led" },
  { id:601, name:"純正交換LEDインナーランプ", code:"1042123", price:2212, models:["ALL"], cat:"led" },
  { id:609, name:"6LED汎用フットランプ", code:"al-foot-lamp-6led", price:3930, models:["ALL"], cat:"led" },
  { id:575, name:"電源取り出しハーネス", code:"suaru-wrx-vb-harnes", price:2841, models:["ALL"], cat:"led" },

  /* ---- グッズ／機能部品 ---- */
  { id:747, name:"プライバシーナンバーカバー", code:"20002C/20002F", price:7700, models:["ALL"], cat:"goods" },
  { id:734, name:"ナンバーブラケット", code:"20057", price:3300, models:["ALL"], cat:"goods" },
  { id:393, name:"シートベルトパット（S-CRAFTロゴ入り）", code:"20093", price:3850, models:["ALL"], cat:"goods", stock:"在庫14セット" },
  { id:394, name:"S-CRAFT オリジナルTシャツ", code:"20079", price:3190, models:["ALL"], cat:"goods" },
  { id:611, name:"S-CRAFT缶 エンジンオイル 0W-30", code:"20107", price:11000, models:["ALL"], cat:"goods" },

  /* ---- ケミカル ---- */
  { id:452, name:"名もなきシリーズ 輝くコーティング剤 お試しボトル", code:"20095-10", price:1100, models:["ALL"], cat:"chemical" },
  { id:453, name:"名もなきシリーズ ガラス撥水剤 お試しボトル", code:"20095-11", price:1100, models:["ALL"], cat:"chemical" },

  /* ---- 中古／委託 ---- */
  { id:890, name:"【中古】VAB WRX STI S-CRAFTデモカー", code:"", price:6300000, models:["VA"], cat:"used", soldout:true },
];
