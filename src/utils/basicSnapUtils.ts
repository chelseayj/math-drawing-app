import { Point, Shape, GeometryPoint, LineSegment } from '../types';
import { calculateDistance } from './geometryUtils';
import { getClosestPointOnLineSegment } from './lineUtils';
import { getClosestPointOnShapeEdge } from './shapeEdgeUtils';
import { findNearestSnapPoint } from './shapeSnapUtils';
import { TRANSFORM_CONSTANTS } from '../constants';

// 기본 스냅 타겟 찾기 (점, 도형 스냅 포인트, 테두리, 선분)
export const findBasicSnapTarget = (
  mousePoint: Point,
  shapes: Shape[],
  points: GeometryPoint[],
  lines: LineSegment[],
  tolerance: number = TRANSFORM_CONSTANTS.SNAP_TOLERANCE
): {
  point: Point;
  type: 'point' | 'vertex' | 'center' | 'edge' | 'line' | 'free';
  reference?: string;
  vertexIndex?: number;
} => {
  // 1. 기존 기하학적 점 우선 확인
  for (const point of points) {
    const distance = calculateDistance(mousePoint, point.position);
    if (distance <= tolerance) {
      return {
        point: point.position,
        type: 'point',
        reference: point.id
      };
    }
  }

  // 2. 도형의 스냅 포인트들 확인 (꼭짓점, 중심점)
  const shapeSnapPoint = findNearestSnapPoint(mousePoint, shapes);
  if (shapeSnapPoint) {
    const distance = calculateDistance(mousePoint, shapeSnapPoint.point);
    if (distance <= tolerance) {
      return {
        point: shapeSnapPoint.point,
        type: shapeSnapPoint.type === 'center' ? 'center' : 'vertex',
        reference: shapeSnapPoint.shapeId,
        vertexIndex: shapeSnapPoint.vertexIndex
      };
    }
  }

  // 3. 도형 테두리 확인
  for (const shape of shapes) {
    const edgePoint = getClosestPointOnShapeEdge(mousePoint, shape, tolerance);
    if (edgePoint) {
      return {
        point: edgePoint,
        type: 'edge',
        reference: shape.id
      };
    }
  }

  // 4. 선분 위의 점 확인
  for (const line of lines) {
    const closestPoint = getClosestPointOnLineSegment(mousePoint, line.startPoint, line.endPoint);
    const distance = calculateDistance(mousePoint, closestPoint);
    if (distance <= tolerance) {
      return {
        point: closestPoint,
        type: 'line',
        reference: line.id
      };
    }
  }

  // 5. 자유 위치 (빈 공간)
  return {
    point: mousePoint,
    type: 'free'
  };
}; 