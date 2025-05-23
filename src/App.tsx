import React, { useState, useRef } from 'react';
import './App.css';
import Canvas, { CanvasRef } from './components/Canvas';
import ShapeMenu from './components/ShapeMenu';

function App() {
  const [selectedShape, setSelectedShape] = useState<'circle' | 'triangle' | 'rectangle' | null>(null);
  const [selectedTool, setSelectedTool] = useState<'shape' | 'point' | 'line' | 'length' | 'angle' | 'transform'>('shape');
  const canvasRef = useRef<CanvasRef>(null);

  return (
    <div className="App">
      <Canvas 
        selectedShape={selectedShape} 
        selectedTool={selectedTool}
        ref={canvasRef}
      />
      <ShapeMenu
        onSelectShape={setSelectedShape}
        onSelectTool={setSelectedTool}
        selectedShape={selectedShape}
        selectedTool={selectedTool}
        onClearShapes={() => canvasRef.current?.clearAllShapes()}
        onUndo={() => canvasRef.current?.undo()}
      />
    </div>
  );
}

export default App;
