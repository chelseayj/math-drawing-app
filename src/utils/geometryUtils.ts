import { Point, Shape } from '../types';

// 두 점 사이의 거리 계산
export const calculateDistance = (point1: Point, point2: Point): number => {
  return Math.sqrt(
    Math.pow(point1.x - point2.x, 2) + Math.pow(point1.y - point2.y, 2)
  );
};

// 도형의 중심점 계산
export const getShapeCenter = (shape: Shape): Point => {
  const { x, y, width, height } = shape;
  return {
    x: x + width / 2,
    y: y + height / 2
  };
};

// 정삼각형 높이 계산
export const getEquilateralTriangleHeight = (side: number): number => {
  return (side * Math.sqrt(3)) / 2;
};

// 정삼각형 꼭짓점 계산
export const getEquilateralTriangleVertices = (x: number, y: number, width: number, height: number): Point[] => {
  const side = width;
  const triangleHeight = getEquilateralTriangleHeight(side);
  const centerX = x + side / 2;
  const topY = y + (height - triangleHeight) / 2;
  const bottomY = topY + triangleHeight;
  
  return [
    { x: centerX, y: topY },      // 상단 꼭짓점
    { x: x, y: bottomY },         // 좌하단 꼭짓점
    { x: x + side, y: bottomY }   // 우하단 꼭짓점
  ];
};

// 일반 삼각형 꼭짓점 계산
export const getTriangleVertices = (x: number, y: number, width: number, height: number): Point[] => {
  return [
    { x: x + width / 2, y },      // 상단 꼭짓점
    { x, y: y + height },         // 좌하단 꼭짓점
    { x: x + width, y: y + height } // 우하단 꼭짓점
  ];
};

// 삼각형 꼭짓점 계산 (정삼각형/일반삼각형 자동 판별)
export const getTriangleVerticesAuto = (shape: Shape): Point[] => {
  const { x, y, width, height } = shape;
  const isRegular = width === height;
  
  return isRegular 
    ? getEquilateralTriangleVertices(x, y, width, height)
    : getTriangleVertices(x, y, width, height);
};

// 삼각형 무게중심 계산
export const getTriangleCentroid = (vertices: Point[]): Point => {
  return {
    x: (vertices[0].x + vertices[1].x + vertices[2].x) / 3,
    y: (vertices[0].y + vertices[1].y + vertices[2].y) / 3
  };
};

// 원/타원의 테두리 위 점 계산
export const getPointOnEllipse = (center: Point, radiusX: number, radiusY: number, direction: Point): Point => {
  const dx = direction.x - center.x;
  const dy = direction.y - center.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  
  if (distance === 0) {
    return { x: center.x + radiusX, y: center.y };
  }
  
  const normalizedDx = dx / distance;
  const normalizedDy = dy / distance;
  
  return {
    x: center.x + normalizedDx * radiusX,
    y: center.y + normalizedDy * radiusY
  };
}; 