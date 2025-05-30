import { Point, Shape, SNAP_DISTANCE } from '../types';
import { 
  calculateDistance, 
  getShapeCenter, 
  getTriangleVerticesAuto, 
  getTriangleCentroid 
} from './geometryUtils';
import { isTransformedShape } from './transformUtils';

// 도형의 스냅 포인트들 (중심점, 꼭짓점) 가져오기
export const getShapeSnapPoints = (shape: Shape): { point: Point; type: 'center' | 'vertex'; vertexIndex?: number }[] => {
  const snapPoints: { point: Point; type: 'center' | 'vertex'; vertexIndex?: number }[] = [];
  
  switch (shape.type) {
    case 'rectangle':
      // 변형된 사각형인지 확인
      if (isTransformedShape(shape)) {
        // 변형된 사각형: 실제 꼭짓점들 사용
        const vertices = shape.vertices;
        
        // 무게중심 계산
        const centerX = vertices.reduce((sum, v) => sum + v.x, 0) / vertices.length;
        const centerY = vertices.reduce((sum, v) => sum + v.y, 0) / vertices.length;
        snapPoints.push({
          point: { x: centerX, y: centerY },
          type: 'center'
        });
        
        // 실제 꼭짓점들 추가
        vertices.forEach((vertex, index) => {
          snapPoints.push({ point: vertex, type: 'vertex', vertexIndex: index });
        });
      } else {
        // 일반 사각형: 기존 로직
        const { x, y, width, height } = shape;
        
        // 중심점 추가
        snapPoints.push({
          point: getShapeCenter(shape),
          type: 'center'
        });
        
        // 사각형의 네 꼭짓점
        snapPoints.push(
          { point: { x, y }, type: 'vertex', vertexIndex: 0 },
          { point: { x: x + width, y }, type: 'vertex', vertexIndex: 1 },
          { point: { x, y: y + height }, type: 'vertex', vertexIndex: 2 },
          { point: { x: x + width, y: y + height }, type: 'vertex', vertexIndex: 3 }
        );
      }
      break;
    
    case 'triangle':
      // 변형된 삼각형인지 확인
      if (isTransformedShape(shape)) {
        // 변형된 삼각형: 실제 꼭짓점들 사용
        const vertices = shape.vertices;
        
        // 무게중심 계산
        const centroid = getTriangleCentroid(vertices);
        snapPoints.push({
          point: centroid,
          type: 'center'
        });
        
        // 실제 꼭짓점들 추가
        vertices.forEach((vertex, index) => {
          snapPoints.push({ point: vertex, type: 'vertex', vertexIndex: index });
        });
      } else {
        // 일반 삼각형: 기존 로직
        const vertices = getTriangleVerticesAuto(shape);
        
        // 삼각형의 무게중심 계산
        const centroid = getTriangleCentroid(vertices);
        
        snapPoints.push({
          point: centroid,
          type: 'center'
        });
        
        // 세 꼭짓점 추가
        vertices.forEach((vertex, index) => {
          snapPoints.push({ point: vertex, type: 'vertex', vertexIndex: index });
        });
      }
      break;
    
    case 'circle':
      // 원은 변형되지 않으므로 기존 로직 유지
      const { x, y, width, height } = shape;
      
      // 중심점 추가
      snapPoints.push({
        point: getShapeCenter(shape),
        type: 'center'
      });
      
      // 원의 상하좌우 점들
      const center = getShapeCenter(shape);
      snapPoints.push(
        { point: { x: center.x, y }, type: 'vertex', vertexIndex: 0 }, // 상단
        { point: { x: center.x, y: y + height }, type: 'vertex', vertexIndex: 1 }, // 하단
        { point: { x, y: center.y }, type: 'vertex', vertexIndex: 2 }, // 좌측
        { point: { x: x + width, y: center.y }, type: 'vertex', vertexIndex: 3 } // 우측
      );
      break;
  }
  
  return snapPoints;
};

// 가장 가까운 스냅 포인트 찾기
export const findNearestSnapPoint = (
  mousePoint: Point, 
  shapes: Shape[]
): { point: Point; type: 'center' | 'vertex'; shapeId: string; vertexIndex?: number } | null => {
  let bestMatch: { point: Point; type: 'center' | 'vertex'; shapeId: string; vertexIndex?: number } | null = null;
  let minDistance = SNAP_DISTANCE;
  
  for (const shape of shapes) {
    const snapPoints = getShapeSnapPoints(shape);
    
    for (const { point, type, vertexIndex } of snapPoints) {
      const distance = calculateDistance(mousePoint, point);
      
      if (distance <= minDistance) {
        bestMatch = { point, type, shapeId: shape.id, vertexIndex };
        minDistance = distance;
      }
    }
  }
  
  return bestMatch;
}; 