import React, { useState, useCallback } from 'react';
import './App.css';
import Canvas from './components/Canvas';
import Toolbar from './components/Toolbar';
import { Shape, Tool } from './types';

function App() {
  const [selectedTool, setSelectedTool] = useState<Tool>('circle');
  const [shapes, setShapes] = useState<Shape[]>([]);

  const handleShapeAdd = useCallback((shape: Shape) => {
    setShapes(prev => [...prev, shape]);
  }, []);

  const handleShapeDelete = useCallback((shapeId: string) => {
    setShapes(prev => prev.filter(shape => shape.id !== shapeId));
  }, []);

  const handleShapeUpdate = useCallback((shapeId: string, updatedShape: Shape) => {
    setShapes(prev => prev.map(shape => 
      shape.id === shapeId ? updatedShape : shape
    ));
  }, []);

  const handleClearAll = useCallback(() => {
    setShapes([]);
  }, []);

  return (
    <div className="App">
      <Toolbar 
        selectedTool={selectedTool} 
        onToolSelect={setSelectedTool} 
      />
      <Canvas 
        selectedTool={selectedTool}
        shapes={shapes}
        onShapeAdd={handleShapeAdd}
        onShapeDelete={handleShapeDelete}
        onShapeUpdate={handleShapeUpdate}
        onClearAll={handleClearAll}
      />
    </div>
  );
}

export default App;
