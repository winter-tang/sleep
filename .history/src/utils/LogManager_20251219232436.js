// 日志管理器
class LogManager {
  constructor() {
    this.logs = [];
    this.maxLogs = 1000; // 最大日志条数
    this.logLevels = {
      DEBUG: 0,
      INFO: 1,
      WARN: 2,
      ERROR: 3
    };
    this.currentLogLevel = this.logLevels.DEBUG; // 当前日志级别
  }

  // 记录日志
  log(level, message, data = null) {
    if (this.logLevels[level] < this.currentLogLevel) {
      return; // 不记录低于当前级别的日志
    }

    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      data
    };

    this.logs.push(logEntry);

    // 限制日志数量
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    // 在控制台输出
    const consoleMethod = level.toLowerCase();
    if (console[consoleMethod]) {
      if (data) {
        console[consoleMethod](`[${timestamp}] ${message}`, data);
      } else {
        console[consoleMethod](`[${timestamp}] ${message}`);
      }
    }

    // 如果是错误级别，触发错误事件
    if (level === 'ERROR') {
      this.notifyError(logEntry);
    }
  }

  // 各级别的日志方法
  debug(message, data) {
    this.log('DEBUG', message, data);
  }

  info(message, data) {
    this.log('INFO', message, data);
  }

  warn(message, data) {
    this.log('WARN', message, data);
  }

  error(message, data) {
    this.log('ERROR', message, data);
  }

  // 获取所有日志
  getLogs() {
    return [...this.logs];
  }

  // 获取错误日志
  getErrorLogs() {
    return this.logs.filter(log => log.level === 'ERROR');
  }

  // 清空日志
  clearLogs() {
    this.logs = [];
  }

  // 设置日志级别
  setLogLevel(level) {
    if (this.logLevels.hasOwnProperty(level)) {
      this.currentLogLevel = this.logLevels[level];
    }
  }

  // 导出日志
  exportLogs() {
    const logsText = this.logs.map(log => {
      return `[${log.timestamp}] [${log.level}] ${log.message}${log.data ? '\n  Data: ' + JSON.stringify(log.data, null, 2) : ''}`;
    }).join('\n\n');

    return logsText;
  }

  // 通知错误
  notifyError(errorLog) {
    // 触发自定义事件
    const event = new CustomEvent('logError', {
      detail: errorLog
    });
    window.dispatchEvent(event);
  }
}

// 创建全局日志管理器实例
window.logManager = new LogManager();

// 兼容现有的Logger
const log = {
  debug: (message, data) => window.logManager.debug(message, data),
  info: (message, data) => window.logManager.info(message, data),
  warn: (message, data) => window.logManager.warn(message, data),
  error: (message, data) => window.logManager.error(message, data)
};

export default log;