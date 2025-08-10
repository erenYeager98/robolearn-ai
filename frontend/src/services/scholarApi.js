const SCHOLAR_API_URL = 'https://google.serper.dev/scholar';
const VITE_SERPER_API_KEY = "c8fa1043c013a0719fb8cdbc8b254c6f18d0c864";
export const searchScholar = async (query) => {
  try {
    const response = await fetch(SCHOLAR_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-KEY': VITE_SERPER_API_KEY || 'demo-key'
      },
      body: JSON.stringify({
        q: query
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching scholar data:', error);
    // Return mock data for demonstration
    return {
      searchParameters: {
        q: query,
        type: "scholar",
        engine: "google-scholar"
      },
      organic: [
        {
          title: "Sample Research Paper on " + query,
          link: "https://example.com/paper1",
          publicationInfo: "J. Doe, A. Smith - 2023 - example.com",
          snippet: "This is a sample research paper about " + query + ". It demonstrates the structure and content that would be returned from the actual API...",
          year: 2023,
          citedBy: 45,
          pdfUrl: "https://example.com/paper1.pdf",
          id: "sample1"
        },
        {
          title: "Advanced Studies in " + query,
          link: "https://example.com/paper2",
          publicationInfo: "M. Johnson, K. Lee - 2022 - academic.edu",
          snippet: "An in-depth analysis of " + query + " with comprehensive research methodology and findings...",
          year: 2022,
          citedBy: 78,
          pdfUrl: "https://example.com/paper2.pdf",
          id: "sample2"
        },
        {
          title: "Comprehensive Review of " + query,
          link: "https://example.com/paper3",
          publicationInfo: "R. Wilson, S. Brown - 2024 - journal.org",
          snippet: "A systematic review covering all aspects of " + query + " with meta-analysis and future directions...",
          year: 2024,
          citedBy: 23,
          id: "sample3"
        }
      ],
      credits: 1
    };
  }
};