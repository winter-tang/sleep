/**
 * 数据库管理器
 * 使用IndexedDB实现本地数据存储，支持播放记录和应用状态的持久化
 * 定期清理无效数据，保留2年的完成记录
 */

const DB_NAME = 'SleepMeditationDB';
const DB_VERSION = 1;
const STORES = {
  PLAYBACK_RECORDS: 'playbackRecords',
  APP_STATE: 'appState',
  TIMER_SESSIONS: 'timerSessions'
};

const TWO_YEARS_IN_MS = 2 * 365 * 24 * 60 * 60 * 1000;
const CLEANUP_INTERVAL = 24 * 60 * 60 * 1000; // 24小时

let db = null;
let cleanupTimer = null;

/**
 * 初始化数据库
 */
export const initDatabase = () => {
  return new Promise((resolve, reject) => {
    if (db) {
      resolve(db);
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      console.error('数据库初始化失败:', request.error);
      reject(request.error);
    };

    request.onsuccess = () => {
      db = request.result;
      console.log('数据库初始化成功');
      startCleanupTimer();
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const targetDB = event.target.result;

      // 创建播放记录表
      if (!targetDB.objectStoreNames.contains(STORES.PLAYBACK_RECORDS)) {
        const playbackStore = targetDB.createObjectStore(STORES.PLAYBACK_RECORDS, {
          keyPath: 'id',
          autoIncrement: true
        });
        playbackStore.createIndex('timestamp', 'timestamp');
        playbackStore.createIndex('status', 'status');
      }

      // 创建应用状态表
      if (!targetDB.objectStoreNames.contains(STORES.APP_STATE)) {
        targetDB.createObjectStore(STORES.APP_STATE, {
          keyPath: 'key'
        });
      }

      // 创建定时器会话表
      if (!targetDB.objectStoreNames.contains(STORES.TIMER_SESSIONS)) {
        const sessionStore = targetDB.createObjectStore(STORES.TIMER_SESSIONS, {
          keyPath: 'id',
          autoIncrement: true
        });
        sessionStore.createIndex('startTime', 'startTime');
        sessionStore.createIndex('status', 'status');
      }

      console.log('数据库结构更新完成');
    };
  });
};

/**
 * 获取数据库实例
 */
const getDB = async () => {
  if (!db) {
    await initDatabase();
  }
  return db;
};

/**
 * 开始定期清理定时器
 */
const startCleanupTimer = () => {
  if (cleanupTimer) {
    clearInterval(cleanupTimer);
  }

  cleanupTimer = setInterval(async () => {
    try {
      await cleanupOldData();
      console.log('定期清理完成');
    } catch (error) {
      console.error('定期清理失败:', error);
    }
  }, CLEANUP_INTERVAL);

  // 立即执行一次清理
  cleanupOldData().catch(error => {
    console.error('初始清理失败:', error);
  });
};

/**
 * 清理旧数据
 */
export const cleanupOldData = async () => {
  const database = await getDB();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORES.PLAYBACK_RECORDS, STORES.TIMER_SESSIONS], 'readwrite');
    const playbackStore = transaction.objectStore(STORES.PLAYBACK_RECORDS);
    const sessionStore = transaction.objectStore(STORES.TIMER_SESSIONS);

    const twoYearsAgo = Date.now() - TWO_YEARS_IN_MS;

    // 清理2年前的播放记录
    const playbackIndex = playbackStore.index('timestamp');
    const playbackRequest = playbackIndex.openCursor();

    playbackRequest.onsuccess = () => {
      const cursor = playbackRequest.result;
      if (cursor) {
        const record = cursor.value;
        const recordTime = new Date(record.timestamp).getTime();

        // 只保留完成状态且不超过2年的记录
        if ((record.status !== 'completed' || recordTime < twoYearsAgo)) {
          cursor.delete();
        }
        cursor.continue();
      }
    };

    // 清理无效的定时器会话
    const sessionIndex = sessionStore.index('startTime');
    const sessionRequest = sessionIndex.openCursor();

    sessionRequest.onsuccess = () => {
      const cursor = sessionRequest.result;
      if (cursor) {
        const session = cursor.value;
        const sessionTime = new Date(session.startTime).getTime();

        // 清理2年前的会话或已完成的会话
        if (sessionTime < twoYearsAgo || session.status === 'completed') {
          cursor.delete();
        }
        cursor.continue();
      }
    };

    transaction.oncomplete = () => {
      resolve();
    };

    transaction.onerror = () => {
      reject(transaction.error);
    };
  });
};

/**
 * 保存播放记录
 */
export const savePlaybackRecord = async (durationMinutes, status = 'completed') => {
  const database = await getDB();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORES.PLAYBACK_RECORDS], 'readwrite');
    const store = transaction.objectStore(STORES.PLAYBACK_RECORDS);

    const record = {
      timestamp: new Date().toISOString(),
      duration: durationMinutes,
      status,
      date: new Date().toLocaleDateString(),
      time: new Date().toLocaleTimeString()
    };

    const request = store.add(record);

    request.onsuccess = () => {
      console.log('播放记录保存成功:', request.result);
      resolve(request.result);
    };

    request.onerror = () => {
      console.error('播放记录保存失败:', request.error);
      reject(request.error);
    };
  });
};

/**
 * 获取播放记录
 */
export const getPlaybackHistory = async (limit = 100) => {
  const database = await getDB();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORES.PLAYBACK_RECORDS], 'readonly');
    const store = transaction.objectStore(STORES.PLAYBACK_RECORDS);
    const index = store.index('timestamp');

    const records = [];
    const request = index.openCursor(null, 'prev'); // 降序排列

    request.onsuccess = () => {
      const cursor = request.result;
      if (cursor && records.length < limit) {
        records.push(cursor.value);
        cursor.continue();
      } else {
        resolve(records);
      }
    };

    request.onerror = () => {
      console.error('获取播放记录失败:', request.error);
      reject(request.error);
    };
  });
};

/**
 * 获取总播放次数
 */
export const getTotalPlays = async () => {
  const database = await getDB();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORES.PLAYBACK_RECORDS], 'readonly');
    const store = transaction.objectStore(STORES.PLAYBACK_RECORDS);
    const index = store.index('status');

    let count = 0;
    const request = index.openCursor('completed');

    request.onsuccess = () => {
      const cursor = request.result;
      if (cursor) {
        count++;
        cursor.continue();
      } else {
        resolve(count);
      }
    };

    request.onerror = () => {
      console.error('获取总播放次数失败:', request.error);
      reject(request.error);
    };
  });
};

/**
 * 保存定时器会话
 */
export const saveTimerSession = async (durationMinutes, status = 'active') => {
  const database = await getDB();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORES.TIMER_SESSIONS], 'readwrite');
    const store = transaction.objectStore(STORES.TIMER_SESSIONS);

    const session = {
      startTime: new Date().toISOString(),
      duration: durationMinutes,
      status,
      remainingTime: durationMinutes * 60
    };

    const request = store.add(session);

    request.onsuccess = () => {
      console.log('定时器会话保存成功:', request.result);
      resolve(request.result);
    };

    request.onerror = () => {
      console.error('定时器会话保存失败:', request.error);
      reject(request.error);
    };
  });
};

/**
 * 更新定时器会话
 */
export const updateTimerSession = async (sessionId, updates) => {
  const database = await getDB();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORES.TIMER_SESSIONS], 'readwrite');
    const store = transaction.objectStore(STORES.TIMER_SESSIONS);

    const request = store.get(sessionId);

    request.onsuccess = () => {
      const session = request.result;
      if (session) {
        const updatedSession = { ...session, ...updates };
        const updateRequest = store.put(updatedSession);

        updateRequest.onsuccess = () => {
          console.log('定时器会话更新成功:', sessionId);
          resolve(updatedSession);
        };

        updateRequest.onerror = () => {
          console.error('定时器会话更新失败:', updateRequest.error);
          reject(updateRequest.error);
        };
      } else {
        reject(new Error('会话不存在'));
      }
    };

    request.onerror = () => {
      console.error('获取会话失败:', request.error);
      reject(request.error);
    };
  });
};

/**
 * 获取活跃的定时器会话
 */
export const getActiveTimerSession = async () => {
  const database = await getDB();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORES.TIMER_SESSIONS], 'readonly');
    const store = transaction.objectStore(STORES.TIMER_SESSIONS);
    const index = store.index('status');

    const request = index.openCursor('active');

    request.onsuccess = () => {
      const cursor = request.result;
      if (cursor) {
        resolve(cursor.value);
      } else {
        resolve(null);
      }
    };

    request.onerror = () => {
      console.error('获取活跃会话失败:', request.error);
      reject(request.error);
    };
  });
};

/**
 * 保存应用状态
 */
export const saveAppState = async (key, value) => {
  const database = await getDB();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORES.APP_STATE], 'readwrite');
    const store = transaction.objectStore(STORES.APP_STATE);

    const request = store.put({ key, value, updatedAt: new Date().toISOString() });

    request.onsuccess = () => {
      console.log('应用状态保存成功:', key);
      resolve();
    };

    request.onerror = () => {
      console.error('应用状态保存失败:', request.error);
      reject(request.error);
    };
  });
};

/**
 * 获取应用状态
 */
export const getAppState = async (key) => {
  const database = await getDB();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORES.APP_STATE], 'readonly');
    const store = transaction.objectStore(STORES.APP_STATE);

    const request = store.get(key);

    request.onsuccess = () => {
      if (request.result) {
        resolve(request.result.value);
      } else {
        resolve(null);
      }
    };

    request.onerror = () => {
      console.error('获取应用状态失败:', request.error);
      reject(request.error);
    };
  });
};

/**
 * 清除所有数据
 */
export const clearAllData = async () => {
  const database = await getDB();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(
      [STORES.PLAYBACK_RECORDS, STORES.APP_STATE, STORES.TIMER_SESSIONS],
      'readwrite'
    );

    transaction.objectStore(STORES.PLAYBACK_RECORDS).clear();
    transaction.objectStore(STORES.APP_STATE).clear();
    transaction.objectStore(STORES.TIMER_SESSIONS).clear();

    transaction.oncomplete = () => {
      console.log('所有数据已清除');
      resolve();
    };

    transaction.onerror = () => {
      console.error('清除数据失败:', transaction.error);
      reject(transaction.error);
    };
  });
};

export default {
  initDatabase,
  cleanupOldData,
  savePlaybackRecord,
  getPlaybackHistory,
  getTotalPlays,
  saveTimerSession,
  updateTimerSession,
  getActiveTimerSession,
  saveAppState,
  getAppState,
  clearAllData
};
