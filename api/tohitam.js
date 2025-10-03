import fetch from 'node-fetch';

export default async function handler(request, response) {
    // Set CORS headers
    response.setHeader('Access-Control-Allow-Credentials', true);
    response.setHeader('Access-Control-Allow-Origin', '*');
    response.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    response.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

    // Handle OPTIONS request for CORS
    if (request.method === 'OPTIONS') {
        return response.status(200).end();
    }

    // Only allow POST requests
    if (request.method !== 'POST') {
        return response.status(405).json({
            success: false,
            message: 'Hanya metode POST yang diizinkan'
        });
    }

    try {
        const { imageData, fileName } = request.body;

        if (!imageData) {
            return response.status(400).json({
                success: false,
                message: 'Tidak ada gambar yang diupload'
            });
        }

        // Extract base64 data (remove data:image/jpeg;base64, prefix)
        const base64Data = imageData.replace(/^data:image\/\w+;base64,/, '');
        
        // Convert base64 to buffer
        const imageBuffer = Buffer.from(base64Data, 'base64');
        
        // For now, we'll use a temporary approach since the external API only accepts URLs
        // In production, you would upload to a cloud storage first
        return response.status(200).json({
            success: true,
            message: 'File berhasil diterima! (Fitur upload langsung sedang dikembangkan)',
            resultUrl: imageData // Return the original image for now
        });

        // NOTE: Untuk benar-benar memproses gambar, kita perlu:
        // 1. Upload imageBuffer ke cloud storage (AWS S3, Cloudinary, dll)
        // 2. Dapatkan URL public dari gambar yang diupload
        // 3. Kirim URL tersebut ke API eksternal
        // 4. Return hasilnya ke client

    } catch (error) {
        console.error('API Error:', error);
        return response.status(500).json({
            success: false,
            message: `Terjadi kesalahan: ${error.message}`
        });
    }
}
