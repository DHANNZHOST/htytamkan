import fetch from 'node-fetch';

export default async function handler(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, message: 'Hanya metode POST yang diizinkan.' });
    }
    
    try {
        const { imageUrl } = req.body;
        const API_URL_BASE = 'https://izumiiiiiiii.dpdns.org/ai-image/hytamkan';
        
        if (!imageUrl) {
            return res.status(400).json({ success: false, message: 'URL gambar wajib diisi.' });
        }

        console.log('Processing URL:', imageUrl);
        
        // Validate URL format
        try {
            new URL(imageUrl);
        } catch {
            return res.status(400).json({ success: false, message: 'Format URL tidak valid.' });
        }

        // Panggil API eksternal
        const apiUrl = `${API_URL_BASE}?imageUrl=${encodeURIComponent(imageUrl)}`;
        console.log('Calling external API:', apiUrl);
        
        const apiResponse = await fetch(apiUrl, {
            method: 'GET',
            timeout: 30000
        });

        if (!apiResponse.ok) {
            console.error('External API failed:', apiResponse.status);
            return res.status(502).json({ 
                success: false, 
                message: `Gagal memproses gambar. Status: ${apiResponse.status}` 
            });
        }

        const json = await apiResponse.json();
        console.log('API Response received');

        if (!json || !json.result || !json.result.download) {
            return res.status(500).json({ 
                success: false, 
                message: 'Format respons dari server tidak sesuai.' 
            });
        }

        const resultImageUrl = json.result.download;
        
        return res.status(200).json({ 
            success: true, 
            message: 'Gambar berhasil diubah menjadi hitam putih!',
            resultUrl: resultImageUrl
        });

    } catch (error) {
        console.error('Server Error:', error);
        return res.status(500).json({ 
            success: false, 
            message: `Terjadi kesalahan: ${error.message}` 
        });
    }
}
