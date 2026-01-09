import { useState, useEffect } from 'react'
import './App.css'
import Timer from './components/Timer'
import PlayControls from './components/PlayControls'
import VolumeControl from './components/VolumeControl'
import AudioPlayer from './components/AudioPlayer'
import PlaybackHistoryViewer from './components/PlaybackHistoryViewer'
import AlarmModal from './components/AlarmModal'
import LogViewer from './components/LogViewer'
import StatisticsIcon from './assets/StatisticsIcon'
import { savePlaybackRecord } from './utils/PlaybackHistory'
import './utils/LogManager' // 初始化日志管理器

function App() {
  const [isPlaying, setIsPlaying] = useState(false)
  const [timerDuration, setTimerDuration] = useState(60) // 默认1小时（分钟）
  const [timeRemaining, setTimeRemaining] = useState(60 * 60) // 默认1小时（秒）
  const [timerActive, setTimerActive] = useState(false)
  const [startTime, setStartTime] = useState(null) // 播放开始的时间戳
  const [initialDuration, setInitialDuration] = useState(null) // 播放开始时的总时长（秒）
  const [volume, setVolume] = useState(0.5)
  const [isDarkMode, setIsDarkMode] = useState(true) // 默认深色模式，适合夜间使用
  const [playMeditationAudio, setPlayMeditationAudio] = useState(true) // 默认播放冥想引导
  const [enableAlarm, setEnableAlarm] = useState(false) // 默认不启用闹钟功能
  const [enableVibration, setEnableVibration] = useState(true) // 默认启用震动功能
  const [showInstructions, setShowInstructions] = useState(false) // 控制功能说明模态框显示
  const [showPlaybackHistory, setShowPlaybackHistory] = useState(false) // 控制播放记录模态框显示
  const [showAlarmModal, setShowAlarmModal] = useState(false) // 控制闹钟弹窗显示
  const [showLogViewer, setShowLogViewer] = useState(false) // 控制日志查看器显示
  
  // 初始化应用
  useEffect(() => {
    window.logManager.info('应用初始化开始')
    try {
      // 检测通知桥接接口
      if (window.NotificationBridge) {
        window.logManager.info('NotificationBridge 接口可用')
      } else {
        window.logManager.warn('NotificationBridge 接口不可用（仅在Android平台上可用）')
      }

      // 恢复保存的设置
      const savedVolume = localStorage.getItem('volume')
      const savedTheme = localStorage.getItem('theme')
      const savedPlayMeditationAudio = localStorage.getItem('playMeditationAudio')
      const savedEnableVibration = localStorage.getItem('enableVibration')
      
      window.logManager.debug('加载保存的设置', {
        savedVolume,
        savedTheme,
        savedPlayMeditationAudio,
        savedEnableVibration
      })
      
      if (savedVolume) {
        setVolume(parseFloat(savedVolume))
        window.logManager.info('音量设置已恢复', { volume: parseFloat(savedVolume) })
      }
      if (savedTheme) {
        setIsDarkMode(savedTheme === 'dark-theme')
        window.logManager.info('主题设置已恢复', { theme: savedTheme })
      }
      if (savedPlayMeditationAudio !== null) {
        setPlayMeditationAudio(savedPlayMeditationAudio === 'true')
        window.logManager.info('冥想音乐设置已恢复', { playMeditationAudio: savedPlayMeditationAudio === 'true' })
      }
      if (savedEnableVibration !== null) {
        setEnableVibration(savedEnableVibration === 'true')
        window.logManager.info('震动设置已恢复', { enableVibration: savedEnableVibration === 'true' })
      }
      
      window.logManager.info('应用初始化完成')
    } catch (error) {
      window.logManager.error('应用初始化过程中出错', error)
    }
  }, [])

  // 计时器逻辑 - 使用相对时间跟踪，避免系统时间调整导致的问题
  useEffect(() => {
    window.logManager.debug('计时器效果更新', { isPlaying, timeRemaining, startTime, initialDuration, enableAlarm })
    let interval = null
    let elapsedSeconds = 0
    let remainingTime = timeRemaining

    if (isPlaying) {
      // 如果是首次播放或从暂停恢复，重置计时
      if (!startTime) {
        window.logManager.info('计时器开始', {
          initialRemainingTime: remainingTime
        })

        // 如果启用了闹钟，设置Android原生定时器
        if (enableAlarm && window.AlarmSchedulerBridge) {
          try {
            const success = window.AlarmSchedulerBridge.scheduleAlarm(remainingTime, enableVibration)
            window.logManager.info('Android原生定时器设置结果: ' + success + ', 震动设置: ' + enableVibration)
          } catch (error) {
            window.logManager.error('设置Android原生定时器失败', error)
          }
        }
      }

      // 每秒更新一次剩余时间
      interval = setInterval(() => {
        try {
          elapsedSeconds++
          remainingTime = Math.max(0, timeRemaining - elapsedSeconds)

          window.logManager.debug('计时器更新', {
            elapsedSeconds,
            remainingTime,
            initialTime: timeRemaining
          })

          setTimeRemaining(remainingTime)

          // 如果时间到了，停止播放
            if (remainingTime <= 0) {
              setIsPlaying(false)
              window.logManager.info('计时完成，播放停止')

              // 记录完整播放时间
              savePlaybackRecord(timerDuration)
              window.logManager.info('已记录播放记录', { duration: timerDuration })

              // 无论是否启用闹钟，播放结束后媒体声音都调回80%
              if (window.setVolumeTo80Percent) {
                window.setVolumeTo80Percent()
                window.logManager.info('媒体音量已调回80%')
              }

              // 显示播放结束通知
              const endTime = new Date()
              const endTimeString = endTime.toLocaleTimeString()
              const notificationTitle = '睡眠冥想助手'
              const notificationBody = `冥想已结束\n设置时长：${timerDuration}分钟\n结束时间：${endTimeString}`
              
              // 发送通知
              try {
                // Web平台通知
                if ('Notification' in window && Notification.permission === 'granted') {
                  new Notification(notificationTitle, {
                    body: notificationBody,
                    icon: '/icons/icon-192x192.png',
                    badge: '/icons/icon-72x72.png'
                  })
                  window.logManager.info('Web通知已发送', { title: notificationTitle, body: notificationBody })
                } else if ('Notification' in window && Notification.permission !== 'denied') {
                  // 请求通知权限
                  Notification.requestPermission().then(permission => {
                    if (permission === 'granted') {
                      new Notification(notificationTitle, {
                        body: notificationBody,
                        icon: '/icons/icon-192x192.png',
                        badge: '/icons/icon-72x72.png'
                      })
                      window.logManager.info('Web通知已发送', { title: notificationTitle, body: notificationBody })
                    }
                  })
                }
                
                // Android平台通知
                if (window.NotificationBridge && window.NotificationBridge.sendNotification) {
                  window.NotificationBridge.sendNotification(notificationTitle, notificationBody)
                  window.logManager.info('Android通知已发送', { title: notificationTitle, body: notificationBody })
                } else {
                  window.logManager.warn('NotificationBridge.sendNotification方法不可用')
                }
              } catch (error) {
                window.logManager.error('发送通知时出错', error)
              }

              // 如果启用了闹钟功能，显示闹钟弹窗
              if (enableAlarm) {
                if (window.playAlarm) {
                  window.logManager.info('调用window.playAlarm方法')
                  window.playAlarm()
                } else {
                  window.logManager.warn('window.playAlarm方法不可用')
                }
                // 显示闹钟弹窗
                setShowAlarmModal(true)
                window.logManager.info('闹钟弹窗已显示')
              }
            }
        } catch (error) {
          window.logManager.error('计时器执行过程中出错', error)
        }
      }, 1000)
    } else {
      // 暂停时重置计时
      window.logManager.info('计时器暂停', { currentRemaining: timeRemaining })

      // 取消Android原生定时器
      if (window.AlarmSchedulerBridge) {
        try {
          const success = window.AlarmSchedulerBridge.cancelAlarm()
          window.logManager.info('Android原生定时器取消结果: ' + success)
        } catch (error) {
          window.logManager.error('取消Android原生定时器失败', error)
        }
      }
    }

    return () => {
      if (interval) {
        clearInterval(interval)
        window.logManager.debug('计时器已清除')
      }
    }
  }, [isPlaying, timeRemaining, enableAlarm, timerDuration])

  const handlePlayPause = () => {
    window.logManager.info('播放/暂停按钮被点击', { currentState: isPlaying ? '播放中' : '暂停中' })
    try {
      setIsPlaying(!isPlaying)
      window.logManager.info('播放状态已切换', { newState: !isPlaying ? '播放中' : '暂停中' })
    } catch (error) {
      window.logManager.error('切换播放状态时出错', error)
    }
  }

  const handleTimerChange = (minutes) => {
    window.logManager.info('计时器时间变更', { newTime: `${minutes}分钟` })
    try {
      setTimerDuration(minutes)
      setTimeRemaining(minutes * 60)
      setStartTime(null) // 重置开始时间
      setInitialDuration(null) // 重置初始时长
      if (isPlaying) {
        setIsPlaying(false)
        window.logManager.info('计时更改时播放已暂停')
      }
      window.logManager.info('计时器已重置', {
        duration: minutes,
        timeRemaining: minutes * 60
      })
    } catch (error) {
      window.logManager.error('设置计时器时间时出错', error)
    }
  }

  const handleVolumeChange = (newVolume) => {
    window.logManager.info('音量变更', { newVolume })
    try {
      setVolume(newVolume)
      // 保存音量设置
      localStorage.setItem('volume', newVolume)
      window.logManager.debug('音量设置已保存到localStorage')
    } catch (error) {
      window.logManager.error('设置音量时出错', error)
    }
  }

  const toggleTheme = () => {
    window.logManager.info('切换主题设置')
    try {
      setIsDarkMode(!isDarkMode)
      // 保存主题设置
      const newTheme = !isDarkMode ? 'dark-theme' : 'light-theme'
      localStorage.setItem('theme', newTheme)
      window.logManager.info('主题已切换', { newTheme })
    } catch (error) {
      window.logManager.error('切换主题时出错', error)
    }
  }

  const toggleMeditationAudio = () => {
    window.logManager.info('切换冥想音频播放设置')
    try {
      const newValue = !playMeditationAudio
      setPlayMeditationAudio(newValue)
      // 保存冥想音频设置
      localStorage.setItem('playMeditationAudio', newValue)
      window.logManager.info('冥想音频设置已更新并保存', { playMeditationAudio: newValue })
    } catch (error) {
      window.logManager.error('切换冥想音频设置时出错', error)
    }
  }

  const toggleAlarm = () => {
    window.logManager.info('切换闹钟功能设置')
    try {
      setEnableAlarm(!enableAlarm)
      window.logManager.info('闹钟功能已更新', { enableAlarm: !enableAlarm })
    } catch (error) {
      window.logManager.error('切换闹钟功能时出错', error)
    }
  }

  const toggleVibration = () => {
    window.logManager.info('切换震动功能设置')
    try {
      const newValue = !enableVibration
      setEnableVibration(newValue)
      // 保存震动设置
      localStorage.setItem('enableVibration', newValue)
      window.logManager.info('震动功能已更新并保存', { enableVibration: newValue })
    } catch (error) {
      window.logManager.error('切换震动功能时出错', error)
    }
  }

  const toggleInstructions = () => {
    window.logManager.info('切换功能说明模态框显示状态', { currentState: showInstructions ? '打开' : '关闭' })
    try {
      setShowInstructions(!showInstructions)
      window.logManager.info('功能说明模态框状态已更新', { newState: !showInstructions ? '打开' : '关闭' })
    } catch (error) {
      window.logManager.error('切换功能说明模态框时出错', error)
    }
  }
  
  const togglePlaybackHistory = () => {
    window.logManager.info('切换播放记录模态框显示状态', { currentState: showPlaybackHistory ? '打开' : '关闭' })
    try {
      setShowPlaybackHistory(!showPlaybackHistory)
      window.logManager.info('播放记录模态框状态已更新', { newState: !showPlaybackHistory ? '打开' : '关闭' })
    } catch (error) {
      window.logManager.error('切换播放记录模态框时出错', error)
    }
  }
  
  // 处理闹钟弹窗关闭
  const handleAlarmModalClose = async () => {
    window.logManager.info('闹钟弹窗关闭被触发')
    try {
      setShowAlarmModal(false)
      
      // 停止闹钟
      try {
        if (window.alarmRef && window.alarmRef.current) {
          window.alarmRef.current.pause();
          window.alarmRef.current.currentTime = 0;
          window.logManager.info('闹钟音频已停止');
        }
      } catch (error) {
        window.logManager.error('停止闹钟时出错', error);
      }
      
      window.logManager.info('闹钟弹窗已关闭')
    } catch (error) {
      window.logManager.error('处理闹钟弹窗关闭时出错', error)
    }
  }

  // 应用主题类
  const themeClass = isDarkMode ? 'dark-theme' : 'light-theme'

  return (
    <div className={`app-container ${themeClass}`}>
      <div className="app-content">
        <div className="header-content">
          <h1>睡眠冥想助手</h1>
        </div>
        
        {/* 定时设置区域，包含计时器和播放控制 */}
        <div className="timer-section">
          <Timer 
            duration={timerDuration} 
            timeRemaining={timeRemaining}
            setTimeRemaining={handleTimerChange}
            isPlaying={isPlaying}
          />
          <PlayControls 
            isPlaying={isPlaying} 
            onPlayPause={handlePlayPause}
          />
        </div>
        
        <div className="audio-controls">
          <div className="audio-toggle-container">
            <label className="audio-toggle-label">
              <input
                type="checkbox"
                checked={playMeditationAudio}
                onChange={toggleMeditationAudio}
                className="audio-toggle-checkbox"
              />
              <span className="audio-toggle-switch">
                <span className="audio-toggle-slider"></span>
              </span>
              <span className="audio-toggle-text">播放冥想引导</span>
            </label>
          </div>
          
          <div className="audio-toggle-container">
            <label className="audio-toggle-label">
              <input
                type="checkbox"
                checked={enableAlarm}
                onChange={toggleAlarm}
                className="audio-toggle-checkbox"
              />
              <span className="audio-toggle-switch">
                <span className="audio-toggle-slider"></span>
              </span>
              <span className="audio-toggle-text">结束响起闹钟</span>
            </label>
          </div>

          <div className="audio-toggle-container">
            <label className="audio-toggle-label">
              <input
                type="checkbox"
                checked={enableVibration}
                onChange={toggleVibration}
                className="audio-toggle-checkbox"
              />
              <span className="audio-toggle-switch">
                <span className="audio-toggle-slider"></span>
              </span>
              <span className="audio-toggle-text">启用震动</span>
            </label>
          </div>

          <VolumeControl onVolumeChange={handleVolumeChange} />
        </div>

        <AudioPlayer 
          isPlaying={isPlaying} 
          volume={volume}
          playMeditationAudio={playMeditationAudio}
          enableAlarm={enableAlarm}
        />
        
        {/* 底部功能按钮 */}
        <div className="footer-buttons">
          <button
            className="log-button"
            onClick={() => setShowLogViewer(true)}
            aria-label="查看日志"
          >
            📋
            <span className="button-text">日志</span>
          </button>
          <button
            className="theme-toggle"
            onClick={toggleTheme}
            aria-label={isDarkMode ? '切换至浅色模式' : '切换至深色模式'}
          >
            {isDarkMode ? '☀️' : '🌙'}
          </button>
          <button
            className="history-button"
            onClick={togglePlaybackHistory}
            aria-label="查看播放记录"
          >
            <StatisticsIcon size={20} />
          </button>
          <button
            className="info-button"
            onClick={toggleInstructions}
            aria-label="查看应用功能说明"
          >
            ℹ️
          </button>
        </div>

        {/* 播放记录模态框 */}
        <PlaybackHistoryViewer 
          isOpen={showPlaybackHistory} 
          onClose={togglePlaybackHistory}
        />
        
        {/* 功能说明模态框 */}
        {showInstructions && (
          <div className="modal-overlay" onClick={toggleInstructions}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>应用功能说明</h2>
              <button 
                className="close-button"
                onClick={toggleInstructions}
                aria-label="关闭"
              >
                ✕
              </button>
            </div>
            <div className="modal-body">
              <div className="instruction-section">
                <h3>⏰ 定时功能</h3>
                <p>• 可以设置30分钟、1小时、1.5小时或自定义时间</p>
                <p>• 定时结束后会自动停止播放</p>
                <p>• 应用默认启动时间为一小时</p>
              </div>
              <div className="instruction-section">
                <h3>🎵 音频控制</h3>
                <p>• 播放/暂停按钮控制冥想音频的播放状态</p>
                <p>• 音量滑块可以调节音频音量</p>
                <p>• 可选择是否播放冥想引导</p>
                <p>• 音频播放逻辑：</p>
                <p>  - 首先播放冥想音乐(1.mp3)，音量为30%</p>
                <p>  - 冥想音乐播放结束后，自动切换到阿尔法音乐(2.mp3)，音量调整为10%</p>
                <p>  - 阿尔法音乐会循环播放，直到计时结束或手动暂停</p>
              </div>
              <div className="instruction-section">
                 <h3>🔔 闹钟功能</h3>
                 <p>• 定时结束时可以选择播放闹钟提醒</p>
                 <p>• 闹钟音量设为80%以确保您能听到</p>
                 <p>• 无论是否启用闹钟功能，播放结束后媒体声音都会自动调回80%</p>
               </div>
               <div className="instruction-section">
                 <h3>📳 震动功能</h3>
                 <p>• 定时结束时可以选择启用震动提醒</p>
                 <p>• 震动模式为：震动500ms，停止500ms，重复</p>
                 <p>• 震动功能默认启用，可在设置中关闭</p>
               </div>
              <div className="instruction-section">
                <h3>🎨 主题切换</h3>
                <p>• 支持深色/浅色主题切换</p>
                <p>• 深色主题适合夜间使用，保护眼睛</p>
                <p>• 应用默认为深色模式</p>
              </div>
              
              <div className="instruction-section">
                <h3>📊 播放记录</h3>
                <p>• 自动记录每次完整播放的时间和日期</p>
                <p>• 最多保存最近30次播放记录</p>
                <p>• 累计显示总播放次数</p>
                <p>• 点击 📊 按钮查看详细播放历史</p>
              </div>
            </div>
          </div>
          </div>
        )}
        
        {/* 闹钟弹窗 */}
        <AlarmModal 
          isVisible={showAlarmModal} 
          onClose={handleAlarmModalClose} 
        />
        
        {/* 日志查看器 */}
        <LogViewer 
          isVisible={showLogViewer} 
          onClose={() => setShowLogViewer(false)} 
        />
      </div>
    </div>
  )
}

export default App