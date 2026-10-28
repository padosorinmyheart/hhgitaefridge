import * as D from "./data.js";
import { readReceipt } from "./ocr.js";

/* =========================================================
   기본 데이터
   ========================================================= */
const ZONES = {
  fridge: { label: "냉장실", ic: "🥛" },
  veg: { label: "채소칸", ic: "🥬" },
  fruit: { label: "과일칸", ic: "🍎" },
  freezer: { label: "냉동실", ic: "❄️" },
  kimchi: { label: "김치냉장고", ic: "🫙" }
};
const ZORDER = ["fridge", "veg", "fruit", "freezer", "kimchi"];
// 냉장고 그림 위 칸 위치 (그림 크기 대비 %)
const HOT = {
  fridge: { l: 30.2, t: 8, w: 39.6, h: 28, top: true },
  veg: { l: 31, t: 39, w: 17.6, h: 4.6, drawer: true },
  fruit: { l: 51.3, t: 39, w: 17.6, h: 4.6, drawer: true },
  freezer: { l: 29.5, t: 64, w: 18.6, h: 27 },
  kimchi: { l: 51.8, t: 64, w: 18.6, h: 27 }
};
// 영수증 화면에서 끌어다 놓는 칸 (손가락으로 맞히기 쉽게 조금 넓게)
const DROP = {
  fridge: { l: 30, t: 8, w: 40, h: 27 },
  veg: { l: 30.5, t: 36.5, w: 18.5, h: 13 },
  fruit: { l: 51, t: 36.5, w: 18.5, h: 13 },
  freezer: { l: 29, t: 56, w: 19.5, h: 36 },
  kimchi: { l: 51.5, t: 56, w: 19.5, h: 36 }
};
// 냉장고 둘레에 서 있는 친구들 (외곽선만 오린 그림)
const SCENE_FRIENDS = `
  <img class="friend f1" src="img/ki-overall.png" alt="기훈">
  <img class="friend f2" src="img/tomato-c.png" alt="">
  <img class="friend f3" src="img/tae-stripe.png" alt="태훈">
  <img class="friend f4" src="img/carrot-c.png" alt="">
  <span class="sbub b1">신선하게 관리해요!</span>
  <span class="sbub b2">우리 냉장고를 채워요!</span>`;
// 이름 → [그림 파일 | 이모지, 기본 칸, 보관 일수]
const FOODS = [
  [/자몽청|자몽/, "grapefruit-tea", "fridge", 90], [/유자청|유자/, "yuja-tea", "fridge", 90],
  [/맛감자|감자볼|치즈볼/, "matgamja", "freezer", 60], [/떡갈비|함박/, "tteokgalbi", "freezer", 60],
  [/가자미/, "gajami", "freezer", 60], [/갈치/, "galchi", "freezer", 60], [/고등어/, "mackerel", "freezer", 60],
  [/돌돔/, "doldom", "freezer", 60], [/옥돔|도미/, "okdom", "freezer", 60], [/오징어|한치/, "squid", "freezer", 60],
  [/재첩/, "jaecheop", "fridge", 3], [/갈비탕/, "galbitang", "fridge", 3], [/추어탕/, "chueo", "fridge", 3],
  [/오이냉국|냉국/, "oi-naengguk", "fridge", 2], [/태국고추|쥐똥고추/, "thai-chili", "veg", 14],
  [/콩나물/, "kongnamul", "veg", 3], [/숙주/, "sukju", "veg", 3], [/시래기|우거지/, "siraegi", "freezer", 60],
  [/훈제오리|오리/, "duck", "fridge", 14], [/치킨텐더|텐더|너겟|치킨/, "chicken-tender", "freezer", 90],
  [/삼겹/, "samgyeop", "fridge", 3], [/항정/, "hangjeong", "fridge", 3], [/목살|돼지/, "moksal", "fridge", 3],
  [/주먹밥/, "jumeokbap", "freezer", 90],
  [/감자\s*큐브/, "cube-potato", "freezer", 21], [/고구마\s*큐브/, "cube-sweetpotato", "freezer", 21], [/애호박\s*큐브/, "cube-zucchini2", "freezer", 21],
  [/우엉\s*큐브/, "cube-burdock", "freezer", 21], [/연근\s*큐브/, "cube-lotus", "freezer", 21], [/브로콜리\s*큐브/, "cube-broccoli2", "freezer", 21],
  [/^오이$|백오이|취청|다다기/, "cucumber", "veg", 7],
  [/면두부/, "myeon-tofu", "fridge", 5],
  [/순두부/, "soft-tofu", "fridge", 5],
  [/멸치/, "anchovy", "freezer", 180],
  [/차조/, "chajo", "fridge", 180],
  [/두유/, "soymilk", "fridge", 10],
  [/감자채/, "potato-julienne", "veg", 3],
  [/초콜릿|초콜렛|초코/, "chocolate", "fridge", 90],
  [/망고/, "frozen-mango", "freezer", 180],
  [/닭다리살/, "chicken-thigh", "fridge", 2],
  [/닭다리|닭봉|북채/, "drumstick", "fridge", 2],
  [/귀리|오트/, "oat-rice", "fridge", 180],
  [/국거리/, "beef-soup", "fridge", 3],
  [/안심/, "beef-tenderloin", "fridge", 3],
  [/우둔/, "beef-round", "fridge", 3],
  [/완두/, "peas", "freezer", 90],
  [/부추/, "buchu", "veg", 5],
  [/장어/, "eel", "freezer", 60],
  [/바질/, "basil", "veg", 5],
  [/도토리묵|묵$/, "dotorimuk", "fridge", 4],
  [/적양배추/, "red-cabbage", "veg", 14],
  [/알배추|^배추$|절임배추/, "napa", "veg", 14],
  [/^무$|무우|^무\s/, "radish", "veg", 14],
  [/시금치/, "spinach", "veg", 5],
  [/쑥갓/, "ssukgat", "veg", 4],
  [/봄동/, "bomdong", "veg", 7],
  [/꽈리/, "kkwari", "veg", 7],
  [/셀러리|샐러리/, "celery", "veg", 10],
  [/미나리/, "minari", "veg", 5],
  [/아욱/, "auk", "veg", 4],
  [/근대/, "chard", "veg", 5],
  [/다진\s*마늘/, "minced-garlic", "freezer", 90],
  [/마늘/, "garlic", "veg", 21],
  [/깻잎/, "perilla", "veg", 7],
  [/우엉/, "burdock", "veg", 14],
  [/달래/, "dallae", "veg", 5],
  [/콜리플라워/, "cauliflower", "veg", 7],
  [/비트/, "beet", "veg", 21],
  [/가지/, "eggplant", "veg", 7],
  [/고사리/, "gosari", "fridge", 5],
  [/연근/, "lotus", "veg", 10],
  [/대구/, "cod", "freezer", 60],
  [/해물탕|밀키트/, "seafood-kit", "fridge", 2],
  [/문어/, "octopus", "fridge", 2],
  [/떡볶이/, "tteokbokki", "fridge", 3],
  [/메추리/, "quail-egg", "fridge", 7],
  [/구운\s*계란|구운\s*달걀|맥반석/, "roasted-egg", "fridge", 7],
  [/반숙/, "soft-egg", "fridge", 5],
  [/우유|밀크/, "milk", "fridge", 7], [/플레인|그릭|떠먹는/, "yogurt-plain", "fridge", 10], [/요거트|요구르트|요플레/, "yogurt", "fridge", 10],
  [/두부/, "tofu", "fridge", 5], [/계란|달걀|에그/, "egg", "fridge", 21],
  [/노랑\s*파프리카|노란\s*파프리카/, "paprika-y", "veg", 7], [/파프리카|피망/, "paprika", "veg", 7], [/바나나/, "banana", "fruit", 5],
  [/사과/, "apple", "fruit", 14], [/토마토/, "tomato-c", "veg", 7], [/만두/, "m-mandu", "freezer", 60], [/^밥$|햇반|즉석밥/, "m-rice", "fridge", 3],
  [/치즈/, "🧀", "fridge", 14], [/버터/, "🧈", "fridge", 30], [/햄|베이컨/, "🥓", "fridge", 7], [/소시지/, "🌭", "fridge", 7],
  [/소고기|한우|불고기|등심|갈비|다짐육/, "beef", "fridge", 3],  [/닭/, "chicken-thigh", "fridge", 2],
  [/연어|생선|대구|동태/, "🐟", "freezer", 60], [/새우/, "🦐", "freezer", 60], 
  [/아이스크림/, "🍨", "freezer", 90], [/김치|깍두기|섞박지/, "kimchi", "kimchi", 60], [/양배추|알배추|배추|상추|양상추/, "cabbage", "veg", 7], [/청경채/, "bokchoy", "veg", 5], [/시금치|깻잎/, "🥬", "veg", 5], [/대파|쪽파|파$/, "daepa", "veg", 10], [/깐마|^마$|산마|장마/, "yam", "veg", 10], [/아몬드|견과/, "almond", "fridge", 90], [/당근/, "carrot", "veg", 14],
  [/브로콜리/, "broccoli", "veg", 7], [/감자/, "potato", "veg", 21], [/고구마/, "🍠", "veg", 14], [/양파/, "onion", "veg", 21], [/고추|청양|꽈리/, "chili", "veg", 10],
  [/오이/, "cucumber", "veg", 7], [/애호박|호박/, "zucchini", "veg", 7], [/팽이/, "enoki", "veg", 7], [/새송이/, "king-oyster", "veg", 7], [/버섯|표고/, "shiitake", "veg", 5], [/마늘/, "🧄", "veg", 14], [/옥수수/, "🌽", "veg", 3],
  [/귤|오렌지|한라봉/, "🍊", "fruit", 10], [/딸기/, "🍓", "fruit", 3], [/포도|샤인|머스캣/, "grape", "fruit", 7], [/^배$|신고배|배\s/, "pear", "fruit", 14],
  [/복숭아/, "🍑", "fruit", 4], [/수박/, "🍉", "fruit", 4], [/키위/, "🥝", "fruit", 7], [/블루베리/, "🫐", "fruit", 5],
  [/찹쌀/, "chapssal-flour", "fridge", 90], [/쌀가루/, "rice-flour", "fridge", 90], [/밀가루|부침가루|튀김가루/, "🌾", "fridge", 90], [/가루/, "rice-flour", "fridge", 90], [/치킨스톡|스톡|육수/, "chicken-stock", "fridge", 180], [/굴소스|소스/, "oyster-sauce", "fridge", 180], [/들기름|참기름|기름/, "perilla-oil", "fridge", 120], [/생수|^물$|탄산수/, "water", "fridge", 365], [/커피/, "coffee", "fridge", 180], [/빵|식빵/, "🍞", "fridge", 5], [/떡/, "🍡", "freezer", 60], [/주스/, "🧃", "fridge", 7]
];
const PICKS = ["milk", "soymilk", "egg", "quail-egg", "roasted-egg", "soft-egg", "tofu", "myeon-tofu", "soft-tofu", "dotorimuk", "yogurt", "yogurt-plain", "beef", "beef-soup", "beef-tenderloin", "beef-round", "samgyeop", "moksal", "hangjeong", "duck", "chicken-thigh", "drumstick", "chicken-tender", "tteokgalbi", "matgamja", "jumeokbap", "m-mandu", "m-rice", "chajo", "oat-rice", "tteokbokki", "mackerel", "galchi", "gajami", "okdom", "doldom", "squid", "octopus", "cod", "eel", "anchovy", "seafood-kit", "🐟", "cabbage", "napa", "red-cabbage", "bomdong", "spinach", "perilla", "ssukgat", "minari", "auk", "chard", "buchu", "dallae", "celery", "basil", "bokchoy", "daepa", "yam", "kongnamul", "sukju", "carrot", "broccoli", "cauliflower", "potato", "potato-julienne", "radish", "burdock", "lotus", "beet", "gosari", "zucchini", "cucumber", "onion", "paprika", "paprika-y", "chili", "kkwari", "eggplant", "peas", "garlic", "minced-garlic", "thai-chili", "enoki", "king-oyster", "shiitake", "siraegi", "tomato-c", "apple", "banana", "pear", "grape", "frozen-mango", "🍊", "🍓", "kimchi", "grapefruit-tea", "yuja-tea", "almond", "chocolate", "jaecheop", "galbitang", "chueo", "oi-naengguk", "🧀", "🍞", "rice-flour", "chapssal-flour", "chicken-stock", "oyster-sauce", "perilla-oil", "water", "coffee", "🍱"];
const ICON_NAMES = {
  milk: "우유", "yogurt-plain": "플레인 요거트", yogurt: "딸기 요거트", tofu: "두부", egg: "계란", "paprika-y": "노랑 파프리카", paprika: "빨강 파프리카",
  banana: "바나나", apple: "사과", "tomato-c": "토마토", "m-mandu": "만두", "m-rice": "밥", beef: "소고기", kimchi: "김치", cabbage: "양배추",
  carrot: "당근", broccoli: "브로콜리", potato: "감자", zucchini: "애호박", cucumber: "오이", onion: "양파", chili: "청양고추", enoki: "팽이버섯",
  "king-oyster": "새송이버섯", shiitake: "표고버섯", grape: "샤인머스캣", pear: "배", "chapssal-flour": "찹쌀가루", "rice-flour": "쌀가루",
  "chicken-stock": "치킨스톡", "oyster-sauce": "굴소스", "perilla-oil": "들기름", water: "생수", coffee: "커피", matgamja: "맛감자",
  tteokgalbi: "떡갈비", gajami: "가자미", galchi: "갈치", mackerel: "고등어", doldom: "돌돔", okdom: "옥돔", squid: "오징어", jaecheop: "재첩국",
  galbitang: "갈비탕", chueo: "추어탕", "oi-naengguk": "오이냉국", "thai-chili": "태국고추", kongnamul: "콩나물", sukju: "숙주", siraegi: "시래기",
  duck: "훈제오리", "chicken-tender": "치킨텐더", samgyeop: "삼겹살", hangjeong: "항정살", moksal: "목살", jumeokbap: "냉동주먹밥",
  "cube-potato": "감자 큐브", "cube-sweetpotato": "고구마 큐브", "cube-zucchini2": "애호박 큐브", "cube-burdock": "우엉 큐브", "cube-lotus": "연근 큐브", "cube-broccoli2": "브로콜리 큐브",
  "chicken-thigh": "닭다리살", "myeon-tofu": "면두부", "soft-tofu": "순두부", "anchovy": "멸치", "chajo": "차조", "soymilk": "두유", "potato-julienne": "감자채", "chocolate": "초콜릿", "frozen-mango": "냉동망고", "drumstick": "닭다리", "oat-rice": "귀리쌀", "beef-soup": "국거리용 소고기", "beef-tenderloin": "구이용 소고기 안심", "beef-round": "소고기 우둔살", "peas": "완두콩", "buchu": "부추", "eel": "장어", "basil": "바질", "dotorimuk": "도토리묵", "red-cabbage": "적양배추", "napa": "배추", "radish": "무", "spinach": "시금치", "ssukgat": "쑥갓", "bomdong": "봄동", "kkwari": "꽈리고추", "celery": "셀러리", "minari": "미나리", "auk": "아욱", "chard": "근대", "minced-garlic": "다진마늘", "garlic": "마늘", "perilla": "깻잎", "burdock": "우엉", "dallae": "달래", "cauliflower": "콜리플라워", "beet": "비트", "eggplant": "가지", "gosari": "고사리", "lotus": "연근", "cod": "대구", "seafood-kit": "해물탕밀키트", "octopus": "문어", "tteokbokki": "떡볶이", "quail-egg": "메추리알", "roasted-egg": "구운계란", "soft-egg": "반숙란", bokchoy: "청경채", daepa: "대파", yam: "깐마", almond: "아몬드", "grapefruit-tea": "자몽청", "yuja-tea": "유자청", "🐟": "생선", "🍊": "귤", "🍓": "딸기", "🧀": "치즈", "🍞": "식빵"
};
// 그림마다 기본 이름·칸·보관일수 (FOODS에서 처음 나오는 규칙을 따라요)
const ICON_INFO = {};
FOODS.forEach(([, ic, z, days]) => { if (!ICON_INFO[ic] && ICON_NAMES[ic]) ICON_INFO[ic] = { name: ICON_NAMES[ic], zone: z, days }; });
const STAPLES = ["우유", "계란", "두부", "요거트", "소고기", "빨강 파프리카", "노랑 파프리카", "양배추", "바나나", "브로콜리", "사과", "당근", "감자", "애호박", "김치", "토마토", "만두", "양파", "청양고추", "팽이버섯", "새송이버섯", "표고버섯", "배", "샤인머스캣", "플레인 요거트", "콩나물", "숙주", "오이", "태국고추", "시래기", "삼겹살", "항정살", "목살", "훈제오리", "떡갈비", "맛감자", "치킨텐더", "냉동주먹밥", "고등어", "갈치", "가자미", "옥돔", "돌돔", "오징어", "쌀가루", "찹쌀가루", "치킨스톡", "굴소스", "들기름", "생수", "커피"];
const CUBEART = [
  [/소고기|한우|고기/, "cube-beef", "c-cow"], [/감자/, "cube-potato", null], [/고구마/, "cube-sweetpotato", null],
  [/애호박|호박/, "cube-zucchini2", null], [/우엉/, "cube-burdock", null], [/연근/, "cube-lotus", null],
  [/브로콜리/, "cube-broccoli2", null], [/당근/, "cube-carrot", "carrot-c"]
];
const KSLOT = [["breakfast", "아침", "☀️", "m-b"], ["lunch", "점심", "🌤️", "m-l"], ["dinner", "저녁", "🌙", "m-d"]];
const KMOODS = [["great", "😋", "잘 먹음"], ["ok", "🙂", "보통"], ["no", "🙅", "안 먹음"]];
const STAGES = [["초기", 1, "미음"], ["중기", 2, "죽"], ["후기", 3, "무른밥"], ["완료기", 3, "진밥"]];
const BABY_ING = ["쌀", "찹쌀", "오트밀", "소고기", "닭고기", "애호박", "브로콜리", "감자", "고구마", "단호박", "당근", "양배추", "청경채", "시금치", "비타민", "콜리플라워", "오이", "무", "배", "사과", "바나나", "두부"];
const CH_STATUS = [["watch", "👀", "지켜보는 중"], ["ok", "😊", "괜찮아요"], ["bad", "⚠️", "반응 있어요"]];

/* =========================================================
   도우미
   ========================================================= */
const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const pad = n => String(n).padStart(2, "0");
const ymd = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const parse = s => { const [y, m, d] = String(s).split("-").map(Number); return new Date(y, (m || 1) - 1, d || 1); };
const today = () => ymd(new Date());
const addDays = (s, n) => { const d = parse(s); d.setDate(d.getDate() + n); return ymd(d); };
const dday = s => s ? Math.round((parse(s) - parse(today())) / 864e5) : null;
const WD = ["일", "월", "화", "수", "목", "금", "토"];
const longDate = s => { const d = parse(s); return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일 (${WD[d.getDay()]})`; };
const mdw = s => { const d = parse(s); return `${d.getMonth() + 1}.${pad(d.getDate())} (${WD[d.getDay()]})`; };
const md = s => { const d = parse(s); return `${d.getMonth() + 1}.${pad(d.getDate())}`; };
const isImg = k => /^[a-z]/.test(k || "");
function pic(key, cls = "fimg") {
  key = key || "🍱";
  return isImg(key) ? `<img class="${cls}" src="img/${key}.png" alt="" loading="lazy">` : `<span class="femo">${esc(key)}</span>`;
}
function guess(name) {
  for (const [re, ic, z, days] of FOODS) if (re.test(name)) return { icon: ic, zone: z, days };
  return { icon: "🍱", zone: "fridge", days: 7 };
}
function badge(s) {
  const d = dday(s);
  if (d === null) return `<span class="badge">기한 없음</span>`;
  if (d < 0) return `<span class="badge over">${-d}일 지남</span>`;
  if (d === 0) return `<span class="badge today">오늘까지</span>`;
  if (d <= 3) return `<span class="badge soon">D-${d}</span>`;
  return `<span class="badge">D-${d}</span>`;
}
const ls = {
  get(k, def) { try { const v = localStorage.getItem(k); return v === null ? def : JSON.parse(v); } catch (e) { return def; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
};
const SV = {
  home: '<path d="M3 11.5 12 4l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
  list: '<rect x="5" y="3" width="14" height="18" rx="2.5"/><path d="M9 8h6M9 12h6M9 16h4"/>',
  kids: '<path d="M7 3v8M5 3v5a2 2 0 0 0 4 0V3M7 11v10M17 3c-2 0-3 3-3 6 0 2 1 3 3 3v9M17 3v18"/>',
  cal: '<rect x="3" y="5" width="18" height="16" rx="2.5"/><path d="M3 10h18M8 3v4M16 3v4"/><circle cx="8" cy="14" r=".6"/><circle cx="12" cy="14" r=".6"/><circle cx="16" cy="14" r=".6"/><circle cx="8" cy="17.5" r=".6"/><circle cx="12" cy="17.5" r=".6"/>',
  fam: '<circle cx="8.5" cy="8" r="3.2"/><circle cx="16.5" cy="8" r="3.2"/><path d="M2.5 20c0-3.5 2.7-6 6-6s6 2.5 6 6M13 14.5c1-.4 2.2-.5 3.5-.5 3.3 0 5.5 2.5 5.5 6"/>',
  menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
  bell: '<path d="M6 16V11a6 6 0 0 1 12 0v5l2 2H4zM10 20a2 2 0 0 0 4 0"/>',
  receipt: '<path d="M6 3h12v18l-2-1.5L14 21l-2-1.5L10 21l-2-1.5L6 21z"/><path d="M9 8h6M9 12h6M9 16h3"/>',
  cam: '<path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/>',
  scan: '<path d="M4 8V5a1 1 0 0 1 1-1h3M16 4h3a1 1 0 0 1 1 1v3M20 16v3a1 1 0 0 1-1 1h-3M8 20H5a1 1 0 0 1-1-1v-3M7 12h10"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  calendar: '<rect x="3" y="5" width="18" height="16" rx="2.5"/><path d="M3 10h18M8 3v4M16 3v4"/>',
  spoon: '<path d="M8 3c2.5 0 3.5 2.5 3.5 4.5S10.5 12 8 12 4.5 9.5 4.5 7.5 5.5 3 8 3zM8 12v9M17 3v6M15 3v4a2 2 0 0 0 4 0V3M17 9v12"/>',
  barcode: '<path d="M4 5v14M7 5v14M10 5v14M14 5v14M16 5v14M20 5v14M4 5h2M18 19h2"/>',
  again: '<path d="M4 12a8 8 0 1 0 3-6.3M4 4v4h4"/>'
};
// 페이지 머리: 제목+한 줄 소개는 왼쪽, 캐릭터는 오른쪽. [그림, 크기("big"|"mid"|"veg")]
const BACK_VIEWS = ["receipt", "cube"];
function phead(title, sub, chars) {
  const back = BACK_VIEWS.includes(S.view) ? `<button type="button" class="backbtn" data-act="back" aria-label="뒤로 가기">‹</button>` : "";
  return `<div class="phead ${back ? "hasback" : ""}">${back}<div class="pt"><h2>${title}<button type="button" class="helpq" data-act="guide" aria-label="${title} 설명 보기">?</button></h2>${sub ? `<p>${sub}</p>` : ""}</div>
    <div class="pk">${chars.map(([src, size]) => `<img class="${size}" src="img/${src}.png" alt="">`).join("")}</div></div>`;
}
const svg = (k, cls = "") => `<svg class="${cls}" viewBox="0 0 24 24" aria-hidden="true">${SV[k]}</svg>`;

/* =========================================================
   상태
   ========================================================= */
const S = {
  user: null, ready: false, denied: false,
  items: [], cubes: [], meals: {}, logs: [], meta: {}, barcodes: {}, challenges: [], babyLog: [],
  view: ls.get("fridge-view", "home"),
  listFilter: "all", query: "",
  date: today(), cubeTab: "stock", kidTab: ls.get("fridge-kidtab", "kihun"), addQ: "",
  calMonth: today().slice(0, 7), calDay: today(),
  rc: { img: "", status: "idle", progress: 0, found: [], sel: null, zone: null, qty: 1, exp: "", name: "", at: "" },
  prefs: ls.get("fridge-prefs", { soon: true, newItem: true, daily: false }),
  seenItems: null
};
let unsubs = [];

/* =========================================================
   시작
   ========================================================= */
D.init(user => {
  unsubs.forEach(u => u && u()); unsubs = [];
  S.user = user; S.ready = false; S.denied = false; S.seenItems = null;
  if (!user) return renderLogin();
  renderShell();
  const onErr = e => {
    if (e && (e.code === "permission-denied" || e.code === "permission_denied")) { S.denied = true; renderShell(); }
  };
  unsubs.push(D.watch("items", rows => {
    if (S.seenItems && S.prefs.newItem) {
      rows.filter(r => !S.seenItems.has(r.id) && r.addedBy && r.addedBy !== S.user.name)
        .slice(0, 3).forEach(r => toast(`${r.addedBy}님이 ${r.name}을(를) 넣었어요`));
    }
    S.seenItems = new Set(rows.map(r => r.id));
    S.items = rows; S.ready = true; refresh(); firstAlert();
  }, onErr));
  unsubs.push(D.watch("cubes", rows => { S.cubes = rows; refresh(); }, onErr));
  unsubs.push(D.watch("meals", rows => { S.meals = Object.fromEntries(rows.map(r => [r.id, r])); refresh(); }, onErr));
  unsubs.push(D.watch("cubeLogs", rows => { S.logs = rows; refresh(); }, onErr));
  unsubs.push(D.watch("challenges", rows => { S.challenges = rows; refresh(); }, onErr));
  unsubs.push(D.watch("babyLog", rows => { S.babyLog = rows; refresh(); }, onErr));
  unsubs.push(D.watch("barcodes", rows => { S.barcodes = Object.fromEntries(rows.map(r => [r.id, r])); }, onErr));
  unsubs.push(D.watch("meta", rows => { S.meta = Object.fromEntries(rows.map(r => [r.id, r])); refresh(); }, onErr));
}).catch(e => {
  console.error(e);
  $("#app").innerHTML = `<div class="login"><div class="card"><h2>연결하지 못했어요</h2><p class="muted">인터넷 연결을 확인하고 새로고침해 주세요. 계속 안 되면 firebase-config.js 값을 다시 확인해 주세요.</p></div></div>`;
});

function renderLogin() {
  $("#app").innerHTML = `<div class="login">
    <img class="title-img" src="img/title-banner.png" alt="홍교♡해리♡기훈♡태훈이네 냉장고">
    <div class="scene"><img class="bgimg" src="img/fridge.png" alt="냉장고 그림" width="900" height="675">${SCENE_FRIENDS}</div>
    <div class="card">
      <img src="img/bro-wave.png" alt="" style="width:160px">
      <h2>우리 가족 냉장고에 들어가기</h2>
      <p class="muted">가족으로 등록된 구글 계정으로 로그인해 주세요.</p>
      <button class="gbtn" id="gsign" type="button"><svg viewBox="0 0 48 48"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.8 1.1 7.9 3l5.7-5.7C34.1 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/><path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3 0 5.8 1.1 7.9 3l5.7-5.7C34.1 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"/></svg>구글 계정으로 시작하기</button>
      <p class="tiny" id="lerr"></p>
    </div></div>`;
  $("#gsign").onclick = () => D.signIn().catch(e => { $("#lerr").textContent = "로그인하지 못했어요. 다시 눌러 주세요. (" + (e.code || "오류") + ")"; });
}
const titleHTML_unused = () => `<span class="t1">홍교</span><span class="h">♡</span><span class="t2">해리</span><span class="h">♡</span><span class="t3">기훈</span><span class="h">♡</span><span class="t4">태훈</span><span class="t5">이네 냉장고</span>`;

function renderShell() {
  $("#app").innerHTML = `<div class="page">
    <header class="hdr">
      <button class="ib" type="button" data-act="menu" aria-label="메뉴">${svg("menu")}</button>
      <h1 class="ttl"><img class="title-img" src="img/title-banner.png" alt="홍교♡해리♡기훈♡태훈이네 냉장고 · 가족이 함께 보는 유통기한 보드"></h1>
      <button class="ib" type="button" data-act="bell" aria-label="먼저 챙길 것">${svg("bell")}<span class="dot" id="belldot" hidden></span></button>
    </header>
    <div id="banner"></div>
    <main id="main"></main>
  </div>
  <button type="button" class="fab" data-act="add" aria-label="냉장고에 넣기">${svg("plus")}</button>
  <nav class="nav" aria-label="메뉴"><div class="in">
    <button type="button" data-go="home">${svg("home")}냉장고</button>
    <button type="button" data-go="list">${svg("list")}식품 목록</button>
    <button type="button" data-go="kids">${svg("kids")}아이식사</button>
    <button type="button" data-go="cal">${svg("cal")}캘린더</button>
    <button type="button" data-go="family">${svg("fam")}가족</button>
  </div></nav>
  <div class="scrim" id="scrim" hidden><div class="sheet" id="sheet" role="dialog" aria-modal="true"></div></div>
  <div class="toast" id="toast" hidden></div>`;
  if (D.demo) $("#banner").innerHTML = `<div class="banner mini">🧪 체험 모드 · 이 기기에만 저장돼요</div>`;
  render();
}

/* =========================================================
   화면 그리기
   ========================================================= */
const GROUP = { home: "home", receipt: "home", list: "list", kids: "kids", kihun: "kids", taehun: "kids", challenge: "kids", cube: "kids", cal: "cal", family: "family" };
/* 뒤로 가기: 화면 안 ‹ 버튼 + 휴대폰 뒤로 버튼 모두 */
const hpush = st => { try { history.pushState(st, ""); } catch (e) {} };
try { history.replaceState({ v: S.view }, ""); } catch (e) {}
function go(v, fromPop) {
  if (v !== S.view) { S.prevView = S.view; if (!fromPop) hpush({ v }); }
  S.view = v; ls.set("fridge-view", v);
  render(); window.scrollTo(0, 0);
}
function goBack() {
  if (history.state && history.state.v === S.view && S.prevView) { try { history.back(); return; } catch (e) {} }
  go(S.prevView && S.prevView !== S.view ? S.prevView : "home");
}
window.addEventListener("popstate", e => {
  const sc = $("#scrim");
  if (sc && !sc.hidden) return closeSheet();          // 열린 창부터 닫아요
  const v = (e.state && e.state.v) || "home";
  if (v === S.view) { if (e.state && e.state.sheet) try { history.back(); } catch (er) {} return; }
  go(v, true);
});
let pendingRender = false;
// 손가락이 화면에 닿아 있는 동안엔 다시 그리지 않아요 (누른 버튼이 사라져 탭이 씹히지 않게)
let pressing = false;
document.addEventListener("pointerdown", () => { pressing = true; }, true);
const release = () => setTimeout(() => { pressing = false; if (pendingRender) { pendingRender = false; refresh(); } }, 30);
document.addEventListener("pointerup", release, true);
document.addEventListener("pointercancel", release, true);
function refresh() {
  if (pressing) { pendingRender = true; return; }
  const a = document.activeElement;
  if (S.view === "list" && a && a.id === "q") { const box = $("#listItems"); if (box) { box.innerHTML = listItemsHTML(); return; } }
  if (a && $("#main") && $("#main").contains(a) && /INPUT|TEXTAREA|SELECT/.test(a.tagName) && a.type !== "checkbox") { pendingRender = true; return; }
  if (S.drag) { pendingRender = true; return; }
  render();
}
document.addEventListener("focusout", () => setTimeout(() => { if (pendingRender) { pendingRender = false; refresh(); } }, 0));

function render() {
  const main = $("#main"); if (!main) return;
  $$(".nav button").forEach(b => b.classList.toggle("on", b.dataset.go === GROUP[S.view]));
  const fab = $(".fab"); if (fab) fab.hidden = !["home", "list"].includes(S.view);
  const n = counts();
  const dot = $("#belldot"); if (dot) dot.hidden = !(n.today + n.soon || needMake());
  if (S.denied) {
    main.innerHTML = `<div class="card"><div class="sec-h"><h2>아직 가족 명단에 없는 계정이에요</h2></div>
      <p class="muted" style="margin:0">${esc(S.user.email)} 계정은 이 냉장고에 들어올 수 없어요. Firebase 보안 규칙에 이 이메일을 추가한 뒤 다시 로그인해 주세요.</p>
      <button class="btn line" type="button" data-act="logout">다른 계정으로 로그인</button></div>`;
    return;
  }
  const V = { home: vHome, receipt: vReceipt, list: vList, kids: vKids, kihun: vKihun, taehun: vTaehun, challenge: vChallenge, cube: vCube, cal: vCal, family: vFamily };
  main.innerHTML = (V[S.view] || vHome)();
  after();
}
function counts() {
  let today = 0, soon = 0;
  S.items.forEach(i => { const d = dday(i.expiry); if (d === null) return; if (d <= 0) today++; else if (d <= 3) soon++; });
  return { today, soon, all: S.items.length };
}
const sortedItems = () => [...S.items].sort((a, b) => (a.expiry || "9999") < (b.expiry || "9999") ? -1 : 1);
/* 누구 꺼? — 기훈/태훈 몫으로 산 재료 표시 */
const WHO = { kihun: { label: "기훈", img: "ki-sit" }, taehun: { label: "태훈", img: "tae-clap" } };
const whoTag = i => WHO[i.for] ? `<i class="whot w-${i.for}"><img src="img/${WHO[i.for].img}.png" alt="">${WHO[i.for].label} 꺼</i>` : "";
const whoPick = (cur, attr) => `<div class="whopick" role="group" aria-label="누구 꺼예요?">
  <button type="button" ${attr}="" aria-pressed="${!cur}">🏠 다 같이</button>
  ${Object.entries(WHO).map(([k, w]) => `<button type="button" class="w-${k}" ${attr}="${k}" aria-pressed="${cur === k}"><img src="img/${w.img}.png" alt="">${w.label} 꺼</button>`).join("")}</div>`;

/* ---------- 홈 ---------- */
function vHome() {
  const n = counts(), items = sortedItems();
  const zones = ZORDER.map(z => {
    const h = HOT[z], list = items.filter(i => (i.zone || "fridge") === z);
    const max = h.top ? 10 : h.drawer ? 3 : 6;
    const icons = list.slice(0, max).map(i => { const d = dday(i.expiry); return `<span class="mi ${d !== null && d <= 3 ? "warn" : ""}">${pic(i.icon)}</span>`; }).join("");
    return `<button type="button" class="zhot ${h.top ? "top" : ""} ${h.drawer ? "drawer" : ""}" style="left:${h.l}%;top:${h.t}%;width:${h.w}%;height:${h.h}%" data-zone="${z}" aria-label="${ZONES[z].label} ${list.length}개">${icons}${list.length ? `<span class="cnt num">${list.length}</span>` : ""}</button>`;
  }).join("");
  const soonList = items.filter(i => { const d = dday(i.expiry); return d !== null && d <= 3; }).slice(0, 5);
  return `
  <div class="mstats">
    <button type="button" class="ms s1" data-list="today">🍎 오늘 먹기 <b class="num">${n.today}</b></button>
    <button type="button" class="ms s2" data-list="soon">⏰ 임박 <b class="num">${n.soon}</b></button>
    <button type="button" class="ms s3" data-list="all">🧺 전체 <b class="num">${n.all}</b></button>
  </div>
  <div class="scene home"><img class="bgimg" src="img/fridge.png" alt="우리 집 냉장고" width="900" height="675">${zones}${SCENE_FRIENDS}</div>
  ${needMake() ? `<button type="button" class="makecall" data-go="taehun">🍚 태훈이 이유식 만들 차례예요 <b>›</b></button>` : ""}
  ${!S.ready ? "" : !items.length ? `<div class="card"><div class="empty"><img src="img/bro-blocks.png" alt=""><div><b>아직 냉장고가 비어 있어요</b><p>오른쪽 아래 ＋를 눌러<br>채워 보세요 ♡</p></div></div></div>` :
    `<div class="card"><div class="sec-h"><h2>⏰ 먼저 먹어야 해요</h2></div>
      <div class="items">${soonList.length ? soonList.map(itemRow).join("") : `<div class="empty small">3일 안에 기한이 끝나는 식품이 없어요!</div>`}</div></div>`}`;
}
function itemRow(i) {
  return `<div class="item">
    <span class="fic">${pic(i.icon)}</span>
    <button type="button" class="info" data-edit="${esc(i.id)}"><span class="nm"><b>${esc(i.name)}</b>${whoTag(i)}</span>
      <span>${ZONES[i.zone]?.label || "냉장실"} · ${i.expiry ? md(i.expiry) + "까지" : "기한 없음"}${i.addedBy ? " · " + esc(i.addedBy) : ""}</span></button>
    <div class="right">${badge(i.expiry)}
      <span class="step"><button type="button" data-q="${esc(i.id)}" data-d="-1" aria-label="하나 꺼내기">−</button><output class="num">${i.qty || 1}</output><button type="button" data-q="${esc(i.id)}" data-d="1" aria-label="하나 더">＋</button></span></div>
  </div>`;
}

/* ---------- 식품 목록 ---------- */
function listItemsHTML() {
  let list = sortedItems();
  if (S.listFilter === "today") list = list.filter(i => { const d = dday(i.expiry); return d !== null && d <= 0; });
  else if (S.listFilter === "soon") list = list.filter(i => { const d = dday(i.expiry); return d !== null && d > 0 && d <= 3; });
  else if (ZONES[S.listFilter]) list = list.filter(i => (i.zone || "fridge") === S.listFilter);
  else if (WHO[S.listFilter]) list = list.filter(i => i.for === S.listFilter);
  const q = S.query.replace(/\s+/g, "");
  const hit = n => n.replace(/\s+/g, "").includes(q);
  if (q) list = list.filter(i => hit(i.name));
  // 이유식 큐브도 같이 찾아요 ('큐브'만 적어도 전부 나와요)
  let cubes = [];
  if (q && kidSet().useCube && (S.listFilter === "all" || S.listFilter === "freezer"))
    cubes = S.cubes.filter(c => hit(c.name + "큐브") || hit("이유식큐브"));
  const cubeRows = cubes.map(c => `<button type="button" class="item cube-row" data-go="cube">
      <span class="fic">${pic(cubeArt(c.name)[0])}</span>
      <span class="info"><b>${esc(c.name)} 큐브</b><span>이유식 큐브 · 냉동실 · 남은 ${c.count || 0}개</span></span>
      <span class="right">${badge(c.useBy)}</span></button>`).join("");
  if (!list.length && !cubes.length) return q
    ? `<div class="card"><div class="empty small">'${esc(S.query)}'(으)로 찾은 식품이 없어요.</div></div>`
    : `<div class="card"><div class="empty"><img src="img/empty-basket.png" alt=""><div><b>여기엔 아무것도 없어요</b><p>＋ 식품 등록이나 영수증 인식으로 채워 주세요.</p></div></div></div>`;
  return list.map(itemRow).join("") + cubeRows;
}
function vList() {
  const fav = (S.meta.settings && S.meta.settings.favZones) || ZORDER;
  const f = [["all", "전체"], ["today", "오늘 먼저"], ["soon", "임박"], ["kihun", "기훈 꺼"], ["taehun", "태훈 꺼"], ...ZORDER.filter(z => fav.includes(z)).map(z => [z, ZONES[z].label])];
  return `
  ${phead("식품 목록", "냉장고 속 식품을 한눈에", [["ki-run", "big"], ["tae-stripe", "mid"]])}
  <div class="card">
    <input class="search" id="q" type="search" placeholder="이름으로 찾기 (예: 큐브, 고기)" value="${esc(S.query)}" autocomplete="off" enterkeyhint="search">
    <div class="chips">${f.map(([k, l]) => `<button type="button" class="chip ${ZONES[k] ? "zchip z-" + k : WHO[k] ? "wchip w-" + k : ""}" data-lf="${k}" aria-pressed="${S.listFilter === k}">${ZONES[k] ? ZONES[k].ic + " " : ""}${l}</button>`).join("")}</div>
  </div>
  <div class="items" id="listItems">${listItemsHTML()}</div>`;
}

/* ---------- 영수증 ---------- */
function vReceipt() {
  const R = S.rc;
  const left = R.found.filter(f => !f.done);
  const step = !R.img ? 1 : R.status === "reading" ? 2 : 3;
  const sel = R.found.find(f => f.key === R.sel);
  return `
  ${phead("영수증으로 넣기", "찍으면 식품을 찾아 줘요", [["tomato-c", "veg"], ["broccoli-c", "veg"]])}
  <div class="steps3">
    <div class="sp ${step === 1 ? "cur" : ""}"><span class="n">1</span>영수증 촬영</div><span class="arr">›</span>
    <div class="sp ${step === 2 ? "cur" : ""}"><span class="n">2</span>자동 인식</div><span class="arr">›</span>
    <div class="sp ${step === 3 ? "cur" : ""}"><span class="n">3</span>냉장고에 넣기</div>
  </div>
  <div class="card"><div class="rtop">
    <div class="photo">${R.img ? `<img src="${R.img}" alt="찍은 영수증">
        <label class="again fileb">${svg("again")}다시 촬영하기<input type="file" accept="image/*" capture="environment" id="rfile"></label>`
      : `<label class="btn pink fileb">${svg("cam")}영수증 찍기<input type="file" accept="image/*" capture="environment" id="rfile"></label>`}</div>
    <div class="res">
      <h3>✨ 영수증 인식 결과</h3>
      ${R.status === "reading" ? `<p class="muted" style="margin:0">글자 읽는 중… ${R.progress}%</p><div class="prog"><i style="width:${R.progress}%"></i></div><p class="tiny" style="margin:0">처음 한 번은 글자 사전을 받느라 30초쯤 걸려요.</p>` :
      R.status === "error" ? `<p class="muted" style="margin:0">영수증을 읽지 못했어요. 밝은 곳에서 영수증이 화면에 꽉 차게 다시 찍어 주세요. 아래에서 직접 추가해도 돼요.</p>` :
      `<dl><dt>🧺 인식된 식품</dt><dd class="num">${R.found.length}개</dd>
        <dt>📅 인식 날짜</dt><dd>${R.at || "아직 없음"}</dd>
        <dt>🛒 남은 식품</dt><dd class="num">${left.length}개</dd></dl>`}
      <div data-form class="row" id="radd"><input class="in" id="raddIn" placeholder="빠진 식품 직접 추가" autocomplete="off"><button class="btn sm primary" type="button" data-submit>＋</button></div>
    </div>
  </div></div>
  <div class="card pinkish">
    <div class="sec-h"><h2>🛍️ 인식된 식품</h2><small>칸으로 끌거나 눌러서 골라요</small></div>
    ${R.found.length ? `<div class="whorow"><span>누구 꺼?</span>${whoPick(R.who || "", "data-rwho")}</div>` : ""}
    ${R.found.length ? `<div class="rfoods">${R.found.map(f => `<div class="rfood ${f.key === R.sel ? "sel" : ""} ${f.done ? "done" : ""}" data-rf="${f.key}" role="button" tabindex="0"><span class="grip">⠿⠿</span><span class="pic">${pic(f.icon)}</span><b>${esc(f.name)}</b></div>`).join("")}</div>`
      : `<div class="empty small">영수증을 찍으면 여기에 식품이 나타나요.</div>`}
  </div>
  <div class="dropscene">
    <img class="bgimg" src="img/fridge.png" alt="냉장고" width="900" height="675">
    ${ZORDER.map(z => { const h = DROP[z]; return `<div class="dz2 z-${z} ${R.zone === z && sel ? "on" : ""}" style="left:${h.l}%;top:${h.t}%;width:${h.w}%;height:${h.h}%" data-drop="${z}" role="button" tabindex="0" aria-label="${ZONES[z].label}에 넣기"><span>${ZONES[z].label}</span></div>`; }).join("")}
    <span class="drophint">식품을 칸으로 끌어다 넣어요 ♡</span>
  </div>
  ${sel ? `<div class="panel">
    <div class="row between"><h2 style="font-size:19px">📝 선택한 식품 정보 입력</h2><button class="x" type="button" data-act="rcancel" aria-label="선택 취소">✕</button></div>
    <div class="pick">
      <div class="pv"><span class="pic">${pic(sel.icon)}</span><b style="font-family:var(--fd);font-weight:400">${esc(R.zone ? ZONES[R.zone].label : "칸 고르기")}</b></div>
      <div class="fgrid">
        <label class="f wide"><span>이름</span><input class="in" id="rname" value="${esc(R.name)}"></label>
        <label class="f"><span>수량</span><span class="step"><button type="button" data-act="rqty" data-d="-1">−</button><output class="num">${R.qty}</output><button type="button" data-act="rqty" data-d="1">＋</button></span></label>
        <label class="f"><span>유통기한</span><input class="in num" type="date" id="rexp" value="${esc(R.exp)}"></label>
      </div>
    </div>
    ${!R.zone ? `<p class="tiny" style="margin:0">위 냉장고에서 넣을 칸을 눌러 주세요.</p>` : ""}
    <div class="actions" style="grid-template-columns:1fr 1.4fr"><button class="btn line" type="button" data-act="rcancel">취소</button>
    <button class="btn pink" type="button" data-act="rsave" ${R.zone ? "" : "disabled"}>✓ 냉장고에 저장하기</button></div>
  </div>` : (R.found.length && left.length ? `<button class="btn line wide" type="button" data-act="rall">남은 ${left.length}개 추천 칸에 한꺼번에 넣기</button>` : "")}`;
}

/* ---------- 아이식사 ---------- */
function mealDoc(child, date) { return S.meals[`${child}_${date}`] || {}; }
function prepItems() { return (S.meta.prep && S.meta.prep.items) || []; }
const kidSet = () => Object.assign({ place: "어린이집", autoLunch: true, stage: "초기", times: 1, keepDays: 3, useCube: true }, S.meta.kids || {});
const DEFAULT_RULES = ["💗 사 오면 바로 넣기", "🧺 꺼내 쓰면 개수 줄이기", "🗑️ 버리기 전에 날짜 확인"];
const houseRules = () => (S.meta.rules && S.meta.rules.items) || DEFAULT_RULES;
function saveRules(items) { S.meta.rules = { items }; render(); D.put("meta", "rules", { items }).catch(writeErr); }
function saveKidSet(patch) { const k = { ...kidSet(), ...patch }; S.meta.kids = k; render(); D.put("meta", "kids", k).catch(writeErr); }
const isWeekday = d => { const w = parse(d).getDay(); return w >= 1 && w <= 5; };
function vKids() { return ({ kihun: vKihun, taehun: vTaehun, challenge: vChallenge }[S.kidTab] || vKihun)(); }
function dateNav() {
  return `<div class="datenav">
    <button type="button" data-dd="-1" aria-label="전날">‹</button>
    <b class="num">${mdw(S.date)}${S.date === today() ? ` <span class="badge today">오늘</span>` : ""}</b>
    <button type="button" data-dd="1" aria-label="다음날">›</button></div>`;
}
function kidsHead(which) {
  S.kidTab = which; ls.set("fridge-kidtab", which);
  const T = {
    kihun: ["유아식", "오늘 뭐 먹었는지 남겨요", [["ki-point", "big"]]],
    taehun: ["이유식", "만들고, 먹이고, 체크해요", [["tae-clap", "mid"]]],
    challenge: ["도전 기록", "처음 먹는 음식을 지켜봐요", [["ki-heart", "big"], ["tae-dino", "mid"]]]
  }[which];
  return `
  ${phead(T[0], T[1], T[2])}
  <div class="ktabs" role="tablist">
    <button type="button" role="tab" data-go="kihun" aria-selected="${which === "kihun"}">기훈 유아식</button>
    <button type="button" role="tab" data-go="taehun" aria-selected="${which === "taehun"}">태훈 이유식</button>
    <button type="button" role="tab" data-go="challenge" aria-selected="${which === "challenge"}">도전 기록</button>
  </div>`;
}

/* 기훈 유아식: 아침·점심·저녁, 메뉴 + 반응 하나 */
function menuStats(days, moodOnly) {
  const from = addDays(today(), -days), cnt = {};
  Object.values(S.meals).forEach(m => {
    if (m.child !== "kihun" || !m.date || m.date < from) return;
    KSLOT.forEach(([k]) => { const sl = m[k]; if (!sl || !sl.menu) return; if (moodOnly && sl.mood !== moodOnly) return;
      sl.menu.split(/[,·]/).map(x => x.trim()).filter(Boolean).forEach(x => cnt[x] = (cnt[x] || 0) + 1); });
  });
  return Object.entries(cnt).sort((a, b) => b[1] - a[1]);
}
/* 메뉴별 반응 집계: 같은 메뉴도 날마다 다르니까, 더 많이 나온 반응으로 나눠요 */
function moodTally(days) {
  const from = addDays(today(), -days), t = {};
  Object.values(S.meals).forEach(m => {
    if (m.child !== "kihun" || !m.date || m.date < from) return;
    KSLOT.forEach(([k]) => { const sl = m[k]; if (!sl || !sl.menu || !sl.mood) return;
      sl.menu.split(/[,·]/).map(x => x.trim()).filter(Boolean).forEach(x => { const r = t[x] = t[x] || { great: 0, ok: 0, no: 0 }; r[sl.mood] = (r[sl.mood] || 0) + 1; }); });
  });
  const all = Object.entries(t);
  const likes = all.filter(([, r]) => r.great > r.no).sort((a, b) => (b[1].great - b[1].no) - (a[1].great - a[1].no));
  const nope = all.filter(([, r]) => r.no > r.great).sort((a, b) => (b[1].no - b[1].great) - (a[1].no - a[1].great));
  const mixed = all.filter(([, r]) => r.great && r.no && r.great === r.no);
  return { likes, nope, mixed };
}
function kidStock(k) {
  const list = sortedItems().filter(i => i.for === k && !i.baby);
  if (!list.length) return "";
  return `<div class="card"><div class="sec-h"><h2>🧺 ${WHO[k].label}이 몫으로 산 재료</h2><small>${list.length}가지</small></div>
    <div class="items">${list.map(itemRow).join("")}</div></div>`;
}
function vKihun() {
  const doc = mealDoc("kihun", S.date), ks = kidSet();
  const chips = menuStats(30).slice(0, 8).map(x => x[0]);
  const mt = moodTally(60), often = menuStats(7).slice(0, 6);
  const likes = mt.likes.slice(0, 6), nope = mt.nope.slice(0, 4), mixed = mt.mixed.slice(0, 4);
  const slotCard = ([k, label, emo, cls]) => {
    const sl = doc[k] || {};
    const away = k === "lunch" && ks.autoLunch && isWeekday(S.date) && !sl.home;
    const used = (sl.menu || "").split(/[,·]/).map(x => x.trim());
    return `<div class="kmeal ${cls}">
      <div class="kh"><span class="emo">${emo}</span><b>${label}</b>
        ${k === "lunch" && ks.autoLunch && isWeekday(S.date) ? `<button type="button" class="placebtn ${away ? "on" : ""}" data-away="${away ? "home" : "away"}">${away ? `🏫 ${esc(ks.place)}` : "🏠 집에서 먹음"} <small>바꾸기</small></button>` : ""}</div>
      ${away ? `<p class="tiny">${esc(ks.place)}에서 먹었어요. 반응만 눌러 주세요.</p>` : `
      <input class="in kmenu" data-kmenu="${k}" value="${esc(sl.menu || "")}" placeholder="무엇을 먹었나요?" autocomplete="off" enterkeyhint="done">
      ${chips.length ? `<div class="kchips">${chips.filter(c => !used.includes(c)).slice(0, 6).map(c => `<button type="button" class="chip sm" data-kchip="${k}" data-v="${esc(c)}">＋ ${esc(c)}</button>`).join("")}</div>` : ""}`}
      <div class="react">${KMOODS.map(([v, e, l]) => `<button type="button" data-kmood="${k}" data-v="${v}" aria-pressed="${sl.mood === v}"><span>${e}</span>${l}</button>`).join("")}</div>
    </div>`;
  };
  const tag = (arr, cls) => arr.length ? arr.map(([n, c]) => `<span class="ftag ${cls}">${esc(n)} <small class="num">${c}</small></span>`).join("") : `<span class="tiny">기록이 쌓이면 여기에 보여요</span>`;
  const mtag = (arr, cls) => arr.length ? arr.map(([n, r]) => `<span class="ftag ${cls}">${esc(n)} <small class="num">😋${r.great}${r.no ? ` 🙅${r.no}` : ""}</small></span>`).join("") : `<span class="tiny">기록이 쌓이면 여기에 보여요</span>`;
  return `${kidsHead("kihun")}
  ${dateNav()}
  ${KSLOT.map(slotCard).join("")}
  <div class="card">
    <input class="in" id="kmemo" value="${esc(doc.memo || "")}" placeholder="📝 오늘 한 줄 메모 (선택)" autocomplete="off">
  </div>
  <div class="card">
    <div class="sec-h"><h2>😋 기훈이가 좋아하는 것</h2></div>
    <div class="ftags">${mtag(likes, "like")}</div>
    <div class="sec-h"><h2>🍽️ 요즘 자주 먹은 것</h2><small>최근 7일</small></div>
    <div class="ftags">${tag(often, "")}</div>
    ${nope.length ? `<div class="sec-h"><h2>🙅 잘 안 먹는 것</h2></div><div class="ftags">${mtag(nope, "nope")}</div>` : ""}
    ${mixed.length ? `<div class="sec-h"><h2>🤔 그날그날 달라요</h2></div><div class="ftags">${mtag(mixed, "")}</div>` : ""}
  </div>
  ${kidStock("kihun")}`;
}
function saveMeal(child, patchData, quiet) {
  const id = `${child}_${S.date}`;
  const cur = S.meals[id] || {};
  const doc = { ...cur, ...patchData, child, date: S.date, by: S.user.name };
  delete doc.id;
  S.meals[id] = { id, ...doc }; if (!quiet) render();
  return D.put("meals", id, doc).catch(writeErr);
}
function saveSlot(k, patch, quiet) {
  const cur = mealDoc("kihun", S.date)[k] || {};
  saveMeal("kihun", { [k]: { ...cur, ...patch } }, quiet);
}

/* 태훈 이유식: 만든 이유식(냉장) + 하루 횟수 체크 */
const babyItems = () => S.items.filter(i => i.baby).sort((a, b) => (a.madeOn || "") < (b.madeOn || "") ? -1 : 1);
const stageInfo = st => STAGES.find(x => x[0] === st) || STAGES[0];
function feedsOf(date) { return mealDoc("taehun", date).feeds || []; }
function needMake() {
  const ks = kidSet(); if (!S.ready) return false;
  const left = babyItems().filter(i => (dday(i.expiry) ?? 0) >= 1).reduce((a, i) => a + (i.qty || 0), 0);
  const todayLeft = Math.max(0, ks.times - feedsOf(today()).length);
  const leftNow = babyItems().reduce((a, i) => a + (i.qty || 0), 0);
  return leftNow - todayLeft < ks.times && left - todayLeft < ks.times;
}
function babyName(ings, stage) {
  const suf = stageInfo(stage)[2];
  const main = ings.filter(x => x !== "쌀");
  return main.length ? `${main.join(" ")} ${suf}` : `쌀${suf}`;
}
function vTaehun() {
  const ks = kidSet(), feeds = feedsOf(S.date), batches = babyItems();
  const slots = Array.from({ length: ks.times }, (_, i) => feeds[i]);
  const logs = [...S.babyLog].sort((a, b) => (a.madeOn || "") < (b.madeOn || "") ? 1 : -1).slice(0, 5);
  return `${kidsHead("taehun")}
  <button type="button" class="stagebar" data-act="stage"><b>${esc(ks.stage)}</b> 하루 ${ks.times}회 · 냉장 ${ks.keepDays}일 <small>바꾸기 ›</small></button>
  ${dateNav()}
  <div class="card">
    <div class="sec-h"><h2>✅ ${S.date === today() ? "오늘" : md(S.date)} 먹인 횟수</h2><small>누르면 한 통 줄어요</small></div>
    <div class="feeds">${slots.map((f, i) => `<button type="button" class="feed ${f ? "done" : ""}" data-feed="${i}"><span class="ck">${f ? "✓" : i + 1}</span><span class="fl">${f ? esc(f.name) : `${i + 1}회차`}</span>${f && f.at ? `<small>${esc(f.at)}</small>` : ""}</button>`).join("")}</div>
  </div>
  ${needMake() ? `<div class="makecard"><img src="img/m-juk.png" alt=""><div><b>이유식 만들 차례예요</b><p>냉장고 이유식은 오늘이 마지막이에요</p></div></div>` : ""}
  <div class="card">
    <div class="sec-h"><h2><img class="h2ic" src="img/m-juk.png" alt="">냉장고 속 이유식</h2><button type="button" class="btn sm primary" data-act="make">${svg("plus")} 만들기</button></div>
    <div class="items">${batches.length ? batches.map(b => `<div class="item baby">
      <span class="fic">${pic("m-juk")}</span>
      <button type="button" class="info" data-edit="${esc(b.id)}"><b>${esc(b.name)}</b><span>${b.madeOn ? md(b.madeOn) + " 만듦 · " : ""}${b.total ? `${b.total}통 중 ` : ""}${b.qty}통 남음</span></button>
      <div class="right">${badge(b.expiry)}<span class="step"><button type="button" data-q="${esc(b.id)}" data-d="-1" aria-label="한 통 빼기">−</button><output class="num">${b.qty}</output><button type="button" data-q="${esc(b.id)}" data-d="1" aria-label="한 통 더">＋</button></span></div></div>`).join("")
      : `<div class="empty small">냉장고에 이유식이 없어요.<br>'만들기'를 눌러 주세요.</div>`}</div>
  </div>
  ${kidStock("taehun")}
  ${logs.length ? `<div class="card"><div class="sec-h"><h2>📒 최근 만든 이유식</h2><small>누르면 다시 만들기</small></div>
    <div class="mini">${logs.map(l => `<button type="button" data-remake="${esc(l.id)}"><span class="d num">${md(l.madeOn)}</span><span>${esc(l.name)}${(l.newIng || []).length ? ` <em class="newt">새 재료 ${esc(l.newIng.join(", "))}</em>` : ""}</span><span>↻</span></button>`).join("")}</div></div>` : ""}
  ${ks.useCube && ks.stage !== "초기" ? `<button type="button" class="cubelink" data-go="cube"><img src="img/i-cube.png" alt="">이유식 큐브 재고 보기 <b>›</b></button>` : ""}`;
}
function toggleFeed(i) {
  const feeds = [...feedsOf(S.date)];
  if (feeds[i]) {
    const f = feeds[i]; feeds.splice(i, 1);
    saveMeal("taehun", { feeds });
    const it = S.items.find(x => x.id === f.itemId);
    if (it) D.patch("items", it.id, { qty: (it.qty || 0) + 1 }).catch(writeErr);
    else if (f.snap) D.put("items", f.itemId, { ...f.snap, qty: 1 }).catch(writeErr);
    return toast("체크를 풀고 한 통 되돌렸어요");
  }
  const avail = babyItems().filter(b => (b.qty || 0) > 0);
  if (!avail.length) { toast("냉장고에 이유식이 없어요"); return openMake(); }
  const doFeed = b => {
    const now = new Date(), at = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
    const { id, ...snap } = b;
    feeds.push({ itemId: b.id, name: b.name, at: S.date === today() ? at : "", snap });
    saveMeal("taehun", { feeds });
    changeQty(b.id, -1, true);
    closeSheet(); toast(`${b.name} 냠냠 ✓ (남은 ${Math.max(0, (b.qty || 1) - 1)}통)`);
  };
  if (avail.length === 1) return doFeed(avail[0]);
  openSheet(`${sheetHead("어떤 이유식을 먹였나요?")}<div class="menu">${avail.map(b => `<button type="button" data-pickb="${esc(b.id)}">${pic("m-juk").replace('class="fimg"', 'class="fimg" style="width:30px;height:30px"')}${esc(b.name)} <small class="tiny" style="margin-left:auto">${b.qty}통</small></button>`).join("")}</div>`);
  $("#sheet").onclick = e => { const p = e.target.closest("[data-pickb]"); if (p) doFeed(avail.find(b => b.id === p.dataset.pickb)); };
}
function triedFoods(child) {
  const set = new Set();
  S.challenges.filter(c => c.child === child).forEach(c => set.add(c.food));
  if (child === "taehun") S.babyLog.forEach(l => (l.ingredients || []).forEach(x => set.add(x)));
  return set;
}
function openMake(pre) {
  const ks = kidSet();
  const tried = triedFoods("taehun");
  const st = { ings: [...(pre && pre.ingredients || ["쌀"])], fresh: new Set(), count: 3, madeOn: today(), name: "", autoName: true };
  st.ings.forEach(x => { if (!tried.has(x)) st.fresh.add(x); });
  const mine = [...new Set(S.items.filter(i => i.for === "taehun" && !i.baby).map(i => i.name.replace(/\s+/g, "")))];
  const all = () => [...new Set([...mine, ...BABY_ING, ...tried, ...st.ings])];
  openSheet(`${sheetHead("🍚 이유식 만들기")}
    <p class="tiny hint">재료를 누르면 이름이 자동으로 지어져요.<br>★ 처음 먹는 재료는 도전 기록에 남아요.${mine.length ? "<br>🧺 표시는 태훈이 꺼로 사 둔 재료예요." : ""}</p>
    <div class="ingchips" id="ingAll"></div>
    <div data-form class="row" id="ingForm" style="gap:6px"><input class="in" id="ingIn" placeholder="다른 재료 추가" autocomplete="off"><button class="btn sm primary" type="button" data-submit>추가</button></div>
    <div class="f"><span class="tiny">넣은 재료 · ☆를 누르면 '처음 먹는 재료'</span><div class="ingsel" id="ingSel"></div></div>
    <label class="f"><span>이름</span><input class="in" id="mkName" autocomplete="off"></label>
    <div class="fgrid">
      <label class="f"><span>몇 통</span><span class="step"><button type="button" id="mkM">−</button><output class="num" id="mkC">3</output><button type="button" id="mkP">＋</button></span></label>
      <label class="f"><span>만든 날</span><input class="in num" type="date" id="mkD" value="${today()}"></label>
    </div>
    <p class="tiny" id="mkH" style="margin:0"></p>
    <div class="actions" style="grid-template-columns:1fr 1.4fr"><button class="btn line" type="button" data-close>취소</button><button class="btn pink" type="button" id="mkS">냉장고에 넣기</button></div>`);
  const paint = () => {
    $("#ingAll").innerHTML = all().map(x => `<button type="button" class="chip ${st.ings.includes(x) ? "on" : ""} ${mine.includes(x) ? "mine" : ""}" data-ing="${esc(x)}">${mine.includes(x) ? "🧺 " : ""}${esc(x)}${tried.has(x) ? "" : ' <small class="newdot">new</small>'}</button>`).join("");
    $("#ingSel").innerHTML = st.ings.length ? st.ings.map(x => `<button type="button" class="chip ${st.fresh.has(x) ? "fresh" : ""}" data-star="${esc(x)}">${st.fresh.has(x) ? "★" : "☆"} ${esc(x)}</button>`).join("") : `<span class="tiny">위에서 재료를 골라 주세요</span>`;
    if (st.autoName) { st.name = babyName(st.ings, ks.stage); $("#mkName").value = st.name; }
    $("#mkC").textContent = st.count;
    $("#mkH").textContent = `냉장 보관 ${ks.keepDays}일 → ${md(addDays(st.madeOn, ks.keepDays))}까지 · 하루 ${ks.times}회면 ${Math.ceil(st.count / ks.times)}일분이에요`;
  };
  paint();
  $("#ingAll").onclick = e => { const b = e.target.closest("[data-ing]"); if (!b) return; const x = b.dataset.ing;
    if (st.ings.includes(x)) { st.ings = st.ings.filter(y => y !== x); st.fresh.delete(x); } else { st.ings.push(x); if (!tried.has(x)) st.fresh.add(x); } paint(); };
  $("#ingSel").onclick = e => { const b = e.target.closest("[data-star]"); if (!b) return; const x = b.dataset.star; st.fresh.has(x) ? st.fresh.delete(x) : st.fresh.add(x); paint(); };
  $("#ingForm").onsubmit = e => { e.preventDefault(); const v = $("#ingIn").value.trim(); if (!v) return; if (!st.ings.includes(v)) { st.ings.push(v); if (!tried.has(v)) st.fresh.add(v); } $("#ingIn").value = ""; paint(); };
  $("#mkName").oninput = e => { st.autoName = false; st.name = e.target.value; };
  $("#mkM").onclick = () => { st.count = Math.max(1, st.count - 1); paint(); };
  $("#mkP").onclick = () => { st.count = Math.min(20, st.count + 1); paint(); };
  $("#mkD").onchange = e => { st.madeOn = e.target.value || today(); paint(); };
  $("#mkS").onclick = () => {
    if (!st.ings.length) return toast("재료를 하나 이상 골라 주세요");
    const name = (st.name || babyName(st.ings, ks.stage)).trim(), id = D.newId();
    D.put("items", id, { name, icon: "m-juk", zone: "fridge", qty: st.count, total: st.count, expiry: addDays(st.madeOn, ks.keepDays), baby: true, ingredients: st.ings, madeOn: st.madeOn, addedBy: S.user.name, addedAt: today() }).catch(writeErr);
    const fresh = [...st.fresh];
    D.put("babyLog", D.newId(), { name, ingredients: st.ings, newIng: fresh, madeOn: st.madeOn, count: st.count, stage: ks.stage, by: S.user.name }).catch(() => {});
    fresh.forEach(f => { if (!S.challenges.some(c => c.child === "taehun" && c.food === f)) D.put("challenges", D.newId(), { child: "taehun", food: f, date: st.madeOn, status: "watch", memo: `${name}에 처음 넣음`, by: S.user.name }).catch(() => {}); });
    closeSheet(); toast(`${name} ${st.count}통을 냉장실에 넣었어요${fresh.length ? ` · 새 재료 ${fresh.length}개 도전 기록에 추가` : ""}`);
  };
}
function openStage() {
  const ks = kidSet(); let st = { ...ks };
  openSheet(`${sheetHead("🍼 이유식 단계")}
    <div class="stages" id="stg">${STAGES.map(([n, t, suf]) => `<button type="button" data-stg="${n}" aria-pressed="${st.stage === n}"><b>${n}</b><small>하루 ${t}회 · ${suf}</small></button>`).join("")}</div>
    <div class="fgrid">
      <label class="f"><span>하루 횟수</span><span class="step"><button type="button" id="tM">−</button><output class="num" id="tC">${st.times}</output><button type="button" id="tP">＋</button></span></label>
      <label class="f"><span>냉장 보관 일수</span><span class="step"><button type="button" id="kM">−</button><output class="num" id="kC">${st.keepDays}</output><button type="button" id="kP">＋</button></span></label>
    </div>
    <p class="tiny hint">단계를 고르면 횟수가 자동으로 바뀌어요.<br>아기에 맞게 직접 고쳐도 돼요.</p>
    <div class="actions"><button class="btn line" type="button" data-close>취소</button><button class="btn pink" type="button" id="stS">저장</button></div>`);
  const paint = () => { $$("#stg [data-stg]").forEach(b => b.setAttribute("aria-pressed", b.dataset.stg === st.stage)); $("#tC").textContent = st.times; $("#kC").textContent = st.keepDays; };
  $("#stg").onclick = e => { const b = e.target.closest("[data-stg]"); if (!b) return; st.stage = b.dataset.stg; st.times = stageInfo(st.stage)[1]; paint(); };
  $("#tM").onclick = () => { st.times = Math.max(1, st.times - 1); paint(); }; $("#tP").onclick = () => { st.times = Math.min(5, st.times + 1); paint(); };
  $("#kM").onclick = () => { st.keepDays = Math.max(1, st.keepDays - 1); paint(); }; $("#kP").onclick = () => { st.keepDays = Math.min(7, st.keepDays + 1); paint(); };
  $("#stS").onclick = () => { saveKidSet({ stage: st.stage, times: st.times, keepDays: st.keepDays }); closeSheet(); toast(`${st.stage} · 하루 ${st.times}회로 바꿨어요`); };
}

/* 알레르기·처음 먹는 음식 도전 기록 */
function vChallenge() {
  const list = [...S.challenges].sort((a, b) => (a.date || "") < (b.date || "") ? 1 : -1);
  const n = k => list.filter(c => c.status === k).length;
  const row = c => { const s = CH_STATUS.find(x => x[0] === c.status) || CH_STATUS[0];
    return `<div class="chrow"><button type="button" class="chst ${c.status}" data-chcycle="${esc(c.id)}">${s[1]} ${s[2]}</button>
      <div class="chinfo"><b>${esc(c.food)}</b><span>${c.date ? md(c.date) : ""}${c.memo ? " · " + esc(c.memo) : ""}</span></div>
      <button type="button" class="x sm" data-chdel="${esc(c.id)}" aria-label="지우기">✕</button></div>`; };
  const group = (who, label) => { const g = list.filter(c => c.child === who);
    return `<div class="card"><div class="sec-h"><h2>${label}</h2><small>${g.length}개</small></div>${g.length ? g.map(row).join("") : `<div class="empty small">아직 기록이 없어요</div>`}</div>`; };
  return `${kidsHead("challenge")}
  <div class="mstats ch"><span class="ms s3">😊 괜찮아요 <b class="num">${n("ok")}</b></span><span class="ms s2">👀 지켜보는 중 <b class="num">${n("watch")}</b></span><span class="ms s1">⚠️ 반응 <b class="num">${n("bad")}</b></span></div>
  <div class="card">
    <div class="sec-h"><h2>🌱 새로 도전하기</h2></div>
    <div class="who" id="chWho"><button type="button" class="chip on" data-who="kihun">기훈</button><button type="button" class="chip" data-who="taehun">태훈</button></div>
    <div class="fgrid">
      <label class="f"><span>음식·재료</span><input class="in" id="chFood" placeholder="예: 땅콩, 새우" autocomplete="off"></label>
      <label class="f"><span>날짜</span><input class="in num" type="date" id="chDate" value="${today()}"></label>
      <label class="f wide"><span>메모 (선택)</span><input class="in" id="chMemo" placeholder="예: 1/4 숟가락, 입 주변 빨개짐" autocomplete="off"></label>
    </div>
    <div class="react" id="chSt">${CH_STATUS.map(([k, e, l], i) => `<button type="button" data-chst="${k}" aria-pressed="${i === 0}"><span>${e}</span>${l}</button>`).join("")}</div>
    <div class="right-actions"><button type="button" class="btn pink" id="chSave">기록하기</button></div>
  </div>
  <p class="tiny hint">상태를 누르면 지켜보는 중 → 괜찮아요 → 반응 있어요로 바뀌어요.</p>
  ${group("kihun", "기훈")}
  ${group("taehun", "태훈")}`;
}

/* ---------- 이유식 큐브 ---------- */
const cubeArt = name => { for (const [re, a, b] of CUBEART) if (re.test(name)) return [a, b]; return ["i-cube", null]; };
function vCube() {
  const cubes = [...S.cubes].sort((a, b) => (a.useBy || "9") < (b.useBy || "9") ? -1 : 1);
  const total = cubes.reduce((s, c) => s + (c.count || 0), 0);
  const wk = addDays(today(), -6);
  const week = cubes.filter(c => (c.madeOn || "") >= wk).reduce((s, c) => s + (c.made || 0), 0);
  const low = cubes.filter(c => (c.count || 0) > 0 && ((c.count || 0) <= 3 || (dday(c.useBy) ?? 99) <= 3)).length;
  const T = S.cubeTab;
  const prep = prepItems();
  const head = `
  ${phead("이유식 큐브", "남은 개수와 사용기한", [["tae-bunny", "mid"]])}`;
  const prepBox = () => `
    <div class="card prepcard"><div class="sec-h"><h2 style="font-size:18px">🥕 준비할 재료</h2><small>사거나 손질할 것</small></div>
      <div class="checks list">${prep.map((p, i) => `<label class="ck ${p.done ? "done" : ""}"><input type="checkbox" data-pi="${i}" ${p.done ? "checked" : ""}><span>${esc(p.t)}</span>${p.amt ? `<em>${esc(p.amt)}</em>` : ""}<button type="button" data-pdel="${i}" aria-label="지우기">✕</button></label>`).join("") || `<span class="tiny">큐브 만들 재료를 적어 두면<br>둘이 같이 보고 체크할 수 있어요.</span>`}</div>
      <div data-form class="row" id="prepForm" style="margin-top:10px"><input class="in" id="prepT" placeholder="재료 (예: 감자)" autocomplete="off" style="flex:1.4;min-width:0"><input class="in" id="prepA" placeholder="양 (선택)" autocomplete="off" style="flex:1;min-width:0"><button class="btn sm primary" type="button" data-submit style="flex:none">추가</button></div>
    </div>`;
  if (T === "log") {
    const logs = [...S.logs].sort((a, b) => (a.at || "") < (b.at || "") ? 1 : -1).slice(0, 60);
    const byDay = {};
    logs.forEach(l => (byDay[l.date] = byDay[l.date] || []).push(l));
    return head + `<div class="card"><div class="sec-h"><h2 style="font-size:19px">📋 큐브 사용 기록</h2><small>태훈 이유식에서 꺼내 쓴 기록이에요</small></div>
      ${Object.keys(byDay).length ? Object.entries(byDay).map(([d, ls]) => `<div><h3 style="font-size:15px;color:var(--z-fridge);margin-bottom:6px">${longDate(d)}</h3>
        <div class="mini">${ls.map(l => `<button type="button" data-date="${d}" data-go="taehun"><span class="d">${esc(l.slotLabel || "")}</span><span>${esc(l.name)} 큐브 ${l.n || 1}개 · ${esc(l.by || "")}</span><span>›</span></button>`).join("")}</div></div>`).join("")
      : `<div class="empty small">아직 사용 기록이 없어요.</div>`}</div>`;
  }
  return head + `
  <div class="cstats">
    <div class="cstat a"><img src="img/i-cube.png" alt=""><span>총 큐브<b class="num">${total}개</b></span></div>
    <div class="cstat b"><span class="em">📅</span><span>이번 주<b class="num">${week}개</b></span></div>
    <div class="cstat c"><span class="em">⚠️</span><span>곧 소진<b class="num">${low}개</b></span></div>
  </div>
  ${cubes.length ? `<div class="cubes">${cubes.map((c, i) => {
    const [cb, ch] = cubeArt(c.name); const k = ["cube-beef", "cube-broccoli2", "cube-zucchini2", "cube-carrot"].indexOf(cb);
    return `<button type="button" class="cube k${k < 0 ? 2 : k}" data-cube="${esc(c.id)}">
      <span class="art ${ch ? "" : "solo"}"><img class="cb" src="img/${cb}.png" alt="">${ch ? `<img class="ch" src="img/${ch}.png" alt="">` : ""}</span>
      <span style="display:flex;flex-direction:column;gap:4px;min-width:0"><h3>${esc(c.name)} 큐브 <span style="color:var(--acc)">›</span></h3>
      <dl><dt>🧊 남은 개수</dt><dd class="big num">${c.count || 0}개</dd><dt>📅 제조일</dt><dd class="num">${c.madeOn ? c.madeOn.replace(/-/g, ".") : "-"}</dd>
        <dt>📍 보관 위치</dt><dd class="fz">❄️ 냉동실</dd><dt>⏰ 사용기한</dt><dd class="num">${c.useBy ? c.useBy.replace(/-/g, ".") : "-"}</dd></dl>
      ${badge(c.useBy)}</span></button>`;
  }).join("")}</div>` : `<div class="card"><div class="empty"><img src="img/i-cube.png" alt=""><div><b>아직 만든 큐브가 없어요</b><p>소고기, 브로콜리, 애호박, 당근처럼 얼려 둔 큐브를 등록해 보세요.</p></div></div></div>`}
  ${prepBox()}
  <div class="actions" style="grid-template-columns:1fr">
    <button class="btn primary" type="button" data-act="addCube">${svg("plus")} 큐브 추가</button>
  </div>`;
}

/* ---------- 캘린더 ---------- */
function vCal() {
  const [y, m] = S.calMonth.split("-").map(Number);
  const first = new Date(y, m - 1, 1), start = new Date(first); start.setDate(1 - first.getDay());
  const by = {};
  S.items.forEach(i => { if (i.expiry) (by[i.expiry] = by[i.expiry] || []).push("z-" + (i.zone || "fridge")); });
  S.cubes.forEach(c => { if (c.useBy && (c.count || 0) > 0) (by[c.useBy] = by[c.useBy] || []).push("cube"); });
  let g = WD.map(w => `<div class="dow">${w}</div>`).join("");
  for (let k = 0; k < 42; k++) {
    const d = new Date(start); d.setDate(start.getDate() + k); const s = ymd(d);
    if (k >= 35 && d.getMonth() !== m - 1) break;
    const dots = (by[s] || []).slice(0, 6).map(c => `<i class="dt ${c}"></i>`).join("");
    const km = S.meals["kihun_" + s], tm = S.meals["taehun_" + s];
    const kOn = km && (km.memo || KSLOT.some(([k]) => km[k] && (km[k].menu || km[k].mood))), tOn = tm && (tm.feeds || []).length;
    const face = src => `<img src="img/${src}.png" alt="" style="width:14px;height:14px;object-fit:contain;display:block">`;
    const meal = (kOn ? face("ki-sit") : "") + (tOn ? face("tae-clap") : "");
    g += `<button type="button" class="day num ${d.getMonth() !== m - 1 ? "out" : ""} ${s === today() ? "today" : ""}" data-day="${s}" aria-pressed="${s === S.calDay}">${d.getDate()}<span class="dots" style="align-items:center">${dots}${meal}</span></button>`;
  }
  const its = S.items.filter(i => i.expiry === S.calDay);
  const cbs = S.cubes.filter(c => c.useBy === S.calDay && (c.count || 0) > 0);
  const k = S.meals["kihun_" + S.calDay], t = S.meals["taehun_" + S.calDay];
  return `
  ${phead("캘린더", "날짜를 누르면 그날 기한이 보여요", [["ki-overall", "big"], ["tae-bear", "mid"]])}
  <div class="card">
    <div class="datenav month"><button type="button" data-cm="-1" aria-label="이전 달">‹</button><b class="num">${y}년 ${m}월</b><button type="button" data-cm="1" aria-label="다음 달">›</button></div>
    <div class="cal">${g}</div>
    <div class="legend">${ZORDER.map(z => `<span class="z-${z}"><i class="dt"></i>${ZONES[z].label}</span>`).join("")}<span><i class="dt" style="background:var(--sub)"></i>큐브</span><span><img src="img/ki-sit.png" alt="" style="width:14px;height:14px;object-fit:contain;vertical-align:-2px"><img src="img/tae-clap.png" alt="" style="width:14px;height:14px;object-fit:contain;vertical-align:-2px;margin-right:2px">식사 기록</span></div>
  </div>
  <div class="card"><div class="sec-h"><h2 style="font-size:19px">${longDate(S.calDay)}</h2></div>
    <div class="items">${its.map(itemRow).join("")}${cbs.map(c => `<div class="item"><span class="fic">${pic(cubeArt(c.name)[0])}</span><span class="info"><b>${esc(c.name)} 큐브</b><span>남은 ${c.count}개 · 추천 사용기한</span></span><div class="right">${badge(c.useBy)}</div></div>`).join("")}</div>
    ${!its.length && !cbs.length ? `<div class="empty small">이 날 기한이 끝나는 식품이 없어요.</div>` : ""}
    ${k || t ? `<div class="mini">${k ? `<button type="button" data-date="${S.calDay}" data-go="kihun"><span class="d">기훈</span><span>${esc(KSLOT.map(([s, l]) => k[s] && k[s].menu ? `${l} ${k[s].menu}` : "").filter(Boolean).join(" · ") || "기록 있음")}</span><span>›</span></button>` : ""}${t && (t.feeds || []).length ? `<button type="button" data-date="${S.calDay}" data-go="taehun"><span class="d">태훈</span><span>이유식 ${t.feeds.length}회 · ${esc([...new Set(t.feeds.map(f => f.name))].join(", "))}</span><span>›</span></button>` : ""}</div>` : ""}
  </div>`;
}

/* ---------- 가족 설정 ---------- */
function vFamily() {
  const me = S.user.name;
  const fav = (S.meta.settings && S.meta.settings.favZones) || ZORDER;
  const p = S.prefs;
  return `
  ${phead("우리 가족", "함께 쓰는 냉장고", [["ki-heart", "big"], ["tae-dog", "mid"]])}
  <div class="card">
    <div class="fam">
      <div class="mem p1 ${me === "홍교" ? "me" : ""}"><span class="av pic dad"><img src="img/dad.png" alt=""></span><b>홍교</b><span class="role">아빠</span></div>
      <div class="mem p2 ${me === "해리" ? "me" : ""}"><span class="av pic mom"><img src="img/mom.png" alt=""></span><b>해리</b><span class="role">엄마</span></div>
      <div class="mem p3"><span class="av pic"><img src="img/ki-sit.png" alt=""></span><b>기훈</b><span class="role">형아</span></div>
      <div class="mem p4"><span class="av pic tae"><img src="img/tae-clap.png" alt=""></span><b>태훈</b><span class="role">아기</span></div>
    </div>
    ${D.demo ? `<div class="row"><span class="tiny">체험 모드에서 쓰는 사람:</span><button class="chip ${me === "해리" ? "on" : ""}" type="button" data-me="해리">해리</button><button class="chip ${me === "홍교" ? "on" : ""}" type="button" data-me="홍교">홍교</button></div>`
      : `<p class="tiny" style="margin:0">${esc(S.user.email)} 로 로그인했어요.</p>`}
  </div>
  <div class="card">
    <div class="sec-h"><h2>🏫 기훈이 다니는 곳</h2></div>
    <div data-form class="row" id="placeForm" style="gap:6px"><input class="in" id="placeIn" value="${esc(kidSet().place)}" placeholder="어린이집, 유치원…" autocomplete="off"><button class="btn sm primary" type="button" data-submit>저장</button></div>
    <label class="tg" style="border:0;padding:4px 0"><span class="tic">🍱</span><span><b>평일 점심은 기관에서</b><small>켜 두면 점심이 자동으로 채워져요</small></span><input class="sw" type="checkbox" id="autoLunch" ${kidSet().autoLunch ? "checked" : ""}></label>
  </div>
  <div class="card">
    <div class="sec-h"><h2>🔔 알림</h2><small>이 휴대폰에만 적용</small></div>
    <div class="toggles">
      <label class="tg"><span class="tic">📅</span><span><b>유통기한 임박 알림</b><small>앱을 열 때 알려 줘요</small></span><input class="sw" type="checkbox" data-pref="soon" ${p.soon ? "checked" : ""}></label>
      <label class="tg"><span class="tic">📦</span><span><b>가족이 넣으면 알림</b><small>새 식품이 들어오면 알려 줘요</small></span><input class="sw" type="checkbox" data-pref="newItem" ${p.newItem ? "checked" : ""}></label>
      <label class="tg"><span class="tic">🔕</span><span><b>하루 한 번만</b><small>임박 알림을 하루 한 번만</small></span><input class="sw" type="checkbox" data-pref="daily" ${p.daily ? "checked" : ""}></label>
    </div>
  </div>
  <div class="card">
    <div class="sec-h"><h2>📖 우리 집 약속</h2></div>
    <ul class="rules2">${houseRules().map((r, i) => `<li><span>${esc(r)}</span><button type="button" class="x sm" data-ruledel="${i}" aria-label="지우기">✕</button></li>`).join("") || `<li class="tiny">아직 약속이 없어요</li>`}</ul>
    <div data-form class="row" id="ruleForm" style="gap:6px"><input class="in" id="ruleIn" placeholder="새 약속 적기 (예: 🍌 바나나는 실온에)" autocomplete="off"><button class="btn sm primary" type="button" data-submit>추가</button></div>
  </div>
  <div class="card">
    <div class="sec-h"><h2><img class="h2ic" src="img/i-cube.png" alt="">이유식 큐브</h2></div>
    <label class="tg" style="border:0;padding:0"><span class="tic"><img src="img/i-cube.png" alt="" style="width:28px;height:24px;object-fit:contain"></span><span><b>이유식 큐브 쓰기</b><small>끄면 메뉴와 화면에서 숨겨요 (기록은 남아요)</small></span><input class="sw" type="checkbox" id="useCube" ${kidSet().useCube ? "checked" : ""}></label>
  </div>
  <div class="card">
    <div class="sec-h"><h2>⭐ 자주 쓰는 칸</h2><small>목록에 보일 칸</small></div>
    <div class="chips">${ZORDER.map(z => `<button type="button" class="chip zchip z-${z} ${fav.includes(z) ? "on" : ""}" data-fav="${z}">${ZONES[z].ic} ${ZONES[z].label}${fav.includes(z) ? ' <span class="ck"></span>' : ""}</button>`).join("")}</div>
  </div>
  <button class="invite" type="button" data-act="invite"><img src="img/bro-walk.png" alt=""><span><b>가족 초대하기</b><small>주소를 보내 함께 써요</small></span></button>
  ${D.demo ? "" : `<button class="btn line" type="button" data-act="logout">로그아웃</button>`}`;
}

/* =========================================================
   그린 뒤 연결 (입력칸·파일·드래그)
   ========================================================= */
function after() {
  const q = $("#q");
  if (q) {
    // 한글은 글자를 조합하는 동안 화면을 다시 그리면 자모가 흩어져요. 목록만 바꾸고 입력칸은 건드리지 않아요.
    const upd = () => { S.query = q.value.trim(); const box = $("#listItems"); if (box) box.innerHTML = listItemsHTML(); };
    q.addEventListener("input", upd);
    q.addEventListener("compositionend", upd);
  }
  const rf = $("#rfile"); if (rf) rf.onchange = onReceiptFile;
  const ra = $("#radd"); if (ra) ra.onsubmit = e => { e.preventDefault(); const v = $("#raddIn").value.trim(); if (v) { addFound([{ name: v }]); } };
  const rn = $("#rname"); if (rn) rn.oninput = () => { S.rc.name = rn.value; };
  const rx = $("#rexp"); if (rx) rx.onchange = () => { S.rc.exp = rx.value; };
  // 기훈: 메뉴 칸은 입력이 끝나면 저장 (한글 조합 중엔 화면을 다시 그리지 않아요)
  $$("[data-kmenu]").forEach(inp => inp.addEventListener("change", () => saveSlot(inp.dataset.kmenu, { menu: inp.value.trim() }, true)));
  const km = $("#kmemo"); if (km) km.addEventListener("change", () => saveMeal("kihun", { memo: km.value.trim() }, true));
  // 도전 기록 입력
  const chS = $("#chSave");
  if (chS) {
    let who = "kihun", st = "watch";
    $("#chWho").onclick = e => { const b = e.target.closest("[data-who]"); if (!b) return; who = b.dataset.who; $$("#chWho [data-who]").forEach(x => x.classList.toggle("on", x === b)); };
    $("#chSt").onclick = e => { const b = e.target.closest("[data-chst]"); if (!b) return; st = b.dataset.chst; $$("#chSt [data-chst]").forEach(x => x.setAttribute("aria-pressed", x === b)); };
    chS.onclick = () => {
      const food = $("#chFood").value.trim(); if (!food) { $("#chFood").focus(); return toast("음식이나 재료 이름을 적어 주세요"); }
      D.put("challenges", D.newId(), { child: who, food, date: $("#chDate").value || today(), status: st, memo: $("#chMemo").value.trim(), by: S.user.name }).catch(writeErr);
      toast(`${who === "kihun" ? "기훈" : "태훈"} · ${food} 기록했어요`);
    };
  }
  const plf = $("#placeForm"); if (plf) plf.onsubmit = e => { e.preventDefault(); const v = $("#placeIn").value.trim() || "어린이집"; saveKidSet({ place: v }); toast(`평일 점심은 '${v}'로 들어가요`); };
  const al = $("#autoLunch"); if (al) al.onchange = () => saveKidSet({ autoLunch: al.checked });
  const uc = $("#useCube"); if (uc) uc.onchange = () => { saveKidSet({ useCube: uc.checked }); toast(uc.checked ? "이유식 큐브를 다시 보여줘요" : "이유식 큐브를 숨겼어요"); };
  const rf2 = $("#ruleForm"); if (rf2) rf2.onsubmit = e => { e.preventDefault(); const v = $("#ruleIn").value.trim(); if (v) saveRules([...houseRules(), v]); };
  const pf = $("#prepForm"); if (pf) pf.onsubmit = e => {
    e.preventDefault(); const t = $("#prepT").value.trim(); if (!t) return;
    savePrep([...prepItems(), { t, amt: $("#prepA").value.trim(), done: false }]);
  };
}

/* =========================================================
   클릭 처리 (한 곳에서)
   ========================================================= */
// 입력칸 옆 '추가/확인/저장' 버튼과 Enter 키 → 그 칸의 onsubmit 실행
function runForm(f) { if (f && typeof f.onsubmit === "function") f.onsubmit({ preventDefault() {} }); }
document.addEventListener("keydown", e => {
  if (e.key !== "Enter" || e.isComposing || e.keyCode === 229) return;
  const f = e.target.closest && e.target.closest("[data-form]");
  if (f && e.target.matches("input")) { e.preventDefault(); runForm(f); }
});
document.addEventListener("click", e => {
  const sb = e.target.closest("[data-submit]");
  if (sb) { e.preventDefault(); return runForm(sb.closest("[data-form]")); }
}, true);
document.addEventListener("click", e => {
  const t = e.target;
  if (t.closest("#scrim") && (t.id === "scrim" || t.closest("[data-close]"))) return closeSheet();
  const g = t.closest("[data-go]");
  if (g) {
    if (g.dataset.date) S.date = g.dataset.date;
    if (g.dataset.ctab) S.cubeTab = g.dataset.ctab;
    closeSheet(); return go(g.dataset.go);
  }
  const ct = t.closest("[data-ctab]"); if (ct) { S.cubeTab = ct.dataset.ctab; return render(); }
  const li = t.closest("[data-list]"); if (li) { S.listFilter = li.dataset.list; return go("list"); }
  const zh = t.closest("[data-zone]"); if (zh) { S.listFilter = zh.dataset.zone; return go("list"); }
  const lf = t.closest("[data-lf]"); if (lf) { S.listFilter = lf.dataset.lf; return render(); }
  const ed = t.closest("[data-edit]"); if (ed) { const it = S.items.find(i => i.id === ed.dataset.edit); if (it) openItem(it); return; }
  const qb = t.closest("[data-q]"); if (qb) return changeQty(qb.dataset.q, +qb.dataset.d);
  const dd = t.closest("[data-dd]"); if (dd) { S.date = addDays(S.date, +dd.dataset.dd); return render(); }
  const dt = t.closest("[data-date]"); if (dt) { S.date = dt.dataset.date; return render(); }
  const kmo = t.closest("[data-kmood]"); if (kmo) { const k = kmo.dataset.kmood, cur = (mealDoc("kihun", S.date)[k] || {}).mood; const inp = $(`[data-kmenu="${k}"]`); return saveSlot(k, { mood: cur === kmo.dataset.v ? "" : kmo.dataset.v, ...(inp ? { menu: inp.value.trim() } : {}) }); }
  const kc = t.closest("[data-kchip]"); if (kc) { const k = kc.dataset.kchip, inp = $(`[data-kmenu="${k}"]`); const cur = (inp ? inp.value : (mealDoc("kihun", S.date)[k] || {}).menu || "").trim(); return saveSlot(k, { menu: cur ? `${cur}, ${kc.dataset.v}` : kc.dataset.v }); }
  const aw = t.closest("[data-away]"); if (aw) return saveSlot("lunch", { home: aw.dataset.away === "home" });
  const fd = t.closest("[data-feed]"); if (fd) return toggleFeed(+fd.dataset.feed);
  const rm = t.closest("[data-remake]"); if (rm) { const l = S.babyLog.find(x => x.id === rm.dataset.remake); return openMake(l); }
  const cc = t.closest("[data-chcycle]"); if (cc) { const c = S.challenges.find(x => x.id === cc.dataset.chcycle); if (!c) return; const order = ["watch", "ok", "bad"]; const nx = order[(order.indexOf(c.status) + 1) % 3]; c.status = nx; render(); return D.patch("challenges", c.id, { status: nx }).catch(writeErr); }
  const cd = t.closest("[data-chdel]"); if (cd) { if (!cd.dataset.armed) { cd.dataset.armed = 1; cd.textContent = "지울까요?"; cd.classList.add("armed"); return; } const c = S.challenges.find(x => x.id === cd.dataset.chdel); if (!c) return; const { id, ...before } = c; D.remove("challenges", id).catch(writeErr); return toast(`${c.food} 기록을 지웠어요`, () => D.put("challenges", id, before).catch(writeErr)); }
  const cb = t.closest("[data-cube]"); if (cb) { const c = S.cubes.find(x => x.id === cb.dataset.cube); if (c) openCube(c); return; }
  const pd = t.closest("[data-pdel]"); if (pd) { e.preventDefault(); return savePrep(prepItems().filter((p, i) => i !== +pd.dataset.pdel)); }
  const rd = t.closest("[data-ruledel]"); if (rd) { const items = houseRules().filter((_, i) => i !== +rd.dataset.ruledel); return saveRules(items); }
  const day = t.closest("[data-day]"); if (day) { S.calDay = day.dataset.day; return render(); }
  const cm = t.closest("[data-cm]"); if (cm) { const [y, m] = S.calMonth.split("-").map(Number); S.calMonth = ymd(new Date(y, m - 1 + +cm.dataset.cm, 1)).slice(0, 7); return render(); }
  const fv = t.closest("[data-fav]"); if (fv) {
    let fav = [...((S.meta.settings && S.meta.settings.favZones) || ZORDER)];
    fav = fav.includes(fv.dataset.fav) ? fav.filter(z => z !== fv.dataset.fav) : [...fav, fv.dataset.fav];
    if (!fav.length) return toast("하나는 골라 주세요");
    S.meta.settings = { ...(S.meta.settings || {}), favZones: fav }; render();
    return D.put("meta", "settings", S.meta.settings).catch(writeErr);
  }
  const me = t.closest("[data-me]"); if (me) { localStorage.setItem("fridge-me", me.dataset.me); S.user.name = me.dataset.me; render(); return toast(`이제 ${me.dataset.me} 이름으로 기록해요`); }
  const rw = t.closest("[data-rwho]"); if (rw) { S.rc.who = rw.dataset.rwho; return render(); }
  const dz = t.closest("[data-drop]"); if (dz && S.view === "receipt") { if (!S.rc.sel) return toast("먼저 위에서 식품을 골라 주세요"); S.rc.zone = dz.dataset.drop; render(); setTimeout(() => $(".panel") && $(".panel").scrollIntoView({ behavior: "smooth", block: "nearest" }), 30); return; }
  const a = t.closest("[data-act]"); if (a) return act(a.dataset.act, a, e);
});
document.addEventListener("change", e => {
  const pi = e.target.closest("[data-pi]");
  if (pi) return savePrep(prepItems().map((p, i) => i === +pi.dataset.pi ? { ...p, done: pi.checked } : p));
  const pr = e.target.closest("[data-pref]");
  if (pr) { S.prefs[pr.dataset.pref] = pr.checked; ls.set("fridge-prefs", S.prefs); toast(pr.checked ? "켰어요" : "껐어요"); }
});
document.addEventListener("keydown", e => {
  if (e.key === "Escape" && $("#scrim") && !$("#scrim").hidden) closeSheet();
  if ((e.key === "Enter" || e.key === " ") && e.target.matches("[data-rf],[data-drop]")) { e.preventDefault(); e.target.click(); }
});

function act(name, el) {
  switch (name) {
    case "back": return goBack();
    case "guide": return openGuide(el.dataset.g);
    case "menu": return openMenu();
    case "bell": return openBell();
    case "add": return openAdd();
    case "addItem": return openItem();
    case "barcode": return openBarcode();
    case "addCube": return openCube();
    case "make": return openMake();
    case "stage": return openStage();
    case "invite": return openInvite();
    case "logout": return D.signOut();
    case "rcancel": S.rc.sel = null; S.rc.zone = null; return render();
    case "rqty": S.rc.qty = Math.max(1, Math.min(99, S.rc.qty + +el.dataset.d)); return render();
    case "rsave": return saveFound();
    case "rall": return saveAllFound();
  }
}

/* =========================================================
   식품 저장
   ========================================================= */
function writeErr(e) {
  console.error(e);
  if (e && e.code === "permission-denied") toast("이 계정은 저장할 권한이 없어요.");
  else toast("저장하지 못했어요. 인터넷 연결을 확인해 주세요.");
}
function rememberName(n) {
  const rec = [n, ...((S.meta.settings && S.meta.settings.recent) || []).filter(x => x !== n)].slice(0, 12);
  S.meta.settings = { ...(S.meta.settings || {}), recent: rec };
  D.put("meta", "settings", S.meta.settings).catch(() => {});
}
function saveItem(id, data, isNew) {
  const prev = S.items.find(i => i.id === id) || {};
  const { id: _pid, ...keep } = prev;
  const doc = { ...keep, name: data.name, icon: data.icon, zone: data.zone, qty: data.qty || 1, expiry: data.expiry || "", addedBy: data.addedBy || S.user.name, addedAt: data.addedAt || today() };
  if ("for" in data) doc.for = data.for || "";
  if (isNew) rememberName(doc.name);
  return D.put("items", id, doc).catch(writeErr);
}
function changeQty(id, d, quiet) {
  const it = S.items.find(i => i.id === id); if (!it) return;
  const n = (it.qty || 1) + d;
  if (n <= 0) {
    const { id: _, ...before } = it;
    D.remove("items", id).catch(writeErr);
    if (!quiet) toast(`${it.name} 다 먹었어요`, () => D.put("items", id, before).catch(writeErr));
  } else D.patch("items", id, { qty: n }).catch(writeErr);
}

/* ---------- 시트 ---------- */
function openSheet(html) { const s = $("#sheet"); if (!s) return; if ($("#scrim").hidden) hpush({ v: S.view, sheet: 1 }); s.innerHTML = html; $("#scrim").hidden = false; }
function closeSheet() {
  stopScan(); const sc = $("#scrim");
  if (sc && !sc.hidden) { sc.hidden = true; $("#sheet").innerHTML = ""; $("#sheet").onclick = null; }
  if (S.addedZones && S.addedZones.size && S.view === "home") {
    const zs = [...S.addedZones]; S.addedZones = new Set();
    setTimeout(() => zs.forEach(z => { const t = document.querySelector(`.zhot[data-zone="${z}"]`); if (!t) return;
      t.classList.remove("boing"); void t.offsetWidth; t.classList.add("boing"); setTimeout(() => t.classList.remove("boing"), 700);
      if (!calm()) { const r = t.getBoundingClientRect(); sparkle(r.left + r.width / 2, r.top + r.height / 2); } }), 120);
  }
}
const sheetHead = t => `<div class="row between"><h2>${t}</h2><button class="x" type="button" data-close aria-label="닫기">✕</button></div>`;

function openItem(it) {
  const isNew = !it || !it.id;
  const v = Object.assign({ name: "", icon: "", zone: "", qty: 1, expiry: "", for: "" }, it || {});
  const touched = { icon: !!(it && it.icon), zone: !!(it && it.zone), exp: !!(it && it.expiry) };
  let autoName = false;   // 그림을 눌러 채운 이름이면, 다른 그림을 누를 때 바꿔도 돼요
  if (!v.icon || !v.zone || !v.expiry) { const g = guess(v.name); v.icon = v.icon || g.icon; v.zone = v.zone || g.zone; v.expiry = v.expiry || addDays(today(), g.days); }
  const picks = PICKS.filter(k => k !== "🍱");
  openSheet(`${sheetHead(isNew ? "🍎 식품 등록" : "✏️ 식품 수정")}
    ${v.barcode ? `<div class="banner" style="margin:-4px 0 0">${v.barcodeNote || ""}<span class="tiny num" style="margin-left:auto">${esc(v.barcode)}</span></div>` : ""}
    <div class="f"><span class="tiny">그림을 누르면 이름·칸·날짜가 바로 채워져요</span><div class="picks" id="fp"></div></div>
    <label class="f"><span>이름</span><input class="in" id="fn" value="${esc(v.name)}" placeholder="그림을 누르거나 직접 적어 주세요" autocomplete="off"></label>
    <div class="f"><span class="tiny">어느 칸에 넣을까요?</span><div class="zpick" id="fz">${ZORDER.map(z => `<button type="button" class="z-${z}" data-z="${z}">${ZONES[z].ic} ${ZONES[z].label}</button>`).join("")}</div></div>
    <div class="f"><span class="tiny">누구 꺼예요?</span><div id="fw">${whoPick(v.for, "data-w")}</div></div>
    <div class="fgrid">
      <label class="f"><span>개수</span><span class="step"><button type="button" id="fm">−</button><output class="num" id="fqo">${v.qty}</output><button type="button" id="fpl">＋</button></span></label>
      <label class="f"><span>유통기한</span><input class="in num" type="date" id="fe" value="${esc(v.expiry)}"></label>
    </div>
    <p class="tiny" id="fh" style="margin:0"></p>
    <div class="actions" style="grid-template-columns:1fr 1.4fr">${isNew ? `<button class="btn line" type="button" data-close>취소</button>` : `<button class="btn line" type="button" id="fdel" style="color:var(--bad)">삭제</button>`}<button class="btn pink" type="button" id="fs">저장</button></div>`);
  const paintPicks = () => {
    const list = picks.includes(v.icon) || v.icon === "🍱" ? picks : [v.icon, ...picks];
    $("#fp").innerHTML = list.map(k => `<button type="button" data-pk="${esc(k)}" aria-pressed="${k === v.icon}" aria-label="${esc((ICON_INFO[k] || {}).name || k)}"><span class="pkimg">${pic(k)}</span><span class="pkname">${esc((ICON_INFO[k] || {}).name || "")}</span></button>`).join("");
  };
  const paint = () => {
    $$("#fp [data-pk]").forEach(b => b.setAttribute("aria-pressed", b.dataset.pk === v.icon));
    $$("#fz [data-z]").forEach(b => b.setAttribute("aria-pressed", b.dataset.z === v.zone));
    $$("#fw [data-w]").forEach(b => b.setAttribute("aria-pressed", b.dataset.w === (v.for || "")));
    $("#fqo").textContent = v.qty; $("#fe").value = v.expiry;
    const d = dday(v.expiry);
    $("#fh").textContent = d === null ? "" : d < 0 ? `기한이 ${-d}일 지났어요.` : `오늘부터 ${d}일 남았어요. 포장에 날짜가 있으면 그 날짜로 바꿔 주세요.`;
  };
  paintPicks(); paint();
  const fn = $("#fn");
  fn.oninput = () => { autoName = false; v.name = fn.value.trim(); const g = guess(v.name); if (!touched.icon) v.icon = g.icon; if (!touched.zone) v.zone = g.zone; if (!touched.exp) v.expiry = addDays(today(), g.days); paint(); };
  $("#fp").onclick = e => {
    const b = e.target.closest("[data-pk]"); if (!b) return;
    v.icon = b.dataset.pk; touched.icon = true;
    const info = ICON_INFO[v.icon];
    if (info) {
      if (!v.name || autoName) { v.name = info.name; fn.value = info.name; autoName = true; }
      if (!touched.zone) v.zone = info.zone;
      if (!touched.exp) v.expiry = addDays(today(), info.days);
    }
    paint();
  };
  $("#fz").onclick = e => { const b = e.target.closest("[data-z]"); if (b) { v.zone = b.dataset.z; touched.zone = true; paint(); } };
  $("#fw").onclick = e => { const b = e.target.closest("[data-w]"); if (b) { v.for = b.dataset.w; paint(); } };
  $("#fm").onclick = () => { v.qty = Math.max(1, v.qty - 1); paint(); };
  $("#fpl").onclick = () => { v.qty = Math.min(99, v.qty + 1); paint(); };
  $("#fe").onchange = e => { v.expiry = e.target.value; touched.exp = true; paint(); };
  $("#fs").onclick = () => {
    if (!v.name) { fn.focus(); $("#fh").textContent = "그림을 누르거나 이름을 적어 주세요."; return; }
    saveItem(isNew ? D.newId() : it.id, v, isNew);
    if (v.barcode) D.put("barcodes", v.barcode, { name: v.name, icon: v.icon, zone: v.zone, days: Math.max(1, dday(v.expiry) ?? 7), by: S.user.name }).catch(() => {});
    closeSheet(); toast(isNew ? `${ZONES[v.zone].label}에 ${v.name}을(를) 넣었어요` : "수정했어요");
    if (isNew || v.zone !== it.zone) flyHome(v.icon, v.zone);
  };
  const del = $("#fdel");
  if (del) del.onclick = () => {
    if (!del.dataset.armed) { del.dataset.armed = 1; del.textContent = "정말 지울까요?"; return; }
    const { id, ...before } = it;
    D.remove("items", id).catch(writeErr); closeSheet();
    toast(`${it.name}을(를) 지웠어요`, () => D.put("items", id, before).catch(writeErr));
  };
}

/* ---------- 바코드 ---------- */
const ZX = "https://cdn.jsdelivr.net/npm/@zxing/library@0.21.3/umd/index.min.js";
let zxLoading = null, scanReader = null;
function loadZX() {
  if (window.ZXing) return Promise.resolve();
  if (!zxLoading) zxLoading = new Promise((res, rej) => { const sc = document.createElement("script"); sc.src = ZX; sc.onload = res; sc.onerror = () => { zxLoading = null; rej(new Error("load")); }; document.head.appendChild(sc); });
  return zxLoading;
}
function newReader() {
  const Z = window.ZXing, hints = new Map();
  hints.set(Z.DecodeHintType.POSSIBLE_FORMATS, [Z.BarcodeFormat.EAN_13, Z.BarcodeFormat.EAN_8, Z.BarcodeFormat.UPC_A, Z.BarcodeFormat.UPC_E, Z.BarcodeFormat.CODE_128]);
  hints.set(Z.DecodeHintType.TRY_HARDER, true);
  return new Z.BrowserMultiFormatReader(hints);
}
/* 바코드: 휴대폰 크롬의 기본 인식기(BarcodeDetector)가 있으면 그걸 쓰고, 없으면 ZXing */
let scanStream = null, scanTimer = null;
function stopScan() {
  try { scanReader && scanReader.reset(); } catch (e) {} scanReader = null;
  if (scanTimer) { clearTimeout(scanTimer); scanTimer = null; }
  if (scanStream) { scanStream.getTracks().forEach(t => t.stop()); scanStream = null; }
}
const BD_FORMATS = ["ean_13", "ean_8", "upc_a", "upc_e", "code_128", "code_39", "itf"];
async function nativeDetector() {
  if (!("BarcodeDetector" in window)) return null;
  try {
    const sup = await window.BarcodeDetector.getSupportedFormats();
    const f = BD_FORMATS.filter(x => sup.includes(x));
    return f.length ? new window.BarcodeDetector({ formats: f }) : null;
  } catch (e) { return null; }
}
async function openBarcode() {
  openSheet(`${sheetHead("▥ 바코드로 등록")}
    <p class="muted" style="margin:-6px 0 0">바코드를 네모 안에 가로로 크게 비춰 주세요.<br>한 번 등록하면 다음부터는 자동이에요.</p>
    <div class="scanbox"><video id="bv" playsinline muted autoplay></video><span class="scanline"></span><p id="bs" class="scanmsg">카메라 켜는 중…</p></div>
    <div class="actions" style="grid-template-columns:1fr 1fr">
      <label class="btn line fileb">${svg("cam")} 사진으로 찍기<input type="file" accept="image/*" capture="environment" id="bfile"></label>
      <div data-form id="bform" class="row" style="gap:6px"><input class="in num" id="bnum" inputmode="numeric" placeholder="번호 직접" autocomplete="off"><button class="btn sm primary" type="button" data-submit>확인</button></div>
    </div>`);
  const msg = t => { const m = $("#bs"); if (m) m.textContent = t; };
  const det = await nativeDetector();
  $("#bform").onsubmit = e => { e.preventDefault(); const c = $("#bnum").value.replace(/\D/g, ""); if (c.length >= 8) foundCode(c); else msg("바코드 아래 숫자 8~13자리를 적어 주세요."); };
  $("#bfile").onchange = async e => {
    const f = e.target.files && e.target.files[0]; if (!f) return;
    msg("사진에서 바코드 찾는 중…");
    try {
      if (det) {
        const bmp = await createImageBitmap(f);
        const r = await det.detect(bmp);
        if (r.length) return foundCode(r[0].rawValue);
      }
      await loadZX(); const url = URL.createObjectURL(f); const r = await newReader().decodeFromImageUrl(url); URL.revokeObjectURL(url); foundCode(r.getText());
    } catch (err) { msg("바코드를 못 찾았어요. 바코드만 크고 또렷하게 나오게 다시 찍어 주세요."); }
  };
  const cam = { video: { facingMode: { ideal: "environment" }, width: { ideal: 1920 }, height: { ideal: 1080 }, advanced: [{ focusMode: "continuous" }] }, audio: false };
  try {
    if (det) {
      stopScan();
      scanStream = await navigator.mediaDevices.getUserMedia(cam);
      const v = $("#bv"); if (!v) return stopScan();
      v.srcObject = scanStream; await v.play();
      msg("바코드를 네모 안에 맞춰 주세요");
      let misses = 0;
      const tick = async () => {
        if (!scanStream || !$("#bv")) return stopScan();
        try {
          const r = v.readyState >= 2 ? await det.detect(v) : [];
          const hit = r.find(x => /^\d{8,14}$/.test(x.rawValue)) || r[0];
          if (hit) { stopScan(); return foundCode(hit.rawValue); }
        } catch (e) {}
        if (++misses === 40) msg("가까이 대었다가 천천히 떼어 보세요");
        scanTimer = setTimeout(tick, 150);
      };
      tick();
      return;
    }
    await loadZX();
    if (!$("#bv")) return;
    stopScan(); scanReader = newReader();
    await scanReader.decodeFromConstraints(cam, $("#bv"), (res) => { if (res) { const c = res.getText(); stopScan(); foundCode(c); } });
    msg("바코드를 네모 안에 맞춰 주세요");
  } catch (err) {
    msg("카메라를 쓸 수 없어요. '사진으로 찍기'를 눌러 주세요.");
  }
}
async function foundCode(code) {
  stopScan();
  if (navigator.vibrate) try { navigator.vibrate(60); } catch (e) {}
  const known = S.barcodes[code];
  if (known) {
    openItem({ name: known.name, icon: known.icon, zone: known.zone, expiry: addDays(today(), known.days || 7), barcode: code, barcodeNote: `✨ 전에 등록한 상품이에요` });
    return;
  }
  const m = $("#bs"); if (m) m.textContent = "상품 이름 찾는 중…";
  let name = "";
  try {
    const ctl = new AbortController(); const t = setTimeout(() => ctl.abort(), 3000);
    const r = await fetch(`https://world.openfoodfacts.org/api/v2/product/${code}.json?fields=product_name_ko,product_name`, { signal: ctl.signal });
    clearTimeout(t);
    const j = await r.json(); name = (j.product && (j.product.product_name_ko || j.product.product_name)) || "";
  } catch (e) {}
  if (name) openItem({ name: name.slice(0, 20), barcode: code, barcodeNote: "🔎 상품 정보를 찾았어요. 맞는지 확인해 주세요" });
  else openItem({ barcode: code, barcodeNote: "처음 보는 바코드예요. 그림을 누르거나 이름을 한 번만 적어 주시면, 다음부턴 자동이에요" });
}

function addTiles(q) {
  const qq = (q || "").replace(/\s+/g, "");
  let keys = PICKS.filter(k => ICON_INFO[k]);
  if (qq) keys = keys.filter(k => ICON_INFO[k].name.replace(/\s+/g, "").includes(qq));
  const exact = qq && keys.some(k => ICON_INFO[k].name.replace(/\s+/g, "") === qq);
  const custom = qq && !exact ? `<button type="button" class="tile custom" data-addname="${esc(q.trim())}"><span class="pkimg">${pic(guess(q).icon)}</span><span class="pkname">'${esc(q.trim())}' 넣기</span></button>` : "";
  return custom + keys.map(k => {
    const c = S.addCount[k] || 0;
    return `<button type="button" class="tile" data-addpick="${esc(k)}"><span class="pkimg">${pic(k)}</span><span class="pkname">${esc(ICON_INFO[k].name)}</span>${c ? `<span class="tcnt num">${c}</span>` : ""}</button>`;
  }).join("") || `<div class="empty small" style="grid-column:1/-1">찾는 그림이 없어요. 이름을 다 적으면 그대로 넣을 수 있어요.</div>`;
}
function openAdd() {
  S.addCount = {}; S.addedZones = new Set(); S.addFor = "";
  openSheet(`${sheetHead("🧺 냉장고에 넣기")}
    <div class="addways" style="grid-template-columns:${kidSet().useCube ? "1fr 1fr" : "1fr"}">
      <button type="button" class="btn line" data-go="receipt">${svg("receipt")} 영수증으로</button>
      ${kidSet().useCube ? `<button type="button" class="btn line" data-go="cube"><img src="img/i-cube.png" alt=""> 이유식 큐브</button>` : ""}
    </div>
    <div class="whorow"><span>누구 꺼?</span>${whoPick("", "data-addfor")}</div>
    <input class="search" id="addq" type="search" placeholder="이름으로 찾기 · 없으면 적어서 넣기" autocomplete="off" enterkeyhint="done">
    <p class="tiny hint">그림을 톡 누르면 바로 들어가요.<br>날짜는 알림의 '날짜 바꾸기'로 고쳐요.</p>
    <div class="tiles" id="addTiles">${addTiles("")}</div>`);
  const q = $("#addq");
  const upd = () => { $("#addTiles").innerHTML = addTiles(q.value); };
  q.addEventListener("input", upd); q.addEventListener("compositionend", upd);
  q.addEventListener("keydown", e => { if (e.key === "Enter" && !e.isComposing) { const first = $("#addTiles .tile"); if (first) first.click(); } });
  $("#sheet").onclick = e => {
    const wf = e.target.closest("[data-addfor]");
    if (wf) { S.addFor = wf.dataset.addfor; $$("#sheet [data-addfor]").forEach(x => x.setAttribute("aria-pressed", x === wf)); return; }
    const b = e.target.closest("[data-addpick],[data-addname]"); if (!b) return;
    let name, icon, zone, days;
    if (b.dataset.addpick) { icon = b.dataset.addpick; ({ name, zone, days } = ICON_INFO[icon]); }
    else { name = b.dataset.addname; const g = guess(name); icon = g.icon; zone = g.zone; days = g.days; }
    const id = D.newId(), expiry = addDays(today(), days);
    const who = S.addFor || "";
    saveItem(id, { name, icon, zone, qty: 1, expiry, for: who }, true);
    S.addCount[icon] = (S.addCount[icon] || 0) + 1; S.addedZones.add(zone);
    const from = b.getBoundingClientRect();
    b.classList.remove("pop"); void b.offsetWidth; b.classList.add("pop");
    let cnt = b.querySelector(".tcnt"); if (!cnt) { cnt = document.createElement("span"); cnt.className = "tcnt num"; b.appendChild(cnt); } cnt.textContent = S.addCount[icon];
    if (!calm()) { const fl = document.createElement("div"); fl.className = "flyer"; fl.innerHTML = pic(icon); document.body.appendChild(fl);
      fl.animate([{ transform: `translate(${from.left + from.width / 2}px,${from.top + 26}px) translate(-50%,-50%) scale(1)`, opacity: 1 }, { transform: `translate(${from.left + from.width / 2}px,${from.top - 50}px) translate(-50%,-50%) scale(1.4) rotate(12deg)`, opacity: 0 }], { duration: 600, easing: "ease-out" }).onfinish = () => fl.remove(); }
    toast(`${who ? WHO[who].label + " 꺼 " : ""}${name} 쏙! ${ZONES[zone].label} · ${md(expiry)}까지`, () => { D.remove("items", id).catch(writeErr); S.addCount[icon]--; }, { label: "날짜 바꾸기", fn: () => { const it = S.items.find(x => x.id === id) || { id, name, icon, zone, qty: 1, expiry, for: who }; openItem(it); } });
    if (b.dataset.addname) { q.value = ""; upd(); }
  };
}

/* ---------- 사용 설명서 ---------- */
const GUIDE = [
  ["home", "i-basket", "우리 냉장고", [
    "냉장고 <b>칸을 누르면</b> 그 칸 식품만 봐요.",
    "<b>오늘 먹기·임박·전체</b>로 골라 봐요.",
    "<b>먼저 먹어야 해요</b>: 3일 안에 끝나요.",
    "오른쪽 아래 <b>＋</b>로 식품을 넣어요."]],
  ["add", "milk", "냉장고에 넣기", [
    "<b>그림을 톡</b> 누르면 바로 들어가요.",
    "여러 번 누르면 그 개수만큼 들어가요.",
    "그림이 없으면 이름을 적어 넣어요.",
    "날짜는 알림창 <b>날짜 바꾸기</b>로 고쳐요.",
    "<b>누구 꺼?</b>로 기훈·태훈 표시를 해요."
  ]],
  ["receipt", "egg", "영수증으로 넣기", [
    "<b>영수증 찍기</b>로 식품을 찾아요.",
    "처음 한 번은 30초쯤 걸려요.",
    "식품을 <b>칸으로 끌어다</b> 놓아요.",
    "<b>한꺼번에 넣기</b>는 추천 칸으로 쏙!",
    "빠진 건 <b>직접 추가</b>에 적어요.",
    "<b>누구 꺼?</b>를 먼저 고르면 다 표시돼요."]],
  ["list", "apple", "식품 목록", [
    "이름으로 찾거나 버튼으로 골라 봐요.",
    "<b>− ＋</b>로 개수를 바꿔요.",
    "0개가 되면 '다 먹었어요'로 빠져요.",
    "잘못 눌렀으면 <b>되돌리기</b>를 눌러요.",
    "이름을 누르면 수정·삭제해요.",
    "'큐브'로 찾으면 큐브도 같이 나와요."]],
  ["kihun", "ki-eat", "기훈 유아식", [
    "<b>아침·점심·저녁</b> 메뉴를 적어요.",
    "<b>잘 먹음·보통·안 먹음</b>을 눌러요.",
    "<b>＋ 메뉴</b>를 누르면 바로 들어가요.",
    "평일 점심은 <b>기관</b>으로 자동이에요.",
    "좋아하는 것·안 먹는 것이 쌓여요.",
    "기훈이 꺼 재료는 맨 아래에 모여요."]],
  ["taehun", "tae-clap", "태훈 이유식", [
    "<b>만들기</b>에서 재료를 골라요.",
    "이름이 자동으로 지어져요.",
    "먹이면 <b>회차 동그라미</b>를 눌러요.",
    "누를 때마다 한 통씩 줄어요.",
    "마지막 날엔 <b>만들 차례</b>를 알려요.",
    "처음 먹는 재료(★)는 도전 기록에 남아요.",
    "<b>최근 만든 이유식</b>으로 또 만들어요.",
    "단계·횟수는 위 <b>바꾸기</b>에서 고쳐요."]],
  ["challenge", "tae-dino", "도전 기록", [
    "처음 먹여 보는 음식을 기록해요.",
    "상태를 누르면 차례로 바뀌어요.",
    "<b>지켜보는 중 → 괜찮아요 → 반응</b>",
    "양이나 반응을 메모해 두면 좋아요."]],
  ["cube", "i-cube", "이유식 큐브", [
    "<b>큐브 추가</b>로 얼린 큐브를 등록해요.",
    "큐브를 누르면 남은 개수를 고쳐요.",
    "<b>준비할 재료</b>는 둘이 같이 체크해요.",
    "안 쓸 땐 가족 탭에서 꺼서 숨겨요."]],
  ["cal", "i-clock", "캘린더", [
    "점은 그날 <b>기한 끝나는 식품</b>이에요.",
    "점 색은 냉장고 칸 색과 같아요.",
    "날짜를 누르면 식품·식사 기록이 보여요."]],
  ["family", "bro-hug", "우리 가족", [
    "기훈이 다니는 곳을 정해요.",
    "<b>알림</b>은 이 휴대폰에만 적용돼요.",
    "<b>우리 집 약속</b>은 둘이 같이 써요.",
    "<b>자주 쓰는 칸</b>만 목록 버튼에 나와요.",
    "<b>가족 초대하기</b>로 주소를 보내요."]],
];
const GUIDE_OF = { home: "home", receipt: "receipt", list: "list", kihun: "kihun", taehun: "taehun", challenge: "challenge", cube: "cube", cal: "cal", family: "family" };
function openGuide(key) {
  const k = key || GUIDE_OF[S.view === "kids" ? S.kidTab : S.view] || "home";
  openSheet(`${sheetHead("📖 사용 설명서")}
    <p class="tiny hint">메뉴를 눌러 펼쳐요. 제목 옆 <b>?</b>로도 와요.</p>
    <div class="guide">${GUIDE.filter(([g]) => g !== "cube" || kidSet().useCube).map(([g, img, title, lines]) => `<details id="g-${g}" ${g === k ? "open" : ""}>
      <summary><img src="img/${img}.png" alt=""><b>${title}</b></summary>
      <ul>${lines.map(l => `<li>${l}</li>`).join("")}</ul></details>`).join("")}</div>`);
  setTimeout(() => { const el = $("#g-" + k); el && el.scrollIntoView({ block: "start", behavior: "smooth" }); }, 60);
}
function openMenu() {
  const it = (attr, img, label) => `<button type="button" ${attr}><img src="img/${img}.png" alt=""><span>${label}</span></button>`;
  const grp = (title, items) => `<section class="mgroup"><h3>${title}</h3><div class="mgrid">${items.join("")}</div></section>`;
  openSheet(`${sheetHead("메뉴")}
    ${grp("🧊 냉장고", [it('data-go="home"', "i-basket", "우리 냉장고"), it('data-go="list"', "apple", "식품 목록"), it('data-go="cal"', "i-clock", "캘린더")])}
    ${grp("🧺 넣기", [it('data-act="add"', "milk", "그림으로"), it('data-go="receipt"', "egg", "영수증으로")])}
    ${grp("🍼 아이식사", [it('data-go="kihun"', "ki-eat", "기훈 유아식"), it('data-go="taehun"', "tae-clap", "태훈 이유식"), it('data-go="challenge"', "tae-dino", "도전 기록"), ...(kidSet().useCube ? [it('data-go="cube"', "i-cube", "이유식 큐브")] : [])])}
    ${grp("💗 가족", [it('data-go="family"', "bro-hug", "가족 설정"), it('data-act="invite"', "bro-walk", "가족 초대"), `<button type="button" data-act="guide"><span class="emo">📖</span><span>사용 설명서</span></button>`, ...(D.demo ? [] : [`<button type="button" data-act="logout"><span class="emo">🚪</span><span>로그아웃</span></button>`])])}`);
}
function openBell() {
  const list = sortedItems().filter(i => { const d = dday(i.expiry); return d !== null && d <= 3; });
  const cubes = S.cubes.filter(c => (c.count || 0) > 0 && (dday(c.useBy) ?? 99) <= 3);
  openSheet(`${sheetHead("🔔 먼저 챙길 것")}
    ${needMake() ? `<button type="button" class="makecall" data-go="taehun">🍚 태훈이 이유식 만들 차례예요 <b>›</b></button>` : ""}
    <div class="items">${list.map(itemRow).join("")}${cubes.map(c => `<div class="item"><span class="fic">${pic(cubeArt(c.name)[0])}</span><span class="info"><b>${esc(c.name)} 큐브</b><span>남은 ${c.count}개</span></span><div class="right">${badge(c.useBy)}</div></div>`).join("")}</div>
    ${!list.length && !cubes.length && !needMake() ? `<div class="empty small">3일 안에 기한이 끝나는 게 없어요!</div>` : ""}`);
  $("#sheet").onclick = e => { const qb = e.target.closest("[data-q]"); if (qb) { changeQty(qb.dataset.q, +qb.dataset.d); setTimeout(openBell, 50); } const ed = e.target.closest("[data-edit]"); if (ed) { const it = S.items.find(i => i.id === ed.dataset.edit); if (it) openItem(it); } };
}
function openInvite() {
  const url = location.href.split("#")[0];
  openSheet(`${sheetHead("💌 가족 초대하기")}
    ${D.demo ? `<div class="banner">지금은 체험 모드라 초대할 수 없어요. 설치 안내서의 ‘Firebase 연결’을 먼저 해 주세요.</div>` : ""}
    <ol class="how">
      <li>Firebase 보안 규칙에 가족의 구글 이메일을 추가해요. (설치 안내서 4단계)</li>
      <li><b>firebase-config.js</b>의 FAMILY에도 이메일과 이름을 적으면 이름이 자동으로 붙어요.</li>
      <li>아래 주소를 가족에게 보내 주세요. 구글 로그인하면 같은 냉장고가 보여요.</li>
    </ol>
    <code class="box" id="inv">${esc(url)}</code>
    <button class="btn pink" type="button" id="cp">주소 복사하기</button>`);
  $("#cp").onclick = () => {
    const done = () => toast("주소를 복사했어요");
    if (navigator.clipboard) navigator.clipboard.writeText(url).then(done, () => selectText($("#inv")));
    else selectText($("#inv"));
  };
}
function selectText(el) { const r = document.createRange(); r.selectNodeContents(el); const s = getSelection(); s.removeAllRanges(); s.addRange(r); toast("주소를 길게 눌러 복사해 주세요"); }

/* =========================================================
   영수증 처리
   ========================================================= */
async function onReceiptFile(e) {
  const f = e.target.files && e.target.files[0]; if (!f) return;
  const R = S.rc;
  if (R.img) URL.revokeObjectURL(R.img);
  Object.assign(R, { img: URL.createObjectURL(f), status: "reading", progress: 0, sel: null, zone: null });
  render();
  try {
    let last = 0;
    const found = await readReceipt(f, p => { R.progress = p; if (p - last >= 5) { last = p; if (S.view === "receipt" && !S.drag) { const bar = $(".prog i"); if (bar) { bar.style.width = p + "%"; bar.parentElement.previousElementSibling.textContent = `글자 읽는 중… ${p}%`; } } } });
    R.status = "done";
    const d = new Date();
    R.at = `${d.getMonth() + 1}월 ${d.getDate()}일 ${d.getHours() < 12 ? "오전" : "오후"} ${(d.getHours() % 12) || 12}:${pad(d.getMinutes())}`;
    addFound(found, true);
    toast(found.length ? `식품 ${found.length}개를 찾았어요` : "식품을 찾지 못했어요. 직접 추가해 주세요");
  } catch (err) {
    console.error(err); R.status = "error"; render();
  }
}
function addFound(list, replace) {
  const R = S.rc;
  const mapped = list.map(x => { const g = guess(x.name); return { key: D.newId(), name: x.name, price: x.price, icon: g.icon, zone: g.zone, days: g.days, done: false }; });
  R.found = replace ? mapped : [...R.found, ...mapped];
  if (!replace && mapped[0]) selectFound(mapped[0].key, null, true);
  else render();
}
function selectFound(key, zone, noRender) {
  const R = S.rc, f = R.found.find(x => x.key === key); if (!f || f.done) return;
  R.sel = key; R.zone = zone || null; R.qty = 1; R.name = f.name; R.exp = addDays(today(), f.days);
  render();
  if (zone) setTimeout(() => $(".panel") && $(".panel").scrollIntoView({ behavior: "smooth", block: "nearest" }), 30);
}
function saveFound() {
  const R = S.rc, f = R.found.find(x => x.key === R.sel); if (!f || !R.zone) return;
  const name = (R.name || f.name).trim(); const g = guess(name);
  const card = document.querySelector(`[data-rf="${f.key}"]`); const from = card ? card.getBoundingClientRect() : null; const zone = R.zone;
  const ic = isImg(f.icon) || f.icon !== "🍱" ? f.icon : g.icon;
  setTimeout(() => flyTo(ic, document.querySelector(`[data-drop="${zone}"]`), from), 60);
  saveItem(D.newId(), { name, icon: isImg(f.icon) || f.icon !== "🍱" ? f.icon : g.icon, zone: R.zone, qty: R.qty, expiry: R.exp, for: R.who || "" }, true);
  f.done = true; toast(`${ZONES[R.zone].label}에 ${name}을(를) 넣었어요`);
  R.sel = null; R.zone = null;
  const next = R.found.find(x => !x.done);
  render();
  if (next) setTimeout(() => { const el = $(`[data-rf="${next.key}"]`); el && el.scrollIntoView({ behavior: "smooth", block: "center" }); }, 40);
}
function saveAllFound() {
  const R = S.rc; let n = 0;
  R.found.forEach(f => { if (!f.done) { const card = document.querySelector(`[data-rf="${f.key}"]`); const from = card ? card.getBoundingClientRect() : null; const k = n; setTimeout(() => flyTo(f.icon, document.querySelector(`[data-drop="${f.zone}"]`), from), 80 + k * 220); n++; saveItem(D.newId(), { name: f.name, icon: f.icon, zone: f.zone, qty: 1, expiry: addDays(today(), f.days), for: R.who || "" }, true); f.done = true; } });
  R.sel = null; render(); toast(`${n}개를 냉장고에 넣었어요`);
}

/* ---------- 끌어다 놓기 (손가락·마우스 모두) ---------- */
document.addEventListener("dragstart", e => { if (e.target.closest && e.target.closest("[data-rf]")) e.preventDefault(); });
document.addEventListener("pointerdown", e => {
  const card = e.target.closest("[data-rf]");
  if (!card || S.view !== "receipt" || card.classList.contains("done")) return;
  const key = card.dataset.rf, f = S.rc.found.find(x => x.key === key);
  const st = { key, x: e.clientX, y: e.clientY, moved: false, ghost: null, over: null };
  card.setPointerCapture && card.setPointerCapture(e.pointerId);
  const move = ev => {
    if (!st.moved && Math.hypot(ev.clientX - st.x, ev.clientY - st.y) < 8) return;
    if (!st.moved) {
      st.moved = true; S.drag = true; document.body.classList.add("dragging");
      st.ghost = document.createElement("div"); st.ghost.className = "ghost"; st.ghost.innerHTML = pic(f.icon); document.body.appendChild(st.ghost);
    }
    ev.preventDefault();
    st.ghost.style.left = ev.clientX + "px"; st.ghost.style.top = ev.clientY + "px";
    const el = document.elementFromPoint(ev.clientX, ev.clientY);
    const dz = el && el.closest("[data-drop]");
    if (st.over && st.over !== dz) st.over.classList.remove("over");
    if (dz) dz.classList.add("over"); st.over = dz;
    if (ev.clientY > innerHeight - 70) scrollBy(0, 12); else if (ev.clientY < 70) scrollBy(0, -12);
  };
  const up = () => {
    card.removeEventListener("pointermove", move); card.removeEventListener("pointerup", up); card.removeEventListener("pointercancel", up);
    S.drag = false; document.body.classList.remove("dragging");
    if (st.ghost) st.ghost.remove();
    if (!st.moved) return selectFound(key);
    if (st.over) { st.over.classList.remove("over"); selectFound(key, st.over.dataset.drop); }
    else if (pendingRender) { pendingRender = false; render(); }
  };
  card.addEventListener("pointermove", move); card.addEventListener("pointerup", up); card.addEventListener("pointercancel", up);
});

/* =========================================================
   이유식 큐브 저장
   ========================================================= */
function savePrep(items) {
  S.meta.prep = { items }; render();
  D.put("meta", "prep", { items }).catch(writeErr);
}
function openCube(c) {
  const isNew = !c;
  const v = c ? { ...c } : { name: "", count: 12, madeOn: today(), useBy: addDays(today(), 21) };
  openSheet(`${sheetHead(isNew ? "🧊 큐브 추가" : `🧊 ${esc(c.name)} 큐브`)}
    <div class="row" style="justify-content:center;gap:4px;height:80px" id="cArt">${(() => { const [a, b] = cubeArt(v.name); return `<img src="img/${a}.png" alt="" style="height:100%">${b ? `<img src="img/${b}.png" alt="" style="height:80%">` : ""}`; })()}</div>
    <label class="f"><span>재료</span><input class="in" id="cn" value="${esc(v.name)}" placeholder="예: 소고기, 브로콜리, 애호박, 당근" autocomplete="off"></label>
    <div class="fgrid">
      <label class="f"><span>${isNew ? "만든 개수" : "남은 개수"}</span><span class="step"><button type="button" id="cm">−</button><input class="num" id="cc" inputmode="numeric" value="${v.count || 0}"><button type="button" id="cp2">＋</button></span></label>
      <label class="f"><span>제조일</span><input class="in num" type="date" id="cmd" value="${esc(v.madeOn || "")}"></label>
      <label class="f wide"><span>추천 사용기한</span><input class="in num" type="date" id="cu" value="${esc(v.useBy || "")}"></label>
    </div>
    <p class="tiny" style="margin:0">사용기한은 제조일부터 3주로 먼저 채워 둬요. 평소 기준대로 바꿔 주세요.</p>
    <div class="actions" style="grid-template-columns:1fr 1.4fr">${isNew ? `<button class="btn line" type="button" data-close>취소</button>` : `<button class="btn line" type="button" id="cdel" style="color:var(--bad)">삭제</button>`}<button class="btn pink" type="button" id="csave">저장</button></div>`);
  const cc = $("#cc");
  $("#cn").oninput = e => { const [a, b] = cubeArt(e.target.value); $("#cArt").innerHTML = `<img src="img/${a}.png" alt="" style="height:100%">${b ? `<img src="img/${b}.png" alt="" style="height:80%">` : ""}`; };
  $("#cm").onclick = () => { cc.value = Math.max(0, (parseInt(cc.value, 10) || 0) - 1); };
  $("#cp2").onclick = () => { cc.value = Math.min(99, (parseInt(cc.value, 10) || 0) + 1); };
  $("#cmd").onchange = e => { if (isNew) $("#cu").value = addDays(e.target.value, 21); };
  $("#csave").onclick = () => {
    const name = $("#cn").value.trim().replace(/\s*큐브$/, ""); if (!name) return $("#cn").focus();
    const count = Math.max(0, Math.min(99, parseInt(cc.value, 10) || 0));
    const doc = { name, count, made: isNew ? count : (c.made || count), madeOn: $("#cmd").value, useBy: $("#cu").value, by: c ? c.by || S.user.name : S.user.name };
    D.put("cubes", isNew ? D.newId() : c.id, doc).catch(writeErr);
    closeSheet(); toast(isNew ? `${name} 큐브 ${count}개를 넣었어요` : "수정했어요");
  };
  const del = $("#cdel");
  if (del) del.onclick = () => {
    if (!del.dataset.armed) { del.dataset.armed = 1; del.textContent = "정말 지울까요?"; return; }
    const { id, ...before } = c; D.remove("cubes", id).catch(writeErr); closeSheet();
    toast(`${c.name} 큐브를 지웠어요`, () => D.put("cubes", id, before).catch(writeErr));
  };
}

/* =========================================================
   쏙! 날아 들어가는 애니메이션
   ========================================================= */
const calm = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
function flyTo(icon, target, fromRect) {
  if (!target || calm()) return;
  const to = target.getBoundingClientRect();
  const sx = fromRect ? fromRect.left + fromRect.width / 2 : innerWidth / 2;
  const sy = fromRect ? fromRect.top + fromRect.height / 2 : Math.max(120, to.top - 160);
  const ex = to.left + to.width / 2, ey = to.top + to.height / 2;
  const g = document.createElement("div"); g.className = "flyer"; g.innerHTML = pic(icon);
  document.body.appendChild(g);
  const T = (x, y, sc, r) => `translate(${x}px,${y}px) translate(-50%,-50%) scale(${sc}) rotate(${r}deg)`;
  const a = g.animate([
    { transform: T(sx, sy, .6, -12), opacity: 0 },
    { offset: .18, transform: T(sx, sy - 26, 1.5, 8), opacity: 1 },
    { offset: .62, transform: T((sx + ex) / 2, Math.min(sy, ey) - 70, 1.15, -8), opacity: 1 },
    { transform: T(ex, ey, .35, 0), opacity: .3 }
  ], { duration: 950, easing: "cubic-bezier(.35,.7,.35,1)" });
  a.onfinish = () => {
    g.remove();
    const t = document.querySelector(`[data-zone="${target.dataset.zone}"]`) || document.querySelector(`[data-drop="${target.dataset.drop}"]`) || target;
    t.classList.remove("boing"); void t.offsetWidth; t.classList.add("boing");
    setTimeout(() => t.classList.remove("boing"), 700);
    sparkle(ex, ey);
  };
}
function sparkle(x, y) {
  ["✨", "♡", "⭐", "✨", "♡", "✦"].forEach((c, i) => {
    const s = document.createElement("span"); s.className = "spark"; s.textContent = c;
    s.style.color = ["#F2647E", "#FFB800", "#3E8DE0", "#3AAA6E"][i % 4];
    document.body.appendChild(s);
    const ang = (i / 6) * Math.PI * 2 - Math.PI / 2, d = 44 + (i % 2) * 14;
    s.animate([
      { transform: `translate(${x}px,${y}px) translate(-50%,-50%) scale(.3)`, opacity: 1 },
      { transform: `translate(${x + Math.cos(ang) * d}px,${y + Math.sin(ang) * d}px) translate(-50%,-50%) scale(1.1)`, opacity: 0 }
    ], { duration: 700, easing: "ease-out" }).onfinish = () => s.remove();
  });
}
// 홈 화면이면 냉장고 칸으로, 아니면 그냥 넘어가요
function flyHome(icon, zone, fromRect) {
  setTimeout(() => {
    const hot = S.view === "home" && document.querySelector(`.zhot[data-zone="${zone}"]`);
    if (!hot) return;
    const r = hot.getBoundingClientRect();
    if (r.top < 60 || r.bottom > innerHeight - 90) { hot.scrollIntoView({ behavior: calm() ? "auto" : "smooth", block: "center" }); setTimeout(() => flyTo(icon, document.querySelector(`.zhot[data-zone="${zone}"]`), fromRect), 380); }
    else flyTo(icon, hot, fromRect);
  }, 80);
}

/* =========================================================
   알림 / 토스트
   ========================================================= */
let alerted = false;
function firstAlert() {
  if (alerted || !S.prefs.soon) return; alerted = true;
  if (S.prefs.daily && ls.get("fridge-alerted", "") === today()) return;
  const n = counts(); if (!n.today && !n.soon) return;
  ls.set("fridge-alerted", today());
  setTimeout(() => toast(`오늘 먼저 먹을 것 ${n.today}개 · 임박 ${n.soon}개가 있어요`), 600);
}
let tt;
function toast(msg, undo, extra) {
  const t = $("#toast"); if (!t) return;
  t.innerHTML = `<span>${esc(msg)}</span>${extra ? `<button type="button" class="tx">${esc(extra.label)}</button>` : ""}${undo ? `<button type="button" class="tu">되돌리기</button>` : ""}`;
  t.hidden = false;
  if (undo) t.querySelector(".tu").onclick = () => { t.hidden = true; undo(); };
  if (extra) t.querySelector(".tx").onclick = () => { t.hidden = true; extra.fn(); };
  clearTimeout(tt); tt = setTimeout(() => t.hidden = true, undo || extra ? 5000 : 2400);
}

