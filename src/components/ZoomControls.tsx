import { useCanvasStore } from '../store/canvasStore';

export default function ZoomControls() {
  const viewport = useCanvasStore(s => s.viewport);
  const setViewport = useCanvasStore(s => s.setViewport);
  const resetViewport = useCanvasStore(s => s.resetViewport);

  const zoom = (factor: number) => {
    const cx = window.innerWidth / 2;
    const cy = window.innerHeight / 2;
    const newScale = Math.min(Math.max(viewport.scale * factor, 0.1), 4);
    const canvasX = (cx - viewport.x) / viewport.scale;
    const canvasY = (cy - viewport.y) / viewport.scale;
    setViewport({
      x: cx - canvasX * newScale,
      y: cy - canvasY * newScale,
      scale: newScale,
    });
  };

  const pct = Math.round(viewport.scale * 100);

  return (
    <div
      style={{
        position: 'fixed',
        right: 16,
        bottom: 152,
        zIndex: 100,
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
        background: 'rgba(8,11,20,0.85)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 10,
        padding: '6px 8px',
      }}
    >
      <button
        onClick={() => zoom(1.25)}
        style={{ width: 32, height: 28, borderRadius: 6, background: 'rgba(255,255,255,0.06)', border: 'none', color: 'white', cursor: 'pointer', fontSize: 16 }}
      >
        +
      </button>
      <button
        onClick={resetViewport}
        style={{ width: 32, height: 24, borderRadius: 6, background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontSize: 10, fontFamily: 'monospace' }}
      >
        {pct}%
      </button>
      <button
        onClick={() => zoom(0.8)}
        style={{ width: 32, height: 28, borderRadius: 6, background: 'rgba(255,255,255,0.06)', border: 'none', color: 'white', cursor: 'pointer', fontSize: 16 }}
      >
        −
      </button>
    </div>
  );
}
