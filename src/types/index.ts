export type NodeType = 'text' | 'todo' | 'idea';
export type Tool = 'select' | 'hand' | 'text' | 'todo' | 'idea' | 'draw' | 'connect' | 'eraser';
export type NodeColor = 'purple' | 'blue' | 'cyan' | 'green' | 'pink';

export interface TodoItem {
  id: string;
  text: string;
  done: boolean;
}

export interface CanvasNode {
  id: string;
  type: NodeType;
  x: number;
  y: number;
  width: number;
  height: number;
  title: string;
  content?: string;
  todos?: TodoItem[];
  color: NodeColor;
  zIndex: number;
}

export interface Connection {
  id: string;
  fromId: string;
  toId: string;
}

export interface DrawPath {
  id: string;
  points: [number, number][];
  color: string;
  width: number;
}

export interface Viewport {
  x: number;
  y: number;
  scale: number;
}
