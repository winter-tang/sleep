import React from 'react'
import { render, act } from '@testing-library/react'
import AudioPlayer from '../AudioPlayer'

// 模拟navigator.userAgent
Object.defineProperty(window, 'navigator', {
  value: {
    userAgent: '',
  },
  writable: true,
})

describe('AudioPlayer', () => {
  let mockAudio1, mockAudio2, mockAlarm
  
  beforeEach(() => {
    // 重置Audio构造函数的模拟
    mockAudio1 = {
      volume: 1,
      loop: false,
      currentTime: 0,
      paused: true,
      play: jest.fn().mockResolvedValue(),
      pause: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn()
    }
    
    mockAudio2 = {
      volume: 1,
      loop: false,
      currentTime: 0,
      paused: true,
      play: jest.fn().mockResolvedValue(),
      pause: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn()
    }
    
    mockAlarm = {
      volume: 1,
      loop: false,
      currentTime: 0,
      paused: true,
      play: jest.fn().mockResolvedValue(),
      pause: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn()
    }
    
    // 模拟Audio构造函数，按顺序返回不同的模拟对象
    let audioCallCount = 0
    global.Audio = jest.fn().mockImplementation(() => {
      audioCallCount++
      if (audioCallCount === 1) return mockAudio1
      if (audioCallCount === 2) return mockAudio2
      if (audioCallCount === 3) return mockAlarm
      return {
        volume: 1,
        loop: false,
        currentTime: 0,
        paused: true,
        play: jest.fn().mockResolvedValue(),
        pause: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn()
      }
    })
    
    // 重置window对象上的方法
    window.playAlarm = jest.fn()
    window.stopAlarm = jest.fn()
  })
  
  afterEach(() => {
    jest.clearAllMocks()
  })
  
  it('应该初始化音频播放器', () => {
    render(<AudioPlayer />)
    
    expect(global.Audio).toHaveBeenCalledTimes(3)
    expect(mockAudio1.volume).toBe(0.09) // 0.3 * 0.3
    expect(mockAudio2.volume).toBe(0.03) // 0.3 * 0.1
    expect(mockAudio2.loop).toBe(true)
    expect(mockAlarm.volume).toBe(0.5)
  })
  
  it('应该在Android环境中使用相对路径', () => {
    // 设置Android用户代理
    Object.defineProperty(window, 'navigator', {
      value: {
        userAgent: 'android',
      },
      writable: true,
    })
    
    render(<AudioPlayer />)
    
    expect(global.Audio).toHaveBeenCalledWith('./sounds/1.mp3')
    expect(global.Audio).toHaveBeenCalledWith('./sounds/2.mp3')
    expect(global.Audio).toHaveBeenCalledWith('./sounds/3.mp3')
  })
  
  it('应该在非Android环境中使用绝对路径', () => {
    // 设置非Android用户代理
    Object.defineProperty(window, 'navigator', {
      value: {
        userAgent: 'iphone',
      },
      writable: true,
    })
    
    render(<AudioPlayer />)
    
    expect(global.Audio).toHaveBeenCalledWith('/sounds/1.mp3')
    expect(global.Audio).toHaveBeenCalledWith('/sounds/2.mp3')
    expect(global.Audio).toHaveBeenCalledWith('/sounds/3.mp3')
  })
  
  it('应该在isPlaying为true时播放音频', () => {
    const { rerender } = render(<AudioPlayer isPlaying={false} />)
    
    // 初始状态不应该播放
    expect(mockAudio1.play).not.toHaveBeenCalled()
    
    // 更新为播放状态
    rerender(<AudioPlayer isPlaying={true} />)
    
    expect(mockAudio1.play).toHaveBeenCalled()
  })
  
  it('应该在isPlaying为false时暂停音频', () => {
    const { rerender } = render(<AudioPlayer isPlaying={true} />)
    
    // 播放状态
    expect(mockAudio1.play).toHaveBeenCalled()
    
    // 更新为暂停状态
    rerender(<AudioPlayer isPlaying={false} />)
    
    expect(mockAudio1.pause).toHaveBeenCalled()
    expect(mockAudio2.pause).toHaveBeenCalled()
  })
  
  it('应该更新音量', () => {
    const { rerender } = render(<AudioPlayer volume={0.5} />)
    
    expect(mockAudio1.volume).toBe(0.5 * 0.3) // 30%音量
    expect(mockAudio2.volume).toBe(0.5 * 0.1) // 10%音量
    
    // 更新音量
    rerender(<AudioPlayer volume={0.8} />)
    
    expect(mockAudio1.volume).toBe(0.8 * 0.3)
    expect(mockAudio2.volume).toBe(0.8 * 0.1)
  })
  
  it('应该在Android环境中使用原生接口播放闹钟', () => {
    // 设置Android环境
    Object.defineProperty(window, 'navigator', {
      value: {
        userAgent: 'android',
      },
      writable: true,
    })
    
    // 设置Android桥接
    global.AlarmAudioBridge = {
      playAlarm: jest.fn().mockReturnValue(true),
      stopAlarm: jest.fn().mockReturnValue(true)
    }
    
    render(<AudioPlayer />)
    
    // 调用闹钟播放方法
    act(() => {
      window.playAlarm()
    })
    
    expect(global.AlarmAudioBridge.playAlarm).toHaveBeenCalledWith('./sounds/3.mp3', true)
    expect(mockAlarm.play).not.toHaveBeenCalled()
  })
  
  it('应该在非Android环境中使用Web Audio API播放闹钟', () => {
    // 设置非Android环境
    Object.defineProperty(window, 'navigator', {
      value: {
        userAgent: 'iphone',
      },
      writable: true,
    })
    
    render(<AudioPlayer />)
    
    // 调用闹钟播放方法
    act(() => {
      window.playAlarm()
    })
    
    expect(mockAlarm.play).toHaveBeenCalled()
  })
  
  it('应该在Android环境中使用原生接口停止闹钟', () => {
    // 设置Android环境
    Object.defineProperty(window, 'navigator', {
      value: {
        userAgent: 'android',
      },
      writable: true,
    })
    
    // 设置Android桥接
    global.AlarmAudioBridge = {
      playAlarm: jest.fn().mockReturnValue(true),
      stopAlarm: jest.fn().mockReturnValue(true)
    }
    
    render(<AudioPlayer />)
    
    // 调用停止闹钟方法
    act(() => {
      window.stopAlarm()
    })
    
    expect(global.AlarmAudioBridge.stopAlarm).toHaveBeenCalled()
  })
  
  it('应该在非Android环境中使用Web Audio API停止闹钟', () => {
    // 设置非Android环境
    Object.defineProperty(window, 'navigator', {
      value: {
        userAgent: 'iphone',
      },
      writable: true,
    })
    
    render(<AudioPlayer />)
    
    // 调用停止闹钟方法
    act(() => {
      window.stopAlarm()
    })
    
    expect(mockAlarm.pause).toHaveBeenCalled()
    expect(mockAlarm.currentTime).toBe(0)
  })
  
  it('应该添加错误事件监听器', () => {
    render(<AudioPlayer />)
    
    expect(mockAudio1.addEventListener).toHaveBeenCalledWith('error', expect.any(Function))
    expect(mockAudio2.addEventListener).toHaveBeenCalledWith('error', expect.any(Function))
    expect(mockAlarm.addEventListener).toHaveBeenCalledWith('error', expect.any(Function))
  })
  
  it('应该添加ended事件监听器', () => {
    render(<AudioPlayer />)
    
    expect(mockAudio1.addEventListener).toHaveBeenCalledWith('ended', expect.any(Function))
  })
  
  it('应该在1.mp3播放结束后播放2.mp3', () => {
    render(<AudioPlayer />)
    
    // 获取ended事件的回调函数
    const endedCallback = mockAudio1.addEventListener.mock.calls.find(
      call => call[0] === 'ended'
    )[1]
    
    // 模拟1.mp3播放结束
    act(() => {
      endedCallback()
    })
    
    expect(mockAudio2.currentTime).toBe(0)
    expect(mockAudio2.play).toHaveBeenCalled()
  })
  
  it('应该正确清理资源', () => {
    const { unmount } = render(<AudioPlayer />)
    
    // 卸载组件
    unmount()
    
    expect(mockAudio1.pause).toHaveBeenCalled()
    expect(mockAudio2.pause).toHaveBeenCalled()
    expect(mockAlarm.pause).toHaveBeenCalled()
  })
})