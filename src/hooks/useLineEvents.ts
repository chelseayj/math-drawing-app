import { useState, useCallback } from 'react';
import { Point, Shape, GeometryPoint, LineSegment, PerpendicularSnap } from '../types';
import { findSnapTargetWithPerpendicular } from '../utils/snapUtils';

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

  // 선분 그리기 시작
  const handleLineStart = useCallback((point: Point) => {
    const snapTarget = findSnapTargetWithPerpendicular(point, shapes, points, lines, lineStartPoint);
    if (snapTarget && snapTarget.type === 'point') {
      setIsDrawingLine(true);
      setLineStartPoint(snapTarget.point);
      setLineStartInfo({ type: snapTarget.type, reference: snapTarget.reference });
    }
  }, [shapes, points, lines, lineStartPoint]);

  // 선분 그리기 완료
  const handleLineEnd = useCallback((point: Point) => {
    const snapTarget = findSnapTargetWithPerpendicular(point, shapes, points, lines, lineStartPoint);
    if (snapTarget && lineStartPoint && lineStartInfo) {
      const newLine: LineSegment = {
        id: `line-${Date.now()}`,
        startPoint: lineStartPoint,
        endPoint: snapTarget.point,
        startType: lineStartInfo.type as LineSegment['startType'],
        endType: snapTarget.isPerpendicularPreview ? 'free' : snapTarget.type as LineSegment['endType'],
        startReference: lineStartInfo.reference,
        endReference: snapTarget.isPerpendicularPreview ? undefined : snapTarget.reference,
        isRightAngle: snapTarget.isPerpendicular || snapTarget.isPerpendicularPreview || false,
        rightAngleTarget: snapTarget.edgeInfo || undefined
      };
      onLineCreate(newLine);
      
      // 상태 초기화
      setIsDrawingLine(false);
      setLineStartPoint(null);
      setLineStartInfo(null);
      setPreviewLine(null);
      setPerpendicularSnap(null);
      setIsPerpendicularPreview(false);
    }
  }, [shapes, points, lines, lineStartPoint, lineStartInfo, onLineCreate]);

  // 선분 미리보기 업데이트
  const handleLinePreview = useCallback((mousePoint: Point) => {
    if (!isDrawingLine) {
      const snapTarget = findSnapTargetWithPerpendicular(mousePoint, shapes, points, lines, lineStartPoint);
      setLineSnapFeedback(snapTarget && snapTarget.type === 'point' ? snapTarget.point : null);
      setIsPerpendicular(false);
    } else if (lineStartPoint) {
      const snapTarget = findSnapTargetWithPerpendicular(mousePoint, shapes, points, lines, lineStartPoint);
      const endPoint = snapTarget ? snapTarget.point : mousePoint;
      setPreviewLine({ start: lineStartPoint, end: endPoint });
      
      if (snapTarget?.isPerpendicularPreview) {
        setPerpendicularSnap(null);
        setIsPerpendicularPreview(true);
        setLineSnapFeedback(snapTarget.point);
        setIsPerpendicular(true);
        setEdgeInfo(null);
      } else {
        setPerpendicularSnap(null);
        setIsPerpendicularPreview(false);
        setLineSnapFeedback(snapTarget && snapTarget.type !== 'free' ? snapTarget.point : null);
        setIsPerpendicular(snapTarget?.isPerpendicular || false);
        setEdgeInfo(snapTarget?.edgeInfo || null);
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
  }, []);

  return {
    isDrawingLine,
    lineSnapFeedback,
    previewLine,
    perpendicularSnap,
    isPerpendicularPreview,
    isPerpendicular,
    edgeInfo,
    handleLineStart,
    handleLineEnd,
    handleLinePreview,
    resetLineState
  };
}; 