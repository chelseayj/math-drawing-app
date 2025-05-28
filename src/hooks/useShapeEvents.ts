import { useState, useCallback } from 'react';
import { Point, Shape, Tool, MIN_SHAPE_SIZE, isDrawingTool } from '../types';
import { createShape, calculateRegularShapeCoords } from '../utils/shapeUtils';

interface UseShapeEventsProps {
  onShapeAdd: (shape: Shape) => void;
}

export const useShapeEvents = ({ onShapeAdd }: UseShapeEventsProps) => {
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState<Point | null>(null);
  const [currentShape, setCurrentShape] = useState<Shape | null>(null);

  // 도형 그리기 시작
  const handleShapeStart = useCallback((point: Point, selectedTool: Tool) => {
    if (isDrawingTool(selectedTool)) {
      setIsDrawing(true);
      setStartPoint(point);
      setCurrentShape(null);
    }
  }, []);

  // 도형 그리기 미리보기 업데이트
  const handleShapePreview = useCallback((mousePoint: Point, selectedTool: Tool, shiftKey: boolean = false) => {
    if (!isDrawing || !startPoint || !isDrawingTool(selectedTool)) return;

    const currentPoint = mousePoint;
    let adjustedStart = startPoint;
    let adjustedEnd = currentPoint;

    if (shiftKey) {
      const coords = calculateRegularShapeCoords(startPoint, currentPoint);
      adjustedStart = coords.adjustedStart;
      adjustedEnd = coords.adjustedEnd;
    }

    const width = Math.abs(adjustedEnd.x - adjustedStart.x);
    const height = Math.abs(adjustedEnd.y - adjustedStart.y);

    if (width < MIN_SHAPE_SIZE || height < MIN_SHAPE_SIZE) {
      setCurrentShape(null);
      return;
    }

    const shape = createShape(adjustedStart, adjustedEnd, selectedTool);
    setCurrentShape(shape);
  }, [isDrawing, startPoint]);

  // 도형 그리기 완료
  const handleShapeEnd = useCallback((selectedTool: Tool) => {
    if (isDrawing && currentShape && isDrawingTool(selectedTool)) {
      onShapeAdd(currentShape);
    }
    setIsDrawing(false);
    setStartPoint(null);
    setCurrentShape(null);
  }, [isDrawing, currentShape, onShapeAdd]);

  return {
    isDrawing,
    currentShape,
    handleShapeStart,
    handleShapePreview,
    handleShapeEnd
  };
}; 