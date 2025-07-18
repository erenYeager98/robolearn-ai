const IMAGE_SEARCH_API_URL = 'http://16.171.150.90:8000/search-lens'; 

export const searchByImage = async (imageUrl) => {
  try {
    const response = await fetch("http://16.171.150.90:8000/search-lens", {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ url: imageUrl })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching image search data:', error);
    // Return mock data for demonstration
    return {
      searchParameters: {
        type: "lens",
        num: 10,
        page: 1,
        url: imageUrl,
        engine: "google"
      },
      organic: [
        {
          title: "Sample Image Result 1",
          source: "Adobe",
          link: "https://example.com/result1",
          imageUrl: "https://picsum.photos/400/300?random=1",
          thumbnailUrl: "https://picsum.photos/200/150?random=1"
        },
        {
          title: "Sample Image Result 2",
          source: "Freepik",
          link: "https://example.com/result2",
          imageUrl: "https://picsum.photos/400/300?random=2",
          thumbnailUrl: "https://picsum.photos/200/150?random=2"
        },
        {
          title: "Sample Image Result 3",
          source: "Unsplash",
          link: "https://example.com/result3",
          imageUrl: "https://picsum.photos/400/300?random=3",
          thumbnailUrl: "https://picsum.photos/200/150?random=3"
        },
        {
          title: "Sample Image Result 4",
          source: "Pexels",
          link: "https://example.com/result4",
          imageUrl: "https://picsum.photos/400/300?random=4",
          thumbnailUrl: "https://picsum.photos/200/150?random=4"
        },
        {
          title: "Sample Image Result 5",
          source: "Pixabay",
          link: "https://example.com/result5",
          imageUrl: "https://picsum.photos/400/300?random=5",
          thumbnailUrl: "https://picsum.photos/200/150?random=5"
        }
      ],
      credits: 3
    };
  }
};