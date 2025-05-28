import { useState, useCallback } from 'react';
import { LineSegment, Point } from '../types';
import { calculateDistance } from '../utils/geometryUtils';
import { getClosestPointOnLine, getDistanceToLine } from '../utils/lineUtils';

export const useLineManagement = () => {
  const [lines, setLines] = useState<LineSegment[]>([]);

  // 선분 추가 함수
  const addLine = useCallback((line: LineSegment) => {
    setLines(prev => [...prev, line]);
  }, []);

  // 선분 삭제 함수
  const deleteLine = useCallback((lineId: string) => {
    setLines(prev => prev.filter(l => l.id !== lineId));
  }, []);

  // 선분 업데이트 함수
  const updateLine = useCallback((lineId: string, updatedLine: LineSegment) => {
    setLines(prev => prev.map(l => 
      l.id === lineId ? updatedLine : l
    ));
  }, []);

  // 도형 삭제 시 관련 선분들도 삭제
  const deleteLinesByShape = useCallback((shapeId: string) => {
    setLines(prev => prev.filter(l => 
      l.startReference !== shapeId && l.endReference !== shapeId
    ));
  }, []);

  // 점 삭제 시 관련 선분들도 삭제
  const deleteLinesByPoint = useCallback((pointId: string) => {
    setLines(prev => prev.filter(l => 
      l.startReference !== pointId && l.endReference !== pointId
    ));
  }, []);

  // 전체 선분 삭제
  const clearAllLines = useCallback(() => {
    setLines([]);
  }, []);

  // 선분 클릭 감지 및 삭제
  const handleLineClick = useCallback((clickPoint: Point): boolean => {
    for (let i = lines.length - 1; i >= 0; i--) {
      const line = lines[i];
      const distance = getDistanceToLine(clickPoint, line);
      if (distance <= 5) { // 5px 허용 오차
        deleteLine(line.id);
        return true; // 선분이 클릭되었음을 알림
      }
    }
    return false; // 선분이 클릭되지 않았음
  }, [lines, deleteLine]);

  // 선분 위의 가장 가까운 점 찾기
  const findNearestPointOnLine = useCallback((mousePoint: Point, tolerance: number = 10): { point: Point; lineId: string } | null => {
    let bestMatch: { point: Point; lineId: string } | null = null;
    let minDistance = tolerance;

    for (const line of lines) {
      const closestPoint = getClosestPointOnLine(mousePoint, line);
      const distance = calculateDistance(mousePoint, closestPoint);
      
      if (distance <= tolerance && distance < minDistance) {
        bestMatch = { point: closestPoint, lineId: line.id };
        minDistance = distance;
      }
    }

    return bestMatch;
  }, [lines]);

  // 선분 생성 함수
  const createLine = useCallback((
    startPoint: Point,
    endPoint: Point,
    startType: LineSegment['startType'],
    endType: LineSegment['endType'],
    startReference?: string,
    endReference?: string
  ): LineSegment => {
    return {
      id: `line-${Date.now()}`,
      startPoint,
      endPoint,
      startType,
      endType,
      startReference,
      endReference
    };
  }, []);

  return {
    lines,
    addLine,
    deleteLine,
    updateLine,
    deleteLinesByShape,
    deleteLinesByPoint,
    clearAllLines,
    handleLineClick,
    findNearestPointOnLine,
    createLine
  };
};

// 중복 함수들 제거 (lineUtils.ts로 이동) 