import { useCanvasStore } from '../store/canvasStore';
import type { Tool, NodeColor } from '../types';

const tools: { id: Tool; icon: string; label: string; group?: string }[] = [
  { id: 'select',  icon: '↖',  label: 'Select (V)' },
  { id: 'hand',    icon: '✋', label: 'Pan (H)' },
  { id: 'text',    icon: '📄', label: 'Note (N)' },
  { id: 'todo',    icon: '✅', label: 'Todo (T)' },
  { id: 'idea',    icon: '✦',  label: 'Idea (I)' },
  { id: 'connect', icon: '⟶',  label: 'Connect (C)' },
  { id: 'draw',    icon: '✏️', label: 'Draw (D)' },
  { id: 'eraser',  icon: '⌫',  label: 'Eraser (E)' },
];

const DRAW_COLORS = ['#a78bfa', '#60a5fa', '#22d3ee', '#4ade80', '#f472b6', '#fb923c', '#ffffff', '#f87171'];
const DRAW_WIDTHS = [2, 4, 8, 14];

const TOOL_ACTIVE: Record<string, string> = {
  purple: 'bg-purple-600/50 border-purple-400',
  default: 'bg-white/10 border-white/30',
};
void TOOL_ACTIVE.purple;

export default function Toolbar() {
  const tool = useCanvasStore(s => s.tool);
  const setTool = useCanvasStore(s => s.setTool);
  const drawColor = useCanvasStore(s => s.drawColor);
  const setDrawColor = useCanvasStore(s => s.setDrawColor);
  const drawWidth = useCanvasStore(s => s.drawWidth);
  const setDrawWidth = useCanvasStore(s => s.setDrawWidth);
  const deleteSelected = useCanvasStore(s => s.deleteSelected);
  const selectedIds = useCanvasStore(s => s.selectedIds);
  const resetViewport = useCanvasStore(s => s.resetViewport);

  const ACCENT: Record<Tool, string> = {
    select:  'rgba(167,139,250,0.4)',
    hand:    'rgba(96,165,250,0.4)',
    text:    'rgba(34,211,238,0.4)',
    todo:    'rgba(74,222,128,0.4)',
    idea:    'rgba(244,114,182,0.4)',
    connect: 'rgba(251,146,60,0.4)',
    draw:    'rgba(167,139,250,0.4)',
    eraser:  'rgba(248,113,113,0.4)',
  };

  return (
    <div
      style={{
        position: 'fixed',
        left: 16,
        top: '50%',
        transform: 'translateY(-50%)',
        zIndex: 100,
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
        background: 'rgba(8, 11, 20, 0.85)',
        backdropFilter: 'blur(16px)',
        borderRadius: 16,
        padding: '12px 8px',
        border: '1px solid rgba(255,255,255,0.08)',
        boxShadow: '0 0 40px rgba(0,0,0,0.5)',
      }}
    >
      {/* Logo */}
      <div className="text-center mb-1">
        <span style={{ fontSize: 18, filter: 'drop-shadow(0 0 6px #a78bfa)' }}>✦</span>
      </div>

      {/* Tool buttons */}
      {tools.map(t => (
        <button
          key={t.id}
          onClick={() => setTool(t.id)}
          title={t.label}
          style={{
            width: 40,
            height: 40,
            borderRadius: 10,
            border: tool === t.id ? `1px solid ${ACCENT[t.id].replace('0.4)', '0.8)')}` : '1px solid transparent',
            background: tool === t.id ? ACCENT[t.id] : 'transparent',
            color: 'white',
            fontSize: 16,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.15s ease',
            boxShadow: tool === t.id ? `0 0 12px ${ACCENT[t.id]}` : 'none',
          }}
        >
          {t.icon}
        </button>
      ))}

      <hr style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.08)', margin: '4px 0' }} />

      {/* Draw options — shown when draw/eraser active */}
      {(tool === 'draw') && (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {DRAW_COLORS.map(c => (
              <button
                key={c}
                onClick={() => setDrawColor(c)}
                style={{
                  width: 40,
                  height: 16,
                  borderRadius: 4,
                  background: c,
                  border: drawColor === c ? '2px solid white' : '2px solid transparent',
                  cursor: 'pointer',
                  boxShadow: drawColor === c ? `0 0 8px ${c}` : 'none',
                }}
              />
            ))}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'center', marginTop: 4 }}>
            {DRAW_WIDTHS.map(w => (
              <button
                key={w}
                onClick={() => setDrawWidth(w)}
                style={{
                  width: 32,
                  height: 20,
                  borderRadius: 4,
                  background: 'transparent',
                  border: drawWidth === w ? '1px solid rgba(255,255,255,0.5)' : '1px solid transparent',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <div style={{ width: 20, height: w / 2, background: drawColor, borderRadius: 2 }} />
              </button>
            ))}
          </div>
          <hr style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.08)', margin: '4px 0' }} />
        </>
      )}

      {/* Delete selected */}
      {selectedIds.length > 0 && (
        <button
          onClick={deleteSelected}
          title="Delete selected"
          style={{
            width: 40,
            height: 40,
            borderRadius: 10,
            border: '1px solid rgba(248,113,113,0.5)',
            background: 'rgba(248,113,113,0.15)',
            color: '#f87171',
            fontSize: 16,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          🗑
        </button>
      )}

      {/* Reset view */}
      <button
        onClick={resetViewport}
        title="Reset view"
        style={{
          width: 40,
          height: 40,
          borderRadius: 10,
          border: '1px solid rgba(255,255,255,0.08)',
          background: 'transparent',
          color: 'rgba(255,255,255,0.4)',
          fontSize: 13,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        ⊙
      </button>
    </div>
  );
}
