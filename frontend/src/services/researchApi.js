const RESEARCH_API_URL = 'http://10.110.87.206:5000/research'; // Adjust this to your actual endpoint URL

export const searchResearch = async (question) => {
  try {
    const response = await fetch(RESEARCH_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        question: question
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