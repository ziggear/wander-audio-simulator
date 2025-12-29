// Built-in sound effects configuration
// These files should be placed in the public/audio/ directory

export const builtinAmbientSounds = [
  { id: 'none', name: 'None', file: null },
  { id: 'airport-terminal', name: 'Airport Terminal', file: '/audio/ambient/airport-terminal.wav' },
  { id: 'harbour', name: 'Harbour', file: '/audio/ambient/harbour.wav' },
  { id: 'rain', name: 'Rain', file: '/audio/ambient/rain.wav' },
]

export const builtinEffectSounds = [
  { id: 'none', name: 'None', file: null },
  { id: 'dog', name: 'Dog Bark', file: '/audio/effect/dog.wav' },
  { id: 'footsteps', name: 'Footsteps', file: '/audio/effect/footsteps.wav' },
  { id: 'morning-birds', name: 'Morning Birds', file: '/audio/effect/morning-birds.wav' },
]

// Get built-in sound list
export const getBuiltinSounds = (isAmbient) => {
  return isAmbient ? builtinAmbientSounds : builtinEffectSounds
}

// Get sound file path by ID
export const getBuiltinSoundPath = (id, isAmbient) => {
  const sounds = isAmbient ? builtinAmbientSounds : builtinEffectSounds
  const sound = sounds.find(s => s.id === id)
  return sound ? sound.file : null
}

