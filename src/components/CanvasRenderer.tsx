import React from 'react';
import { Shape, GeometryPoint, LineSegment, Point, PerpendicularSnap } from '../types';
import { PointToPointSnap } from '../utils/pointToPointSnapUtils';
import ShapeRenderer from './renderers/ShapeRenderer';
import LineRenderer from './renderers/LineRenderer';
import PointRenderer from './renderers/PointRenderer';

interface CanvasRendererProps {
  shapes: Shape[];
  points: GeometryPoint[];
  lines: LineSegment[];
  currentShape: Shape | null;
  feedbackPoint: Point | null;
  lineSnapFeedback: Point | null;
  previewLine: { start: Point; end: Point } | null;
  perpendicularSnap: PerpendicularSnap | null;
  isPerpendicularPreview: boolean;
  isPerpendicular: boolean;
  edgeInfo: { start: Point; end: Point } | null;
  isPointToPoint: boolean;
  pointToPointInfo: PointToPointSnap | null;
  currentSnapType: string | null;
  selectedTool: string;
}

const CanvasRenderer: React.FC<CanvasRendererProps> = ({
  shapes,
  points,
  lines,
  currentShape,
  feedbackPoint,
  lineSnapFeedback,
  previewLine,
  isPerpendicularPreview,
  isPerpendicular,
  isPointToPoint,
  pointToPointInfo,
  currentSnapType,
  selectedTool
}) => {
  return (
    <svg
      width="100%"
      height="100%"
      style={{ display: 'block' }}
    >
      {/* 도형 렌더링 */}
      <ShapeRenderer 
        shapes={shapes} 
        currentShape={currentShape} 
      />

      {/* 선분 렌더링 */}
      <LineRenderer 
        lines={lines} 
        previewLine={previewLine} 
        isPerpendicularPreview={isPerpendicularPreview} 
      />

      {/* 점 렌더링 */}
      <PointRenderer 
        points={points} 
        shapes={shapes} 
        feedbackPoint={feedbackPoint} 
        lineSnapFeedback={lineSnapFeedback} 
        selectedTool={selectedTool}
        isPerpendicular={isPerpendicular}
        isPerpendicularPreview={isPerpendicularPreview}
        isPointToPoint={isPointToPoint}
        pointToPointInfo={pointToPointInfo}
        currentSnapType={currentSnapType}
      />
    </svg>
  );
};

export default CanvasRenderer; 