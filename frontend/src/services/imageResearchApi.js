const RESEARCH_API_URL = 'https://api.erenyeager-dk.live/api/analyze-image/'; // Adjust this to your actual endpoint URL

export const searchResearch = async (imageBlob) => {
  try {
    const formData = new FormData();
    formData.append('file', imageBlob, 'image.jpg'); // Adjust the filename as needed
    const response = await fetch(RESEARCH_API_URL, {
      method: 'POST',
      body: formData
     
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('Research data received:', data);
    return data;
  } catch (error) {
    console.error('Error fetching research data:', error);
    throw error;
  }
};