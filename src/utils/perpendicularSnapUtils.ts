import { Point, Shape, GeometryPoint, LineSegment } from '../types';
import { calculateDistance } from './geometryUtils';
import { getClosestPointOnLineSegment, isPerpendicularToLine, getLineProjection } from './lineUtils';
import { getClosestPointOnShapeEdge, getShapeEdges } from './shapeEdgeUtils';

// 직각 보정이 포함된 스냅 타겟 찾기
export const findSnapTargetWithPerpendicularCorrection = (
  mousePoint: Point,
  shapes: Shape[],
  points: GeometryPoint[],
  lines: LineSegment[],
  lineStartPoint: Point,
  tolerance: number = 15
): {
  point: Point;
  type: 'edge' | 'line';
  reference: string;
  isPerpendicular: boolean;
  edgeInfo?: { start: Point; end: Point };
} | null => {
  // 도형 테두리 확인 (직각 검사 추가)
  for (const shape of shapes) {
    const edgePoint = getClosestPointOnShapeEdge(mousePoint, shape, tolerance);
    if (edgePoint) {
      const edges = getShapeEdges(shape);
      
      for (const edge of edges) {
        const closestOnEdge = getClosestPointOnLineSegment(edgePoint, edge.start, edge.end);
        const distanceToEdge = calculateDistance(edgePoint, closestOnEdge);
        
        // 이 변 위에 있는 점인지 확인 (5px 이내)
        if (distanceToEdge <= 5) {
          // 직각인지 검사
          if (isPerpendicularToLine(lineStartPoint, edgePoint, edge.start, edge.end)) {
            // 정확한 수선의 발 위치로 보정
            const { projectedPoint } = getLineProjection(lineStartPoint, edge.start, edge.end);
            return {
              point: projectedPoint,
              type: 'edge',
              reference: shape.id,
              isPerpendicular: true,
              edgeInfo: edge
            };
          }
        }
      }
      
      // 직각이 아닌 경우 일반 테두리 스냅
      return {
        point: edgePoint,
        type: 'edge',
        reference: shape.id,
        isPerpendicular: false
      };
    }
  }

  // 선분에 대해서도 직각 검사
  for (const line of lines) {
    const closestPoint = getClosestPointOnLineSegment(mousePoint, line.startPoint, line.endPoint);
    const distance = calculateDistance(mousePoint, closestPoint);
    if (distance <= tolerance) {
      const isPerpendicular = isPerpendicularToLine(lineStartPoint, closestPoint, line.startPoint, line.endPoint);
      let correctedPoint = closestPoint;
      
      if (isPerpendicular) {
        // 정확한 수선의 발 위치로 보정
        const { projectedPoint } = getLineProjection(lineStartPoint, line.startPoint, line.endPoint);
        correctedPoint = projectedPoint;
      }
      
      return {
        point: correctedPoint,
        type: 'line',
        reference: line.id,
        isPerpendicular
      };
    }
  }

  return null;
}; 