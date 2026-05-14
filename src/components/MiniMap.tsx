import { useRef, useCallback } from 'react';
import { useCanvasStore } from '../store/canvasStore';

const MAP_W = 180;
const MAP_H = 120;
const CANVAS_RANGE = 4000;

const NODE_DOT: Record<string, string> = {
  purple: '#a78bfa',
  blue:   '#60a5fa',
  cyan:   '#22d3ee',
  green:  '#4ade80',
  pink:   '#f472b6',
};

export default function MiniMap() {
  const nodes = useCanvasStore(s => s.nodes);
  const viewport = useCanvasStore(s => s.viewport);
  const setViewport = useCanvasStore(s => s.setViewport);
  const mapRef = useRef<HTMLDivElement>(null);

  const toMapX = (cx: number) => (cx / CANVAS_RANGE + 0.5) * MAP_W;
  const toMapY = (cy: number) => (cy / CANVAS_RANGE + 0.5) * MAP_H;

  const handleClick = useCallback((e: React.MouseEvent) => {
    const rect = mapRef.current!.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const cx = (mx / MAP_W - 0.5) * CANVAS_RANGE;
    const cy = (my / MAP_H - 0.5) * CANVAS_RANGE;
    setViewport({
      ...viewport,
      x: window.innerWidth / 2 - cx * viewport.scale,
      y: window.innerHeight / 2 - cy * viewport.scale,
    });
  }, [viewport, setViewport]);

  // Viewport rect in map space
  const vpW = (window.innerWidth / viewport.scale / CANVAS_RANGE) * MAP_W;
  const vpH = (window.innerHeight / viewport.scale / CANVAS_RANGE) * MAP_H;
  const vpX = toMapX(-viewport.x / viewport.scale);
  const vpY = toMapY(-viewport.y / viewport.scale);

  return (
    <div
      ref={mapRef}
      onClick={handleClick}
      style={{
        position: 'fixed',
        right: 16,
        bottom: 16,
        width: MAP_W,
        height: MAP_H,
        background: 'rgba(8,11,20,0.85)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 10,
        overflow: 'hidden',
        cursor: 'crosshair',
        zIndex: 100,
      }}
    >
      {/* Nodes as dots */}
      {nodes.map(n => (
        <div
          key={n.id}
          style={{
            position: 'absolute',
            left: toMapX(n.x + n.width / 2) - 3,
            top: toMapY(n.y + n.height / 2) - 3,
            width: 6,
            height: 6,
            borderRadius: n.type === 'idea' ? '50%' : 2,
            background: NODE_DOT[n.color],
            opacity: 0.8,
            boxShadow: `0 0 4px ${NODE_DOT[n.color]}`,
          }}
        />
      ))}

      {/* Viewport rect */}
      <div
        style={{
          position: 'absolute',
          left: vpX - vpW / 2,
          top: vpY - vpH / 2,
          width: Math.max(vpW, 10),
          height: Math.max(vpH, 10),
          border: '1px solid rgba(167,139,250,0.6)',
          background: 'rgba(167,139,250,0.05)',
          pointerEvents: 'none',
        }}
      />

      <div
        style={{
          position: 'absolute',
          top: 4,
          left: 6,
          fontSize: 9,
          color: 'rgba(255,255,255,0.3)',
          fontFamily: 'monospace',
        }}
      >
        MAP
      </div>
    </div>
  );
}
