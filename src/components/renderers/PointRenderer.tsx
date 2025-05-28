import React from 'react';
import { GeometryPoint, Shape, Point, POINT_RADIUS, POINT_STYLES, LABEL_STYLES } from '../../types';
import { calculateLabelPosition } from '../../utils/pointUtils';

interface PointRendererProps {
  points: GeometryPoint[];
  shapes: Shape[];
  feedbackPoint: Point | null;
  lineSnapFeedback: Point | null;
  selectedTool: string;
  isPerpendicular: boolean;
  isPerpendicularPreview: boolean;
}

const PointRenderer: React.FC<PointRendererProps> = ({ 
  points, 
  shapes, 
  feedbackPoint, 
  lineSnapFeedback, 
  selectedTool,
  isPerpendicular,
  isPerpendicularPreview
}) => {
  // 점 렌더링 함수
  const renderPoint = (point: GeometryPoint) => {
    const shape = shapes.find(s => s.id === point.shapeId);
    if (!shape) return null;

    const labelPosition = calculateLabelPosition({ x: point.x, y: point.y }, shape);

    return (
      <g key={point.id}>
        {/* 점 */}
        <circle
          cx={point.x}
          cy={point.y}
          r={POINT_RADIUS}
          {...POINT_STYLES}
        />
        {/* 레이블 */}
        <text
          x={labelPosition.x}
          y={labelPosition.y}
          {...LABEL_STYLES}
          textAnchor="middle"
          dominantBaseline="middle"
        >
          {point.label}
        </text>
      </g>
    );
  };

  // 시각적 피드백 렌더링 (점 모드)
  const renderFeedback = () => {
    if (!feedbackPoint || selectedTool !== 'point') return null;

    return (
      <circle
        cx={feedbackPoint.x}
        cy={feedbackPoint.y}
        r={POINT_RADIUS + 2}
        fill="none"
        stroke="#007bff"
        strokeWidth="2"
        opacity="0.8"
      />
    );
  };

  // 선분 스냅 피드백 렌더링
  const renderLineSnapFeedback = () => {
    if (!lineSnapFeedback || selectedTool !== 'line') return null;

    // 직각인 경우 빨간색, 수선 스냅일 때 파란색, 일반 스냅일 때 초록색
    let strokeColor = '#28a745'; // 기본 초록색
    if (isPerpendicular) {
      strokeColor = '#dc3545'; // 빨간색 (직각)
    } else if (isPerpendicularPreview) {
      strokeColor = '#007bff'; // 파란색 (수선 스냅)
    }

    return (
      <circle
        cx={lineSnapFeedback.x}
        cy={lineSnapFeedback.y}
        r={POINT_RADIUS + 3}
        fill="none"
        stroke={strokeColor}
        strokeWidth="3"
        opacity="0.8"
      />
    );
  };

  return (
    <>
      {/* 점들 렌더링 */}
      {points.map(renderPoint)}

      {/* 시각적 피드백 */}
      {renderFeedback()}

      {/* 선분 스냅 피드백 */}
      {renderLineSnapFeedback()}
    </>
  );
};

export default PointRenderer; 