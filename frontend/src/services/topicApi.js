// Mock file system data representing topics and files
const fileSystem = {
  '/': {
    folders: [{ name: 'Physics' }, { name: 'Mathematics' }],
    files: [
      { name: 'Introduction to AI.pptx', type: 'ppt', slides: 5 },
      { name: 'Biology Basics.pdf', type: 'pdf' },
    ],
  },
  '/Physics': {
    folders: [{ name: 'Quantum Mechanics' }],
    files: [
      { name: 'Classical Mechanics.pptx', type: 'ppt', slides: 8 },
      { name: 'Thermodynamics Notes.pdf', type: 'pdf' },
    ],
  },
  '/Physics/Quantum Mechanics': {
    folders: [],
    files: [
      { name: 'Schrodinger Equation.pptx', type: 'ppt', slides: 12 },
    ],
  },
  '/Mathematics': {
    folders: [],
    files: [
      { name: 'Calculus Cheatsheet.pdf', type: 'pdf' },
      { name: 'Linear Algebra Intro.pptx', type: 'ppt', slides: 10 },
    ],
  },
};

/**
 * Mocks fetching directory contents from an API.
 * @param {string} path - The directory path to fetch.
 * @returns {Promise<object>} A promise that resolves with the directory contents.
 */
export const fetchDirectoryContents = async (path) => {
  console.log(`Fetching contents for path: ${path}`);
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(fileSystem[path] || { folders: [], files: [] });
    }, 500); // Simulate network delay
  });
};

/**
 * Mocks fetching individual slide images for a presentation.
 * @param {string} fileName - The name of the presentation file.
 * @param {number} slideCount - The number of slides in the presentation.
 * @returns {string[]} An array of image URLs for the slides.
 */
export const fetchPresentationSlides = (fileName, slideCount) => {
  const slides = [];
  for (let i = 1; i <= slideCount; i++) {
    // Using a placeholder service to generate unique images for each slide
    slides.push(`https://picsum.photos/seed/${fileName}${i}/1280/720`);
  }
  return slides;
};