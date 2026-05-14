import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CanvasNode, Connection, DrawPath, Tool, Viewport, NodeType, NodeColor, TodoItem } from '../types';

const genId = () => Math.random().toString(36).slice(2, 11);

const COLORS: NodeColor[] = ['purple', 'blue', 'cyan', 'green', 'pink'];

const NODE_DEFAULTS: Record<NodeType, Partial<CanvasNode>> = {
  text:  { width: 280, height: 180, title: 'New Note' },
  todo:  { width: 260, height: 220, title: 'To-Do List' },
  idea:  { width: 220, height: 220, title: 'New Idea' },
};

interface CanvasStore {
  nodes: CanvasNode[];
  connections: Connection[];
  drawPaths: DrawPath[];
  viewport: Viewport;
  tool: Tool;
  selectedIds: string[];
  connectingFromId: string | null;
  connectingPreview: { x: number; y: number } | null;
  drawColor: string;
  drawWidth: number;
  maxZIndex: number;

  addNode: (type: NodeType, x: number, y: number) => string;
  updateNode: (id: string, changes: Partial<CanvasNode>) => void;
  deleteNode: (id: string) => void;
  deleteSelected: () => void;
  moveNode: (id: string, x: number, y: number) => void;
  duplicateNode: (id: string) => void;
  bringToFront: (id: string) => void;
  addTodo: (nodeId: string, text: string) => void;
  toggleTodo: (nodeId: string, todoId: string) => void;
  deleteTodo: (nodeId: string, todoId: string) => void;
  updateTodo: (nodeId: string, todoId: string, text: string) => void;

  addConnection: (fromId: string, toId: string) => void;
  deleteConnection: (id: string) => void;
  startConnecting: (fromId: string) => void;
  cancelConnecting: () => void;
  finishConnecting: (toId: string) => void;
  setConnectingPreview: (pos: { x: number; y: number } | null) => void;

  addDrawPath: (path: DrawPath) => void;
  eraseAt: (x: number, y: number, radius: number) => void;

  setViewport: (v: Viewport) => void;
  resetViewport: () => void;

  selectNode: (id: string, multi?: boolean) => void;
  clearSelection: () => void;

  setTool: (t: Tool) => void;
  setDrawColor: (c: string) => void;
  setDrawWidth: (w: number) => void;
}

export const useCanvasStore = create<CanvasStore>()(
  persist(
    (set, get) => ({
      nodes: [],
      connections: [],
      drawPaths: [],
      viewport: { x: 0, y: 0, scale: 1 },
      tool: 'select',
      selectedIds: [],
      connectingFromId: null,
      connectingPreview: null,
      drawColor: '#a78bfa',
      drawWidth: 3,
      maxZIndex: 0,

      addNode: (type, x, y) => {
        const id = genId();
        const defaults = NODE_DEFAULTS[type];
        const z = get().maxZIndex + 1;
        const color = COLORS[Math.floor(Math.random() * COLORS.length)];
        const node: CanvasNode = {
          id, type, x, y, color, zIndex: z,
          title: defaults.title!,
          width: defaults.width!,
          height: defaults.height!,
          ...(type === 'text' ? { content: '' } : {}),
          ...(type === 'todo' ? { todos: [] } : {}),
        };
        set(s => ({ nodes: [...s.nodes, node], maxZIndex: z, selectedIds: [id] }));
        return id;
      },

      updateNode: (id, changes) =>
        set(s => ({ nodes: s.nodes.map(n => n.id === id ? { ...n, ...changes } : n) })),

      deleteNode: (id) =>
        set(s => ({
          nodes: s.nodes.filter(n => n.id !== id),
          connections: s.connections.filter(c => c.fromId !== id && c.toId !== id),
          selectedIds: s.selectedIds.filter(sid => sid !== id),
        })),

      deleteSelected: () => {
        const ids = get().selectedIds;
        set(s => ({
          nodes: s.nodes.filter(n => !ids.includes(n.id)),
          connections: s.connections.filter(c => !ids.includes(c.fromId) && !ids.includes(c.toId)),
          selectedIds: [],
        }));
      },

      moveNode: (id, x, y) =>
        set(s => ({ nodes: s.nodes.map(n => n.id === id ? { ...n, x, y } : n) })),

      duplicateNode: (id) => {
        const node = get().nodes.find(n => n.id === id);
        if (!node) return;
        const newId = genId();
        const z = get().maxZIndex + 1;
        set(s => ({
          nodes: [...s.nodes, { ...node, id: newId, x: node.x + 30, y: node.y + 30, zIndex: z }],
          maxZIndex: z,
          selectedIds: [newId],
        }));
      },

      bringToFront: (id) => {
        const z = get().maxZIndex + 1;
        set(s => ({
          nodes: s.nodes.map(n => n.id === id ? { ...n, zIndex: z } : n),
          maxZIndex: z,
        }));
      },

      addTodo: (nodeId, text) => {
        const item: TodoItem = { id: genId(), text, done: false };
        set(s => ({
          nodes: s.nodes.map(n =>
            n.id === nodeId ? { ...n, todos: [...(n.todos ?? []), item] } : n
          ),
        }));
      },

      toggleTodo: (nodeId, todoId) =>
        set(s => ({
          nodes: s.nodes.map(n =>
            n.id === nodeId
              ? { ...n, todos: n.todos?.map(t => t.id === todoId ? { ...t, done: !t.done } : t) }
              : n
          ),
        })),

      deleteTodo: (nodeId, todoId) =>
        set(s => ({
          nodes: s.nodes.map(n =>
            n.id === nodeId ? { ...n, todos: n.todos?.filter(t => t.id !== todoId) } : n
          ),
        })),

      updateTodo: (nodeId, todoId, text) =>
        set(s => ({
          nodes: s.nodes.map(n =>
            n.id === nodeId
              ? { ...n, todos: n.todos?.map(t => t.id === todoId ? { ...t, text } : t) }
              : n
          ),
        })),

      addConnection: (fromId, toId) => {
        if (fromId === toId) return;
        const exists = get().connections.some(
          c => (c.fromId === fromId && c.toId === toId) || (c.fromId === toId && c.toId === fromId)
        );
        if (exists) return;
        set(s => ({ connections: [...s.connections, { id: genId(), fromId, toId }] }));
      },

      deleteConnection: (id) =>
        set(s => ({ connections: s.connections.filter(c => c.id !== id) })),

      startConnecting: (fromId) => set({ connectingFromId: fromId }),

      cancelConnecting: () => set({ connectingFromId: null, connectingPreview: null }),

      finishConnecting: (toId) => {
        const { connectingFromId } = get();
        if (connectingFromId && connectingFromId !== toId) {
          get().addConnection(connectingFromId, toId);
        }
        set({ connectingFromId: null, connectingPreview: null });
      },

      setConnectingPreview: (pos) => set({ connectingPreview: pos }),

      addDrawPath: (path) => set(s => ({ drawPaths: [...s.drawPaths, path] })),

      eraseAt: (x, y, radius) =>
        set(s => ({
          drawPaths: s.drawPaths.filter(p =>
            !p.points.some(([px, py]) => Math.hypot(px - x, py - y) < radius)
          ),
        })),

      setViewport: (v) => set({ viewport: v }),
      resetViewport: () => set({ viewport: { x: 0, y: 0, scale: 1 } }),

      selectNode: (id, multi = false) =>
        set(s => {
          if (multi) {
            const has = s.selectedIds.includes(id);
            return { selectedIds: has ? s.selectedIds.filter(i => i !== id) : [...s.selectedIds, id] };
          }
          return { selectedIds: [id] };
        }),

      clearSelection: () => set({ selectedIds: [] }),

      setTool: (t) => set({ tool: t, connectingFromId: null }),
      setDrawColor: (c) => set({ drawColor: c }),
      setDrawWidth: (w) => set({ drawWidth: w }),
    }),
    {
      name: 'cosmic-board',
      partialize: (s) => ({
        nodes: s.nodes,
        connections: s.connections,
        drawPaths: s.drawPaths,
        maxZIndex: s.maxZIndex,
      }),
    }
  )
);
