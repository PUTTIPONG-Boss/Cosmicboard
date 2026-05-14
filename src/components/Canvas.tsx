import { useRef, useCallback, useEffect } from 'react';
import { useCanvasStore } from '../store/canvasStore';
import ConnectionsLayer from './ConnectionsLayer';
import DrawingLayer from './DrawingLayer';
import BaseNode from './nodes/BaseNode';
import type { Tool } from '../types';

const CANVAS_CURSORS: Partial<Record<Tool, string>> = {
  hand:    'grab',
  draw:    'crosshair',
  eraser:  'cell',
  connect: 'crosshair',
  text:    'copy',
  todo:    'copy',
  idea:    'copy',
};

export default function Canvas() {
  const containerRef = useRef<HTMLDivElement>(null);
  const nodes = useCanvasStore(s => s.nodes);
  const viewport = useCanvasStore(s => s.viewport);
  const tool = useCanvasStore(s => s.tool);
  const clearSelection = useCanvasStore(s => s.clearSelection);
  const cancelConnecting = useCanvasStore(s => s.cancelConnecting);
  const setViewport = useCanvasStore(s => s.setViewport);
  const addNode = useCanvasStore(s => s.addNode);
  const deleteSelected = useCanvasStore(s => s.deleteSelected);

  const spaceHeld = useRef(false);
  const viewportRef = useRef(viewport);

  useEffect(() => { viewportRef.current = viewport; }, [viewport]);

  const screenToCanvas = useCallback((sx: number, sy: number) => {
    const vp = viewportRef.current;
    return { x: (sx - vp.x) / vp.scale, y: (sy - vp.y) / vp.scale };
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;

      if (e.code === 'Space') { e.preventDefault(); spaceHeld.current = true; }
      if (e.code === 'Delete' || e.code === 'Backspace') deleteSelected();

      const store = useCanvasStore.getState();
      if (e.key === 'v' || e.key === 'V') store.setTool('select');
      if (e.key === 'h' || e.key === 'H') store.setTool('hand');
      if (e.key === 'n' || e.key === 'N') store.setTool('text');
      if (e.key === 't' || e.key === 'T') store.setTool('todo');
      if (e.key === 'i' || e.key === 'I') store.setTool('idea');
      if (e.key === 'c' || e.key === 'C') store.setTool('connect');
      if (e.key === 'd' || e.key === 'D') store.setTool('draw');
      if (e.key === 'e' || e.key === 'E') store.setTool('eraser');
      if (e.key === 'Escape') { store.cancelConnecting(); store.clearSelection(); }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') spaceHeld.current = false;
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => { window.removeEventListener('keydown', onKeyDown); window.removeEventListener('keyup', onKeyUp); };
  }, [deleteSelected]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0 && e.button !== 1) return;
    const target = e.target as HTMLElement;
    const isCanvas = target === containerRef.current || target.classList.contains('canvas-bg');
    if (!isCanvas) return;

    if (tool === 'hand' || spaceHeld.current || e.button === 1) {
      e.preventDefault();
      let lastX = e.clientX;
      let lastY = e.clientY;

      const onMove = (ev: MouseEvent) => {
        const dx = ev.clientX - lastX;
        const dy = ev.clientY - lastY;
        lastX = ev.clientX;
        lastY = ev.clientY;
        const vp = viewportRef.current;
        const next = { x: vp.x + dx, y: vp.y + dy, scale: vp.scale };
        viewportRef.current = next;
        setViewport(next);
      };
      const onUp = () => {
        window.removeEventListener('mousemove', onMove);
        window.removeEventListener('mouseup', onUp);
      };
      window.addEventListener('mousemove', onMove);
      window.addEventListener('mouseup', onUp);
      return;
    }

    if (tool === 'select') {
      clearSelection();
      cancelConnecting();
      return;
    }

    if (tool === 'connect') {
      cancelConnecting();
      return;
    }

    if (tool === 'text' || tool === 'todo' || tool === 'idea') {
      const rect = containerRef.current!.getBoundingClientRect();
      const cp = screenToCanvas(e.clientX - rect.left, e.clientY - rect.top);
      const store = useCanvasStore.getState();
      const defaults: Record<string, { w: number; h: number }> = {
        text: { w: 280, h: 180 },
        todo: { w: 260, h: 220 },
        idea: { w: 220, h: 220 },
      };
      const d = defaults[tool];
      addNode(tool, cp.x - d.w / 2, cp.y - d.h / 2);
      store.setTool('select');
    }
  }, [tool, clearSelection, cancelConnecting, screenToCanvas, addNode, setViewport]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const rect = el.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      const vp = viewportRef.current;
      const factor = e.deltaY > 0 ? 0.9 : 1.1;
      const newScale = Math.min(Math.max(vp.scale * factor, 0.08), 5);
      const cx = (mx - vp.x) / vp.scale;
      const cy = (my - vp.y) / vp.scale;
      const next = { x: mx - cx * newScale, y: my - cy * newScale, scale: newScale };
      viewportRef.current = next;
      setViewport(next);
    };
    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, [setViewport]);

  const cursor = spaceHeld.current ? 'grab' : (CANVAS_CURSORS[tool] ?? 'default');

  return (
    <div
      ref={containerRef}
      className="canvas-bg"
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        cursor,
        zIndex: 1,
      }}
      onMouseDown={handleMouseDown}
    >
      {/* Canvas world */}
      <div
        style={{
          position: 'absolute',
          width: 0,
          height: 0,
          transformOrigin: '0 0',
          transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.scale})`,
          overflow: 'visible',
          pointerEvents: 'none',
          zIndex: 2,
        }}
      >
        <ConnectionsLayer />
        {nodes
          .slice()
          .sort((a, b) => a.zIndex - b.zIndex)
          .map(node => (
            <BaseNode key={node.id} node={node} />
          ))}
      </div>

      {/* Drawing layer (screen space) */}
      <DrawingLayer />
    </div>
  );
}
