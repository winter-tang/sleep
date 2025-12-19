import { useState } from 'react'
import './MeditationGuide.css'

const MeditationGuide = () => {
  const [isExpanded, setIsExpanded] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [showAllSteps, setShowAllSteps] = useState(false)

  const guideContent = [
    '1. 找一个舒适的姿势躺下，确保身体得到充分支撑，放松全身肌肉。',
    '2. 闭上眼睛，将注意力集中在呼吸上，自然呼吸，不要刻意控制。',
    '3. 深吸一口气，默数4秒，然后屏住呼吸2秒，再缓慢呼出6秒。重复这个呼吸模式。',
    '4. 开始身体扫描放松法：从脚趾开始，逐渐向上放松每个部位。想象紧张感从身体中流走。',
    '5. 当扫描到腿部时，感受双腿的重量，让它们完全放松，像融化在床垫上一样。',
    '6. 继续向上扫描到臀部、腹部、胸部，感受呼吸时的起伏，让这些部位也完全放松。',
    '7. 扫描到肩膀、手臂和手部，释放所有紧张感，让手臂自然下垂。',
    '8. 最后扫描颈部、头部和面部，特别注意放松前额、眼睛周围和下颌的肌肉。',
    '9. 如果思绪开始游走，不要自责，温和地将注意力带回呼吸或身体感觉。',
    '10. 想象自己身处一个宁静、舒适的地方，如平静的湖边、茂密的森林或温暖的沙滩。',
    '11. 在这个宁静的地方，感受周围的声音、气味和触觉，让自己完全沉浸其中。',
    '12. 持续深呼吸，让自己的意识逐渐变得模糊，自然地进入睡眠状态。'
  ]

  return (
    <div className="meditation-guide">
      <button 
        className="guide-toggle"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {isExpanded ? '隐藏' : '显示'}冥想引导
        <span className={`arrow ${isExpanded ? 'up' : 'down'}`}>▼</span>
      </button>
      
      {isExpanded && (
        <div className="guide-content">
          <div className="guide-navigation">
            <button 
              onClick={() => setCurrentStep(prev => Math.max(0, prev - 1))}
              disabled={currentStep === 0}
              className="nav-btn"
            >
              上一步
            </button>
            <span className="step-indicator">
              {currentStep + 1} / {guideContent.length}
            </span>
            <button 
              onClick={() => setCurrentStep(prev => Math.min(guideContent.length - 1, prev + 1))}
              disabled={currentStep === guideContent.length - 1}
              className="nav-btn"
            >
              下一步
            </button>
          </div>
          
          {showAllSteps ? (
            <div className="all-steps-content">
              <ul>
                {guideContent.map((step, index) => (
                  <li key={index} className={index === currentStep ? 'current' : ''}>
                    {step}
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="step-content">
              <p>{guideContent[currentStep]}</p>
            </div>
          )}
          
          <div className="all-steps-toggle">
            <button onClick={() => setShowAllSteps(!showAllSteps)} className="view-all-btn">
              {showAllSteps ? '返回单步模式' : '查看所有步骤'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default MeditationGuide