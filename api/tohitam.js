import fetch from 'node-fetch';

/**
 * Serverless Function untuk Vercel.
 * Menerima permintaan POST dari frontend untuk memproses gambar.
 */
export default async (req, res) => {
    
    if (req.method !== 'POST') {
        return res.status(405).send({ success: false, message: 'Hanya metode POST yang diizinkan.' });
    }
    
    const { imageUrl, imageData, fileName } = req.body;
    const API_URL_BASE = 'https://izumiiiiiiii.dpdns.org/ai-image/hytamkan';
    
    // Handle file upload (base64)
    if (imageData) {
        try {
            // Untuk base64, kita perlu mengupload ke temporary service dulu
            // Karena API eksternal hanya menerima URL, bukan base64
            
            // Approach: Upload base64 ke tmpfiles.org (free service)
            const base64String = imageData.replace(/^data:image\/\w+;base64,/, '');
            const imageBuffer = Buffer.from(base64String, 'base64');
            
            // Upload ke tmpfiles.org
            const formData = new FormData();
            const blob = new Blob([imageBuffer], { type: 'image/jpeg' });
            formData.append('file', blob, fileName || 'upload.jpg');
            
            const uploadResponse = await fetch('https://tmpfiles.org/api/v1/upload', {
                method: 'POST',
                body: formData
            });
            
            const uploadResult = await uploadResponse.json();
            
            if (!uploadResult.data.url) {
                throw new Error('Gagal upload gambar ke temporary storage');
            }
            
            // Convert tmpfiles.org URL to direct download URL
            const tmpUrl = uploadResult.data.url;
            const directUrl = tmpUrl.replace('tmpfiles.org/', 'tmpfiles.org/dl/');
            
            // Sekarang panggil API eksternal dengan URL temporary
            const apiUrl = `${API_URL_BASE}?imageUrl=${encodeURIComponent(directUrl)}`;
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

        } catch (error) {
            console.error('Upload Error:', error);
            return res.status(500).json({ 
                success: false, 
                message: `Gagal memproses file upload: ${error.message}` 
            });
        }
    }
    
    // Handle URL (original functionality)
    if (!imageUrl) {
        return res.status(400).json({ success: false, message: 'Data gambar tidak ditemukan.' });
    }

    try {
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

    } catch (error) {
        console.error('Serverless Function Error:', error);
        return res.status(500).json({ 
            success: false, 
            message: `Terjadi kesalahan: ${error.message}` 
        });
    }
};
