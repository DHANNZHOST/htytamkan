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
        return res.status(405).json({ success: false, message: 'Method not allowed' });
    }
    
    try {
        const { imageData } = req.body;
        
        if (!imageData) {
            return res.status(400).json({ success: false, message: 'No image data' });
        }

        console.log('Uploading to ImgBB...');
        
        // Upload ke ImgBB (free image hosting)
        const base64Data = imageData.replace(/^data:image\/\w+;base64,/, '');
        const formData = new FormData();
        formData.append('image', base64Data);

        const imgbbResponse = await fetch('https://api.imgbb.com/1/upload?key=your-api-key-here', {
            method: 'POST',
            body: formData
        });

        const imgbbResult = await imgbbResponse.json();
        
        if (imgbbResult.success && imgbbResult.data && imgbbResult.data.url) {
            const imageUrl = imgbbResult.data.url;
            
            // Process dengan API eksternal
            const apiUrl = `https://izumiiiiiiii.dpdns.org/ai-image/hytamkan?imageUrl=${encodeURIComponent(imageUrl)}`;
            const apiResponse = await fetch(apiUrl);
            
            const result = await apiResponse.json();
            
            if (result && result.result && result.result.download) {
                return res.json({
                    success: true,
                    message: 'Success!',
                    resultUrl: result.result.download
                });
            }
        }
        
        throw new Error('Upload failed');
        
    } catch (error) {
        console.error('Error:', error);
        return res.status(500).json({ 
            success: false, 
            message: 'Upload failed. Please try with image URL instead.' 
        });
    }
}
