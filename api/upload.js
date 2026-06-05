const axios = require("axios");
const FormData = require("form-data");
const cheerio = require("cheerio");
const { CookieJar } = require("tough-cookie");
const { wrapper } = require("axios-cookiejar-support");

const API = "https://8upload.com";
const UA = "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Mobile Safari/537.36";
const jar = new CookieJar();
const client = wrapper(
  axios.create({
    baseURL: API,
    jar,
    withCredentials: true,
    timeout: 120000,
    validateStatus: () => true,
    headers: {
      "user-agent": UA,
      "accept-language": "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7"
    }
  })
);

function normalizeUploadPath(data) {
  if (typeof data !== "string") return null;
  const text = data.trim();
  if (text.startsWith("/uploads/")) return text;
  try {
    const parsed = JSON.parse(text);
    if (typeof parsed === "string" && parsed.startsWith("/uploads/")) return parsed;
  } catch {}
  const match = text.match(/\/uploads\/[a-zA-Z0-9]+/);
  return match ? match[0] : null;
}

function parseHotlink(html) {
  const $ = cheerio.load(String(html || ""));
  let result = null;
  $("label").each((_, el) => {
    const text = $(el).text().trim();
    if (text.includes("Hotlink") || text.includes("Direct-Link")) {
      result = $(el).next("input").attr("value")?.trim() || null;
    }
  });
  if (result) return result;
  const inputUrl = $('input[value^="https://i.8upload.com/image/"]').attr("value")?.trim();
  if (inputUrl) return inputUrl;
  const regex = String(html || "").match(/https:\/\/i\.8upload\.com\/image\/[^'"<>\s]+/);
  if (regex) return regex[0];
  const preview = $("img.istatus").attr("src")?.trim();
  if (preview) return preview.replace("/preview/", "/image/");
  return null;
}

async function initSession() {
  await client.get("/", {
    headers: { accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8", referer: `${API}/` }
  });
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  try {
    const { imageBase64 } = req.body;
    if (!imageBase64) return res.status(400).json({ error: 'Tidak ada gambar yang dikirim' });

    await initSession();

    // Convert Base64 dari Web ke Buffer
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");
    const buffer = Buffer.from(base64Data, 'base64');

    const form = new FormData();
    form.append("images[]", buffer, { filename: "upload.jpg", contentType: "image/jpeg" });

    const uploadRes = await client.post("/upload/mt/", form, {
      maxBodyLength: Infinity,
      maxContentLength: Infinity,
      headers: {
        ...form.getHeaders(),
        accept: "application/json, text/javascript, */*; q=0.01",
        origin: API,
        referer: `${API}/`,
        "x-requested-with": "XMLHttpRequest"
      }
    });

    let html = uploadRes.data || "";
    const uploadPath = normalizeUploadPath(html);

    if (uploadPath) {
      const previewRes = await client.get(uploadPath, { headers: { referer: `${API}/`, "upgrade-insecure-requests": "1" } });
      html = previewRes.data || "";
    }

    const resultUrl = parseHotlink(html);
    
    if (resultUrl) {
      return res.status(200).json({ success: true, url: resultUrl });
    } else {
      return res.status(500).json({ success: false, error: "Gagal ekstrak Hotlink dari 8upload" });
    }
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}
