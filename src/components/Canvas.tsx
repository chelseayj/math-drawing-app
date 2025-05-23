import React, { useState, useRef, useEffect, forwardRef, useImperativeHandle, useCallback } from 'react';
import './Canvas.css';

interface Point {
  x: number;
  y: number;
  label: string;
  type: 'center' | 'edge' | 'vertex';
}

interface Length {
  value: number;
  unit: 'mm' | 'cm' | 'm';
}

interface LineSegment {
  startPoint: Point;
  endPoint: Point;
  length?: Length;
}

interface Angle {
  lines: [LineSegment, LineSegment];
  value: number;
  vertex: Point;
}

interface Shape {
  type: 'circle' | 'triangle' | 'rectangle';
  x: number;
  y: number;
  width: number;
  height: number;
  points: Point[];
  lines: LineSegment[];
  angles: Angle[];
  center?: { x: number; y: number };
  // 삼각형 전용 꼭짓점 좌표 (변형 도구에서만 사용됨)
  triangleVertices?: { x: number; y: number }[];
}

interface CanvasProps {
  selectedShape: 'circle' | 'triangle' | 'rectangle' | null;
  selectedTool: 'shape' | 'point' | 'line' | 'length' | 'angle' | 'transform';
  onClearShapes?: () => void;
}

export interface CanvasRef {
  clearAllShapes: () => void;
  undo: () => void;
}

// 점과 선분 사이의 거리를 계산하는 유틸리티 함수
const pointToLineDistance = (
  x: number,
  y: number,
  x1: number,
  y1: number,
  x2: number,
  y2: number
): number => {
  const A = x - x1;
  const B = y - y1;
  const C = x2 - x1;
  const D = y2 - y1;

  const dot = A * C + B * D;
  const lenSq = C * C + D * D;
  let param = -1;

  if (lenSq !== 0) {
    param = dot / lenSq;
  }

  let xx, yy;

  if (param < 0) {
    xx = x1;
    yy = y1;
  } else if (param > 1) {
    xx = x2;
    yy = y2;
  } else {
    xx = x1 + param * C;
    yy = y1 + param * D;
  }

  const dx = x - xx;
  const dy = y - yy;

  return Math.sqrt(dx * dx + dy * dy);
};

interface ClosestLine {
  line: LineSegment;
  shapeIndex: number;
  distance: number;
}

// 점과 선분 사이의 거리를 계산하는 함수 아래에 추가
const isPointNearTriangleEdge = (
  mouseX: number,
  mouseY: number,
  x1: number,
  y1: number,
  x2: number,
  y2: number
): boolean => {
  const distance = pointToLineDistance(mouseX, mouseY, x1, y1, x2, y2);
  return distance < 10;
};

const getTriangleEdgePoint = (
  mouseX: number,
  mouseY: number,
  x1: number,
  y1: number,
  x2: number,
  y2: number
): { x: number; y: number } => {
  const A = x2 - x1;
  const B = y2 - y1;
  const C = A * A + B * B;
  const t = Math.max(0, Math.min(1, ((mouseX - x1) * A + (mouseY - y1) * B) / C));
  return {
    x: x1 + t * A,
    y: y1 + t * B
  };
};

// 선분과 선분 사이의 각도를 계산하는 함수
const calculateAngleBetweenLines = (
  line1Start: { x: number; y: number },
  line1End: { x: number; y: number },
  line2Start: { x: number; y: number },
  line2End: { x: number; y: number }
): number => {
  // 공통 꼭짓점 찾기
  let vertex: { x: number; y: number };
  
  // 첫번째 선분의 끝점이 두번째 선분의 끝점과 같으면
  if (Math.abs(line1End.x - line2End.x) < 0.001 && Math.abs(line1End.y - line2End.y) < 0.001) {
    vertex = line1End;
    // 방향을 맞추기 위해 line2의 시작점과 끝점을 바꿈
    [line2Start, line2End] = [line2End, line2Start];
  } 
  // 첫번째 선분의 끝점이 두번째 선분의 시작점과 같으면
  else if (Math.abs(line1End.x - line2Start.x) < 0.001 && Math.abs(line1End.y - line2Start.y) < 0.001) {
    vertex = line1End;
  }
  // 첫번째 선분의 시작점이 두번째 선분의 시작점과 같으면 
  else if (Math.abs(line1Start.x - line2Start.x) < 0.001 && Math.abs(line1Start.y - line2Start.y) < 0.001) {
    vertex = line1Start;
    // 방향을 맞추기 위해 line1의 시작점과 끝점을 바꿈
    [line1Start, line1End] = [line1End, line1Start];
  }
  // 첫번째 선분의 시작점이 두번째 선분의 끝점과 같으면
  else if (Math.abs(line1Start.x - line2End.x) < 0.001 && Math.abs(line1Start.y - line2End.y) < 0.001) {
    vertex = line1Start;
    // 방향을 맞추기 위해 두 선분의 시작점과 끝점을 모두 바꿈
    [line1Start, line1End] = [line1End, line1Start];
    [line2Start, line2End] = [line2End, line2Start];
  }
  else {
    // 공통 꼭짓점이 없는 경우
    return -1;
  }
  
  // 두 벡터 계산
  const vector1 = {
    x: line1Start.x - vertex.x,
    y: line1Start.y - vertex.y
  };
  
  const vector2 = {
    x: line2End.x - vertex.x,
    y: line2End.y - vertex.y
  };
  
  // 두 벡터의 내적
  const dotProduct = vector1.x * vector2.x + vector1.y * vector2.y;
  
  // 두 벡터의 크기
  const magnitude1 = Math.sqrt(vector1.x * vector1.x + vector1.y * vector1.y);
  const magnitude2 = Math.sqrt(vector2.x * vector2.x + vector2.y * vector2.y);
  
  // 두 벡터 사이의 각도 계산 (라디안)
  const cosAngle = dotProduct / (magnitude1 * magnitude2);
  
  // 오차를 보정하여 -1과 1 사이의 값으로 제한
  const clampedCosAngle = Math.max(-1, Math.min(1, cosAngle));
  
  // 라디안에서 각도로 변환
  let angleDegrees = Math.acos(clampedCosAngle) * (180 / Math.PI);
  
  // 벡터의 외적을 통해 각도의 방향 판별
  const crossProduct = vector1.x * vector2.y - vector1.y * vector2.x;
  
  // 외적이 음수이면 각도는 시계방향
  if (crossProduct < 0) {
    angleDegrees = 360 - angleDegrees;
  }
  
  // 각도가 180도 이상이면 작은 쪽의 각도를 반환
  if (angleDegrees > 180) {
    angleDegrees = 360 - angleDegrees;
  }
  
  return parseFloat(angleDegrees.toFixed(1));
};

// 부채꼴을 그리기 위한 SVG 패스 생성 함수
const createArcPath = (
  vertex: { x: number; y: number },
  point1: { x: number; y: number },
  point2: { x: number; y: number },
  radius: number = 16
): string => {
  // 벡터 계산
  const vector1 = {
    x: point1.x - vertex.x,
    y: point1.y - vertex.y
  };
  
  const vector2 = {
    x: point2.x - vertex.x,
    y: point2.y - vertex.y
  };
  
  // 벡터 정규화
  const length1 = Math.sqrt(vector1.x * vector1.x + vector1.y * vector1.y);
  const length2 = Math.sqrt(vector2.x * vector2.x + vector2.y * vector2.y);
  
  const normalized1 = {
    x: vector1.x / length1,
    y: vector1.y / length1
  };
  
  const normalized2 = {
    x: vector2.x / length2,
    y: vector2.y / length2
  };
  
  // 호의 시작점과 끝점
  const startPoint = {
    x: vertex.x + normalized1.x * radius,
    y: vertex.y + normalized1.y * radius
  };
  
  const endPoint = {
    x: vertex.x + normalized2.x * radius,
    y: vertex.y + normalized2.y * radius
  };
  
  // 벡터의 내적
  const dotProduct = normalized1.x * normalized2.x + normalized1.y * normalized2.y;
  
  // 각도 계산 (라디안)
  const angle = Math.acos(Math.max(-1, Math.min(1, dotProduct)));
  
  // 외적을 통해 각도의 방향 판별
  const crossProduct = normalized1.x * normalized2.y - normalized1.y * normalized2.x;
  
  // 항상 내각을 그리기 위한 설정
  const largeArcFlag = angle > Math.PI ? 1 : 0;
  const sweepFlag = crossProduct > 0 ? 1 : 0;
  
  // SVG 패스 생성
  return `M ${startPoint.x} ${startPoint.y} A ${radius} ${radius} 0 ${largeArcFlag} ${sweepFlag} ${endPoint.x} ${endPoint.y}`;
};

interface SelectedLineInfo {
  line: LineSegment;
  shapeIndex: number;
}

const Canvas = forwardRef<CanvasRef, CanvasProps>(({ selectedShape, selectedTool, onClearShapes }, ref) => {
  const [shapes, setShapes] = useState<Shape[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [hoverPoint, setHoverPoint] = useState<{ x: number; y: number; type: 'center' | 'edge' | 'vertex' } | null>(null);
  const [activeShapeIndex, setActiveShapeIndex] = useState<number | null>(null);
  const [selectedPoint, setSelectedPoint] = useState<{ point: Point; shapeIndex: number } | null>(null);
  const [hoveredPoint, setHoveredPoint] = useState<Point | null>(null);
  const [tempLine, setTempLine] = useState<{ start: Point; end: { x: number; y: number } } | null>(null);
  const [currentShape, setCurrentShape] = useState<Shape | null>(null);
  const [hoveredLine, setHoveredLine] = useState<{ line: LineSegment; shapeIndex: number } | null>(null);
  const [selectedLine, setSelectedLine] = useState<{ line: LineSegment; shapeIndex: number } | null>(null);
  const [firstSelectedLine, setFirstSelectedLine] = useState<SelectedLineInfo | null>(null);
  const [secondSelectedLine, setSecondSelectedLine] = useState<SelectedLineInfo | null>(null);
  const [showAngleDialog, setShowAngleDialog] = useState(false);
  const [selectedAngle, setSelectedAngle] = useState<{ angle: Angle; shapeIndex: number } | null>(null);
  // 삼각형 꼭짓점 변형을 위한 상태 추가
  const [transformingVertex, setTransformingVertex] = useState<{point: Point; shapeIndex: number; vertexIndex: number} | null>(null);
  const [hoveredVertex, setHoveredVertex] = useState<{point: Point; shapeIndex: number; vertexIndex: number} | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  
  // 작업 이력 저장
  const [history, setHistory] = useState<Shape[][]>([]);
  const [currentHistoryIndex, setCurrentHistoryIndex] = useState(-1);

  // 초기 빈 배열 상태를 히스토리에 저장
  useEffect(() => {
    setHistory([[]]); // 초기 빈 배열 상태를 히스토리의 첫 항목으로 저장
    setCurrentHistoryIndex(0);
  }, []);

  // 현재 상태 저장 함수 
  const saveToHistory = useCallback((newShapes: Shape[]) => {
    // 현재 히스토리 인덱스 이후의 기록은 삭제하고 새로운 상태 추가
    const newHistory = history.slice(0, currentHistoryIndex + 1);
    // 깊은 복사를 통해 상태 저장
    newHistory.push(JSON.parse(JSON.stringify(newShapes)));
    setHistory(newHistory);
    setCurrentHistoryIndex(newHistory.length - 1);
  }, [history, currentHistoryIndex]);

  // Undo 함수
  const undo = useCallback(() => {
    if (currentHistoryIndex > 0) {
      const newIndex = currentHistoryIndex - 1;
      setCurrentHistoryIndex(newIndex);
      setShapes(JSON.parse(JSON.stringify(history[newIndex]))); // 깊은 복사로 상태 설정
    }
  }, [history, currentHistoryIndex]);

  // Ctrl+Z 단축키 처리
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        undo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [undo]);

  // ref를 통해 undo 함수 노출
  useImperativeHandle(ref, () => ({
    clearAllShapes,
    undo
  }));

  // 마우스 다운 이벤트 처리
  const handleMouseDown = (e: React.MouseEvent) => {
    if (selectedTool === 'shape') {
      handleShapeDrawStart(e);
    } else if (selectedTool === 'point') {
      handlePointPlace(e);
    } else if (selectedTool === 'line') {
      handleLineStart(e);
    } else if (selectedTool === 'length' && hoveredLine) {
      setSelectedLine(hoveredLine);
    } else if (selectedTool === 'angle') {
      handleLineSelect(e);
    } else if (selectedTool === 'transform' && hoveredVertex) {
      // 꼭짓점을 선택하여 변형 시작
      setTransformingVertex(hoveredVertex);
    }
  };

  const handleShapeDrawStart = (e: React.MouseEvent) => {
    if (!selectedShape || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setIsDrawing(true);
    setStartPos({ x, y });
    
    // 새로운 도형 시작
    const newShape: Shape = {
      type: selectedShape,
      x,
      y,
      width: 0,
      height: 0,
      points: [],
      lines: [],
      angles: [],
      center: { x, y }
    };
    setCurrentShape(newShape);
  };

  // 점 생성 및 저장
  const handlePointPlace = (e: React.MouseEvent) => {
    if (!hoverPoint || activeShapeIndex === null) return;

    const updatedShapes = [...shapes];
    const shape = updatedShapes[activeShapeIndex];
    const label = String.fromCharCode(65 + shape.points.length); // A, B, C, ...
    
    // 기존 hoverPoint 좌표 그대로 사용
    shape.points.push({
      x: hoverPoint.x,
      y: hoverPoint.y,
      label,
      type: hoverPoint.type
    });

    setShapes(updatedShapes);
    saveToHistory(updatedShapes); // 상태 변경 후 히스토리 저장
  };

  const handleLineStart = (e: React.MouseEvent) => {
    if (!canvasRef.current || selectedTool !== 'line') return;

    const rect = canvasRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // 클릭한 위치에서 가장 가까운 점 찾기
    for (let i = 0; i < shapes.length; i++) {
      const shape = shapes[i];
      for (const point of shape.points) {
        const distance = Math.sqrt(
          Math.pow(mouseX - point.x, 2) + Math.pow(mouseY - point.y, 2)
        );
        if (distance < 10) {
          if (!selectedPoint) {
            setSelectedPoint({ point, shapeIndex: i });
            setTempLine({ start: point, end: { x: mouseX, y: mouseY } });
          } else {
            // 두 번째 점 선택 시 선분 생성
            handleLineCreation(selectedPoint.point, point, selectedPoint.shapeIndex);
          }
          break;
        }
      }
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (selectedTool === 'shape' && isDrawing) {
      handleShapeDrawing(e);
    } else if (selectedTool === 'point') {
      handlePointHover(e);
    } else if (selectedTool === 'line') {
      handleLineToolMouseMove(e);
    } else if (selectedTool === 'length') {
      handleLengthToolMouseMove(e);
    } else if (selectedTool === 'angle') {
      handleLengthToolMouseMove(e); // 각도 도구도 선분 호버링을 보여주기 위해 동일한 함수 사용
    } else if (selectedTool === 'transform') {
      if (transformingVertex) {
        // 꼭짓점 이동 처리
        handleVertexTransform(e);
      } else {
        // 삼각형 꼭짓점 호버링 처리
        handleVertexHover(e);
      }
    }
  };

  const handleShapeDrawing = (e: React.MouseEvent) => {
    if (!selectedShape || !canvasRef.current || !currentShape) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const currentX = e.clientX - rect.left;
    const currentY = e.clientY - rect.top;

    let width = Math.abs(currentX - startPos.x);
    let height = Math.abs(currentY - startPos.y);
    let x = Math.min(currentX, startPos.x);
    let y = Math.min(currentY, startPos.y);

    if (e.shiftKey) {
      if (selectedShape === 'circle' || selectedShape === 'rectangle') {
        const size = Math.max(width, height);
        width = size;
        height = size;
      } else if (selectedShape === 'triangle') {
        const baseSize = Math.max(width, height);
        width = baseSize;
        height = (baseSize * Math.sqrt(3)) / 2;
      }
      x = currentX > startPos.x ? startPos.x : startPos.x - width;
      y = currentY > startPos.y ? startPos.y : startPos.y - height;
    }

    const updatedShape: Shape = {
      ...currentShape,
      x,
      y,
      width: Math.max(width, 20),  // 최소 크기 20px 적용
      height: Math.max(height, 20),  // 최소 크기 20px 적용
      center: {
        x: x + width / 2,
        y: y + height / 2
      }
    };
    setCurrentShape(updatedShape);
  };

  const handlePointHover = (e: React.MouseEvent) => {
    if (!canvasRef.current || selectedTool !== 'point') return;

    const rect = canvasRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    for (let i = 0; i < shapes.length; i++) {
      const shape = shapes[i];
      
      if (shape.type === 'circle') {
        const centerX = shape.x + shape.width / 2;
        const centerY = shape.y + shape.height / 2;
        const radius = shape.width / 2;

        // 중심점 근처 확인
        const distanceToCenter = Math.sqrt(
          Math.pow(mouseX - centerX, 2) + Math.pow(mouseY - centerY, 2)
        );

        if (distanceToCenter < 10) {
          setHoverPoint({ x: centerX, y: centerY, type: 'center' });
          setActiveShapeIndex(i);
          return;
        }

        // 원의 테두리 근처 확인
        const distanceToEdge = Math.abs(distanceToCenter - radius);
        if (distanceToEdge < 10) {
          const angle = Math.atan2(mouseY - centerY, mouseX - centerX);
          const edgeX = centerX + radius * Math.cos(angle);
          const edgeY = centerY + radius * Math.sin(angle);
          setHoverPoint({ x: edgeX, y: edgeY, type: 'edge' });
          setActiveShapeIndex(i);
          return;
        }
      } else if (shape.type === 'triangle') {
        // 마우스가 삼각형 영역 내에 있는지 먼저 확인
        if (mouseX < shape.x || mouseX > shape.x + shape.width ||
            mouseY < shape.y || mouseY > shape.y + shape.height) {
          continue;
        }

        // 삼각형의 세 꼭지점 좌표
        let vertices;
        
        if (shape.triangleVertices && shape.triangleVertices.length === 3) {
          // 변형된 삼각형의 꼭짓점 사용
          vertices = {
            top: { x: shape.triangleVertices[0].x, y: shape.triangleVertices[0].y },
            left: { x: shape.triangleVertices[1].x, y: shape.triangleVertices[1].y },
            right: { x: shape.triangleVertices[2].x, y: shape.triangleVertices[2].y }
          };
        } else {
          // 기본 삼각형 꼭짓점 좌표 계산
          vertices = {
            top: { x: shape.x + shape.width/2, y: shape.y },
            left: { x: shape.x, y: shape.y + shape.height },
            right: { x: shape.x + shape.width, y: shape.y + shape.height }
          };
        }

        // 꼭짓점 근처 확인 (16px 이내)
        const vertexPoints = [vertices.top, vertices.left, vertices.right];
        for (const vertex of vertexPoints) {
          const distanceToVertex = Math.sqrt(
            Math.pow(mouseX - vertex.x, 2) + Math.pow(mouseY - vertex.y, 2)
          );
          
          if (distanceToVertex < 16) {
            // 꼭짓점에 placeholder 고정
            setHoverPoint({ x: vertex.x, y: vertex.y, type: 'vertex' });
            setActiveShapeIndex(i);
            return;
          }
        }

        // 무게중심 좌표
        const centroid = {
          x: shape.x + shape.width/2,
          y: shape.y + shape.height * (2/3)
        };

        // 변형된 삼각형의 경우 실제 무게중심 계산
        if (shape.triangleVertices && shape.triangleVertices.length === 3) {
          centroid.x = (vertices.top.x + vertices.left.x + vertices.right.x) / 3;
          centroid.y = (vertices.top.y + vertices.left.y + vertices.right.y) / 3;
        }

        // 무게중심 근처 확인
        const distanceToCenter = Math.sqrt(
          Math.pow(mouseX - centroid.x, 2) + Math.pow(mouseY - centroid.y, 2)
        );

        if (distanceToCenter < 10) {
          // 무게중심 좌표로 설정
          setHoverPoint({ x: centroid.x, y: centroid.y, type: 'center' });
          setActiveShapeIndex(i);
          return;
        }

        // 삼각형의 각 변 확인
        const edges = [
          { start: vertices.top, end: vertices.left },
          { start: vertices.left, end: vertices.right },
          { start: vertices.right, end: vertices.top }
        ];

        for (const edge of edges) {
          const distance = pointToLineDistance(
            mouseX,
            mouseY,
            edge.start.x,
            edge.start.y,
            edge.end.x,
            edge.end.y
          );

          if (distance < 10) {
            // 선분 위의 가장 가까운 점 계산
            const dx = edge.end.x - edge.start.x;
            const dy = edge.end.y - edge.start.y;
            const t = ((mouseX - edge.start.x) * dx + (mouseY - edge.start.y) * dy) / 
                      (dx * dx + dy * dy);
            
            if (t >= 0 && t <= 1) {
              // 정확한 투영 위치 계산
              const projectedX = edge.start.x + t * dx;
              const projectedY = edge.start.y + t * dy;
              
              // 정확히 삼각형 변 위의 점 좌표로 설정
              setHoverPoint({ x: projectedX, y: projectedY, type: 'edge' });
              setActiveShapeIndex(i);
              return;
            }
          }
        }
      } else if (shape.type === 'rectangle') {
        // 사각형의 꼭짓점 좌표
        const vertices = {
          topLeft: { x: shape.x, y: shape.y },
          topRight: { x: shape.x + shape.width, y: shape.y },
          bottomLeft: { x: shape.x, y: shape.y + shape.height },
          bottomRight: { x: shape.x + shape.width, y: shape.y + shape.height }
        };

        // 꼭짓점 근처 확인 (16px 이내)
        const vertexPoints = [vertices.topLeft, vertices.topRight, vertices.bottomLeft, vertices.bottomRight];
        for (const vertex of vertexPoints) {
          const distanceToVertex = Math.sqrt(
            Math.pow(mouseX - vertex.x, 2) + Math.pow(mouseY - vertex.y, 2)
          );
          
          if (distanceToVertex < 16) {
            // 꼭짓점에 placeholder 고정
            setHoverPoint({ x: vertex.x, y: vertex.y, type: 'vertex' });
            setActiveShapeIndex(i);
            return;
          }
        }

        // 사각형의 중심점 근처 확인
        const centerX = shape.x + shape.width / 2;
        const centerY = shape.y + shape.height / 2;
        const distanceToCenter = Math.sqrt(
          Math.pow(mouseX - centerX, 2) + Math.pow(mouseY - centerY, 2)
        );

        if (distanceToCenter < 10) {
          setHoverPoint({ x: centerX, y: centerY, type: 'center' });
          setActiveShapeIndex(i);
          return;
        }

        // 사각형의 각 변 확인
        const edges = [
          { start: vertices.topLeft, end: vertices.topRight },
          { start: vertices.topRight, end: vertices.bottomRight },
          { start: vertices.bottomRight, end: vertices.bottomLeft },
          { start: vertices.bottomLeft, end: vertices.topLeft }
        ];

        for (const edge of edges) {
          const distance = pointToLineDistance(
            mouseX,
            mouseY,
            edge.start.x,
            edge.start.y,
            edge.end.x,
            edge.end.y
          );

          if (distance < 10) {
            // 선분 위의 가장 가까운 점 계산
            const dx = edge.end.x - edge.start.x;
            const dy = edge.end.y - edge.start.y;
            const t = ((mouseX - edge.start.x) * dx + (mouseY - edge.start.y) * dy) / 
                      (dx * dx + dy * dy);
            
            if (t >= 0 && t <= 1) {
              const projectedX = edge.start.x + t * dx;
              const projectedY = edge.start.y + t * dy;
              
              setHoverPoint({ x: projectedX, y: projectedY, type: 'edge' });
              setActiveShapeIndex(i);
              return;
            }
          }
        }
      }
    }

    setHoverPoint(null);
    setActiveShapeIndex(null);
  };

  const handleLineToolMouseMove = (e: React.MouseEvent) => {
    if (!canvasRef.current || selectedTool !== 'line') return;

    const rect = canvasRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // 선분 그리기 중일 때 임시 선분 업데이트
    if (selectedPoint) {
      setTempLine(prev => prev ? { ...prev, end: { x: mouseX, y: mouseY } } : null);
    }

    // 점 위에 마우스가 있는지 확인
    let foundPoint = false;
    for (const shape of shapes) {
      for (const point of shape.points) {
        const distance = Math.sqrt(
          Math.pow(mouseX - point.x, 2) + Math.pow(mouseY - point.y, 2)
        );
        
        if (distance < 10) {
          // 선택된 점이 아닌 다른 점에 마우스오버 했을 때만 호버 상태 설정
          if (!selectedPoint || selectedPoint.point !== point) {
            setHoveredPoint(point);
            foundPoint = true;
          }
          break;
        }
      }
      if (foundPoint) break;
    }
    
    if (!foundPoint) {
      setHoveredPoint(null);
    }
  };

  // 길이 설정 시 작업 이력 저장
  const handleLengthSubmit = (length: Length) => {
    if (!selectedLine) return;
    
    const updatedShapes = [...shapes];
    const shape = updatedShapes[selectedLine.shapeIndex];
    const lineIndex = shape.lines.findIndex(l => l === selectedLine.line);
    if (lineIndex !== -1) {
      shape.lines[lineIndex] = {
        ...shape.lines[lineIndex],
        length
      };
      setShapes(updatedShapes);
      saveToHistory(updatedShapes); // 상태 변경 후 히스토리 저장
    }
    setSelectedLine(null);
  };

  const handleLengthToolMouseMove = (e: React.MouseEvent) => {
    if (!canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    let closestLine: ClosestLine | null = null;

    // 모든 도형의 모든 선분을 확인
    shapes.forEach((shape, shapeIndex) => {
      shape.lines.forEach((line) => {
        // 선분과 마우스 포인터 사이의 거리 계산
        const lineStartX = line.startPoint.x;
        const lineStartY = line.startPoint.y;
        const lineEndX = line.endPoint.x;
        const lineEndY = line.endPoint.y;

        const distance = pointToLineDistance(
          mouseX,
          mouseY,
          lineStartX,
          lineStartY,
          lineEndX,
          lineEndY
        );

        if (distance < 10 && (!closestLine || distance < closestLine.distance)) {
          closestLine = { line, shapeIndex, distance };
        }
      });
    });

    if (closestLine) {
      const { line, shapeIndex } = closestLine;
      setHoveredLine({ line, shapeIndex });
    } else {
      setHoveredLine(null);
    }
  };

  // 도형 완성 시 작업 이력 저장
  const handleMouseUp = () => {
    if (isDrawing && currentShape) {
      // 최소 크기 체크 (20x20 픽셀)
      const isValidSize = currentShape.width >= 20 && currentShape.height >= 20;
      
      // 유효한 크기일 때만 도형 추가
      if (isValidSize) {
        const newShape = {...currentShape};
        
        // 삼각형일 경우 꼭짓점 위치 초기화
        if (newShape.type === 'triangle') {
          newShape.triangleVertices = [
            { x: newShape.x + newShape.width/2, y: newShape.y },              // 상단
            { x: newShape.x, y: newShape.y + newShape.height },               // 좌측 하단
            { x: newShape.x + newShape.width, y: newShape.y + newShape.height }  // 우측 하단
          ];
        }
        
        const newShapes = [...shapes, newShape];
        setShapes(newShapes);
        saveToHistory(newShapes); // 상태 변경 후 히스토리 저장
      }
      setCurrentShape(null);
    }

    // 꼭짓점 변형 완료 처리
    if (transformingVertex) {
      saveToHistory([...shapes]); // 변형 후 상태 저장
      setTransformingVertex(null);
    }
    
    setIsDrawing(false);
  };

  useEffect(() => {
    if (selectedShape && selectedTool === 'shape') {
      document.body.style.cursor = 'crosshair';
    } else if (selectedTool === 'point') {
      document.body.style.cursor = 'pointer';
    } else if (selectedTool === 'line') {
      document.body.style.cursor = selectedPoint ? 'crosshair' : 'pointer';
    } else if (selectedTool === 'length' || selectedTool === 'angle') {
      document.body.style.cursor = hoveredLine ? 'crosshair' : 'pointer';
    } else if (selectedTool === 'transform') {
      document.body.style.cursor = hoveredVertex ? 'move' : 'default';
    } else {
      document.body.style.cursor = 'default';
    }
  }, [selectedShape, selectedTool, selectedPoint, hoveredLine, hoveredVertex]);

  // 선분 그리기 취소 함수
  const cancelLineDrawing = () => {
    setSelectedPoint(null);
    setTempLine(null);
    setHoveredPoint(null);
  };

  // ESC 키 이벤트 핸들러
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        // 선분 그리기 중 취소
        if (selectedTool === 'line' && selectedPoint) {
          cancelLineDrawing();
        }
        
        // 도형 그리기 중 취소
        if (selectedTool === 'shape' && isDrawing) {
          cancelShapeDrawing();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedTool, selectedPoint, isDrawing]);

  // 도구가 변경될 때 선분 그리기 상태 초기화
  useEffect(() => {
    cancelLineDrawing();
    setFirstSelectedLine(null);
    setSecondSelectedLine(null);
  }, [selectedTool]);

  // 선분 생성 시 작업 이력 저장
  const handleLineCreation = (startPoint: Point, endPoint: Point, shapeIndex: number) => {
    const updatedShapes = [...shapes];
    const shape = updatedShapes[shapeIndex];
    if (!shape.lines) {
      shape.lines = [];
    }
    shape.lines.push({
      startPoint,
      endPoint
    });
    
    setShapes(updatedShapes);
    saveToHistory(updatedShapes); // 상태 변경 후 히스토리 저장
    setSelectedPoint(null);
    setTempLine(null);
  };

  // 도형 전체 삭제 함수
  const clearAllShapes = () => {
    if (shapes.length > 0) {
      setShapes([]);
      saveToHistory([]); // 상태 변경 후 히스토리 저장
    }
  };

  // onClearShapes prop으로 clearAllShapes 함수 전달
  useEffect(() => {
    if (onClearShapes) {
      onClearShapes();
    }
  }, [onClearShapes]);

  // 선분 선택 처리 함수 (선분 선택 모드)
  const handleLineSelect = (e: React.MouseEvent) => {
    if (!canvasRef.current || selectedTool !== 'angle') return;

    const rect = canvasRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // 명시적 타입 정의
    let closestLine: ClosestLine | null = null;

    // 모든 도형의 모든 선분을 확인
    shapes.forEach((shape, shapeIndex) => {
      shape.lines.forEach((line) => {
        // 선분과 마우스 포인터 사이의 거리 계산
        const lineStartX = line.startPoint.x;
        const lineStartY = line.startPoint.y;
        const lineEndX = line.endPoint.x;
        const lineEndY = line.endPoint.y;

        const distance = pointToLineDistance(
          mouseX,
          mouseY,
          lineStartX,
          lineStartY,
          lineEndX,
          lineEndY
        );

        if (distance < 10 && (!closestLine || distance < closestLine.distance)) {
          closestLine = {
            line: line,
            shapeIndex: shapeIndex,
            distance: distance
          };
        }
      });
    });

    if (closestLine) {
      // 타입 단언 추가
      const selectedLineInfo: SelectedLineInfo = {
        line: (closestLine as any).line,
        shapeIndex: (closestLine as any).shapeIndex
      };

      // 첫 번째 선분이 선택되지 않은 경우
      if (!firstSelectedLine) {
        setFirstSelectedLine(selectedLineInfo);
        return;
      }

      // 첫 번째 선분이 이미 선택된 경우, 두 번째 선분 선택
      setSecondSelectedLine(selectedLineInfo);

      // 두 선분이 선택되었을 때 각도 계산
      const line1 = (firstSelectedLine as any).line;
      const line2 = selectedLineInfo.line;
      const shapeIndex = (firstSelectedLine as any).shapeIndex;

      // 두 선분 사이의 각도 계산
      const angle = calculateAngleBetweenLines(
        line1.startPoint,
        line1.endPoint,
        line2.startPoint,
        line2.endPoint
      );

      // 공통 꼭짓점 찾기
      let vertex: Point | null = null;
      let foundCommonVertex = false;
      
      // 허용 오차 증가 (픽셀 단위)
      const tolerance = 2.0;
      
      // 좌표 비교 헬퍼 함수
      const isSamePoint = (p1: Point, p2: Point): boolean => {
        return Math.abs(p1.x - p2.x) < tolerance && Math.abs(p1.y - p2.y) < tolerance;
      };

      // 공통 꼭짓점 찾기
      if (isSamePoint(line1.endPoint, line2.startPoint)) {
        vertex = line1.endPoint;
        foundCommonVertex = true;
      } 
      else if (isSamePoint(line1.endPoint, line2.endPoint)) {
        vertex = line1.endPoint;
        foundCommonVertex = true;
        // 방향 맞추기 위해 line2 재정렬 필요
        line2.startPoint = [line2.endPoint, line2.endPoint = line2.startPoint][0];
      }
      else if (isSamePoint(line1.startPoint, line2.startPoint)) {
        vertex = line1.startPoint;
        foundCommonVertex = true;
        // 방향 맞추기 위해 line1 재정렬 필요
        line1.startPoint = [line1.endPoint, line1.endPoint = line1.startPoint][0];
      }
      else if (isSamePoint(line1.startPoint, line2.endPoint)) {
        vertex = line1.startPoint;
        foundCommonVertex = true;
        // 두 선분 모두 재정렬 필요
        line1.startPoint = [line1.endPoint, line1.endPoint = line1.startPoint][0];
        line2.startPoint = [line2.endPoint, line2.endPoint = line2.startPoint][0];
      }
      
      // 점들이 정확히 일치하지 않아도 가장 가까운 거리의 두 점을 찾아 공통 꼭짓점으로 사용
      if (!foundCommonVertex) {
        // 모든 점 쌍의 거리 계산
        const pointPairs = [
          { 
            p1: line1.startPoint, 
            p2: line2.startPoint, 
            dist: Math.hypot(line1.startPoint.x - line2.startPoint.x, line1.startPoint.y - line2.startPoint.y),
            needSwap1: true,
            needSwap2: false
          },
          { 
            p1: line1.startPoint, 
            p2: line2.endPoint, 
            dist: Math.hypot(line1.startPoint.x - line2.endPoint.x, line1.startPoint.y - line2.endPoint.y),
            needSwap1: true,
            needSwap2: true
          },
          { 
            p1: line1.endPoint, 
            p2: line2.startPoint, 
            dist: Math.hypot(line1.endPoint.x - line2.startPoint.x, line1.endPoint.y - line2.startPoint.y),
            needSwap1: false,
            needSwap2: false
          },
          { 
            p1: line1.endPoint, 
            p2: line2.endPoint, 
            dist: Math.hypot(line1.endPoint.x - line2.endPoint.x, line1.endPoint.y - line2.endPoint.y),
            needSwap1: false,
            needSwap2: true
          }
        ];
        
        // 가장 가까운 점 쌍 찾기
        const closestPair = pointPairs.reduce((closest, current) => 
          current.dist < closest.dist ? current : closest, pointPairs[0]);
        
        // 두 점이 충분히 가까우면(10픽셀 이내) 공통 꼭짓점으로 간주
        if (closestPair.dist < 10) {
          // 두 점 중 label이 있는 점 우선 사용
          vertex = closestPair.p1.label ? closestPair.p1 : closestPair.p2;
          foundCommonVertex = true;
          
          // 선분 방향 재정렬 필요 시 수행
          if (closestPair.needSwap1) {
            line1.startPoint = [line1.endPoint, line1.endPoint = line1.startPoint][0];
          }
          if (closestPair.needSwap2) {
            line2.startPoint = [line2.endPoint, line2.endPoint = line2.startPoint][0];
          }
        }
      }

      if (vertex && foundCommonVertex) {
        // 방향이 조정된 선분으로 각도 다시 계산
        const recalculatedAngle = calculateAngleBetweenLines(
          line1.startPoint,
          line1.endPoint,
          line2.startPoint,
          line2.endPoint
        );
        
        // 각도 정보 생성
        const newAngle: Angle = {
          lines: [line1, line2],
          value: recalculatedAngle !== -1 ? recalculatedAngle : angle,
          vertex: vertex
        };

        // 도형에 각도 정보 추가
        const updatedShapes = [...shapes];
        const shape = updatedShapes[shapeIndex];
        
        if (!shape.angles) {
          shape.angles = [];
        }
        
        shape.angles.push(newAngle);
        
        saveToHistory(updatedShapes);
        setShapes(updatedShapes);
      }

      // 선택 초기화
      setFirstSelectedLine(null);
      setSecondSelectedLine(null);
    }
  };

  // 도형 그리기 취소 함수
  const cancelShapeDrawing = () => {
    setIsDrawing(false);
    setCurrentShape(null);
  };

  // 삼각형 꼭짓점 호버링 처리
  const handleVertexHover = (e: React.MouseEvent) => {
    if (!canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // 호버링 초기화
    setHoveredVertex(null);

    // 모든 삼각형 도형 확인
    for (let shapeIndex = 0; shapeIndex < shapes.length; shapeIndex++) {
      const shape = shapes[shapeIndex];
      
      // 삼각형 도형만 처리
      if (shape.type !== 'triangle') continue;
      
      // 삼각형 꼭짓점 좌표 계산
      let vertices: { x: number; y: number }[] = [];
      
      if (shape.triangleVertices && shape.triangleVertices.length === 3) {
        // 이미 저장된 꼭짓점 좌표가 있으면 사용
        vertices = shape.triangleVertices;
      } else {
        // 없으면 기본 꼭짓점 좌표 계산 (바운딩 박스 기반)
        vertices = [
          { x: shape.x + shape.width/2, y: shape.y },              // 상단
          { x: shape.x, y: shape.y + shape.height },               // 좌측 하단
          { x: shape.x + shape.width, y: shape.y + shape.height }  // 우측 하단
        ];
      }
      
      // 각 꼭짓점 확인
      for (let vertexIndex = 0; vertexIndex < vertices.length; vertexIndex++) {
        const vertex = vertices[vertexIndex];
        const distanceToVertex = Math.sqrt(
          Math.pow(mouseX - vertex.x, 2) + Math.pow(mouseY - vertex.y, 2)
        );
        
        // 꼭짓점 근처인지 확인 (16px 이내)
        if (distanceToVertex < 16) {
          // 꼭짓점 라벨 지정
          const label = ['top', 'left', 'right'][vertexIndex];
          
          setHoveredVertex({
            point: {
              x: vertex.x,
              y: vertex.y,
              label,
              type: 'vertex'
            },
            shapeIndex,
            vertexIndex
          });
          return;
        }
      }
    }
  };

  // 꼭짓점 변형 처리
  const handleVertexTransform = (e: React.MouseEvent) => {
    if (!canvasRef.current || !transformingVertex) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const { shapeIndex, vertexIndex, point: selectedPoint } = transformingVertex;
    const updatedShapes = [...shapes];
    const shape = updatedShapes[shapeIndex];

    // 삼각형이 아니면 처리하지 않음
    if (shape.type !== 'triangle') return;

    // 삼각형의 꼭짓점 좌표 배열 초기화 (없는 경우)
    if (!shape.triangleVertices || shape.triangleVertices.length !== 3) {
      shape.triangleVertices = [
        { x: shape.x + shape.width/2, y: shape.y },              // 상단
        { x: shape.x, y: shape.y + shape.height },               // 좌측 하단
        { x: shape.x + shape.width, y: shape.y + shape.height }  // 우측 하단
      ];
    }

    // 변형 전 삼각형 꼭짓점 좌표 저장
    const oldVertices = [
      { x: shape.triangleVertices[0].x, y: shape.triangleVertices[0].y },
      { x: shape.triangleVertices[1].x, y: shape.triangleVertices[1].y },
      { x: shape.triangleVertices[2].x, y: shape.triangleVertices[2].y }
    ];

    // 선택된 꼭짓점만 이동
    shape.triangleVertices[vertexIndex].x = mouseX;
    shape.triangleVertices[vertexIndex].y = mouseY;

    // 새 삼각형 꼭짓점 좌표
    const newVertices = shape.triangleVertices;

    // 기존에 찍은 점들이 있다면 함께 이동시키기
    if (shape.points && shape.points.length > 0) {
      shape.points.forEach(point => {
        // 현재 점의 삼각형 내 상대적 위치 계산 (무게중심 좌표)
        const barycentricCoords = calculateBarycentricCoordinates(
          { x: point.x, y: point.y },
          oldVertices[0],
          oldVertices[1],
          oldVertices[2]
        );

        // 무게중심 좌표가 유효한 경우(삼각형 내부 점인 경우)에만 위치 업데이트
        if (barycentricCoords) {
          // 새 삼각형에서의 점 위치 계산
          const newPosition = pointFromBarycentricCoordinates(
            barycentricCoords,
            newVertices[0],
            newVertices[1],
            newVertices[2]
          );

          // 점 위치 업데이트
          point.x = newPosition.x;
          point.y = newPosition.y;
        }
      });

      // 선분이 있다면 시작점과 끝점 업데이트
      if (shape.lines && shape.lines.length > 0) {
        shape.lines.forEach(line => {
          // 선분의 시작점과 끝점이 점 배열에 있는지 찾아서 참조 업데이트
          const startPoint = shape.points.find(p => p.label === line.startPoint.label);
          const endPoint = shape.points.find(p => p.label === line.endPoint.label);

          if (startPoint) {
            line.startPoint.x = startPoint.x;
            line.startPoint.y = startPoint.y;
          }

          if (endPoint) {
            line.endPoint.x = endPoint.x;
            line.endPoint.y = endPoint.y;
          }
        });
      }

      // 각도가 있다면 꼭짓점과 선분 위치 업데이트
      if (shape.angles && shape.angles.length > 0) {
        shape.angles.forEach(angle => {
          // 각도의 꼭짓점 업데이트
          const vertexPoint = shape.points.find(p => p.label === angle.vertex.label);
          if (vertexPoint) {
            angle.vertex.x = vertexPoint.x;
            angle.vertex.y = vertexPoint.y;
          }

          // 각도를 형성하는 선분 업데이트 (이미 line을 통해 업데이트됨)
        });
      }
    }

    // 바운딩 박스 재계산 (모든 꼭짓점을 포함하는 최소 사각형)
    const minX = Math.min(...shape.triangleVertices.map(v => v.x));
    const minY = Math.min(...shape.triangleVertices.map(v => v.y));
    const maxX = Math.max(...shape.triangleVertices.map(v => v.x));
    const maxY = Math.max(...shape.triangleVertices.map(v => v.y));
    
    // 바운딩 박스 업데이트
    shape.x = minX;
    shape.y = minY;
    shape.width = Math.max(maxX - minX, 20); // 최소 너비 20px
    shape.height = Math.max(maxY - minY, 20); // 최소 높이 20px

    // 상태 업데이트
    setShapes(updatedShapes);

    // 현재 변형 중인 꼭짓점 정보 업데이트
    setTransformingVertex({
      ...transformingVertex,
      point: {
        ...transformingVertex.point,
        x: mouseX,
        y: mouseY
      }
    });
  };

  // 점의 삼각형 내 상대적 위치(무게중심 좌표) 계산 함수
  const calculateBarycentricCoordinates = (
    point: { x: number; y: number },
    v1: { x: number; y: number },
    v2: { x: number; y: number },
    v3: { x: number; y: number }
  ): { u: number; v: number; w: number } | null => {
    // 삼각형 면적 계산을 위한 도우미 함수
    const triangleArea = (a: { x: number; y: number }, b: { x: number; y: number }, c: { x: number; y: number }): number => {
      return Math.abs((a.x * (b.y - c.y) + b.x * (c.y - a.y) + c.x * (a.y - b.y)) / 2);
    };

    // 전체 삼각형 면적
    const totalArea = triangleArea(v1, v2, v3);
    
    // 면적이 0이면 계산할 수 없음
    if (totalArea === 0) return null;

    // 점을 포함하는 부분 삼각형들의 면적
    const u = triangleArea(point, v2, v3) / totalArea;
    const v = triangleArea(v1, point, v3) / totalArea;
    const w = triangleArea(v1, v2, point) / totalArea;

    // u, v, w의 합이 1과 근사하면 유효한 무게중심 좌표
    // 삼각형 내부 점이면 u, v, w는 모두 0보다 크거나 같고 1보다 작거나 같으며, 합이 1
    // 숫자 계산 오차를 고려하여 약간의 여유 허용
    const sum = u + v + w;
    if (Math.abs(sum - 1) > 0.01) return null;

    return { u, v, w };
  };

  // 무게중심 좌표에서 실제 점 위치 계산 함수
  const pointFromBarycentricCoordinates = (
    barycentric: { u: number; v: number; w: number },
    v1: { x: number; y: number },
    v2: { x: number; y: number },
    v3: { x: number; y: number }
  ): { x: number; y: number } => {
    return {
      x: barycentric.u * v1.x + barycentric.v * v2.x + barycentric.w * v3.x,
      y: barycentric.u * v1.y + barycentric.v * v2.y + barycentric.w * v3.y
    };
  };

  return (
    <div
      ref={canvasRef}
      className="canvas"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={() => {
        handleMouseUp();
        setHoveredPoint(null);
        setHoveredLine(null);
      }}
    >
      {shapes.map((shape, index) => {
        const baseStyle: React.CSSProperties = {
          position: 'absolute',
          left: `${shape.x}px`,
          top: `${shape.y}px`,
          width: `${shape.width}px`,
          height: `${shape.height}px`,
        };

        if (shape.type === 'circle') {
          return (
            <div key={index} className="shape circle" style={baseStyle}>
              {shape.points.map((point, pointIndex) => (
                <div
                  key={pointIndex}
                  className={`point ${point.type} ${
                    selectedPoint?.point === point || hoveredPoint === point ? 'selected' : ''
                  }`}
                  style={{
                    left: point.type === 'center' ? '50%' : `${((point.x - shape.x) / shape.width) * 100}%`,
                    top: point.type === 'center' ? '50%' : `${((point.y - shape.y) / shape.height) * 100}%`,
                  }}
                >
                  <span 
                    className="point-label"
                    style={{
                      position: 'absolute',
                      left: `${calculatePointLabelPosition(point, shape).x - point.x}px`,
                      top: `${calculatePointLabelPosition(point, shape).y - point.y}px`,
                      textShadow: "0px 0px 3px white"
                    }}
                  >{point.label}</span>
                </div>
              ))}
              {shape.lines?.map((line, lineIndex) => (
                <svg
                  key={`line-${lineIndex}`}
                  className="line-container"
                  style={{
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    width: '100%',
                    height: '100%',
                    overflow: 'visible',
                  }}
                >
                  <line
                    x1={line.startPoint.x - shape.x}
                    y1={line.startPoint.y - shape.y}
                    x2={line.endPoint.x - shape.x}
                    y2={line.endPoint.y - shape.y}
                    className={`line ${
                      (hoveredLine?.line === line || selectedLine?.line === line) ? 'highlighted' : ''
                    }`}
                  />
                  {line.length && (
                    <text
                      x={calculateLengthTextPosition(
                        line.startPoint.x - shape.x,
                        line.startPoint.y - shape.y,
                        line.endPoint.x - shape.x,
                        line.endPoint.y - shape.y
                      ).x}
                      y={calculateLengthTextPosition(
                        line.startPoint.x - shape.x,
                        line.startPoint.y - shape.y,
                        line.endPoint.x - shape.x,
                        line.endPoint.y - shape.y
                      ).y}
                      className="length-label"
                      textAnchor="middle"
                      dy="-0.5em"
                    >
                      {`${line.length.value}${line.length.unit}`}
                    </text>
                  )}
                </svg>
              ))}
              {shape.angles?.map((angle, angleIndex) => (
                <svg
                  key={`angle-${angleIndex}`}
                  className="angle-container"
                  style={{
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    width: '100%',
                    height: '100%',
                    overflow: 'visible',
                  }}
                >
                  {Math.abs(angle.value - 90) < 0.1 ? (
                    // 직각 표시 (부채꼴 없이 작은 직각 표시만 사용)
                    <React.Fragment>
                      {/* 직각 표시 사각형 */}
                      {(() => {
                        const squarePos = calculateRightAngleSquarePosition(
                          { x: angle.vertex.x - shape.x, y: angle.vertex.y - shape.y },
                          { x: angle.lines[0].startPoint.x - shape.x, y: angle.lines[0].startPoint.y - shape.y },
                          { x: angle.lines[1].endPoint.x - shape.x, y: angle.lines[1].endPoint.y - shape.y },
                          10
                        );
                        return (
                          <rect
                            x={squarePos.x}
                            y={squarePos.y}
                            width={squarePos.width}
                            height={squarePos.height}
                            fill="none"
                            stroke="#444444"
                            strokeWidth="1.0"
                          />
                        );
                      })()}
                      {/* 각도 텍스트 - 직각일 때 */}
                      <text
                        x={calculateAngleTextPosition(
                          { x: angle.vertex.x - shape.x, y: angle.vertex.y - shape.y },
                          { x: angle.lines[0].startPoint.x - shape.x, y: angle.lines[0].startPoint.y - shape.y },
                          { x: angle.lines[1].endPoint.x - shape.x, y: angle.lines[1].endPoint.y - shape.y },
                          40
                        ).x}
                        y={calculateAngleTextPosition(
                          { x: angle.vertex.x - shape.x, y: angle.vertex.y - shape.y },
                          { x: angle.lines[0].startPoint.x - shape.x, y: angle.lines[0].startPoint.y - shape.y },
                          { x: angle.lines[1].endPoint.x - shape.x, y: angle.lines[1].endPoint.y - shape.y },
                          40
                        ).y + 4}
                        fill="#444444"
                        fontSize="12"
                        textAnchor="middle"
                        style={{ textShadow: "0px 0px 3px white" }}
                      >
                        {angle.value}°
                      </text>
                    </React.Fragment>
                  ) : (
                    // 일반 각도 부채꼴 표시
                    <React.Fragment>
                      <path
                        d={createArcPath(
                          { x: angle.vertex.x - shape.x, y: angle.vertex.y - shape.y },
                          { x: angle.lines[0].startPoint.x - shape.x, y: angle.lines[0].startPoint.y - shape.y },
                          { x: angle.lines[1].endPoint.x - shape.x, y: angle.lines[1].endPoint.y - shape.y },
                          16
                        )}
                        fill="none"
                        stroke="#444444"
                        strokeWidth="1.0"
                      />
                      {/* 각도 텍스트 */}
                      <text
                        x={calculateAngleTextPosition(
                          { x: angle.vertex.x - shape.x, y: angle.vertex.y - shape.y },
                          { x: angle.lines[0].startPoint.x - shape.x, y: angle.lines[0].startPoint.y - shape.y },
                          { x: angle.lines[1].endPoint.x - shape.x, y: angle.lines[1].endPoint.y - shape.y },
                          35
                        ).x}
                        y={calculateAngleTextPosition(
                          { x: angle.vertex.x - shape.x, y: angle.vertex.y - shape.y },
                          { x: angle.lines[0].startPoint.x - shape.x, y: angle.lines[0].startPoint.y - shape.y },
                          { x: angle.lines[1].endPoint.x - shape.x, y: angle.lines[1].endPoint.y - shape.y },
                          35
                        ).y + 4}
                        fill="#444444"
                        fontSize="12"
                        textAnchor="middle"
                        style={{ textShadow: "0px 0px 3px white" }}
                      >
                        {angle.value}°
                      </text>
                    </React.Fragment>
                  )}
                </svg>
              ))}
            </div>
          );
        } else if (shape.type === 'triangle') {
          const svgStyle: React.CSSProperties = {
            ...baseStyle,
            border: 'none',
            overflow: 'visible'
          };
          
          return (
            <svg
              key={index}
              style={svgStyle}
            >
              <polygon
                points={(() => {
                  // 삼각형 꼭짓점 계산
                  if (shape.triangleVertices && shape.triangleVertices.length === 3) {
                    // 저장된 꼭짓점 위치 사용 (상대 좌표로 변환)
                    return shape.triangleVertices.map(vertex => {
                      const x = vertex.x - shape.x;
                      const y = vertex.y - shape.y;
                      return `${x},${y}`;
                    }).join(' ');
                  }
                  
                  // 꼭짓점이 설정되지 않았거나 충분하지 않은 경우 기본 삼각형 모양으로 표시
                  const vertices = shape.points
                    .filter(point => point.type === 'vertex')
                    .map(point => {
                      const x = point.x - shape.x;
                      const y = point.y - shape.y;
                      return `${x},${y}`;
                    });
                  
                  if (vertices.length < 3) {
                    return `${shape.width/2},0 0,${shape.height} ${shape.width},${shape.height}`;
                  }
                  
                  // 세 꼭짓점의 좌표를 사용해 폴리곤 포인트 생성
                  return vertices.join(' ');
                })()}
                fill="transparent"
                stroke="#444444"
                strokeWidth="2"
              />
              {shape.points.map((point, pointIndex) => {
                // SVG 내에서의 상대 위치 계산
                const svgX = point.x - shape.x; 
                const svgY = point.y - shape.y;
                
                return (
                  <g key={pointIndex}>
                    <circle
                      cx={svgX}
                      cy={svgY}
                      r="3"
                      fill={(selectedPoint?.point === point || hoveredPoint === point) ? '#0066cc' : '#444444'}
                      className={`point ${point.type}`}
                      style={{ transform: 'none' }}
                    />
                    <text
                      x={calculatePointLabelPosition(point, shape).x - shape.x}
                      y={calculatePointLabelPosition(point, shape).y - shape.y}
                      fill="#444444"
                      fontSize="12"
                      style={{ userSelect: 'none', textShadow: "0px 0px 3px white" }}
                    >
                      {point.label}
                    </text>
                  </g>
                );
              })}
              {shape.lines?.map((line, lineIndex) => (
                <g key={`line-${lineIndex}`}>
                  <line
                    x1={line.startPoint.x - shape.x}
                    y1={line.startPoint.y - shape.y}
                    x2={line.endPoint.x - shape.x}
                    y2={line.endPoint.y - shape.y}
                    stroke="#444444"
                    strokeWidth="2"
                    className={`line ${
                      (hoveredLine?.line === line || selectedLine?.line === line) ? 'highlighted' : ''
                    }`}
                  />
                  {line.length && (
                    <text
                      x={calculateLengthTextPosition(
                        line.startPoint.x - shape.x,
                        line.startPoint.y - shape.y,
                        line.endPoint.x - shape.x,
                        line.endPoint.y - shape.y
                      ).x}
                      y={calculateLengthTextPosition(
                        line.startPoint.x - shape.x,
                        line.startPoint.y - shape.y,
                        line.endPoint.x - shape.x,
                        line.endPoint.y - shape.y
                      ).y}
                      fill="#444444"
                      fontSize="12"
                      textAnchor="middle"
                      dy="-0.5em"
                    >
                      {`${line.length.value}${line.length.unit}`}
                    </text>
                  )}
                </g>
              ))}
              {shape.angles?.map((angle, angleIndex) => (
                <g key={`angle-${angleIndex}`}>
                  {Math.abs(angle.value - 90) < 0.1 ? (
                    // 직각 표시 (부채꼴 없이 작은 직각 표시만 사용)
                    <React.Fragment>
                      {/* 직각 표시 사각형 */}
                      {(() => {
                        const squarePos = calculateRightAngleSquarePosition(
                          { x: angle.vertex.x - shape.x, y: angle.vertex.y - shape.y },
                          { x: angle.lines[0].startPoint.x - shape.x, y: angle.lines[0].startPoint.y - shape.y },
                          { x: angle.lines[1].endPoint.x - shape.x, y: angle.lines[1].endPoint.y - shape.y },
                          10
                        );
                        return (
                          <rect
                            x={squarePos.x}
                            y={squarePos.y}
                            width={squarePos.width}
                            height={squarePos.height}
                            fill="none"
                            stroke="#444444"
                            strokeWidth="1.0"
                          />
                        );
                      })()}
                      {/* 각도 텍스트 - 직각일 때 */}
                      <text
                        x={calculateAngleTextPosition(
                          { x: angle.vertex.x - shape.x, y: angle.vertex.y - shape.y },
                          { x: angle.lines[0].startPoint.x - shape.x, y: angle.lines[0].startPoint.y - shape.y },
                          { x: angle.lines[1].endPoint.x - shape.x, y: angle.lines[1].endPoint.y - shape.y },
                          40
                        ).x}
                        y={calculateAngleTextPosition(
                          { x: angle.vertex.x - shape.x, y: angle.vertex.y - shape.y },
                          { x: angle.lines[0].startPoint.x - shape.x, y: angle.lines[0].startPoint.y - shape.y },
                          { x: angle.lines[1].endPoint.x - shape.x, y: angle.lines[1].endPoint.y - shape.y },
                          40
                        ).y + 4}
                        fill="#444444"
                        fontSize="12"
                        textAnchor="middle"
                        style={{ textShadow: "0px 0px 3px white" }}
                      >
                        {angle.value}°
                      </text>
                    </React.Fragment>
                  ) : (
                    // 일반 각도 부채꼴 표시
                    <React.Fragment>
                      <path
                        d={createArcPath(
                          { x: angle.vertex.x - shape.x, y: angle.vertex.y - shape.y },
                          { x: angle.lines[0].startPoint.x - shape.x, y: angle.lines[0].startPoint.y - shape.y },
                          { x: angle.lines[1].endPoint.x - shape.x, y: angle.lines[1].endPoint.y - shape.y },
                          16
                        )}
                        fill="none"
                        stroke="#444444"
                        strokeWidth="1.0"
                      />
                      {/* 각도 텍스트 */}
                      <text
                        x={calculateAngleTextPosition(
                          { x: angle.vertex.x - shape.x, y: angle.vertex.y - shape.y },
                          { x: angle.lines[0].startPoint.x - shape.x, y: angle.lines[0].startPoint.y - shape.y },
                          { x: angle.lines[1].endPoint.x - shape.x, y: angle.lines[1].endPoint.y - shape.y },
                          35
                        ).x}
                        y={calculateAngleTextPosition(
                          { x: angle.vertex.x - shape.x, y: angle.vertex.y - shape.y },
                          { x: angle.lines[0].startPoint.x - shape.x, y: angle.lines[0].startPoint.y - shape.y },
                          { x: angle.lines[1].endPoint.x - shape.x, y: angle.lines[1].endPoint.y - shape.y },
                          35
                        ).y + 4}
                        fill="#444444"
                        fontSize="12"
                        textAnchor="middle"
                        style={{ textShadow: "0px 0px 3px white" }}
                      >
                        {angle.value}°
                      </text>
                    </React.Fragment>
                  )}
                </g>
              ))}
            </svg>
          );
        } else if (shape.type === 'rectangle') {
          const rectStyle: React.CSSProperties = {
            ...baseStyle,
            border: '2px solid #444444',
            backgroundColor: 'transparent'
          };
          
          return (
            <div key={index} className="shape rectangle" style={rectStyle}>
              {shape.points.map((point, pointIndex) => (
                <div
                  key={pointIndex}
                  className={`point ${point.type} ${
                    selectedPoint?.point === point || hoveredPoint === point ? 'selected' : ''
                  }`}
                  style={{
                    position: 'absolute',
                    left: point.type === 'center' ? '50%' : `${((point.x - shape.x) / shape.width) * 100}%`,
                    top: point.type === 'center' ? '50%' : `${((point.y - shape.y) / shape.height) * 100}%`,
                    transform: 'translate(-50%, -50%)'
                  }}
                >
                  <span 
                    className="point-label"
                    style={{
                      position: 'absolute',
                      left: `${calculatePointLabelPosition(point, shape).x - point.x}px`,
                      top: `${calculatePointLabelPosition(point, shape).y - point.y}px`,
                      textShadow: "0px 0px 3px white"
                    }}
                  >{point.label}</span>
                </div>
              ))}
              {shape.lines?.map((line, lineIndex) => (
                <svg
                  key={`line-${lineIndex}`}
                  className="line-container"
                  style={{
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    width: '100%',
                    height: '100%',
                    overflow: 'visible',
                    pointerEvents: 'none'
                  }}
                >
                  <line
                    x1={line.startPoint.x - shape.x}
                    y1={line.startPoint.y - shape.y}
                    x2={line.endPoint.x - shape.x}
                    y2={line.endPoint.y - shape.y}
                    stroke="#444444"
                    strokeWidth="2"
                    className={`line ${
                      (hoveredLine?.line === line || selectedLine?.line === line) ? 'highlighted' : ''
                    }`}
                  />
                  {line.length && (
                    <text
                      x={calculateLengthTextPosition(
                        line.startPoint.x - shape.x,
                        line.startPoint.y - shape.y,
                        line.endPoint.x - shape.x,
                        line.endPoint.y - shape.y
                      ).x}
                      y={calculateLengthTextPosition(
                        line.startPoint.x - shape.x,
                        line.startPoint.y - shape.y,
                        line.endPoint.x - shape.x,
                        line.endPoint.y - shape.y
                      ).y}
                      fill="#444444"
                      fontSize="12"
                      textAnchor="middle"
                      dy="-0.5em"
                    >
                      {`${line.length.value}${line.length.unit}`}
                    </text>
                  )}
                </svg>
              ))}
              {shape.angles?.map((angle, angleIndex) => (
                <svg
                  key={`angle-${angleIndex}`}
                  className="angle-container"
                  style={{
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    width: '100%',
                    height: '100%',
                    overflow: 'visible',
                    pointerEvents: 'none'
                  }}
                >
                  {Math.abs(angle.value - 90) < 0.1 ? (
                    // 직각 표시 (부채꼴 없이 작은 직각 표시만 사용)
                    <React.Fragment>
                      {/* 직각 표시 사각형 */}
                      {(() => {
                        const squarePos = calculateRightAngleSquarePosition(
                          { x: angle.vertex.x - shape.x, y: angle.vertex.y - shape.y },
                          { x: angle.lines[0].startPoint.x - shape.x, y: angle.lines[0].startPoint.y - shape.y },
                          { x: angle.lines[1].endPoint.x - shape.x, y: angle.lines[1].endPoint.y - shape.y },
                          10
                        );
                        return (
                          <rect
                            x={squarePos.x}
                            y={squarePos.y}
                            width={squarePos.width}
                            height={squarePos.height}
                            fill="none"
                            stroke="#444444"
                            strokeWidth="1.0"
                          />
                        );
                      })()}
                      {/* 각도 텍스트 - 직각일 때 */}
                      <text
                        x={calculateAngleTextPosition(
                          { x: angle.vertex.x - shape.x, y: angle.vertex.y - shape.y },
                          { x: angle.lines[0].startPoint.x - shape.x, y: angle.lines[0].startPoint.y - shape.y },
                          { x: angle.lines[1].endPoint.x - shape.x, y: angle.lines[1].endPoint.y - shape.y },
                          40
                        ).x}
                        y={calculateAngleTextPosition(
                          { x: angle.vertex.x - shape.x, y: angle.vertex.y - shape.y },
                          { x: angle.lines[0].startPoint.x - shape.x, y: angle.lines[0].startPoint.y - shape.y },
                          { x: angle.lines[1].endPoint.x - shape.x, y: angle.lines[1].endPoint.y - shape.y },
                          40
                        ).y + 4}
                        fill="#444444"
                        fontSize="12"
                        textAnchor="middle"
                        style={{ textShadow: "0px 0px 3px white" }}
                      >
                        {angle.value}°
                      </text>
                    </React.Fragment>
                  ) : (
                    // 일반 각도 부채꼴 표시
                    <React.Fragment>
                      <path
                        d={createArcPath(
                          { x: angle.vertex.x - shape.x, y: angle.vertex.y - shape.y },
                          { x: angle.lines[0].startPoint.x - shape.x, y: angle.lines[0].startPoint.y - shape.y },
                          { x: angle.lines[1].endPoint.x - shape.x, y: angle.lines[1].endPoint.y - shape.y },
                          16
                        )}
                        fill="none"
                        stroke="#444444"
                        strokeWidth="1.0"
                      />
                      {/* 각도 텍스트 */}
                      <text
                        x={calculateAngleTextPosition(
                          { x: angle.vertex.x - shape.x, y: angle.vertex.y - shape.y },
                          { x: angle.lines[0].startPoint.x - shape.x, y: angle.lines[0].startPoint.y - shape.y },
                          { x: angle.lines[1].endPoint.x - shape.x, y: angle.lines[1].endPoint.y - shape.y },
                          35
                        ).x}
                        y={calculateAngleTextPosition(
                          { x: angle.vertex.x - shape.x, y: angle.vertex.y - shape.y },
                          { x: angle.lines[0].startPoint.x - shape.x, y: angle.lines[0].startPoint.y - shape.y },
                          { x: angle.lines[1].endPoint.x - shape.x, y: angle.lines[1].endPoint.y - shape.y },
                          35
                        ).y + 4}
                        fill="#444444"
                        fontSize="12"
                        textAnchor="middle"
                        style={{ textShadow: "0px 0px 3px white" }}
                      >
                        {angle.value}°
                      </text>
                    </React.Fragment>
                  )}
                </svg>
              ))}
            </div>
          );
        }
        return null;
      })}
      {currentShape && (
        <div
          className={`shape ${currentShape.type}`}
          style={{
            left: `${currentShape.x}px`,
            top: `${currentShape.y}px`,
            width: `${currentShape.width}px`,
            height: `${currentShape.height}px`,
          }}
        />
      )}
      {hoverPoint && (
        <div
          className={`point-placeholder ${hoverPoint.type}`}
          style={{
            left: `${hoverPoint.x}px`,
            top: `${hoverPoint.y}px`,
          }}
        />
      )}
      {tempLine && (
        <svg
          className="line-container"
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
          }}
        >
          <line
            x1={tempLine.start.x}
            y1={tempLine.start.y}
            x2={tempLine.end.x}
            y2={tempLine.end.y}
            className="line-placeholder"
          />
        </svg>
      )}
      {selectedPoint && (
        <div className="line-drawing-hint">
          ESC를 눌러 취소
        </div>
      )}
      
      {selectedTool === 'transform' && !transformingVertex && (
        <div className="transform-hint" style={{
          position: 'absolute',
          bottom: '10px',
          left: '10px',
          padding: '5px 10px',
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          color: 'white',
          borderRadius: '4px',
          fontSize: '14px',
          pointerEvents: 'none'
        }}>
          삼각형의 꼭짓점을 선택하여 변형하세요
        </div>
      )}
      
      {transformingVertex && (
        <div className="transform-hint" style={{
          position: 'absolute',
          bottom: '10px',
          left: '10px',
          padding: '5px 10px',
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          color: 'white',
          borderRadius: '4px',
          fontSize: '14px',
          pointerEvents: 'none'
        }}>
          마우스를 떼면 변형이 완료됩니다
        </div>
      )}
      
      {selectedLine && (
        <div
          className="length-input-container"
          style={{
            left: `${(selectedLine.line.startPoint.x + selectedLine.line.endPoint.x) / 2}px`,
            top: `${(selectedLine.line.startPoint.y + selectedLine.line.endPoint.y) / 2}px`,
          }}
        >
          <LengthInput
            initialValue={selectedLine.line.length}
            onSubmit={handleLengthSubmit}
            onCancel={() => setSelectedLine(null)}
          />
        </div>
      )}
      {/* 선택된 선분 강조 표시 */}
      {firstSelectedLine && (
        <div
          className="selected-line-indicator"
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none'
          }}
        >
          <svg width="100%" height="100%" style={{ position: 'absolute', overflow: 'visible' }}>
            <line
              x1={firstSelectedLine.line.startPoint.x}
              y1={firstSelectedLine.line.startPoint.y}
              x2={firstSelectedLine.line.endPoint.x}
              y2={firstSelectedLine.line.endPoint.y}
              stroke="#0066cc"
              strokeWidth="3"
              strokeDasharray="5,3"
            />
          </svg>
        </div>
      )}
      
      {secondSelectedLine && (
        <div
          className="selected-line-indicator"
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none'
          }}
        >
          <svg width="100%" height="100%" style={{ position: 'absolute', overflow: 'visible' }}>
            <line
              x1={secondSelectedLine.line.startPoint.x}
              y1={secondSelectedLine.line.startPoint.y}
              x2={secondSelectedLine.line.endPoint.x}
              y2={secondSelectedLine.line.endPoint.y}
              stroke="#0066cc"
              strokeWidth="3"
              strokeDasharray="5,3"
            />
          </svg>
        </div>
      )}
      {hoveredVertex && selectedTool === 'transform' && (
        <div
          className="vertex-hover-indicator"
          style={{
            position: 'absolute',
            left: `${hoveredVertex.point.x - 8}px`,
            top: `${hoveredVertex.point.y - 8}px`,
            width: '16px',
            height: '16px',
            borderRadius: '50%',
            border: '2px solid #0066cc',
            backgroundColor: 'rgba(0, 102, 204, 0.3)',
            pointerEvents: 'none',
            zIndex: 1000
          }}
        />
      )}
      {transformingVertex && (
        <div
          className="vertex-transform-indicator"
          style={{
            position: 'absolute',
            left: `${transformingVertex.point.x - 8}px`,
            top: `${transformingVertex.point.y - 8}px`,
            width: '16px',
            height: '16px',
            borderRadius: '50%',
            border: '2px solid #ff3366',
            backgroundColor: 'rgba(255, 51, 102, 0.3)',
            pointerEvents: 'none',
            zIndex: 1000
          }}
        />
      )}
    </div>
  );
});

interface LengthInputProps {
  initialValue?: Length;
  onSubmit: (length: Length) => void;
  onCancel: () => void;
}

const LengthInput: React.FC<LengthInputProps> = ({ initialValue, onSubmit, onCancel }) => {
  const [value, setValue] = useState(initialValue?.value.toString() || '');
  const [unit, setUnit] = useState<'mm' | 'cm' | 'm'>(initialValue?.unit || 'cm');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numValue = parseFloat(value);
    if (!isNaN(numValue)) {
      onSubmit({ value: numValue, unit });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="length-input-form">
      <input
        type="number"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        step="any"
        autoFocus
      />
      <select value={unit} onChange={(e) => setUnit(e.target.value as 'mm' | 'cm' | 'm')}>
        <option value="mm">mm</option>
        <option value="cm">cm</option>
        <option value="m">m</option>
      </select>
      <button type="submit">확인</button>
      <button type="button" onClick={onCancel}>취소</button>
    </form>
  );
};

// 길이 텍스트의 위치를 계산하는 함수
const calculateLengthTextPosition = (
  startX: number, 
  startY: number, 
  endX: number, 
  endY: number,
  offset: number = 15
): { x: number; y: number } => {
  // 선분의 중점 계산
  const midX = (startX + endX) / 2;
  const midY = (startY + endY) / 2;
  
  // 선분의 각도 계산 (라디안)
  const angle = Math.atan2(endY - startY, endX - startX);
  
  // 선분과 수직인 방향으로 오프셋 적용
  // 텍스트는 항상 선분의 위쪽(90도 회전)에 배치
  const offsetX = -Math.sin(angle) * offset;
  const offsetY = Math.cos(angle) * offset;
  
  return {
    x: midX + offsetX,
    y: midY + offsetY
  };
};

// 각도 텍스트 위치 계산 함수 추가
const calculateAngleTextPosition = (
  vertex: { x: number; y: number },
  point1: { x: number; y: number },
  point2: { x: number; y: number },
  radius: number = 35
): { x: number; y: number } => {
  // 벡터 계산
  const vector1 = {
    x: point1.x - vertex.x,
    y: point1.y - vertex.y
  };
  
  const vector2 = {
    x: point2.x - vertex.x,
    y: point2.y - vertex.y
  };
  
  // 벡터 정규화
  const length1 = Math.sqrt(vector1.x * vector1.x + vector1.y * vector1.y);
  const length2 = Math.sqrt(vector2.x * vector2.x + vector2.y * vector2.y);
  
  const normalized1 = {
    x: vector1.x / length1,
    y: vector1.y / length1
  };
  
  const normalized2 = {
    x: vector2.x / length2,
    y: vector2.y / length2
  };
  
  // 내적으로 두 벡터의 사이각 확인
  const dotProduct = normalized1.x * normalized2.x + normalized1.y * normalized2.y;
  const angleCos = Math.max(-1, Math.min(1, dotProduct));
  
  // 두 벡터의 중간 벡터 계산
  const middleVector = {
    x: normalized1.x + normalized2.x,
    y: normalized1.y + normalized2.y
  };
  
  // 중간 벡터 정규화
  const middleLength = Math.sqrt(middleVector.x * middleVector.x + middleVector.y * middleVector.y);
  
  // 각도가 매우 작거나 180도에 가까울 때 방향 조정
  let adjustedVector;
  
  if (middleLength < 0.0001) {
    // 두 벡터가 거의 반대 방향인 경우(180도에 가까울 때)
    adjustedVector = {
      x: -normalized1.y,
      y: normalized1.x
    };
  } else {
    // 두 벡터의 합을 정규화하여 중간 방향 구하기
    adjustedVector = {
      x: middleVector.x / middleLength,
      y: middleVector.y / middleLength
    };
  }
  
  // 텍스트를 약간 더 외부로 배치하여 부채꼴과 겹치지 않도록
  const textRadius = radius * 1.3;
  
  // 텍스트 위치 계산
  return {
    x: vertex.x + adjustedVector.x * textRadius,
    y: vertex.y + adjustedVector.y * textRadius
  };
};

// 직각 표시 사각형의 위치를 계산하는 함수
const calculateRightAngleSquarePosition = (
  vertex: { x: number; y: number },
  point1: { x: number; y: number },
  point2: { x: number; y: number },
  size: number = 12
): { x: number; y: number; width: number; height: number } => {
  // 벡터 계산
  const vector1 = {
    x: point1.x - vertex.x,
    y: point1.y - vertex.y
  };
  
  const vector2 = {
    x: point2.x - vertex.x,
    y: point2.y - vertex.y
  };
  
  // 벡터 정규화
  const length1 = Math.sqrt(vector1.x * vector1.x + vector1.y * vector1.y);
  const length2 = Math.sqrt(vector2.x * vector2.x + vector2.y * vector2.y);
  
  const normalized1 = {
    x: vector1.x / length1,
    y: vector1.y / length1
  };
  
  const normalized2 = {
    x: vector2.x / length2,
    y: vector2.y / length2
  };
  
  // 두 벡터의 중간 벡터 계산
  const middleVector = {
    x: normalized1.x + normalized2.x,
    y: normalized1.y + normalized2.y
  };
  
  // 중간 벡터 정규화
  const middleLength = Math.sqrt(middleVector.x * middleVector.x + middleVector.y * middleVector.y);
  
  // 두 벡터 사이의 내각 방향으로 위치 계산
  let positionVector;
  
  if (middleLength < 0.0001) {
    // 두 벡터가 180도에 가까울 때 (반대 방향)
    positionVector = {
      x: -normalized1.y,
      y: normalized1.x
    };
  } else {
    // 일반적인 경우: 두 벡터의 합 벡터 방향 사용
    positionVector = {
      x: middleVector.x / middleLength,
      y: middleVector.y / middleLength
    };
  }
  
  // 꼭짓점에서 사각형을 약간 떨어뜨려 배치
  const offset = size / 2;
  
  return {
    x: vertex.x + positionVector.x * offset - size / 2,
    y: vertex.y + positionVector.y * offset - size / 2,
    width: size,
    height: size
  };
};

// 점 레이블의 위치를 계산하는 함수
const calculatePointLabelPosition = (
  point: Point,
  shape: Shape
): { x: number; y: number } => {
  // 기본 오프셋(픽셀 단위)
  const offset = 15;
  let labelX = 0;
  let labelY = 0;
  
  // 점 타입에 따라 레이블 위치 계산
  if (point.type === 'center') {
    // 중심점은 우측 상단에 표시
    labelX = point.x + offset;
    labelY = point.y - offset;
  } else if (point.type === 'vertex') {
    // 꼭짓점 위치에 따라 레이블 위치 조정
    const isTopVertex = Math.abs(point.y - shape.y) < 10; // 상단 꼭짓점
    const isBottomVertex = Math.abs(point.y - (shape.y + shape.height)) < 10; // 하단 꼭짓점
    const isLeftVertex = Math.abs(point.x - shape.x) < 10; // 좌측 꼭짓점
    const isRightVertex = Math.abs(point.x - (shape.x + shape.width)) < 10; // 우측 꼭짓점
    
    if (isTopVertex && isLeftVertex) {
      // 좌상단 꼭짓점은 우측 상단에 레이블
      labelX = point.x + offset;
      labelY = point.y - offset;
    } else if (isTopVertex && isRightVertex) {
      // 우상단 꼭짓점은 좌측 상단에 레이블
      labelX = point.x - offset;
      labelY = point.y - offset;
    } else if (isBottomVertex && isLeftVertex) {
      // 좌하단 꼭짓점은 우측 하단에 레이블
      labelX = point.x + offset;
      labelY = point.y + offset;
    } else if (isBottomVertex && isRightVertex) {
      // 우하단 꼭짓점은 좌측 하단에 레이블
      labelX = point.x - offset;
      labelY = point.y + offset;
    } else if (isTopVertex) {
      // 상단 변 중간 꼭짓점은 아래에 레이블
      labelX = point.x;
      labelY = point.y + offset;
    } else if (isBottomVertex) {
      // 하단 변 중간 꼭짓점은 위에 레이블
      labelX = point.x;
      labelY = point.y - offset;
    } else if (isLeftVertex) {
      // 좌측 변 중간 꼭짓점은 우측에 레이블
      labelX = point.x + offset;
      labelY = point.y;
    } else if (isRightVertex) {
      // 우측 변 중간 꼭짓점은 좌측에 레이블
      labelX = point.x - offset;
      labelY = point.y;
    }
  } else if (point.type === 'edge') {
    // 가장자리 점은 도형 바깥쪽 방향으로 레이블 표시
    const centerX = shape.x + shape.width / 2;
    const centerY = shape.y + shape.height / 2;
    
    // 점에서 중심까지의 벡터 계산 (도형 바깥쪽 방향)
    const vectorX = point.x - centerX;
    const vectorY = point.y - centerY;
    
    // 벡터 정규화
    const length = Math.sqrt(vectorX * vectorX + vectorY * vectorY);
    const normalizedX = vectorX / length;
    const normalizedY = vectorY / length;
    
    // 정규화된 벡터 방향으로 오프셋 적용
    labelX = point.x + normalizedX * offset;
    labelY = point.y + normalizedY * offset;
  }
  
  return { x: labelX, y: labelY };
};

export default Canvas; 