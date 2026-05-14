import { useRef, useCallback, useState } from 'react';
import { useCanvasStore } from '../../store/canvasStore';
import type { CanvasNode, NodeColor } from '../../types';
import TextNode from './TextNode';
import TodoNode from './TodoNode';
import IdeaNode from './IdeaNode';

const GLOW: Record<NodeColor, string> = {
  purple: '0 0 20px rgba(167,139,250,0.4), 0 0 40px rgba(167,139,250,0.15)',
  blue:   '0 0 20px rgba(96,165,250,0.4), 0 0 40px rgba(96,165,250,0.15)',
  cyan:   '0 0 20px rgba(34,211,238,0.4), 0 0 40px rgba(34,211,238,0.15)',
  green:  '0 0 20px rgba(74,222,128,0.4), 0 0 40px rgba(74,222,128,0.15)',
  pink:   '0 0 20px rgba(244,114,182,0.4), 0 0 40px rgba(244,114,182,0.15)',
};

const BORDER: Record<NodeColor, string> = {
  purple: 'rgba(167,139,250,0.5)',
  blue:   'rgba(96,165,250,0.5)',
  cyan:   'rgba(34,211,238,0.5)',
  green:  'rgba(74,222,128,0.5)',
  pink:   'rgba(244,114,182,0.5)',
};

const DOT: Record<NodeColor, string> = {
  purple: '#a78bfa',
  blue:   '#60a5fa',
  cyan:   '#22d3ee',
  green:  '#4ade80',
  pink:   '#f472b6',
};

interface ConnectDot {
  pos: 'top' | 'right' | 'bottom' | 'left';
  x: number;
  y: number;
}

export default function BaseNode({ node }: { node: CanvasNode }) {
  const selectNode = useCanvasStore(s => s.selectNode);
  const moveNode = useCanvasStore(s => s.moveNode);
  const deleteNode = useCanvasStore(s => s.deleteNode);
  const bringToFront = useCanvasStore(s => s.bringToFront);
  const duplicateNode = useCanvasStore(s => s.duplicateNode);
  const startConnecting = useCanvasStore(s => s.startConnecting);
  const finishConnecting = useCanvasStore(s => s.finishConnecting);
  const connectingFromId = useCanvasStore(s => s.connectingFromId);
  const selectedIds = useCanvasStore(s => s.selectedIds);
  const tool = useCanvasStore(s => s.tool);

  const isSelected = selectedIds.includes(node.id);
  const isConnectTool = tool === 'connect';
  const isBeingConnectedFrom = connectingFromId === node.id;

  const nodeRef = useRef<HTMLDivElement>(null);
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [ctxPos, setCtxPos] = useState({ x: 0, y: 0 });
  const [hovered, setHovered] = useState(false);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (e.button !== 0) return;
    e.stopPropagation();

    if (isConnectTool) {
      if (connectingFromId) {
        finishConnecting(node.id);
      } else {
        startConnecting(node.id);
      }
      return;
    }

    bringToFront(node.id);
    selectNode(node.id, e.shiftKey || e.ctrlKey || e.metaKey);

    const el = nodeRef.current!;
    el.setPointerCapture(e.pointerId);

    const startMx = e.clientX;
    const startMy = e.clientY;
    const startNx = node.x;
    const startNy = node.y;

    const onMove = (ev: PointerEvent) => {
      const scale = useCanvasStore.getState().viewport.scale;
      const dx = (ev.clientX - startMx) / scale;
      const dy = (ev.clientY - startMy) / scale;
      moveNode(node.id, startNx + dx, startNy + dy);
    };

    const onUp = () => {
      el.removeEventListener('pointermove', onMove);
      el.removeEventListener('pointerup', onUp);
    };

    el.addEventListener('pointermove', onMove);
    el.addEventListener('pointerup', onUp);
  }, [node, isConnectTool, connectingFromId, selectNode, moveNode, bringToFront, startConnecting, finishConnecting]);

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCtxPos({ x: e.clientX, y: e.clientY });
    setShowContextMenu(true);
  }, []);

  const connectDots: ConnectDot[] = [
    { pos: 'top',    x: node.width / 2,  y: 0 },
    { pos: 'right',  x: node.width,      y: node.height / 2 },
    { pos: 'bottom', x: node.width / 2,  y: node.height },
    { pos: 'left',   x: 0,               y: node.height / 2 },
  ];

  return (
    <>
      <div
        ref={nodeRef}
        className="node-card"
        data-node-id={node.id}
        style={{
          left: node.x,
          top: node.y,
          width: node.width,
          zIndex: node.zIndex,
          cursor: isConnectTool ? 'crosshair' : 'grab',
          outline: isSelected ? `2px solid ${DOT[node.color]}` : isBeingConnectedFrom ? `2px solid ${DOT[node.color]}` : 'none',
          outlineOffset: 3,
          borderRadius: node.type === 'idea' ? '50%' : 12,
          boxShadow: (isSelected || hovered) ? GLOW[node.color] : undefined,
          transition: 'box-shadow 0.2s ease',
        }}
        onPointerDown={handlePointerDown}
        onContextMenu={handleContextMenu}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {/* Node border */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: 'inherit',
            border: `1px solid ${BORDER[node.color]}`,
            pointerEvents: 'none',
            zIndex: 0,
          }}
        />

        {/* Content */}
        {node.type === 'text' && <TextNode node={node} />}
        {node.type === 'todo' && <TodoNode node={node} />}
        {node.type === 'idea' && <IdeaNode node={node} />}

        {/* Connection dots */}
        {(isConnectTool || hovered) && connectDots.map(dot => (
          <div
            key={dot.pos}
            style={{
              position: 'absolute',
              left: dot.x - 7,
              top: dot.y - 7,
              width: 14,
              height: 14,
              borderRadius: '50%',
              background: DOT[node.color],
              border: '2px solid white',
              cursor: 'crosshair',
              zIndex: 100,
              boxShadow: `0 0 8px ${DOT[node.color]}`,
            }}
            onPointerDown={(e) => {
              e.stopPropagation();
              const dotEl = e.currentTarget;
              dotEl.setPointerCapture(e.pointerId);
              useCanvasStore.getState().startConnecting(node.id);

              const onMove = (ev: PointerEvent) => {
                useCanvasStore.getState().setConnectingPreview({ x: ev.clientX, y: ev.clientY });
              };
              const onUp = (ev: PointerEvent) => {
                dotEl.removeEventListener('pointermove', onMove);
                dotEl.removeEventListener('pointerup', onUp);
                useCanvasStore.getState().setConnectingPreview(null);
                const els = document.elementsFromPoint(ev.clientX, ev.clientY);
                let targetId: string | null = null;
                for (const el of els) {
                  const card = (el as HTMLElement).closest?.('[data-node-id]') as HTMLElement | null;
                  if (card?.dataset.nodeId && card.dataset.nodeId !== node.id) {
                    targetId = card.dataset.nodeId;
                    break;
                  }
                }
                if (targetId) {
                  useCanvasStore.getState().finishConnecting(targetId);
                } else {
                  useCanvasStore.getState().cancelConnecting();
                }
              };
              dotEl.addEventListener('pointermove', onMove);
              dotEl.addEventListener('pointerup', onUp);
            }}
          />
        ))}
      </div>

      {/* Context menu */}
      {showContextMenu && (
        <>
          <div
            style={{ position: 'fixed', inset: 0, zIndex: 9998 }}
            onClick={() => setShowContextMenu(false)}
          />
          <div
            style={{
              position: 'fixed',
              left: ctxPos.x,
              top: ctxPos.y,
              zIndex: 9999,
              background: 'rgba(15, 10, 30, 0.95)',
              border: `1px solid ${BORDER[node.color]}`,
              borderRadius: 10,
              padding: '6px 0',
              minWidth: 160,
              backdropFilter: 'blur(12px)',
              boxShadow: GLOW[node.color],
            }}
          >
            {(['purple', 'blue', 'cyan', 'green', 'pink'] as const).map(c => (
              <button
                key={c}
                className="w-full text-left px-4 py-1.5 text-sm text-white/80 hover:text-white hover:bg-white/5 flex items-center gap-2"
                onClick={() => {
                  useCanvasStore.getState().updateNode(node.id, { color: c });
                  setShowContextMenu(false);
                }}
              >
                <span style={{ width: 10, height: 10, borderRadius: '50%', background: DOT[c], display: 'inline-block' }} />
                {c.charAt(0).toUpperCase() + c.slice(1)}
              </button>
            ))}
            <hr style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.1)', margin: '4px 0' }} />
            <button
              className="w-full text-left px-4 py-1.5 text-sm text-white/80 hover:text-white hover:bg-white/5"
              onClick={() => { duplicateNode(node.id); setShowContextMenu(false); }}
            >
              Duplicate
            </button>
            <button
              className="w-full text-left px-4 py-1.5 text-sm text-red-400 hover:text-red-300 hover:bg-white/5"
              onClick={() => { deleteNode(node.id); setShowContextMenu(false); }}
            >
              Delete
            </button>
          </div>
        </>
      )}
    </>
  );
}
