// 기본 좌표 타입
export interface Point {
  x: number;
  y: number;
}

// 점 타입 (도형 위에 찍는 점)
export interface GeometryPoint {
  id: string;
  position: Point; // 점의 위치 정보
  label: string;
  shapeId: string; // 어떤 도형 위에 있는지
  type: 'vertex' | 'center' | 'edge'; // 꼭짓점, 중심점, 테두리점
  vertexIndex?: number; // 꼭짓점인 경우 해당 인덱스
}

// 도형 기본 타입
export interface BaseShape {
  id: string;
  type: 'circle' | 'triangle' | 'rectangle';
  x: number;      // 도형의 시작 x 좌표
  y: number;      // 도형의 시작 y 좌표
  width: number;  // 도형의 너비
  height: number; // 도형의 높이
}

// 원
export interface Circle extends BaseShape {
  type: 'circle';
}

// 변형된 삼각형 (개별 꼭짓점 좌표 저장)
export interface TransformedTriangle extends BaseShape {
  type: 'triangle';
  vertices: [Point, Point, Point]; // 3개 꼭짓점
  isTransformed: true; // 변형된 상태임을 표시
}

// 일반 삼각형
export interface Triangle extends BaseShape {
  type: 'triangle';
  isTransformed?: false;
}

// 사각형
export interface Rectangle extends BaseShape {
  type: 'rectangle';
  isTransformed?: false;
}

// 변형된 사각형 (개별 꼭짓점 좌표 저장)
export interface TransformedRectangle extends BaseShape {
  type: 'rectangle';
  vertices: [Point, Point, Point, Point]; // 4개 꼭짓점
  isTransformed: true; // 변형된 상태임을 표시
}

// 모든 도형 타입 (변형된 도형 포함)
export type Shape = Circle | Triangle | Rectangle | TransformedTriangle | TransformedRectangle;

// 도구 타입
export type Tool = 'select' | 'rectangle' | 'triangle' | 'circle' | 'point' | 'line' | 'delete' | 'clear' | 'transform';

// 도형 생성 도구들
export type DrawingTool = 'circle' | 'triangle' | 'rectangle';

// 삭제 도구들
export type DeleteTool = 'delete' | 'clear';

// 상수들
export const MIN_SHAPE_SIZE = 20;
export const POINT_RADIUS = 4;
export const SNAP_DISTANCE = 15; // 스냅 거리

export const SHAPE_STYLES = {
  fill: 'none',
  stroke: 'black',
  strokeWidth: '2'
} as const;

export const POINT_STYLES = {
  fill: 'black',
  stroke: 'black',
  strokeWidth: '1'
} as const;

export const LABEL_STYLES = {
  fontSize: '14px',
  fontFamily: 'Arial, sans-serif',
  fill: '#333',
  fontWeight: 'bold'
} as const;

export const DRAWING_TOOLS: DrawingTool[] = ['circle', 'triangle', 'rectangle'];

// 유틸리티 함수들
export const isDrawingTool = (tool: Tool): tool is DrawingTool => {
  return DRAWING_TOOLS.includes(tool as DrawingTool);
};

export const isDeleteTool = (tool: Tool): tool is DeleteTool => {
  return tool === 'delete' || tool === 'clear';
};

// 선분 인터페이스
export interface LineSegment {
  id: string;
  startPoint: Point;
  endPoint: Point;
  startType: 'point' | 'edge' | 'line' | 'free';
  endType: 'point' | 'edge' | 'line' | 'free';
  startReference?: string; // 참조하는 점/도형/선분 ID
  endReference?: string;
  // 직각 정보 (끝점이 직각을 이루는 경우)
  isRightAngle?: boolean;
  rightAngleTarget?: { start: Point; end: Point }; // 직각을 이루는 대상 선분/변
}

// 선분 스타일 (도형과 동일한 스타일)
export const LINE_STYLES = {
  stroke: 'black',
  strokeWidth: '2',
  fill: 'none'
} as const;

// 선분 미리보기 스타일 (점선)
export const LINE_PREVIEW_STYLES = {
  stroke: 'black',
  strokeWidth: '2',
  strokeDasharray: '5,5',
  fill: 'none',
  opacity: '0.7'
} as const;

// 수선 스냅 정보
export interface PerpendicularSnap {
  point: Point; // 수선의 발 위치
  targetType: 'line' | 'edge'; // 수선이 만나는 대상 (선분 또는 도형 변)
  targetId: string; // 대상의 ID
  targetStart: Point; // 대상 선분의 시작점
  targetEnd: Point; // 대상 선분의 끝점
  sourcePoint: Point; // 수선을 내리는 시작점
}

// 수선 선분 미리보기 스타일 (파란색)
export const LINE_PERPENDICULAR_PREVIEW_STYLES = {
  stroke: '#007bff',
  strokeWidth: '2',
  strokeDasharray: '5,5',
  fill: 'none',
  opacity: '0.8'
} as const;

// 변형 관련 타입
export interface TransformState {
  isTransforming: boolean;
  selectedShape: Shape | null;
  selectedVertexIndex: number | null;
  originalVertices: Point[];
  hoverVertexIndex: number | null;
} 