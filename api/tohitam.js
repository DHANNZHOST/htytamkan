import fetch from 'node-fetch';

/**
 * Serverless Function untuk Vercel.
 * Menerima permintaan POST dari frontend untuk memproses gambar.
 */
export default async (req, res) => {
    
    if (req.method !== 'POST') {
        return res.status(405).send({ success: false, message: 'Hanya metode POST yang diizinkan.' });
    }
    
    const imageUrl = req.body.imageUrl;
    const API_URL_BASE = 'https://izumiiiiiiii.dpdns.org/ai-image/hytamkan';
    
    if (!imageUrl) {
        return res.status(400).json({ success: false, message: 'URL gambar wajib diisi.' });
    }

    try {
        // 1. Panggil API eksternal
        const apiUrl = `${API_URL_BASE}?imageUrl=${encodeURIComponent(imageUrl)}`;
        const apiResponse = await fetch(apiUrl);

        if (!apiResponse.ok) {
            return res.status(502).json({ success: false, message: 'Gagal menghubungi API pengolahan gambar eksternal.' });
        }

        const json = await apiResponse.json();

        // 2. Cek format respons
        if (!json || !json.result || !json.result.download) {
            return res.status(500).json({ success: false, message: 'Respon API eksternal tidak sesuai atau link hasil tidak ditemukan.' });
        }

        const resultImageUrl = json.result.download;
        
        // 3. Kirim respons berhasil
        res.status(200).json({ 
            success: true, 
            message: 'Gambar berhasil diolah!',
            resultUrl: resultImageUrl
        });

    } catch (error) {
        console.error('Serverless Function Error:', error);
        res.status(500).json({ success: false, message: `Terjadi kesalahan pada server: ${error.message}` });
    }
};
