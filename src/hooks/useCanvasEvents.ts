import { useCallback } from 'react';
import { Point, Shape, Tool, GeometryPoint, LineSegment } from '../types';
import { isPointInShape } from '../utils/shapeCollisionUtils';
import { useMouseEvents } from './useMouseEvents';
import { useLineEvents } from './useLineEvents';
import { useShapeEvents } from './useShapeEvents';
import { usePointEvents } from './usePointEvents';
import { useTransformEvents } from './useTransformEvents';

interface UseCanvasEventsProps {
  selectedTool: Tool;
  shapes: Shape[];
  points: GeometryPoint[];
  lines: LineSegment[];
  onShapeAdd: (shape: Shape) => void;
  onShapeDelete: (shapeId: string) => void;
  onShapeUpdate: (shapeId: string, updatedShape: Shape) => void;
  onClearAll: () => void;
  onPointClick: (point: Point) => boolean;
  onPointCreate: (point: Point, shapes: Shape[]) => boolean;
  onPointsByShapeDelete: (shapeId: string) => void;
  onAllPointsClear: () => void;
  onLineClick: (point: Point) => boolean;
  onLineCreate: (line: LineSegment) => void;
  onLinesByShapeDelete: (shapeId: string) => void;
  onAllLinesClear: () => void;
  onPointUpdate: (pointId: string, newPosition: Point) => void;
  onLineUpdate: (lineId: string, updatedLine: LineSegment) => void;
}

export const useCanvasEvents = (props: UseCanvasEventsProps) => {
  const {
    selectedTool, shapes, points, lines, onShapeAdd, onShapeDelete, onShapeUpdate, onClearAll,
    onPointClick, onPointCreate, onPointsByShapeDelete, onAllPointsClear,
    onLineClick, onLineCreate, onLinesByShapeDelete, onAllLinesClear
  } = props;

  // 분리된 훅들 사용
  const { getCanvasPoint } = useMouseEvents();
  const lineEvents = useLineEvents({ shapes, points, lines, onLineCreate });
  const shapeEvents = useShapeEvents({ onShapeAdd });
  const pointEvents = usePointEvents({ shapes, onPointCreate });
  const transformEvents = useTransformEvents({ 
    shapes, 
    onShapeUpdate
  });

  // 삭제 도구 처리
  const handleDelete = useCallback((point: Point) => {
    const lineDeleted = onLineClick(point);
    if (lineDeleted) return;
    const pointDeleted = onPointClick(point);
    if (pointDeleted) return;
    for (let i = shapes.length - 1; i >= 0; i--) {
      if (isPointInShape(point, shapes[i])) {
        onShapeDelete(shapes[i].id);
        onPointsByShapeDelete(shapes[i].id);
        onLinesByShapeDelete(shapes[i].id);
        return;
      }
    }
  }, [shapes, onLineClick, onPointClick, onShapeDelete, onPointsByShapeDelete, onLinesByShapeDelete]);

  // 전체 삭제 처리
  const handleClearAll = useCallback(() => {
    onClearAll();
    onAllPointsClear();
    onAllLinesClear();
  }, [onClearAll, onAllPointsClear, onAllLinesClear]);

  // 마우스 다운 이벤트
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    const point = getCanvasPoint(e);

    switch (selectedTool) {
      case 'delete':
        handleDelete(point);
        break;
      case 'clear':
        handleClearAll();
        break;
      case 'point':
        pointEvents.handlePointCreate(point);
        break;
      case 'line':
        if (!lineEvents.isDrawingLine) {
          lineEvents.handleLineStart(point);
        } else {
          lineEvents.handleLineEnd(point);
        }
        break;
      case 'transform':
        transformEvents.handleTransformStart(point);
        break;
      default:
        shapeEvents.handleShapeStart(point, selectedTool);
        break;
    }
  }, [selectedTool, getCanvasPoint, handleDelete, handleClearAll, pointEvents, lineEvents, transformEvents, shapeEvents]);

  // 마우스 이동 이벤트
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const mousePoint = getCanvasPoint(e);

    switch (selectedTool) {
      case 'point':
        pointEvents.handlePointPreview(mousePoint);
        break;
      case 'line':
        lineEvents.handleLinePreview(mousePoint);
        break;
      case 'transform':
        if (transformEvents.transformState.isTransforming) {
          transformEvents.handleTransformMove(mousePoint);
        } else {
          transformEvents.handleTransformHover(mousePoint);
        }
        break;
      default:
        // 다른 도구들은 상태 초기화
        pointEvents.resetPointState();
        lineEvents.resetLineState();
        
        // 도형 그리기 미리보기
        shapeEvents.handleShapePreview(mousePoint, selectedTool, e.shiftKey);
        break;
    }
  }, [selectedTool, getCanvasPoint, pointEvents, lineEvents, transformEvents, shapeEvents]);

  // 마우스 업 이벤트
  const handleMouseUp = useCallback(() => {
    if (selectedTool === 'transform') {
      transformEvents.handleTransformEnd();
    } else {
      shapeEvents.handleShapeEnd(selectedTool);
    }
  }, [selectedTool, transformEvents, shapeEvents]);

  return {
    currentShape: shapeEvents.currentShape,
    feedbackPoint: pointEvents.feedbackPoint,
    canPlacePoint: pointEvents.canPlacePoint,
    lineSnapFeedback: lineEvents.lineSnapFeedback,
    previewLine: lineEvents.previewLine,
    isDrawingLine: lineEvents.isDrawingLine,
    perpendicularSnap: lineEvents.perpendicularSnap,
    isPerpendicularPreview: lineEvents.isPerpendicularPreview,
    isPerpendicular: lineEvents.isPerpendicular,
    edgeInfo: lineEvents.edgeInfo,
    transformState: transformEvents.transformState,
    isTransformableShape: transformEvents.isTransformableShape,
    isShiftPressed: transformEvents.isShiftPressed,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp
  };
}; 