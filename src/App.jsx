import React, { useState, useRef, useEffect } from 'react'
import Canvas from './components/Canvas'
import SourcePanel from './components/SourcePanel'
import PlaybackControls from './components/PlaybackControls'
import LanguageSwitcher from './components/LanguageSwitcher'
import { AudioEngine } from './utils/AudioEngine'
import { useLanguage } from './contexts/LanguageContext'
import { getBuiltinSoundPath } from './config/builtinSounds'
import './App.css'

// Fixed ID for ambient sound
const AMBIENT_SOUND_ID = 'ambient-sound'

function App() {
  const { t } = useLanguage()
  const [sources, setSources] = useState([])
  const [selectedSource, setSelectedSource] = useState(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [loadingSource, setLoadingSource] = useState(null)
  const audioEngineRef = useRef(null)
  const canvasRef = useRef(null)

  // Initialize ambient sound source (only once)
  useEffect(() => {
    const canvasWidth = 800
    const canvasHeight = 600
    const ambientSound = {
      id: AMBIENT_SOUND_ID,
      name: t('source.ambientSound'),
      x: canvasWidth / 2,
      y: canvasHeight / 2,
      audioFile: null,
      audioBuffer: null,
      builtinSoundId: null,
      loop: true,
      volume: 1.0,
      isAmbient: true // Mark as ambient sound
    }
    // Only initialize when sources is empty
    if (sources.length === 0) {
      setSources([ambientSound])
    } else {
      // If ambient sound already exists, only update name (when language changes)
      setSources(prevSources => {
        const hasAmbient = prevSources.some(s => s.id === AMBIENT_SOUND_ID)
        if (hasAmbient) {
          return prevSources.map(s => 
            s.id === AMBIENT_SOUND_ID ? { ...s, name: t('source.ambientSound') } : s
          )
        }
        return [ambientSound, ...prevSources.filter(s => s.id !== AMBIENT_SOUND_ID)]
      })
    }
  }, [t])

  useEffect(() => {
    // Initialize audio engine
    audioEngineRef.current = new AudioEngine()
    
    return () => {
      // Cleanup
      if (audioEngineRef.current) {
        audioEngineRef.current.cleanup()
      }
    }
  }, [])

  const handleCanvasClick = (x, y) => {
    // Calculate number of regular sources (excluding ambient sound)
    const regularSources = sources.filter(s => s.id !== AMBIENT_SOUND_ID)
    const newSource = {
      id: Date.now(),
      name: `${t('source.defaultName')} ${regularSources.length + 1}`,
      x,
      y,
      audioFile: null,
      audioBuffer: null,
      builtinSoundId: null,
      loop: true,
      volume: 1.0,
      isAmbient: false
    }
    setSources([...sources, newSource])
    setSelectedSource(newSource.id)
  }

  const handleSourceUpdate = (id, updates) => {
    // Ambient sound position cannot be updated
    if (id === AMBIENT_SOUND_ID && (updates.x !== undefined || updates.y !== undefined)) {
      return
    }
    
    const updatedSources = sources.map(source => 
      source.id === id ? { ...source, ...updates } : source
    )
    setSources(updatedSources)
    
    // If playing, update source position in real-time
    if (isPlaying && audioEngineRef.current) {
      const updatedSource = updatedSources.find(s => s.id === id)
      if (updatedSource && (updates.x !== undefined || updates.y !== undefined)) {
        audioEngineRef.current.updateSourcePosition(
          id,
          updatedSource.x,
          updatedSource.y,
          canvasRef.current?.canvas
        )
      }
      // Update volume
      if (updatedSource && updates.volume !== undefined) {
        audioEngineRef.current.updateSourceVolume(id, updatedSource.volume)
      }
    }
  }

  const handleSourceDelete = (id) => {
    // Ambient sound cannot be deleted
    if (id === AMBIENT_SOUND_ID) {
      return
    }
    setSources(sources.filter(source => source.id !== id))
    if (selectedSource === id) {
      setSelectedSource(null)
    }
    if (audioEngineRef.current) {
      audioEngineRef.current.removeSource(id)
    }
  }

  const handleFileUpload = async (id, file) => {
    if (!audioEngineRef.current) {
      console.error(t('console.audioEngineNotInitialized'))
      alert(t('alerts.audioEngineNotInitialized'))
      return
    }
    
    setLoadingSource(id)
    
    try {
      console.log(t('console.startLoadingAudio'), file.name, t('console.size'), file.size, t('console.type'), file.type)
      
      // Ensure AudioContext is initialized
      if (!audioEngineRef.current.audioContext) {
        console.log(t('console.initAudioContext'))
        await audioEngineRef.current.init()
      }
      
      console.log(t('console.readArrayBuffer'))
      const arrayBuffer = await file.arrayBuffer()
      console.log(t('console.arrayBufferSize'), arrayBuffer.byteLength)
      
      console.log(t('console.decodeAudio'))
      const audioBuffer = await audioEngineRef.current.audioContext.decodeAudioData(arrayBuffer)
      console.log(t('console.audioDecoded'), {
        duration: audioBuffer.duration,
        sampleRate: audioBuffer.sampleRate,
        numberOfChannels: audioBuffer.numberOfChannels
      })
      
      handleSourceUpdate(id, {
        audioFile: file,
        audioBuffer: audioBuffer,
        builtinSoundId: null // Clear built-in sound selection when uploading file
      })
      
      console.log(t('console.audioLoadComplete'), id)
    } catch (error) {
      console.error(t('console.audioLoadFailed'), error)
      console.error(t('console.errorDetails'), {
        name: error.name,
        message: error.message,
        stack: error.stack
      })
      alert(t('alerts.audioLoadFailed', { message: error.message }))
    } finally {
      setLoadingSource(null)
    }
  }

  const handleBuiltinSoundSelect = async (sourceId, builtinSoundId) => {
    if (!audioEngineRef.current) {
      console.error(t('console.audioEngineNotInitialized'))
      alert(t('alerts.audioEngineNotInitialized'))
      return
    }

    const source = sources.find(s => s.id === sourceId)
    if (!source) return

    setLoadingSource(sourceId)

    try {
      // If "none" is selected, clear audio
      if (builtinSoundId === 'none') {
        handleSourceUpdate(sourceId, {
          builtinSoundId: null,
          audioFile: null,
          audioBuffer: null
        })
        setLoadingSource(null)
        return
      }

      // Get file path
      const isAmbient = source.id === AMBIENT_SOUND_ID
      const filePath = getBuiltinSoundPath(builtinSoundId, isAmbient)
      
      if (!filePath) {
        console.error('Built-in sound file path not found')
        setLoadingSource(null)
        return
      }

      // Ensure AudioContext is initialized
      if (!audioEngineRef.current.audioContext) {
        await audioEngineRef.current.init()
      }

      // Load built-in sound file
      console.log('Loading built-in sound:', filePath)
      const response = await fetch(filePath)
      if (!response.ok) {
        throw new Error(`Failed to load built-in sound: ${response.statusText}`)
      }

      const arrayBuffer = await response.arrayBuffer()
      const audioBuffer = await audioEngineRef.current.audioContext.decodeAudioData(arrayBuffer)

      // Update source
      handleSourceUpdate(sourceId, {
        builtinSoundId: builtinSoundId,
        audioFile: null, // Built-in sounds don't use audioFile, clear uploaded file
        audioBuffer: audioBuffer
      })

      console.log('Built-in sound loaded successfully:', builtinSoundId)
    } catch (error) {
      console.error('Failed to load built-in sound:', error)
      alert(t('alerts.audioLoadFailed', { message: error.message }))
      // Reset to none
      handleSourceUpdate(sourceId, { builtinSoundId: null })
    } finally {
      setLoadingSource(null)
    }
  }

  const handlePlay = async () => {
    if (!audioEngineRef.current) return

    if (isPlaying) {
      audioEngineRef.current.stopAll()
      setIsPlaying(false)
    } else {
      // Start all sources
      const sourcesWithAudio = sources.filter(s => s.audioBuffer)
      if (sourcesWithAudio.length === 0) {
        alert(t('alerts.noAudioSources'))
        return
      }

      try {
        // Ensure AudioContext is initialized and running
        if (!audioEngineRef.current.audioContext) {
          await audioEngineRef.current.init()
        } else if (audioEngineRef.current.audioContext.state === 'suspended') {
          await audioEngineRef.current.audioContext.resume()
        }

        await audioEngineRef.current.playSources(sources, canvasRef.current?.canvas)
        setIsPlaying(true)
      } catch (error) {
        console.error(t('console.playbackFailed'), error)
        alert(t('alerts.playbackFailed', { message: error.message }))
      }
    }
  }

  return (
    <div className="app">
      <div className="app-header">
        <div className="header-content">
          <div>
            <h1>{t('app.title')}</h1>
            <p>{t('app.subtitle')}</p>
          </div>
          <LanguageSwitcher />
        </div>
      </div>
      
      <div className="app-content">
        <SourcePanel
          sources={sources}
          selectedSource={selectedSource}
          loadingSource={loadingSource}
          ambientSoundId={AMBIENT_SOUND_ID}
          onSelectSource={setSelectedSource}
          onUpdateSource={handleSourceUpdate}
          onDeleteSource={handleSourceDelete}
          onFileUpload={handleFileUpload}
          onBuiltinSoundSelect={handleBuiltinSoundSelect}
        />
        
        <div className="canvas-container">
          <Canvas
            ref={canvasRef}
            sources={sources.filter(s => s.id !== AMBIENT_SOUND_ID)}
            selectedSource={selectedSource}
            onCanvasClick={handleCanvasClick}
            onSourceDrag={(id, x, y) => handleSourceUpdate(id, { x, y })}
            onSelectSource={setSelectedSource}
          />
        </div>
      </div>

      <PlaybackControls
        isPlaying={isPlaying}
        onPlay={handlePlay}
      />
    </div>
  )
}

export default App

