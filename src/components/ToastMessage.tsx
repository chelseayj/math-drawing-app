import React from 'react';
import { Tool } from '../types';
import { TOAST_STYLES } from '../constants/styles';

interface ToastMessageProps {
  selectedTool: Tool;
  canPlacePoint: boolean;
  isDrawingLine?: boolean;
  isTransforming?: boolean;
  isShiftPressed?: boolean;
  transformingShapeType?: string;
  isDrawingShape?: boolean;
}

const ToastMessage: React.FC<ToastMessageProps> = ({ 
  selectedTool, 
  canPlacePoint, 
  isDrawingLine,
  isTransforming,
  isShiftPressed,
  transformingShapeType,
  isDrawingShape
}) => {
  const getToastMessage = () => {
    // 변형 도구 사용 중이고 Shift가 눌린 경우
    if (selectedTool === 'transform' && isTransforming && isShiftPressed) {
      if (transformingShapeType === 'triangle') {
        return '직각삼각형을 만들 수 있습니다 | ESC: 취소';
      } else if (transformingShapeType === 'rectangle') {
        return '수평 평행사변형을 만들 수 있습니다 | ESC: 취소';
      }
    }
    
    // 변형 도구 기본 메시지
    if (selectedTool === 'transform') {
      if (isTransforming) {
        return '도형의 꼭짓점을 드래그해서 변형하세요 | ESC: 취소';
      }
      return '도형의 꼭짓점을 드래그해서 변형하세요 | Shift + 드래그: 특수 변형 (직각삼각형, 수평 평행사변형)';
    }
    
    switch (selectedTool) {
      case 'delete':
        return '도형, 점, 선분을 클릭해서 삭제하세요';
      case 'clear':
        return '캔버스를 클릭하면 모든 도형, 점, 선분이 삭제됩니다';
      case 'point':
        return canPlacePoint 
          ? '도형 위에 점을 찍을 수 있습니다 (파란색 원: 배치 가능 위치)'
          : '도형의 테두리, 중심점, 꼭짓점에 점을 찍을 수 있습니다';
      case 'line':
        return isDrawingLine
          ? '끝점을 선택하세요 (어디든 자유롭게 선택 가능) - 보라색: 점-점 연결, 주황색: 꼭짓점, 노란색: 중심점, 초록색: 기존 점 | ESC: 취소'
          : '시작점을 선택하세요 (기존 점 + 도형의 꼭짓점/중심점 선택 가능) - 보라색: 점-점, 주황색: 꼭짓점, 노란색: 중심점, 초록색: 기존 점';
      default:
        return isDrawingShape
          ? '드래그해서 도형 그리기 | Shift + 드래그: 정형 도형 | ESC: 취소'
          : '드래그해서 도형 그리기 | Shift + 드래그: 정형 도형 (정원, 정삼각형, 정사각형)';
    }
  };

  return (
    <div style={TOAST_STYLES.container}>
      {getToastMessage()}
    </div>
  );
};

export default ToastMessage; 