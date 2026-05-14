import { useState } from 'react';
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

export default function TextNode({ node }: { node: CanvasNode }) {
  const updateNode = useCanvasStore(s => s.updateNode);
  const [editingTitle, setEditingTitle] = useState(false);

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
      <div
        className={`bg-gradient-to-r ${HEADER_COLOR[node.color]} px-3 py-2 flex items-center gap-2`}
        style={{ cursor: 'grab' }}
        onMouseDown={e => e.stopPropagation()}
      >
        <span className="text-white/40 text-xs">✦</span>
        {editingTitle ? (
          <input
            autoFocus
            className={`bg-transparent ${TEXT_COLOR[node.color]} text-sm font-semibold outline-none flex-1 min-w-0`}
            value={node.title}
            onChange={e => updateNode(node.id, { title: e.target.value })}
            onBlur={() => setEditingTitle(false)}
            onKeyDown={e => { if (e.key === 'Enter') setEditingTitle(false); }}
            onClick={e => e.stopPropagation()}
            onMouseDown={e => e.stopPropagation()}
          />
        ) : (
          <span
            className={`${TEXT_COLOR[node.color]} text-sm font-semibold truncate flex-1 cursor-text`}
            onDoubleClick={e => { e.stopPropagation(); setEditingTitle(true); }}
          >
            {node.title || 'Note'}
          </span>
        )}
      </div>

      {/* Body */}
      <textarea
        className="flex-1 bg-transparent text-white/80 text-sm p-3 resize-none outline-none scrollbar-none placeholder-white/20"
        placeholder="Write anything..."
        value={node.content ?? ''}
        onChange={e => updateNode(node.id, { content: e.target.value })}
        onClick={e => e.stopPropagation()}
        onMouseDown={e => e.stopPropagation()}
        style={{ lineHeight: 1.6 }}
      />
    </div>
  );
}
