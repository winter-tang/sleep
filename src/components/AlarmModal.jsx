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
        } else {
          log.warn('AlarmModal: window.playAlarm()方法不存在');
        }
      } catch (error) {
        log.error('AlarmModal: 播放闹钟时出错', error);
      }
      
      return () => {
        clearInterval(interval);
        // 停止闹钟播放
        try {
          if (window.alarmRef && window.alarmRef.current) {
            log.info('AlarmModal: 停止闹钟播放');
            window.alarmRef.current.pause();
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