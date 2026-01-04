import React, { useEffect, useState } from 'react';
import { log } from '../utils/Logger';
import './AlarmModal.css';

const AlarmModal = ({ isVisible, onClose }) => {
  const [isBlinking, setIsBlinking] = useState(true);
  
  // 实现文字闪烁效果和闹钟播放
  useEffect(() => {
    if (isVisible) {
      const interval = setInterval(() => {
        setIsBlinking(prev => !prev);
      }, 500);
      
      // 播放闹钟声音
      try {
        if (window.playAlarm) {
          log.info('AlarmModal: 调用window.playAlarm()方法');
          window.playAlarm();
        } else if (window.alarmRef && window.alarmRef.current) {
          log.info('AlarmModal: 直接播放闹钟音频');
          window.alarmRef.current.loop = true;  // 让闹钟循环播放
          window.alarmRef.current.play();
        } else {
          log.warn('AlarmModal: 无法播放闹钟，音频引用不可用');
        }
      } catch (error) {
        log.error('AlarmModal: 播放闹钟时出错', error);
      }
      
      return () => {
        clearInterval(interval);
        // 停止闹钟播放
        try {
          if (window.stopAlarm) {
            log.info('AlarmModal: 调用window.stopAlarm()方法');
            window.stopAlarm();
          } else if (window.alarmRef && window.alarmRef.current) {
            log.info('AlarmModal: 直接停止闹钟播放');
            window.alarmRef.current.pause();
            window.alarmRef.current.currentTime = 0;
            window.alarmRef.current.loop = false;  // 重置循环属性
          }
        } catch (error) {
          log.error('AlarmModal: 停止闹钟时出错', error);
        }
      };
    }
  }, [isVisible]);
  
  // 防止点击模态框内容区域时关闭模态框
  const handleModalContentClick = (e) => {
    e.stopPropagation();
  };

  if (!isVisible) return null;

  return (
    <div className="alarm-modal-overlay" onClick={onClose}>
      <div 
        className="alarm-modal-content" 
        onClick={handleModalContentClick}
        role="alert" 
        aria-modal="true"
      >
        <div className="alarm-icon">⏰</div>
        <h2 className={`alarm-title ${isBlinking ? 'blink' : ''}`}>定时结束！</h2>
        <p className="alarm-message">您设置的定时已结束</p>
        <button 
          className="alarm-close-button" 
          onClick={onClose}
          aria-label="关闭闹钟"
        >
          关闭闹钟
        </button>
      </div>
    </div>
  );
};

export default AlarmModal;