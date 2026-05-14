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
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [deleteSelected]);

  // All canvas interactions via native pointer events + pointer capture
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const onPointerDown = (e: PointerEvent) => {
      if (e.button !== 0 && e.button !== 1) return;

      const target = e.target as HTMLElement;
      // Nodes handle their own interactions
      if (target.closest('.node-card')) return;

      const store = useCanvasStore.getState();
      const t = store.tool;

      // DrawingLayer handles draw/eraser
      if (t === 'draw' || t === 'eraser') return;

      // Connect: cancel on empty canvas click
      if (t === 'connect') {
        store.cancelConnecting();
        return;
      }

      // Text / todo / idea: place node on click
      if (t === 'text' || t === 'todo' || t === 'idea') {
        const rect = el.getBoundingClientRect();
        const cp = screenToCanvas(e.clientX - rect.left, e.clientY - rect.top);
        const sizes: Record<string, [number, number]> = {
          text: [280, 180], todo: [260, 220], idea: [220, 220],
        };
        const [w, h] = sizes[t];
        store.addNode(t as Parameters<typeof store.addNode>[0], cp.x - w / 2, cp.y - h / 2);
        store.setTool('select');
        return;
      }

      // Select: deselect on click; drag → pan
      if (t === 'select') {
        store.clearSelection();
        store.cancelConnecting();
      }

      // Pan (hand, space, middle-button, or select-drag on empty canvas)
      e.preventDefault();
      el.setPointerCapture(e.pointerId);

      let lastX = e.clientX;
      let lastY = e.clientY;

      const onMove = (ev: PointerEvent) => {
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
        el.removeEventListener('pointermove', onMove);
        el.removeEventListener('pointerup', onUp);
      };

      el.addEventListener('pointermove', onMove);
      el.addEventListener('pointerup', onUp);
    };

    el.addEventListener('pointerdown', onPointerDown);
    return () => el.removeEventListener('pointerdown', onPointerDown);
  }, [setViewport, screenToCanvas]);

  // Wheel zoom
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
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
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
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
    >
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
          .map(node => <BaseNode key={node.id} node={node} />)}
      </div>
      <DrawingLayer />
    </div>
  );
}
