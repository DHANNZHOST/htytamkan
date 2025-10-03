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
        
        // Handle file upload (base64)
        if (imageData) {
            try {
                console.log('Processing image upload...');
                
                // Convert base64 to blob and upload to free image hosting
                const base64String = imageData.replace(/^data:image\/\w+;base64,/, '');
                const imageBuffer = Buffer.from(base64String, 'base64');
                
                // Upload ke tmpfiles.org
                const formData = new FormData();
                const blob = new Blob([imageBuffer], { type: 'image/jpeg' });
                formData.append('file', blob, 'upload.jpg');
                
                console.log('Uploading to tmpfiles.org...');
                const uploadResponse = await fetch('https://tmpfiles.org/api/v1/upload', {
                    method: 'POST',
                    body: formData
                });

                if (!uploadResponse.ok) {
                    throw new Error(`Upload failed with status: ${uploadResponse.status}`);
                }

                const uploadResult = await uploadResponse.json();
                console.log('Upload result:', uploadResult);
                
                if (uploadResult.data && uploadResult.data.url) {
                    // Convert to direct download URL
                    const tmpUrl = uploadResult.data.url;
                    const directUrl = tmpUrl.replace('tmpfiles.org/', 'tmpfiles.org/dl/');
                    
                    console.log('Processing with external API:', directUrl);
                    
                    // Process dengan API eksternal
                    const apiUrl = `${API_URL_BASE}?imageUrl=${encodeURIComponent(directUrl)}`;
                    const apiResponse = await fetch(apiUrl);

                    if (!apiResponse.ok) {
                        throw new Error(`External API failed with status: ${apiResponse.status}`);
                    }

                    const json = await apiResponse.json();
                    console.log('External API response:', json);

                    if (!json || !json.result || !json.result.download) {
                        throw new Error('Invalid response format from external API');
                    }

                    const resultImageUrl = json.result.download;
                    
                    return res.status(200).json({ 
                        success: true, 
                        message: 'Gambar berhasil diolah!',
                        resultUrl: resultImageUrl
                    });
                } else {
                    throw new Error('No URL returned from upload service');
                }

            } catch (error) {
                console.error('Upload Error:', error);
                return res.status(500).json({ 
                    success: false, 
                    message: `Gagal memproses upload: ${error.message}` 
                });
            }
        }
        
        // Handle URL (original functionality - backup)
        if (imageUrl) {
            console.log('Processing URL:', imageUrl);
            const apiUrl = `${API_URL_BASE}?imageUrl=${encodeURIComponent(imageUrl)}`;
            const apiResponse = await fetch(apiUrl);

            if (!apiResponse.ok) {
                return res.status(502).json({ success: false, message: 'Gagal menghubungi API pengolahan gambar.' });
            }

            const json = await apiResponse.json();

            if (!json || !json.result || !json.result.download) {
                return res.status(500).json({ success: false, message: 'Respon API tidak sesuai.' });
            }

            const resultImageUrl = json.result.download;
            
            return res.status(200).json({ 
                success: true, 
                message: 'Gambar berhasil diolah!',
                resultUrl: resultImageUrl
            });
        }
        
        return res.status(400).json({ success: false, message: 'Data gambar tidak ditemukan.' });

    } catch (error) {
        console.error('Server Error:', error);
        return res.status(500).json({ 
            success: false, 
            message: `Terjadi kesalahan: ${error.message}` 
        });
    }
}
