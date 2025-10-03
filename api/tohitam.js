import fetch from 'node-fetch';

/**
 * Serverless Function untuk Vercel.
 * Menerima permintaan POST dari frontend untuk memproses gambar.
 */
export default async (req, res) => {
    
    if (req.method !== 'POST') {
        return res.status(405).send({ success: false, message: 'Hanya metode POST yang diizinkan.' });
    }
    
    const { imageUrl, imageData } = req.body;
    const API_URL_BASE = 'https://izumiiiiiiii.dpdns.org/ai-image/hytamkan';
    
    // Handle file upload (base64)
    if (imageData) {
        try {
            // Convert base64 to blob and upload to free image hosting
            const base64String = imageData.replace(/^data:image\/\w+;base64,/, '');
            
            // Upload ke free image hosting service
            const formData = new FormData();
            const blob = new Blob([Buffer.from(base64String, 'base64')], { 
                type: 'image/jpeg' 
            });
            
            // Upload ke tmpfiles.org
            const uploadResponse = await fetch('https://tmpfiles.org/api/v1/upload', {
                method: 'POST',
                body: (() => {
                    const form = new FormData();
                    form.append('file', blob, 'upload.jpg');
                    return form;
                })()
            });

            const uploadResult = await uploadResponse.json();
            
            if (uploadResult.data && uploadResult.data.url) {
                // Convert to direct download URL
                const tmpUrl = uploadResult.data.url;
                const directUrl = tmpUrl.replace('tmpfiles.org/', 'tmpfiles.org/dl/');
                
                // Process dengan API eksternal
                const apiUrl = `${API_URL_BASE}?imageUrl=${encodeURIComponent(directUrl)}`;
                const apiResponse = await fetch(apiUrl);

                if (!apiResponse.ok) {
                    throw new Error('API eksternal tidak merespon');
                }

                const json = await apiResponse.json();

                if (!json || !json.result || !json.result.download) {
                    throw new Error('Format respons API tidak sesuai');
                }

                const resultImageUrl = json.result.download;
                
                return res.status(200).json({ 
                    success: true, 
                    message: 'Gambar berhasil diolah!',
                    resultUrl: resultImageUrl
                });
            } else {
                throw new Error('Gagal upload gambar ke temporary storage');
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
            console.error('URL Error:', error);
            return res.status(500).json({ 
                success: false, 
                message: `Terjadi kesalahan: ${error.message}` 
            });
        }
    }
    
    return res.status(400).json({ success: false, message: 'Data gambar tidak ditemukan.' });
};
