import { useEffect } from 'react';
import { useCanvasStore } from './store/canvasStore';
import StarField from './components/StarField';
import GridPattern from './components/GridPattern';
import Canvas from './components/Canvas';
import Toolbar from './components/Toolbar';
import MiniMap from './components/MiniMap';
import ZoomControls from './components/ZoomControls';

export default function App() {
  const setViewport = useCanvasStore(s => s.setViewport);

  // Center canvas origin on screen on mount
  useEffect(() => {
    setViewport({
      x: window.innerWidth / 2,
      y: window.innerHeight / 2,
      scale: 1,
    });
  }, [setViewport]);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: '#080B14',
        overflow: 'hidden',
      }}
    >
      <StarField />
      <GridPattern />
      <Canvas />
      <Toolbar />
      <ZoomControls />
      <MiniMap />

      {/* Top bar */}
      <div
        style={{
          position: 'fixed',
          top: 16,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 100,
          background: 'rgba(8,11,20,0.85)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 12,
          padding: '8px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}
      >
        <span style={{ fontSize: 16, filter: 'drop-shadow(0 0 6px #a78bfa)' }}>✦</span>
        <span style={{ color: 'white', fontWeight: 600, fontSize: 14, letterSpacing: '0.05em' }}>
          COSMIC BOARD
        </span>
        <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: 12 }}>|</span>
        <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11 }}>
          Drag to pan · Scroll to zoom · Click tool then canvas to place
        </span>
      </div>
    </div>
  );
}
