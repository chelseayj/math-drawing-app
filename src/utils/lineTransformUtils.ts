import { Point, Shape, LineSegment } from '../types';
import { getShapeVertices } from './transformUtils';
import { calculateDistance } from './geometryUtils';

// 상대적 위치 인터페이스
interface RelativePosition {
  edgeIndex: number;
  ratio: number;
}

// 선분의 변형된 위치 계산
export const calculateTransformedLinePosition = (
  line: LineSegment,
  originalShape: Shape,
  transformedShape: Shape
): Partial<LineSegment> | null => {
  let updates: Partial<LineSegment> = {};
  let hasUpdates = false;

  // 시작점 업데이트
  if (line.startReference === originalShape.id) {
    const newStartPoint = calculateLineEndpointPosition(
      line.startPoint,
      line.startType,
      originalShape,
      transformedShape
    );
    if (newStartPoint) {
      updates.startPoint = newStartPoint;
      hasUpdates = true;
    }
  }

  // 끝점 업데이트
  if (line.endReference === originalShape.id) {
    const newEndPoint = calculateLineEndpointPosition(
      line.endPoint,
      line.endType,
      originalShape,
      transformedShape
    );
    if (newEndPoint) {
      updates.endPoint = newEndPoint;
      hasUpdates = true;
    }
  }

  return hasUpdates ? updates : null;
};

// 선분 끝점의 새로운 위치 계산
const calculateLineEndpointPosition = (
  originalPoint: Point,
  pointType: 'point' | 'edge' | 'line' | 'free',
  originalShape: Shape,
  transformedShape: Shape
): Point | null => {
  switch (pointType) {
    case 'edge':
      // 테두리 점: 상대적 위치 유지
      const relativePos = calculateRelativePositionOnShape(originalPoint, originalShape);
      if (relativePos) {
        return calculateAbsolutePositionOnShape(relativePos, transformedShape);
      }
      break;

    case 'point':
      // 기하학적 점: 별도 처리 필요 (점 업데이트에서 처리됨)
      return null;

    case 'free':
    case 'line':
    default:
      // 자유 점이나 다른 선분 위의 점은 변환하지 않음
      return null;
  }

  return null;
};

// 도형에서 점의 상대적 위치 계산 (0~1 범위)
const calculateRelativePositionOnShape = (point: Point, shape: Shape): RelativePosition | null => {
  const vertices = getShapeVertices(shape);
  
  if (vertices.length === 0) return null;

  // 가장 가까운 변 찾기
  let closestEdge = 0;
  let minDistance = Infinity;
  let closestPointOnEdge: Point | null = null;

  for (let i = 0; i < vertices.length; i++) {
    const start = vertices[i];
    const end = vertices[(i + 1) % vertices.length];
    
    const pointOnEdge = getClosestPointOnLineSegment(point, start, end);
    const distance = calculateDistance(point, pointOnEdge);
    
    if (distance < minDistance) {
      minDistance = distance;
      closestEdge = i;
      closestPointOnEdge = pointOnEdge;
    }
  }

  if (!closestPointOnEdge) return null;

  // 변에서의 상대적 위치 계산 (0~1)
  const edgeStart = vertices[closestEdge];
  const edgeEnd = vertices[(closestEdge + 1) % vertices.length];
  const edgeLength = calculateDistance(edgeStart, edgeEnd);
  
  if (edgeLength === 0) return null;
  
  const distanceFromStart = calculateDistance(edgeStart, closestPointOnEdge);
  const ratio = distanceFromStart / edgeLength;

  return {
    edgeIndex: closestEdge,
    ratio: Math.max(0, Math.min(1, ratio))
  };
};

// 상대적 위치를 절대 좌표로 변환
const calculateAbsolutePositionOnShape = (
  relativePos: RelativePosition,
  shape: Shape
): Point | null => {
  const vertices = getShapeVertices(shape);
  
  if (relativePos.edgeIndex >= vertices.length) return null;

  const edgeStart = vertices[relativePos.edgeIndex];
  const edgeEnd = vertices[(relativePos.edgeIndex + 1) % vertices.length];

  // 선형 보간으로 절대 위치 계산
  return {
    x: edgeStart.x + (edgeEnd.x - edgeStart.x) * relativePos.ratio,
    y: edgeStart.y + (edgeEnd.y - edgeStart.y) * relativePos.ratio
  };
};

// 선분 위의 가장 가까운 점 계산
const getClosestPointOnLineSegment = (point: Point, start: Point, end: Point): Point => {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const length = dx * dx + dy * dy;

  if (length === 0) return start;

  const t = Math.max(0, Math.min(1, 
    ((point.x - start.x) * dx + (point.y - start.y) * dy) / length
  ));

  return {
    x: start.x + t * dx,
    y: start.y + t * dy
  };
}; 