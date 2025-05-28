import { useCallback } from 'react';
import { Point } from '../types';

// 마우스 이벤트 관련 훅
export const useMouseEvents = () => {
  // 마우스 좌표를 캔버스 좌표로 변환
  const getCanvasPoint = useCallback((e: React.MouseEvent): Point => {
    const rect = e.currentTarget.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }, []);

  return {
    getCanvasPoint
  };
}; 