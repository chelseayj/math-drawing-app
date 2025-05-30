import React from 'react';
import { GeometryPoint, Shape, Point, POINT_RADIUS, POINT_STYLES, LABEL_STYLES } from '../../types';
import { calculateLabelPosition } from '../../utils/pointUtils';
import { PointToPointSnap } from '../../utils/pointToPointSnapUtils';

interface PointRendererProps {
  points: GeometryPoint[];
  shapes: Shape[];
  feedbackPoint: Point | null;
  lineSnapFeedback: Point | null;
  selectedTool: string;
  isPerpendicular: boolean;
  isPerpendicularPreview: boolean;
  isPointToPoint: boolean;
  pointToPointInfo: PointToPointSnap | null;
  currentSnapType: string | null;
}

const PointRenderer: React.FC<PointRendererProps> = ({ 
  points, 
  shapes, 
  feedbackPoint, 
  lineSnapFeedback, 
  selectedTool,
  isPerpendicular,
  isPerpendicularPreview,
  isPointToPoint,
  pointToPointInfo,
  currentSnapType
}) => {
  // 점 렌더링 함수
  const renderPoint = (point: GeometryPoint) => {
    const shape = shapes.find(s => s.id === point.shapeId);
    if (!shape) return null;

    const labelPosition = calculateLabelPosition(point.position, shape);

    return (
      <g key={point.id}>
        {/* 점 */}
        <circle
          cx={point.position.x}
          cy={point.position.y}
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

    // 스냅 타입에 따른 색상 구분
    let strokeColor = '#28a745'; // 기본 초록색
    let strokeWidth = 3;
    let radius = POINT_RADIUS + 3;
    
    if (isPointToPoint || currentSnapType === 'point-to-point') {
      strokeColor = '#6f42c1'; // 보라색 (점-점 연결)
      strokeWidth = 4;
      radius = POINT_RADIUS + 4;
    } else if (isPerpendicular || currentSnapType === 'perpendicular') {
      strokeColor = '#dc3545'; // 빨간색 (직각)
    } else if (isPerpendicularPreview) {
      strokeColor = '#007bff'; // 파란색 (수선 스냅)
    } else if (currentSnapType === 'vertex') {
      strokeColor = '#fd7e14'; // 주황색 (도형 꼭짓점)
    } else if (currentSnapType === 'center') {
      strokeColor = '#ffc107'; // 노란색 (도형 중심점)
    } else if (currentSnapType === 'point') {
      strokeColor = '#28a745'; // 초록색 (기존 점)
    }

    return (
      <g>
        {/* 기본 스냅 피드백 */}
        <circle
          cx={lineSnapFeedback.x}
          cy={lineSnapFeedback.y}
          r={radius}
          fill="none"
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          opacity="0.8"
        />
        
        {/* 점-점 연결일 때 추가 시각적 효과 */}
        {(isPointToPoint || currentSnapType === 'point-to-point') && (
          <circle
            cx={lineSnapFeedback.x}
            cy={lineSnapFeedback.y}
            r={POINT_RADIUS + 6}
            fill="none"
            stroke={strokeColor}
            strokeWidth="2"
            opacity="0.4"
            strokeDasharray="4,4"
          />
        )}
      </g>
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