import { Point, Shape, DrawingTool, Circle, Triangle, Rectangle } from '../types';

// 새로 분리된 파일들에서 import
export { getShapeEdges, getClosestPointOnShapeEdge, isPointOnShapeEdge } from './shapeEdgeUtils';
export { isPointInShape, isPointInPolygon } from './shapeCollisionUtils';

// 정사각형/정원 좌표 계산
export const calculateRegularShapeCoords = (
  startPoint: Point,
  currentPoint: Point
): { adjustedStart: Point; adjustedEnd: Point } => {
  const deltaX = currentPoint.x - startPoint.x;
  const deltaY = currentPoint.y - startPoint.y;
  
  // 더 작은 값을 기준으로 정사각형/정원 크기 결정
  const size = Math.min(Math.abs(deltaX), Math.abs(deltaY));
  
  // 드래그 방향에 따라 좌표 조정
  const adjustedEnd: Point = {
    x: startPoint.x + (deltaX >= 0 ? size : -size),
    y: startPoint.y + (deltaY >= 0 ? size : -size)
  };
  
  return {
    adjustedStart: startPoint,
    adjustedEnd
  };
};

// 도형 생성 함수
export const createShape = (start: Point, end: Point, type: DrawingTool): Shape => {
  const x = Math.min(start.x, end.x);
  const y = Math.min(start.y, end.y);
  const width = Math.abs(end.x - start.x);
  const height = Math.abs(end.y - start.y);
  
  const baseShape = {
    id: Date.now().toString(),
    type,
    x,
    y,
    width,
    height
  };

  // 타입에 따라 적절한 Shape 반환
  switch (type) {
    case 'circle':
      return baseShape as Circle;
    case 'triangle':
      return { ...baseShape, isTransformed: false } as Triangle;
    case 'rectangle':
      return { ...baseShape, isTransformed: false } as Rectangle;
    default:
      throw new Error(`Unknown shape type: ${type}`);
  }
}; 