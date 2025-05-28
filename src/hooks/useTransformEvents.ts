import { useState, useCallback, useEffect } from 'react';
import { Point, Shape, TransformState } from '../types';
import { findNearestVertex, updateShapeWithVertex } from '../utils/transformUtils';

interface UseTransformEventsProps {
  shapes: Shape[];
  onShapeUpdate: (shapeId: string, updatedShape: Shape) => void;
}

export const useTransformEvents = ({
  shapes,
  onShapeUpdate
}: UseTransformEventsProps) => {
  const [transformState, setTransformState] = useState<TransformState>({
    isTransforming: false,
    selectedShape: null,
    selectedVertexIndex: null,
    originalVertices: [],
    hoverVertexIndex: null
  });

  const [isShiftPressed, setIsShiftPressed] = useState(false);

  // Shift 키 이벤트 처리 (토스트 메시지 제거)
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Shift' && transformState.isTransforming && !isShiftPressed) {
        setIsShiftPressed(true);
      }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      if (event.key === 'Shift' && isShiftPressed) {
        setIsShiftPressed(false);
      }
    };

    // 드래그 중일 때만 키보드 이벤트 활성화
    if (transformState.isTransforming) {
      window.addEventListener('keydown', handleKeyDown);
      window.addEventListener('keyup', handleKeyUp);
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [transformState.isTransforming, isShiftPressed]);

  // 변형 가능한 도형인지 확인
  const isTransformableShape = useCallback((shape: Shape): boolean => {
    return shape.type === 'rectangle' || shape.type === 'triangle';
  }, []);

  // 마우스 hover 처리 (커서 변경용)
  const handleTransformHover = useCallback((mousePoint: Point) => {
    if (transformState.isTransforming) return;

    let foundVertex = false;
    let hoverVertexIndex: number | null = null;

    for (const shape of shapes) {
      if (!isTransformableShape(shape)) continue;

      const nearestVertex = findNearestVertex(mousePoint, shape);
      if (nearestVertex) {
        foundVertex = true;
        hoverVertexIndex = nearestVertex.vertexIndex;
        break;
      }
    }

    setTransformState(prev => ({
      ...prev,
      hoverVertexIndex: foundVertex ? hoverVertexIndex : null
    }));

    return foundVertex;
  }, [shapes, transformState.isTransforming, isTransformableShape]);

  // 변형 시작
  const handleTransformStart = useCallback((mousePoint: Point) => {
    for (const shape of shapes) {
      if (!isTransformableShape(shape)) continue;

      const nearestVertex = findNearestVertex(mousePoint, shape);
      if (nearestVertex) {
        setTransformState({
          isTransforming: true,
          selectedShape: shape,
          selectedVertexIndex: nearestVertex.vertexIndex,
          originalVertices: [],
          hoverVertexIndex: null
        });
        return true;
      }
    }
    return false;
  }, [shapes, isTransformableShape]);

  // 변형 진행 중 (선택한 꼭짓점만 이동)
  const handleTransformMove = useCallback((mousePoint: Point) => {
    if (!transformState.isTransforming || 
        !transformState.selectedShape || 
        transformState.selectedVertexIndex === null) {
      return;
    }

    // 선택한 꼭짓점만 이동하여 도형 업데이트
    const updatedShape = updateShapeWithVertex(
      transformState.selectedShape,
      transformState.selectedVertexIndex,
      mousePoint,
      isShiftPressed
    );

    // 도형 업데이트
    onShapeUpdate(transformState.selectedShape.id, updatedShape);

    // 상태 업데이트
    setTransformState(prev => ({
      ...prev,
      selectedShape: updatedShape
    }));
  }, [transformState, onShapeUpdate, isShiftPressed]);

  // 변형 완료
  const handleTransformEnd = useCallback(() => {
    setTransformState({
      isTransforming: false,
      selectedShape: null,
      selectedVertexIndex: null,
      originalVertices: [],
      hoverVertexIndex: null
    });
    
    // Shift 상태 초기화
    setIsShiftPressed(false);
  }, []);

  return {
    transformState,
    isTransformableShape,
    handleTransformHover,
    handleTransformStart,
    handleTransformMove,
    handleTransformEnd,
    isShiftPressed
  };
}; 