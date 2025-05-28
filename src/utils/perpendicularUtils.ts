import { Point, Shape, LineSegment, PerpendicularSnap } from '../types';
import { getLineProjection, getPerpendicularSnapInfo } from './lineUtils';
import { getShapeEdges } from './shapeUtils';

// 점에서 선분에 내린 수선의 발 계산 (단순화)
export const getPerpendicularPoint = (
  point: Point,
  lineStart: Point,
  lineEnd: Point
): Point => {
  const { projectedPoint } = getLineProjection(point, lineStart, lineEnd);
  return projectedPoint;
};

// 수선 스냅 대상 찾기 (선분들)
export const findPerpendicularSnapToLines = (
  sourcePoint: Point,
  lines: LineSegment[],
  tolerance: number = 15
): PerpendicularSnap | null => {
  let bestSnap: PerpendicularSnap | null = null;
  let minDistance = Infinity;

  for (const line of lines) {
    const snapInfo = getPerpendicularSnapInfo(sourcePoint, line.startPoint, line.endPoint);
    
    if (snapInfo.distanceToSegment <= 3) {
      if (snapInfo.distance >= 20 && snapInfo.distance <= 300 && snapInfo.distance < minDistance) {
        bestSnap = {
          point: snapInfo.perpendicularPoint,
          targetType: 'line',
          targetId: line.id,
          targetStart: line.startPoint,
          targetEnd: line.endPoint,
          sourcePoint
        };
        minDistance = snapInfo.distance;
      }
    }
  }

  return bestSnap;
};

// 수선 스냅 대상 찾기 (도형 변들)
export const findPerpendicularSnapToShapeEdges = (
  sourcePoint: Point,
  shapes: Shape[],
  tolerance: number = 15
): PerpendicularSnap | null => {
  let bestSnap: PerpendicularSnap | null = null;
  let minDistance = Infinity;

  for (const shape of shapes) {
    const edges = getShapeEdges(shape);
    
    for (const edge of edges) {
      const snapInfo = getPerpendicularSnapInfo(sourcePoint, edge.start, edge.end);
      
      if (snapInfo.distanceToSegment <= 3) {
        if (snapInfo.distance >= 20 && snapInfo.distance <= 300 && snapInfo.distance < minDistance) {
          bestSnap = {
            point: snapInfo.perpendicularPoint,
            targetType: 'edge',
            targetId: shape.id,
            targetStart: edge.start,
            targetEnd: edge.end,
            sourcePoint
          };
          minDistance = snapInfo.distance;
        }
      }
    }
  }

  return bestSnap;
}; 