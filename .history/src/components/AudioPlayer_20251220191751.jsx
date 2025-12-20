import { useRef, useEffect, useState } from 'react'

const AudioPlayer = ({ isPlaying, volume = 0.3, playMeditationAudio = true, enableAlarm = false }) => {
  const audioRef1 = useRef(null)
  const audioRef2 = useRef(null)
  const alarmRef = useRef(null)
  const [audioInitialized, setAudioInitialized] = useState(false)

  // 初始化音频
  useEffect(() => {
    window.logManager.info('初始化音频播放器')
    
    // 创建音频元素
    audioRef1.current = new Audio('/sounds/1.mp3')
    audioRef2.current = new Audio('/sounds/2.mp3')
    alarmRef.current = new Audio('/sounds/3.mp3')
    
    // 设置基本属性
    audioRef1.current.volume = 0.3
    audioRef2.current.volume = 0.1
    audioRef2.current.loop = true
    alarmRef.current.volume = 0.5
    
    // 添加错误处理
    audioRef1.current.addEventListener('error', (e) => {
      window.logManager.error('1.mp3 加载失败', e)
    })
    
    audioRef2.current.addEventListener('error', (e) => {
      window.logManager.error('2.mp3 加载失败', e)
    })
    
    alarmRef.current.addEventListener('error', (e) => {
      window.logManager.error('3.mp3 加载失败', e)
    })
    
    // 设置1.mp3播放结束后播放2.mp3
    audioRef1.current.addEventListener('ended', () => {
      window.logManager.info('1.mp3播放结束，开始播放2.mp3')
      audioRef2.current.currentTime = 0
      audioRef2.current.play().catch(err => {
        window.logManager.error('播放2.mp3失败', err)
      })
    })
    
    setAudioInitialized(true)
    window.logManager.info('音频初始化完成')
    
    return () => {
      // 清理
      if (audioRef1.current) {
        audioRef1.current.pause()
        audioRef1.current = null
      }
      if (audioRef2.current) {
        audioRef2.current.pause()
        audioRef2.current = null
      }
      if (alarmRef.current) {
        alarmRef.current.pause()
        alarmRef.current = null
      }
    }
  }, [])

  // 处理播放/暂停
  useEffect(() => {
    if (!audioInitialized) return
    
    window.logManager.info(`播放状态变化: ${isPlaying}`)
    
    if (isPlaying) {
      // 开始播放
      if (playMeditationAudio) {
        audioRef1.current.currentTime = 0
        audioRef2.current.currentTime = 0
        audioRef1.current.play().catch(err => {
          window.logManager.error('播放1.mp3失败', err)
        })
      }
    } else {
      // 暂停所有音频
      audioRef1.current.pause()
      audioRef2.current.pause()
    }
  }, [isPlaying, playMeditationAudio, audioInitialized])

  // 更新音量
  useEffect(() => {
    if (!audioInitialized) return
    
    if (audioRef1.current) {
      audioRef1.current.volume = volume * 0.3 // 冥想音乐使用30%音量
    }
    if (audioRef2.current) {
      audioRef2.current.volume = volume * 0.1 // 阿尔法音乐使用10%音量
    }
  }, [volume, audioInitialized])

  // 播放闹钟
  useEffect(() => {
    if (!audioInitialized) return
    
    // 暴露闹钟播放方法到window对象
    window.playAlarm = () => {
      window.logManager.info('播放闹钟')
      
      // 停止其他音频
      audioRef1.current.pause()
      audioRef2.current.pause()
      
      // 播放闹钟
      alarmRef.current.currentTime = 0
      alarmRef.current.play().catch(err => {
        window.logManager.error('播放闹钟失败', err)
      })
    }
    
    // 暴露停止闹钟方法
    window.stopAlarm = () => {
      window.logManager.info('停止闹钟')
      alarmRef.current.pause()
      alarmRef.current.currentTime = 0
    }
  }, [audioInitialized])

  return null // 组件不渲染任何内容
}

export default AudioPlayer