// Mock image upload service - replace with your actual upload endpoint
const IMAGE_UPLOAD_API_URL = 'https://api.erenyeager-dk.live/api/upload-image';

export const uploadImage = async (imageBlob) => {
  try {
    const formData = new FormData();
    formData.append('file', imageBlob, 'captured-image.jpg'); // backend expects 'file'

    const response = await fetch(IMAGE_UPLOAD_API_URL, {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log("✅ Uploaded image URL:", data.url); // ✅ this will be an actual HTTP URL
    return data.url;
  } catch (error) {
    console.error('Error uploading image:', error);
    throw error;
  }
};