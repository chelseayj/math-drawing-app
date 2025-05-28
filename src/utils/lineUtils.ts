import { Point, LineSegment } from '../types';
import { calculateDistance } from './geometryUtils';

// 공통 벡터 계산 함수 (중복 제거용)
export const getLineProjection = (
  point: Point, 
  lineStart: Point, 
  lineEnd: Point
) => {
  const A = point.x - lineStart.x;
  const B = point.y - lineStart.y;
  const C = lineEnd.x - lineStart.x;
  const D = lineEnd.y - lineStart.y;
  
  const dot = A * C + B * D;
  const lenSq = C * C + D * D;
  
  if (lenSq === 0) return { param: 0, projectedPoint: lineStart };
  
  const param = dot / lenSq;
  return {
    param,
    projectedPoint: {
      x: lineStart.x + param * C,
      y: lineStart.y + param * D
    }
  };
};

// 점과 선분(두 점으로 정의) 사이의 가장 가까운 점 계산
export const getClosestPointOnLineSegment = (
  point: Point, 
  lineStart: Point, 
  lineEnd: Point
): Point => {
  const { param, projectedPoint } = getLineProjection(point, lineStart, lineEnd);
  const clampedParam = Math.max(0, Math.min(1, param));
  
  if (clampedParam === param) {
    return projectedPoint;
  }
  
  const C = lineEnd.x - lineStart.x;
  const D = lineEnd.y - lineStart.y;
  
  return {
    x: lineStart.x + clampedParam * C,
    y: lineStart.y + clampedParam * D
  };
};

// 수선 스냅 전용 정보 계산 (한 번에 모든 필요한 값 반환)
export const getPerpendicularSnapInfo = (
  sourcePoint: Point,
  lineStart: Point,
  lineEnd: Point
) => {
  const { projectedPoint } = getLineProjection(sourcePoint, lineStart, lineEnd);
  const closestOnSegment = getClosestPointOnLineSegment(projectedPoint, lineStart, lineEnd);
  
  return {
    perpendicularPoint: projectedPoint,
    closestOnSegment,
    distanceToSegment: calculateDistance(projectedPoint, closestOnSegment),
    distance: calculateDistance(sourcePoint, projectedPoint)
  };
};

// 점과 LineSegment 객체 사이의 가장 가까운 점 계산
export const getClosestPointOnLine = (point: Point, line: LineSegment): Point => {
  return getClosestPointOnLineSegment(point, line.startPoint, line.endPoint);
};

// 점과 선분 사이의 거리 계산
export const getDistanceToLineSegment = (
  point: Point, 
  lineStart: Point, 
  lineEnd: Point
): number => {
  const closestPoint = getClosestPointOnLineSegment(point, lineStart, lineEnd);
  return calculateDistance(point, closestPoint);
};

// 점과 LineSegment 객체 사이의 거리 계산
export const getDistanceToLine = (point: Point, line: LineSegment): number => {
  return getDistanceToLineSegment(point, line.startPoint, line.endPoint);
};

// 두 벡터가 직각을 이루는지 검사 (내적이 0에 가까운지 확인)
export const isPerpendicularToLine = (
  sourcePoint: Point,
  targetPoint: Point,
  lineStart: Point,
  lineEnd: Point,
  tolerance: number = 0.05
): boolean => {
  // 선분 벡터
  const lineVectorX = lineEnd.x - lineStart.x;
  const lineVectorY = lineEnd.y - lineStart.y;
  
  // 소스에서 타겟으로의 벡터
  const sourceToTargetX = targetPoint.x - sourcePoint.x;
  const sourceToTargetY = targetPoint.y - sourcePoint.y;
  
  // 벡터 정규화를 위한 길이 계산
  const lineLength = Math.sqrt(lineVectorX * lineVectorX + lineVectorY * lineVectorY);
  const sourceToTargetLength = Math.sqrt(sourceToTargetX * sourceToTargetX + sourceToTargetY * sourceToTargetY);
  
  // 길이가 0인 경우 처리
  if (lineLength === 0 || sourceToTargetLength === 0) return false;
  
  // 정규화된 벡터들의 내적 계산
  const dotProduct = (lineVectorX * sourceToTargetX + lineVectorY * sourceToTargetY) / (lineLength * sourceToTargetLength);
  
  // 내적이 0에 가까우면 직각
  return Math.abs(dotProduct) <= tolerance;
}; 