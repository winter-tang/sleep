import React, { useState, useEffect } from 'react';
import './LogViewer.css';

const LogViewer = ({ isVisible, onClose }) => {
  const [logs, setLogs] = useState([]);
  const [filter, setFilter] = useState('ALL'); // ALL, DEBUG, INFO, WARN, ERROR
  const [autoScroll, setAutoScroll] = useState(true);
  const logContainerRef = React.useRef(null);

  // 加载日志
  useEffect(() => {
    if (isVisible) {
      loadLogs();
      
      // 监听错误事件
      window.addEventListener('logError', handleLogError);
      
      // 定期刷新日志
      const interval = setInterval(loadLogs, 1000);
      
      return () => {
        window.removeEventListener('logError', handleLogError);
        clearInterval(interval);
      };
    }
  }, [isVisible, filter]);

  // 自动滚动到底部
  useEffect(() => {
    if (autoScroll && logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs, autoScroll]);

  // 加载日志
  const loadLogs = () => {
    if (window.logManager) {
      let filteredLogs = window.logManager.getLogs();
      
      // 应用过滤器
      if (filter !== 'ALL') {
        filteredLogs = filteredLogs.filter(log => log.level === filter);
      }
      
      setLogs(filteredLogs);
    }
  };

  // 处理新错误日志
  const handleLogError = (event) => {
    loadLogs();
  };

  // 清空日志
  const clearLogs = () => {
    if (window.logManager) {
      window.logManager.clearLogs();
      setLogs([]);
    }
  };

  // 导出日志
  const exportLogs = () => {
    if (window.logManager) {
      const logsText = window.logManager.exportLogs();
      const blob = new Blob([logsText], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `app-logs-${new Date().toISOString().replace(/[:.]/g, '-')}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  // 获取日志级别样式
  const getLogLevelStyle = (level) => {
    switch (level) {
      case 'DEBUG': return 'log-debug';
      case 'INFO': return 'log-info';
      case 'WARN': return 'log-warn';
      case 'ERROR': return 'log-error';
      default: return '';
    }
  };

  // 格式化时间戳
  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString();
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div className="log-viewer-overlay">
      <div className="log-viewer-container">
        <div className="log-viewer-header">
          <h3>应用日志</h3>
          <button className="close-button" onClick={onClose}>×</button>
        </div>
        
        <div className="log-viewer-controls">
          <div className="filter-controls">
            <label>过滤级别:</label>
            <select value={filter} onChange={(e) => setFilter(e.target.value)}>
              <option value="ALL">全部</option>
              <option value="DEBUG">调试</option>
              <option value="INFO">信息</option>
              <option value="WARN">警告</option>
              <option value="ERROR">错误</option>
            </select>
          </div>
          
          <div className="action-controls">
            <label>
              <input 
                type="checkbox" 
                checked={autoScroll} 
                onChange={(e) => setAutoScroll(e.target.checked)} 
              />
              自动滚动
            </label>
            <button onClick={clearLogs}>清空日志</button>
            <button onClick={exportLogs}>导出日志</button>
          </div>
        </div>
        
        <div className="log-container" ref={logContainerRef}>
          {logs.length === 0 ? (
            <div className="no-logs">暂无日志</div>
          ) : (
            logs.map((log, index) => (
              <div key={index} className={`log-entry ${getLogLevelStyle(log.level)}`}>
                <span className="log-timestamp">{formatTimestamp(log.timestamp)}</span>
                <span className="log-level">[{log.level}]</span>
                <span className="log-message">{log.message}</span>
                {log.data && (
                  <details className="log-data">
                    <summary>数据</summary>
                    <pre>{JSON.stringify(log.data, null, 2)}</pre>
                  </details>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default LogViewer;