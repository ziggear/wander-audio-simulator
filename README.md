# 3D Audio Simulator - HRTF

A spatial audio simulator based on React and Web Audio API, using HRTF (Head-Related Transfer Function) technology to achieve realistic 3D spatial audio effects.

## Features

- 🎵 **3D Spatial Audio**: Realistic stereo effects using Web Audio API's PannerNode and HRTF algorithm
- 🗺️ **Visual Canvas**: 800x600 canvas with the listener at the center, providing intuitive visualization of sound source positions
- 🎯 **Interactive Source Management**:
  - Click on canvas to create sound sources
  - Drag sources to change positions
  - Real-time audio spatial position updates
- 📁 **Audio File Upload**: Support for uploading audio files (WAV, MP3, etc.)
- 🎚️ **Source Controls**:
  - Volume adjustment
  - Loop playback toggle
  - Source naming
- 🔊 **Distance Attenuation**: Volume automatically decreases as distance from listener increases
- 🎧 **Stereo Effects**: Automatic left/right ear sound differences when source positions change

## Tech Stack

- **React 18** - UI Framework
- **Web Audio API** - Audio Processing
  - `AudioContext` - Audio context
  - `PannerNode` - 3D spatial audio processing
  - `HRTF` - Head-Related Transfer Function algorithm
- **Canvas API** - Canvas rendering
- **Vite** - Build tool

## Installation and Running

### Install Dependencies

```bash
npm install
```

### Development Mode

```bash
npm run dev
```

The application will start at `http://localhost:3000`.

### Build for Production

```bash
npm run build
```

## Usage Instructions

1. **Create Sound Sources**: Click anywhere on the canvas to create a new sound source
2. **Upload Audio**:
   - Select a source in the left panel
   - Click the "Select Audio File" button
   - Upload your audio files (e.g., `bird.wav`, `dogbark.wav`)
3. **Adjust Sources**:
   - Drag sources to change positions
   - Edit source name, volume, and loop settings in the left panel
4. **Playback**: Click the "Play" button at the bottom to start playing all sources with loaded audio
5. **Experience Effects**:
   - When dragging sources, sound follows position changes in real-time
   - When source is on the left, sound primarily comes from the left
   - When source is on the right, sound primarily comes from the right
   - Volume decreases as distance from center increases

## Audio Spatial Coordinate System

- **Canvas Center (400, 300)** is the listener position
- **X-axis**: Right is positive (canvas right side)
- **Y-axis**: Up is positive (canvas top, but canvas coordinate system is downward)
- **Z-axis**: Forward is positive (farther from center, smaller Z value)

## Project Structure

```
Wander/
├── src/
│   ├── components/
│   │   ├── Canvas.jsx          # Canvas component
│   │   ├── SourcePanel.jsx     # Source management panel
│   │   └── PlaybackControls.jsx # Playback controls
│   ├── utils/
│   │   └── AudioEngine.js      # Web Audio API core logic
│   ├── App.jsx                 # Main application component
│   ├── main.jsx                # Entry file
│   └── index.css               # Global styles
├── index.html
├── package.json
└── vite.config.js
```

## Browser Compatibility

- Chrome/Edge latest version ✅
- Firefox latest version ✅
- Safari latest version ✅

**Note**: HRTF functionality requires modern browser support. Some browsers may require user interaction (such as clicking) before AudioContext can be initialized.

## Example Scenarios

1. **Bird on left front, dog on right back**:
   - Create a source at the top-left of canvas, upload `bird.wav`
   - Create a source at the bottom-right of canvas, upload `dogbark.wav`
   - Play to experience stereo effects

2. **Moving Sources**:
   - Create sources and upload audio
   - After playback starts, drag sources
   - Sound will follow position changes in real-time

## Technical Details

### HRTF Algorithm

HRTF (Head-Related Transfer Function) is a technology used to simulate 3D spatial audio. It creates realistic stereo effects by simulating the time difference and intensity difference of sound reaching the left and right ears.

### PannerNode Configuration

- `panningModel: 'HRTF'` - Use HRTF algorithm
- `distanceModel: 'inverse'` - Use inverse distance attenuation model
- `refDistance: 1` - Reference distance
- `maxDistance: 50` - Maximum effective distance
- `rolloffFactor: 1` - Attenuation factor

## License

MIT
