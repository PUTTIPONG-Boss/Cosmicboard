import { useCanvasStore } from '../store/canvasStore';

export default function GridPattern() {
  const viewport = useCanvasStore(s => s.viewport);
  const gridSize = 60 * viewport.scale;
  const offsetX = viewport.x % gridSize;
  const offsetY = viewport.y % gridSize;

  return (
    <svg
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 1,
        opacity: Math.min(viewport.scale, 1) * 0.35,
      }}
    >
      <defs>
        <pattern
          id="grid"
          x={offsetX}
          y={offsetY}
          width={gridSize}
          height={gridSize}
          patternUnits="userSpaceOnUse"
        >
          <circle cx={0} cy={0} r={1} fill="rgba(255,255,255,0.4)" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#grid)" />
    </svg>
  );
}
