// 영수증 사진 → 식품 이름 목록 (브라우저 안에서 글자 인식, 별도 키 필요 없음)
const TESS = "https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/tesseract.min.js";
let loading = null;
function loadTesseract() {
  if (window.Tesseract) return Promise.resolve();
  if (!loading) loading = new Promise((res, rej) => {
    const s = document.createElement("script");
    s.src = TESS; s.onload = res; s.onerror = () => rej(new Error("load"));
    document.head.appendChild(s);
  });
  return loading;
}

// 사진을 적당한 크기·흑백으로 바꿔서 인식률을 높여요
function prepare(file) {
  return new Promise(res => {
    const url = URL.createObjectURL(file), img = new Image();
    img.onload = () => {
      const k = Math.min(1, 1800 / Math.max(img.width, img.height));
      const c = document.createElement("canvas");
      c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
      const x = c.getContext("2d");
      x.filter = "grayscale(1) contrast(1.35)";
      x.drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url);
      res(c);
    };
    img.onerror = () => { URL.revokeObjectURL(url); res(file); };
    img.src = url;
  });
}

const SKIP = /합\s*계|소\s*계|부가세|과세|면세|카드|결제|승인|거스름|받을|받은|현금|포인트|할인|적립|사업자|대표|전화|TEL|주소|영수증|매장|POS|번호|일시|금액|단가|수량|상품명|봉투|쇼핑백|세제|휴지|물티슈|건전지/i;

export async function readReceipt(file, onProgress) {
  await loadTesseract();
  const src = await prepare(file);
  const { data } = await window.Tesseract.recognize(src, "kor+eng", {
    logger: m => { if (m.status === "recognizing text" && onProgress) onProgress(Math.round(m.progress * 100)); }
  });
  const out = [], seen = new Set();
  for (let raw of data.text.split("\n")) {
    const line = raw.replace(/[|*#_~]/g, " ").replace(/\s+/g, " ").trim();
    if (!line || SKIP.test(line)) continue;
    const m = line.match(/^(.*?[가-힣A-Za-z].*?)\s+(\d{1,3}(?:[,.]\d{3})+|\d{3,6})\s*(?:원)?\s*$/);
    if (!m) continue;
    let name = m[1]
      .replace(/^[\d\s.,*#\-]+/, "")              // 앞쪽 코드·번호
      .replace(/\s+\d+\s*(개|EA|ea)?$/, "")        // 뒤쪽 수량
      .replace(/\(?\d+(\.\d+)?\s*(g|kg|ml|l|L|입|구)\)?/g, "") // 용량
      .replace(/\s+/g, " ").trim();
    if (name.replace(/[^가-힣A-Za-z]/g, "").length < 2) continue;
    const price = Number(m[2].replace(/[,.]/g, ""));
    if (price < 100 || price > 500000) continue;
    if (seen.has(name)) continue;
    seen.add(name);
    out.push({ name: name.slice(0, 20), price });
  }
  return out;
}
