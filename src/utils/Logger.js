// 日志服务工具类
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';

class Logger {
  constructor() {
    this.logs = [];
    this.maxLogs = 500; // 限制最大日志数量，防止内存占用过高
    this.logFile = 'app_logs.txt'; // 日志文件名
    this.logDirectory = Directory.Documents; // 日志文件保存目录
    this.maxFileSize = 1024 * 1024; // 最大日志文件大小（1MB）
    this.writeInterval = 5000; // 日志写入间隔（5秒）
    this.writeTimer = null; // 写入定时器
    
    // 初始化日志写入定时器
    this.initWriteTimer();
    
    // 应用启动时创建日志文件
    this.createLogFile();
  }
  
  // 生成带时间戳的格式化日志
  _formatLog(level, message, data = null) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      data
    };
    
    // 添加到日志数组
    this.logs.push(logEntry);
    
    // 限制日志数量
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }
    
    return logEntry;
  }
  
  // 记录信息日志
  info(message, data = null) {
    const log = this._formatLog('INFO', message, data);
    console.log(`[${log.timestamp}] INFO: ${log.message}`, data ? data : '');
    return log;
  }
  
  // 记录警告日志
  warn(message, data = null) {
    const log = this._formatLog('WARN', message, data);
    console.warn(`[${log.timestamp}] WARN: ${log.message}`, data ? data : '');
    return log;
  }
  
  // 记录错误日志
  error(message, error = null, data = null) {
    const logData = error ? { error: error.message, stack: error.stack, ...data } : data;
    const log = this._formatLog('ERROR', message, logData);
    console.error(`[${log.timestamp}] ERROR: ${log.message}`, logData ? logData : '');
    return log;
  }
  
  // 记录调试日志
  debug(message, data = null) {
    const log = this._formatLog('DEBUG', message, data);
    console.debug(`[${log.timestamp}] DEBUG: ${log.message}`, data ? data : '');
    return log;
  }
  
  // 获取所有日志
  getLogs() {
    return [...this.logs];
  }
  
  // 获取特定级别的日志
  getLogsByLevel(level) {
    return this.logs.filter(log => log.level === level);
  }
  
  // 清空日志
  clearLogs() {
    this.logs = [];
    this.info('日志已清空');
    // 清空日志文件
    this.writeLogsToFile(true);
  }
  
  // 导出日志为JSON字符串
  exportLogs() {
    return JSON.stringify(this.logs, null, 2);
  }
  
  // 导出日志为CSV格式
  exportLogsAsCSV() {
    const headers = ['timestamp', 'level', 'message', 'data'];
    const csvRows = [headers.join(',')];
    
    this.logs.forEach(log => {
      const row = [
        log.timestamp,
        log.level,
        `"${log.message}"`, // 用引号包裹可能包含逗号的消息
        JSON.stringify(log.data || '')
      ];
      csvRows.push(row.join(','));
    });
    
    return csvRows.join('\n');
  }
  
  // 初始化日志写入定时器
  initWriteTimer() {
    // 清除现有定时器
    if (this.writeTimer) {
      clearInterval(this.writeTimer);
    }
    
    // 设置新的定时器，定期写入日志到文件
    this.writeTimer = setInterval(() => {
      this.writeLogsToFile();
    }, this.writeInterval);
  }
  
  // 创建日志文件
  async createLogFile() {
    try {
      // 检查文件是否存在
      const fileInfo = await Filesystem.stat({
        path: this.logFile,
        directory: this.logDirectory
      });
      this.info(`日志文件已存在: ${this.logFile}, 大小: ${fileInfo.size} bytes`);
    } catch (error) {
      // 文件不存在，创建新文件
      await Filesystem.writeFile({
        path: this.logFile,
        directory: this.logDirectory,
        encoding: Encoding.UTF8,
        data: `日志文件创建于: ${new Date().toISOString()}\n\n`
      });
      this.info(`已创建日志文件: ${this.logFile}`);
    }
  }
  
  // 将日志写入文件
  async writeLogsToFile(clearFile = false) {
    try {
      if (clearFile) {
        // 清空文件
        await Filesystem.writeFile({
          path: this.logFile,
          directory: this.logDirectory,
          encoding: Encoding.UTF8,
          data: `日志已清空于: ${new Date().toISOString()}\n\n`
        });
        return;
      }
      
      if (this.logs.length === 0) {
        return; // 没有日志需要写入
      }
      
      // 检查文件大小，超过限制则轮转
      await this.checkFileSize();
      
      // 格式化日志内容
      const logContent = this.logs.map(log => {
        return `[${log.timestamp}] ${log.level}: ${log.message} ${JSON.stringify(log.data || '')}`;
      }).join('\n');
      
      // 追加写入日志到文件
      await Filesystem.appendFile({
        path: this.logFile,
        directory: this.logDirectory,
        encoding: Encoding.UTF8,
        data: logContent + '\n'
      });
      
      // 清空已写入的日志
      this.logs = [];
    } catch (error) {
      console.error('写入日志到文件失败:', error);
    }
  }
  
  // 检查日志文件大小
  async checkFileSize() {
    try {
      const fileInfo = await Filesystem.stat({
        path: this.logFile,
        directory: this.logDirectory
      });
      
      if (fileInfo.size > this.maxFileSize) {
        await this.rotateLogFile();
      }
    } catch (error) {
      console.error('检查日志文件大小失败:', error);
    }
  }
  
  // 日志文件轮转
  async rotateLogFile() {
    try {
      // 生成新的日志文件名
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const rotatedFile = `app_logs_${timestamp}.txt`;
      
      // 重命名当前日志文件
      await Filesystem.rename({
        from: this.logFile,
        to: rotatedFile,
        directory: this.logDirectory
      });
      
      // 创建新的日志文件
      await this.createLogFile();
      
      this.info(`日志文件已轮转: ${rotatedFile}`);
    } catch (error) {
      console.error('日志文件轮转失败:', error);
    }
  }
  
  // 手动导出日志到文件
  async exportLogsToFile() {
    try {
      // 确保所有日志都已写入文件
      await this.writeLogsToFile();
      
      // 获取日志文件信息
      const fileInfo = await Filesystem.stat({
        path: this.logFile,
        directory: this.logDirectory
      });
      
      this.info(`日志已导出到文件: ${this.logFile}, 大小: ${fileInfo.size} bytes`);
      
      return {
        fileName: this.logFile,
        fileSize: fileInfo.size,
        filePath: `${this.logDirectory}/${this.logFile}`
      };
    } catch (error) {
      console.error('导出日志到文件失败:', error);
      return null;
    }
  }
  
  // 获取日志文件路径
  getLogFilePath() {
    return `${this.logDirectory}/${this.logFile}`;
  }
  
  // 停止日志写入定时器
  stopWriteTimer() {
    if (this.writeTimer) {
      clearInterval(this.writeTimer);
      this.writeTimer = null;
    }
  }
}

// 创建单例实例
const logger = new Logger();

// 暴露logger实例
export default logger;

// 提供便捷的导出方法
export const log = {
  info: (message, data) => logger.info(message, data),
  warn: (message, data) => logger.warn(message, data),
  error: (message, error, data) => logger.error(message, error, data),
  debug: (message, data) => logger.debug(message, data),
  getLogs: () => logger.getLogs(),
  clearLogs: () => logger.clearLogs(),
  exportLogs: () => logger.exportLogs(),
  exportLogsAsCSV: () => logger.exportLogsAsCSV(),
  exportLogsToFile: () => logger.exportLogsToFile(),
  getLogFilePath: () => logger.getLogFilePath(),
  writeLogsToFile: () => logger.writeLogsToFile()
};
