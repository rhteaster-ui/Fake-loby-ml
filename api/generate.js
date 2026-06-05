const generateCard = require('fake-ml');
const fs = require('node:fs');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  try {
    const { avatarUrl, username, rank, border } = req.body;

    // Eksekusi module fake-ml
    const cardResult = await generateCard({
      avatar: avatarUrl || 'default',
      username: username || 'Player',
      rank: rank || 'imo',
      border: parseInt(border) || 0
    });

    if (cardResult.status === 'success' && cardResult.result) {
      // Baca hasil gambar, kirim ulang ke frontend sebagai Base64
      const imageBuffer = fs.readFileSync(cardResult.result);
      const outputBase64 = `data:image/png;base64,${imageBuffer.toString('base64')}`;
      
      // Hapus file sementara biar storage Vercel nggak kepenuhan
      try { fs.unlinkSync(cardResult.result); } catch (e) {}

      return res.status(200).json({ success: true, imageUrl: outputBase64 });
    } else {
      return res.status(500).json({ success: false, error: "Module fake-ml gagal nge-generate gambar" });
    }
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}
