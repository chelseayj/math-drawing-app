import { Point, Shape, GeometryPoint, LineSegment } from '../types';
import { calculateDistance } from './geometryUtils';
import { getClosestPointOnLineSegment } from './lineUtils';
import { getClosestPointOnShapeEdge } from './shapeEdgeUtils';
import { TRANSFORM_CONSTANTS } from '../constants';

// 기본 스냅 타겟 찾기 (점, 테두리, 선분)
export const findBasicSnapTarget = (
  mousePoint: Point,
  shapes: Shape[],
  points: GeometryPoint[],
  lines: LineSegment[],
  tolerance: number = TRANSFORM_CONSTANTS.SNAP_TOLERANCE
): {
  point: Point;
  type: 'point' | 'edge' | 'line' | 'free';
  reference?: string;
} => {
  // 1. 기존 점 우선 확인
  for (const point of points) {
    const distance = calculateDistance(mousePoint, { x: point.x, y: point.y });
    if (distance <= tolerance) {
      return {
        point: { x: point.x, y: point.y },
        type: 'point',
        reference: point.id
      };
    }
  }

  // 2. 도형 테두리 확인
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

  // 3. 선분 위의 점 확인
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

  // 4. 자유 위치 (빈 공간)
  return {
    point: mousePoint,
    type: 'free'
  };
}; 