import React, { useState } from 'react';
import './ShapeMenu.css';

interface ShapeMenuProps {
  onSelectShape: (shape: 'circle' | 'triangle' | 'rectangle' | null) => void;
  onSelectTool: (tool: 'shape' | 'point' | 'line' | 'length' | 'angle' | 'transform' | 'perpendicular') => void;
  selectedShape: 'circle' | 'triangle' | 'rectangle' | null;
  selectedTool: 'shape' | 'point' | 'line' | 'length' | 'angle' | 'transform' | 'perpendicular';
  onClearShapes: () => void;
  onUndo: () => void;
}

const ShapeMenu: React.FC<ShapeMenuProps> = ({
  onSelectShape,
  onSelectTool,
  selectedShape,
  selectedTool,
  onClearShapes,
  onUndo
}) => {
  const [showTriangleDropdown, setShowTriangleDropdown] = useState(false);
  const [showLineDropdown, setShowLineDropdown] = useState(false);

  // 드롭다운 외부 클릭 시 닫기
  const handleDocumentClick = (e: MouseEvent) => {
    const target = e.target as HTMLElement;
    if (!target.closest('.dropdown-container')) {
      setShowTriangleDropdown(false);
      setShowLineDropdown(false);
    }
  };

  // 이벤트 리스너 등록 및 해제
  React.useEffect(() => {
    document.addEventListener('click', handleDocumentClick);
    return () => {
      document.removeEventListener('click', handleDocumentClick);
    };
  }, []);

  return (
    <div className="shape-menu">
      {/* 도형 그룹 */}
      <div className="tool-group">
        <button
          className={`shape-button ${selectedShape === 'circle' && selectedTool === 'shape' ? 'active' : ''}`}
          onClick={() => {
            onSelectTool('shape');
            onSelectShape(selectedShape === 'circle' ? null : 'circle');
          }}
        >
          원
        </button>
        
        {/* 삼각형 드롭다운 */}
        <div className="dropdown-container">
          <button
            className={`shape-button ${selectedShape === 'triangle' && (selectedTool === 'shape' || selectedTool === 'transform') ? 'active' : ''}`}
            onClick={(e) => {
              e.stopPropagation();
              setShowTriangleDropdown(!showTriangleDropdown);
            }}
          >
            삼각형 ▼
          </button>
          {showTriangleDropdown && (
            <div className="dropdown-menu">
              <button
                className={`dropdown-item ${selectedShape === 'triangle' && selectedTool === 'shape' ? 'active' : ''}`}
                onClick={() => {
                  onSelectTool('shape');
                  onSelectShape('triangle');
                  setShowTriangleDropdown(false);
                }}
              >
                생성
              </button>
              <button
                className={`dropdown-item ${selectedTool === 'transform' ? 'active' : ''}`}
                onClick={() => {
                  onSelectTool('transform');
                  onSelectShape('triangle');
                  setShowTriangleDropdown(false);
                }}
              >
                변형
              </button>
            </div>
          )}
        </div>
        
        <button
          className={`shape-button ${selectedShape === 'rectangle' && selectedTool === 'shape' ? 'active' : ''}`}
          onClick={() => {
            onSelectTool('shape');
            onSelectShape(selectedShape === 'rectangle' ? null : 'rectangle');
          }}
        >
          사각형
        </button>
      </div>

      <div className="divider" />

      {/* 도구 그룹 */}
      <div className="tool-group">
        <button
          className={`tool-button ${selectedTool === 'point' ? 'active' : ''}`}
          onClick={() => onSelectTool('point')}
        >
          점
        </button>
        
        {/* 선분 드롭다운 */}
        <div className="dropdown-container">
          <button
            className={`tool-button ${(selectedTool === 'line' || selectedTool === 'perpendicular') ? 'active' : ''}`}
            onClick={(e) => {
              e.stopPropagation();
              setShowLineDropdown(!showLineDropdown);
            }}
          >
            선분 ▼
          </button>
          {showLineDropdown && (
            <div className="dropdown-menu">
              <button
                className={`dropdown-item ${selectedTool === 'line' ? 'active' : ''}`}
                onClick={() => {
                  onSelectTool('line');
                  setShowLineDropdown(false);
                }}
              >
                선분 그리기
              </button>
              <button
                className={`dropdown-item ${selectedTool === 'perpendicular' ? 'active' : ''}`}
                onClick={() => {
                  onSelectTool('perpendicular');
                  setShowLineDropdown(false);
                }}
              >
                수선의 발
              </button>
            </div>
          )}
        </div>
        
        <button
          className={`tool-button ${selectedTool === 'length' ? 'active' : ''}`}
          onClick={() => onSelectTool('length')}
        >
          길이
        </button>
        <button
          className={`tool-button ${selectedTool === 'angle' ? 'active' : ''}`}
          onClick={() => onSelectTool('angle')}
        >
          각도
        </button>
      </div>

      <div className="divider" />

      {/* 되돌리기 및 삭제 버튼 */}
      <div className="tool-group">
        <button
          className="undo-button"
          onClick={onUndo}
          title="되돌리기 (Ctrl+Z)"
        >
          ↩
        </button>
        <button
          className="clear-button"
          onClick={onClearShapes}
        >
          전체 삭제
        </button>
      </div>
    </div>
  );
};

export default ShapeMenu; 