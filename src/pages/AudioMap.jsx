import React, { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useLanguage } from '../contexts/LanguageContext'
import { AudioEngine } from '../utils/AudioEngine'
import { extractAudioMetadata, extractGPSFromFile } from '../utils/metadataExtractor'
import LanguageSwitcher from '../components/LanguageSwitcher'
import PlaybackControls from '../components/PlaybackControls'
import './AudioMap.css'

// Import Leaflet CSS
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'

// Fix Leaflet default icon issue
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
})

function AudioMap() {
  const { t } = useLanguage()
  const mapRef = useRef(null)
  const mapInstanceRef = useRef(null)
  const tileLayerRef = useRef(null)
  const markersRef = useRef(new Map()) // audioId -> marker
  const listenerMarkerRef = useRef(null)
  const audioEngineRef = useRef(null)
  
  const [audioSources, setAudioSources] = useState([])
  const [selectedSource, setSelectedSource] = useState(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [loadingSource, setLoadingSource] = useState(null)
  const [listenerMode, setListenerMode] = useState('browser') // 'browser' or 'manual'
  const [listenerPosition, setListenerPosition] = useState(null) // { lat, lng }
  const [mapStyle, setMapStyle] = useState('positron') // 'positron', 'dark', 'satellite'

  // Initialize map
  useEffect(() => {
    if (!mapRef.current) return

    // Initialize map centered on a default location (e.g., Beijing)
    const map = L.map(mapRef.current).setView([39.9042, 116.4074], 13)

    // Add initial tile layer - CartoDB Positron (clean, minimal style)
    const getTileLayer = (style) => {
      let tileUrl, attribution, subdomains = 'abcd'
      switch (style) {
        case 'dark':
          tileUrl = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
          attribution = '© OpenStreetMap contributors © CARTO'
          break
        case 'satellite':
          tileUrl = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
          attribution = '© Esri'
          subdomains = '0123'
          break
        case 'positron':
        default:
          tileUrl = 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png'
          attribution = '© OpenStreetMap contributors © CARTO'
          break
      }
      
      return L.tileLayer(tileUrl, {
        attribution: attribution,
        subdomains: subdomains,
        maxZoom: 19
      })
    }
    
    tileLayerRef.current = getTileLayer(mapStyle).addTo(map)

    mapInstanceRef.current = map

    // Try to get browser location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords
          setListenerPosition({ lat: latitude, lng: longitude })
          map.setView([latitude, longitude], 15)
          
          // Add listener marker
          const listenerIcon = L.divIcon({
            className: 'listener-marker',
            html: '<div class="listener-icon">🎧</div>',
            iconSize: [30, 30],
            iconAnchor: [15, 15]
          })
          
          listenerMarkerRef.current = L.marker([latitude, longitude], {
            icon: listenerIcon,
            draggable: listenerMode === 'manual',
            zIndexOffset: 1000
          }).addTo(map)

          if (listenerMode === 'manual') {
            listenerMarkerRef.current.on('dragend', (e) => {
              const pos = e.target.getLatLng()
              const newPos = { lat: pos.lat, lng: pos.lng }
              setListenerPosition(newPos)
              // Update all audio sources if playing
              if (isPlaying && audioEngineRef.current) {
                audioSources.forEach(source => {
                  if (source.position) {
                    audioEngineRef.current.updateMapSourcePosition(
                      source.id,
                      source.position.lat,
                      source.position.lng,
                      newPos.lat,
                      newPos.lng
                    )
                  }
                })
              }
            })
          }
        },
        (error) => {
          console.warn('Geolocation error:', error)
          // Use default location
          setListenerPosition({ lat: 39.9042, lng: 116.4074 })
        }
      )
    } else {
      setListenerPosition({ lat: 39.9042, lng: 116.4074 })
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
      }
    }
  }, [])

  // Update map style when it changes
  useEffect(() => {
    if (!mapInstanceRef.current) return
    
    if (tileLayerRef.current) {
      mapInstanceRef.current.removeLayer(tileLayerRef.current)
    }
    
    const getTileLayer = (style) => {
      let tileUrl, attribution, subdomains = 'abcd'
      switch (style) {
        case 'dark':
          tileUrl = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
          attribution = '© OpenStreetMap contributors © CARTO'
          break
        case 'satellite':
          tileUrl = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
          attribution = '© Esri'
          subdomains = '0123'
          break
        case 'positron':
        default:
          tileUrl = 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png'
          attribution = '© OpenStreetMap contributors © CARTO'
          break
      }
      
      return L.tileLayer(tileUrl, {
        attribution: attribution,
        subdomains: subdomains,
        maxZoom: 19
      })
    }
    
    tileLayerRef.current = getTileLayer(mapStyle).addTo(mapInstanceRef.current)
  }, [mapStyle])

  // Update listener marker when mode changes
  useEffect(() => {
    if (!mapInstanceRef.current || !listenerPosition) return

    if (listenerMarkerRef.current) {
      mapInstanceRef.current.removeLayer(listenerMarkerRef.current)
    }

    const listenerIcon = L.divIcon({
      className: 'listener-marker',
      html: '<div class="listener-icon">🎧</div>',
      iconSize: [30, 30],
      iconAnchor: [15, 15]
    })

    listenerMarkerRef.current = L.marker([listenerPosition.lat, listenerPosition.lng], {
      icon: listenerIcon,
      draggable: listenerMode === 'manual',
      zIndexOffset: 1000
    }).addTo(mapInstanceRef.current)

    if (listenerMode === 'manual') {
      listenerMarkerRef.current.on('dragend', (e) => {
        const pos = e.target.getLatLng()
        setListenerPosition({ lat: pos.lat, lng: pos.lng })
      })
    }
  }, [listenerMode, listenerPosition])

  // Initialize audio engine
  useEffect(() => {
    audioEngineRef.current = new AudioEngine()
    return () => {
      if (audioEngineRef.current) {
        audioEngineRef.current.cleanup()
      }
    }
  }, [])

  const handleFileUpload = async (file) => {
    if (!audioEngineRef.current) {
      console.error('AudioEngine not initialized')
      return
    }

    const sourceId = Date.now()
    setLoadingSource(sourceId)

    try {
      // Extract metadata (including GPS)
      const metadata = await extractAudioMetadata(file)
      const gps = metadata.gps || await extractGPSFromFile(file)

      // Ensure AudioContext is initialized
      if (!audioEngineRef.current.audioContext) {
        await audioEngineRef.current.init()
      }

      // Decode audio
      const arrayBuffer = await file.arrayBuffer()
      const audioBuffer = await audioEngineRef.current.audioContext.decodeAudioData(arrayBuffer)

      // Determine position
      let position = null
      if (gps && gps.latitude && gps.longitude) {
        // Use GPS from metadata
        position = { lat: gps.latitude, lng: gps.longitude }
      } else {
        // Use map center or click position
        if (mapInstanceRef.current) {
          const center = mapInstanceRef.current.getCenter()
          position = { lat: center.lat, lng: center.lng }
        }
      }

      const newSource = {
        id: sourceId,
        name: metadata.name || file.name,
        file: file,
        audioBuffer: audioBuffer,
        position: position,
        volume: 1.0,
        loop: false,
        metadata: metadata
      }

      setAudioSources([...audioSources, newSource])

      // Add marker to map
      if (position && mapInstanceRef.current) {
        const marker = L.marker([position.lat, position.lng], {
          draggable: true
        }).addTo(mapInstanceRef.current)

        marker.bindPopup(newSource.name)
        
        marker.on('dragend', (e) => {
          const pos = e.target.getLatLng()
          setAudioSources(sources => 
            sources.map(s => {
              if (s.id === sourceId) {
                const updated = { ...s, position: { lat: pos.lat, lng: pos.lng } }
                // Update audio position if playing
                if (isPlaying && audioEngineRef.current && listenerPosition) {
                  audioEngineRef.current.updateMapSourcePosition(
                    sourceId,
                    pos.lat,
                    pos.lng,
                    listenerPosition.lat,
                    listenerPosition.lng
                  )
                }
                return updated
              }
              return s
            })
          )
        })

        marker.on('click', () => {
          setSelectedSource(sourceId)
        })

        markersRef.current.set(sourceId, marker)
      }

      setSelectedSource(sourceId)
    } catch (error) {
      console.error('Failed to load audio:', error)
      alert(`Failed to load audio: ${error.message}`)
    } finally {
      setLoadingSource(null)
    }
  }

  const handleDeleteSource = (id) => {
    // Remove marker
    const marker = markersRef.current.get(id)
    if (marker && mapInstanceRef.current) {
      mapInstanceRef.current.removeLayer(marker)
      markersRef.current.delete(id)
    }

    // Remove from sources
    setAudioSources(audioSources.filter(s => s.id !== id))
    if (selectedSource === id) {
      setSelectedSource(null)
    }

    // Stop audio if playing
    if (audioEngineRef.current) {
      audioEngineRef.current.removeSource(id)
    }
  }

  const handlePlay = async () => {
    if (!audioEngineRef.current || !listenerPosition) return

    if (isPlaying) {
      audioEngineRef.current.stopAll()
      setIsPlaying(false)
    } else {
      const sourcesWithAudio = audioSources.filter(s => s.audioBuffer && s.position)
      if (sourcesWithAudio.length === 0) {
        alert('Please upload audio files with location information')
        return
      }

      try {
        if (!audioEngineRef.current.audioContext) {
          await audioEngineRef.current.init()
        } else if (audioEngineRef.current.audioContext.state === 'suspended') {
          await audioEngineRef.current.audioContext.resume()
        }

        // Convert map sources to audio engine format
        const sources = audioSources.map(source => ({
          id: source.id,
          name: source.name,
          audioBuffer: source.audioBuffer,
          volume: source.volume,
          loop: source.loop,
          position: source.position
        }))

        await audioEngineRef.current.playMapSources(sources, listenerPosition)
        setIsPlaying(true)
      } catch (error) {
        console.error('Playback failed:', error)
        alert(`Playback failed: ${error.message}`)
      }
    }
  }

  return (
    <div className="audio-map-page">
      <div className="map-header">
        <div className="header-content">
          <div>
            <h1>{t('audioMap.title')}</h1>
            <p>{t('audioMap.subtitle')}</p>
          </div>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <Link to="/" className="nav-link">{t('app.canvasView')}</Link>
            <LanguageSwitcher />
          </div>
        </div>
      </div>

      <div className="map-content">
        <div className="map-sidebar">
          <div className="map-style-selector">
            <h3>{t('audioMap.mapStyle')}</h3>
            <select 
              value={mapStyle} 
              onChange={(e) => setMapStyle(e.target.value)}
              className="style-select"
            >
              <option value="positron">{t('audioMap.stylePositron')}</option>
              <option value="dark">{t('audioMap.styleDark')}</option>
              <option value="satellite">{t('audioMap.styleSatellite')}</option>
            </select>
          </div>
          
          <div className="listener-controls">
            <h3>{t('audioMap.listenerPosition')}</h3>
            <div className="mode-selector">
              <label>
                <input
                  type="radio"
                  value="browser"
                  checked={listenerMode === 'browser'}
                  onChange={(e) => {
                    setListenerMode(e.target.value)
                    if (e.target.value === 'browser' && navigator.geolocation) {
                      navigator.geolocation.getCurrentPosition((pos) => {
                        setListenerPosition({
                          lat: pos.coords.latitude,
                          lng: pos.coords.longitude
                        })
                      })
                    }
                  }}
                />
                {t('audioMap.useBrowserLocation')}
              </label>
              <label>
                <input
                  type="radio"
                  value="manual"
                  checked={listenerMode === 'manual'}
                  onChange={(e) => setListenerMode(e.target.value)}
                />
                {t('audioMap.dragToSet')}
              </label>
            </div>
            {listenerPosition && (
              <div className="position-info">
                <div>Lat: {listenerPosition.lat.toFixed(6)}</div>
                <div>Lng: {listenerPosition.lng.toFixed(6)}</div>
              </div>
            )}
          </div>

          <div className="audio-list">
            <h3>{t('audioMap.audioList')}</h3>
            <div className="upload-area">
              <input
                type="file"
                accept="audio/*,video/*"
                id="audio-upload"
                style={{ display: 'none' }}
                onChange={(e) => {
                  const file = e.target.files[0]
                  if (file) {
                    handleFileUpload(file)
                  }
                  e.target.value = ''
                }}
              />
              <label htmlFor="audio-upload" className="upload-btn">
                {t('audioMap.uploadAudio')}
              </label>
            </div>

            <div className="source-list">
              {audioSources.length === 0 ? (
                <div className="empty-state">{t('audioMap.noAudio')}</div>
              ) : (
                audioSources.map(source => (
                  <div
                    key={source.id}
                    className={`source-item ${selectedSource === source.id ? 'selected' : ''}`}
                    onClick={() => setSelectedSource(source.id)}
                  >
                    <div className="source-name">{source.name}</div>
                    {source.position && (
                      <div className="source-location">
                        {source.position.lat.toFixed(4)}, {source.position.lng.toFixed(4)}
                      </div>
                    )}
                    <button
                      className="delete-btn"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDeleteSource(source.id)
                      }}
                    >
                      ×
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="map-container">
          <div ref={mapRef} className="leaflet-map" />
        </div>
      </div>

      <PlaybackControls
        isPlaying={isPlaying}
        onPlay={handlePlay}
      />
    </div>
  )
}

export default AudioMap

