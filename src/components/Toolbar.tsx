import React, { useState } from 'react';
import { Tool } from '../types';
import { TOOLBAR_STYLES } from '../constants/toolbarStyles';
import { 
  Square, 
  Triangle, 
  Circle, 
  Minus, 
  Dot, 
  Pointer, 
  Trash2, 
  BrushCleaning 
} from 'lucide-react';

interface ToolbarProps {
  selectedTool: Tool;
  onToolSelect: (tool: Tool) => void;
}

// 툴팁 컴포넌트
interface TooltipProps {
  text: string;
  shortcut?: string;
  children: React.ReactNode;
}

const Tooltip: React.FC<TooltipProps> = ({ text, shortcut, children }) => {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div 
      style={{ position: 'relative', display: 'inline-block' }}
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      {isVisible && (
        <div style={TOOLBAR_STYLES.tooltip.container}>
          {text}
          {shortcut && (
            <span style={TOOLBAR_STYLES.tooltip.shortcut}>
              ({shortcut})
            </span>
          )}
          <div style={TOOLBAR_STYLES.tooltip.arrow} />
        </div>
      )}
    </div>
  );
};

// 아이콘 버튼 컴포넌트
interface IconButtonProps {
  tool: Tool;
  selectedTool: Tool;
  onToolSelect: (tool: Tool) => void;
  icon: React.ReactNode;
  tooltip: string;
  shortcut?: string;
  variant?: 'default' | 'danger' | 'warning';
}

const IconButton: React.FC<IconButtonProps> = ({ 
  tool, 
  selectedTool, 
  onToolSelect, 
  icon, 
  tooltip, 
  shortcut,
  variant = 'default'
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const isSelected = selectedTool === tool;
  
  const getButtonStyle = () => {
    let style = { ...TOOLBAR_STYLES.button.base };

    if (isSelected) {
      style = { ...style, ...TOOLBAR_STYLES.button.selected };
    } else {
      style = { ...style, ...TOOLBAR_STYLES.button[variant] };
      
      if (isHovered) {
        style = { ...style, ...TOOLBAR_STYLES.button.hover[variant] };
      }
    }

    return style;
  };

  return (
    <Tooltip text={tooltip} shortcut={shortcut}>
      <button
        onClick={() => onToolSelect(tool)}
        style={getButtonStyle()}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {icon}
      </button>
    </Tooltip>
  );
};

// 구분선 컴포넌트
const Divider: React.FC = () => (
  <div style={TOOLBAR_STYLES.divider} />
);

const Toolbar: React.FC<ToolbarProps> = ({ selectedTool, onToolSelect }) => {
  return (
    <div style={TOOLBAR_STYLES.container}>
      {/* 도형 그리기 도구들 */}
      <IconButton
        tool="circle"
        selectedTool={selectedTool}
        onToolSelect={onToolSelect}
        icon={<Circle />}
        tooltip="원"
        shortcut="C"
      />
      
      <IconButton
        tool="triangle"
        selectedTool={selectedTool}
        onToolSelect={onToolSelect}
        icon={<Triangle />}
        tooltip="삼각형"
        shortcut="T"
      />
      
      <IconButton
        tool="rectangle"
        selectedTool={selectedTool}
        onToolSelect={onToolSelect}
        icon={<Square />}
        tooltip="사각형"
        shortcut="R"
      />

      <Divider />

      {/* 점과 선분 도구들 */}
      <IconButton
        tool="point"
        selectedTool={selectedTool}
        onToolSelect={onToolSelect}
        icon={<Dot />}
        tooltip="점"
        shortcut="P"
      />
      
      <IconButton
        tool="line"
        selectedTool={selectedTool}
        onToolSelect={onToolSelect}
        icon={<Minus />}
        tooltip="선분"
        shortcut="L"
      />

      <IconButton
        tool="transform"
        selectedTool={selectedTool}
        onToolSelect={onToolSelect}
        icon={<Pointer />}
        tooltip="변형"
        shortcut="V"
      />

      <Divider />

      {/* 삭제 도구들 */}
      <IconButton
        tool="delete"
        selectedTool={selectedTool}
        onToolSelect={onToolSelect}
        icon={<Trash2 />}
        tooltip="개별 삭제"
        shortcut="D"
      />
      
      <IconButton
        tool="clear"
        selectedTool={selectedTool}
        onToolSelect={onToolSelect}
        icon={<BrushCleaning />}
        tooltip="전체 삭제"
        shortcut="X"
        variant="danger"
      />
    </div>
  );
};

export default Toolbar; 