import { useState, useEffect } from 'react'
import './VolumeControl.css'

const VolumeControl = ({ onVolumeChange }) => {
  const [volume, setVolume] = useState(50) // 0-100
  const [isMuted, setIsMuted] = useState(false)
  const [tempVolume, setTempVolume] = useState(50)

  useEffect(() => {
    if (onVolumeChange) {
      onVolumeChange(isMuted ? 0 : volume / 100)
    }
  }, [volume, isMuted, onVolumeChange])

  const handleVolumeChange = (e) => {
    const newVolume = parseInt(e.target.value)
    setVolume(newVolume)
    if (isMuted) {
      setIsMuted(false)
      setTempVolume(newVolume)
    }
  }

  const toggleMute = () => {
    if (isMuted) {
      // 取消静音，恢复之前的音量
      setVolume(tempVolume)
    } else {
      // 静音，保存当前音量
      setTempVolume(volume)
    }
    setIsMuted(!isMuted)
  }

  const getVolumeIcon = () => {
    if (isMuted || volume === 0) {
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>
        </svg>
      );
    } else if (volume < 33) {
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
        </svg>
      );
    } else if (volume < 66) {
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71z"/>
        </svg>
      );
    } else {
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM15.54 8.46c-.39-.39-1.03-.39-1.41 0L12 10.59 9.87 8.46c-.39-.39-1.03-.39-1.41 0-.39.39-.39 1.03 0 1.41L10.59 12l-2.12 2.12c-.39.39-.39 1.03 0 1.41.39.39 1.03.39 1.41 0L12 13.41l2.12 2.12c.39.39 1.03.39 1.41 0 .39-.39.39-1.03 0-1.41L13.41 12l2.12-2.12c.39-.39.39-1.03 0-1.41z"/>
        </svg>
      );
    }
  }

  return (
    <div className="volume-control">
      <button className="volume-icon" onClick={toggleMute}>
        {getVolumeIcon()}
      </button>
      <input
        type="range"
        min="0"
        max="100"
        value={isMuted ? 0 : volume}
        onChange={handleVolumeChange}
        className="volume-slider"
        aria-label="音量调节"
      />
      <span className="volume-value">{isMuted ? 0 : volume}%</span>
    </div>
  )
}

export default VolumeControl