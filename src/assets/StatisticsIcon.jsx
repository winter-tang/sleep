import React from 'react';

const StatisticsIcon = ({ size = 24, color = 'currentColor' }) => {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* 简洁的统计图表设计 */}
      <g stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        {/* 三条柱状线 */}
        <line x1="8" y1="20" x2="8" y2="8" />
        <line x1="12" y1="20" x2="12" y2="4" />
        <line x1="16" y1="20" x2="16" y2="12" />
        
        {/* 底部基线 */}
        <line x1="6" y1="20" x2="18" y2="20" />
        
        {/* 简化的趋势线 */}
        <path d="M8 8 L12 4 L16 12" strokeWidth="1.5" />
      </g>
    </svg>
  );
};

export default StatisticsIcon;