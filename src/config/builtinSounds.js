// Built-in sound effects configuration
// These files should be placed in the public/audio/ directory

// Get base URL from Vite (handles GitHub Pages subdirectory paths)
const getBaseUrl = () => {
  // import.meta.env.BASE_URL includes the trailing slash
  return import.meta.env.BASE_URL || '/'
}

export const builtinAmbientSounds = [
  { id: 'none', name: 'None', file: null },
  { id: 'airport-terminal', name: 'Airport Terminal', file: 'audio/ambient/airport-terminal.wav' },
  { id: 'harbour', name: 'Harbour', file: 'audio/ambient/harbour.wav' },
  { id: 'rain', name: 'Rain', file: 'audio/ambient/rain.wav' },
]

export const builtinEffectSounds = [
  { id: 'none', name: 'None', file: null },
  { id: 'dog', name: 'Dog Bark', file: 'audio/effect/dog.wav' },
  { id: 'footsteps', name: 'Footsteps', file: 'audio/effect/footsteps.wav' },
  { id: 'morning-birds', name: 'Morning Birds', file: 'audio/effect/morning-birds.wav' },
]

// Get built-in sound list
export const getBuiltinSounds = (isAmbient) => {
  return isAmbient ? builtinAmbientSounds : builtinEffectSounds
}

// Get sound file path by ID (with base URL prepended)
export const getBuiltinSoundPath = (id, isAmbient) => {
  const sounds = isAmbient ? builtinAmbientSounds : builtinEffectSounds
  const sound = sounds.find(s => s.id === id)
  if (!sound || !sound.file) return null
  
  const baseUrl = getBaseUrl()
  // Ensure baseUrl ends with / and file doesn't start with /
  const base = baseUrl.endsWith('/') ? baseUrl : baseUrl + '/'
  const file = sound.file.startsWith('/') ? sound.file.slice(1) : sound.file
  return base + file
}

