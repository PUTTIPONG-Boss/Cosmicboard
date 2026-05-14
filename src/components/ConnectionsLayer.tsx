import { useState } from 'react';
import { useCanvasStore } from '../store/canvasStore';

const COLOR_STROKE: Record<string, string> = {
  purple: '#a78bfa',
  blue: '#60a5fa',
  cyan: '#22d3ee',
  green: '#4ade80',
  pink: '#f472b6',
};

export default function ConnectionsLayer() {
  const connections = useCanvasStore(s => s.connections);
  const nodes = useCanvasStore(s => s.nodes);
  const deleteConnection = useCanvasStore(s => s.deleteConnection);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const nodeMap = new Map(nodes.map(n => [n.id, n]));

  return (
    <svg
      style={{
        position: 'absolute',
        overflow: 'visible',
        width: 0,
        height: 0,
        top: 0,
        left: 0,
        pointerEvents: 'none',
        zIndex: 1,
      }}
    >
      <defs>
        <filter id="glow-line">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {connections.map(conn => {
        const from = nodeMap.get(conn.fromId);
        const to = nodeMap.get(conn.toId);
        if (!from || !to) return null;

        const x1 = from.x + from.width / 2;
        const y1 = from.y + from.height / 2;
        const x2 = to.x + to.width / 2;
        const y2 = to.y + to.height / 2;

        const mx = (x1 + x2) / 2;
        const my = (y1 + y2) / 2;

        const dx = x2 - x1;
        const dy = y2 - y1;
        const dist = Math.hypot(dx, dy);
        const cx1 = x1 + dx * 0.25 + (-dy / dist) * (dist * 0.2);
        const cy1 = y1 + dy * 0.25 + (dx / dist) * (dist * 0.2);
        const cx2 = x1 + dx * 0.75 + (-dy / dist) * (dist * 0.2);
        const cy2 = y1 + dy * 0.75 + (dx / dist) * (dist * 0.2);

        const path = `M ${x1} ${y1} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${x2} ${y2}`;
        const fromColor = COLOR_STROKE[from.color] || '#a78bfa';
        const toColor = COLOR_STROKE[to.color] || '#60a5fa';
        const gradId = `grad-${conn.id}`;
        const isHovered = hoveredId === conn.id;

        return (
          <g key={conn.id} style={{ pointerEvents: 'auto' }}>
            <defs>
              <linearGradient id={gradId} x1={x1} y1={y1} x2={x2} y2={y2} gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor={fromColor} />
                <stop offset="100%" stopColor={toColor} />
              </linearGradient>
            </defs>

            {/* Invisible thick path for hover detection */}
            <path
              d={path}
              fill="none"
              stroke="transparent"
              strokeWidth={20}
              onMouseEnter={() => setHoveredId(conn.id)}
              onMouseLeave={() => setHoveredId(null)}
              style={{ cursor: 'pointer' }}
            />

            {/* Glow base */}
            <path
              d={path}
              fill="none"
              stroke={`url(#${gradId})`}
              strokeWidth={isHovered ? 4 : 2}
              strokeOpacity={0.3}
              filter="url(#glow-line)"
            />

            {/* Animated dashed line */}
            <path
              d={path}
              fill="none"
              stroke={`url(#${gradId})`}
              strokeWidth={isHovered ? 2.5 : 1.5}
              strokeDasharray="8 6"
              strokeOpacity={isHovered ? 1 : 0.7}
              className="animate-dash"
            />

            {/* Delete button */}
            {isHovered && (
              <g
                transform={`translate(${mx}, ${my})`}
                style={{ cursor: 'pointer' }}
                onMouseEnter={() => setHoveredId(conn.id)}
                onClick={() => { deleteConnection(conn.id); setHoveredId(null); }}
              >
                <circle r={10} fill="#1e1b2e" stroke="#a78bfa" strokeWidth={1} />
                <text
                  textAnchor="middle"
                  dominantBaseline="central"
                  fill="#f472b6"
                  fontSize={13}
                  fontWeight="bold"
                  style={{ userSelect: 'none' }}
                >
                  ×
                </text>
              </g>
            )}
          </g>
        );
      })}
    </svg>
  );
}
