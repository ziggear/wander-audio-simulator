import React from 'react'
import { useLanguage } from '../contexts/LanguageContext'
import './PlaybackControls.css'

function PlaybackControls({ isPlaying, onPlay }) {
  const { t } = useLanguage()
  
  return (
    <div className="playback-controls">
      <button 
        className={`play-btn ${isPlaying ? 'playing' : ''}`}
        onClick={onPlay}
      >
        {isPlaying ? (
          <>
            <span className="icon">⏸</span>
            <span>{t('playback.pause')}</span>
          </>
        ) : (
          <>
            <span className="icon">▶</span>
            <span>{t('playback.play')}</span>
          </>
        )}
      </button>
      <div className="controls-info">
        <p>{t('playback.info1')}</p>
        <p>{t('playback.info2')}</p>
      </div>
    </div>
  )
}

export default PlaybackControls

