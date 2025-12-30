export class AudioEngine {
  constructor() {
    this.audioContext = null
    this.listener = null
    this.activeSources = new Map() // sourceId -> { source, panner, gain, bufferSource }
    this.animationFrameId = null
  }

  async init() {
    if (this.audioContext) {
      // If AudioContext is suspended, try to resume
      if (this.audioContext.state === 'suspended') {
        try {
          await this.audioContext.resume()
          console.log('AudioContext resumed')
        } catch (error) {
          console.warn('Failed to resume AudioContext:', error)
        }
      }
      return
    }

    try {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)()
      this.listener = this.audioContext.listener

      // If AudioContext is suspended, try to resume
      if (this.audioContext.state === 'suspended') {
        console.log('AudioContext is suspended, attempting to resume...')
        try {
          await this.audioContext.resume()
          console.log('AudioContext resumed successfully')
        } catch (error) {
          console.warn('Failed to resume AudioContext:', error)
          // Continue execution, will auto-resume on user interaction
        }
      }

      // Set listener position (3D space center)
      // Web Audio API uses right-handed coordinate system: X right, Y up, Z forward
      this.listener.positionX.value = 0
      this.listener.positionY.value = 0
      this.listener.positionZ.value = 0

      // Set listener orientation (facing forward)
      this.listener.forwardX.value = 0
      this.listener.forwardY.value = 0
      this.listener.forwardZ.value = -1
      this.listener.upX.value = 0
      this.listener.upY.value = 1
      this.listener.upZ.value = 0

      console.log('AudioEngine initialized, state:', this.audioContext.state)
    } catch (error) {
      console.error('AudioContext initialization failed:', error)
      throw error
    }
  }

  // Convert 2D canvas coordinates to 3D audio space coordinates
  canvasToAudioSpace(canvasX, canvasY, canvasWidth, canvasHeight) {
    // Canvas center as origin
    const centerX = canvasWidth / 2
    const centerY = canvasHeight / 2

    // Convert to coordinates relative to center
    const relativeX = canvasX - centerX
    const relativeY = canvasY - centerY

    // Normalize to -1 to 1 range (assuming canvas size as unit)
    const normalizedX = relativeX / (canvasWidth / 2)
    const normalizedY = relativeY / (canvasHeight / 2)

    // Convert to 3D audio space coordinates
    // X: right is positive (corresponds to canvas right)
    // Y: up is positive (corresponds to canvas top, but needs to be flipped because canvas Y is downward)
    // Z: forward is positive (distance from canvas center outward)
    const distance = Math.sqrt(normalizedX * normalizedX + normalizedY * normalizedY)
    
    // Use distance as Z coordinate (negative value means in front of listener)
    // For better effect, we map distance to Z axis
    const audioX = normalizedX * 5 // Scale up range for better spatial sense
    const audioY = -normalizedY * 5 // Flip Y axis
    const audioZ = -distance * 3 // Negative value means in front of listener, farther distance means smaller Z

    return { x: audioX, y: audioY, z: audioZ, distance }
  }

  async playSources(sources, canvasElement) {
    await this.init()

    // Get canvas dimensions
    const canvasWidth = canvasElement ? canvasElement.width : 800
    const canvasHeight = canvasElement ? canvasElement.height : 600

    // Stop all existing sources
    this.stopAll()

    // Start all sources with audio buffers
    for (const source of sources) {
      if (!source.audioBuffer) continue

      try {
        let audioSpace
        // Ambient sound is fixed at listener center (0, 0, 0)
        if (source.isAmbient) {
          audioSpace = { x: 0, y: 0, z: 0, distance: 0 }
        } else {
          audioSpace = this.canvasToAudioSpace(
            source.x,
            source.y,
            canvasWidth,
            canvasHeight
          )
        }

        // Create audio node chain: bufferSource -> gain -> panner -> destination
        const bufferSource = this.audioContext.createBufferSource()
        const gainNode = this.audioContext.createGain()
        const pannerNode = this.audioContext.createPanner()

        // Configure PannerNode
        pannerNode.panningModel = 'HRTF' // Use HRTF algorithm
        pannerNode.distanceModel = 'inverse' // Distance attenuation model
        pannerNode.refDistance = 1 // Reference distance
        pannerNode.maxDistance = 50 // Maximum distance
        pannerNode.rolloffFactor = 1 // Attenuation factor
        pannerNode.coneInnerAngle = 360 // Omnidirectional
        pannerNode.coneOuterAngle = 360
        pannerNode.coneOuterGain = 0

        // Set source position
        pannerNode.positionX.value = audioSpace.x
        pannerNode.positionY.value = audioSpace.y
        pannerNode.positionZ.value = audioSpace.z

        // Set volume (based on user-set volume)
        gainNode.gain.value = source.volume

        // Connect nodes
        bufferSource.buffer = source.audioBuffer
        bufferSource.loop = source.loop || false
        bufferSource.connect(gainNode)
        gainNode.connect(pannerNode)
        pannerNode.connect(this.audioContext.destination)

        // Play
        bufferSource.start(0)

        // Save reference
        this.activeSources.set(source.id, {
          source,
          bufferSource,
          gainNode,
          pannerNode,
          canvasElement
        })
      } catch (error) {
        console.error(`Failed to play source ${source.id}:`, error)
      }
    }

    // Start update loop (for real-time position updates)
    this.startUpdateLoop()
  }

  updateSourcePosition(sourceId, canvasX, canvasY, canvasElement) {
    const activeSource = this.activeSources.get(sourceId)
    if (!activeSource) return

    // Ambient sound position is fixed, cannot be updated
    if (activeSource.source?.isAmbient) {
      return
    }

    const element = canvasElement || activeSource.canvasElement
    const canvasWidth = element ? element.width : 800
    const canvasHeight = element ? element.height : 600

    const audioSpace = this.canvasToAudioSpace(
      canvasX,
      canvasY,
      canvasWidth,
      canvasHeight
    )

    // Update PannerNode position
    activeSource.pannerNode.positionX.value = audioSpace.x
    activeSource.pannerNode.positionY.value = audioSpace.y
    activeSource.pannerNode.positionZ.value = audioSpace.z
  }

  updateSourceVolume(sourceId, volume) {
    const activeSource = this.activeSources.get(sourceId)
    if (!activeSource) return

    activeSource.gainNode.gain.value = volume
  }

  startUpdateLoop() {
    if (this.animationFrameId) return

    const update = () => {
      // Update loop mainly for smooth transitions, but position updates are now triggered externally
      // Keep loop here in case other real-time updates are needed
      this.animationFrameId = requestAnimationFrame(update)
    }

    update()
  }

  stopUpdateLoop() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId)
      this.animationFrameId = null
    }
  }

  stopAll() {
    this.stopUpdateLoop()

    this.activeSources.forEach(({ bufferSource }) => {
      try {
        bufferSource.stop()
      } catch (error) {
        // May already be stopped
      }
    })

    this.activeSources.clear()
  }

  removeSource(sourceId) {
    const activeSource = this.activeSources.get(sourceId)
    if (activeSource) {
      try {
        activeSource.bufferSource.stop()
      } catch (error) {
        // May already be stopped
      }
      this.activeSources.delete(sourceId)
    }
  }

  // Convert GPS coordinates to 3D audio space coordinates relative to listener
  gpsToAudioSpace(sourceLat, sourceLng, listenerLat, listenerLng) {
    // Calculate distance and bearing between two GPS points
    const R = 6371000 // Earth radius in meters
    
    const dLat = (sourceLat - listenerLat) * Math.PI / 180
    const dLng = (sourceLng - listenerLng) * Math.PI / 180
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(listenerLat * Math.PI / 180) * Math.cos(sourceLat * Math.PI / 180) *
              Math.sin(dLng / 2) * Math.sin(dLng / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    const distance = R * c // Distance in meters
    
    // Calculate bearing (direction from listener to source)
    const y = Math.sin(dLng) * Math.cos(sourceLat * Math.PI / 180)
    const x = Math.cos(listenerLat * Math.PI / 180) * Math.sin(sourceLat * Math.PI / 180) -
              Math.sin(listenerLat * Math.PI / 180) * Math.cos(sourceLat * Math.PI / 180) * Math.cos(dLng)
    const bearing = Math.atan2(y, x) * 180 / Math.PI
    
    // Convert to 3D audio space
    // Scale: 1 meter = 1 unit in audio space (adjust as needed)
    const scale = 0.001 // Scale down for better audio effect (1km = 1 unit)
    const distanceScaled = distance * scale
    
    // Convert bearing to radians
    const bearingRad = bearing * Math.PI / 180
    
    // Calculate X, Y, Z coordinates
    // X: East is positive (right)
    // Y: Up is positive (we'll keep it at 0 for ground level)
    // Z: North is negative (forward in Web Audio API convention)
    const audioX = Math.sin(bearingRad) * distanceScaled
    const audioY = 0 // Ground level
    const audioZ = -Math.cos(bearingRad) * distanceScaled // Negative for forward
    
    return { x: audioX, y: audioY, z: audioZ, distance: distanceScaled }
  }

  async playMapSources(sources, listenerPosition) {
    await this.init()

    // Stop all existing sources
    this.stopAll()

    // Start all sources with audio buffers and positions
    for (const source of sources) {
      if (!source.audioBuffer || !source.position) continue

      try {
        // Convert GPS coordinates to audio space
        const audioSpace = this.gpsToAudioSpace(
          source.position.lat,
          source.position.lng,
          listenerPosition.lat,
          listenerPosition.lng
        )

        // Create audio node chain: bufferSource -> gain -> panner -> destination
        const bufferSource = this.audioContext.createBufferSource()
        const gainNode = this.audioContext.createGain()
        const pannerNode = this.audioContext.createPanner()

        // Configure PannerNode
        pannerNode.panningModel = 'HRTF'
        pannerNode.distanceModel = 'inverse'
        pannerNode.refDistance = 1
        pannerNode.maxDistance = 10000 // Larger max distance for map scale
        pannerNode.rolloffFactor = 1
        pannerNode.coneInnerAngle = 360
        pannerNode.coneOuterAngle = 360
        pannerNode.coneOuterGain = 0

        // Set source position
        pannerNode.positionX.value = audioSpace.x
        pannerNode.positionY.value = audioSpace.y
        pannerNode.positionZ.value = audioSpace.z

        // Set volume
        gainNode.gain.value = source.volume || 1.0

        // Connect nodes
        bufferSource.buffer = source.audioBuffer
        bufferSource.loop = source.loop || false
        bufferSource.connect(gainNode)
        gainNode.connect(pannerNode)
        pannerNode.connect(this.audioContext.destination)

        // Play
        bufferSource.start(0)

        // Save reference
        this.activeSources.set(source.id, {
          source,
          bufferSource,
          gainNode,
          pannerNode
        })
      } catch (error) {
        console.error(`Failed to play source ${source.id}:`, error)
      }
    }

    // Start update loop
    this.startUpdateLoop()
  }

  updateMapSourcePosition(sourceId, sourceLat, sourceLng, listenerLat, listenerLng) {
    const activeSource = this.activeSources.get(sourceId)
    if (!activeSource) return

    const audioSpace = this.gpsToAudioSpace(
      sourceLat,
      sourceLng,
      listenerLat,
      listenerLng
    )

    // Update PannerNode position
    activeSource.pannerNode.positionX.value = audioSpace.x
    activeSource.pannerNode.positionY.value = audioSpace.y
    activeSource.pannerNode.positionZ.value = audioSpace.z
  }

  cleanup() {
    this.stopAll()
    if (this.audioContext) {
      this.audioContext.close()
      this.audioContext = null
    }
  }
}

