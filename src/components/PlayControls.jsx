import './PlayControls.css'

const PlayControls = ({ isPlaying, onPlayPause }) => {
  return (
    <div className="play-controls">
      <button className="play-pause-btn" onClick={onPlayPause}>
        {isPlaying ? (
          <svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor">
            <rect x="6" y="4" width="4" height="16" />
            <rect x="14" y="4" width="4" height="16" />
          </svg>
        ) : (
          <svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor">
            <polygon points="8,5 19,12 8,19" />
          </svg>
        )}
        {isPlaying ? '暂停' : '播放'}
      </button>
    </div>
  )
}

export default PlayControls