import React from 'react';
import { Shape, SHAPE_STYLES } from '../../types';
import { isTransformedShape } from '../../utils/transformUtils';
import { getTriangleVerticesAuto } from '../../utils/geometryUtils';

interface ShapeRendererProps {
  shapes: Shape[];
  currentShape: Shape | null;
}

const ShapeRenderer: React.FC<ShapeRendererProps> = ({ shapes, currentShape }) => {
  // 도형 렌더링 함수
  const renderShape = (shape: Shape) => {
    const { x, y, width, height, type, id } = shape;

    switch (type) {
      case 'circle':
        return (
          <ellipse
            key={id}
            cx={x + width / 2}
            cy={y + height / 2}
            rx={width / 2}
            ry={height / 2}
            {...SHAPE_STYLES}
          />
        );
      case 'triangle':
        // 변형된 삼각형인지 확인
        const triangleVertices = isTransformedShape(shape) 
          ? shape.vertices 
          : getTriangleVerticesAuto(shape);
        const trianglePointsStr = triangleVertices.map(v => `${v.x},${v.y}`).join(' ');
        
        return (
          <polygon
            key={id}
            points={trianglePointsStr}
            {...SHAPE_STYLES}
          />
        );
      case 'rectangle':
        // 변형된 사각형인지 확인
        if (isTransformedShape(shape)) {
          // 변형된 사각형: 개별 꼭짓점으로 polygon 렌더링
          const rectPointsStr = shape.vertices.map(v => `${v.x},${v.y}`).join(' ');
          return (
            <polygon
              key={id}
              points={rectPointsStr}
              {...SHAPE_STYLES}
            />
          );
        } else {
          // 일반 사각형: rect 요소로 렌더링
          return (
            <rect
              key={id}
              x={x}
              y={y}
              width={width}
              height={height}
              {...SHAPE_STYLES}
            />
          );
        }
      default:
        return null;
    }
  };

  return (
    <>
      {/* 기존 도형들 렌더링 */}
      {shapes.map(renderShape)}
      
      {/* 그리는 중인 임시 도형 렌더링 */}
      {currentShape && renderShape(currentShape)}
    </>
  );
};

export default ShapeRenderer; 