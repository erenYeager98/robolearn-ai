// src/services/imageSearchApi.js

export const fetchImageCarousel = async (query) => {
  try {
    const response = await fetch('/api/gen_keywords', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    // The API returns { "answer": [...] }, so we return the array.
    return data.answer;
  } catch (error) {
    console.error("Failed to fetch image carousel:", error);
    // Return an empty array on error to prevent crashes.
    return [];
  }
};