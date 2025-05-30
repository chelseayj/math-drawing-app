import { Point, Shape, GeometryPoint } from '../types';
import { findNearestSnapPoint } from './shapeSnapUtils';
import { getClosestPointOnShapeEdge } from './shapeEdgeUtils';

// 점이 도형 위에 놓일 수 있는지 확인 (테두리 또는 스냅 포인트)
export const canPlacePointOnShape = (mousePoint: Point, shapes: Shape[]): { point: Point; shapeId: string; type: 'center' | 'vertex' | 'edge'; vertexIndex?: number } | null => {
  // 먼저 스냅 포인트 확인
  const snapPoint = findNearestSnapPoint(mousePoint, shapes);
  if (snapPoint) {
    return {
      point: snapPoint.point,
      shapeId: snapPoint.shapeId,
      type: snapPoint.type,
      vertexIndex: snapPoint.vertexIndex
    };
  }
  
  // 스냅 포인트가 없으면 테두리 위인지 확인
  for (const shape of shapes) {
    const edgePoint = getClosestPointOnShapeEdge(mousePoint, shape);
    if (edgePoint) {
      return {
        point: edgePoint,
        shapeId: shape.id,
        type: 'edge'
      };
    }
  }
  
  return null;
};

// 시각적 피드백을 위한 포인트 찾기 (스냅 포인트 또는 테두리 위의 점)
export const getVisualFeedbackPoint = (mousePoint: Point, shapes: Shape[]): Point | null => {
  // 먼저 스냅 포인트 확인
  const snapPoint = findNearestSnapPoint(mousePoint, shapes);
  if (snapPoint) {
    return snapPoint.point;
  }
  
  // 스냅 포인트가 없으면 테두리 위인지 확인
  for (const shape of shapes) {
    const edgePoint = getClosestPointOnShapeEdge(mousePoint, shape);
    if (edgePoint) {
      return edgePoint; // 정확한 테두리 위치 반환
    }
  }
  
  return null;
};

// 점 레이블 위치 계산 함수
export const calculateLabelPosition = (point: Point, shape: Shape): Point => {
  const offset = 15; // 레이블과 점 사이의 거리
  
  // 도형의 중심점 계산
  const shapeCenterX = shape.x + shape.width / 2;
  const shapeCenterY = shape.y + shape.height / 2;
  
  // 점에서 도형 중심으로의 벡터
  const dx = shapeCenterX - point.x;
  const dy = shapeCenterY - point.y;
  
  // 벡터의 크기
  const magnitude = Math.sqrt(dx * dx + dy * dy);
  
  if (magnitude === 0) {
    // 점이 도형 중심에 있는 경우 위쪽에 레이블 배치
    return { x: point.x, y: point.y - offset };
  }
  
  // 정규화된 벡터 (도형 중심 반대 방향)
  const normalizedX = -dx / magnitude;
  const normalizedY = -dy / magnitude;
  
  // 레이블 위치 계산
  return {
    x: point.x + normalizedX * offset,
    y: point.y + normalizedY * offset
  };
};

// 다음 레이블 생성 (도형별로 A, B, C, ...)
export const getNextLabel = (existingPoints: GeometryPoint[], shapeId: string): string => {
  // 해당 도형의 점들만 필터링
  const shapePoints = existingPoints.filter(p => p.shapeId === shapeId);
  const usedLabels = new Set(shapePoints.map(p => p.label));
  
  for (let i = 0; i < 26; i++) {
    const label = String.fromCharCode(65 + i); // A, B, C, ...
    if (!usedLabels.has(label)) {
      return label;
    }
  }
  
  // 26개를 넘으면 AA, AB, ... 형태로
  return `A${shapePoints.length}`;
}; 