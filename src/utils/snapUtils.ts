import { Point, Shape, GeometryPoint, LineSegment, PerpendicularSnap } from '../types';
import { 
  findPerpendicularSnapToLines, 
  findPerpendicularSnapToShapeEdges 
} from './perpendicularUtils';
import { findBasicSnapTarget } from './basicSnapUtils';
import { findSnapTargetWithPerpendicularCorrection } from './perpendicularSnapUtils';

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

// 확장된 스냅 타겟 찾기 (기존 + 수선)
export const findSnapTargetWithPerpendicular = (
  mousePoint: Point,
  shapes: Shape[],
  points: GeometryPoint[],
  lines: LineSegment[],
  lineStartPoint: Point | null = null,
  tolerance: number = 15
): {
  point: Point;
  type: 'point' | 'edge' | 'line' | 'free';
  reference?: string;
  isPerpendicular?: boolean;
  edgeInfo?: { start: Point; end: Point };
  isPerpendicularPreview?: boolean;
} => {
  // 기존 스냅 로직 (점, 테두리, 선분)
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
   
  return basicSnapTarget;
}; 