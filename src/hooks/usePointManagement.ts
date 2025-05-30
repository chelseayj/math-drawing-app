import { useState, useCallback } from 'react';
import { GeometryPoint, Point, Shape, POINT_RADIUS } from '../types';
import { 
  canPlacePointOnShape, 
  getNextLabel
} from '../utils/pointUtils';
import { calculateDistance } from '../utils/geometryUtils';

export const usePointManagement = () => {
  const [points, setPoints] = useState<GeometryPoint[]>([]);

  // 점 추가 함수
  const addPoint = useCallback((point: GeometryPoint) => {
    setPoints(prev => [...prev, point]);
  }, []);

  // 점 삭제 함수
  const deletePoint = useCallback((pointId: string) => {
    setPoints(prev => prev.filter(p => p.id !== pointId));
  }, []);

  // 점 업데이트 함수
  const updatePoint = useCallback((pointId: string, newPosition: Point) => {
    setPoints(prev => prev.map(p => 
      p.id === pointId ? { 
        ...p, 
        position: newPosition 
      } : p
    ));
  }, []);

  // 도형 삭제 시 해당 도형의 점들도 삭제
  const deletePointsByShape = useCallback((shapeId: string) => {
    setPoints(prev => prev.filter(p => p.shapeId !== shapeId));
  }, []);

  // 전체 점 삭제
  const clearAllPoints = useCallback(() => {
    setPoints([]);
  }, []);

  // 점 클릭 감지 및 삭제
  const handlePointClick = useCallback((clickPoint: Point): boolean => {
    for (let i = points.length - 1; i >= 0; i--) {
      const geometryPoint = points[i];
      const distance = calculateDistance(clickPoint, geometryPoint.position);
      if (distance <= POINT_RADIUS + 5) {
        deletePoint(geometryPoint.id);
        return true; // 점이 클릭되었음을 알림
      }
    }
    return false; // 점이 클릭되지 않았음
  }, [points, deletePoint]);

  // 점 생성 시도
  const tryCreatePoint = useCallback((clickPoint: Point, shapes: Shape[]): boolean => {
    const placement = canPlacePointOnShape(clickPoint, shapes);
    if (placement) {
      const shape = shapes.find(s => s.id === placement.shapeId);
      if (shape) {
        const label = getNextLabel(points, placement.shapeId);
        
        const newPoint: GeometryPoint = {
          id: `point-${Date.now()}`,
          position: placement.point,
          label,
          shapeId: placement.shapeId,
          type: placement.type,
          vertexIndex: placement.vertexIndex
        };
        
        addPoint(newPoint);
        return true; // 점이 생성되었음을 알림
      }
    }
    return false; // 점이 생성되지 않았음
  }, [points, addPoint]);

  return {
    points,
    addPoint,
    deletePoint,
    updatePoint,
    deletePointsByShape,
    clearAllPoints,
    handlePointClick,
    tryCreatePoint
  };
}; 