import { useRef, useEffect, useState } from 'react'

const AudioPlayer = ({ isPlaying, volume = 0.3, playMeditationAudio = true, enableAlarm = false }) => {
  const audioRef1 = useRef(null)
  const audioRef2 = useRef(null)
  const alarmRef = useRef(null)
  const tempAlarmRef = useRef(null) // 添加临时闹钟音频引用
  const [audioInitialized, setAudioInitialized] = useState(false)
  const [isAndroid, setIsAndroid] = useState(false)
  const [userInteracted, setUserInteracted] = useState(false)
  
  // 检测用户交互
  useEffect(() => {
    const handleUserInteraction = () => {
      if (!userInteracted) {
        setUserInteracted(true)
        window.logManager.info('检测到用户交互，启用音频播放')
      }
    }
    
    // 监听用户交互事件
    const events = ['click', 'touchstart', 'keydown', 'mousedown']
    events.forEach(event => {
      document.addEventListener(event, handleUserInteraction, { once: true })
    })
    
    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleUserInteraction)
      })
    }
  }, [userInteracted])

  // 检测是否在Android环境中
  useEffect(() => {
    const userAgent = navigator.userAgent || navigator.vendor || window.opera
    const isAndroidDevice = /android/i.test(userAgent)
    window.logManager.info('平台检测开始', { userAgent, isAndroidDevice })
    
    if (isAndroidDevice) {
      setIsAndroid(true)
      window.logManager.info('检测到Android环境，使用Android音频路径')
    } else {
      window.logManager.info('未检测到Android环境，使用Web音频路径')
    }
  }, [])

  // 初始化音频
  useEffect(() => {
    window.logManager.info('初始化音频播放器')
    window.logManager.info('平台检测结果:', { isAndroid, userAgent: navigator.userAgent })
    
    // 根据平台选择不同的音频路径
    const audioPath1 = isAndroid ? './sounds/1.mp3' : '/sounds/1.mp3'
    const audioPath2 = isAndroid ? './sounds/2.mp3' : '/sounds/2.mp3'
    const audioPath3 = isAndroid ? './sounds/3.mp3' : '/sounds/3.mp3'
    
    // 在Web环境中，确保路径正确
    const webAudioPath1 = '/sounds/1.mp3'
    const webAudioPath2 = '/sounds/2.mp3'
    const webAudioPath3 = '/sounds/3.mp3'
    
    // 使用适合当前环境的路径
    const finalAudioPath1 = isAndroid ? audioPath1 : webAudioPath1
    const finalAudioPath2 = isAndroid ? audioPath2 : webAudioPath2
    const finalAudioPath3 = isAndroid ? audioPath3 : webAudioPath3
    
    window.logManager.info('音频路径配置:', { 
      finalAudioPath1, 
      finalAudioPath2, 
      finalAudioPath3,
      isAndroid 
    })
    
    // 创建音频元素
          audioRef1.current = new Audio(finalAudioPath1)
          audioRef2.current = new Audio(finalAudioPath2)
          alarmRef.current = new Audio(finalAudioPath3)
          
          // 设置基本属性
          audioRef1.current.volume = 0.3
          audioRef2.current.volume = 0.1
          audioRef2.current.loop = true
          alarmRef.current.volume = 0.5
          
          // 预加载音频文件
          audioRef1.current.preload = 'auto'
          audioRef2.current.preload = 'auto' // 对于大文件，使用自动预加载
          alarmRef.current.preload = 'auto'
          
          window.logManager.info('音频元素创建完成，设置音量:', {
            audio1Volume: audioRef1.current.volume,
            audio2Volume: audioRef2.current.volume,
            alarmVolume: alarmRef.current.volume,
            audio2Preload: audioRef2.current.preload,
            audio2Size: '约95MB（大文件）'
          })
    
    // 添加错误处理
    audioRef1.current.addEventListener('error', (e) => {
      window.logManager.error('1.mp3 加载失败', { 
        error: e, 
        code: e.target.error ? e.target.error.code : 'unknown',
        message: e.target.error ? e.target.error.message : 'unknown error',
        path: finalAudioPath1,
        isAndroid: isAndroid,
        networkState: e.target.networkState,
        readyState: e.target.readyState
      })
    })
    
    audioRef2.current.addEventListener('error', (e) => {
      window.logManager.error('2.mp3 加载失败', { 
        error: e, 
        code: e.target.error ? e.target.error.code : 'unknown',
        message: e.target.error ? e.target.error.message : 'unknown error',
        path: finalAudioPath2,
        networkState: e.target.networkState,
        readyState: e.target.readyState
      })
    })
    
    alarmRef.current.addEventListener('error', (e) => {
      window.logManager.error('3.mp3 加载失败', { 
        error: e, 
        code: e.target.error ? e.target.error.code : 'unknown',
        message: e.target.error ? e.target.error.message : 'unknown error',
        path: finalAudioPath3,
        networkState: e.target.networkState,
        readyState: e.target.readyState
      })
    })
    
    // 添加加载状态监听
    audioRef1.current.addEventListener('loadeddata', () => {
      window.logManager.info('1.mp3 数据加载完成')
    })
    
    audioRef1.current.addEventListener('canplay', () => {
      window.logManager.info('1.mp3 可以播放')
    })
    
    audioRef2.current.addEventListener('loadeddata', () => {
      window.logManager.info('2.mp3 数据加载完成')
    })
    
    audioRef2.current.addEventListener('canplay', () => {
      window.logManager.info('2.mp3 可以播放')
    })
    
    // 添加2.mp3的加载进度监听
    audioRef2.current.addEventListener('progress', () => {
      if (audioRef2.current.buffered.length > 0) {
        const bufferedEnd = audioRef2.current.buffered.end(audioRef2.current.buffered.length - 1)
        const duration = audioRef2.current.duration
        const percentage = duration ? (bufferedEnd / duration) * 100 : 0
        window.logManager.info(`2.mp3 加载进度: ${percentage.toFixed(2)}%`)
      }
    })
    
    audioRef2.current.addEventListener('stalled', () => {
      window.logManager.warn('2.mp3 加载停滞')
    })
    
    audioRef2.current.addEventListener('suspend', () => {
      window.logManager.info('2.mp3 加载暂停')
    })
    
    alarmRef.current.addEventListener('loadeddata', () => {
      window.logManager.info('3.mp3 数据加载完成')
    })
    
    alarmRef.current.addEventListener('canplay', () => {
      window.logManager.info('3.mp3 可以播放')
    })
    
    // 添加播放状态监听
    audioRef1.current.addEventListener('play', () => {
      window.logManager.info('1.mp3 开始播放')
    })
    
    audioRef1.current.addEventListener('pause', () => {
      window.logManager.info('1.mp3 暂停播放')
    })
    
    audioRef1.current.addEventListener('ended', () => {
      window.logManager.info('1.mp3 播放结束，开始播放2.mp3')
      window.logManager.info('2.mp3播放前状态检查:', {
        paused: audioRef2.current.paused,
        currentTime: audioRef2.current.currentTime,
        readyState: audioRef2.current.readyState,
        networkState: audioRef2.current.networkState,
        loop: audioRef2.current.loop,
        volume: audioRef2.current.volume
      })
      
      // 对于大文件，添加延迟和重试机制
      const tryPlayAudio2 = (retryCount = 0) => {
        if (retryCount >= 3) {
          window.logManager.error('2.mp3播放重试次数已达上限')
          return
        }
        
        window.logManager.info(`尝试播放2.mp3 (第${retryCount + 1}次)`)
        
        audioRef2.current.currentTime = 0
        audioRef2.current.play().then(() => {
          window.logManager.info('2.mp3播放成功')
        }).catch(err => {
          window.logManager.error(`播放2.mp3失败 (第${retryCount + 1}次)`, {
            error: err,
            name: err.name,
            message: err.message,
            paused: audioRef2.current.paused,
            currentTime: audioRef2.current.currentTime,
            readyState: audioRef2.current.readyState,
            networkState: audioRef2.current.networkState,
            userInteracted: userInteracted
          })
          
          // 如果失败，延迟后重试
          if (retryCount < 2) {
            setTimeout(() => tryPlayAudio2(retryCount + 1), 1000 * (retryCount + 1))
          }
        })
      }
      
      // 延迟500ms后开始播放，给2.mp3更多缓冲时间
      setTimeout(() => tryPlayAudio2(), 500)
    })
    
    audioRef2.current.addEventListener('play', () => {
      window.logManager.info('2.mp3 开始播放')
    })
    
    audioRef2.current.addEventListener('pause', () => {
      window.logManager.info('2.mp3 暂停播放')
    })
    
    alarmRef.current.addEventListener('play', () => {
      window.logManager.info('3.mp3 开始播放')
    })
    
    alarmRef.current.addEventListener('pause', () => {
      window.logManager.info('3.mp3 暂停播放')
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
  }, [isAndroid])

  // 处理播放/暂停
  useEffect(() => {
    if (!audioInitialized) return
    
    window.logManager.info(`播放状态变化: ${isPlaying}`)
    
    if (isPlaying) {
        // 开始播放
        if (playMeditationAudio) {
          // 播放冥想引导（1.mp3），然后播放背景音乐（2.mp3）
          if (!userInteracted) {
            window.logManager.error('用户尚未交互，无法播放音频。请先点击屏幕任意位置。')
            return
          }
          
          window.logManager.info('准备播放1.mp3（冥想引导）', {
            currentTime: audioRef1.current.currentTime,
            paused: audioRef1.current.paused,
            readyState: audioRef1.current.readyState,
            networkState: audioRef1.current.networkState,
            userInteracted: userInteracted
          })
          
          audioRef1.current.currentTime = 0
          audioRef2.current.currentTime = 0
          audioRef1.current.play()
            .then(() => {
              window.logManager.info('1.mp3播放成功')
            })
            .catch(err => {
              window.logManager.error('播放1.mp3失败', {
                error: err,
                name: err.name,
                message: err.message,
                currentTime: audioRef1.current.currentTime,
                paused: audioRef1.current.paused,
                readyState: audioRef1.current.readyState,
                networkState: audioRef1.current.networkState
              })
            })
        } else {
          // 不播放冥想引导，直接播放背景音乐（2.mp3）
          if (!userInteracted) {
            window.logManager.error('用户尚未交互，无法播放音频。请先点击屏幕任意位置。')
            return
          }
          
          window.logManager.info('准备直接播放2.mp3（背景音乐）', {
            currentTime: audioRef2.current.currentTime,
            paused: audioRef2.current.paused,
            readyState: audioRef2.current.readyState,
            networkState: audioRef2.current.networkState,
            userInteracted: userInteracted
          })
          
          const tryPlayAudio2 = (retryCount = 0) => {
            if (retryCount >= 3) {
              window.logManager.error('2.mp3播放重试次数已达上限')
              return
            }
            
            window.logManager.info(`尝试播放2.mp3 (第${retryCount + 1}次)`)
            
            audioRef2.current.currentTime = 0
            audioRef2.current.play().then(() => {
              window.logManager.info('2.mp3播放成功')
            }).catch(err => {
              window.logManager.error(`播放2.mp3失败 (第${retryCount + 1}次)`, {
                error: err,
                name: err.name,
                message: err.message,
                paused: audioRef2.current.paused,
                currentTime: audioRef2.current.currentTime,
                readyState: audioRef2.current.readyState,
                networkState: audioRef2.current.networkState,
                userInteracted: userInteracted
              })
              
              // 如果失败，延迟后重试
              if (retryCount < 2) {
                setTimeout(() => tryPlayAudio2(retryCount + 1), 1000 * (retryCount + 1))
              }
            })
          }
          
          tryPlayAudio2()
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
    
    // 测试音频文件是否可以加载
    const testAudioFiles = async () => {
      if (!audioInitialized) {
        window.logManager.error('音频未初始化，无法测试音频文件')
        return
      }
      
      window.logManager.info('开始测试音频文件加载')
      
      // 测试1.mp3
      try {
        if (!userInteracted) {
          window.logManager.warn('用户尚未交互，跳过1.mp3测试播放')
        } else {
          await audioRef1.current.play()
          window.logManager.info('1.mp3测试播放成功')
          audioRef1.current.pause()
          audioRef1.current.currentTime = 0
        }
      } catch (err) {
        window.logManager.error('1.mp3测试播放失败', {
          error: err,
          name: err.name,
          message: err.message
        })
      }
      
      // 测试2.mp3
      try {
        if (!userInteracted) {
          window.logManager.warn('用户尚未交互，跳过2.mp3测试播放')
        } else {
          await audioRef2.current.play()
          window.logManager.info('2.mp3测试播放成功')
          audioRef2.current.pause()
          audioRef2.current.currentTime = 0
        }
      } catch (err) {
        window.logManager.error('2.mp3测试播放失败', {
          error: err,
          name: err.name,
          message: err.message
        })
      }
      
      // 测试3.mp3
      try {
        if (!userInteracted) {
          window.logManager.warn('用户尚未交互，跳过3.mp3测试播放')
        } else {
          await alarmRef.current.play()
          window.logManager.info('3.mp3测试播放成功')
          alarmRef.current.pause()
          alarmRef.current.currentTime = 0
        }
      } catch (err) {
        window.logManager.error('3.mp3测试播放失败', {
          error: err,
          name: err.name,
          message: err.message
        })
      }
    }
    
    // 暴露测试函数到window对象
    window.testAudioFiles = testAudioFiles
    
    // 手动播放2.mp3的测试函数
    window.playAudio2 = () => {
      if (!audioInitialized) {
        window.logManager.error('音频未初始化，无法播放2.mp3')
        return
      }
      
      if (!userInteracted) {
        window.logManager.error('用户尚未交互，无法播放2.mp3。请先点击屏幕任意位置。')
        return
      }
      
      window.logManager.info('手动播放2.mp3', {
        paused: audioRef2.current.paused,
        currentTime: audioRef2.current.currentTime,
        readyState: audioRef2.current.readyState,
        networkState: audioRef2.current.networkState,
        loop: audioRef2.current.loop,
        volume: audioRef2.current.volume
      })
      
      const tryPlayAudio2 = (retryCount = 0) => {
        if (retryCount >= 3) {
          window.logManager.error('2.mp3手动播放重试次数已达上限')
          return
        }
        
        window.logManager.info(`尝试手动播放2.mp3 (第${retryCount + 1}次)`)
        
        audioRef2.current.currentTime = 0
        audioRef2.current.play().then(() => {
          window.logManager.info('2.mp3手动播放成功')
        }).catch(err => {
          window.logManager.error(`2.mp3手动播放失败 (第${retryCount + 1}次)`, {
            error: err,
            name: err.name,
            message: err.message,
            paused: audioRef2.current.paused,
            currentTime: audioRef2.current.currentTime,
            readyState: audioRef2.current.readyState,
            networkState: audioRef2.current.networkState
          })
          
          // 如果失败，延迟后重试
          if (retryCount < 2) {
            setTimeout(() => tryPlayAudio2(retryCount + 1), 1000 * (retryCount + 1))
          }
        })
      }
      
      tryPlayAudio2()
    }
    
    // 暴露闹钟播放方法到window对象
    window.playAlarm = () => {
      window.logManager.info('播放闹钟')
      
      // 在Android环境中使用原生接口
      if (isAndroid && window.AlarmAudioBridge) {
        window.AlarmAudioBridge.playAlarm('./sounds/3.mp3', true)
      } else {
        // 停止其他音频
        if (audioRef1.current) audioRef1.current.pause()
        if (audioRef2.current) audioRef2.current.pause()
        
        // 播放闹钟
        window.logManager.info('准备播放3.mp3', {
          currentTime: alarmRef.current ? alarmRef.current.currentTime : 'N/A',
          paused: alarmRef.current ? alarmRef.current.paused : 'N/A',
          readyState: alarmRef.current ? alarmRef.current.readyState : 'N/A',
          networkState: alarmRef.current ? alarmRef.current.networkState : 'N/A',
          userInteracted: userInteracted
        })
        
        if (!userInteracted) {
          window.logManager.warn('用户尚未交互，尝试创建临时音频元素播放闹钟')
          // 如果用户尚未交互，尝试创建新的音频元素来播放闹钟
          try {
            // 停止之前的临时音频（如果存在）
            if (tempAlarmRef.current) {
              tempAlarmRef.current.pause()
              tempAlarmRef.current.currentTime = 0
            }
            
            tempAlarmRef.current = new Audio(finalAudioPath3)
            tempAlarmRef.current.volume = 0.8
            tempAlarmRef.current.play().then(() => {
              window.logManager.info('临时闹钟音频播放成功')
            }).catch(err => {
              window.logManager.error('临时闹钟音频播放失败', {
                error: err,
                name: err.name,
                message: err.message
              })
            })
          } catch (err) {
            window.logManager.error('创建临时闹钟音频失败', {
              error: err,
              name: err.name,
              message: err.message
            })
          }
        }
        
        if (alarmRef.current) {
          // 重置音频状态
          alarmRef.current.currentTime = 0
          
          // 确保音频已加载
          if (alarmRef.current.readyState < 2) {
            window.logManager.info('闹钟音频未完全加载，等待加载完成')
            alarmRef.current.load()
            
            // 等待加载完成后再播放
            const waitForCanPlay = () => {
              return new Promise((resolve) => {
                if (alarmRef.current.readyState >= 2) {
                  resolve()
                } else {
                  alarmRef.current.addEventListener('canplay', resolve, { once: true })
                }
              })
            }
            
            waitForCanPlay().then(() => {
              window.logManager.info('闹钟音频加载完成，开始播放')
              alarmRef.current.currentTime = 0
              alarmRef.current.play().catch(err => {
                window.logManager.error('播放闹钟失败', {
                  error: err,
                  name: err.name,
                  message: err.message,
                  currentTime: alarmRef.current.currentTime,
                  paused: alarmRef.current.paused,
                  readyState: alarmRef.current.readyState,
                  networkState: alarmRef.current.networkState
                })
                
                // 如果第一次播放失败，尝试重新加载并再次播放
                window.logManager.info('尝试重新加载并再次播放闹钟')
                alarmRef.current.load()
                setTimeout(() => {
                  if (alarmRef.current) {
                    alarmRef.current.currentTime = 0
                    alarmRef.current.play().catch(retryErr => {
                      window.logManager.error('重试播放闹钟仍然失败', {
                        error: retryErr,
                        name: retryErr.name,
                        message: retryErr.message
                      })
                    })
                  }
                }, 500)
              })
            })
          } else {
            // 音频已加载，直接播放
            alarmRef.current.play().catch(err => {
              window.logManager.error('播放闹钟失败', {
                error: err,
                name: err.name,
                message: err.message,
                currentTime: alarmRef.current.currentTime,
                paused: alarmRef.current.paused,
                readyState: alarmRef.current.readyState,
                networkState: alarmRef.current.networkState
              })
              
              // 如果第一次播放失败，尝试重新加载并再次播放
              window.logManager.info('尝试重新加载并再次播放闹钟')
              alarmRef.current.load()
              setTimeout(() => {
                if (alarmRef.current) {
                  alarmRef.current.currentTime = 0
                  alarmRef.current.play().catch(retryErr => {
                    window.logManager.error('重试播放闹钟仍然失败', {
                      error: retryErr,
                      name: retryErr.name,
                      message: retryErr.message
                    })
                  })
                }
              }, 500)
            })
          }
        } else {
          window.logManager.error('闹钟音频引用不存在')
        }
      }
    }
    
    // 暴露停止闹钟方法
    window.stopAlarm = () => {
      window.logManager.info('停止闹钟')
      
      // 在Android环境中使用原生接口
      if (isAndroid && window.AlarmAudioBridge) {
        window.AlarmAudioBridge.stopAlarm()
      } else {
        // 停止主要闹钟音频
        if (alarmRef.current) {
          alarmRef.current.pause()
          alarmRef.current.currentTime = 0
          window.logManager.info('主要闹钟音频已停止')
        }
        
        // 停止临时闹钟音频
        if (tempAlarmRef.current) {
          tempAlarmRef.current.pause()
          tempAlarmRef.current.currentTime = 0
          tempAlarmRef.current = null
          window.logManager.info('临时闹钟音频已停止')
        }
      }
    }
    
    // 暴露测试闹钟方法
    window.testAlarm = () => {
      window.logManager.info('测试闹钟播放')
      window.playAlarm()
    }
    
    // 暴露闹钟引用到全局，方便AlarmModal访问
    window.alarmRef = alarmRef
  }, [audioInitialized, isAndroid])

  return (
    <div className="audio-player">
      {/* 用户交互提示 */}
      {!userInteracted && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          color: 'white',
          padding: '10px',
          textAlign: 'center',
          zIndex: 1000,
          fontSize: '14px'
        }}>
          请点击屏幕任意位置以启用音频播放功能
        </div>
      )}
    </div>
  )
}

export default AudioPlayer