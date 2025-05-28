import { Point, Shape, TransformedTriangle, TransformedRectangle } from '../types';
import { getTriangleVerticesAuto } from './geometryUtils';
import { TRANSFORM_CONSTANTS } from '../constants';
import { findRightAnglePosition } from './triangleTransformUtils';
import { createParallelogramTransform } from './rectangleTransformUtils';

// 도형이 변형된 상태인지 확인
export const isTransformedShape = (shape: Shape): shape is TransformedTriangle | TransformedRectangle => {
  return 'isTransformed' in shape && shape.isTransformed === true;
};

// 도형의 꼭짓점들 가져오기 (변형된 도형과 일반 도형 모두 지원)
export const getShapeVertices = (shape: Shape): Point[] => {
  // 변형된 도형인 경우 저장된 꼭짓점 반환
  if (isTransformedShape(shape)) {
    return [...shape.vertices];
  }
  
  // 일반 도형인 경우 계산된 꼭짓점 반환
  const { x, y, width, height, type } = shape;
  
  switch (type) {
    case 'rectangle':
      return [
        { x, y }, // 좌상단
        { x: x + width, y }, // 우상단
        { x: x + width, y: y + height }, // 우하단
        { x, y: y + height } // 좌하단
      ];
    
    case 'triangle':
      return getTriangleVerticesAuto(shape);
    
    case 'circle':
      return []; // 원은 변형 불가
    
    default:
      return [];
  }
};

// 마우스 위치에서 가장 가까운 꼭짓점 찾기
export const findNearestVertex = (
  mousePoint: Point, 
  shape: Shape, 
  tolerance: number = TRANSFORM_CONSTANTS.VERTEX_TOLERANCE
): { vertexIndex: number; vertex: Point } | null => {
  const vertices = getShapeVertices(shape);
  
  let nearestIndex = -1;
  let minDistance = tolerance;
  
  for (let i = 0; i < vertices.length; i++) {
    const vertex = vertices[i];
    const distance = Math.sqrt(
      Math.pow(mousePoint.x - vertex.x, 2) + 
      Math.pow(mousePoint.y - vertex.y, 2)
    );
    
    if (distance <= minDistance) {
      nearestIndex = i;
      minDistance = distance;
    }
  }
  
  if (nearestIndex >= 0) {
    return {
      vertexIndex: nearestIndex,
      vertex: vertices[nearestIndex]
    };
  }
  
  return null;
};

// 꼭짓점 하나만 이동하여 도형 업데이트 (올바른 변형 로직)
export const updateShapeWithVertex = (
  shape: Shape, 
  vertexIndex: number, 
  newPosition: Point,
  isShiftPressed: boolean = false
): Shape => {
  const vertices = getShapeVertices(shape);
  
  if (vertexIndex < 0 || vertexIndex >= vertices.length) {
    return shape; // 잘못된 인덱스
  }
  
  let finalPosition = newPosition;
  let newVertices = [...vertices];
  
  // Shift 키가 눌린 경우 특별한 변형 적용
  if (isShiftPressed) {
    if (shape.type === 'triangle') {
      // 삼각형: 직각삼각형 스냅
      finalPosition = findRightAnglePosition(vertices, vertexIndex, newPosition);
    } else if (shape.type === 'rectangle') {
      // 사각형: 평행사변형 변형
      const result = createParallelogramTransform(vertices as [Point, Point, Point, Point], vertexIndex, newPosition);
      newVertices = result.vertices;
      finalPosition = result.draggedVertex;
    }
  }
  
  // 새로운 꼭짓점 배열 생성 (선택된 꼭짓점만 변경, 사각형 평행사변형의 경우 이미 처리됨)
  if (!isShiftPressed || shape.type !== 'rectangle') {
    newVertices[vertexIndex] = finalPosition;
  }
  
  // 변형된 도형으로 변환
  switch (shape.type) {
    case 'rectangle':
      return createTransformedRectangle(shape, newVertices as [Point, Point, Point, Point]);
    
    case 'triangle':
      return createTransformedTriangle(shape, newVertices as [Point, Point, Point]);
    
    default:
      return shape;
  }
};

// 변형된 사각형 생성
const createTransformedRectangle = (
  originalShape: Shape, 
  vertices: [Point, Point, Point, Point]
): TransformedRectangle => {
  // bounding box 계산 (렌더링용)
  const minX = Math.min(...vertices.map(v => v.x));
  const maxX = Math.max(...vertices.map(v => v.x));
  const minY = Math.min(...vertices.map(v => v.y));
  const maxY = Math.max(...vertices.map(v => v.y));
  
  return {
    ...originalShape,
    type: 'rectangle',
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
    vertices,
    isTransformed: true
  };
};

// 변형된 삼각형 생성
const createTransformedTriangle = (
  originalShape: Shape, 
  vertices: [Point, Point, Point]
): TransformedTriangle => {
  // bounding box 계산 (렌더링용)
  const minX = Math.min(...vertices.map(v => v.x));
  const maxX = Math.max(...vertices.map(v => v.x));
  const minY = Math.min(...vertices.map(v => v.y));
  const maxY = Math.max(...vertices.map(v => v.y));
  
  return {
    ...originalShape,
    type: 'triangle',
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
    vertices,
    isTransformed: true
  };
}; 