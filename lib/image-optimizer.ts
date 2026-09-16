/**
 * In-browser WebP Image Optimizer.
 * Converts uploaded images (PNG, JPG, etc.) into highly optimized WebP format
 * before sending to Vercel Blob / server storage.
 * This drastically reduces upload time, Vercel bandwidth, and user page load time.
 */

export interface OptimizeImageOptions {
  maxWidth?: number
  maxHeight?: number
  quality?: number
}

export async function convertToWebP(
  file: File,
  options: OptimizeImageOptions = {}
): Promise<File> {
  const { maxWidth = 1920, maxHeight = 1080, quality = 0.85 } = options

  // If already small WebP, return as is
  if (file.type === 'image/webp' && file.size <= 300 * 1024) {
    return file
  }

  // Non-image files or SVGs don't need raster compression
  if (!file.type.startsWith('image/') || file.type === 'image/svg+xml') {
    return file
  }

  return new Promise((resolve) => {
    const img = new Image()
    const objectUrl = URL.createObjectURL(file)

    img.onload = () => {
      URL.revokeObjectURL(objectUrl)

      let width = img.naturalWidth || img.width
      let height = img.naturalHeight || img.height

      // Resize if exceeds max dimensions while preserving aspect ratio
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height)
        width = Math.round(width * ratio)
        height = Math.round(height * ratio)
      }

      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height

      const ctx = canvas.getContext('2d')
      if (!ctx) {
        resolve(file)
        return
      }

      // Smooth resizing
      ctx.imageSmoothingEnabled = true
      ctx.imageSmoothingQuality = 'high'
      ctx.drawImage(img, 0, 0, width, height)

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            resolve(file)
            return
          }
          const baseName = file.name.replace(/\.[^/.]+$/, '')
          const webpFile = new File([blob], `${baseName}.webp`, {
            type: 'image/webp',
            lastModified: Date.now(),
          })
          resolve(webpFile)
        },
        'image/webp',
        quality
      )
    }

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      resolve(file) // Fallback to original file
    }

    img.src = objectUrl
  })
}
