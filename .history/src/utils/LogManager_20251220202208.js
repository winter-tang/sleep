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
    // 支持两种参数顺序: log(level, message) 或 log(message, level)
    if (typeof level === 'string' && typeof message === 'string') {
      // 检查哪个是日志级别
      if (this.logLevels.hasOwnProperty(level.toUpperCase())) {
        // 标准顺序: log(level, message)
        level = level.toUpperCase();
      } else if (this.logLevels.hasOwnProperty(message.toUpperCase())) {
        // 反向顺序: log(message, level)
        const temp = level;
        level = message.toUpperCase();
        message = temp;
      }
    } else {
      // 默认为INFO级别
      level = 'INFO';
    }

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
        console[consoleMethod](`[${level}] ${message}`, data);
      } else {
        console[consoleMethod](`[${level}] ${message}`);
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

  // 获取日志
  getLogs(filter = null) {
    if (!filter) {
      return [...this.logs];
    }
    
    // 支持按级别过滤
    if (typeof filter === 'string') {
      return this.logs.filter(log => log.level === filter.toUpperCase());
    }
    
    // 支持按多个级别过滤
    if (Array.isArray(filter)) {
      const upperCaseFilters = filter.map(f => f.toUpperCase());
      return this.logs.filter(log => upperCaseFilters.includes(log.level));
    }
    
    return [...this.logs];
  }

  // 获取错误日志
  getErrorLogs() {
    return this.logs.filter(log => log.level === 'ERROR');
  }

  // 清空日志
  clearLogs(filter = null) {
    if (!filter) {
      this.logs = [];
      return;
    }
    
    // 支持按级别清除
    if (typeof filter === 'string') {
      this.logs = this.logs.filter(log => log.level !== filter.toUpperCase());
      return;
    }
    
    // 支持按多个级别清除
    if (Array.isArray(filter)) {
      const upperCaseFilters = filter.map(f => f.toUpperCase());
      this.logs = this.logs.filter(log => !upperCaseFilters.includes(log.level));
      return;
    }
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