import fetch from 'node-fetch';

/**
 * Serverless Function untuk Vercel.
 * Menerima permintaan POST dari frontend untuk memproses gambar.
 */
export default async function handler(req, res) {
    
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    if (req.method !== 'POST') {
        return res.status(405).json({ 
            success: false, 
            message: 'Hanya metode POST yang diizinkan.' 
        });
    }
    
    const API_URL_BASE = 'https://izumiiiiiiii.dpdns.org/ai-image/hytamkan';
    
    try {
        const { imageUrl, imageData } = req.body;
        
        let finalImageUrl = imageUrl;
        
        // Jika menggunakan upload file (base64)
        if (imageData && !imageUrl) {
            // Untuk base64, kita perlu mengupload ke service lain terlebih dahulu
            // Atau langsung menggunakan base64 jika API eksternal mendukung
            // Untuk sekarang, kita beri pesan bahwa fitur upload sedang dikembangkan
            return res.status(400).json({ 
                success: false, 
                message: 'Fitur upload file sedang dalam pengembangan. Silakan gunakan URL gambar untuk saat ini.' 
            });
        }
        
        if (!finalImageUrl) {
            return res.status(400).json({ 
                success: false, 
                message: 'URL gambar wajib diisi.' 
            });
        }

        // Validasi URL
        try {
            new URL(finalImageUrl);
        } catch (urlError) {
            return res.status(400).json({ 
                success: false, 
                message: 'URL tidak valid.' 
            });
        }

        // Panggil API eksternal
        const apiUrl = `${API_URL_BASE}?imageUrl=${encodeURIComponent(finalImageUrl)}`;
        console.log('Memanggil API eksternal:', apiUrl);
        
        const apiResponse = await fetch(apiUrl, {
            method: 'GET',
            timeout: 30000 // 30 detik timeout
        });

        if (!apiResponse.ok) {
            console.error('API Response not OK:', apiResponse.status, apiResponse.statusText);
            return res.status(502).json({ 
                success: false, 
                message: `Gagal menghubungi API pengolahan gambar. Status: ${apiResponse.status}` 
            });
        }

        const json = await apiResponse.json();
        console.log('Response dari API:', JSON.stringify(json).substring(0, 200));

        // Cek format respons
        if (!json || !json.result || !json.result.download) {
            return res.status(500).json({ 
                success: false, 
                message: 'Respon API eksternal tidak sesuai atau link hasil tidak ditemukan.' 
            });
        }

        const resultImageUrl = json.result.download;
        
        // Kirim respons berhasil
        return res.status(200).json({ 
            success: true, 
            message: 'Gambar berhasil diolah!',
            resultUrl: resultImageUrl
        });

    } catch (error) {
        console.error('Serverless Function Error:', error);
        return res.status(500).json({ 
            success: false, 
            message: `Terjadi kesalahan pada server: ${error.message}` 
        });
    }
}
