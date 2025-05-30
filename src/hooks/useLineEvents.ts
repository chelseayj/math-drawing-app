import { useState, useCallback } from 'react';
import { Point, Shape, GeometryPoint, LineSegment, PerpendicularSnap } from '../types';
import { findSnapTargetWithPerpendicular } from '../utils/snapUtils';
import { PointToPointSnap } from '../utils/pointToPointSnapUtils';

interface UseLineEventsProps {
  shapes: Shape[];
  points: GeometryPoint[];
  lines: LineSegment[];
  onLineCreate: (line: LineSegment) => void;
}

export const useLineEvents = ({ shapes, points, lines, onLineCreate }: UseLineEventsProps) => {
  const [isDrawingLine, setIsDrawingLine] = useState(false);
  const [lineStartPoint, setLineStartPoint] = useState<Point | null>(null);
  const [lineStartInfo, setLineStartInfo] = useState<{ type: string; reference?: string } | null>(null);
  const [previewLine, setPreviewLine] = useState<{ start: Point; end: Point } | null>(null);
  const [lineSnapFeedback, setLineSnapFeedback] = useState<Point | null>(null);
  const [perpendicularSnap, setPerpendicularSnap] = useState<PerpendicularSnap | null>(null);
  const [isPerpendicularPreview, setIsPerpendicularPreview] = useState(false);
  const [isPerpendicular, setIsPerpendicular] = useState(false);
  const [edgeInfo, setEdgeInfo] = useState<{ start: Point; end: Point } | null>(null);
  const [isPointToPoint, setIsPointToPoint] = useState(false);
  const [pointToPointInfo, setPointToPointInfo] = useState<PointToPointSnap | null>(null);
  const [currentSnapType, setCurrentSnapType] = useState<string | null>(null);

  // 선분 그리기 시작
  const handleLineStart = useCallback((point: Point) => {
    const snapTarget = findSnapTargetWithPerpendicular(point, shapes, points, lines, lineStartPoint);
    // 기존 점, 도형 꼭짓점, 도형 중심점을 시작점으로 허용
    if (snapTarget && ['point', 'vertex', 'center'].includes(snapTarget.type)) {
      setIsDrawingLine(true);
      setLineStartPoint(snapTarget.point);
      setLineStartInfo({ type: snapTarget.type, reference: snapTarget.reference });
    }
  }, [shapes, points, lines, lineStartPoint]);

  // 선분 그리기 완료
  const handleLineEnd = useCallback((point: Point) => {
    const snapTarget = findSnapTargetWithPerpendicular(point, shapes, points, lines, lineStartPoint);
    if (lineStartPoint && lineStartInfo) {
      // 끝점은 스냅되는 경우 스냅 위치를, 그렇지 않으면 마우스 위치를 사용
      const endPoint = snapTarget ? snapTarget.point : point;
      const endType = snapTarget?.isPerpendicularPreview ? 'free' : (snapTarget?.type || 'free');
      const endReference = snapTarget?.isPerpendicularPreview ? undefined : snapTarget?.reference;
      
      const newLine: LineSegment = {
        id: `line-${Date.now()}`,
        startPoint: lineStartPoint,
        endPoint: endPoint,
        startType: lineStartInfo.type as LineSegment['startType'],
        endType: endType as LineSegment['endType'],
        startReference: lineStartInfo.reference,
        endReference: endReference,
        isRightAngle: snapTarget?.isPerpendicular || snapTarget?.isPerpendicularPreview || false,
        rightAngleTarget: snapTarget?.edgeInfo || undefined
      };
      onLineCreate(newLine);
      
      // 상태 초기화
      setIsDrawingLine(false);
      setLineStartPoint(null);
      setLineStartInfo(null);
      setPreviewLine(null);
      setPerpendicularSnap(null);
      setIsPerpendicularPreview(false);
      setIsPointToPoint(false);
      setPointToPointInfo(null);
      setCurrentSnapType(null);
    }
  }, [shapes, points, lines, lineStartPoint, lineStartInfo, onLineCreate]);

  // 선분 미리보기 업데이트
  const handleLinePreview = useCallback((mousePoint: Point) => {
    if (!isDrawingLine) {
      const snapTarget = findSnapTargetWithPerpendicular(mousePoint, shapes, points, lines, lineStartPoint);
      // 시작점 후보: 기존 점, 도형 꼭짓점, 도형 중심점
      setLineSnapFeedback(snapTarget && ['point', 'vertex', 'center'].includes(snapTarget.type) ? snapTarget.point : null);
      setCurrentSnapType(snapTarget && ['point', 'vertex', 'center'].includes(snapTarget.type) ? snapTarget.type : null);
      setIsPerpendicular(false);
      setIsPointToPoint(false);
      setPointToPointInfo(null);
    } else if (lineStartPoint) {
      const snapTarget = findSnapTargetWithPerpendicular(mousePoint, shapes, points, lines, lineStartPoint);
      const endPoint = snapTarget ? snapTarget.point : mousePoint;
      setPreviewLine({ start: lineStartPoint, end: endPoint });
      
      if (snapTarget?.isPointToPoint) {
        // 점-점 연결 (최우선)
        setPerpendicularSnap(null);
        setIsPerpendicularPreview(false);
        setLineSnapFeedback(snapTarget.point);
        setIsPerpendicular(false);
        setEdgeInfo(null);
        setIsPointToPoint(true);
        setPointToPointInfo(snapTarget.pointToPointInfo || null);
        setCurrentSnapType('point-to-point');
      } else if (snapTarget?.isPerpendicularPreview) {
        // 수선 스냅
        setPerpendicularSnap(null);
        setIsPerpendicularPreview(true);
        setLineSnapFeedback(snapTarget.point);
        setIsPerpendicular(true);
        setEdgeInfo(null);
        setIsPointToPoint(false);
        setPointToPointInfo(null);
        setCurrentSnapType('perpendicular');
      } else {
        // 일반 스냅 (끝점은 어디든 가능)
        setPerpendicularSnap(null);
        setIsPerpendicularPreview(false);
        setLineSnapFeedback(snapTarget && snapTarget.type !== 'free' ? snapTarget.point : null);
        setIsPerpendicular(snapTarget?.isPerpendicular || false);
        setEdgeInfo(snapTarget?.edgeInfo || null);
        setIsPointToPoint(false);
        setPointToPointInfo(null);
        setCurrentSnapType(snapTarget ? snapTarget.type : null);
      }
    }
  }, [shapes, points, lines, isDrawingLine, lineStartPoint]);

  // 선분 상태 초기화
  const resetLineState = useCallback(() => {
    setLineSnapFeedback(null);
    setPreviewLine(null);
    setPerpendicularSnap(null);
    setIsPerpendicularPreview(false);
    setIsPerpendicular(false);
    setEdgeInfo(null);
    setIsPointToPoint(false);
    setPointToPointInfo(null);
    setCurrentSnapType(null);
  }, []);

  // 선분 그리기 취소 (ESC 키용)
  const cancelLineDrawing = useCallback(() => {
    if (isDrawingLine) {
      setIsDrawingLine(false);
      setLineStartPoint(null);
      setLineStartInfo(null);
      setPreviewLine(null);
      setPerpendicularSnap(null);
      setIsPerpendicularPreview(false);
      setIsPerpendicular(false);
      setEdgeInfo(null);
      setIsPointToPoint(false);
      setPointToPointInfo(null);
      setCurrentSnapType(null);
    }
  }, [isDrawingLine]);

  return {
    isDrawingLine,
    lineSnapFeedback,
    previewLine,
    perpendicularSnap,
    isPerpendicularPreview,
    isPerpendicular,
    edgeInfo,
    isPointToPoint,
    pointToPointInfo,
    currentSnapType,
    handleLineStart,
    handleLineEnd,
    handleLinePreview,
    resetLineState,
    cancelLineDrawing
  };
}; 