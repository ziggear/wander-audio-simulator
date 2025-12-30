export default {
  app: {
    title: "3D Audio Simulator - HRTF",
    subtitle: "Click on canvas to create sources, upload audio files, experience stereo effects",
    mapView: "Map View",
    canvasView: "Canvas View"
  },
  audioMap: {
    title: "Audio Map - Spatial Audio",
    subtitle: "Upload audio files with location data, experience 3D audio on map",
    mapStyle: "Map Style",
    stylePositron: "Light (Positron)",
    styleDark: "Dark",
    styleSatellite: "Satellite",
    listenerPosition: "Listener Position",
    useBrowserLocation: "Use Browser Location",
    dragToSet: "Drag to Set Position",
    audioList: "Audio List",
    uploadAudio: "Upload Audio",
    noAudio: "No audio files uploaded"
  },
  sourcePanel: {
    title: "Source List",
    emptyState: "Click on canvas to create a source",
    editSource: "Edit Source",
    name: "Name",
    audioFile: "Audio File",
    selectAudioFile: "Select Audio File",
    replaceAudioFile: "Replace Audio File",
    builtinSound: "Built-in Sound",
    selectBuiltinSound: "Select Built-in Sound",
    loading: "Loading...",
    loadingAudio: "Loading audio file...",
    loop: "Loop Playback",
    volume: "Volume",
    position: "Position",
    ambientPosition: "Center (Fixed)",
    loaded: "Loaded",
    notLoaded: "Not Loaded"
  },
  canvas: {
    listener: "Listener (You)",
    loadedAudio: "Loaded Audio",
    notLoadedAudio: "Not Loaded Audio"
  },
  playback: {
    play: "Play",
    pause: "Pause",
    info1: "Using HRTF technology to achieve 3D stereo effects",
    info2: "The farther the distance, the smaller the volume; position changes will produce stereo effects"
  },
  source: {
    defaultName: "Source",
    ambientSound: "Ambient Sound"
  },
  alerts: {
    audioEngineNotInitialized: "Audio engine not initialized, please refresh the page and try again",
    audioLoadFailed: "Audio file loading failed: {message}\nPlease ensure it's a valid audio file (WAV, MP3, OGG, etc.)",
    noAudioSources: "Please upload audio files for at least one source",
    playbackFailed: "Playback failed: {message}"
  },
  console: {
    fileSelected: "File selected:",
    noFileSelected: "No file selected",
    audioEngineNotInitialized: "AudioEngine not initialized",
    startLoadingAudio: "Start loading audio file:",
    size: "Size:",
    type: "Type:",
    initAudioContext: "Initializing AudioContext...",
    readArrayBuffer: "Reading file as ArrayBuffer...",
    arrayBufferSize: "ArrayBuffer size:",
    decodeAudio: "Decoding audio data...",
    audioDecoded: "Audio decoded successfully:",
    audioLoadComplete: "Audio file loading complete, source ID:",
    audioLoadFailed: "Audio file loading failed:",
    errorDetails: "Error details:",
    playbackFailed: "Playback failed:"
  }
}

