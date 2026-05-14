import { useState, useRef } from 'react';
import { useCanvasStore } from '../../store/canvasStore';
import type { CanvasNode } from '../../types';

const HEADER_COLOR: Record<string, string> = {
  purple: 'from-purple-900/60 to-purple-800/20',
  blue:   'from-blue-900/60 to-blue-800/20',
  cyan:   'from-cyan-900/60 to-cyan-800/20',
  green:  'from-green-900/60 to-green-800/20',
  pink:   'from-pink-900/60 to-pink-800/20',
};

const TEXT_COLOR: Record<string, string> = {
  purple: 'text-purple-300',
  blue:   'text-blue-300',
  cyan:   'text-cyan-300',
  green:  'text-green-300',
  pink:   'text-pink-300',
};

const CHECK_COLOR: Record<string, string> = {
  purple: '#a78bfa',
  blue:   '#60a5fa',
  cyan:   '#22d3ee',
  green:  '#4ade80',
  pink:   '#f472b6',
};

export default function TodoNode({ node }: { node: CanvasNode }) {
  const updateNode = useCanvasStore(s => s.updateNode);
  const addTodo = useCanvasStore(s => s.addTodo);
  const toggleTodo = useCanvasStore(s => s.toggleTodo);
  const deleteTodo = useCanvasStore(s => s.deleteTodo);
  const [editingTitle, setEditingTitle] = useState(false);
  const [newText, setNewText] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const todos = node.todos ?? [];
  const done = todos.filter(t => t.done).length;

  const handleAdd = () => {
    if (newText.trim()) {
      addTodo(node.id, newText.trim());
      setNewText('');
    }
  };

  return (
    <div
      style={{
        borderRadius: 12,
        overflow: 'hidden',
        background: 'rgba(8, 11, 20, 0.85)',
        backdropFilter: 'blur(12px)',
        height: node.height,
        display: 'flex',
        flexDirection: 'column',
        userSelect: 'text',
      }}
      onMouseDown={e => e.stopPropagation()}
      onClick={e => e.stopPropagation()}
    >
      {/* Header */}
      <div className={`bg-gradient-to-r ${HEADER_COLOR[node.color]} px-3 py-2 flex items-center gap-2`}>
        <span className="text-white/40 text-xs">☰</span>
        {editingTitle ? (
          <input
            autoFocus
            className={`bg-transparent ${TEXT_COLOR[node.color]} text-sm font-semibold outline-none flex-1 min-w-0`}
            value={node.title}
            onChange={e => updateNode(node.id, { title: e.target.value })}
            onBlur={() => setEditingTitle(false)}
            onKeyDown={e => { if (e.key === 'Enter') setEditingTitle(false); }}
            onMouseDown={e => e.stopPropagation()}
          />
        ) : (
          <span
            className={`${TEXT_COLOR[node.color]} text-sm font-semibold truncate flex-1 cursor-text`}
            onDoubleClick={e => { e.stopPropagation(); setEditingTitle(true); }}
          >
            {node.title}
          </span>
        )}
        <span className="text-white/30 text-xs ml-auto shrink-0">{done}/{todos.length}</span>
      </div>

      {/* Todo list */}
      <div className="flex-1 overflow-y-auto scrollbar-none px-2 py-1.5">
        {todos.map(todo => (
          <div
            key={todo.id}
            className="flex items-center gap-2 group py-1 px-1 rounded hover:bg-white/5"
          >
            <button
              style={{
                width: 16,
                height: 16,
                borderRadius: 4,
                border: `2px solid ${CHECK_COLOR[node.color]}`,
                background: todo.done ? CHECK_COLOR[node.color] : 'transparent',
                flexShrink: 0,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              onClick={() => toggleTodo(node.id, todo.id)}
            >
              {todo.done && <span style={{ color: '#0a0a14', fontSize: 10, fontWeight: 'bold', lineHeight: 1 }}>✓</span>}
            </button>
            <span
              className={`text-sm flex-1 ${todo.done ? 'line-through text-white/30' : 'text-white/80'}`}
              style={{ wordBreak: 'break-word' }}
            >
              {todo.text}
            </span>
            <button
              className="opacity-0 group-hover:opacity-100 text-red-400/60 hover:text-red-400 text-xs px-1 shrink-0"
              onClick={() => deleteTodo(node.id, todo.id)}
            >
              ×
            </button>
          </div>
        ))}
      </div>

      {/* Add input */}
      <div className="px-2 pb-2 flex gap-1">
        <input
          ref={inputRef}
          className="flex-1 bg-white/5 rounded-lg px-2 py-1 text-sm text-white/80 outline-none placeholder-white/20 border border-white/10"
          placeholder="Add item..."
          value={newText}
          onChange={e => setNewText(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') handleAdd(); }}
          onMouseDown={e => e.stopPropagation()}
        />
        <button
          className="px-2 py-1 rounded-lg text-sm font-bold"
          style={{ background: CHECK_COLOR[node.color], color: '#0a0a14' }}
          onClick={handleAdd}
        >
          +
        </button>
      </div>
    </div>
  );
}
