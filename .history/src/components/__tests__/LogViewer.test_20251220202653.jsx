import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import LogViewer from '../LogViewer'

// 模拟CSS模块
jest.mock('../LogViewer.css', () => ({}))

// 模拟document方法
Object.defineProperty(document, 'body', {
  value: document.body || document.createElement('body'),
})

// 模拟logManager
const mockLogManager = {
  getLogs: jest.fn(),
  clearLogs: jest.fn(),
  exportLogs: jest.fn()
}

// 模拟URL.createObjectURL
global.URL.createObjectURL = jest.fn(() => 'mock-url')
global.URL.revokeObjectURL = jest.fn()

// 模拟Blob
global.Blob = jest.fn((content, options) => ({
  content,
  options
}))

describe('LogViewer', () => {
  beforeEach(() => {
    window.logManager = mockLogManager
    
    // 重置模拟函数
    jest.clearAllMocks()
    
    // 模拟默认日志数据
    mockLogManager.getLogs.mockReturnValue([
      {
        level: 'INFO',
        message: '测试信息日志',
        timestamp: new Date('2023-01-01T12:00:00').getTime()
      },
      {
        level: 'ERROR',
        message: '测试错误日志',
        timestamp: new Date('2023-01-01T12:01:00').getTime(),
        data: { error: '测试错误详情' }
      }
    ])
  })
  
  afterEach(() => {
    delete window.logManager
  })
  
  it('当isVisible为false时不应该渲染', () => {
    const { container } = render(<LogViewer isVisible={false} onClose={jest.fn()} />)
    expect(container.firstChild).toBeNull()
  })
  
  it('当isVisible为true时应该渲染日志查看器', () => {
    render(<LogViewer isVisible={true} onClose={jest.fn()} />)
    
    expect(screen.getByText('应用日志')).toBeInTheDocument()
    expect(screen.getByText('过滤级别:')).toBeInTheDocument()
    expect(screen.getByText('测试信息日志')).toBeInTheDocument()
    expect(screen.getByText('测试错误日志')).toBeInTheDocument()
  })
  
  it('应该调用onClose当点击关闭按钮时', () => {
    const mockOnClose = jest.fn()
    render(<LogViewer isVisible={true} onClose={mockOnClose} />)
    
    const closeButton = screen.getByText('×')
    fireEvent.click(closeButton)
    
    expect(mockOnClose).toHaveBeenCalled()
  })
  
  it('应该根据过滤器显示日志', async () => {
    render(<LogViewer isVisible={true} onClose={jest.fn()} />)
    
    // 默认显示所有日志
    expect(screen.getByText('测试信息日志')).toBeInTheDocument()
    expect(screen.getByText('测试错误日志')).toBeInTheDocument()
    
    // 过滤只显示错误日志
    const filterSelect = screen.getByDisplayValue('全部')
    fireEvent.change(filterSelect, { target: { value: 'ERROR' } })
    
    await waitFor(() => {
      expect(screen.queryByText('测试信息日志')).not.toBeInTheDocument()
      expect(screen.getByText('测试错误日志')).toBeInTheDocument()
    })
  })
  
  it('应该调用clearLogs当点击清空日志按钮时', () => {
    render(<LogViewer isVisible={true} onClose={jest.fn()} />)
    
    const clearButton = screen.getByText('清空日志')
    fireEvent.click(clearButton)
    
    expect(mockLogManager.clearLogs).toHaveBeenCalled()
  })
  
  it('应该调用exportLogs当点击导出日志按钮时', () => {
    mockLogManager.exportLogs.mockReturnValue('{"logs": []}')
    
    // 模拟创建和点击下载链接
    const mockCreateElement = jest.spyOn(document, 'createElement')
    const mockAppendChild = jest.spyOn(document.body, 'appendChild')
    const mockRemoveChild = jest.spyOn(document.body, 'removeChild')
    
    const mockLink = {
      href: '',
      download: '',
      click: jest.fn()
    }
    mockCreateElement.mockReturnValue(mockLink)
    
    render(<LogViewer isVisible={true} onClose={jest.fn()} />)
    
    const exportButton = screen.getByText('导出日志')
    fireEvent.click(exportButton)
    
    expect(mockLogManager.exportLogs).toHaveBeenCalled()
    expect(global.Blob).toHaveBeenCalledWith(['{"logs": []}'], { type: 'text/plain' })
    expect(global.URL.createObjectURL).toHaveBeenCalled()
    expect(mockAppendChild).toHaveBeenCalledWith(mockLink)
    expect(mockLink.click).toHaveBeenCalled()
    expect(mockRemoveChild).toHaveBeenCalledWith(mockLink)
    expect(global.URL.revokeObjectURL).toHaveBeenCalledWith('mock-url')
    
    // 恢复模拟
    mockCreateElement.mockRestore()
    mockAppendChild.mockRestore()
    mockRemoveChild.mockRestore()
  })
  
  it('应该切换自动滚动', () => {
    render(<LogViewer isVisible={true} onClose={jest.fn()} />)
    
    const autoScrollCheckbox = screen.getByRole('checkbox', { name: /自动滚动/ })
    expect(autoScrollCheckbox).toBeChecked()
    
    fireEvent.click(autoScrollCheckbox)
    expect(autoScrollCheckbox).not.toBeChecked()
  })
  
  it('应该显示没有日志的消息当没有日志时', () => {
    mockLogManager.getLogs.mockReturnValue([])
    
    render(<LogViewer isVisible={true} onClose={jest.fn()} />)
    
    expect(screen.getByText('暂无日志')).toBeInTheDocument()
  })
  
  it('应该正确格式化时间戳', () => {
    render(<LogViewer isVisible={true} onClose={jest.fn()} />)
    
    const timestamps = screen.getAllByText(/^\d{2}:\d{2}:\d{2}/)
    expect(timestamps).toHaveLength(2)
  })
  
  it('应该显示日志数据详情', () => {
    render(<LogViewer isVisible={true} onClose={jest.fn()} />)
    
    const dataSummary = screen.getByText('数据')
    fireEvent.click(dataSummary)
    
    expect(screen.getByText(/{\s*"error":\s*"测试错误详情"\s*}/)).toBeInTheDocument()
  })
  
  it('应该定期刷新日志', async () => {
    jest.useFakeTimers()
    
    render(<LogViewer isVisible={true} onClose={jest.fn()} />)
    
    // 初始加载
    expect(mockLogManager.getLogs).toHaveBeenCalledTimes(1)
    
    // 1秒后刷新
    jest.advanceTimersByTime(1000)
    expect(mockLogManager.getLogs).toHaveBeenCalledTimes(2)
    
    // 2秒后再次刷新
    jest.advanceTimersByTime(1000)
    expect(mockLogManager.getLogs).toHaveBeenCalledTimes(3)
    
    jest.useRealTimers()
  })
  
  it('应该监听logError事件', () => {
    render(<LogViewer isVisible={true} onClose={jest.fn()} />)
    
    // 触发logError事件
    const logErrorEvent = new Event('logError')
    window.dispatchEvent(logErrorEvent)
    
    // 应该重新加载日志
    expect(mockLogManager.getLogs).toHaveBeenCalledTimes(2) // 初始加载 + 事件触发
  })
  
  it('应该在组件卸载时清理事件监听器和定时器', () => {
    jest.useFakeTimers()
    
    const { unmount } = render(<LogViewer isVisible={true} onClose={jest.fn()} />)
    
    // 卸载组件
    unmount()
    
    // 触发logError事件，不应该重新加载日志
    const logErrorEvent = new Event('logError')
    window.dispatchEvent(logErrorEvent)
    
    // 应该只有初始加载
    expect(mockLogManager.getLogs).toHaveBeenCalledTimes(1)
    
    // 定时器不应该继续运行
    jest.advanceTimersByTime(1000)
    expect(mockLogManager.getLogs).toHaveBeenCalledTimes(1)
    
    jest.useRealTimers()
  })
})