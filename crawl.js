const BASE = "https://www.frp-craft.shop";
const fs = await import("fs");

const MODELS = [
 { key:"ZD8ZN8", code:"ZD8/ZN8", name:"BRZ・GR86", gid:18, gen:"2021-" },
 { key:"ZC6ZN6", code:"ZC6/ZN6", name:"BRZ・86", gid:15, gen:"2012-2021" },
 { key:"VN", code:"VN", name:"レヴォーグ・レイバック", gid:17, gen:"2020-" },
 { key:"VM", code:"VM", name:"レヴォーグ", gid:2, gen:"2014-2020" },
 { key:"VB", code:"VB", name:"WRX S4", gid:19, gen:"2021-" },
 { key:"VA", code:"VA", name:"WRX STI / S4", gid:1, gen:"2014-2021" },
 { key:"GU", code:"GU", name:"インプレッサ・クロストレック", gid:24, gen:"2022-" },
 { key:"GKGT", code:"GK/GT", name:"インプレッサ", gid:7, gen:"2016-2023" },
 { key:"GJGP", code:"GJ/GP", name:"インプレッサ", gid:8, gen:"2011-2016" },
 { key:"GRGV", code:"GR/GV/GH/GE", name:"インプレッサ", gid:9, gen:"2007-2014" },
 { key:"GDGG", code:"GD/GG", name:"インプレッサ", gid:11, gen:"2000-2007" },
 { key:"GC", code:"GC", name:"インプレッサ", gid:12, gen:"1992-2000" },
 { key:"BT", code:"BT", name:"レガシィ アウトバック", gid:20, gen:"2021-" },
 { key:"BNBS", code:"BN/BS", name:"レガシィ", gid:16, gen:"2014-2020" },
 { key:"BMBR", code:"BM/BR", name:"レガシィ", gid:3, gen:"2009-2014" },
 { key:"BLBP", code:"BL/BP", name:"レガシィ", gid:4, gen:"2003-2009" },
 { key:"BEBH", code:"BE/BH", name:"レガシィ", gid:5, gen:"1998-2003" },
 { key:"BD", code:"BD", name:"レガシィ", gid:6, gen:"1993-1998" },
 { key:"SL", code:"SL", name:"フォレスター", gid:25, gen:"2024-" },
 { key:"SK", code:"SK", name:"フォレスター", gid:13, gen:"2018-2024" },
 { key:"SJ", code:"SJ", name:"フォレスター", gid:23, gen:"2012-2018" },
 { key:"SH", code:"SH", name:"フォレスター", gid:22, gen:"2007-2012" },
 { key:"SF", code:"SF", name:"フォレスター", gid:21, gen:"1997-2002" },
 { key:"YA", code:"YA", name:"エクシーガ", gid:14, gen:"2008-2015" }
];

const CATS = [
 { key:"front", label:"フロント（バンパー／リップ／グリル）", lid:28 },
 { key:"bonnet", label:"ボンネット", lid:31 },
 { key:"fender", label:"フェンダー", lid:32 },
 { key:"side", label:"サイド", lid:34 },
 { key:"wing", label:"リアウィング／スポイラー", lid:38 },
 { key:"rear", label:"リア（バンパー／アンダー）", lid:36 },
 { key:"engine", label:"エンジンルームパーツ", lid:40 },
 { key:"meter", label:"メーターフード／内装", lid:41 },
 { key:"gtdry", label:"GT-DRY（ドライカーボン）", lid:47 },
 { key:"led", label:"LED／電子部品", lid:23 },
 { key:"goods", label:"グッズ／機能部品", lid:14 },
 { key:"chemical", label:"コーティング／ケミカル", lid:15 },
 { key:"used", label:"中古パーツ／委託販売", lid:16 }
];

const LID2CAT = {};
[[["27","28","29","30"],"front"],[["31"],"bonnet"],[["32"],"fender"],
 [["33","34","35"],"side"],[["38"],"wing"],[["36","37","39"],"rear"],
 [["40"],"engine"],[["41","42"],"meter"],
 [["47","48","49","50","52","53","54","55","56","57","58","59","60","61","62","63","64","65","66"],"gtdry"],
 [["23"],"led"],[["14"],"goods"],[["15"],"chemical"],[["16"],"used"]]
.forEach(([ids,key])=>ids.forEach(i=>LID2CAT[i]=key));

const sleep = ms => new Promise(r=>setTimeout(r,ms));
async function get(url){
  for(let i=0;i<3;i++){
    try{
      const r = await fetch(url,{headers:{"User-Agent":"Mozilla/5.0 (products sync)"}});
      if(r.status===404) return null;
      if(r.ok) return await r.text();
    }catch(e){}
    await sleep(1500);
  }
  return null;
}

const fitment = {};
const allIds = new Set();
for(const m of MODELS){
  let page=1, total=Infinity, seen=0;
  while(seen < total){
    const html = await get(`${BASE}/product-group/${m.gid}?page=${page}`);
    if(!html) break;
    const t = html.match(/(\d+)件/); if(t) total = +t[1];
    const ids = [...new Set([...html.matchAll(/\/product\/(\d+)"/g)].map(x=>+x[1]))];
    if(!ids.length) break;
    for(const id of ids){ (fitment[id] ??= new Set()).add(m.key); allIds.add(id); }
    seen += 20; page++;
    await sleep(400);
  }
  console.log(`group ${m.code}: ok`);
}
{
  let page=1, total=Infinity, seen=0;
  while(seen<total){
    const html = await get(`${BASE}/product-list?page=${page}`);
    if(!html) break;
    const t = html.match(/(\d+)件/); if(t) total=+t[1];
    [...html.matchAll(/\/product\/(\d+)"/g)].forEach(x=>allIds.add(+x[1]));
    seen+=20; page++;
    await sleep(400);
  }
  console.log(`total unique products: ${allIds.size}`);
}

const products = [];
let n=0;
for(const id of [...allIds].sort((a,b)=>b-a)){
  const html = await get(`${BASE}/product/${id}`);
  n++;
  if(!html) continue;
  const og = k => (html.match(new RegExp(`og:${k}"\\s+content="([^"]*)"`))||[])[1] || "";
  let name = og("title");
  if(!name) continue;
  const h1 = (html.match(/<h1[^>]*>([^]*?)<\/h1>/)||[])[1] || "";
  const code = (h1.replace(/<[^>]+>/g,"").match(/\[([^\[\]]+)\]/)||[])[1] || "";
  name = name.replace(/\s*\[[^\[\]]+\]\s*$/,"").replace(/【S-CRAFT】/g,"").trim();
  const priceM = html.match(/販売価格[^0-9円]{0,120}?([\d,]{3,})\s*円/);
  const price = priceM ? +priceM[1].replace(/,/g,"") : 0;
  const img = (og("image").match(/product\/([^/"]+\.(?:jpg|jpeg|png|gif))/i)||[])[1] || "";
  const soldout = /SOLD\s*OUT/i.test(html) || undefined;
  let cat = "goods";
  {
    const cut = html.indexOf("車種別一覧");
    const head = html.slice(0, cut>0 ? cut : 20000);
    const crumbs = [...head.matchAll(/product-list\/(\d+)/g)].map(x=>x[1]);
    for(const lid of crumbs.reverse()){ if(LID2CAT[lid]){ cat=LID2CAT[lid]; break; } }
  }
