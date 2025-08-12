// services/localApi.js

const RESEARCH_API_URL = 'https://api.erenyeager-dk.live/api/local_research'; // Adjust this to your actual endpoint URL

export const searchLocalLLM = async (question,emotion) => {
  console.log('Searching research for:', question);
  try {
    const response = await fetch(RESEARCH_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        question: question,
        emotion: emotion || 'neutral' // Include emotion if available
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching research data:', error);
    throw error;
  }
};