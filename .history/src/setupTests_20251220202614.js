import '@testing-library/jest-dom'

// Mock window.logManager
global.logManager = {
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
  getLogs: jest.fn(() => []),
  clearLogs: jest.fn(),
  exportLogs: jest.fn(() => '')
}

// Mock Audio constructor
global.Audio = jest.fn().mockImplementation((src) => {
  return {
    src,
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

// Mock Android bridge
global.AlarmAudioBridge = {
  playAlarm: jest.fn().mockReturnValue(true),
  stopAlarm: jest.fn().mockReturnValue(true),
  isPlaying: jest.fn().mockReturnValue(false),
  getAppVersion: jest.fn().mockReturnValue('1.0.0'),
  hasPermissions: jest.fn().mockReturnValue(true)
}

// Mock document methods for React 19
Object.defineProperty(document, 'body', {
  value: document.body || document.createElement('body'),
})