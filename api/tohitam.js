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

    // Handle OPTIONS preflight
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, message: 'Hanya metode POST yang diizinkan.' });
    }
    
    try {
        const { imageUrl, imageData } = req.body;
        const API_URL_BASE = 'https://izumiiiiiiii.dpdns.org/ai-image/hytamkan';
        
        console.log('Received request:', { hasImageUrl: !!imageUrl, hasImageData: !!imageData });
        
        let finalImageUrl = imageUrl;

        // Handle file upload (base64) - Convert to data URL yang bisa diakses
        if (imageData && !imageUrl) {
            try {
                console.log('Processing image upload...');
                
                // Karena API eksternal hanya terima URL, kita buat temporary approach
                // Kita akan convert base64 ke blob URL yang bisa diakses
                // TAPI karena kita di server, kita perlu cara lain
                
                // APPROACH: Upload ke service yang lebih reliable
                const base64String = imageData.replace(/^data:image\/\w+;base64,/, '');
                const imageBuffer = Buffer.from(base64String, 'base64');
                
                // Coba upload ke freeimage.host
                const uploadFormData = new FormData();
                const blob = new Blob([imageBuffer], { type: 'image/jpeg' });
                uploadFormData.append('file', blob, 'upload.jpg');
                
                console.log('Trying freeimage.host...');
                const uploadResponse = await fetch('https://freeimage.host/api/1/upload', {
                    method: 'POST',
                    body: uploadFormData
                });

                if (uploadResponse.ok) {
                    const uploadResult = await uploadResponse.json();
                    console.log('Upload success:', uploadResult);
                    
                    if (uploadResult.image && uploadResult.image.url) {
                        finalImageUrl = uploadResult.image.url;
                    }
                } else {
                    console.log('freeimage.host failed, trying alternative...');
                    // Fallback: Convert base64 ke URL yang bisa diakses
                    // Kita buat data URL yang diperpanjang
                    finalImageUrl = imageData; // Coba langsung pakai data URL
                }

            } catch (uploadError) {
                console.error('Upload Error:', uploadError);
                // Fallback ke data URL langsung
                finalImageUrl = imageData;
            }
        }
        
        if (!finalImageUrl) {
            return res.status(400).json({ success: false, message: 'Data gambar tidak ditemukan.' });
        }

        console.log('Processing with URL:', finalImageUrl.substring(0, 100) + '...');
        
        // Process dengan API eksternal
        const apiUrl = `${API_URL_BASE}?imageUrl=${encodeURIComponent(finalImageUrl)}`;
        console.log('Calling external API:', apiUrl);
        
        const apiResponse = await fetch(apiUrl, {
            method: 'GET',
            timeout: 30000
        });

        if (!apiResponse.ok) {
            console.error('External API failed:', apiResponse.status, apiResponse.statusText);
            return res.status(502).json({ 
                success: false, 
                message: `API eksternal tidak merespon: ${apiResponse.status}` 
            });
        }

        const json = await apiResponse.json();
        console.log('External API response:', json);

        if (!json || !json.result || !json.result.download) {
            return res.status(500).json({ 
                success: false, 
                message: 'Format respons dari API eksternal tidak sesuai' 
            });
        }

        const resultImageUrl = json.result.download;
        
        return res.status(200).json({ 
            success: true, 
            message: 'Gambar berhasil diolah!',
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
