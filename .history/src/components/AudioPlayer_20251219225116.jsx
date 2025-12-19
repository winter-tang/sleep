import { useRef, useEffect, useState } from 'react'
import { log } from '../utils/Logger'

// 全局变量用于追踪是否已进行用户交互
let hasUserInteracted = false;

const AudioPlayer = ({ isPlaying, volume = 0.3, playMeditationAudio = true, enableAlarm = false }) => { // 默认音量设置为30%
  const audioRef1 = useRef(null)
  const audioRef2 = useRef(null)
  const alarmRef = useRef(null)
  const audioContextRef = useRef(null)
  const isAndroid = useRef(false)
  const [audioInitialized, setAudioInitialized] = useState(false);
  const userInteractionListenerRef = useRef(null);
  // 添加enableAlarmRef来跟踪最新的enableAlarm值
  const enableAlarmRef = useRef(enableAlarm);
  
  // 更新enableAlarmRef当enableAlarm变化时
  useEffect(() => {
    enableAlarmRef.current = enableAlarm;
  }, [enableAlarm]);

  // 初始化音频元素 - 仅在用户交互后执行
  useEffect(() => {
    log.info('AudioPlayer组件挂载');
    
    // 检测是否在Android环境中运行
    const userAgent = navigator.userAgent.toLowerCase();
    isAndroid.current = userAgent.includes('android');
    log.info(`运行环境检测: Android=${isAndroid.current}`);
    
    // 检查是否已经有用户交互
    if (hasUserInteracted) {
      log.info('检测到已有用户交互，立即初始化音频');
      initAudioSystem();
    } else {
      log.info('等待用户交互后初始化音频...');
      
      // 设置用户交互监听器
      const handleUserInteraction = () => {
        log.info('检测到用户交互，开始初始化音频系统');
        hasUserInteracted = true;
        initAudioSystem();
        
        // 移除监听器以避免重复初始化
        if (userInteractionListenerRef.current) {
          document.removeEventListener('click', userInteractionListenerRef.current);
          document.removeEventListener('touchstart', userInteractionListenerRef.current);
          document.removeEventListener('keydown', userInteractionListenerRef.current);
        }
      };
      
      // 保存监听器引用
      userInteractionListenerRef.current = handleUserInteraction;
      
      // 添加多种交互事件监听器以确保捕获任何用户操作
      document.addEventListener('click', handleUserInteraction);
      document.addEventListener('touchstart', handleUserInteraction);
      document.addEventListener('keydown', handleUserInteraction);
      
      // 暴露初始化音频的方法给全局，以便其他组件可以触发
      window.initAudioAfterUserInteraction = handleUserInteraction;
      log.info('已注册用户交互事件监听器');
    }
    
    // 清理函数
    return () => {
      log.info('AudioPlayer组件清理');
      if (userInteractionListenerRef.current) {
        document.removeEventListener('click', userInteractionListenerRef.current);
        document.removeEventListener('touchstart', userInteractionListenerRef.current);
        document.removeEventListener('keydown', userInteractionListenerRef.current);
      }
    };
  }, []);
  
  // 音频系统初始化函数
  const initAudioSystem = () => {
    log.info('开始初始化音频系统');
    
    // 音频文件路径 - 使用相对路径以提高兼容性
    const audioPaths = {
      meditation: './sounds/1.mp3',
      alpha: './sounds/2.mp3',
      alarm: './sounds/3.m4a'
    }
    
    // 对于Android环境，提供更多的路径尝试
    const getAudioPath = (filename) => {
      const basePath = './sounds/';
      // 在Android中，不同版本的Capacitor可能有不同的路径处理
      return isAndroid.current ? [basePath + filename, `sounds/${filename}`] : [basePath + filename];
    }
    
    // 创建并加载音频元素的辅助函数
    const createAndLoadAudio = async (filename, isAlarm = false) => {
      try {
        log.info(`开始创建音频元素: ${filename}`);
        const paths = getAudioPath(filename);
        let audio = null;
        
        // 尝试不同的路径
        for (const path of paths) {
          try {
            log.info(`尝试路径: ${path}`);
            audio = new Audio(path);
            
            // 设置预加载
            audio.preload = 'auto';
            
            // 在Android上，添加额外的事件监听以便更好地调试
            if (isAndroid.current) {
              audio.addEventListener('loadedmetadata', () => {
                log.info(`Android: ${path} 元数据加载成功`);
              });
              audio.addEventListener('loadeddata', () => {
                log.info(`Android: ${path} 数据加载成功`);
              });
              audio.addEventListener('loadstart', () => {
                log.info(`Android: ${path} 开始加载`);
              });
            }
            
            // 设置加载成功和失败事件
            audio.addEventListener('canplaythrough', () => {
              log.info(`${path} 音频文件加载成功`);
            });
            
            audio.addEventListener('error', (err) => {
              const errorCode = err.target.error ? err.target.error.code : '未知';
              log.error(`${path} 音频文件加载失败: ${err.message || '未知错误'}, 错误码: ${errorCode}`);
            });
            
            // 尝试加载
            await audio.load();
            
            // 如果加载成功，返回音频元素
            if (audio.readyState >= 1) { // HAVE_METADATA
              log.info(`音频加载成功: ${path}`);
              return audio;
            }
          } catch (pathError) {
            log.error(`路径 ${path} 加载失败:`, pathError);
          }
        }
        
        log.error(`所有路径都无法加载音频文件: ${filename}`);
        return null;
      } catch (error) {
        log.error(`创建音频元素失败 (${filename}):`, error);
        return null;
      }
    }
    
    // 初始化音频函数
    const initAudios = async () => {
      // 初始化冥想音频
      try {
        audioRef1.current = await createAndLoadAudio('1.mp3');
        if (audioRef1.current) {
          audioRef1.current.volume = 0.3;
          log.info('1.mp3初始化完成，音量设置为0.3');
        }
      } catch (err) {
        log.error('初始化1.mp3失败:', err);
      }
      
      // 初始化阿尔法音频
      try {
        audioRef2.current = await createAndLoadAudio('2.mp3');
        if (audioRef2.current) {
          audioRef2.current.volume = 0.1;
          audioRef2.current.loop = true;
          log.info('2.mp3初始化完成，音量设置为0.1，已设置循环播放');
        }
      } catch (err) {
        log.error('初始化2.mp3失败:', err);
      }
      
      // 初始化闹钟音频
      try {
        alarmRef.current = await createAndLoadAudio('3.m4a', true);
        if (alarmRef.current) {
          alarmRef.current.volume = volume;
          log.info('闹钟音频初始化完成');
        }
      } catch (err) {
        log.error('初始化闹钟音频失败:', err);
      }
    }
    
    // 在Android环境中，避免使用可能不兼容的Web Audio API
    if (!isAndroid.current) {
      try {
        audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
        log.info('音频上下文初始化成功');
      } catch (e) {
        log.warn('Web Audio API不受支持，将使用默认播放方式', { error: e.message });
      }
    } else {
      log.info('Android环境检测到，跳过Web Audio API初始化');
    }
    
    // 初始化音频
    initAudios().then(() => {
      log.info('音频系统初始化完成');
      setAudioInitialized(true);
      
      // 测试播放一个静默音频以解锁音频上下文
      testAudioPlayback();
    });
    
    // 测试音频播放函数 - 用于解锁音频上下文
    const testAudioPlayback = async () => {
      log.info('开始测试音频播放以解锁音频上下文');
      
      // 尝试播放一个短的静默音频片段
      try {
        // 创建一个静默的AudioBuffer
        if (audioContextRef.current) {
          try {
            // 如果音频上下文被暂停，恢复它
            if (audioContextRef.current.state === 'suspended') {
              await audioContextRef.current.resume();
              log.info('音频上下文已从暂停状态恢复');
            }
          } catch (resumeErr) {
            log.warn('恢复音频上下文失败，可能不受支持:', resumeErr);
          }
        }
        
        // 使用现有的音频元素进行测试播放
        const testAudioElements = [audioRef1.current, audioRef2.current, alarmRef.current].filter(Boolean);
        
        for (const audioElement of testAudioElements) {
          try {
            // 保存当前时间和音量
            const originalTime = audioElement.currentTime;
            const originalVolume = audioElement.volume;
            
            // 设置为静音并移动到文件开头
            audioElement.volume = 0;
            audioElement.currentTime = 0;
            
            // 尝试播放一小段时间
            log.info(`测试播放音频元素: ${audioElement.src}`);
            const playPromise = audioElement.play();
            
            if (playPromise) {
              // 非Android环境使用Promise
              await playPromise;
              log.info('测试播放成功启动');
              
              // 立即暂停
              setTimeout(() => {
                audioElement.pause();
                // 恢复原始状态
                audioElement.currentTime = originalTime;
                audioElement.volume = originalVolume;
                log.info('测试播放完成，已恢复原始状态');
              }, 10);
            } else {
              // Android环境可能没有返回Promise
              log.info('Android测试播放命令已发送');
              setTimeout(() => {
                audioElement.pause();
                audioElement.currentTime = originalTime;
                audioElement.volume = originalVolume;
                log.info('Android测试播放完成');
              }, 10);
            }
            
            // 只要有一个成功，就可以了
            break;
          } catch (playErr) {
            log.warn(`测试播放失败: ${playErr.message}`);
            // 继续尝试下一个音频元素
          }
        }
        
        log.info('音频解锁测试完成');
      } catch (error) {
        log.error('音频解锁测试过程中出错:', error);
      }
    };
    
    // 监听第一个音频结束事件
    const handleEnded1 = () => {
      // 冥想音乐播放完毕后，播放阿尔法音乐(音量调整为10%)
      log.info('1.mp3播放结束，准备播放2.mp3')
      try {
        audioRef2.current.currentTime = 0
        audioRef2.current.loop = true // 再次确保循环设置
        fadeIn(audioRef2.current, 1000, 0.1)
        audioRef2.current.play().catch(err => {
          log.error('1.mp3结束后播放2.mp3错误', err)
          // 重试播放
          setTimeout(() => {
            audioRef2.current.play().catch(err2 => log.error('再次尝试播放失败', err2))
          }, 300)
        })
      } catch (error) {
        log.error('处理1.mp3结束事件时出错', error)
      }
    }
    
    audioRef1.current.addEventListener('ended', handleEnded1)
    
    return () => {
      // 清理
      log.info('AudioPlayer清理开始')
      try {
        if (audioRef1.current) {
          audioRef1.current.removeEventListener('ended', handleEnded1)
          audioRef1.current.pause()
          audioRef1.current.src = ''
          log.info('1.mp3资源已清理')
        }
        
        if (audioRef2.current) {
          audioRef2.current.pause()
          audioRef2.current.src = ''
          log.info('2.mp3资源已清理')
        }
        
        if (alarmRef.current) {
          alarmRef.current.pause()
          alarmRef.current.src = ''
          log.info('闹钟资源已清理')
        }
      } catch (error) {
        log.error('AudioPlayer清理过程中出错', error)
      }
    }
  }

  // 平滑淡入函数
  const fadeIn = (audio, duration, targetVolume) => {
    const startVolume = audio.volume
    const volumeDiff = targetVolume - startVolume
    const startTime = Date.now()
    
    const animate = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1)
      audio.volume = startVolume + (volumeDiff * progress)
      
      if (progress < 1) {
        requestAnimationFrame(animate)
      }
    }
    
    animate()
  }

  // 平滑淡出函数
  const fadeOut = (audio, duration) => {
    const startVolume = audio.volume
    const volumeDiff = -startVolume
    const startTime = Date.now()
    
    const animate = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1)
      audio.volume = startVolume + (volumeDiff * progress)
      
      if (progress < 1) {
        requestAnimationFrame(animate)
      } else {
        audio.pause()
      }
    }
    
    animate()
  }

  // 处理播放/暂停控制
  useEffect(() => {
    if (!audioRef1.current || !audioRef2.current) {
      log.warn('音频元素未初始化，跳过播放控制');
      return;
    }
    
    if (!isPlaying) {
      // 暂停所有音频
      log.info('暂停所有音频');
      fadeOut(audioRef1.current, 500);
      fadeOut(audioRef2.current, 500);
      return;
    }
    
    // 重置状态
    log.info('重置音频状态');
    try {
      audioRef1.current.pause();
      audioRef1.current.currentTime = 0;
      audioRef2.current.pause();
      audioRef2.current.currentTime = 0;
      // 确保2.mp3设置为循环播放
      audioRef2.current.loop = true;
      log.info('播放前再次确认2.mp3循环设置');
    } catch (e) {
      log.error('重置音频状态失败:', e);
    }
    
    // 创建一个辅助函数来播放音频并处理错误
    const safePlayAudio = async (audioElement, targetVolume, isMain = false) => {
      const audioName = isMain ? '1.mp3' : '2.mp3';
      log.debug(`${audioName} 开始播放尝试`);
      
      try {
        // 确保音频元素已加载
        if (audioElement.readyState < 1) { // HAVE_METADATA
          log.debug(`${audioName} 等待数据加载...`);
          // 尝试重新加载
          try {
            await audioElement.load();
            await new Promise(resolve => setTimeout(resolve, 200));
          } catch (loadErr) {
            log.error(`${audioName} 重新加载失败:`, loadErr);
          }
        }
        
        // Android优化：先设置音量，避免播放延迟
        if (isAndroid.current) {
          audioElement.volume = targetVolume; // 在Android上直接设置目标音量
        } else {
          audioElement.volume = 0.1; // 先设置一个低音量
        }
        
        // 直接播放尝试
        log.info(`${audioName} 开始播放`);
        await audioElement.play();
        log.info(`${audioName} 播放成功！`);
        
        // 在非Android环境下使用淡入效果
        if (!isAndroid.current && audioElement.volume !== targetVolume) {
          fadeIn(audioElement, 500, targetVolume);
        }
        
        return true;
      } catch (err) {
        const errorCode = err.code || '未知';
        const errorMsg = err.message || '未知错误';
        log.error(`${isMain ? '播放1.mp3错误' : '播放2.mp3错误'}`, { errorCode, errorMsg });
        
        // Android特定处理：尝试更简单的播放方式
        if (isAndroid.current) {
          try {
            log.info(`${audioName} Android专用播放尝试`);
            // 直接播放，不使用Promise
            audioElement.play();
            log.info(`${audioName} Android播放命令已发送`);
          } catch (androidErr) {
            log.error(`${audioName} Android播放失败:`, androidErr);
          }
        }
        
        // 第一次重试
        setTimeout(() => {
          try {
            log.debug(`${audioName} 第一次重试播放`);
            audioElement.currentTime = 0;
            if (!isMain) audioElement.loop = true;
            audioElement.play().catch(err2 => {
              log.error(`${audioName} 第一次重试失败`, err2);
              
              // 第二次重试
              setTimeout(() => {
                try {
                  log.debug(`${audioName} 第二次重试播放`);
                  audioElement.currentTime = 0;
                  if (!isMain) audioElement.loop = true;
                  audioElement.play().catch(err3 => {
                    log.error(`${audioName} 第二次重试也失败`, err3);
                  });
                } catch (e) {
                  log.error('重试逻辑错误', e);
                }
              }, 500);
            });
          } catch (e) {
            log.error('重试逻辑错误', e);
          }
        }, 300);
        return false;
      }
    };
    
    log.info('播放模式:', { mode: playMeditationAudio ? '冥想+阿尔法' : '仅阿尔法' });
    
    // 记录音频元素状态
    if (audioRef1.current && audioRef2.current) {
      log.debug('音频元素状态:', {
        '1.mp3': {
          readyState: audioRef1.current.readyState,
          stateText: getReadyStateText(audioRef1.current.readyState),
          networkState: audioRef1.current.networkState,
          error: audioRef1.current.error ? audioRef1.current.error.code : null
        },
        '2.mp3': {
          readyState: audioRef2.current.readyState,
          stateText: getReadyStateText(audioRef2.current.readyState),
          networkState: audioRef2.current.networkState,
          error: audioRef2.current.error ? audioRef2.current.error.code : null
        }
      });
    }
    
    // 确保在用户交互后播放音频
    if (playMeditationAudio && audioRef1.current) {
      // 播放冥想音频模式：先播放1.mp3(音量30%)，完成后播放2.mp3(音量10%)
      log.info('开始播放1.mp3冥想音乐');
      safePlayAudio(audioRef1.current, 0.3, true);
    } else if (audioRef2.current) {
      // 仅播放阿尔法音乐模式：直接播放2.mp3(音量10%)
      log.info('直接播放2.mp3阿尔法音乐');
      safePlayAudio(audioRef2.current, 0.1, false);
    }
  }, [isPlaying, volume, playMeditationAudio]);
  
  // 获取音频就绪状态文本
  const getReadyStateText = (state) => {
    switch (state) {
      case 0: return 'HAVE_NOTHING';
      case 1: return 'HAVE_METADATA';
      case 2: return 'HAVE_CURRENT_DATA';
      case 3: return 'HAVE_FUTURE_DATA';
      case 4: return 'HAVE_ENOUGH_DATA';
      default: return '未知';
    }
  };


  // 更新音量
  useEffect(() => {
    if (audioRef1.current && isPlaying) {
      audioRef1.current.volume = 0.3 // 冥想音乐始终使用30%音量
    }
    if (audioRef2.current && isPlaying) {
      audioRef2.current.volume = 0.1 // 阿尔法音乐始终使用10%音量
    }
    // 闹钟音量保持用户设置
  }, [volume, isPlaying])

  // 播放闹钟和音量控制
  useEffect(() => {
    // 暴露alarmRef到window对象，以便在弹窗关闭时可以停止闹钟
    window.alarmRef = alarmRef;
    
    // 暴露playAlarm方法给父组件
    window.playAlarm = function() {
        log.info('playAlarm方法被调用', { isAndroid: isAndroid.current });
        
        try {
          // 立即停止其他音频播放（不等待淡出完成）
          if (audioRef1.current) {
            audioRef1.current.pause();
            log.info('冥想音乐(1.mp3)已立即停止');
          }
          if (audioRef2.current) {
            audioRef2.current.pause();
            log.info('阿尔法音乐(2.mp3)已立即停止');
          }
          
          // 在Android上，尝试使用原生闹钟播放
          if (isAndroid.current && window.AlarmAudioBridge) {
            log.info('使用Android原生闹钟播放');
            
            // 尝试获取闹钟音频路径
            let alarmPath = './sounds/3.m4a';
            
            // 调用原生方法播放闹钟
            const result = window.AlarmAudioBridge.playAlarm(alarmPath, true);
            log.info('Android原生闹钟播放结果:', result);
            if (!result) {
              log.warn('Android原生闹钟播放失败，回退到HTML5播放');
              playHTML5Alarm();
            }
          } else {
            // 非Android环境或插件不可用，使用HTML5播放
            log.info('使用HTML5播放闹钟');
            playHTML5Alarm();
          }
        } catch (error) {
          log.error('播放闹钟过程中出错', error);
          // 尝试使用HTML5播放作为后备
          try {
            playHTML5Alarm();
          } catch (fallbackError) {
            log.error('后备HTML5播放也失败', fallbackError);
          }
        }
    };
    
    // HTML5闹钟播放函数
    const playHTML5Alarm = function() {
      // 确保闹钟音频初始化
      if (!alarmRef.current || !alarmRef.current.src) {
        log.warn('闹钟音频未正确初始化，尝试重新加载');
        const paths = isAndroid.current ? 
          ['./sounds/3.m4a', 'sounds/3.m4a'] : 
          ['./sounds/3.m4a'];
        
        let success = false;
        for (const path of paths) {
          try {
            log.info(`尝试闹钟路径: ${path}`);
            alarmRef.current = new Audio(path);
            if (alarmRef.current) {
              success = true;
              break;
            }
          } catch (pathErr) {
            log.error(`闹钟路径 ${path} 加载失败:`, pathErr);
          }
        }
        
        if (!success || !alarmRef.current) {
          log.error('重新创建闹钟音频失败');
          return;
        }
      }
      
      // 重置闹钟音频并设置音量
      try {
        alarmRef.current.currentTime = 0;
        alarmRef.current.volume = 0.8;
        log.info('闹钟音频已重置并设置音量');
      } catch (e) {
        log.error('设置闹钟音频属性失败:', e);
      }
      
      // 简单直接的播放方式，避免复杂的Web Audio API可能带来的问题
      function playAlarmSound() {
        if (isAndroid.current) {
          // Android专用播放逻辑 - 优化版本
          try {
            log.info('Android环境：直接播放闹钟音频');
            
            // 重置音频元素，确保干净的状态
            alarmRef.current.currentTime = 0;
            
            // 在Android上，确保音频上下文是活动的
            if (window.audioContext && window.audioContext.state === 'suspended') {
              window.audioContext.resume().then(() => {
                log.info('Android: 音频上下文已恢复');
              }).catch(err => {
                log.error('Android: 恢复音频上下文失败:', err);
              });
            }
            
            // 尝试使用Promise方式播放，这是现代浏览器推荐的方式
            const playPromise = alarmRef.current.play();
            
            if (playPromise !== undefined) {
              playPromise.then(() => {
                log.info('Android闹钟音频播放成功');
              }).catch(err => {
                log.error('Android闹钟播放失败 (Promise):', err);
                // 降级到传统播放方式
                try {
                  log.info('Android环境：尝试传统播放方式');
                  alarmRef.current.play();
                  log.info('Android传统播放命令已发送');
                } catch (fallbackErr) {
                  log.error('Android传统播放也失败:', fallbackErr);
                }
              });
            } else {
              // 非常旧的浏览器，直接播放
              alarmRef.current.play();
              log.info('Android旧版播放命令已发送');
            }
            
            // 添加延迟检查播放状态
            setTimeout(() => {
              try {
                // 检查是否正在播放
                if (alarmRef.current.paused) {
                  log.warn('Android闹钟音频仍处于暂停状态，尝试强制播放');
                  // 尝试创建新的音频实例播放
                  const newAlarmRef = new Audio('./sounds/3.m4a');
                  newAlarmRef.volume = 0.8;
                  newAlarmRef.play().then(() => {
                    log.info('Android新实例播放成功');
                    // 更新引用
                    alarmRef.current = newAlarmRef;
                  }).catch(err => {
                    log.error('Android新实例播放失败:', err);
                  });
                }
              } catch (e) {
                log.error('检查播放状态失败:', e);
              }
            }, 200);
          } catch (err) {
            log.error('Android闹钟播放失败', err);
            // Android重试逻辑 - 增加重试次数和延迟
            let retryCount = 0;
            const maxRetries = 3;
            const retryInterval = 500;
            
            const retryPlay = () => {
              retryCount++;
              if (retryCount > maxRetries) {
                log.error('Android闹钟播放重试次数用尽');
                return;
              }
              
              try {
                log.debug(`Android第${retryCount}次重试播放闹钟`);
                const newAlarmRef = new Audio('./sounds/3.m4a');
                newAlarmRef.volume = 0.8;
                newAlarmRef.play().then(() => {
                  log.info(`Android第${retryCount}次重试播放成功`);
                  // 更新引用
                  alarmRef.current = newAlarmRef;
                }).catch(err => {
                  log.error(`Android第${retryCount}次重试播放失败:`, err);
                  // 继续重试
                  setTimeout(retryPlay, retryInterval);
                });
              } catch (e) {
                log.error(`Android第${retryCount}次重试播放异常:`, e);
                // 继续重试
                setTimeout(retryPlay, retryInterval);
              }
            };
            
            setTimeout(retryPlay, retryInterval);
          }
        } else {
          // 非Android环境使用Promise方式
          alarmRef.current.play()
            .then(function() {
              log.info('闹钟音频(3.m4a)播放成功');
            })
            .catch(function(err) {
              log.error('闹钟播放失败', err);
              
              // 第一次重试
              setTimeout(function() {
                log.debug('第一次重试播放闹钟');
                try {
                  alarmRef.current.currentTime = 0;
                  alarmRef.current.play().catch(function(err2) {
                    log.error('第一次重试失败', err2);
                    
                    // 第二次重试，使用不同的方法
                    setTimeout(function() {
                      log.debug('第二次重试播放闹钟');
                      try {
                        // 使用新的音频实例
                        const newAlarmRef = new Audio('./sounds/3.m4a');
                        newAlarmRef.volume = 0.8;
                        newAlarmRef.play().catch(function(err3) {
                          log.error('第二次重试也失败', err3);
                        });
                        // 更新引用
                        alarmRef.current = newAlarmRef;
                      } catch (e) {
                        log.error('重试逻辑错误', e);
                      }
                    }, 500);
                  });
                } catch (e) {
                  log.error('重试逻辑错误', e);
                }
              }, 300);
            });
        }
      }
      
      // 立即播放闹钟
      playAlarmSound();
    };
    
    // 暴露setVolumeTo80Percent方法给父组件，用于将媒体声音调回80%
    window.setVolumeTo80Percent = () => {
      // 将媒体声音设为80%
      if (alarmRef.current) {
        alarmRef.current.volume = 0.8;
      }
    };
    
    return () => {
      // 清理
      try {
        delete window.setVolumeTo80Percent;
        log.debug('移除window.setVolumeTo80Percent方法');
        
        // 关闭音频上下文
        if (audioContextRef.current) {
          audioContextRef.current.close().catch(e => log.warn('关闭音频上下文时出错', e));
          log.info('音频上下文已关闭');
        }
      } catch (error) {
        log.error('清理过程中出错', error);
      }
    };
  }, [])

  return null
}

export default AudioPlayer