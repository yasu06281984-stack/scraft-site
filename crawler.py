#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Lancers 公開案件クローラー (Pioneer Monkeys)
- ログイン不要の公開検索ページのみを対象
- 募集中プロジェクトを取得し、キーワードルールで 作れる/条件付き/作れない を判定
- ライバルの最低提案価格は「公開されている場合のみ」取得(非公開なら null)
- 結果を public/jobs.json に追記保存(URL重複はスキップ)
"""
import json, re, time, sys, os
from datetime import datetime, timezone, timedelta

import requests
from bs4 import BeautifulSoup

JST = timezone(timedelta(hours=9))
UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36"
HEADERS = {
    "User-Agent": UA,
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
    "Accept-Language": "ja,en-US;q=0.9,en;q=0.8",
    "Accept-Encoding": "gzip, deflate, br",
    "Referer": "https://www.lancers.jp/",
    "Upgrade-Insecure-Requests": "1",
    "Sec-Fetch-Dest": "document",
    "Sec-Fetch-Mode": "navigate",
    "Sec-Fetch-Site": "same-origin",
}
SESSION = requests.Session()
SESSION.headers.update(HEADERS)
DELAY = 3.0                # リクエスト間隔(秒) — 礼儀
MAX_DETAIL_PER_RUN = 15    # 1回の実行で詳細を見に行く新規案件の上限
JOBS_PATH = os.path.join(os.path.dirname(__file__), "public", "jobs.json")

# 巡回する公開検索ページ(クエリ付きが弾かれた場合はクエリなしで再試行)
CATEGORIES = [
    ("Web制作",      "https://www.lancers.jp/work/search/web?open=1&sort=started"),
    ("HP制作",       "https://www.lancers.jp/work/search/web/homepage?open=1&sort=started"),
    ("システム開発",  "https://www.lancers.jp/work/search/system?open=1&sort=started"),
]

# ---- 判定ルール ----
NG_WORDS = ["動画編集", "動画制作", "撮影", "ナレーション", "ライター", "記事作成", "記事執筆",
            "翻訳", "運用代行", "SNS運用", "インスタ運用", "買付", "BUYMA", "データ入力",
            "iOSアプリ", "Androidアプリ", "Swift", "Kotlin", "Flutter", "Unity",
            "デザインのみ", "デザイナー募集", "イラスト", "ロゴ作成", "漫画", "作曲", "テレアポ", "営業代行"]
COND_WORDS = ["Shopify", "EC-CUBE", "ECCUBE", "BASE構築", "STUDIO", "Wix", "ペライチ",
              "Pleasanter", "kintone", "Salesforce", "準委任", "常駐", "週3", "週4", "週5",
              "月額", "エンジニア募集", "長期契約", "チーム参画"]
OK_RULES = [  # (キーワード, 自信, 理由, 納期目安, 見積もり係数下限, 上限)
    (["WordPress", "ワードプレス", "WP "], 88, "WordPress構築・修正は得意領域(WP/PHP移行実績)", "5〜10営業日"),
    (["LP", "ランディングページ"], 85, "LP制作は得意領域(高速表示・SEO/AIO込み)", "3〜5営業日"),
    (["ホームページ", "HP制作", "コーポレートサイト", "Webサイト制作", "サイト制作", "サイトリニューアル"], 85, "サイト制作は得意領域", "5〜10営業日"),
    (["ECサイト", "ネットショップ", "通販サイト", "決済", "Stripe", "Amazon Pay"], 85, "EC・決済導入は実績あり(Stripe/AmazonPay)", "7〜15営業日"),
    (["予約", "顧客管理", "業務システム", "管理システム", "業務効率", "見積", "請求"], 85, "業務システム・予約系は主力領域", "10〜15営業日"),
    (["GAS", "スプレッドシート", "Google Apps Script", "VBA", "Excel", "エクセル", "自動化"], 82, "GAS/表計算の自動化は実績多数", "3〜7営業日"),
    (["スクレイピング", "クローラー", "データ収集", "API連携", "API開発"], 82, "スクレイピング・API連携は実績あり", "5〜10営業日"),
    (["OCR", "画像認識", "読み取り"], 85, "OCRは商用実績あり(Google Cloud Vision)", "7〜12営業日"),
    (["SEO", "AIO", "LLMO", "構造化データ", "高速化", "表示速度"], 88, "SEO/AIOは専門事業(ai-search.co.jp)", "5〜10営業日"),
    (["PHP", "改修", "修正", "バグ", "不具合", "エラー"], 78, "Web系の改修・デバッグは対応可", "3〜7営業日"),
]

def judge(title: str, desc: str):
    text = (title or "") + " " + (desc or "")
    for w in NG_WORDS:
        if w.lower() in text.lower():
            return ("ng", 90, f"対象外領域({w})", "")
    cond_hit = next((w for w in COND_WORDS if w.lower() in text.lower()), None)
    for words, conf, reason, delivery in OK_RULES:
        if any(w.lower() in text.lower() for w in words):
            if cond_hit:
                return ("conditional", max(50, conf - 25), f"{reason}だが要注意({cond_hit})", delivery)
            return ("ok", conf, reason, delivery)
    if cond_hit:
        return ("conditional", 50, f"要検討({cond_hit})", "")
    return ("conditional", 45, "キーワード判定不能。内容の確認推奨", "")

def suggest_price(budget_min, budget_max):
    """相場の70〜80%を提示(評価構築期間)"""
    if not budget_min and not budget_max:
        return ""
    lo = budget_min or budget_max
    hi = budget_max or budget_min
    a = int(lo * 0.7 // 1000 * 1000)
    b = int(hi * 0.8 // 1000 * 1000)
    if a <= 0 or b <= 0:
        return ""
    return f"¥{a:,}〜{b:,}"

YEN = re.compile(r"([0-9,]+)\s*円")

def parse_budget(text):
    m = re.findall(r"([0-9,]+)\s*円\s*[〜~～]\s*([0-9,]+)\s*円", text)
    if m:
        return int(m[0][0].replace(",", "")), int(m[0][1].replace(",", ""))
    m2 = YEN.findall(text)
    if m2:
        v = int(m2[0].replace(",", ""))
        return v, v
    return None, None

_warmed = False
def fetch(url):
    global _warmed
    if not _warmed:
        # まずトップページを訪問してCookieを取得(通常のブラウザ挙動に寄せる)
        try:
            SESSION.get("https://www.lancers.jp/", timeout=30)
            time.sleep(2)
        except Exception:
            pass
        _warmed = True
    r = SESSION.get(url, timeout=30)
    if r.status_code in (403, 405) and "?" in url:
        # クエリ付きURLが弾かれた場合はクエリなしで再試行
        time.sleep(DELAY)
        r = SESSION.get(url.split("?")[0], timeout=30)
    r.raise_for_status()
    return r.text

def crawl_listing(url):
    """検索結果ページから /work/detail/xxxx のリンクとタイトルを抽出"""
    html = fetch(url)
    soup = BeautifulSoup(html, "html.parser")
    found = {}
    for a in soup.select('a[href*="/work/detail/"]'):
        m = re.search(r"/work/detail/(\d+)", a.get("href", ""))
        if not m:
            continue
        jid = m.group(1)
        title = a.get_text(strip=True)
        if jid not in found or len(title) > len(found[jid]):
            found[jid] = title
    return found  # {id: title}

def crawl_detail(jid):
    """案件詳細(公開ページ)から予算・提案数・説明・競合情報を抽出"""
    url = f"https://www.lancers.jp/work/detail/{jid}"
    try:
        html = fetch(url)
    except Exception as e:
        print(f"  detail {jid}: fetch failed ({e})", file=sys.stderr)
        return None
    soup = BeautifulSoup(html, "html.parser")
    text = soup.get_text(" ", strip=True)

    # 募集終了は除外
    if "募集終了" in text[:4000] or "この仕事は募集を終了" in text:
        return None

    # タイトル: h1から取得し「の仕事」「[業種]」を除去
    title = ""
    h1 = soup.select_one("h1.c-heading--lv1") or soup.find("h1")
    if h1:
        sub = h1.find("span")
        if sub:
            sub.extract()
        title = h1.get_text(strip=True)
        title = re.sub(r"の仕事(・依頼)?$", "", title)

    # 説明文: 依頼の目的・背景ブロックを優先
    desc = ""
    for dd in soup.select("dd.c-definition-list__description"):
        t = dd.get_text(" ", strip=True)
        if len(t) > len(desc):
            desc = t
    if not desc:
        desc = text[:2500]
    desc = desc[:2500]

    # 予算: 説明文と本文冒頭から
    budget_min, budget_max = parse_budget(desc)
    if not budget_min:
        budget_min, budget_max = parse_budget(text[:6000])

    # 提案数: サマリーブロックの「提案数 N件」
    proposals = None
    mp = re.search(r"提案数?\s*[:：]?\s*(\d+)\s*件", text)
    if mp:
        proposals = int(mp.group(1))

    # 残り日数 or 募集期間
    deadline = ""
    md = re.search(r"(残り\s*\d+\s*日|あと\s*\d+\s*日|募集期間\s*\d+\s*日間?)", text)
    if md:
        deadline = md.group(1).replace(" ", "")

    # 競合情報: 提案者リストブロック(.detail-proposal-block)のみを見る
    #   ※金額はランサーズ仕様で非公開が基本。公開されていた場合のみ拾う
    lowest_bid = None
    rivals = ""
    block = soup.select_one(".detail-proposal-block")
    if block:
        btext = block.get_text(" ", strip=True)
        amounts = [int(x.replace(",", "")) for x in YEN.findall(btext)]
        amounts = [a for a in amounts if 1000 <= a <= 10_000_000]
        if amounts:
            lowest_bid = min(amounts)
        ranks = []
        for name, label in [("認定ランサー", "認定"), ("シルバー", "銀"), ("ブロンズ", "銅"), ("レギュラー", "レ")]:
            n = btext.count(name)
            if n:
                ranks.append(f"{label}{n}")
        if ranks:
            rivals = "/".join(ranks)

    return {"title": title, "budget_min": budget_min, "budget_max": budget_max,
            "proposals": proposals, "deadline": deadline, "lowest_bid": lowest_bid,
            "rivals": rivals, "desc": desc, "url": url}

def main():
    # 既存データ読み込み
    jobs = []
    if os.path.exists(JOBS_PATH):
        with open(JOBS_PATH, encoding="utf-8") as f:
            jobs = json.load(f)
    known = {j["url"] for j in jobs}

    # 一覧巡回
    candidates = {}
    for cat, url in CATEGORIES:
        print(f"[listing] {cat}: {url}")
        try:
            for jid, title in crawl_listing(url).items():
                candidates.setdefault(jid, (cat, title))
        except Exception as e:
            print(f"  listing failed: {e}", file=sys.stderr)
        time.sleep(DELAY)

    # 新規のみ詳細取得
    new_jobs = []
    now = datetime.now(JST)
    fetched = 0
    for jid, (cat, list_title) in candidates.items():
        url = f"https://www.lancers.jp/work/detail/{jid}"
        if url in known or fetched >= MAX_DETAIL_PER_RUN:
            continue
        fetched += 1
        print(f"[detail] {jid} {list_title[:30]}")
        d = crawl_detail(jid)
        time.sleep(DELAY)
        if not d:
            continue
        title = d["title"] or list_title
        verdict, conf, reason, delivery = judge(title, d["desc"])
        if d["proposals"] is not None and verdict == "ok":
            if d["proposals"] <= 10:
                conf = min(97, conf + 7)
                reason += f"。提案{d['proposals']}件と少なく狙い目"
            elif d["proposals"] >= 100:
                conf = max(40, conf - 15)
                reason += f"。提案{d['proposals']}件で激戦"
        new_jobs.append({
            "id": jid, "title": title[:80], "url": url, "category": cat,
            "verdict": verdict, "confidence": conf, "reason": reason[:90],
            "delivery": delivery,
            "price": suggest_price(d["budget_min"], d["budget_max"]),
            "budget_min": d["budget_min"], "budget_max": d["budget_max"],
            "proposals": d["proposals"], "lowest_bid": d["lowest_bid"],
            "rivals": d["rivals"],
            "deadline": d["deadline"],
            "crawled_at": now.isoformat(),
            "day": now.strftime("%Y/%m/%d"), "month": now.strftime("%Y年%-m月"),
            "time": now.strftime("%H:%M"),
        })

    if new_jobs:
        jobs = new_jobs + jobs
        jobs = jobs[:600]  # 上限
        os.makedirs(os.path.dirname(JOBS_PATH), exist_ok=True)
        with open(JOBS_PATH, "w", encoding="utf-8") as f:
            json.dump(jobs, f, ensure_ascii=False, indent=1)
        print(f"saved: +{len(new_jobs)} (total {len(jobs)})")
    else:
        print("no new jobs")

if __name__ == "__main__":
    main()
