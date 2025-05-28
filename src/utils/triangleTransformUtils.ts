import { Point } from '../types';

// 삼각형에서 직각을 만드는 위치 찾기
export const findRightAnglePosition = (
  vertices: Point[], 
  dragVertexIndex: number, 
  mousePosition: Point
): Point => {
  const [v0, v1, v2] = vertices;
  const possiblePositions: Point[] = [];
  
  // 각 꼭짓점에서 직각을 만드는 경우들 계산
  if (dragVertexIndex === 0) {
    // v0을 움직여서 v0에서 직각 만들기
    const rightAngle1 = createRightAngleAt(v1, v2, v0);
    if (rightAngle1) possiblePositions.push(rightAngle1);
    
    // v0을 움직여서 v1에서 직각 만들기  
    const rightAngle2 = createRightAngleAt(v0, v2, v1);
    if (rightAngle2) possiblePositions.push(rightAngle2);
    
    // v0을 움직여서 v2에서 직각 만들기
    const rightAngle3 = createRightAngleAt(v0, v1, v2);
    if (rightAngle3) possiblePositions.push(rightAngle3);
  } else if (dragVertexIndex === 1) {
    // v1을 움직이는 경우
    const rightAngle1 = createRightAngleAt(v0, v2, v1);
    if (rightAngle1) possiblePositions.push(rightAngle1);
    
    const rightAngle2 = createRightAngleAt(v1, v2, v0);
    if (rightAngle2) possiblePositions.push(rightAngle2);
    
    const rightAngle3 = createRightAngleAt(v1, v0, v2);
    if (rightAngle3) possiblePositions.push(rightAngle3);
  } else if (dragVertexIndex === 2) {
    // v2를 움직이는 경우
    const rightAngle1 = createRightAngleAt(v0, v1, v2);
    if (rightAngle1) possiblePositions.push(rightAngle1);
    
    const rightAngle2 = createRightAngleAt(v2, v1, v0);
    if (rightAngle2) possiblePositions.push(rightAngle2);
    
    const rightAngle3 = createRightAngleAt(v2, v0, v1);
    if (rightAngle3) possiblePositions.push(rightAngle3);
  }
  
  // 마우스 위치에서 가장 가까운 직각 위치 선택
  if (possiblePositions.length === 0) {
    return mousePosition;
  }
  
  let closestPosition = possiblePositions[0];
  let minDistance = getDistance(mousePosition, closestPosition);
  
  for (let i = 1; i < possiblePositions.length; i++) {
    const distance = getDistance(mousePosition, possiblePositions[i]);
    if (distance < minDistance) {
      minDistance = distance;
      closestPosition = possiblePositions[i];
    }
  }
  
  return closestPosition;
};

// 특정 점에서 직각을 만드는 위치 계산
export const createRightAngleAt = (
  movingPoint: Point,
  fixedPoint1: Point, 
  rightAngleVertex: Point
): Point | null => {
  // rightAngleVertex에서 fixedPoint1로의 벡터
  const v1 = {
    x: fixedPoint1.x - rightAngleVertex.x,
    y: fixedPoint1.y - rightAngleVertex.y
  };
  
  // v1에 수직인 벡터 (90도 회전)
  const perpendicular = {
    x: -v1.y,
    y: v1.x
  };
  
  // movingPoint에서 rightAngleVertex로의 벡터를 perpendicular 방향으로 투영
  const toMoving = {
    x: movingPoint.x - rightAngleVertex.x,
    y: movingPoint.y - rightAngleVertex.y
  };
  
  // 투영 길이 계산
  const perpLength = Math.sqrt(perpendicular.x * perpendicular.x + perpendicular.y * perpendicular.y);
  if (perpLength === 0) return null;
  
  const projectionLength = (toMoving.x * perpendicular.x + toMoving.y * perpendicular.y) / perpLength;
  
  // 정규화된 수직 벡터
  const normalizedPerp = {
    x: perpendicular.x / perpLength,
    y: perpendicular.y / perpLength
  };
  
  // 직각을 만드는 새로운 위치
  return {
    x: rightAngleVertex.x + normalizedPerp.x * projectionLength,
    y: rightAngleVertex.y + normalizedPerp.y * projectionLength
  };
};

// 두 점 사이의 거리 계산
const getDistance = (p1: Point, p2: Point): number => {
  return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
}; 