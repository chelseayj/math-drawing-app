import { Point, Shape } from '../types';
import { isTransformedShape } from './transformUtils';

// 점이 다각형 내부에 있는지 확인 (Ray casting algorithm)
export const isPointInPolygon = (point: Point, vertices: Point[]): boolean => {
  let inside = false;
  const { x, y } = point;
  
  for (let i = 0, j = vertices.length - 1; i < vertices.length; j = i++) {
    const xi = vertices[i].x;
    const yi = vertices[i].y;
    const xj = vertices[j].x;
    const yj = vertices[j].y;
    
    if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) {
      inside = !inside;
    }
  }
  
  return inside;
};

// 점이 도형 내부에 있는지 확인
export const isPointInShape = (point: Point, shape: Shape): boolean => {
  const { x, y, width, height, type } = shape;
  
  switch (type) {
    case 'rectangle':
      // 변형된 사각형인 경우 polygon 내부 검사
      if (isTransformedShape(shape)) {
        return isPointInPolygon(point, shape.vertices);
      }
      // 일반 사각형
      return point.x >= x && point.x <= x + width && 
             point.y >= y && point.y <= y + height;
    
    case 'circle':
      const centerX = x + width / 2;
      const centerY = y + height / 2;
      const radiusX = width / 2;
      const radiusY = height / 2;
      
      // 타원 내부 검사
      const dx = (point.x - centerX) / radiusX;
      const dy = (point.y - centerY) / radiusY;
      return (dx * dx + dy * dy) <= 1;
    
    case 'triangle':
      // 변형된 삼각형인 경우 polygon 내부 검사
      if (isTransformedShape(shape)) {
        return isPointInPolygon(point, shape.vertices);
      }
      // 일반 삼각형 (간단한 bounding box 검사)
      return point.x >= x && point.x <= x + width && 
             point.y >= y && point.y <= y + height;
    
    default:
      return false;
  }
}; 