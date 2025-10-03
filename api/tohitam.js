import fetch from 'node-fetch';

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
        return res.status(405).json({ success: false, message: 'Hanya metode POST yang diizinkan.' });
    }
    
    try {
        const { imageData } = req.body;
        const API_URL_BASE = 'https://izumiiiiiiii.dpdns.org/ai-image/hytamkan';
        
        if (!imageData) {
            return res.status(400).json({ success: false, message: 'Tidak ada gambar yang diupload.' });
        }

        console.log('Processing image upload...');
        
        // APPROACH SEDERHANA: Convert base64 ke data URL dan coba langsung
        // Beberapa API bisa menerima data URL langsung
        const dataUrl = imageData;
        
        console.log('Calling external API with data URL...');
        const apiUrl = `${API_URL_BASE}?imageUrl=${encodeURIComponent(dataUrl)}`;
        const apiResponse = await fetch(apiUrl);

        if (!apiResponse.ok) {
            throw new Error(`External API failed: ${apiResponse.status}`);
        }

        const json = await apiResponse.json();
        console.log('API Response:', json);

        if (json && json.result && json.result.download) {
            return res.status(200).json({ 
                success: true, 
                message: 'Gambar berhasil diolah!',
                resultUrl: json.result.download
            });
        } else {
            throw new Error('Invalid response format');
        }

    } catch (error) {
        console.error('Error:', error);
        return res.status(500).json({ 
            success: false, 
            message: `Upload gagal: ${error.message}. Coba gunakan gambar dari URL.` 
        });
    }
}
