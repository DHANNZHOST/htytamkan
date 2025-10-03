// Mock AI Image Generator - Replace with real API
async function generateImage() {
    const prompt = document.getElementById('prompt').value;
    
    if (!prompt) {
        alert('Masukkan prompt dulu!');
        return;
    }

    // Show loading
    document.getElementById('loading').style.display = 'block';
    document.getElementById('result').style.display = 'none';

    try {
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Mock response - Replace this with real AI API
        const mockResponse = {
            status: true,
            statusCode: 200,
            result: {
                download: `https://via.placeholder.com/512/000000/FFFFFF?text=${encodeURIComponent(prompt)}`
            }
        };

        // Display result
        document.getElementById('generatedImage').src = mockResponse.result.download;
        document.getElementById('loading').style.display = 'none';
        document.getElementById('result').style.display = 'block';

    } catch (error) {
        console.error('Error:', error);
        document.getElementById('loading').style.display = 'none';
        alert('Error generating image. Coba lagi!');
    }
}

function downloadImage() {
    const imageUrl = document.getElementById('generatedImage').src;
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = 'ai-generated-image.png';
    link.click();
}

// Enter key support
document.getElementById('prompt').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        generateImage();
    }
});
