import imageCompression from 'browser-image-compression';

export const resizeImage = async (file: File, options?: {
  maxSizeMB?: number;
  maxWidthOrHeight?: number;
  useWebWorker?: boolean;
}): Promise<File> => {
  const defaultOptions = {
    maxSizeMB: 1, // Max 1MB
    maxWidthOrHeight: 800, // Max 800px
    useWebWorker: true,
  };

  const compressionOptions = { ...defaultOptions, ...options };

  try {
    return await imageCompression(file, compressionOptions);
  } catch (error) {
    console.error('Image compression failed:', error);
    return file; // Return original if compression fails
  }
};