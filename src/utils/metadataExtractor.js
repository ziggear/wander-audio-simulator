// Audio metadata extraction utility
// Supports extracting GPS location and other metadata from audio files

export async function extractAudioMetadata(file) {
  try {
    // Try to use music-metadata library if available
    if (typeof window !== 'undefined' && window.musicMetadata) {
      const metadata = await window.musicMetadata.parseBlob(file)
      return parseMetadata(metadata)
    }
    
    // Fallback: try to extract from file properties
    return await extractBasicMetadata(file)
  } catch (error) {
    console.warn('Metadata extraction failed, using basic info:', error)
    return await extractBasicMetadata(file)
  }
}

async function extractBasicMetadata(file) {
  return {
    name: file.name,
    size: file.size,
    type: file.type,
    lastModified: file.lastModified,
    location: null,
    gps: null
  }
}

function parseMetadata(metadata) {
  const result = {
    name: metadata.common?.title || null,
    artist: metadata.common?.artist || null,
    album: metadata.common?.album || null,
    duration: metadata.format?.duration || null,
    bitrate: metadata.format?.bitrate || null,
    sampleRate: metadata.format?.sampleRate || null,
    location: null,
    gps: null
  }

  // Try to extract GPS information
  if (metadata.native) {
    // Look for GPS tags in native metadata
    for (const tag of metadata.native) {
      if (tag.id && typeof tag.id === 'string') {
        // Check for GPS-related tags
        if (tag.id.toLowerCase().includes('gps') || 
            tag.id.toLowerCase().includes('location') ||
            tag.id.toLowerCase().includes('xyz')) {
          result.location = tag.value
        }
        
        // Extract GPS coordinates
        if (tag.id.includes('GPSLatitude')) {
          result.gps = result.gps || {}
          result.gps.latitude = parseCoordinate(tag.value)
        }
        if (tag.id.includes('GPSLongitude')) {
          result.gps = result.gps || {}
          result.gps.longitude = parseCoordinate(tag.value)
        }
        if (tag.id.includes('GPSAltitude')) {
          result.gps = result.gps || {}
          result.gps.altitude = parseFloat(tag.value) || 0
        }
      }
    }
  }

  // Also check common tags
  if (metadata.common?.location) {
    result.location = metadata.common.location
  }

  return result
}

function parseCoordinate(value) {
  if (typeof value === 'number') {
    return value
  }
  if (typeof value === 'string') {
    // Try to parse DMS (Degrees Minutes Seconds) format
    // Format: "DD°MM'SS.SS\"N" or decimal
    const decimal = parseFloat(value)
    if (!isNaN(decimal)) {
      return decimal
    }
  }
  if (Array.isArray(value)) {
    // Sometimes GPS is stored as [degrees, minutes, seconds]
    if (value.length >= 3) {
      return value[0] + value[1] / 60 + value[2] / 3600
    }
  }
  return null
}

// Extract GPS from EXIF data (for images/videos with audio)
export async function extractGPSFromFile(file) {
  try {
    const arrayBuffer = await file.arrayBuffer()
    const dataView = new DataView(arrayBuffer)
    
    // Look for GPS metadata in file
    // This is a simplified approach - full EXIF parsing would be more complex
    const text = new TextDecoder('utf-8', { fatal: false }).decode(arrayBuffer)
    
    // Try to find GPS coordinates in various formats
    const patterns = [
      /GPSLatitude["\s:=]+([+-]?\d+\.?\d*)/i,
      /latitude["\s:=]+([+-]?\d+\.?\d*)/i,
      /lat["\s:=]+([+-]?\d+\.?\d*)/i,
    ]
    
    let latitude = null
    let longitude = null
    
    for (const pattern of patterns) {
      const match = text.match(pattern)
      if (match) {
        latitude = parseFloat(match[1])
        break
      }
    }
    
    const lonPatterns = [
      /GPSLongitude["\s:=]+([+-]?\d+\.?\d*)/i,
      /longitude["\s:=]+([+-]?\d+\.?\d*)/i,
      /lon["\s:=]+([+-]?\d+\.?\d*)/i,
    ]
    
    for (const pattern of lonPatterns) {
      const match = text.match(pattern)
      if (match) {
        longitude = parseFloat(match[1])
        break
      }
    }
    
    if (latitude !== null && longitude !== null) {
      return { latitude, longitude }
    }
    
    return null
  } catch (error) {
    console.warn('GPS extraction failed:', error)
    return null
  }
}

