import { useState } from 'react';
import { useCanvasStore } from '../../store/canvasStore';
import type { CanvasNode } from '../../types';

const GLOW_COLOR: Record<string, string> = {
  purple: '#a78bfa',
  blue:   '#60a5fa',
  cyan:   '#22d3ee',
  green:  '#4ade80',
  pink:   '#f472b6',
};

const BG_COLOR: Record<string, string> = {
  purple: 'radial-gradient(circle at center, rgba(88,28,135,0.5) 0%, rgba(8,11,20,0.9) 70%)',
  blue:   'radial-gradient(circle at center, rgba(30,58,138,0.5) 0%, rgba(8,11,20,0.9) 70%)',
  cyan:   'radial-gradient(circle at center, rgba(8,70,92,0.5) 0%, rgba(8,11,20,0.9) 70%)',
  green:  'radial-gradient(circle at center, rgba(20,83,45,0.5) 0%, rgba(8,11,20,0.9) 70%)',
  pink:   'radial-gradient(circle at center, rgba(131,24,67,0.5) 0%, rgba(8,11,20,0.9) 70%)',
};

export default function IdeaNode({ node }: { node: CanvasNode }) {
  const updateNode = useCanvasStore(s => s.updateNode);
  const [editingTitle, setEditingTitle] = useState(false);
  const [editingContent, setEditingContent] = useState(false);

  const glowColor = GLOW_COLOR[node.color];
  const size = Math.min(node.width, node.height);

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: BG_COLOR[node.color],
        backdropFilter: 'blur(8px)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: 24,
        position: 'relative',
        overflow: 'hidden',
        userSelect: 'text',
      }}
      onMouseDown={e => e.stopPropagation()}
      onClick={e => e.stopPropagation()}
    >
      {/* Rotating ring */}
      <div
        style={{
          position: 'absolute',
          inset: 6,
          borderRadius: '50%',
          border: `1px solid ${glowColor}`,
          opacity: 0.3,
          animation: 'spin 20s linear infinite',
        }}
      />
      <div
        style={{
          position: 'absolute',
          inset: 12,
          borderRadius: '50%',
          border: `1px dashed ${glowColor}`,
          opacity: 0.2,
          animation: 'spin 30s linear infinite reverse',
        }}
      />

      {/* Center glow */}
      <div
        style={{
          position: 'absolute',
          width: 40,
          height: 40,
          borderRadius: '50%',
          background: glowColor,
          opacity: 0.15,
          filter: 'blur(20px)',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
        }}
      />

      {/* Star icon */}
      <span style={{ fontSize: 20, marginBottom: 6, filter: `drop-shadow(0 0 6px ${glowColor})` }}>✦</span>

      {/* Title */}
      {editingTitle ? (
        <input
          autoFocus
          className="bg-transparent text-center outline-none text-sm font-bold"
          style={{ color: glowColor, maxWidth: size - 60 }}
          value={node.title}
          onChange={e => updateNode(node.id, { title: e.target.value })}
          onBlur={() => setEditingTitle(false)}
          onKeyDown={e => { if (e.key === 'Enter') setEditingTitle(false); }}
          onMouseDown={e => e.stopPropagation()}
        />
      ) : (
        <span
          style={{ color: glowColor, fontWeight: 700, fontSize: 13, cursor: 'text', maxWidth: size - 60, wordBreak: 'break-word' }}
          onDoubleClick={e => { e.stopPropagation(); setEditingTitle(true); }}
        >
          {node.title}
        </span>
      )}

      {/* Content */}
      {editingContent ? (
        <textarea
          autoFocus
          className="bg-transparent text-center outline-none text-xs scrollbar-none resize-none"
          style={{ color: 'rgba(255,255,255,0.6)', maxWidth: size - 60, marginTop: 4, height: 40 }}
          value={node.content ?? ''}
          onChange={e => updateNode(node.id, { content: e.target.value })}
          onBlur={() => setEditingContent(false)}
          onMouseDown={e => e.stopPropagation()}
        />
      ) : (
        <p
          style={{
            color: 'rgba(255,255,255,0.5)',
            fontSize: 11,
            marginTop: 4,
            maxWidth: size - 60,
            wordBreak: 'break-word',
            cursor: 'text',
            lineHeight: 1.4,
          }}
          onDoubleClick={e => { e.stopPropagation(); setEditingContent(true); }}
        >
          {node.content || 'Double-click to add description'}
        </p>
      )}

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
