import { useState } from 'react'
import './Timer.css'

const Timer = ({ duration, timeRemaining, setTimeRemaining, isPlaying }) => {
  const [customMinutes, setCustomMinutes] = useState('')
  const [showCustomInput, setShowCustomInput] = useState(false)

  const formatTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    
    if (hrs > 0) {
      return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const handleDurationChange = (minutes) => {
    setTimeRemaining(minutes) // 直接传递分钟数
  }

  const handleCustomSubmit = (e) => {
    e.preventDefault()
    const trimmedValue = customMinutes.trim()
    const minutes = parseInt(trimmedValue)
    
    // 验证输入: 确保是有效数字且在范围内
    if (!isNaN(minutes) && minutes > 0 && minutes <= 480) { // 最多8小时
      handleDurationChange(minutes)
      setShowCustomInput(false)
      setCustomMinutes('')
    }
  }

  return (
    <div className="timer-container">
      <div className="timer-display">
        <div className="time">{formatTime(timeRemaining)}</div>
      </div>
      
      <div className="timer-settings">
        <h3>定时设置</h3>
        <div className="timer-buttons">
          <button 
            onClick={() => handleDurationChange(15)} 
            className={`timer-btn ${Math.floor(timeRemaining / 60) === 15 ? 'active' : ''}`}
          >
            15分钟
          </button>
          <button
            onClick={() => handleDurationChange(25)}
            className={`timer-btn ${Math.floor(timeRemaining / 60) === 25 ? 'active' : ''}`}
          >
            25分钟
          </button>
          <button 
            onClick={() => handleDurationChange(30)} 
            className={`timer-btn ${Math.floor(timeRemaining / 60) === 30 ? 'active' : ''}`}
          >
            30分钟
          </button>
          <button 
            onClick={() => setShowCustomInput(!showCustomInput)} 
            className="timer-btn"
          >
            自定义
          </button>
        </div>
        
        {showCustomInput && (
          <form className="custom-input-form" onSubmit={handleCustomSubmit}>
            <input
              type="number"
              min="1"
              max="480"
              value={customMinutes}
              onChange={(e) => setCustomMinutes(e.target.value)}
              placeholder="输入分钟数"
              autoFocus
            />
            <button type="submit" className="custom-submit-btn">确定</button>
          </form>
        )}
      </div>
    </div>
  )
}

export default Timer