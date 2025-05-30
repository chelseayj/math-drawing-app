import { Point, Shape, GeometryPoint } from '../types';
import { calculateDistance } from './geometryUtils';
import { findNearestSnapPoint } from './shapeSnapUtils';

// 점-점 연결 스냅 정보
export interface PointToPointSnap {
  point: Point;
  targetPointId: string;
  targetPoint: GeometryPoint;
  distance: number;
  isShapePoint: boolean; // 도형 위의 점인지 여부
}

// 점에서 다른 점으로의 연결 스냅 찾기
export const findPointToPointSnap = (
  sourcePoint: Point,
  mousePoint: Point,
  points: GeometryPoint[],
  shapes: Shape[],
  tolerance: number = 20 // 점-점 연결은 조금 더 넓은 허용 범위
): PointToPointSnap | null => {
  let bestSnap: PointToPointSnap | null = null;
  let minDistance = tolerance;

  // 1. 기존 기하학적 점들 확인 (우선순위 높음)
  for (const point of points) {
    const distance = calculateDistance(mousePoint, point.position);
    if (distance <= minDistance) {
      bestSnap = {
        point: point.position,
        targetPointId: point.id,
        targetPoint: point,
        distance,
        isShapePoint: true
      };
      minDistance = distance;
    }
  }

  // 2. 도형의 스냅 포인트들 확인 (꼭짓점, 중심점)
  const shapeSnapPoint = findNearestSnapPoint(mousePoint, shapes);
  if (shapeSnapPoint) {
    const distance = calculateDistance(mousePoint, shapeSnapPoint.point);
    if (distance <= minDistance) {
      // 가상의 GeometryPoint 생성 (도형의 스냅 포인트용)
      const virtualPoint: GeometryPoint = {
        id: `virtual-${shapeSnapPoint.shapeId}-${shapeSnapPoint.type}-${shapeSnapPoint.vertexIndex || 0}`,
        position: shapeSnapPoint.point,
        label: shapeSnapPoint.type === 'center' ? 'O' : `V${shapeSnapPoint.vertexIndex || 0}`,
        shapeId: shapeSnapPoint.shapeId,
        type: shapeSnapPoint.type,
        vertexIndex: shapeSnapPoint.vertexIndex
      };

      bestSnap = {
        point: shapeSnapPoint.point,
        targetPointId: virtualPoint.id,
        targetPoint: virtualPoint,
        distance,
        isShapePoint: true
      };
      minDistance = distance;
    }
  }

  return bestSnap;
};

// 점-점 연결 시 시각적 피드백을 위한 정보
export const getPointToPointFeedback = (
  sourcePoint: Point,
  mousePoint: Point,
  points: GeometryPoint[],
  shapes: Shape[],
  tolerance: number = 20
): {
  snapPoint: Point | null;
  isValidConnection: boolean;
  targetInfo?: PointToPointSnap;
} => {
  const snap = findPointToPointSnap(sourcePoint, mousePoint, points, shapes, tolerance);
  
  if (snap) {
    return {
      snapPoint: snap.point,
      isValidConnection: true,
      targetInfo: snap
    };
  }

  return {
    snapPoint: null,
    isValidConnection: false
  };
};

// 점-점 연결이 유효한지 확인 (같은 점에 연결하려는 경우 방지)
export const isValidPointToPointConnection = (
  sourcePoint: Point,
  targetPoint: Point,
  tolerance: number = 5
): boolean => {
  const distance = calculateDistance(sourcePoint, targetPoint);
  return distance > tolerance; // 5px 이상 떨어져 있어야 유효한 연결
}; 