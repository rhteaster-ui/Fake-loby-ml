const fs = require('node:fs');
const path = require('node:path');

const ASSETS_DIR = path.join(process.cwd(), 'node_modules', 'fake-ml', 'assets');
const RANKS = new Set(['epic', 'glory', 'gm', 'honor', 'imo', 'legend', 'mawi']);

function sendJson(res, statusCode, payload) {
  res.statusCode = statusCode;
  if (typeof res.setHeader === 'function') res.setHeader('Content-Type', 'application/json; charset=utf-8');
  if (typeof res.status === 'function') return res.status(statusCode).json(payload);
  return res.end(JSON.stringify(payload));
}

function sendFile(res, filePath, contentType) {
  const buffer = fs.readFileSync(filePath);
  res.statusCode = 200;
  if (typeof res.setHeader === 'function') {
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  }
  if (typeof res.send === 'function') return res.send(buffer);
  return res.end(buffer);
}

module.exports = function handler(req, res) {
  if (req.method !== 'GET') return sendJson(res, 405, { success: false, error: 'Method Not Allowed' });

  const { type, id } = req.query || {};
  const assetType = String(type || '').toLowerCase();
  const assetId = String(id || '').toLowerCase();

  try {
    if (assetType === 'rank' && RANKS.has(assetId)) {
      return sendFile(res, path.join(ASSETS_DIR, 'rank', `${assetId}.webp`), 'image/webp');
    }

    if (assetType === 'border') {
      const border = Number.parseInt(assetId, 10);
      if (border >= 1 && border <= 16) {
        return sendFile(res, path.join(ASSETS_DIR, 'border', `${border}.webp`), 'image/webp');
      }
    }

    if (assetType === 'avatar') {
      return sendFile(res, path.join(ASSETS_DIR, 'avatar.jpg'), 'image/jpeg');
    }

    return sendJson(res, 404, { success: false, error: 'Asset tidak ditemukan.' });
  } catch (error) {
    return sendJson(res, 500, { success: false, error: error.message || 'Gagal membaca asset.' });
  }
};
