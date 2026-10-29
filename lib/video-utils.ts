/**
 * Video embedding & parsing utility
 * Supports YouTube (standard, shorts, embed, shortlink), Vimeo, Loom, Google Drive, and direct video files.
 */

export interface VideoInfo {
  type: 'youtube' | 'vimeo' | 'loom' | 'drive' | 'direct'
  embedUrl: string
  thumbnail?: string
  videoId?: string
  originalUrl: string
}

export function getVideoInfo(rawUrl?: string | null): VideoInfo | null {
  if (!rawUrl || typeof rawUrl !== 'string') return null
  const url = rawUrl.trim()
  if (!url) return null

  // 1. YouTube
  // Handles:
  // - https://www.youtube.com/watch?v=VIDEO_ID
  // - https://youtu.be/VIDEO_ID
  // - https://www.youtube.com/shorts/VIDEO_ID
  // - https://www.youtube.com/embed/VIDEO_ID
  // - https://m.youtube.com/watch?v=VIDEO_ID
  const ytMatch = url.match(
    /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/|youtube\.com\/shorts\/)([^"&?\/\s]{11})/i
  )
  if (ytMatch && ytMatch[1]) {
    const id = ytMatch[1]
    return {
      type: 'youtube',
      videoId: id,
      embedUrl: `https://www.youtube-nocookie.com/embed/${id}?rel=0&modestbranding=1&playsinline=1&enablejsapi=1`,
      thumbnail: `https://img.youtube.com/vi/${id}/hqdefault.jpg`,
      originalUrl: url,
    }
  }

  // 2. Vimeo
  // Handles:
  // - https://vimeo.com/VIDEO_ID
  // - https://player.vimeo.com/video/VIDEO_ID
  const vimeoMatch = url.match(
    /(?:vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/[^\/]*\/videos\/|album\/\d+\/video\/|video\/|)|player\.vimeo\.com\/video\/)(\d+)/i
  )
  if (vimeoMatch && vimeoMatch[1]) {
    const id = vimeoMatch[1]
    return {
      type: 'vimeo',
      videoId: id,
      embedUrl: `https://player.vimeo.com/video/${id}?title=0&byline=0&portrait=0`,
      originalUrl: url,
    }
  }

  // 3. Loom
  // Handles:
  // - https://www.loom.com/share/VIDEO_ID
  // - https://www.loom.com/embed/VIDEO_ID
  const loomMatch = url.match(/loom\.com\/(?:share|embed)\/([a-zA-Z0-9]+)/i)
  if (loomMatch && loomMatch[1]) {
    const id = loomMatch[1]
    return {
      type: 'loom',
      videoId: id,
      embedUrl: `https://www.loom.com/embed/${id}`,
      originalUrl: url,
    }
  }

  // 4. Google Drive
  // Handles:
  // - https://drive.google.com/file/d/FILE_ID/view
  const driveMatch = url.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/i)
  if (driveMatch && driveMatch[1]) {
    const id = driveMatch[1]
    return {
      type: 'drive',
      videoId: id,
      embedUrl: `https://drive.google.com/file/d/${id}/preview`,
      originalUrl: url,
    }
  }

  // 5. Direct video files or general video URLs (mp4, webm, ogg, etc.)
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return {
      type: 'direct',
      embedUrl: url,
      originalUrl: url,
    }
  }

  return null
}

export function isValidVideoUrl(url?: string | null): boolean {
  return getVideoInfo(url) !== null
}
