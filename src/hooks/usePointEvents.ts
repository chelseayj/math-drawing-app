import { useState, useCallback } from 'react';
import { Point, Shape } from '../types';
import { canPlacePointOnShape, getVisualFeedbackPoint } from '../utils/pointUtils';

interface UsePointEventsProps {
  shapes: Shape[];
  onPointCreate: (point: Point, shapes: Shape[]) => boolean;
}

export const usePointEvents = ({ shapes, onPointCreate }: UsePointEventsProps) => {
  const [feedbackPoint, setFeedbackPoint] = useState<Point | null>(null);
  const [canPlacePoint, setCanPlacePoint] = useState<boolean>(false);

  // 점 미리보기 업데이트
  const handlePointPreview = useCallback((mousePoint: Point) => {
    const visualPoint = getVisualFeedbackPoint(mousePoint, shapes);
    setFeedbackPoint(visualPoint);
    const placement = canPlacePointOnShape(mousePoint, shapes);
    setCanPlacePoint(!!placement);
  }, [shapes]);

  // 점 생성
  const handlePointCreate = useCallback((point: Point) => {
    onPointCreate(point, shapes);
  }, [shapes, onPointCreate]);

  // 점 상태 초기화
  const resetPointState = useCallback(() => {
    setFeedbackPoint(null);
    setCanPlacePoint(false);
  }, []);

  return {
    feedbackPoint,
    canPlacePoint,
    handlePointPreview,
    handlePointCreate,
    resetPointState
  };
}; 