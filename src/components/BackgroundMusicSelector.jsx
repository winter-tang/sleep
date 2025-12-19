import './BackgroundMusicSelector.css'

const BackgroundMusicSelector = ({ selectedMusic, onSelectMusic }) => {
  const musicOptions = [
    { id: 'alpha', name: '阿尔法音乐', description: '促进深度放松' },
    { id: 'rain', name: '雨声', description: '平静心灵' },
    { id: 'forest', name: '森林', description: '自然和谐' },
    { id: 'waves', name: '海浪', description: '舒缓压力' }
  ]

  return (
    <div className="music-selector-container">
      <h3>背景音乐</h3>
      <div className="music-options">
        {musicOptions.map(option => (
          <div 
            key={option.id} 
            className={`music-option ${selectedMusic === option.id ? 'selected' : ''}`}
            onClick={() => onSelectMusic(option.id)}
          >
            <div className="music-name">{option.name}</div>
            <div className="music-description">{option.description}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default BackgroundMusicSelector