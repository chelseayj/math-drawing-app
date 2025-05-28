import { Point } from '../types';

// 사각형에서 평행사변형 변형 생성 (완전히 새로운 알고리즘)
export const createParallelogramTransform = (
  vertices: [Point, Point, Point, Point], 
  dragVertexIndex: number, 
  newPosition: Point
): { vertices: Point[]; draggedVertex: Point } => {
  // 가능한 모든 평행사변형 후보들을 계산
  const possibleParallelograms = findAllPossibleParallelograms(vertices, dragVertexIndex, newPosition);
  
  // 마우스 위치에서 가장 가까운 평행사변형 선택
  if (possibleParallelograms.length === 0) {
    // 평행사변형을 만들 수 없는 경우 원래 위치 유지
    const newVertices = [...vertices];
    newVertices[dragVertexIndex] = newPosition;
    return {
      vertices: newVertices,
      draggedVertex: newPosition
    };
  }
  
  let closestParallelogram = possibleParallelograms[0];
  let minDistance = calculateParallelogramDistance(possibleParallelograms[0], newPosition);
  
  for (let i = 1; i < possibleParallelograms.length; i++) {
    const distance = calculateParallelogramDistance(possibleParallelograms[i], newPosition);
    if (distance < minDistance) {
      minDistance = distance;
      closestParallelogram = possibleParallelograms[i];
    }
  }
  
  return {
    vertices: closestParallelogram.vertices,
    draggedVertex: closestParallelogram.vertices[dragVertexIndex]
  };
};

// 모든 가능한 평행사변형 후보들 찾기
const findAllPossibleParallelograms = (
  vertices: [Point, Point, Point, Point],
  dragVertexIndex: number,
  newPosition: Point
): Array<{ vertices: Point[]; adjustedVertexIndex: number }> => {
  const parallelograms: Array<{ vertices: Point[]; adjustedVertexIndex: number }> = [];
  
  // 드래그된 꼭짓점을 새 위치로 고정
  const baseVertices = [...vertices];
  baseVertices[dragVertexIndex] = newPosition;
  
  // 나머지 3개 꼭짓점 중 하나씩 조정하여 평행사변형 만들기
  for (let adjustIndex = 0; adjustIndex < 4; adjustIndex++) {
    if (adjustIndex === dragVertexIndex) continue; // 드래그된 꼭짓점은 제외
    
    const parallelogram = createParallelogramByAdjusting(baseVertices as [Point, Point, Point, Point], dragVertexIndex, adjustIndex);
    if (parallelogram) {
      parallelograms.push({
        vertices: parallelogram,
        adjustedVertexIndex: adjustIndex
      });
    }
  }
  
  return parallelograms;
};

// 특정 꼭짓점을 조정하여 평행사변형 만들기 (수평 대변 평행 조건 추가)
const createParallelogramByAdjusting = (
  vertices: [Point, Point, Point, Point],
  fixedIndex: number,
  adjustIndex: number
): Point[] | null => {
  const newVertices = [...vertices];
  
  // 수평 대변이 평행한 평행사변형만 생성
  // 꼭짓점 순서: [좌상단(0), 우상단(1), 우하단(2), 좌하단(3)]
  // 상단 변: 0-1, 하단 변: 3-2 (수평 평행)
  // 좌측 변: 0-3, 우측 변: 1-2 (기울어질 수 있음)
  
  const [v0, v1, v2, v3] = vertices;
  
  try {
    switch (adjustIndex) {
      case 0: // v0 조정 - 상단 변을 수평으로 유지
        // 상단 변(v0-v1)이 수평이 되도록 v0의 y좌표를 v1과 맞춤
        // 하단 변(v3-v2)과 평행하도록 v0의 x좌표 조정
        const bottomWidth = v2.x - v3.x; // 하단 변의 너비
        newVertices[0] = {
          x: v1.x - bottomWidth, // 하단 변과 같은 너비로 상단 변 생성
          y: v1.y // 상단 변을 수평으로 유지
        };
        break;
        
      case 1: // v1 조정 - 상단 변을 수평으로 유지
        const bottomWidth1 = v2.x - v3.x;
        newVertices[1] = {
          x: v0.x + bottomWidth1, // 하단 변과 같은 너비로 상단 변 생성
          y: v0.y // 상단 변을 수평으로 유지
        };
        break;
        
      case 2: // v2 조정 - 하단 변을 수평으로 유지
        const topWidth = v1.x - v0.x; // 상단 변의 너비
        newVertices[2] = {
          x: v3.x + topWidth, // 상단 변과 같은 너비로 하단 변 생성
          y: v3.y // 하단 변을 수평으로 유지
        };
        break;
        
      case 3: // v3 조정 - 하단 변을 수평으로 유지
        const topWidth1 = v1.x - v0.x;
        newVertices[3] = {
          x: v2.x - topWidth1, // 상단 변과 같은 너비로 하단 변 생성
          y: v2.y // 하단 변을 수평으로 유지
        };
        break;
        
      default:
        return null;
    }
    
    // 생성된 평행사변형이 유효한지 검증
    if (isValidHorizontalParallelogram(newVertices as [Point, Point, Point, Point])) {
      return newVertices;
    } else {
      return null;
    }
  } catch (error) {
    return null;
  }
};

// 수평 대변이 평행한 유효한 평행사변형인지 검증
const isValidHorizontalParallelogram = (vertices: [Point, Point, Point, Point]): boolean => {
  const [v0, v1, v2, v3] = vertices;
  
  // 1. 상단 변과 하단 변이 수평인지 확인
  const topIsHorizontal = Math.abs(v1.y - v0.y) < 0.001; // 부동소수점 오차 허용
  const bottomIsHorizontal = Math.abs(v2.y - v3.y) < 0.001;
  
  if (!topIsHorizontal || !bottomIsHorizontal) {
    return false;
  }
  
  // 2. 상단 변과 하단 변의 길이가 같은지 확인 (평행사변형 조건)
  const topWidth = Math.abs(v1.x - v0.x);
  const bottomWidth = Math.abs(v2.x - v3.x);
  const widthDiff = Math.abs(topWidth - bottomWidth);
  
  if (widthDiff > 0.001) {
    return false;
  }
  
  // 3. 최소 크기 확인 (너무 작은 도형 방지)
  const minSize = 10;
  if (topWidth < minSize || Math.abs(v0.y - v3.y) < minSize) {
    return false;
  }
  
  return true;
};

// 평행사변형과 마우스 위치 사이의 거리 계산
const calculateParallelogramDistance = (
  parallelogram: { vertices: Point[]; adjustedVertexIndex: number },
  mousePosition: Point
): number => {
  // 조정된 꼭짓점과 마우스 위치 사이의 거리를 주요 기준으로 사용
  const adjustedVertex = parallelogram.vertices[parallelogram.adjustedVertexIndex];
  const primaryDistance = getDistance(adjustedVertex, mousePosition);
  
  // 전체 형태의 변화량도 고려 (가중치 적용)
  let totalShapeChange = 0;
  for (let i = 0; i < parallelogram.vertices.length; i++) {
    if (i !== parallelogram.adjustedVertexIndex) {
      // 다른 꼭짓점들의 변화량은 작은 가중치로 적용
      totalShapeChange += getDistance(parallelogram.vertices[i], parallelogram.vertices[i]) * 0.1;
    }
  }
  
  return primaryDistance + totalShapeChange;
};

// 두 점 사이의 거리 계산
const getDistance = (p1: Point, p2: Point): number => {
  return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
}; 