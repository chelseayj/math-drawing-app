import React from 'react';
import { LineSegment, Point, LINE_STYLES, LINE_PREVIEW_STYLES, LINE_PERPENDICULAR_PREVIEW_STYLES } from '../../types';

interface LineRendererProps {
  lines: LineSegment[];
  previewLine: { start: Point; end: Point } | null;
  isPerpendicularPreview: boolean;
}

const LineRenderer: React.FC<LineRendererProps> = ({ 
  lines, 
  previewLine, 
  isPerpendicularPreview 
}) => {
  // 선분 렌더링 함수
  const renderLine = (line: LineSegment) => {
    return (
      <g key={line.id}>
        {/* 선분 */}
        <line
          x1={line.startPoint.x}
          y1={line.startPoint.y}
          x2={line.endPoint.x}
          y2={line.endPoint.y}
          {...LINE_STYLES}
        />
      </g>
    );
  };

  // 미리보기 선분 렌더링 함수 (일반 또는 수선)
  const renderPreviewLine = () => {
    if (!previewLine) return null;

    const styles = isPerpendicularPreview ? LINE_PERPENDICULAR_PREVIEW_STYLES : LINE_PREVIEW_STYLES;

    return (
      <line
        x1={previewLine.start.x}
        y1={previewLine.start.y}
        x2={previewLine.end.x}
        y2={previewLine.end.y}
        {...styles}
      />
    );
  };

  return (
    <>
      {/* 선분들 렌더링 */}
      {lines.map(renderLine)}

      {/* 미리보기 선분 렌더링 (일반 또는 수선) */}
      {renderPreviewLine()}
    </>
  );
};

export default LineRenderer; 