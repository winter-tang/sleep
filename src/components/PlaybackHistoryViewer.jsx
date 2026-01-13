import { useState, useEffect } from 'react'
import { getPlaybackHistory, getTotalPlays } from '../utils/DatabaseManager'
import './PlaybackHistoryViewer.css'

const PlaybackHistoryViewer = ({ isOpen, onClose }) => {
  const [history, setHistory] = useState([])
  const [totalPlays, setTotalPlays] = useState(0)

  // 加载播放记录
  const loadHistory = async () => {
    try {
      const playbackHistory = await getPlaybackHistory()
      const total = await getTotalPlays()
      setHistory(playbackHistory)
      setTotalPlays(total)
    } catch (error) {
      console.error('加载播放记录失败:', error)
      setHistory([])
      setTotalPlays(0)
    }
  }

  // 当组件打开时加载数据
  useEffect(() => {
    if (isOpen) {
      loadHistory()
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content playback-history-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>播放记录</h2>
          <button 
            className="close-button"
            onClick={onClose}
            aria-label="关闭"
          >
            ✕
          </button>
        </div>
        <div className="modal-body">
          <div className="total-plays-container">
            <h3>总播放次数</h3>
            <div className="total-plays-number">{totalPlays}</div>
          </div>
          
          <div className="history-list-container">
            <h3>最近播放记录</h3>
            {history.length > 0 ? (
              <div className="history-list">
                {history.map((record, index) => (
                  <div key={index} className="history-item">
                    <div className="history-date">{record.date} {record.time}</div>
                    <div className="history-duration">{record.duration}分钟</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="no-history">暂无播放记录</div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default PlaybackHistoryViewer