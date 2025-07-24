// Emotion Detection API service
export const analyzeEmotionFromImage = async (imageBase64) => {
  try {
    const response = await fetch('http://localhost:8000/api/detect-emotion', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        image: imageBase64,
        timestamp: Date.now()
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error calling emotion API:', error);
    throw error;
  }
};

// Alternative endpoint for batch processing
export const analyzeEmotionBatch = async (images) => {
  try {
    const response = await fetch('/api/analyze-emotion-batch', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        images: images,
        timestamp: Date.now()
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error calling batch emotion API:', error);
    throw error;
  }
};

// Get emotion detection status/health
export const getEmotionApiStatus = async () => {
  try {
    const response = await fetch('/api/emotion-status');
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error checking emotion API status:', error);
    throw error;
  }
};