import React from 'react'
import { useLanguage } from '../contexts/LanguageContext'
import { getBuiltinSounds } from '../config/builtinSounds'
import './SourcePanel.css'

function SourcePanel({ sources, selectedSource, loadingSource, ambientSoundId, onSelectSource, onUpdateSource, onDeleteSource, onFileUpload, onBuiltinSoundSelect }) {
  const { t } = useLanguage()
  const selectedSourceData = sources.find(s => s.id === selectedSource)
  
  // Separate ambient sound and regular sources
  const ambientSound = sources.find(s => s.id === ambientSoundId)
  const regularSources = sources.filter(s => s.id !== ambientSoundId)
  
  // Get built-in sound list
  const isAmbient = selectedSourceData?.id === ambientSoundId
  const builtinSounds = getBuiltinSounds(isAmbient)

  const handleFileChange = (e, sourceId) => {
    const file = e.target.files[0]
    if (file) {
      console.log(t('console.fileSelected'), file.name, file.type, file.size)
      onFileUpload(sourceId, file)
    } else {
      console.log(t('console.noFileSelected'))
    }
    // Reset input to allow selecting the same file again
    e.target.value = ''
  }

  return (
    <div className="source-panel">
      <div className="panel-header">
        <h2>{t('sourcePanel.title')}</h2>
        <span className="source-count">{sources.length}</span>
      </div>

      <div className="source-list">
        {/* Ambient sound always displayed at top */}
        {ambientSound && (
          <div
            className={`source-item ambient-sound ${selectedSource === ambientSound.id ? 'selected' : ''}`}
            onClick={() => onSelectSource(ambientSound.id)}
          >
            <div className="source-header">
              <span className="source-name">{ambientSound.name}</span>
              {/* Ambient sound doesn't show delete button */}
            </div>
            <div className="source-status">
              {ambientSound.audioBuffer ? (
                <span className="status-badge success">{t('sourcePanel.loaded')}</span>
              ) : (
                <span className="status-badge warning">{t('sourcePanel.notLoaded')}</span>
              )}
            </div>
          </div>
        )}
        
        {/* Regular sources list */}
        {regularSources.length === 0 ? (
          <div className="empty-state">
            <p>{t('sourcePanel.emptyState')}</p>
          </div>
        ) : (
          regularSources.map(source => (
            <div
              key={source.id}
              className={`source-item ${selectedSource === source.id ? 'selected' : ''}`}
              onClick={() => onSelectSource(source.id)}
            >
              <div className="source-header">
                <span className="source-name">{source.name}</span>
                <button
                  className="delete-btn"
                  onClick={(e) => {
                    e.stopPropagation()
                    onDeleteSource(source.id)
                  }}
                >
                  ×
                </button>
              </div>
              <div className="source-status">
                {source.audioBuffer ? (
                  <span className="status-badge success">{t('sourcePanel.loaded')}</span>
                ) : (
                  <span className="status-badge warning">{t('sourcePanel.notLoaded')}</span>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {selectedSourceData && (
        <div className="source-editor">
          <h3>{t('sourcePanel.editSource')}</h3>
          
          <div className="editor-field">
            <label>{t('sourcePanel.name')}</label>
              <input
                type="text"
                value={selectedSourceData.name}
                onChange={(e) => onUpdateSource(selectedSource, { name: e.target.value })}
              />
          </div>

          <div className="editor-field">
            <label>{t('sourcePanel.builtinSound')}</label>
            <select
              value={selectedSourceData.builtinSoundId || 'none'}
              onChange={(e) => {
                if (onBuiltinSoundSelect) {
                  onBuiltinSoundSelect(selectedSource, e.target.value)
                }
              }}
              className="builtin-sound-select"
            >
              {builtinSounds.map(sound => (
                <option key={sound.id} value={sound.id}>
                  {sound.name}
                </option>
              ))}
            </select>
          </div>

          <div className="editor-field">
            <label>{t('sourcePanel.audioFile')}</label>
            <div className="file-upload">
              <input
                type="file"
                accept="audio/*,.wav,.mp3,.ogg,.m4a,.aac"
                onChange={(e) => handleFileChange(e, selectedSource)}
                id={`file-input-${selectedSource}`}
                style={{ display: 'none' }}
              />
              <label 
                htmlFor={`file-input-${selectedSource}`} 
                className={`upload-btn ${loadingSource === selectedSource ? 'loading' : ''}`}
                style={{ opacity: loadingSource === selectedSource ? 0.6 : 1 }}
              >
                {loadingSource === selectedSource 
                  ? t('sourcePanel.loading')
                  : selectedSourceData.audioFile 
                    ? t('sourcePanel.replaceAudioFile')
                    : t('sourcePanel.selectAudioFile')}
              </label>
              {selectedSourceData.audioFile && !selectedSourceData.builtinSoundId && (
                <div className="file-info">
                  <span className="file-name">{selectedSourceData.audioFile.name}</span>
                  <span className="file-size">
                    {(selectedSourceData.audioFile.size / 1024 / 1024).toFixed(2)} MB
                  </span>
                </div>
              )}
              {selectedSourceData.builtinSoundId && selectedSourceData.builtinSoundId !== 'none' && (
                <div className="file-info">
                  <span className="file-name">{builtinSounds.find(s => s.id === selectedSourceData.builtinSoundId)?.name || 'Built-in Sound'}</span>
                </div>
              )}
              {loadingSource === selectedSource && (
                <div className="loading-indicator">{t('sourcePanel.loadingAudio')}</div>
              )}
            </div>
          </div>

          <div className="editor-field">
            <label>{t('sourcePanel.loop')}</label>
              <input
                type="checkbox"
                checked={selectedSourceData.loop}
                onChange={(e) => onUpdateSource(selectedSource, { loop: e.target.checked })}
              />
          </div>

          <div className="editor-field">
            <label>{t('sourcePanel.volume')}: {Math.round(selectedSourceData.volume * 100)}%</label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={selectedSourceData.volume}
                onChange={(e) => onUpdateSource(selectedSource, { volume: parseFloat(e.target.value) })}
              />
          </div>

          {!selectedSourceData.isAmbient && (
            <div className="editor-field">
              <label>{t('sourcePanel.position')}</label>
              <div className="position-info">
                <span>X: {Math.round(selectedSourceData.x)}</span>
                <span>Y: {Math.round(selectedSourceData.y)}</span>
              </div>
            </div>
          )}
          {selectedSourceData.isAmbient && (
            <div className="editor-field">
              <label>{t('sourcePanel.position')}</label>
              <div className="position-info">
                <span>{t('sourcePanel.ambientPosition')}</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default SourcePanel

