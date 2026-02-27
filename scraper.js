/**
 * Çoklu kitap sitesi scraper - Her site için özel handler
 * Kaynak Adı, Yayınevi, Kaynak Tipi, Görsel URL (yayınevi logosu) çeker.
 *
 * Kullanım: node scraper.js
 * Bağımlılık: npm install puppeteer
 */

const fs = require("fs");
const path = require("path");

// Taranacak sayfalar: { url, yayınevi, logo_url? }
const PAGES = [
  { url: "https://www.kitapsec.com/Yayinevleri/Retro-Yayincilik/", yayınevi: "Retro Yayıncılık", logo_url: null },
  { url: "https://www.kitapsec.com/Yayinevleri/Informal-Yayinlari/", yayınevi: "İnformal Yayınları", logo_url: null },
  { url: "https://www.kitapsec.com/Yayinevleri/Bilgi-Sarmal-Yayinlari/", yayınevi: "Bilgi Sarmal Yayınları", logo_url: null },
  { url: "https://www.kitapsec.com/Yayinevleri/3D-Yayinlari/", yayınevi: "3D Yayınları", logo_url: null },
  { url: "https://www.kitapsec.com/Yayinevleri/Uc-Dort-Bes-Yayinlari/", yayınevi: "Üç Dört Beş Yayınları", logo_url: null },
  { url: "https://www.kitapsec.com/Yayinevleri/Antrenman-Yayinlari/", yayınevi: "Antrenman Yayınları", logo_url: null },
  { url: "https://www.kitapsec.com/Yayinevleri/Tonguc-Akademi/", yayınevi: "Tonguç Akademi", logo_url: null },
  { url: "https://www.kitapsec.com/Yayinevleri/Karekok-Yayinlari/", yayınevi: "Karekök Yayınları", logo_url: null },
  { url: "https://www.kitapsec.com/Yayinevleri/Yayin-Denizi-Yayinlari/", yayınevi: "Yayın Denizi Yayınları", logo_url: null },
  { url: "https://www.kitapsec.com/Yayinevleri/KR-Akademi-Yayinlari/", yayınevi: "KR Akademi Yayınları", logo_url: null },
  { url: "https://www.kitapsec.com/Yayinevleri/Palme-Yayinevi/", yayınevi: "Palme Yayınevi", logo_url: null },
  { url: "https://www.kitapsec.com/Yayinevleri/Limit-Yayinlari/", yayınevi: "Limit Yayınları", logo_url: null },
  { url: "https://www.kitapsec.com/Yayinevleri/Benim-Hocam-Yayinlari/", yayınevi: "Benim Hocam Yayınları", logo_url: null },
  { url: "https://www.kitapsec.com/Yayinevleri/Yargi-Yayinlari/", yayınevi: "Yargı Yayınları", logo_url: null },
  { url: "https://www.kitapsec.com/Yayinevleri/Hiz-ve-Renk-Yayinlari/", yayınevi: "Hız ve Renk Yayınları", logo_url: null },
  { url: "https://www.kitapisler.com/A-Yayinlari_br_13", yayınevi: "A Yayınları", logo_url: null },
  { url: "https://www.kitapisler.com/altug-gunes-yayinlari_br_1557", yayınevi: "Altuğ Güneş Yayınları", logo_url: null },
  { url: "https://www.kitapisler.com/Apotemi-Yayinlari_br_177", yayınevi: "Apotemi Yayınları", logo_url: "https://www.kitapisler.com/images/marka/apotemi.png" },
  { url: "https://www.kitapisler.com/aromat-yayinlari_br_1339", yayınevi: "Aromat Yayınları", logo_url: null },
  { url: "https://www.kitapisler.com/Aydin-Yayinlari_br_90", yayınevi: "Aydın Yayınları", logo_url: null },
  { url: "https://www.kitapisler.com/Acil-Yayinlari_br_643", yayınevi: "Acil Yayınları", logo_url: null },
  { url: "https://www.oksijensatis.com/dr-biyoloji", yayınevi: "Dr. Biyoloji", logo_url: null },
];

// Kaynak tipi: soru_bankasi | video_ders_kitabi | deneme_sinavi | diger
function isimdenKaynakTipi(isim) {
  const ad = (isim || "").toUpperCase();
  if (ad.includes("DENEME") || ad.includes("SİMÜLASYON DENEME") || ad.includes("SIMÜLASYON DENEME")) return "deneme_sinavi";
  if (
    ad.includes("S.B.") || ad.includes("SORU BANKASI") || ad.includes("KA.SB") || /S\.B\./i.test(ad) ||
    ad.includes("SORU KAMPI") || ad.includes("ÇIKMIŞ SORULAR")
  ) return "soru_bankasi";
  if (ad.includes("VIDEO") || ad.includes("DERS KİTABI") || ad.includes("DEFTER") || ad.includes("VİDEO") || ad.includes("VİDEO DERS")) return "video_ders_kitabi";
  return "diger";
}

// Yayınevi logoları - bilinen URL'ler. Yeni eklemek için: "yayınevi adı": "https://..."
const YAYINEVI_LOGOS = {
  "apotemi yayınları": "https://www.kitapisler.com/images/marka/apotemi.png",
  "dr. biyoloji": "https://www.oksijensatis.com/images/logo.png",
};

function getSiteType(url) {
  if (url.includes("kitapsec.com")) return "kitapsec";
  if (url.includes("kitapisler.com")) return "kitapisler";
  if (url.includes("oksijensatis.com")) return "oksijensatis";
  return "unknown";
}

// --- KITAPSEC.COM ---
async function scrapeKitapsec(browser, pageConfig) {
  const { url, yayınevi, logo_url } = pageConfig;
  const page = await browser.newPage();
  await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36");
  await page.setViewport({ width: 1280, height: 800 });
  const kitaplar = [];
  const seen = new Set();

  const baseUrl = url.replace(/\/$/, "");
  const pageUrls = [baseUrl, `${baseUrl}/1-6-0a0-0-0-0-0-0.xhtml`];
  for (let p = 2; p <= 5; p++) {
    pageUrls.push(`${baseUrl}/1-6-0a0-0-0-0-0-0-${p}.xhtml`);
  }

  try {
    for (const pageUrl of pageUrls) {
      try {
        await page.goto(pageUrl, { waitUntil: "networkidle2", timeout: 15000 });
      } catch {
        continue;
      }

      const items = await page.evaluate(() => {
      const results = [];
      const links = document.querySelectorAll('a[href*="/Products/"][href*=".html"]');

      for (const a of links) {
        const href = (a.getAttribute("href") || "").trim();
        if (!href.includes("/Products/") || !href.includes(".html") || href.includes("Yayinevleri")) continue;

        const fullUrl = href.startsWith("http") ? href : "https://www.kitapsec.com" + (href.startsWith("/") ? href : "/" + href);

        const nameEl = a.querySelector("h2, h3, .product-title, .title, [class*='product']");
        let nameText = (nameEl ? nameEl.textContent : a.textContent) || "";
        nameText = nameText.replace(/\s+/g, " ").trim();

        if (!nameText || nameText.length < 5) continue;
        if (/^\d+[\s.,]*\d*\s*(TL|₺)/i.test(nameText) || nameText === "Sepete At" || nameText === "Hemen Al") continue;

        results.push({ kaynakAdi: nameText, link: fullUrl });
      }
      return results;
    });

      for (const item of items) {
        const key = item.kaynakAdi + "|" + item.link;
        if (seen.has(key)) continue;
        seen.add(key);

        const kaynakAdi = (item.kaynakAdi || "").trim();
        const yayineviVal = (yayınevi || "").trim();
        if (!kaynakAdi || !yayineviVal) continue;

        kitaplar.push({
          kaynakAdi,
          yayinevi: yayineviVal,
          kaynakTipi: isimdenKaynakTipi(kaynakAdi),
          gorsel_url: logo_url || YAYINEVI_LOGOS[yayineviVal.toLowerCase()] || null,
        });
      }
    }
  } catch (err) {
    console.error(`Kitapsec hatası (${url}):`, err.message);
  } finally {
    await page.close();
  }
  return kitaplar;
}

// --- KITAPISLER.COM (İşler Kitabevi - isleryolda ile aynı yapı) ---
async function scrapeKitapisler(browser, pageConfig) {
  const { url, yayınevi, logo_url } = pageConfig;
  const page = await browser.newPage();
  await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36");
  await page.setViewport({ width: 1280, height: 800 });
  const kitaplar = [];
  const baseUrl = "https://www.kitapisler.com";

  try {
    await page.goto(url, { waitUntil: "networkidle2", timeout: 30000 });

    const items = await page.evaluate((base) => {
      const results = [];
      const links = document.querySelectorAll('a[href*=".html"]:not([href*="javascript"])');

      for (const a of links) {
        const href = a.getAttribute("href") || "";
        if (!href.includes(".html")) continue;

        const fullUrl = href.startsWith("/") ? base + href : href.startsWith("http") ? href : base + "/" + href;

        let nameText = (a.textContent || "").replace(/\s+/g, " ").trim();
        if (!nameText || nameText.length < 5) continue;
        if (/^\d+[\s,]?\d*\s*₺/.test(nameText) || nameText === "Stokta Yok") continue;
        if (/^(Sepetimi Göster|Giriş|Ara|Üye Ol|Sipariş|Hesabım|₺|Hepsini Göster)$/i.test(nameText)) continue;

        results.push({ kaynakAdi: nameText, link: fullUrl });
      }
      return results;
    }, baseUrl);

    const seen = new Set();
    for (const item of items) {
      const key = item.kaynakAdi + "|" + item.link;
      if (seen.has(key)) continue;
      seen.add(key);

      const kaynakAdi = (item.kaynakAdi || "").trim();
      const yayineviVal = (yayınevi || "").trim();
      if (!kaynakAdi || !yayineviVal) continue;

      kitaplar.push({
        kaynakAdi,
        yayinevi: yayineviVal,
        kaynakTipi: isimdenKaynakTipi(kaynakAdi),
        gorsel_url: logo_url || YAYINEVI_LOGOS[yayineviVal.toLowerCase()] || null,
      });
    }
  } catch (err) {
    console.error(`Kitapisler hatası (${url}):`, err.message);
  } finally {
    await page.close();
  }
  return kitaplar;
}

// --- OKSIJENSATIS.COM (nopCommerce tabanlı) ---
async function scrapeOksijensatis(browser, pageConfig) {
  const { url, yayınevi, logo_url } = pageConfig;
  const page = await browser.newPage();
  await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36");
  await page.setViewport({ width: 1280, height: 800 });
  const kitaplar = [];
  const baseUrl = "https://www.oksijensatis.com";

  try {
    await page.goto(url, { waitUntil: "networkidle2", timeout: 30000 });

    const items = await page.evaluate((base) => {
      const results = [];
      const exclude = ["cart", "login", "register", "contact", "wishlist", "search", "OfferZone", "contactus", "conditions", "privacy", "shipping"];

      const cards = document.querySelectorAll(
        ".product-item, .item-box, .product-box, [class*='product-item'], [class*='product-box']"
      );

      for (const card of cards) {
        const titleEl = card.querySelector("h2 a, h3 a, .product-title a, .product-title");
        const linkEl = card.querySelector("a[href]");
        if (!linkEl) continue;

        let nameText = (titleEl ? titleEl.textContent : card.querySelector("h2, h3, .product-title")?.textContent) || "";
        nameText = nameText.replace(/\s+/g, " ").trim();
        if (!nameText || nameText.length < 5) nameText = linkEl.textContent?.replace(/\s+/g, " ").trim() || "";

        const href = linkEl.getAttribute("href") || "";
        if (!href || exclude.some((e) => href.toLowerCase().includes(e))) continue;
        if (nameText === "Görüntüle" || /^\d+[,.]?\d*\s*₺/i.test(nameText)) continue;

        const fullUrl = href.startsWith("http") ? href : base + (href.startsWith("/") ? href : "/" + href);
        if (!fullUrl.includes("oksijensatis.com")) continue;

        results.push({ kaynakAdi: nameText, link: fullUrl });
      }

      if (results.length === 0) {
        const h2s = document.querySelectorAll("main h2, .product-grid h2, #main h2, .content h2, [class*='product'] h2");
        for (const h2 of h2s) {
          const a = h2.querySelector("a") || h2.closest("a");
          const nameText = (h2.textContent || "").replace(/\s+/g, " ").trim();
          if (!nameText || nameText.length < 8) continue;
          if (/^\d+[,.]?\d*\s*₺/i.test(nameText)) continue;

          let href = a?.getAttribute("href");
          if (!href && h2.closest("[class*='item']")) {
            const link = h2.closest("[class*='item']").querySelector("a[href]");
            href = link?.getAttribute("href");
          }
          if (!href || exclude.some((e) => href.toLowerCase().includes(e))) continue;
          const fullUrl = href.startsWith("http") ? href : base + (href.startsWith("/") ? href : "/" + href);
          if (!fullUrl.includes("oksijensatis.com")) continue;
          results.push({ kaynakAdi: nameText, link: fullUrl });
        }
      }
      return results;
    }, baseUrl);

    const seen = new Set();
    for (const item of items) {
      const key = item.kaynakAdi + "|" + item.link;
      if (seen.has(key)) continue;
      seen.add(key);

      const kaynakAdi = (item.kaynakAdi || "").trim();
      const yayineviVal = (yayınevi || "").trim();
      if (!kaynakAdi || !yayineviVal) continue;

      kitaplar.push({
        kaynakAdi,
        yayinevi: yayineviVal,
        kaynakTipi: isimdenKaynakTipi(kaynakAdi),
        gorsel_url: logo_url || YAYINEVI_LOGOS[yayineviVal.toLowerCase()] || null,
      });
    }
  } catch (err) {
    console.error(`Oksijensatis hatası (${url}):`, err.message);
  } finally {
    await page.close();
  }
  return kitaplar;
}

async function scrapePage(browser, pageConfig) {
  const url = pageConfig.url;
  const siteType = getSiteType(url);

  switch (siteType) {
    case "kitapsec":
      return scrapeKitapsec(browser, pageConfig);
    case "kitapisler":
      return scrapeKitapisler(browser, pageConfig);
    case "oksijensatis":
      return scrapeOksijensatis(browser, pageConfig);
    default:
      console.error(`Bilinmeyen site: ${url}`);
      return [];
  }
}

async function main() {
  let browser;
  try {
    const puppeteer = require("puppeteer");
    browser = await puppeteer.launch({ headless: true, args: ["--no-sandbox"] });
  } catch (e) {
    console.error("Puppeteer yüklü değil. Çalıştırın: npm install puppeteer");
    process.exit(1);
  }

  const allBooks = [];

  for (const pageConfig of PAGES) {
    console.log(`Taranıyor: ${pageConfig.yayınevi} (${getSiteType(pageConfig.url)})`);
    const books = await scrapePage(browser, pageConfig);
    allBooks.push(...books);
    console.log(`  → ${books.length} kitap bulundu.`);
  }

  await browser.close();

  const outputPath = path.join(__dirname, "kitaplar.json");
  fs.writeFileSync(outputPath, JSON.stringify(allBooks, null, 2), "utf-8");
  console.log(`\nToplam ${allBooks.length} kitap kitaplar.json dosyasına kaydedildi.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
