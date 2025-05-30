import { Point, Shape, GeometryPoint, LineSegment, PerpendicularSnap } from '../types';
import { 
  findPerpendicularSnapToLines, 
  findPerpendicularSnapToShapeEdges 
} from './perpendicularUtils';
import { findBasicSnapTarget } from './basicSnapUtils';
import { findSnapTargetWithPerpendicularCorrection } from './perpendicularSnapUtils';
import { 
  findPointToPointSnap, 
  isValidPointToPointConnection,
  PointToPointSnap 
} from './pointToPointSnapUtils';

// 수선 스냅 타겟 찾기 (통합)
export const findPerpendicularSnapTarget = (
  sourcePoint: Point,
  shapes: Shape[],
  lines: LineSegment[],
  tolerance: number = 15
): PerpendicularSnap | null => {
  // 1. 선분에 대한 수선 스냅 확인
  const lineSnap = findPerpendicularSnapToLines(sourcePoint, lines, tolerance);
  if (lineSnap) return lineSnap;
  
  // 2. 도형 변에 대한 수선 스냅 확인
  const shapeSnap = findPerpendicularSnapToShapeEdges(sourcePoint, shapes, tolerance);
  if (shapeSnap) return shapeSnap;
  
  return null;
};

// 확장된 스냅 타겟 찾기 (점-점 연결 우선 + 기존 + 수선)
export const findSnapTargetWithPerpendicular = (
  mousePoint: Point,
  shapes: Shape[],
  points: GeometryPoint[],
  lines: LineSegment[],
  lineStartPoint: Point | null = null,
  tolerance: number = 15
): {
  point: Point;
  type: 'point' | 'vertex' | 'center' | 'edge' | 'line' | 'free';
  reference?: string;
  vertexIndex?: number;
  isPerpendicular?: boolean;
  edgeInfo?: { start: Point; end: Point };
  isPerpendicularPreview?: boolean;
  isPointToPoint?: boolean;
  pointToPointInfo?: PointToPointSnap;
} => {
  // 선분 그리기 중일 때 점-점 연결을 최우선으로 확인
  if (lineStartPoint) {
    const pointToPointSnap = findPointToPointSnap(lineStartPoint, mousePoint, points, shapes, 20);
    
    if (pointToPointSnap && isValidPointToPointConnection(lineStartPoint, pointToPointSnap.point)) {
      return {
        point: pointToPointSnap.point,
        type: 'point',
        reference: pointToPointSnap.targetPointId,
        isPointToPoint: true,
        pointToPointInfo: pointToPointSnap
      };
    }
  }

  // 기존 스냅 로직 (점, 도형 스냅 포인트, 테두리, 선분)
  const basicSnapTarget = findBasicSnapTarget(mousePoint, shapes, points, lines, tolerance);
  
  // 직각 보정이 포함된 스냅 타겟 찾기 (lineStartPoint가 있을 때만)
  if (lineStartPoint) {
    const perpendicularCorrection = findSnapTargetWithPerpendicularCorrection(mousePoint, shapes, points, lines, lineStartPoint, tolerance);
    
    if (perpendicularCorrection) {
      return {
        point: perpendicularCorrection.point,
        type: perpendicularCorrection.type,
        reference: perpendicularCorrection.reference,
        isPerpendicular: perpendicularCorrection.isPerpendicular,
        edgeInfo: perpendicularCorrection.edgeInfo
      };
    }
    
    // 수선 스냅 확인
    const perpendicularSnap = findPerpendicularSnapToShapeEdges(lineStartPoint, shapes, tolerance) ||
                             findPerpendicularSnapToLines(lineStartPoint, lines, tolerance);
    
    if (perpendicularSnap) {
      return {
        point: perpendicularSnap.point,
        type: 'edge',
        reference: perpendicularSnap.targetId,
        isPerpendicularPreview: true
      };
    }
  }
   
  return {
    ...basicSnapTarget,
    vertexIndex: basicSnapTarget.vertexIndex
  };
}; 