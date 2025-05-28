import { Point, Shape } from '../types';
import { 
  calculateDistance, 
  getShapeCenter, 
  getTriangleVerticesAuto,
  getPointOnEllipse 
} from './geometryUtils';
import { getClosestPointOnLineSegment } from './lineUtils';
import { isTransformedShape } from './transformUtils';
import { TRANSFORM_CONSTANTS } from '../constants';

// 공통 함수: 여러 변에서 가장 가까운 점 찾기
const findClosestPointOnEdges = (
  point: Point, 
  edges: { start: Point; end: Point }[], 
  tolerance: number
): Point | null => {
  let closestPoint: Point | null = null;
  let minDistance = tolerance;
  
  edges.forEach(edge => {
    const closest = getClosestPointOnLineSegment(point, edge.start, edge.end);
    const distance = calculateDistance(point, closest);
    
    if (distance <= tolerance && distance < minDistance) {
      closestPoint = closest;
      minDistance = distance;
    }
  });
  
  return closestPoint;
};

// 도형의 모든 변 가져오기
export const getShapeEdges = (shape: Shape): { start: Point; end: Point }[] => {
  const { x, y, width, height, type } = shape;
  
  switch (type) {
    case 'rectangle':
      // 변형된 사각형인 경우
      if (isTransformedShape(shape)) {
        const vertices = shape.vertices;
        return [
          { start: vertices[0], end: vertices[1] },
          { start: vertices[1], end: vertices[2] },
          { start: vertices[2], end: vertices[3] },
          { start: vertices[3], end: vertices[0] }
        ];
      }
      // 일반 사각형
      return [
        { start: { x, y }, end: { x: x + width, y } },
        { start: { x: x + width, y }, end: { x: x + width, y: y + height } },
        { start: { x: x + width, y: y + height }, end: { x, y: y + height } },
        { start: { x, y: y + height }, end: { x, y } }
      ];
    
    case 'triangle':
      // 변형된 삼각형인 경우
      if (isTransformedShape(shape)) {
        const vertices = shape.vertices;
        return [
          { start: vertices[0], end: vertices[1] },
          { start: vertices[1], end: vertices[2] },
          { start: vertices[2], end: vertices[0] }
        ];
      }
      // 일반 삼각형
      const vertices = getTriangleVerticesAuto(shape);
      return [
        { start: vertices[0], end: vertices[1] },
        { start: vertices[1], end: vertices[2] },
        { start: vertices[2], end: vertices[0] }
      ];
    
    case 'circle':
      // 원을 16개 선분으로 근사
      const centerX = x + width / 2;
      const centerY = y + height / 2;
      const radiusX = width / 2;
      const radiusY = height / 2;
      const segments = 16;
      const edges: { start: Point; end: Point }[] = [];
      
      for (let i = 0; i < segments; i++) {
        const angle1 = (i * 2 * Math.PI) / segments;
        const angle2 = ((i + 1) * 2 * Math.PI) / segments;
        
        edges.push({
          start: {
            x: centerX + radiusX * Math.cos(angle1),
            y: centerY + radiusY * Math.sin(angle1)
          },
          end: {
            x: centerX + radiusX * Math.cos(angle2),
            y: centerY + radiusY * Math.sin(angle2)
          }
        });
      }
      
      return edges;
    
    default:
      return [];
  }
};

// 점이 도형의 테두리 위에 있는지 확인하고 정확한 테두리 위치 반환
export const getClosestPointOnShapeEdge = (point: Point, shape: Shape, tolerance: number = TRANSFORM_CONSTANTS.EDGE_TOLERANCE): Point | null => {
  const { x, y, width, height, type } = shape;
  
  switch (type) {
    case 'rectangle':
      // 변형된 사각형인지 확인
      if (isTransformedShape(shape)) {
        // 변형된 사각형: 실제 변들 사용
        const edges = getShapeEdges(shape);
        return findClosestPointOnEdges(point, edges, tolerance);
      } else {
        // 일반 사각형: 기존 로직
        const edges = [
          { start: { x, y }, end: { x: x + width, y } }, // 상단
          { start: { x: x + width, y }, end: { x: x + width, y: y + height } }, // 우측
          { start: { x: x + width, y: y + height }, end: { x, y: y + height } }, // 하단
          { start: { x, y: y + height }, end: { x, y } } // 좌측
        ];
        return findClosestPointOnEdges(point, edges, tolerance);
      }
    
    case 'circle':
      const center = getShapeCenter(shape);
      const radiusX = width / 2;
      const radiusY = height / 2;
      
      // 타원의 경우 복잡하므로 원으로 근사
      const avgRadius = (radiusX + radiusY) / 2;
      const distance = calculateDistance(point, center);
      
      if (Math.abs(distance - avgRadius) <= tolerance) {
        // 타원 테두리 위의 정확한 점 계산
        return getPointOnEllipse(center, radiusX, radiusY, point);
      }
      
      return null;
    
    case 'triangle':
      // 변형된 삼각형인지 확인
      if (isTransformedShape(shape)) {
        // 변형된 삼각형: 실제 변들 사용
        const edges = getShapeEdges(shape);
        return findClosestPointOnEdges(point, edges, tolerance);
      } else {
        // 일반 삼각형: 기존 로직
        const vertices = getTriangleVerticesAuto(shape);
        const triangleEdges = [
          { start: vertices[0], end: vertices[1] },
          { start: vertices[1], end: vertices[2] },
          { start: vertices[2], end: vertices[0] }
        ];
        return findClosestPointOnEdges(point, triangleEdges, tolerance);
      }
    
    default:
      return null;
  }
};

// 점이 도형의 테두리 위에 있는지 확인
export const isPointOnShapeEdge = (point: Point, shape: Shape, tolerance: number = 5): boolean => {
  return getClosestPointOnShapeEdge(point, shape, tolerance) !== null;
}; 