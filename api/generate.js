const generateCard = require('fake-ml');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const DEFAULTS = {
  username: 'Player',
  rank: 'imo',
  border: 0
};

const ALLOWED_RANKS = new Set(['epic', 'glory', 'gm', 'honor', 'imo', 'legend', 'mawi']);
const MIN_BORDER = 0;
const MAX_BORDER = 16;

function sendJson(res, statusCode, payload) {
  res.statusCode = statusCode;
  if (typeof res.setHeader === 'function') {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store');
  }
  if (typeof res.status === 'function') return res.status(statusCode).json(payload);
  return res.end(JSON.stringify(payload));
}

function parseBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string' && req.body.trim()) return JSON.parse(req.body);
  return {};
}

function normalizeAvatar(avatarUrl) {
  if (typeof avatarUrl !== 'string') return undefined;
  const value = avatarUrl.trim();
  if (!value || value === 'default') return undefined;
  if (/^https?:\/\//i.test(value) || /^data:image\/(png|jpe?g|webp);base64,/i.test(value)) {
    return value;
  }
  return undefined;
}

function normalizeUsername(username) {
  const raw = typeof username === 'string' ? username.trim() : DEFAULTS.username;
  const clipped = (raw || DEFAULTS.username).slice(0, 15);
  return clipped.replace(/[\\/\0]/g, '_');
}

function normalizeRank(rank) {
  const value = typeof rank === 'string' ? rank.trim().toLowerCase() : DEFAULTS.rank;
  return ALLOWED_RANKS.has(value) ? value : DEFAULTS.rank;
}

function normalizeBorder(border) {
  const value = Number.parseInt(border, 10);
  if (Number.isNaN(value)) return DEFAULTS.border;
  return Math.min(MAX_BORDER, Math.max(MIN_BORDER, value));
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return sendJson(res, 405, { success: false, error: 'Method Not Allowed' });
  }

  let outputPath;

  try {
    const body = parseBody(req);
    const avatar = normalizeAvatar(body.avatarUrl);
    const username = normalizeUsername(body.username);
    const rank = normalizeRank(body.rank);
    const border = normalizeBorder(body.border);

    const cardResult = await generateCard({
      ...(avatar ? { avatar } : {}),
      username,
      rank,
      border,
      outputDir: os.tmpdir()
    });

    outputPath = cardResult.result;

    if (cardResult.status !== 'success' || !outputPath) {
      return sendJson(res, 500, { success: false, error: 'Module fake-ml gagal membuat gambar.' });
    }

    const imageBuffer = fs.readFileSync(outputPath);
    const outputBase64 = `data:image/png;base64,${imageBuffer.toString('base64')}`;

    return sendJson(res, 200, {
      success: true,
      imageUrl: outputBase64,
      meta: {
        username,
        rank,
        border,
        avatar: avatar ? 'custom' : 'default'
      }
    });
  } catch (error) {
    return sendJson(res, 500, {
      success: false,
      error: error && error.message ? error.message : 'Terjadi error saat generate gambar.'
    });
  } finally {
    if (outputPath) {
      try { fs.unlinkSync(outputPath); } catch (_) {}
      try { fs.rmdirSync(path.dirname(outputPath)); } catch (_) {}
    }
  }
};
