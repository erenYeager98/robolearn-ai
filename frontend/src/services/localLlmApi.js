const LOCAL_LLM_API_URL = 'https://192.168.29.36:8000/api/local_llm';

export const searchLocalLLM = async (query) => {
  try {
    const response = await fetch(LOCAL_LLM_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: query,
        mode: 'learning'
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching local LLM data:', error);
    // Return mock learning data for demonstration
    return {
      query: query,
      response: `# Understanding ${query}

${query} is a fascinating topic that encompasses multiple aspects of learning and understanding. Let me break this down for you in a comprehensive way.

## Introduction
When we explore ${query}, we need to understand its fundamental concepts and how they interconnect with broader knowledge domains. This topic requires both theoretical understanding and practical application.

## Key Concepts
The main principles behind ${query} involve several important elements:

1. **Foundation**: The basic building blocks that form the core understanding
2. **Application**: How these concepts are used in real-world scenarios  
3. **Connections**: How this topic relates to other areas of knowledge
4. **Evolution**: How understanding of this topic has developed over time

## Detailed Explanation
${query} operates through a series of interconnected processes. Each component plays a crucial role in the overall system, and understanding these relationships is key to mastering the subject.

The practical implications of ${query} extend far beyond theoretical knowledge. In real-world applications, we see how these principles guide decision-making and problem-solving approaches.

## Important Considerations
When studying ${query}, it's essential to consider multiple perspectives and approaches. Different contexts may require different applications of the same fundamental principles.

## Conclusion
Mastering ${query} requires both theoretical understanding and practical experience. The concepts we've explored provide a solid foundation for further learning and application.`,
      imageKeywords: {
        'understanding': 'https://picsum.photos/800/600?random=understanding',
        'concepts': 'https://picsum.photos/800/600?random=concepts',
        'learning': 'https://picsum.photos/800/600?random=learning',
        'knowledge': 'https://picsum.photos/800/600?random=knowledge',
        'foundation': 'https://picsum.photos/800/600?random=foundation',
        'application': 'https://picsum.photos/800/600?random=application',
        'principles': 'https://picsum.photos/800/600?random=principles',
        'system': 'https://picsum.photos/800/600?random=system',
        'theory': 'https://picsum.photos/800/600?random=theory',
        'practical': 'https://picsum.photos/800/600?random=practical'
      },
      sections: [
        {
          title: "Key Takeaways",
          content: "The most important points to remember about " + query + " are the foundational concepts and their practical applications."
        },
        {
          title: "Further Reading",
          content: "To deepen your understanding of " + query + ", consider exploring related topics and case studies."
        }
      ],
      defaultImageUrl: `https://picsum.photos/800/600?random=${encodeURIComponent(query)}`
    };
  }
};