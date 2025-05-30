import React from 'react';
import { Shape, Tool } from '../types';
import { CANVAS_STYLES } from '../constants/styles';
import { usePointManagement } from '../hooks/usePointManagement';
import { useLineManagement } from '../hooks/useLineManagement';
import { useCanvasEvents } from '../hooks/useCanvasEvents';
import { useKeyboardEvents } from '../hooks/useKeyboardEvents';
import CanvasRenderer from './CanvasRenderer';
import ToastMessage from './ToastMessage';

// 커서 스타일 결정 함수 (Canvas 컴포넌트 내부로 이동)
const getCursorStyle = (tool: string): string => {
  switch (tool) {
    case 'delete':
      return 'pointer';
    case 'clear':
      return 'not-allowed';
    case 'point':
      return 'crosshair';
    case 'line':
      return 'crosshair';
    case 'transform':
      return 'default';
    case 'circle':
    case 'triangle':
    case 'rectangle':
      return 'crosshair';
    default:
      return 'default';
  }
};

interface CanvasProps {
  selectedTool: Tool;
  shapes: Shape[];
  onShapeAdd: (shape: Shape) => void;
  onShapeDelete: (shapeId: string) => void;
  onShapeUpdate: (shapeId: string, updatedShape: Shape) => void;
  onClearAll: () => void;
}

const Canvas: React.FC<CanvasProps> = ({ 
  selectedTool, 
  shapes, 
  onShapeAdd, 
  onShapeDelete, 
  onShapeUpdate, 
  onClearAll
}) => {
  // 점 관리 훅
  const {
    points,
    deletePointsByShape,
    clearAllPoints,
    handlePointClick,
    tryCreatePoint,
    updatePoint
  } = usePointManagement();

  // 선분 관리 훅
  const {
    lines,
    addLine,
    deleteLinesByShape,
    clearAllLines,
    handleLineClick,
    updateLine
  } = useLineManagement();

  // 캔버스 이벤트 훅
  const {
    currentShape,
    feedbackPoint,
    canPlacePoint,
    lineSnapFeedback,
    previewLine,
    isDrawingLine,
    perpendicularSnap,
    isPerpendicularPreview,
    isPerpendicular,
    edgeInfo,
    isPointToPoint,
    pointToPointInfo,
    currentSnapType,
    transformState,
    isShiftPressed,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleEscapeCancel
  } = useCanvasEvents({
    selectedTool,
    shapes,
    points,
    lines,
    onShapeAdd,
    onShapeDelete,
    onShapeUpdate,
    onClearAll,
    onPointClick: handlePointClick,
    onPointCreate: tryCreatePoint,
    onPointsByShapeDelete: deletePointsByShape,
    onAllPointsClear: clearAllPoints,
    onLineClick: handleLineClick,
    onLineCreate: addLine,
    onLinesByShapeDelete: deleteLinesByShape,
    onAllLinesClear: clearAllLines,
    onPointUpdate: updatePoint,
    onLineUpdate: updateLine
  });

  // 키보드 이벤트 훅
  useKeyboardEvents({
    onEscapePressed: handleEscapeCancel
  });

  // 동적 커서 스타일 계산
  const getDynamicCursorStyle = () => {
    if (selectedTool === 'transform') {
      // 변형 가능한 꼭짓점 위에 있을 때 pointer 커서
      if (transformState.hoverVertexIndex !== null) {
        return 'pointer';
      }
      // 변형 중일 때 move 커서
      if (transformState.isTransforming) {
        return 'move';
      }
    }
    return getCursorStyle(selectedTool);
  };

  return (
    <div
      style={{
        ...CANVAS_STYLES.container,
        cursor: getDynamicCursorStyle()
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      {/* 토스트 메시지 */}
      <ToastMessage 
        selectedTool={selectedTool} 
        canPlacePoint={canPlacePoint}
        isDrawingLine={isDrawingLine}
        isTransforming={transformState.isTransforming}
        isShiftPressed={isShiftPressed}
        transformingShapeType={transformState.selectedShape?.type}
        isDrawingShape={currentShape !== null}
      />

      {/* 캔버스 렌더러 */}
      <CanvasRenderer
        shapes={shapes}
        points={points}
        lines={lines}
        currentShape={currentShape}
        feedbackPoint={feedbackPoint}
        lineSnapFeedback={lineSnapFeedback}
        previewLine={previewLine}
        perpendicularSnap={perpendicularSnap}
        isPerpendicularPreview={isPerpendicularPreview}
        isPerpendicular={isPerpendicular}
        edgeInfo={edgeInfo}
        isPointToPoint={isPointToPoint}
        pointToPointInfo={pointToPointInfo}
        currentSnapType={currentSnapType}
        selectedTool={selectedTool}
      />
    </div>
  );
};

export default Canvas; 