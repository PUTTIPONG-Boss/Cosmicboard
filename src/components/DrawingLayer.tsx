import { useEffect, useRef, useCallback } from 'react';
import { useCanvasStore } from '../store/canvasStore';
import type { DrawPath } from '../types';

const genId = () => Math.random().toString(36).slice(2, 11);

export default function DrawingLayer() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawing = useRef(false);
  const currentPath = useRef<[number, number][]>([]);

  const tool = useCanvasStore(s => s.tool);
  const viewport = useCanvasStore(s => s.viewport);
  const drawPaths = useCanvasStore(s => s.drawPaths);
  const drawColor = useCanvasStore(s => s.drawColor);
  const drawWidth = useCanvasStore(s => s.drawWidth);
  const addDrawPath = useCanvasStore(s => s.addDrawPath);
  const eraseAt = useCanvasStore(s => s.eraseAt);

  const screenToCanvas = useCallback((sx: number, sy: number): [number, number] => {
    const vp = useCanvasStore.getState().viewport;
    return [(sx - vp.x) / vp.scale, (sy - vp.y) / vp.scale];
  }, []);

  const canvasToScreen = useCallback((cx: number, cy: number): [number, number] => {
    const vp = useCanvasStore.getState().viewport;
    return [cx * vp.scale + vp.x, cy * vp.scale + vp.y];
  }, []);

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const paths = useCanvasStore.getState().drawPaths;
    const vp = useCanvasStore.getState().viewport;

    for (const path of paths) {
      if (path.points.length < 2) continue;
      ctx.beginPath();
      ctx.strokeStyle = path.color;
      ctx.lineWidth = path.width * vp.scale;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.globalAlpha = 0.85;

      const [sx, sy] = canvasToScreen(path.points[0][0], path.points[0][1]);
      ctx.moveTo(sx, sy);
      for (let i = 1; i < path.points.length; i++) {
        const [px, py] = canvasToScreen(path.points[i][0], path.points[i][1]);
        ctx.lineTo(px, py);
      }
      ctx.stroke();
    }

    if (currentPath.current.length > 1) {
      const currentTool = useCanvasStore.getState().tool;
      const color = useCanvasStore.getState().drawColor;
      const width = useCanvasStore.getState().drawWidth;
      if (currentTool === 'draw') {
        ctx.beginPath();
        ctx.strokeStyle = color;
        ctx.lineWidth = width * vp.scale;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.globalAlpha = 0.85;
        const [sx, sy] = canvasToScreen(currentPath.current[0][0], currentPath.current[0][1]);
        ctx.moveTo(sx, sy);
        for (let i = 1; i < currentPath.current.length; i++) {
          const [px, py] = canvasToScreen(currentPath.current[i][0], currentPath.current[i][1]);
          ctx.lineTo(px, py);
        }
        ctx.stroke();
      }
    }
  }, [canvasToScreen]);

  useEffect(() => {
    render();
  }, [drawPaths, viewport, render]);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      render();
    };
    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, [render]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    const t = useCanvasStore.getState().tool;
    if (t !== 'draw' && t !== 'eraser') return;

    isDrawing.current = true;
    const [cx, cy] = screenToCanvas(e.clientX, e.clientY);
    currentPath.current = [[cx, cy]];

    const onMove = (ev: MouseEvent) => {
      if (!isDrawing.current) return;
      const currentTool = useCanvasStore.getState().tool;
      const [cx2, cy2] = screenToCanvas(ev.clientX, ev.clientY);
      if (currentTool === 'draw') {
        currentPath.current.push([cx2, cy2]);
        render();
      } else if (currentTool === 'eraser') {
        const vp = useCanvasStore.getState().viewport;
        eraseAt(cx2, cy2, 20 / vp.scale);
        render();
      }
    };

    const onUp = () => {
      if (!isDrawing.current) return;
      isDrawing.current = false;
      const currentTool = useCanvasStore.getState().tool;
      if (currentTool === 'draw' && currentPath.current.length > 1) {
        const color = useCanvasStore.getState().drawColor;
        const width = useCanvasStore.getState().drawWidth;
        const path: DrawPath = {
          id: genId(),
          points: [...currentPath.current] as [number, number][],
          color,
          width,
        };
        addDrawPath(path);
      }
      currentPath.current = [];
      render();
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }, [screenToCanvas, render, eraseAt, addDrawPath]);

  const isActive = tool === 'draw' || tool === 'eraser';

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 10,
        pointerEvents: isActive ? 'auto' : 'none',
        cursor: tool === 'eraser' ? 'cell' : tool === 'draw' ? 'crosshair' : 'default',
      }}
      onMouseDown={handleMouseDown}
    />
  );
}
