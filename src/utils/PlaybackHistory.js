/**
 * 播放记录管理工具
 * 负责本地存储最近30次完整播放时间和总次数
 */

const STORAGE_KEYS = {
  PLAYBACK_HISTORY: 'meditation_playback_history',
  TOTAL_PLAYS: 'meditation_total_plays'
}

const MAX_HISTORY_ITEMS = 30

/**
 * 保存新的播放记录
 * @param {number} durationMinutes - 播放时长（分钟）
 */
export const savePlaybackRecord = (durationMinutes) => {
  try {
    // 获取当前日期时间
    const now = new Date()
    const record = {
      timestamp: now.toISOString(),
      duration: durationMinutes,
      date: now.toLocaleDateString(),
      time: now.toLocaleTimeString()
    }
    
    // 获取现有历史记录
    const history = getPlaybackHistory()
    
    // 添加新记录到开头
    history.unshift(record)
    
    // 限制记录数量为30条
    if (history.length > MAX_HISTORY_ITEMS) {
      history.splice(MAX_HISTORY_ITEMS)
    }
    
    // 保存到本地存储
    localStorage.setItem(STORAGE_KEYS.PLAYBACK_HISTORY, JSON.stringify(history))
    
    // 更新总播放次数
    updateTotalPlays()
    
    return true
  } catch (error) {
    console.error('保存播放记录失败:', error)
    return false
  }
}

/**
 * 获取最近的播放记录
 * @returns {Array} 播放记录数组
 */
export const getPlaybackHistory = () => {
  try {
    const history = localStorage.getItem(STORAGE_KEYS.PLAYBACK_HISTORY)
    return history ? JSON.parse(history) : []
  } catch (error) {
    console.error('获取播放记录失败:', error)
    return []
  }
}

/**
 * 获取总播放次数
 * @returns {number} 总播放次数
 */
export const getTotalPlays = () => {
  try {
    const total = localStorage.getItem(STORAGE_KEYS.TOTAL_PLAYS)
    return total ? parseInt(total, 10) : 0
  } catch (error) {
    console.error('获取总播放次数失败:', error)
    return 0
  }
}

/**
 * 更新总播放次数
 */
const updateTotalPlays = () => {
  try {
    const currentTotal = getTotalPlays()
    localStorage.setItem(STORAGE_KEYS.TOTAL_PLAYS, (currentTotal + 1).toString())
  } catch (error) {
    console.error('更新总播放次数失败:', error)
  }
}

/**
 * 清除所有播放记录
 */
export const clearPlaybackHistory = () => {
  try {
    localStorage.removeItem(STORAGE_KEYS.PLAYBACK_HISTORY)
    localStorage.removeItem(STORAGE_KEYS.TOTAL_PLAYS)
    return true
  } catch (error) {
    console.error('清除播放记录失败:', error)
    return false
  }
}

export default {
  savePlaybackRecord,
  getPlaybackHistory,
  getTotalPlays,
  clearPlaybackHistory
}