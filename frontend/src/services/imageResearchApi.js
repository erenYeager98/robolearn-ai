const RESEARCH_API_URL = 'https://api.erenyeager-dk.live/api/analyze-image'; // Adjust this to your actual endpoint URL

export const searchResearch = async (imageBlob, timeout = 4500000) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const formData = new FormData();
    formData.append('file', imageBlob, 'image.jpg');

    const response = await fetch(RESEARCH_API_URL, {
      method: 'POST',
      body: formData,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('Research data received:', data);
    return data;
  } catch (error) {
    clearTimeout(timeoutId);
    console.error('Error fetching research data:', error);
    throw error;
  }
};
