import log from '../LogManager'

describe('LogManager', () => {
  let logManager
  
  beforeEach(() => {
    // 重置控制台方法的模拟
    jest.spyOn(console, 'log').mockImplementation(() => {})
    jest.spyOn(console, 'warn').mockImplementation(() => {})
    jest.spyOn(console, 'error').mockImplementation(() => {})
    
    // 使用全局的logManager实例
    logManager = window.logManager
    logManager.clearLogs()
  })
  
  afterEach(() => {
    // 恢复控制台方法
    console.log.mockRestore()
    console.warn.mockRestore()
    console.error.mockRestore()
  })
  
  describe('log', () => {
    it('应该添加info级别的日志', () => {
      const message = '测试信息日志'
      logManager.log(message, 'info')
      
      const logs = logManager.getLogs()
      expect(logs).toHaveLength(1)
      expect(logs[0]).toMatchObject({
        level: 'INFO',
        message,
        timestamp: expect.any(String)
      })
    })
    
    it('应该添加warn级别的日志', () => {
      const message = '测试警告日志'
      logManager.log(message, 'warn')
      
      const logs = logManager.getLogs()
      expect(logs).toHaveLength(1)
      expect(logs[0]).toMatchObject({
        level: 'WARN',
        message,
        timestamp: expect.any(String)
      })
    })
    
    it('应该添加debug级别的日志', () => {
      const message = '测试调试日志'
      logManager.log(message, 'debug')
      
      const logs = logManager.getLogs()
      expect(logs).toHaveLength(1)
      expect(logs[0]).toMatchObject({
        level: 'DEBUG',
        message,
        timestamp: expect.any(String)
      })
    })
  })
  
  describe('便捷方法', () => {
    it('info方法应该添加info级别的日志', () => {
      const message = '测试info方法'
      logManager.info(message)
      
      const logs = logManager.getLogs()
      expect(logs).toHaveLength(1)
      expect(logs[0].level).toBe('INFO')
      expect(logs[0].message).toBe(message)
    })
    
    it('warn方法应该添加warn级别的日志', () => {
      const message = '测试warn方法'
      logManager.warn(message)
      
      const logs = logManager.getLogs()
      expect(logs).toHaveLength(1)
      expect(logs[0].level).toBe('WARN')
      expect(logs[0].message).toBe(message)
    })
    
    it('debug方法应该添加debug级别的日志', () => {
      const message = '测试debug方法'
      logManager.debug(message)
      
      const logs = logManager.getLogs()
      expect(logs).toHaveLength(1)
      expect(logs[0].level).toBe('DEBUG')
      expect(logs[0].message).toBe(message)
    })
  })
  
  describe('getLogs', () => {
    it('应该返回所有日志', () => {
      logManager.info('信息1')
      logManager.warn('警告1')
      logManager.error('错误1')
      
      const logs = logManager.getLogs()
      expect(logs).toHaveLength(3)
      expect(logs[0].level).toBe('INFO')
      expect(logs[1].level).toBe('WARN')
      expect(logs[2].level).toBe('ERROR')
    })
    
    it('应该按级别过滤日志', () => {
      logManager.info('信息1')
      logManager.warn('警告1')
      logManager.error('错误1')
      logManager.debug('调试1')
      
      const errorLogs = logManager.getLogs('error')
      expect(errorLogs).toHaveLength(1)
      expect(errorLogs[0].level).toBe('ERROR')
      
      const infoLogs = logManager.getLogs('info')
      expect(infoLogs).toHaveLength(1)
      expect(infoLogs[0].level).toBe('INFO')
    })
    
    it('应该按多个级别过滤日志', () => {
      logManager.info('信息1')
      logManager.warn('警告1')
      logManager.error('错误1')
      logManager.debug('调试1')
      
      const logs = logManager.getLogs(['info', 'error'])
      expect(logs).toHaveLength(2)
      expect(logs[0].level).toBe('INFO')
      expect(logs[1].level).toBe('ERROR')
    })
  })
  
  describe('clearLogs', () => {
    it('应该清除所有日志', () => {
      logManager.info('信息1')
      logManager.warn('警告1')
      
      expect(logManager.getLogs()).toHaveLength(2)
      
      logManager.clearLogs()
      expect(logManager.getLogs()).toHaveLength(0)
    })
    
    it('应该清除指定级别的日志', () => {
      logManager.info('信息1')
      logManager.warn('警告1')
      logManager.error('错误1')
      
      logManager.clearLogs('warn')
      const logs = logManager.getLogs()
      expect(logs).toHaveLength(2)
      expect(logs[0].level).toBe('info')
      expect(logs[1].level).toBe('error')
    })
    
    it('应该清除多个级别的日志', () => {
      logManager.info('信息1')
      logManager.warn('警告1')
      logManager.error('错误1')
      logManager.debug('调试1')
      
      logManager.clearLogs(['info', 'error'])
      const logs = logManager.getLogs()
      expect(logs).toHaveLength(2)
      expect(logs[0].level).toBe('warn')
      expect(logs[1].level).toBe('debug')
    })
  })
  
  describe('exportLogs', () => {
    it('应该导出所有日志为JSON字符串', () => {
      logManager.info('信息1')
      logManager.warn('警告1')
      logManager.error('错误1')
      
      const exported = logManager.exportLogs()
      const parsedLogs = JSON.parse(exported)
      
      expect(parsedLogs).toHaveLength(3)
      expect(parsedLogs[0].level).toBe('info')
      expect(parsedLogs[1].level).toBe('warn')
      expect(parsedLogs[2].level).toBe('error')
    })
    
    it('应该导出指定级别的日志', () => {
      logManager.info('信息1')
      logManager.warn('警告1')
      logManager.error('错误1')
      
      const exported = logManager.exportLogs('error')
      const parsedLogs = JSON.parse(exported)
      
      expect(parsedLogs).toHaveLength(1)
      expect(parsedLogs[0].level).toBe('error')
    })
  })
  
  describe('控制台输出', () => {
    it('info日志应该输出到console.log', () => {
      const message = '测试信息'
      logManager.info(message)
      
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('[INFO]'),
        expect.stringContaining(message)
      )
    })
    
    it('warn日志应该输出到console.warn', () => {
      const message = '测试警告'
      logManager.warn(message)
      
      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining('[WARN]'),
        expect.stringContaining(message)
      )
    })
    
    it('error日志应该输出到console.error', () => {
      const message = '测试错误'
      logManager.error(message)
      
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('[ERROR]'),
        expect.stringContaining(message)
      )
    })
    
    it('debug日志应该输出到console.log', () => {
      const message = '测试调试'
      logManager.debug(message)
      
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('[DEBUG]'),
        expect.stringContaining(message)
      )
    })
  })
})