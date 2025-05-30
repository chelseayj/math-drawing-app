import { Point, Shape, GeometryPoint } from '../types';
import { getShapeVertices } from './transformUtils';
import { calculateDistance, getShapeCenter } from './geometryUtils';

// 상대적 위치 인터페이스
interface RelativePosition {
  edgeIndex: number;
  ratio: number;
}

// 도형 변형 시 점의 새로운 위치 계산
export const calculateTransformedPointPosition = (
  point: GeometryPoint,
  originalShape: Shape,
  transformedShape: Shape
): Point | null => {
  if (point.shapeId !== originalShape.id) {
    return null; // 다른 도형의 점은 변환하지 않음
  }

  const transformedVertices = getShapeVertices(transformedShape);

  switch (point.type) {
    case 'center':
      // 중심점: 새로운 중심점으로 이동
      return getShapeCenter(transformedShape);

    case 'vertex':
      // 꼭짓점: 해당 인덱스의 새로운 꼭짓점 위치
      if (point.vertexIndex !== undefined && point.vertexIndex < transformedVertices.length) {
        return transformedVertices[point.vertexIndex];
      }
      break;

    case 'edge':
      // 테두리 점: 비례적 위치 계산
      return calculateTransformedEdgePoint(point, originalShape, transformedShape);

    default:
      break;
  }

  return null;
};

// 테두리 점의 변형된 위치 계산
const calculateTransformedEdgePoint = (
  point: GeometryPoint,
  originalShape: Shape,
  transformedShape: Shape
): Point | null => {
  // 원래 도형에서 점의 상대적 위치 계산
  const relativePosition = calculateRelativePositionOnShape(point.position, originalShape);
  if (!relativePosition) return null;

  // 변형된 도형에서 같은 상대적 위치의 절대 좌표 계산
  return calculateAbsolutePositionOnShape(relativePosition, transformedShape);
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